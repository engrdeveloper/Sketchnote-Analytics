const express = require("express");
const router = express.Router();

const facebookController = require("../controllers/facebook");
// POST /page/post-text - send text post at the page
router.post("/page/post-text", facebookController.textPostToPageFeed);

// POST /page/post-single-image - send single image post at the page
router.post(
  "/page/post-single-image",
  facebookController.singleImagePostToPageFeed
);

// POST /page/post-multiple-images - send multiple image post at the page
router.post(
  "/page/post-multiple-images",
  facebookController.multipleImagePostToPageFeed
);

// POST /page/post-video - send video post at the page
router.post("/page/post-video", facebookController.videoPostToPageFeed);

// POST /page/post-reel - send reel post at the page
router.post("/page/post-reel", facebookController.reelPostToPageFeed);

// POST /page/post-story - send story post at the page
router.post("/page/post-story-video", facebookController.storyVideoToPageFeed);

// POST /page/post-story-image - send story image post at the page
router.post("/page/post-story-image", facebookController.storyImageToPageFeed);

module.exports = router;
