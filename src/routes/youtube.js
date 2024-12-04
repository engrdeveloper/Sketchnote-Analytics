const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const {
  googleClientId,
  googleClientSecret,
  googleRedirectUri,
} = require("../config");

// Initialize OAuth2Client with your credentials
const oauth2Client = new google.auth.OAuth2(
  googleClientId,
  googleClientSecret,
  googleRedirectUri
);

// YouTube Data API client
const youtube = google.youtube({
  version: "v3",
  auth: oauth2Client, // Set OAuth2Client as the auth client
});

// Generate a secure random state value.
const state = crypto.randomBytes(32).toString("hex");

// OAuth 2.0 authentication route
// http://localhost:4000/apis/youtube/auth
router.get("/auth", (req, res) => {
  // Generate URL for Google OAuth consent screen
  //  https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps#creatingclient
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline", // Request offline access
    scope: [
      // scopes https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps#identify-access-scopes
      "https://www.googleapis.com/auth/youtube.readonly", // Read YouTube account info
      "https://www.googleapis.com/auth/youtube.upload", // Upload videos to YouTube
    ],
    // Enable incremental authorization. Recommended as a best practice.
    include_granted_scopes: true,
    // Include the state parameter to reduce the risk of CSRF attacks.
    state: state,
    // Set the prompt parameter to "consent" to request consent from the user.
    prompt: "consent",
  });
  res.redirect(authUrl); // Redirect user to Google OAuth consent screen
});

// Function to save tokens securely
function saveTokens(tokens, channelINfo) {
  try {
    const tokenPath = path.resolve(__dirname, "../tokens.json");
    fs.writeFileSync(tokenPath, JSON.stringify(tokens));

    const channelInfoPath = path.resolve(__dirname, "../channelInfo.json");
    fs.writeFileSync(channelInfoPath, JSON.stringify(channelINfo));
  } catch (err) {
    console.error("Error saving tokens:", err.message);
  }
}

// OAuth 2.0 callback route after authentication
router.get("/auth/callback", async (req, res) => {
  const code = req.query.code; // Authorization code from Google OAuth consent screen
  try {
    // Exchange authorization code for tokens
    // Expiry of refresh token https://developers.google.com/identity/protocols/oauth2#expiration
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user's YouTube account information
    const response = await youtube.channels.list({
      part: "snippet,statistics",
      mine: true, // Fetch details of the authenticated user's channel
    });

    const channelInfo = response.data.items[0];

    const refreshToken = tokens.refresh_token;

    saveTokens(tokens, channelInfo);

    res.send({
      success: true,
      message: "User authenticated and YouTube channel information retrieved",
      refreshToken,
      tokens,
      channelInfo,
    });
  } catch (error) {
    console.error("Error exchanging code for tokens:", error.message);
    res.send({
      success: false,
      message: "Error exchanging code for tokens",
    });
  }
});
async function getFileSizeFromUrl(fileUrl) {
  try {
    // Perform a HEAD request to get headers only (no response body)
    const response = await axios.head(fileUrl);

    // check the response file type
    const contentType = response.headers["content-type"];

    // Get the file size from the 'Content-Length' header
    const fileSize = response.headers["content-length"];

    // Return the file size in bytes
    return { fileSize, mimeType: contentType };
  } catch (error) {
    console.error("Error getting file size from URL:", error.message);
    throw error; // Rethrow error if needed
  }
}

// Function to start resumable upload session
async function startResumableSession(
  accessToken,
  videoMetaData,
  fileSize,
  mimeType
) {
  console.log("Access Token", accessToken);

  const url =
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status";

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json; charset=UTF-8",
    "X-Upload-Content-Length": fileSize,
    "X-Upload-Content-Type": mimeType,
  };

  try {
    const response = await axios.post(url, videoMetaData, { headers });
    return response.headers.location;
  } catch (error) {
    console.error("Error starting resumable session:", error?.response?.data);
    throw error;
  }
}

// Function to upload the video in chunks
async function uploadVideoInChunks(
  accessToken,
  uploadUrl,
  videoUrl,
  fileSize,
  mimeType
) {
  try {
    console.log("Uploading video in chunks...");

    const chunkSize = 10 * 1024 * 1024; // 10MB per chunk and multiple of 256KB
    let startByte = 0;
    let endByte = Math.min(chunkSize - 1, fileSize - 1);

    console.log("Uploading video in chunks...");
    let videoId;

    // Loop through the video in chunks
    while (startByte < fileSize) {
      const chunk = await downloadChunk(videoUrl, startByte, endByte);
      console.log("Chunk Downloaded:", chunk);

      // Set the upload headers
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Length": chunk.length,
        "Content-Type": mimeType,
        "Content-Range": `bytes ${startByte}-${endByte}/${fileSize}`,
      };

      console.log("Uploading chunk from", startByte, "to", endByte);
      const uploadResponse = await axios.put(uploadUrl, chunk, { headers });

      console.log(
        `Uploaded chunk ${startByte} to ${endByte}, ${uploadResponse?.status}`
      );

      console.log("response", uploadResponse?.data);
      console.log("responsestatus", uploadResponse?.status);

      if (uploadResponse?.status === 200) {
        videoId = uploadResponse?.data?.id;
      }

      startByte = endByte + 1;
      endByte = Math.min(startByte + chunkSize - 1, fileSize - 1);
    }

    return videoId;
  } catch (error) {
    console.error("Error uploading video in chunks:", error.message);
    throw error;
  }
}

// Function to download a specific chunk of the video
async function downloadChunk(videoUrl, startByte, endByte) {
  try {
    console.log(`Downloading chunk from ${startByte} to ${endByte}`);
    const response = await axios.get(videoUrl, {
      responseType: "arraybuffer",
      headers: {
        Range: `bytes=${startByte}-${endByte}`,
      },
    });

    return response.data; // Return the chunk data (as a Buffer)
  } catch (error) {
    console.error(
      `Error downloading chunk from ${startByte} to ${endByte}:`,
      error.message
    );
    throw error;
  }
}

function loadTokens() {
  const tokenPath = path.resolve(__dirname, "../tokens.json");
  if (fs.existsSync(tokenPath)) {
    const tokens = JSON.parse(fs.readFileSync(tokenPath, "utf-8"));
    return tokens;
  }
  return null;
}

// Route to upload video
router.post("/upload", async (req, res) => {
  try {
    // check the body parameters
    const {
      videoPath,
      title,
      description,
      privacyStatus,
      madeForKids = false,
      scheduleDate,
      thumbnailUrl,
    } = req.body;

    // check for missing parameters
    if (!videoPath || !title || !description || !privacyStatus) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Checking the video parameters as per the link
    // https://developers.google.com/youtube/v3/docs/videos#resource

    // The video's title. The property value has a maximum length of 100 characters and may contain all valid UTF-8 characters except < and >.
    if (title.length > 100) {
      return res.status(400).json({ error: "Title too long" });
    }

    // check for <> characters
    if (title.includes("<") || title.includes(">")) {
      return res.status(400).json({ error: "Title contains <> characters" });
    }

    // The video's description. The property value has a maximum length of 1000 characters and may contain all valid UTF-8 characters except < and >.
    if (description.length > 1000) {
      return res.status(400).json({ error: "Description too long" });
    }

    // check for <> characters
    if (description.includes("<") || description.includes(">")) {
      return res
        .status(400)
        .json({ error: "Description contains <> characters" });
    }

    // check for invalid privacy status
    if (!["public", "private", "unlisted"].includes(privacyStatus)) {
      return res.status(400).json({
        error: "Invalid privacy status, Valid: public, private, unlisted",
      });
    }

    // check if thumbnail url is valid and its length is less then 2Mb
    if (thumbnailUrl) {
      try {
        const response = await axios.head(thumbnailUrl);
        const fileSize = response.headers["content-length"];
        // check if the file size is greater then 2MB
        // https://developers.google.com/youtube/v3/docs/thumbnails/set
        if (fileSize > 2 * 1024 * 1024) {
          return res.status(400).json({ error: "Thumbnail size too large" });
        }
      } catch (error) {
        return res.status(400).json({ error: "Invalid thumbnail URL" });
      }
    }

    const videoMetaData = {
      snippet: {
        title,
        description,
      },
      status: {
        privacyStatus,
        selfDeclaredMadeForKids: madeForKids,
      },
    };

    if (scheduleDate) {
      // check if the date is valid
      const date = new Date(scheduleDate);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }

      // check if the date is in the future
      if (date.getTime() < Date.now()) {
        return res.status(400).json({ error: "Past date not allowed" });
      }
      // convert the date to ISO format
      const isoFormatDate = date.toISOString();

      videoMetaData.status.publishAt = isoFormatDate;
    }

    // Load tokens and set credentials
    const tokens = loadTokens();
    if (tokens) {
      oauth2Client.setCredentials(tokens);
    } else {
      return console.error("No tokens found! Authenticate the user first.");
    }

    const accessToken = tokens.access_token;
    const { fileSize, mimeType } = await getFileSizeFromUrl(videoPath);

    const uploadUrl = await startResumableSession(
      accessToken,
      videoMetaData,
      fileSize,
      mimeType
    );
    console.log("Resumable Upload URL:", uploadUrl);

    let videoId;
    if (uploadUrl) {
      videoId = await uploadVideoInChunks(
        accessToken,
        uploadUrl,
        videoPath,
        fileSize,
        mimeType
      );
    }

    // Set the thumbnail
    if (thumbnailUrl) {
      await setYouTubeThumbnail(accessToken, videoId, thumbnailUrl);
    }

    res.status(200).json({
      message: "Video and thumbnail uploaded successfully",
      videoId,
    });
  } catch (error) {
    console.error("Error uploading video:", error.message);
    res.status(500).json({ error: "Failed to upload video" });
  }
});

async function setYouTubeThumbnail(accessToken, videoId, thumbnailUrl) {
  try {
    // Fetch the image from the URL
    const response = await axios.get(thumbnailUrl, { responseType: "stream" });

    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    // Set the thumbnail using YouTube API
    const youtubeResponse = await youtube.thumbnails.set({
      videoId: videoId,
      media: {
        body: response.data, // Send the image data as the body
      },
    });

    console.log("Thumbnail set successfully!", youtubeResponse.data);
  } catch (err) {
    console.error("Error setting thumbnail:", err.message);
  }
}

module.exports = router;
