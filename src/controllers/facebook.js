const axios = require("axios");
const {
  textPostToFbPageFeed,
  singleImagePostToFbPageFeed,
  multipleImagePostToFbPageFeed,
  videoPostToFbPageFeed,
  reelPostToFbPageFeed,
  storyVideoToFbPageFeed,
  storyImageToFbPageFeed,
} = require("../services/facebookService");

/**
 * Retrieves a long-lived page access token from Facebook's Graph API.
 *
 * @param {string} longLivedUserToken - The long-lived user access token.
 * @param {string} pageId - The ID of the page.
 * @returns {Promise<string>} - The long-lived page access token.
 */
exports.getLongLivedPageToken = async (longLivedUserToken, pageId) => {
  // Construct the URL for the Graph API request.
  const url = `https://graph.facebook.com/${pageId}?fields=access_token&access_token=${longLivedUserToken}`;

  // Send a GET request to the Graph API and retrieve the page access token.
  const response = await axios.get(url);
  return response.data.access_token;
};

/**
 * Handles the success of the user's Facebook login.
 *
 * @param {Object} userData - The user data object containing the access token.
 * @returns {Promise<Array>} - An array of page data objects.
 */
exports.handleUserFacebookLoginSuccess = async (userData) => {
  try {
    // Get the access token from the user data.
    const accessToken = userData.accessToken;
    console.log(333333333, accessToken);

    // Fetch the user's Facebook pages data.
    const response = await axios.get(`https://graph.facebook.com/me/accounts`, {
      params: {
        access_token: accessToken,
        fields:
          "id,name,access_token,category,category_list,tasks,instagram_business_account",
      },
      headers: {
        Accept: "application/json",
      },
    });

    // The response.data contains an array of objects, each representing a page.
    const pagesData = response.data;

    // TODO: Handle saving the user data from here.
    // TODO: Save each page data to the database or any custom logic.

    // Return the array of page data.
    return pagesData.data;
  } catch (err) {
    console.log(err, "8888888888");
    // Log any errors that occur while handling the Facebook login.
    console.log("Error while handling facebook login", err);
  }
};

/**
 * Handles the request to post text to a Facebook page's feed.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - Return the response from the facebook API
 */
exports.textPostToPageFeed = async (req, res) => {
  try {
    // Extract the required parameters from the request body
    const { accessToken, pageId, postText } = req.body;

    // If any of the required parameters are missing, return a bad request response
    if (!accessToken || !pageId || !postText) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Post the text to the Facebook page's feed
    const facebookResponse = await textPostToFbPageFeed({
      accessToken,
      pageId,
      message: postText,
    });

    // Return the response data from the Facebook API
    res.status(200).json(facebookResponse);
  } catch (error) {
    // If an error occurs, return a server error response
    res.status(500).json({ error: error.message });
  }
};

/**
 * Handles the request to post a single image to a Facebook page's feed.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - Return the response from the Facebook API.
 */
exports.singleImagePostToPageFeed = async (req, res) => {
  try {
    // Extract the required parameters from the request body
    const { accessToken, pageId, imageUrl, caption } = req.body;

    // If any of the required parameters are missing, return a bad request response
    if (!accessToken || !pageId || !imageUrl) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Post the single image to the Facebook page's feed
    const facebookResponse = await singleImagePostToFbPageFeed({
      accessToken,
      pageId,
      imageUrl,
      caption,
    });

    // Return the response data from the Facebook API
    res.status(200).json(facebookResponse);
  } catch (error) {
    // If an error occurs, return a server error response
    res.status(500).json({ error: error.message });
  }
};

/**
 * Posts multiple images to a Facebook page's feed.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - Return the response from the facebook API.
 */
exports.multipleImagePostToPageFeed = async (req, res) => {
  try {
    // Extract the required parameters from the request body
    const { accessToken, pageId, imageUrls } = req.body;

    // If any of the required parameters are missing, return a bad request response
    if (!accessToken || !pageId || !imageUrls) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Post the multiple images to the Facebook page's feed
    const facebookResponse = await multipleImagePostToFbPageFeed({
      accessToken,
      pageId,
      imageUrls,
    });

    // Return the response data from the Facebook API
    res.status(200).json(facebookResponse);
  } catch (error) {
    // If an error occurs, return a server error response
    res.status(500).json({ error: error.message });
  }
};

/**
 * Handles the request to post a video to a Facebook page's feed.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - Return the response from the facebook API
 */
exports.videoPostToPageFeed = async (req, res) => {
  try {
    // Extract the required parameters from the request body
    const { accessToken, pageId, videoUrl, postText } = req.body;

    // If any of the required parameters are missing, return a bad request response
    if (!accessToken || !pageId || !videoUrl) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Post the video to the Facebook page's feed
    const facebookResponse = await videoPostToFbPageFeed({
      accessToken,
      pageId,
      videoUrl,
      description: postText, // The optional description for the video.
    });

    // Return the response data from the Facebook API
    res.status(200).json(facebookResponse);
  } catch (error) {
    // If an error occurs, return a server error response
    res.status(500).json({ error: error.message });
  }
};

/**
 * Handles the request to post a video to a Facebook page's feed.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - Return the response from the Facebook API
 */
exports.reelPostToPageFeed = async (req, res) => {
  try {
    // Extract the required parameters from the request body
    const { accessToken, pageId, videoUrl, postText } = req.body;

    // If any of the required parameters are missing, return a bad request response
    if (!accessToken || !pageId || !videoUrl) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Post the reels video to the Facebook page's feed
    // The description is an optional field for the video
    const facebookResponse = await reelPostToFbPageFeed({
      accessToken,
      pageId,
      videoUrl,
      description: postText,
    });

    // Return the response data from the Facebook API
    res.status(200).json(facebookResponse);
  } catch (error) {
    // If an error occurs, return a server error response
    res.status(500).json({ error: error.message });
  }
};

/**
 * Handles the request to post a story video to a Facebook page's feed.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - Return the response from the Facebook API
 */
exports.storyVideoToPageFeed = async (req, res) => {
  try {
    // Extract the required parameters from the request body
    const { accessToken, pageId, videoUrl } = req.body;

    // If any of the required parameters are missing, return a bad request response
    if (!accessToken || !pageId || !videoUrl) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Post the stroy video to the Facebook page's feed
    // The Facebook API expects the video to be uploaded first,
    // and then we can use the video ID to post the video to the page's feed.
    const facebookResponse = await storyVideoToFbPageFeed({
      accessToken,
      pageId,
      videoUrl,
    });

    // Return the response data from the Facebook API
    res.status(200).json(facebookResponse);
  } catch (error) {
    // If an error occurs, return a server error response
    res.status(500).json({ error: error.message });
  }
};

/**
 * Handles the request to post a story image to a Facebook page's feed.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - Return the response from the Facebook API
 */
exports.storyImageToPageFeed = async (req, res) => {
  try {
    // Extract the required parameters from the request body
    const { accessToken, pageId, imageUrl, caption } = req.body;

    // If any of the required parameters are missing, return a bad request response
    if (!accessToken || !pageId || !imageUrl) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Post the story image to the Facebook page's feed
    // The Facebook API expects the image to be uploaded first,
    // and then we can use the image ID to post the image to the page's feed.
    const facebookResponse = await storyImageToFbPageFeed({
      accessToken,
      pageId,
      imageUrl,
      caption,
    });

    // Return the response data from the Facebook API
    res.status(200).json(facebookResponse);
  } catch (error) {
    // If an error occurs, return a server error response
    res.status(500).json({ error: error.message });
  }
};
