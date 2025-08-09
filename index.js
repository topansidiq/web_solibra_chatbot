require("dotenv").config();
const QR_CODE = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");
const express = require("express");
const util = require("./util");
const { getUserByPhoneNumber } = require("./src/controllers/UserController");
const { getOTP, sendOTP } = require("./src/controllers/otpController");
const { welcome } = require("./message/message");

// Chatbot
console.log("Chatbot App Started!");

const app = express();
const client = new Client({
	puppeteer: { headless: true },
	authStrategy: new LocalAuth({ clientId: "admin-1" }),
});

client.on("authenticated", (session) => {
	console.info("AUTHENTICATED", session);
});

client.on("qr", (qr) => {
	QR_CODE.generate(qr, { small: true });
});

client.on("ready", () => {
	console.info("BOT READY");
});

client.initialize();

app.use(express.json());

/**
 * Helper format number
 */
function formatPhoneTo62(phone) {
	let clean = phone.replace(/\D/g, "");
	if (clean.startsWith("0")) {
		clean = "62" + clean.substring(1);
	}
	return clean;
}

/**
 * Route for api send message
 */
app.post("/api/send-message", async (req, res) => {
	const token = req.headers.authorization?.split(" ")[1];
	if (token !== process.env.LARAVEL_TOKEN) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const { phone_number, message } = req.body;
	if (!phone_number || !message) {
		return res
			.status(400)
			.json({ message: "phone_number and message are required" });
	}

	try {
		const formattedNumber = formatPhoneTo62(phone_number);
		const chatId = `${formattedNumber}@c.us`;
		await client.sendMessage(chatId, message);

		return res.status(200).json({
			status: "Sent",
			to: formattedNumber,
			message,
		});
	} catch (err) {
		console.error("Error sending message: ", err);
		return res
			.status(500)
			.json({ message: "Failed to send message", error: err.message });
	}
});

app.listen(process.env.APP_PORT, () => {
	console.log(`Server running at http://localhost:${process.env.APP_PORT}`);
});

/**
 * Handler message from user
 */
client.on("message", async (message) => {
	try {

		let phoneNumber = message.from.replace("@c.us", "");
		if (phoneNumber.startsWith("62")) {
			phoneNumber = "0" + phoneNumber.slice(2);
		}

		let user;
		try {
			user = await getUserByPhoneNumber(phoneNumber);
		} catch (err) {
			console.error(err);
			return client.sendMessage(message.from, "Gagal memproses nomor anda!");
		}

		// Welcome message
		client.sendMessage(message.from, welcome([user.name]));

		if (message.body.toLowerCase() === "otp") {
			await util.sleep(2000);
			await client.sendSeen(message.from);
			await util.sleep(4000);

			client.sendMessage(
				message.from,
				`[KODE:${message.body}] Permintaan dimengerti\n\nPermintaan OTP untuk verifikasi WhatsApp berhasil dikirimkan. Silakan menunggu beberapa saat!`
			);

			await util.sleep(8000);

			if (!user) {
				console.log(`Nomor ${phoneNumber} tidak terdaftar.`);
				return;
			}

			try {
				console.info("Nomor HP terdeteksi: " + user.phone_number);
				const otp = await getOTP(user.user_id, user.phone_number);

				if (!otp) {
					return client.sendMessage(
						message.from,
						"Gagal membuat OTP. Coba lagi!"
					);
				}

				await sendOTP(user.user_id, message.from);

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

		// Default handler
		await util.sleep(4000);
		await client.sendSeen(message.from);
		await util.sleep(5000);
		return client.sendMessage(
			message.from,
			`[KODE:${message.body}] Permintaan tidak dimengerti`
		);
	} catch (error) {
		console.error(error);
	}
});
