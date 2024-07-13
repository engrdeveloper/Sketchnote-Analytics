const express = require("express");
const router = express.Router();
const passport = require("passport");
const { backendUrl, frontEndUrl } = require("../config");
const { handleUserFacebookLoginSuccess } = require("../controllers/facebook");
// Initiate the Facebook authentication process
router.get("/facebook", passport.authenticate("facebook"));

// Handle the callback from Facebook
// If authentication is successful, redirect to the main page
// If authentication fails, redirect to the login page
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: frontEndUrl + "/login",
  }),
  async (req, res) => {
    const pagesData = await handleUserFacebookLoginSuccess(req.user);
    res.send({ pagesData });
    // res.redirect(frontEndUrl + "/");
  }
);

// Initiate the twitter authentication process
router.get("/twitter", passport.authenticate("twitter"));

// Handle the callback from twitter
// If authentication is successful, redirect to the main page
// If authentication fails, redirect to the login page
router.get(
  "/twitter/callback",
  passport.authenticate("twitter"),
  (req, res) => {
    const profile = req.user;
    res.send({
      id: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      token: profile.token,
      tokenSecret: profile.tokenSecret,
    });
  }
);

module.exports = router;
