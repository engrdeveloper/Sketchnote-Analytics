const { GoogleAdsApi } = require("google-ads-api");
const {
  googleClientId,
  googleClientSecret,
  googleDeveloperToken,
} = require("../config");

const client = new GoogleAdsApi({
  client_id: googleClientId,
  client_secret: googleClientSecret,
  developer_token: googleDeveloperToken,
});

/**
 * Fetches all accessible Google Ads customers.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.body - The request body.
 * @param {string} req.body.customerRefreshToken - The customer's refresh token.
 * @param {Object} res - The response object.
 * @returns {Promise<Object>} - A promise that resolves to the response data.
 */
exports.fetchAllGoogleAdsCustomers = async (req, res) => {
  try {
    // Extract the customer refresh token from the request body.
    const { customerRefreshToken } = req.body;

    // Check if the customer refresh token is provided.
    if (!customerRefreshToken) {
      // If not, return a 400 Bad Request response.
      res.status(400).json({ message: "Customer Refresh Token is required" });
      return;
    }

    // Fetch all accessible Google Ads customers.
    const customers = await client.listAccessibleCustomers(
      customerRefreshToken
    );

    // Return the fetched customers in the response.
    res.json(customers);
  } catch (error) {
    // If an error occurs, return a 500 Internal Server Error response.
    res.status(500).json(error);
  }
};

/**
 * Fetches the details of a specific Google Ads customer.
 *
 * https://developers.google.com/google-ads/api/fields/v16/customer_query_builder
 * @param {Object} req - The request object.
 * @param {Object} req.body - The request body.
 * @param {string} req.body.customerId - The ID of the customer.
 * @param {string} req.body.customerRefreshToken - The refresh token of the customer.
 * @param {Object} res - The response object.
 * @returns {Promise<Object>} - A promise that resolves to the customer details.
 * @throws {Error} - If there is an error fetching the customer details.
 */
exports.fetchCustomerDetails = async (req, res) => {
  try {
    // Extract the customer ID and refresh token from the request body.
    const { customerId, customerRefreshToken } = req.body;

    // Check if both the customer ID and refresh token are provided.
    if (!customerId || !customerRefreshToken) {
      // If not, return a 400 Bad Request response.
      res
        .status(400)
        .json({ message: "Customer ID and Refresh Token are required" });
      return;
    }

    // Create a customer object using the provided customer ID and refresh token.
    const customer = client.Customer({
      customer_id: customerId,
      refresh_token: customerRefreshToken,
    });

    const accountDetails = await customer.query(
      `SELECT customer.id, customer.manager, customer.status,customer.resource_name, customer.descriptive_name FROM customer WHERE customer.id = ${customerId}`
    );
    res.json(accountDetails);
  } catch (error) {
    console.log(error);
    // If an error occurs, return a 500 Internal Server Error response.
    res.status(500).json(error);
  }
};

// https://developers.google.com/google-ads/api/fields/v16/campaign
const campaignCompulsoryMetrics = `
    metrics.all_conversions_value, metrics.all_conversions_from_click_to_call, 
    metrics.cost_per_all_conversions, metrics.value_per_all_conversions, 
    metrics.all_conversions, metrics.average_cost, metrics.average_cpm, 
    metrics.average_cpv, metrics.active_view_cpm, metrics.clicks, metrics.conversions, 
    metrics.conversions_value, metrics.cost_per_conversion, metrics.value_per_conversion, 
    metrics.cost_micros, metrics.ctr, metrics.content_impression_share, metrics.impressions, 
    metrics.content_rank_lost_impression_share, metrics.content_budget_lost_impression_share, 
    metrics.engagement_rate, metrics.engagements, metrics.gmail_secondary_clicks, 
    metrics.gmail_forwards, metrics.gmail_saves, metrics.top_impression_percentage, 
    metrics.absolute_top_impression_percentage, metrics.interaction_rate, metrics.interactions, 
    metrics.active_view_measurable_cost_micros, metrics.active_view_measurable_impressions, 
    metrics.average_page_views, metrics.phone_calls, metrics.phone_impressions, metrics.phone_through_rate, 
    metrics.search_absolute_top_impression_share, metrics.search_budget_lost_absolute_top_impression_share, 
    metrics.search_budget_lost_impression_share, metrics.search_budget_lost_top_impression_share, 
    metrics.search_top_impression_share, metrics.video_quartile_p100_rate, metrics.video_quartile_p25_rate, 
    metrics.video_quartile_p50_rate, metrics.video_quartile_p75_rate, metrics.video_view_rate, metrics.video_views
    `;

/**
 * Fetches all campaigns against a customer.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.body - The request body.
 * @param {string} req.body.customerRefreshToken - The customer's refresh token.
 * @param {string} req.body.customerId - The customer's ID.
 * @param {Object} res - The response object.
 * @returns {Promise<Object>} - A promise that resolves to the response data.
 */
exports.getAllCompaignsAgainstCustomer = async (req, res) => {
  try {
    // Extract the customer refresh token and ID from the request body.
    const { customerRefreshToken, customerId } = req.body;

    // Check if the customer refresh token is provided.
    if (!customerRefreshToken || !customerId) {
      // If not, return a 400 Bad Request response.
      res
        .status(400)
        .json({ message: "Customer Refresh Token and ID is required" });
      return;
    }

    // Create a customer object using the provided customer ID and refresh token.
    const customer = client.Customer({
      customer_id: customerId,
      refresh_token: customerRefreshToken,
    });

    // Fetch all campaigns against the customer.
    const campaigns = await customer.query(
      `SELECT ${campaignCompulsoryMetrics}, campaign.id, campaign.name FROM campaign`
    );

    // Return the fetched campaigns in the response.
    res.json(campaigns);
  } catch (error) {
    // If an error occurs, return a 500 Internal Server Error response.
    res.status(500).json(error);
  }
};

/**
 * Fetches metrics against a single campaign.
 *
 * https://developers.google.com/google-ads/api/fields/v16/campaign
 * @param {Object} req - The request object.
 * @param {Object} req.body - The request body.
 * @param {string} req.body.customerRefreshToken - The customer's refresh token.
 * @param {string} req.body.customerId - The customer's ID.
 * @param {string} req.body.campaignId - The campaign's ID.
 * @param {Object} res - The response object.
 * @returns {Promise<Object>} - A promise that resolves to the response data.
 */
exports.getMetricsAgainstSingleCompaign = async (req, res) => {
  try {
    const { customerRefreshToken, customerId, campaignId } = req.body;

    // Check if all required parameters are provided.
    if (!customerRefreshToken || !customerId || !campaignId) {
      // If not, return a 400 Bad Request response.
      res.status(400).json({
        message: "Customer Refresh Token, ID and Campaign ID is required",
      });
      return;
    }

    // Create a customer object using the provided customer ID and refresh token.
    const customer = client.Customer({
      customer_id: customerId,
      refresh_token: customerRefreshToken,
    });

    // Fetch metrics against the campaign.
    const metrics = await customer.query(
      `SELECT ${campaignCompulsoryMetrics}, campaign.id, campaign.name FROM campaign WHERE campaign.id = ${campaignId}`
    );

    // Return the fetched metrics in the response.
    res.json(metrics);
  } catch (error) {
    // If an error occurs, return a 500 Internal Server Error response.
    res.status(500).json(error);
  }
};

// https://developers.google.com/google-ads/api/fields/v16/ad_group
const adsGroupCompulsoryMetrics = `
    metrics.all_conversions_value, metrics.cost_per_all_conversions, metrics.value_per_all_conversions, 
    metrics.all_conversions, metrics.average_cost, metrics.average_cpm, metrics.average_cpv, 
    metrics.active_view_cpm, metrics.clicks, metrics.conversions, metrics.conversions_value, 
    metrics.cost_per_conversion, metrics.value_per_conversion, metrics.cost_micros, metrics.ctr, 
    metrics.content_impression_share, metrics.impressions, metrics.content_rank_lost_impression_share, 
    metrics.engagement_rate, metrics.engagements, metrics.gmail_secondary_clicks, metrics.gmail_forwards, 
    metrics.gmail_saves, metrics.top_impression_percentage, metrics.absolute_top_impression_percentage, 
    metrics.interaction_rate, metrics.interactions, metrics.active_view_measurable_cost_micros, 
    metrics.active_view_measurable_impressions, metrics.average_page_views, metrics.phone_calls, 
    metrics.phone_impressions, metrics.phone_through_rate, metrics.search_absolute_top_impression_share, 
    metrics.search_budget_lost_absolute_top_impression_share, metrics.search_budget_lost_top_impression_share, 
    metrics.search_top_impression_share, metrics.video_quartile_p100_rate, metrics.video_quartile_p25_rate, 
    metrics.video_quartile_p50_rate, metrics.video_quartile_p75_rate, metrics.video_view_rate, metrics.video_views
    `;

/**
 * Fetches all Ad Groups against a customer.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.body - The request body.
 * @param {string} req.body.customerRefreshToken - The customer's refresh token.
 * @param {string} req.body.customerId - The customer's ID.
 * @param {Object} res - The response object.
 * @returns {Promise<Object>} - A promise that resolves to the response data.
 */
exports.fetchAllAdsGroupsAgainstCustomer = async (req, res) => {
  try {
    // Extract the customer refresh token and ID from the request body.
    const { customerRefreshToken, customerId } = req.body;

    // Check if the customer refresh token and ID are provided.
    if (!customerRefreshToken || !customerId) {
      // If not, return a 400 Bad Request response.
      res
        .status(400)
        .json({ message: "Customer Refresh Token and ID is required" });
      return;
    }

    // Create a customer object using the provided customer ID and refresh token.
    const customer = client.Customer({
      customer_id: customerId,
      refresh_token: customerRefreshToken,
    });

    // Fetch all Ad Groups against the customer.
    const groups = await customer.query(
      `SELECT ${adsGroupCompulsoryMetrics}, ad_group.id, ad_group.name FROM ad_group WHERE customer.id = ${customerId}`
    );

    // Return the fetched Ad Groups in the response.
    res.json(groups);
  } catch (error) {
    // If an error occurs, return a 500 Internal Server Error response.
    res.status(500).json(error);
  }
};

/**
 * Fetches details of a single Ad Group against a customer.
 *
 * https://developers.google.com/google-ads/api/fields/v16/ad_group
 * @param {Object} req - The request object.
 * @param {Object} req.body - The request body.
 * @param {string} req.body.customerRefreshToken - The customer's refresh token.
 * @param {string} req.body.customerId - The customer's ID.
 * @param {string} req.body.adGroupId - The Ad Group's ID.
 * @param {Object} res - The response object.
 * @returns {Promise<Object>} - A promise that resolves to the response data.
 */
exports.fetchSingleAdsGroupDetails = async (req, res) => {
  try {
    // Extract the necessary parameters from the request body.
    const { customerRefreshToken, customerId, adGroupId } = req.body;

    // Check if all the required parameters are provided.
    if (!customerRefreshToken || !customerId || !adGroupId) {
      // If not, return a 400 Bad Request response.
      res.status(400).json({
        message:
          "Customer Refresh Token, Customer ID and Ad Group ID is required",
      });
      return;
    }

    // Create a customer object using the provided customer ID and refresh token.
    const customer = client.Customer({
      customer_id: customerId,
      refresh_token: customerRefreshToken,
    });

    // Fetch the details of the Ad Group.
    const groups = await customer.query(
      `SELECT ${adsGroupCompulsoryMetrics}, ad_group.id, ad_group.name FROM ad_group WHERE ad_group.id = ${adGroupId}`
    );

    // Return the fetched Ad Group details in the response.
    res.json(groups);
  } catch (error) {
    // If an error occurs, return a 500 Internal Server Error response.
    res.status(500).json(error);
  }
};

// https://developers.google.com/google-ads/api/fields/v16/ad_group_ad
const allAdsCompulsoryMtrics = `
    metrics.all_conversions_value, 
    metrics.cost_per_all_conversions, metrics.value_per_all_conversions, 
    metrics.all_conversions, metrics.average_cost, metrics.average_cpm, 
    metrics.average_cpv, metrics.active_view_cpm, metrics.clicks, metrics.conversions, 
    metrics.conversions_value, metrics.cost_per_conversion, metrics.value_per_conversion, 
    metrics.cost_micros, metrics.ctr, 
    metrics.engagement_rate, metrics.engagements, metrics.gmail_secondary_clicks, 
    metrics.gmail_forwards, metrics.gmail_saves, metrics.top_impression_percentage, 
    metrics.absolute_top_impression_percentage, metrics.interaction_rate, metrics.interactions, 
    metrics.active_view_measurable_cost_micros, metrics.active_view_measurable_impressions, 
    metrics.average_page_views, metrics.video_quartile_p100_rate, metrics.video_quartile_p25_rate, 
    metrics.video_quartile_p50_rate, metrics.video_quartile_p75_rate, metrics.video_view_rate, metrics.video_views
    `;

/**
 * Fetches all Ads against a customer.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.body - The request body.
 * @param {string} req.body.customerRefreshToken - The customer's refresh token.
 * @param {string} req.body.customerId - The customer's ID.
 * @param {Object} res - The response object.
 * @returns {Promise<Object>} - A promise that resolves to the response data.
 */
exports.fetchAllAdsAgainstCustomer = async (req, res) => {
  try {
    // Extract the necessary parameters from the request body.
    const { customerRefreshToken, customerId } = req.body;

    // Check if all the required parameters are provided.
    if (!customerRefreshToken || !customerId) {
      // If not, return a 400 Bad Request response.
      res
        .status(400)
        .json({ message: "Customer Refresh Token and ID is required" });
      return;
    }

    // Create a customer object using the provided customer ID and refresh token.
    const customer = client.Customer({
      customer_id: customerId,
      refresh_token: customerRefreshToken,
    });

    // Fetch all Ad Groups and their associated Ads against the customer.
    const groups = await customer.query(
      `SELECT ${allAdsCompulsoryMtrics}, ad_group_ad.ad.id, ad_group_ad.ad.name, ad_group.campaign, ad_group.id, ad_group.name, campaign.id, campaign.name FROM ad_group_ad WHERE customer.id = ${customerId}`
    );

    // Return the fetched Ads in the response.
    res.json(groups);
  } catch (error) {
    // If an error occurs, return a 500 Internal Server Error response.
    res.status(500).json(error);
  }
};

/**
 * Fetches an Ad against an Ad ID.
 *
 * https://developers.google.com/google-ads/api/fields/v16/ad_group_ad
 * @param {Object} req - The request object.
 * @param {Object} req.body - The request body.
 * @param {string} req.body.customerRefreshToken - The customer's refresh token.
 * @param {string} req.body.customerId - The customer's ID.
 * @param {string} req.body.adId - The Ad's ID.
 * @param {Object} res - The response object.
 * @returns {Promise<Object>} - A promise that resolves to the response data.
 */
exports.fetchAdAgainstAdId = async (req, res) => {
  try {
    // Extract the necessary parameters from the request body.
    const { customerRefreshToken, customerId, adId } = req.body;

    // Check if all the required parameters are provided.
    if (!customerRefreshToken || !customerId || !adId) {
      // If not, return a 400 Bad Request response.
      res.status(400).json({
        message: "Customer Refresh Token, Customer ID and Ad ID is required",
      });
      return;
    }

    // Create a customer object using the provided customer ID and refresh token.
    const customer = client.Customer({
      customer_id: customerId,
      refresh_token: customerRefreshToken,
    });

    // Fetch the Ad against the Ad ID.
    const query = `SELECT ${allAdsCompulsoryMtrics}, ad_group_ad.ad.id, ad_group_ad.ad.name, ad_group.campaign, ad_group.id, ad_group.name, campaign.id, campaign.name FROM ad_group_ad WHERE ad_group_ad.ad.id = ${adId}`;
    const groups = await customer.query(query);

    // Return the fetched Ad in the response.
    res.json(groups);
  } catch (error) {
    // If an error occurs, return a 500 Internal Server Error response.
    res.status(500).json(error);
  }
};
