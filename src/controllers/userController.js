const axios = require("axios");

async function getUserByPhoneNumber(phoneNumber) {
  try {
    const { data } = await axios.get(
      `${process.env.LARAVEL_URL}/getUserByPhone`,
      {
        headers: {
          Authorization: `Bearer ${process.env.LARAVEL_TOKEN}`,
          Accept: "application/json",
        },
        params: {
          phone_number: phoneNumber,
        },
      }
    );
    return data; // sukses
  } catch (error) {
    if (error.response) {
      throw error.response.data; // error dari server
    } else {
      throw error.message; // error lain (misal koneksi)
    }
  }
}

module.exports = {
  getUserByPhoneNumber,
};
