const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

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

const multer = require("multer");
const { Readable } = require("stream");

const upload = multer(); // No disk storage

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
function saveTokens(tokens) {
  const tokenPath = path.resolve(__dirname, "../tokens.json");
  fs.writeFileSync(tokenPath, JSON.stringify(tokens));
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

    console.log("Refresh token:", refreshToken);

    saveTokens(tokens);

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

// Function to set the thumbnail for a video
async function setThumbnail(videoId, thumbnailPath) {
  try {
    const response = await youtube.thumbnails.set({
      videoId: videoId,
      media: {
        body: fs.createReadStream(thumbnailPath),
      },
    });

    console.log("Thumbnail set successfully!", response.data);
  } catch (err) {
    console.error("Error setting thumbnail:", err.message);
  }
}


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

const testing = async () => {
  try {
    // Load tokens and set credentials
    const tokens = loadTokens();
    if (tokens) {
      oauth2Client.setCredentials(tokens);
    } else {
      console.error("No tokens found! Authenticate the user first.");
    }
    const videoPath =
      "/home/sohaib/Desktop/Projects/sketchnotes/Sketchnote-Analytics/testing.mp4"; // Replace with the path to your video
    const videoId = await uploadVideo(
      videoPath,
      "The video's title. The property value has a maximum length of 100 characters and may contain all va ",
      "Sample Description Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Sample Description Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum. Sample Description Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Sample Description Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum. #testing #checkme",
      "unlisted", // Privacy: 'public', 'private', or '  ',
      false
    );

    console.log("Video uploaded successfully!", videoId);

    setThumbnail(
      videoId,
      "/home/sohaib/Desktop/Projects/sketchnotes/Sketchnote-Analytics/testing.png"
    );
  } catch (err) {
    console.error("Error:", err.message);
  }
};
// testing()

// Route to upload video
router.post(
  "/upload",
  upload.fields([{ name: "video" }, { name: "thumbnail" }]),
  async (req, res) => {
    try {
      // Load tokens and set credentials
      const tokens = loadTokens();
      if (tokens) {
        oauth2Client.setCredentials(tokens);
      } else {
        console.error("No tokens found! Authenticate the user first.");
      }
      const videoFile = req.files.video[0];
      const thumbnailFile = req.files.thumbnail[0];

      // Upload video
      const videoStream = Readable.from(videoFile.buffer);

      const videoDetails = {
        snippet: {
          title: "test",
          description: "sample direct uplaod",
        },
        status: {
          privacyStatus: "private",
          selfDeclaredMadeForKids: true,
        },
      };

      const fileSize = videoFile.buffer.length;

      const videoResponse = await youtube.videos.insert(
        {
          part: "snippet,status",
          requestBody: videoDetails,
          media: {
            body: videoStream,
          },
        },
        {
          maxBodyLength: Infinity, // Allow large files
          maxContentLength: Infinity, // Allow large files
          // This handles upload progress.
          onUploadProgress: (evt) => {
            const progress = (evt.bytesRead / fileSize) * 100;
            console.log(`${Math.round(progress)}% complete`);
          },
        }
      );

      const videoId = videoResponse.data.id;
      console.log(`Video uploaded successfully with ID: ${videoId}`);

      // Upload thumbnail
      const thumbnailStream = Readable.from(thumbnailFile.buffer);
      await youtube.thumbnails.set({
        videoId,
        media: {
          body: thumbnailStream,
        },
      });

      console.log("Thumbnail uploaded successfully");
      res.status(200).json({
        message: "Video and thumbnail uploaded successfully",
        videoId,
      });
    } catch (error) {
      console.error("Error uploading video:", error.message);
      res.status(500).json({ error: "Failed to upload video" });
    }
  }
);

module.exports = router;
