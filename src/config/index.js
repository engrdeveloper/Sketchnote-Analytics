require("dotenv").config();

module.exports = {
  frontEndUrl: process.env.FRONT_END_URL,
  backendUrl: process.env.BACKEND_URL,
  port: process.env.PORT || 4000,
  facebookAppId: process.env.FACEBOOK_APP_ID,
  facebookAppSecret: process.env.FACEBOOK_APP_SECRET,
  twitterKey: process.env.TWITTER_KEY,
  twitterSecret: process.env.TWITTER_SECRET,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,
};
