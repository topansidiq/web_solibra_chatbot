const { default: axios } = require("axios");

async function getOTP(userId, phoneNumber) {
  try {
    const { data } = await axios.post(
      `${process.env.LARAVEL_URL}/api/puks/otp/get`,
      { user_id: userId, phone_number: phoneNumber },
      {
        headers: {
          Authorization: `Bearer ${process.env.LARAVEL_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    return data;
  } catch (error) {
    console.error("getOTP failed:", error.response?.data || error.message);
    return null; // atau { error: true, message: "..."}
  }
}

async function sendOTP(userId, phoneNumber) {
  try {
    const { data } = await axios.post(
      `${process.env.LARAVEL_URL}/api/puks/wa/send-otp`,
      { user_id: userId, phone_number: phoneNumber },
      {
        headers: {
          Authorization: `Bearer ${process.env.LARAVEL_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    return data;
  } catch (error) {
    console.error("getOTP failed:", error.response?.data || error.message);
    return null; // atau { error: true, message: "..."}
  }
}

function markOTPVerified(code) {
  return new Promise((resolve, reject) => {
    db.query(
      "UPDATE otps SET verified = 1 WHERE code = ? AND expires_at > NOW() AND verified = 0",
      [code],
      (err, results) => {
        if (err) return reject(err);
        resolve(results.affectedRows > 0);
      }
    );
  });
}

module.exports = {
  getOTP,
  sendOTP,
};
