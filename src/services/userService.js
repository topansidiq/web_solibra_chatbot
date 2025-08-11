const axios = require("axios");

async function getUserByPhoneNumber(phoneNumber) {
  try {
    const { data } = await axios.get(
      `${process.env.LARAVEL_URL}/api/puks/getUserByPhone`,
      {
        headers: {
          Authorization: `Bearer ${process.env.LARAVEL_TOKEN}`,
          Accept: "application/json",
        },
        params: { phone_number: phoneNumber },
      }
    );
    return data;
  } catch (error) {
    console.error(
      "getUserByPhoneNumber failed:",
      error.response?.data || error.message
    );
    return null; // atau { error: true, message: "..."}
  }
}

module.exports = {
  getUserByPhoneNumber,
};
