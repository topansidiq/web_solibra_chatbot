const express = require("express");

module.exports = function (client) {
  const router = express.Router();

  router.post("/api/send-message", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (token !== process.env.LARAVEL_TOKEN) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { phone_number, message } = req.body;

    if (!phone_number || !message) {
      return res.status(400).json({
        message: "phone_number and message are required",
      });
    }

    try {
      const chatId = phone_number.includes("@c.us")
        ? phone_number
        : `${phone_number}@c.us`;
      await client.sendMessage(chatId, message);

      return res.status(200).json({
        status: "Sent",
        to: phone_number,
        message,
      });
    } catch (err) {
      console.error("Error sending message: ", err);
      return res.status(500).json({
        message: "Failed to send message",
        error: err.message,
      });
    }
  });

  return router;
};
