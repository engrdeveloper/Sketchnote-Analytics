const axios = require("axios");
const FormData = require("form-data");

/**
 * Text Post To FB Page Feed
 *
 * Posts a text message to a Facebook page's feed.
 * @param {string} accessToken - The access token for the user's Facebook Page.
 * @param {string} pageId - The ID of the page to which the message will be posted.
 * @param {string} message - The message to be posted.
 * @returns {Object} - An object contain response data from the Facebook API.
 * @throws {Error} - If there is an error while posting to Facebook.
 */
const textPostToFbPageFeed = async ({ accessToken, pageId, message }) => {
  try {
    // Make a POST request to the Facebook Graph API to post a message to the page's feed.
    const response = await axios.post(
      `https://graph.facebook.com/${pageId}/feed`,
      {
        message,
        published: "false",
        scheduled_publish_time: "1720698128",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Return the response data from the Facebook API.
    return response.data;
  } catch (error) {
    console.log(error?.response, 999999999999);
    // Handle any errors that occur while posting to Facebook.
    // handleError(error);
  }
};

/**
 * Single Image Post To FB Page Feed
 *
 * Posts a single image message to a Facebook page's feed.
 * @param {string} accessToken - The access token for the user's Facebook Page.
 * @param {string} pageId - The ID of the page to which the message will be posted.
 * @param {string} imageUrl - The URL of the image to be posted.
 * @param {string} [caption] - The optional caption for the image.
 * @returns {Object} - An object contain response data from the Facebook API.
 * @throws {Error} - If there is an error while posting to Facebook.
 */
const singleImagePostToFbPageFeed = async ({
  accessToken,
  pageId,
  imageUrl,
  caption = "",
}) => {
  try {
    // Make a POST request to the Facebook Graph API to post a single image to the page's feed.
    const response = await uploadImageToFacebook(
      accessToken,
      pageId,
      imageUrl,
      caption,
      true
    );

    // Return the response data from the Facebook API.
    return response.data;
  } catch (error) {
    // Handle any errors that occur while posting to Facebook.
    handleError(error);
  }
};

/**
 * Handle Error
 *
 * Handles the error that occurs while posting to Facebook.
 * @param {Error} error - The error that occurred.
 * @throws {Error} - Throw the same error that occurred.
 */
const handleError = (error) => {
  console.log("Error while posting to facebook", error);
  throw new Error(error);
};

/**
 * Upload Image to Facebook
 *
 * Uploads an image to a Facebook page's feed.(https://developers.facebook.com/docs/graph-api/reference/page/photos#upload)
 * Photo Sepcification (Upto 4MB) https://developers.facebook.com/docs/graph-api/reference/page/photos#photo-specifications
 * @param {string} accessToken - The access token for the user's Facebook Page.
 * @param {string} pageId - The ID of the page to which the image will be posted.
 * @param {string} imageUrl - The URL of the image to be posted.
 * @param {string} [caption] - The optional caption for the image.
 * @param {boolean} [published=false] - The optional published status of the image.
 * @returns {Promise<Object>} - A promise that resolves to the response data from the Facebook API.
 * @throws {Error} - If there is an error while uploading the image.
 */
const uploadImageToFacebook = async (
  accessToken,
  pageId,
  imageUrl,
  caption = "",
  published = false
) => {
  // Make a POST request to the Facebook Graph API to upload an image to the page's feed.
  return axios.post(
    `https://graph.facebook.com/${pageId}/photos`,
    {
      url: imageUrl,
      caption,
      published,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
};

/**
 * Multiple Image Post To FB Page Feed
 *
 * Posts multiple images to a Facebook page's feed.
 * @param {string} [message=""] - The message to be posted.
 * @param {string} accessToken - The access token for the user's Facebook Page.
 * @param {string} pageId - The ID of the page to which the message will be posted.
 * @param {Array<string>} imageUrls - The URLs of the images to be posted.
 * @returns {Promise<Object>} - A promise that resolves to the response data from the Facebook API.
 * @throws {Error} - Throws an error if there is an error while posting to Facebook.
 */
const multipleImagePostToFbPageFeed = async ({
  message = "",
  accessToken,
  pageId,
  imageUrls,
}) => {
  try {
    // Get the image IDs for each image URL
    const imageIds = await Promise.all(
      imageUrls.map(async (imageUrl) => {
        // Make a POST request to get the image ID
        const response = await uploadImageToFacebook(
          accessToken,
          pageId,
          imageUrl
        );
        return response.data.id; // Return the image ID
      })
    );

    // Create an array of objects with the image IDs
    const attachedMedia = imageIds.map((id) => ({ media_fbid: id }));

    // Make a POST request to post the message and the attached media
    const response = await axios.post(
      `https://graph.facebook.com/${pageId}/feed`,
      {
        message,
        attached_media: attachedMedia,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Return the response data from the Facebook API.
    return response?.data;
  } catch (error) {
    // Handle any errors that occur while posting to Facebook.
    handleError(error);
  }
};

/**
 * Posts a video to a Facebook page's feed.
 *
 * @param {string} accessToken - The access token for the user's Facebook Page.
 * @param {string} pageId - The ID of the page to which the video will be posted.
 * @param {string} videoUrl - The URL of the video to be posted.
 * @param {string} [description=""] - The optional description for the video.
 * @returns {Object} - An object contain response data from the Facebook API.
 * @throws {Error} - Throws an error if there is an error while posting to Facebook.
 */
const videoPostToFbPageFeed = async ({
  accessToken,
  pageId,
  videoUrl,
  description = "",
}) => {
  try {
    // Create a FormData object to hold the video data
    let data = new FormData();
    data.append("access_token", accessToken); // Append the access token
    data.append("file_url", videoUrl); // Append the video URL
    data.append("description", description); // Append the description (if provided)

    // Set up the request configuration
    let config = {
      method: "post",
      url: `https://graph.facebook.com/${pageId}/videos`, // Construct the URL with the page ID
      data: data, // Set the FormData object as the request data
    };

    // Make the request to post the video to the Facebook Graph API
    const response = await axios.request(config);

    // Return the response data from the Facebook API.
    return response?.data;
  } catch (error) {
    // Handle any errors that occur while posting to Facebook.
    handleError(error);
  }
};

/**
 * Initilize Reel Upload Session
 *
 * Initializes an upload session for a video reel on a Facebook page. (https://developers.facebook.com/docs/video-api/guides/reels-publishing#step-1--initialize-an-upload-session)
 * @param {string} pageId - The ID of the Facebook page.
 * @param {string} pageAccessToken - The access token for the page.
 * @returns {Object} - An object to the response data from the Facebook API.
 * @throws {Error} - If there is an error initializing the upload session.
 */
const initializeReelUploadSession = async (pageId, pageAccessToken) => {
  try {
    // Make a POST request to initialize the upload session
    const response = await axios.post(
      `https://graph.facebook.com/v20.0/${pageId}/video_reels`,
      {
        upload_phase: "start",
        access_token: pageAccessToken,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Return the response data from the Facebook API.
    return response?.data;
  } catch (error) {
    // Handle any errors that occur while initializing the upload session.
    console.error("Error initializing upload session:", error?.response?.data);
    throw error;
  }
};

/**
 * Upload Reel Video From URL
 *
 * Method to Uploads a reel video from a URL to a Facebook page.(https://developers.facebook.com/docs/video-api/guides/reels-publishing#upload)
 * @param {string} uploadUrl - The URL for the upload session.
 * @param {string} videoUrl - The URL of the video to be uploaded.
 * @param {string} pageAccessToken - The access token for the page.
 * @returns {Object} - The response data from the Facebook API.
 * @throws {Error} - If there is an error while uploading the video.
 */
const uploadReelVideoFromURL = async (uploadUrl, videoUrl, pageAccessToken) => {
  try {
    // Set up the request configuration
    let config = {
      method: "post",
      url: uploadUrl,
      headers: {
        // Set the Authorization header with the page access token
        Authorization: `OAuth ${pageAccessToken}`,
        // Set the file_url header with the URL of the video to be uploaded
        file_url: videoUrl,
      },
    };

    // Make the request to upload the video
    const response = await axios.request(config);
    // Return the response data from the Facebook API.
    return response?.data;
  } catch (error) {
    // Handle any errors that occur while uploading the video.
    console.error("Error uploading video from URL:", error?.response?.data);
    throw error;
  }
};

/**
 * Reel Post To Fb Page Feed
 *
 * Method to Post a video reel to a Facebook page feed.(https://developers.facebook.com/docs/video-api/guides/reels-publishing#step-3--publish-the-reel)
 * @param {string} accessToken - The access token for the page.
 * @param {string} pageId - The ID of the Facebook page.
 * @param {string} videoUrl - The URL of the video to be posted.
 * @param {string} [description=""] - The description of the video reel.
 * @returns {Object} - The response data from the Facebook API.
 * @throws {Error} - If there is an error while posting the video reel.
 */
const reelPostToFbPageFeed = async ({
  accessToken,
  pageId,
  videoUrl,
  description = "",
}) => {
  try {
    // Initialize the upload session
    const uploadSession = await initializeReelUploadSession(
      pageId,
      accessToken
    );

    const uploadUrl = uploadSession.upload_url;
    const videoId = uploadSession.video_id;

    // Upload the video
    // Sample Video Link:https://videos.pexels.com/video-files/4812205/4812205-sd_360_640_30fps.mp4
    // Video specification should be like this: https://developers.facebook.com/docs/video-api/guides/reels-publishing/#requirements
    await uploadReelVideoFromURL(uploadUrl, videoUrl, accessToken);

    // Make a POST request to post the video to the Facebook Graph API
    const response = await axios.post(
      `https://graph.facebook.com/v20.0/${pageId}/video_reels`,
      {
        access_token: accessToken,
        video_id: videoId,
        upload_phase: "FINISH",
        video_state: "PUBLISHED",
        description: description,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Return the response data from the Facebook API.
    return response?.data;
  } catch (error) {
    // Handle any errors that occur while posting to Facebook.
    handleError(error);
  }
};

/**
 * Initialize Story Upload Session
 *
 * Initializes an upload session for a video story on a Facebook page. (https://developers.facebook.com/docs/page-stories-api/#initialize)
 *
 * @param {string} pageId - The ID of the Facebook page.
 * @param {string} pageAccessToken - The access token for the page.
 * @returns {Promise<Object>} - The response data from the Facebook API.
 * @throws {Error} - If there is an error initializing the upload session.
 */
const initializeStoryUploadSession = async (pageId, pageAccessToken) => {
  try {
    // Make a POST request to initialize the story upload session
    const response = await axios.post(
      `https://graph.facebook.com/v20.0/${pageId}/video_stories`,
      {
        upload_phase: "start",
        access_token: pageAccessToken,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Return the response data from the Facebook API.
    return response.data;
  } catch (error) {
    // Handle any errors that occur while initializing the upload session.
    console.error("Error initializing upload session:", error?.response?.data);
    throw error;
  }
};

/**
 * Upload Story Video From URL
 *
 * Uploads a video from a URL to a Facebook page's story.(https://developers.facebook.com/docs/page-stories-api/#step-2--upload-a-video)
 * Vide Specification- (https://developers.facebook.com/docs/page-stories-api/#media-requirements)
 * @param {string} uploadUrl - The URL for the upload session.
 * @param {string} videoUrl - The URL of the video to be uploaded.
 * @param {string} pageAccessToken - The access token for the page.
 * @returns {Promise<Object>} - The response data from the Facebook API.
 * @throws {Error} - If there is an error while uploading the video.
 */
const uploadStoryVideoFromURL = async (
  uploadUrl,
  videoUrl,
  pageAccessToken
) => {
  try {
    // Set up the request configuration
    let config = {
      method: "post",
      url: uploadUrl,
      headers: {
        // Set the Authorization header with the page access token
        Authorization: `OAuth ${pageAccessToken}`,
        // Set the file_url header with the URL of the video to be uploaded
        file_url: videoUrl,
      },
    };

    // Make the request to upload the video
    const response = await axios.request(config);

    // Return the response data from the Facebook API.
    return response.data;
  } catch (error) {
    // Handle any errors that occur while uploading the video.
    console.error("Error uploading video from URL:", error?.response?.data);
    throw error;
  }
};

/**
 * Story Video To Fb Page Feed
 *
 * Post a video story to a Facebook page feed.(https://developers.facebook.com/docs/page-stories-api/#step-3--publish-a-video-story)
 * Vide Specification- (https://developers.facebook.com/docs/page-stories-api/#media-requirements)
 * @param {string} accessToken - The access token for the page.
 * @param {string} pageId - The ID of the Facebook page.
 * @param {string} videoUrl - The URL of the video to be posted.
 * @returns {Promise<Object>} - The response data from the Facebook API.
 * @throws {Error} - If there is an error while posting the video story.
 */
const storyVideoToFbPageFeed = async ({ accessToken, pageId, videoUrl }) => {
  try {
    // Initialize the upload session
    const uploadSession = await initializeStoryUploadSession(
      pageId,
      accessToken
    );

    const uploadUrl = uploadSession.upload_url;
    const videoId = uploadSession.video_id;
    console.log({ uploadStoryVideoFromURL, videoId });

    // Upload the story video
    await uploadStoryVideoFromURL(uploadUrl, videoUrl, accessToken);

    // Make a POST request to post the video story to the Facebook Graph API
    const response = await axios.post(
      `https://graph.facebook.com/v20.0/${pageId}/video_stories`,
      {
        access_token: accessToken,
        video_id: videoId,
        upload_phase: "FINISH",
        video_state: "PUBLISHED",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Return the response data from the Facebook API.
    return response.data;
  } catch (error) {
    console.log(22222, error);
    // Handle any errors that occur while posting to Facebook.
    handleError(error);
  }
};

/**
 * Posts a single image story to a Facebook page's feed.
 *
 * @param {string} accessToken - The access token for the user's Facebook Page.
 * @param {string} pageId - The ID of the page to which the story will be posted.
 * @param {string} imageUrl - The URL of the image to be posted.
 * @param {string} [caption=""] - The optional caption for the image.
 * @returns {Promise<Object>} - A promise that resolves to the response data from the Facebook API.
 * @throws {Error} - If there is an error while posting to Facebook.
 */
const storyImageToFbPageFeed = async ({
  accessToken,
  pageId,
  imageUrl,
  caption = "",
}) => {
  try {
    // Make a POST request to the Facebook Graph API to post a single image to the page's feed.
    // The image is uploaded first, and then posted to the page's feed using the image ID.
    const response = await uploadImageToFacebook(
      accessToken,
      pageId,
      imageUrl,
      caption,
      false
    );
    const imageId = response.data.id;

    // Send image to story
    await axios.post(
      `https://graph.facebook.com/v20.0/${pageId}/photo_stories`,
      {
        access_token: accessToken,
        photo_id: imageId,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    // Return the response data from the Facebook API.
    return response.data;
  } catch (error) {
    // Handle any errors that occur while posting to Facebook.
    handleError(error);
  }
};

module.exports = {
  textPostToFbPageFeed,
  singleImagePostToFbPageFeed,
  multipleImagePostToFbPageFeed,
  videoPostToFbPageFeed,
  reelPostToFbPageFeed,
  storyVideoToFbPageFeed,
  storyImageToFbPageFeed,
};
