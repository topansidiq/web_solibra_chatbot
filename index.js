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

// Server
console.log("App start running");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Route
app.get("/", (req, res) => {
  res.send("Hello from chatbot + MySQL API!");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// Chatbot
console.log("Chatbot Started!");

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

client.on("message", async (message) => {
  let phoneNumber = message.from.replace("@c.us", "");
  if (phoneNumber.startsWith("62")) {
    phoneNumber = "0" + phoneNumber.slice(2);
  }
  const user = await getUserByPhoneNumber(phoneNumber);

  if (message.body === "1") {
    await sleep(2000);
    await client.sendSeen(message.from);
    await sleep(4000);

    client.sendMessage(
      message.from,
      `[KODE:${message.body}] Permintaan dimengerti\n\nPermintaan OTP untuk verifikasi WhatsApp berhasil dikirimkan. Silakan menunggu beberapa saat!`
    );

    await sleep(8000);

    if (!user) {
      console.log(`Nomor ${phoneNumber} tidak ditemukan dalam database.`);
      return;
    }

    await sleep(2000);
    const OTP = util.generateNumericOTP();
    const expires_at = util.getExpiryDateTime();
    const otp = await createOTP(user.id, user.phone_number, OTP, expires_at);
    await sleep(2000);

    try {
      console.info("Nomor HP terdeteksi: " + user.phone_number);
      console.info(JSON.stringify(user));

      if (!otp) {
        return client.sendMessage(
          message.from,
          "Gagal membuat OTP, coba beberapa saat lagi."
        );
      }

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

function getUserByPhoneNumber(phoneNumber) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM users WHERE phone_number = ?",
      [phoneNumber],
      (err, results) => {
        if (err) return reject(err);
        if (results.length === 0) return resolve(null);
        resolve(results[0]); // hanya ambil 1 user
      }
    );
  });
}
function createOTP(userId, phoneNumber, code, expires_at) {
  return new Promise((resolve, reject) => {
    db.query(
      "INSERT INTO otps (user_id, phone_number, code, expires_at) VALUES (?, ?, ?, ?)",
      [userId, phoneNumber, code, expires_at],
      (err, results) => {
        if (err) return reject(err);

        // Cek jika berhasil insert
        if (results.affectedRows > 0) {
          resolve({
            id: results.insertId,
            code,
            userId,
            expires_at,
          });
        } else {
          resolve(null);
        }
      }
    );
  });
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
