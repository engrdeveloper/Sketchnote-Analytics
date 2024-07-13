const {
  postImageToInstagramAccount,
  postCarouselToInstagramAccount,
  postVideoToInstagramAccount,
} = require("../services/instagramService");

/**
 * Handles the request to post an image to an Instagram account.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - Returns the response data from the Instagram API.
 */
exports.postImageToInstagram = async (req, res) => {
  try {
    // Extract the required parameters from the request body
    // accessToken: The access token for the user's Instagram account.
    // imageUrl: The URL of the image to be posted.
    // igUserId: The ID of the Instagram user.
    // caption: The optional caption for the image (default: "").
    const { accessToken, imageUrl, igUserId, caption = "" } = req.body;

    // If any of the required parameters are missing, return a bad request response
    if (!accessToken || !imageUrl || !igUserId) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Post the image to the Instagram account
    const instagramResponse = await postImageToInstagramAccount({
      igUserId,
      accessToken,
      imageUrl,
      caption,
    });

    // Return the response data from the Instagram API
    res.status(200).json(instagramResponse);
  } catch (error) {
    // If an error occurs, return a server error response
    res.status(500).json({ error: error.message });
  }
};

/**
 * Handles the request to post a carousel of images to an Instagram account.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - Returns the response data from the Instagram API.
 */
exports.postCarouselToInstagram = async (req, res) => {
  try {
    // Extract the required parameters from the request body
    // accessToken: The access token for the user's Instagram account.
    // igUserId: The ID of the Instagram user.
    // imageUrls: An array of URLs of the images to be posted.
    // caption: The optional caption for the carousel (default: "").
    const { accessToken, igUserId, imageUrls, caption = "" } = req.body;

    // If any of the required parameters are missing, return a bad request response
    if (!accessToken || !igUserId || !imageUrls || imageUrls.length === 0) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // If the number of images is greater than 10, return an error response
    if (imageUrls.length > 10) {
      return res.status(400).json({ error: "Maximum 10 images allowed" });
    }

    // Post the carousel of images to the Instagram account
    const instagramResponse = await postCarouselToInstagramAccount({
      igUserId,
      accessToken,
      mediaItems: imageUrls,
      caption,
    });

    // Return the response data from the Instagram API
    res.status(200).json(instagramResponse);
  } catch (error) {
    // If an error occurs, return a server error response
    console.error("Error posting carousel to Instagram:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Handles the request to post a video to an Instagram account.
 *
 * https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media/#reels-specs
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - Returns the response data from the Instagram API.
 */
exports.postVideoToInstagram = async (req, res) => {
  try {
    // Extract the required parameters from the request body
    const { accessToken, videoUrl, igUserId, caption = "" } = req.body;

    // If any of the required parameters are missing, return a bad request response
    if (!accessToken || !videoUrl || !igUserId) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Post the video to the Instagram account
    const instagramResponse = await postVideoToInstagramAccount({
      media_type: "REELS",
      igUserId,
      accessToken,
      videoUrl,
      caption,
    });

    // Return the response data from the Instagram API
    res.status(200).json(instagramResponse);
  } catch (error) {
    // If an error occurs, return a server error response
    res.status(500).json({ error: error.message });
  }
};

/**
 * Handles the request to post an image to Instagram's stories.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - Returns the response data from the Instagram API.
 */
exports.postStoryImageToInstagram = async (req, res) => {
  try {
    // Extract the required parameters from the request body
    // accessToken: The access token for the user's Instagram account.
    // imageUrl: The URL of the image to be posted.
    // igUserId: The ID of the Instagram user.
    const { accessToken, imageUrl, igUserId } = req.body;

    // If any of the required parameters are missing, return a bad request response
    if (!accessToken || !imageUrl || !igUserId) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Post the image to the Instagram account
    const instagramResponse = await postImageToInstagramAccount({
      igUserId,
      accessToken,
      imageUrl,
      mediaTypeStory: true,
    });

    // Return the response data from the Instagram API
    res.status(200).json(instagramResponse);
  } catch (error) {
    // If an error occurs, return a server error response
    res.status(500).json({ error: error.message });
  }
};

/**
 * Handles the request to post a video to Instagram's stories.
 *
 * https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media/#story-video-specifications
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - Returns the response data from the Instagram API.
 */
exports.postStoryVideoToInstagram = async (req, res) => {
  try {
    // Extract the required parameters from the request body
    const { accessToken, videoUrl, igUserId } = req.body;

    // If any of the required parameters are missing, return a bad request response
    if (!accessToken || !videoUrl || !igUserId) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Post the video to Instagram's stories
    const instagramResponse = await postVideoToInstagramAccount({
      media_type: "STORIES",
      igUserId,
      accessToken,
      videoUrl,
    });

    // Return the response data from the Instagram API
    res.status(200).json(instagramResponse);
  } catch (error) {
    // If an error occurs, return a server error response
    res.status(500).json({ error: error.message });
  }
};
