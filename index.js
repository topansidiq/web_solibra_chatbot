require("dotenv").config();
const QR_CODE = require("qrcode-terminal");
const fs = require("fs");
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const axios = require("axios");
const fetch = require("node-fetch");
const express = require("express");
const bodyParser = require("body-parser");
const db = require("./db");
const util = require("./util");
const { getUserByPhoneNumber } = require("./src/controllers/UserController");
const messageRoutes = require("./src/routes/sendMessage");
const { getOTP } = require("./src/controllers/otpController");

// Chatbot
console.log("Chatbot Started!");

const app = express();
const client = new Client({
  puppeteer: {
    headless: true,
  },
  authStrategy: new LocalAuth({
    clientId: "admin-1",
  }),
});

client.on("authenticated", (session) => {
  console.info("AUTHENTICATED", session);
});

client.initialize();

client.on("qr", (qr) => {
  QR_CODE.generate(qr, { small: true });
});

client.on("ready", () => {
  console.info("BOT READY");
});

app.use(express.json());
app.use("/api", messageRoutes(client));

client.on("message", async (message) => {
  let phoneNumber = message.from.replace("@c.us", "");
  if (phoneNumber.startsWith("62")) {
    phoneNumber = "0" + phoneNumber.slice(2);
  }
  const user = await getUserByPhoneNumber(phoneNumber);

  if (message.body.toLocaleLowerCase === "otp") {
    await sleep(2000);
    await client.sendSeen(message.from);
    await sleep(4000);

    client.sendMessage(
      message.from,
      `[KODE:${message.body}] Permintaan dimengerti\n\nPermintaan OTP untuk verifikasi WhatsApp berhasil dikirimkan. Silakan menunggu beberapa saat!`
    );

    await sleep(8000);

    if (!user) {
      console.log(`Nomor ${phoneNumber} tidak terdaftar.`);
      return;
    }

    try {
      console.info("Nomor HP terdeteksi: " + user.phone_number);
      console.info(JSON.stringify(user));

      const otp = getOTP(phoneNumber, user.id);

      await client.sendMessage(
        message.from,
        `[OTP] Kode OTP Anda adalah: *${otp.code}*. Berlaku selama 15 menit.`
      );
      return;
    } catch (error) {
      console.error(error.message);
      if (error.response && error.response.status === 404) {
        client.sendMessage(
          message.from,
          "Nomor Anda tidak terdaftar di sistem."
        );
      } else {
        client.sendMessage(
          message.from,
          "Terjadi kesalahan saat memproses permintaan."
        );
      }
    }
  }

  if (/^\d{6}$/.test(message.body)) {
    const otpCode = message.body;
    await sleep(1000);
    console.log(`Menerima OTP: ${otpCode} dari ${phoneNumber}`);

    const success = await markOTPVerified(otpCode);
    await sleep(2000);

    console.log(`Verifikasi OTP status: ${success}`);

    if (success) {
      return client.sendMessage(
        message.from,
        "✅ OTP berhasil diverifikasi. Sekarang status keanggotaan anda menjadi aktif."
      );
    } else {
      return client.sendMessage(
        message.from,
        "❌ OTP salah atau sudah kadaluarsa."
      );
    }
  }

  // Default handler jika pesan bukan kode OTP 6 digit dan bukan "1"
  await sleep(4000);
  await client.sendSeen(message.from);
  await sleep(5000);

  return client.sendMessage(
    message.from,
    `[KODE:${message.body}] Permintaan tidak dimengerti`
  );
});
