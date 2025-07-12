import axios from "axios";

export const generateAccessToken = async (req, res, next) => {
  try {
    const consumerKey = process.env.CONSUMER_KEY;
    const consumerSecret = process.env.CONSUMER_SECRET;

    const credentials = Buffer.from(
      `${consumerKey}:${consumerSecret}`
    ).toString("base64");

    const response = await axios.get(
      "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      }
    );

    req.accessToken = response.data.access_token;

    next();
  } catch (e) {
    res.status(500).json({ message: "Error generating auth token", error: e });
  }
};