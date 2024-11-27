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
async function startResumableSession(fileSize, mimeType) {
  const tokens = loadTokens();

  if (tokens) {
    oauth2Client.setCredentials(tokens);
  } else {
    console.error("No tokens found! Authenticate the user first.");
  }

  // // Get user's YouTube account information
  // const response = await youtube.channels.list({
  //   part: "snippet,statistics",
  //   mine: true, // Fetch details of the authenticated user's channel
  // });

  // console.log("Channel Information", response.data.items);

  accessToken = oauth2Client.credentials.access_token;

  console.log("Access Token", accessToken);

  const url =
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status";

  const videoMetadata = {
    snippet: {
      title: "My Video Title for chunk uploading",
      description: "Description of the video for chunk uploading",
    },
    status: {
      privacyStatus: "private",
    },
  };

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json; charset=UTF-8",
    "X-Upload-Content-Length": fileSize,
    "X-Upload-Content-Type": mimeType,
  };

  try {
    const response = await axios.post(url, videoMetadata, { headers });
    return response.headers.location;
  } catch (error) {
    console.error(
      "Error starting resumable session:",
      error?.response?.data?.error
    );
  }
}

// Function to upload the video in chunks
async function uploadVideoInChunks(uploadUrl, videoUrl, fileSize, mimeType) {
  const chunkSize = 8 * 1024 * 1024; // 8MB per chunk and multiple of 256KB
  let startByte = 0;
  let endByte = Math.min(chunkSize - 1, fileSize - 1);

  console.log("Uploading video in chunks...");

  // Loop through the video in chunks
  while (startByte < fileSize) {
    const chunk = await downloadChunk(videoUrl, startByte, endByte);
    console.log("Chunk Downloaded:", chunk);

    const tokens = loadTokens();

    if (tokens) {
      oauth2Client.setCredentials(tokens);
    } else {
      console.error("No tokens found! Authenticate the user first.");
    }

    // Set the upload headers
    const headers = {
      Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
      "Content-Length": chunk.length,
      "Content-Type": mimeType,
      "Content-Range": `bytes ${startByte}-${endByte}/${fileSize}`,
    };

    try {
      console.log("Uploading chunk from", startByte, "to", endByte);
      const uploadResponse = await axios
        .put(uploadUrl, chunk, { headers })
        .catch((error) => {
          console.error("Error uploading chunk:");
        });
      console.log(
        `Uploaded chunk ${startByte} to ${endByte}, ${uploadResponse?.status}`
      );

      console.log("response", uploadResponse?.data);
      console.log("responsestatus", uploadResponse?.status);

      startByte = endByte + 1;
      endByte = Math.min(startByte + chunkSize - 1, fileSize - 1);
    } catch (error) {
      console.error("Error uploading chunk:", error);
      break;
    }
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

// Example usage
async function uploadLargeVideo(videoUrl) {
  const { fileSize, mimeType } = await getFileSizeFromUrl(videoUrl);
  console.log({ fileSize, mimeType });

  const uploadUrl = await startResumableSession(fileSize, mimeType);
  console.log("Resumable Upload URL:", uploadUrl);

  if (uploadUrl) {
    await uploadVideoInChunks(uploadUrl, videoUrl, fileSize, mimeType);
  }
}

// Example usage: Replace with your video URL:

// short size video: http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4
// uploadLargeVideo(
//   "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4"
// );

async function setThumbnail(videoId, thumbnailUrl) {
  try {
    // Fetch the image from the URL
    const response = await axios.get(thumbnailUrl, { responseType: "stream" });

    const tokens = loadTokens();
    if (tokens) {
      oauth2Client.setCredentials(tokens);
    } else {
      return console.error("No tokens found! Authenticate the user first.");
    }

    // Get user's YouTube account information
    const response1 = await youtube.channels.list({
      part: "snippet,statistics",
      mine: true, // Fetch details of the authenticated user's channel
    });

    console.log("Channel Information", response1.data.items);

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

// setThumbnail(
//   "XJ85VUBw21U",
//   "https://raw.githubusercontent.com/neutraltone/awesome-stock-resources/master/img/splash.jpg"
// );
// http://localhost:4000/apis/youtube/auth
async function uploadVideo(
  videoPath,
  title,
  description,
  privacyStatus,
  madeForKids = false
) {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 2);
  const isoFormat = date.toISOString();

  const videoDetails = {
    snippet: {
      title,
      description,
    },
    status: {
      privacyStatus,
      selfDeclaredMadeForKids: madeForKids,
      // publishAt: isoFormat,
    },
  };

  const fileSize = fs.statSync(videoPath).size;

  const response = await youtube.videos.insert(
    {
      part: "snippet,status",
      requestBody: videoDetails,
      media: {
        body: fs.createReadStream(videoPath),
      },
    },
    {
      // This handles upload progress.
      onUploadProgress: (evt) => {
        const progress = (evt.bytesRead / fileSize) * 100;
        console.log(`${Math.round(progress)}% complete`);
      },
    }
  );

  console.log("Upload successful! Video ID:", response.data.id);
  return response.data.id;
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
    // Load tokens and set credentials
    const tokens = loadTokens();
    if (tokens) {
      oauth2Client.setCredentials(tokens);
    } else {
      console.error("No tokens found! Authenticate the user first.");
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

module.exports = router;
