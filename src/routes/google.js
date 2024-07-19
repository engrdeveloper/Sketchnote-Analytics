const express = require("express");
const router = express.Router();
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const {
  googleClientId,
  googleClientSecret,
  googleRedirectUri,
} = require("../config");
const {
  fetchAllGoogleAdsCustomers,
  getAllCompaignsAgainstCustomer,
  getMetricsAgainstSingleCompaign,
  fetchAllAdsGroupsAgainstCustomer,
  fetchSingleAdsGroupDetails,
  fetchAllAdsAgainstCustomer,
} = require("../controllers/googleAdsApi");

// Initialize OAuth2Client with your credentials
const oauth2Client = new OAuth2Client({
  clientId: googleClientId,
  clientSecret: googleClientSecret,
  redirectUri: googleRedirectUri, // Redirect URI used in OAuth flow
});
// OAuth 2.0 authentication route
router.get("/auth", (req, res) => {
  // Generate URL for Google OAuth consent screen
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline", // Request offline access
    scope: ["profile", "email", "https://www.googleapis.com/auth/adwords"], // Scopes for Google APIs
  });
  res.redirect(authUrl); // Redirect user to Google OAuth consent screen
});

// OAuth 2.0 callback route after authentication
router.get("/auth/callback", async (req, res) => {
  const code = req.query.code; // Authorization code from Google OAuth consent screen
  try {
    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    console.log("Tokens", tokens);
    const refreshToken = tokens.refresh_token;
    console.log("Refresh token:", refreshToken);

    const userDaa = jwt.decode(tokens.id_token);
    // Store refreshToken securely in your database associated with the user profile
    // Redirect or perform further actions based on your application's flow
    res.send({
      success: true,
      message: "Tokens retrieved successfully",
      tokens,
      userDaa,
    });
  } catch (error) {
    console.error("Error exchanging code for tokens:", error.message);
    res.redirect("/login");
  }
});

// Fetch all customer google ads
router.get("/customers", fetchAllGoogleAdsCustomers);

// Fetch compaigns against customer
router.get("/customer/compaigns", getAllCompaignsAgainstCustomer);

// Fetch metrics against single compaign
router.get("/single-compaign-metrics", getMetricsAgainstSingleCompaign);

// Fetch all Ads Group
router.get("/ads-groups", fetchAllAdsGroupsAgainstCustomer);

// Fetch single Ads Group
router.get("/single-ads-group-metrics", fetchSingleAdsGroupDetails);

// Fetch all ads
router.get("/fetch-all-ads", fetchAllAdsAgainstCustomer);

module.exports = router;
