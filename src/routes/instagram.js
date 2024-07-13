const express = require("express");
const router = express.Router();

const instagramController = require("../controllers/instagram");

//  Link for whole documentation
// https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/content-publishing#content-publishing

// Link for sharing the media to Instagram
// https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media/

// POST /instagram/post-single-image - send image to instagram account
router.post("/post-single-image", instagramController.postImageToInstagram);

// POST /instagram/post-carousel - send carousel to instagram account
router.post("/post-carousel", instagramController.postCarouselToInstagram);

// POST /instagram/post-single-video - send video to instagram account
router.post("/post-single-video", instagramController.postVideoToInstagram);

// POST /instgram/post-story-image - send story image to instagram account
router.post("/post-story-image", instagramController.postStoryImageToInstagram);

// POST /instagram/post-story-video - send story video to instagram account
router.post("/post-story-video", instagramController.postStoryVideoToInstagram);

module.exports = router;
