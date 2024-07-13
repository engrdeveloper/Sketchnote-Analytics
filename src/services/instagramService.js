const axios = require("axios");

/**
 * Posts an image to an Instagram account.
 *
 * Posts an image to an Instagram account using the Instagram API.
 * https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/content-publishing#single-media-posts
 * @param {string} igUserId - The ID of the Instagram user.
 * @param {string} accessToken - The access token for the user's Instagram account.
 * @param {string} imageUrl - The URL of the image to be posted.
 * @param {string} [caption=""] - The optional caption for the image.
 * @returns {Promise<Object>} - A promise that resolves to the response data from the Instagram API.
 * @throws {Error} - If there is an error while posting to Instagram.
 */
exports.postImageToInstagramAccount = async ({
  igUserId,
  accessToken,
  imageUrl,
  caption = "",
  mediaTypeStory,
}) => {
  try {
    // Construct the URL for the API request to create container for image uploading
    let apiUrl =
      `https://graph.facebook.com/v20.0/${igUserId}/media?` +
      `image_url=${imageUrl}&caption=${caption}&access_token=${accessToken}`;

    // If mediaTypeStory is true, add the media_type=STORIES parameter
    if (mediaTypeStory) {
      apiUrl += `&media_type=STORIES`;
    }

    // Make a POST request to the Instagram API to post the image
    const { data } = await axios.post(apiUrl);
    // call the api to post to instagram account

    const { id } = data;
    const url = `https://graph.facebook.com/v20.0/${igUserId}/media_publish?creation_id=${id}&access_token=${accessToken}`;

    const response = await axios.post(url);

    // Return the response data from the Instagram API
    return response.data;
  } catch (error) {
    // If an error occurs, return a server error response
    return { error: error.message };
  }
};

/**
 * Posts images as a carousel to an Instagram account.
 *
 * @param {string} igUserId - The ID of the Instagram user.
 * @param {string} accessToken - The access token for the user's Instagram account.
 * @param {array} mediaItems - Array of media objects containing imageUrl or videoUrl.
 * @param {string} [caption=""] - The optional caption for the carousel.
 * @returns {Promise<Object>} - A promise that resolves to the response data from the Instagram API.
 * @throws {Error} - If there is an error while posting to Instagram.
 */
exports.postCarouselToInstagramAccount = async ({
  igUserId,
  accessToken,
  mediaItems,
  caption = "",
}) => {
  try {
    // Step 1: Create carousel items
    const itemIds = [];
    for (const media of mediaItems) {
      const url = `https://graph.facebook.com/v20.0/${igUserId}/media`;
      let params = {
        is_carousel_item: true,
        access_token: accessToken,
      };
      let data;
      if (media.type === "image") {
        params = {
          ...params,
          image_url: media.imageUrl,
          media_type: "IMAGE",
        };

        const imageUploadResponse = await axios.post(url, null, { params });
        console.log("url", media.imageUrl);

        data = imageUploadResponse?.data;
      } else if (media.type === "video") {
        console.log("url", media.videoUrl);
        data = await initializeUploadVideoToIg(
          igUserId,
          accessToken,
          "REELS",
          false,
          true
        );
        await uploadVideoFromURL(data?.uri, media.videoUrl, accessToken);
      }

      // check media sstatus
      const mediaStatus = await checkUploadedmediaStatus(data.id, accessToken);
      console.log("mediaStatus", mediaStatus);

      // Add the item ID to the itemIds array
      itemIds.push(data.id);
    }

    // Step 2: Create carousel container
    const carouselApiUrl =
      `https://graph.facebook.com/v20.0/${igUserId}/media?` +
      `caption=${encodeURIComponent(
        caption
      )}&media_type=CAROUSEL&children=${encodeURIComponent(
        itemIds
      )}&access_token=${accessToken}`;

    const { data: carouselData } = await axios.post(carouselApiUrl);
    const creationId = carouselData.id;

    // Step 3: Publish carousel
    const publishUrl =
      `https://graph.facebook.com/v20.0/${igUserId}/media_publish?` +
      `creation_id=${creationId}&access_token=${accessToken}`;

    const { data: publishData } = await axios.post(publishUrl);

    return publishData;
  } catch (error) {
    console.error("Error posting carousel to Instagram:", error?.response);
    throw new Error("Failed to post carousel to Instagram");
  }
};

/**
 * Fetches the status of a media item uploaded to Instagram.
 *
 * @param {string} mediaId - The ID of the media item.
 * @param {string} accessToken - The access token for the user's Instagram account.
 * @returns {Promise<Object>} - A promise that resolves to the response data from the Instagram API.
 * @throws {Error} - If there is an error while fetching the media status.
 */
const checkUploadedmediaStatus = async (mediaId, accessToken) => {
  try {
    // Make a GET request to fetch the status of the media item
    const response = await axios.get(
      `https://graph.facebook.com/v20.0/${mediaId}?fields=status_code,status&access_token=${accessToken}`
    );

    // Return the response data from the Instagram API.
    return response.data;
  } catch (error) {
    // If an error occurs, throw an error.
    throw new Error(error);
  }
};

/**
 * Initializes the upload of a video to Instagram.
 *
 * Posts a request to the Instagram Graph API to create a container for uploading a video.
 * https://developers.facebook.com/docs/instagram-api/reference/media#uploading-a-video
 * @param {string} igUserId - The ID of the Instagram user.
 * @param {string} accessToken - The access token for the user's Instagram account.
 * @param {string} media_type - The type of media to be uploaded (e.g. "REELS", "FEED", etc.).
 * @param {string} [caption=""] - The optional caption for the video.
 * @param {boolean} [is_carousel_item=false] - Whether the video is part of a carousel or not.
 * @returns {Promise<Object>} - A promise that resolves to the response data from the Instagram API.
 * @throws {Error} - If there is an error while initializing the video upload.
 */
const initializeUploadVideoToIg = async (
  igUserId,
  accessToken,
  media_type,
  caption = "",
  is_carousel_item = false
) => {
  const url = `https://graph.facebook.com/v20.0/${igUserId}/media`;
  const params = {
    access_token: accessToken,
    media_type,
    is_carousel_item,
    caption,
    upload_type: "resumable",
  };
  try {
    const response = await axios.post(url, null, { params });
    return response.data;
  } catch (error) {
    throw new Error(error);
  }
};
/**
 * Uploads a video from a URL to Instagram using the Instagram Graph API.
 *
 * @param {string} uploadUrl - The URL for the upload session.
 * @param {string} videoUrl - The URL of the video to be uploaded.
 * @param {string} pageAccessToken - The access token for the page.
 * @returns {Promise<Object>} - The response data from the Instagram API.
 * @throws {Error} - If there is an error while uploading the video.
 */
const uploadVideoFromURL = async (uploadUrl, videoUrl, pageAccessToken) => {
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

    // Return the response data from the Instagram API.
    return response?.data;
  } catch (error) {
    // Handle any errors that occur while uploading the video.
    console.error("Error uploading video from URL:", error);
    throw error;
  }
};

/**
 * Posts a video to an Instagram account using the Instagram Graph API.
 *
 * @param {Object} params - The parameters for posting the video.
 * @param {string} params.igUserId - The ID of the Instagram user.
 * @param {string} params.accessToken - The access token for the user's Instagram account.
 * @param {string} params.videoUrl - The URL of the video to be posted.
 * @param {string} [params.caption=""] - The optional caption for the video.
 * @returns {Promise<Object>} - The response data from the Instagram API.
 * @throws {Error} - If there is an error while posting the video.
 */
exports.postVideoToInstagramAccount = async ({
  media_type = "REELS",
  igUserId,
  accessToken,
  videoUrl,
  caption = "",
}) => {
  try {
    // Initialize the video upload session
    const data = await initializeUploadVideoToIg(
      igUserId,
      accessToken,
      media_type,
      caption,
      false
    );

    console.log("Initialized Upload", data);

    // Upload the video from the provided URL
    await uploadVideoFromURL(data.uri, videoUrl, accessToken);

    console.log("Video Uploaded Successfully");

    const { id } = data;

    // check media sstatus
    const mediaStatus = await checkUploadedmediaStatus(id, accessToken);
    console.log("mediaStatus", mediaStatus);

    // Call the API to publish the video
    const url = `https://graph.facebook.com/v20.0/${igUserId}/media_publish?creation_id=${id}&access_token=${accessToken}`;

    const response = await axios.post(url);

    // Return the response data from the Instagram API
    return response.data;
  } catch (error) {
    // If an error occurs, return a server error response
    return { error: error.message };
  }
};
