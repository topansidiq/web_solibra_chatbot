require("dotenv").config();
const QR_CODE = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");
const express = require("express");
const util = require("./src/utils/util");
const { getUserByPhoneNumber } = require("./src/utils/userService");
const { getOTP, sendOTP } = require("./src/services/otpService");
const { extendBook, getAdmin, sendNotificationToAdmin } = require("./src/services/borrowService");
const { welcome, otp, wrongPrompt, notExistingUser, wrongPrompt2, activatedChatbot, notVerifyNumber, suspendedMember, extend, returned, messages } = require("./resource/message");
const { Helper } = require("./src/helper/helper");
const { logs, errors } = require("./resource/logging");
const { getUserState, setUserState, setPermanentUserState, getPermanentUserState } = require("./src/handlers/userStateHandler");

// Chatbot
console.log("Chatbot App Started!");

const app = express();
const client = new Client({
	puppeteer: { headless: true },
	authStrategy: new LocalAuth({ clientId: "admin-1" }),
});

client.on("authenticated", () => {
	console.info("AUTHENTICATED");
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
		const formattedNumber = Helper.formatPhoneTo62(phone_number);
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

const sessions = new Map();
sessions.set("session", 0);
/**
 * Handler message from user
 */
client.on("message", async (message) => {


	try {
		const phoneNumber = Helper.formatPhoneTo08(message.from.replace('@c.us', ''));
		const state = await getUserState(phoneNumber);
		const permanentState = await getPermanentUserState(phoneNumber);
		const input = message.body.toLowerCase().trim();

		let user;

		try {
			logs.checkingNumber(phoneNumber);
			await util.sleep(2000);
			user = await getUserByPhoneNumber(phoneNumber);
			if (!user) {
				await client.sendMessage(message.from, notExistingUser([phoneNumber, process.env.LARAVEL_URL]));
				return;
			}
			logs.isNumberExists([user, user.phone_number]);
		} catch (err) {
			errors.failToCheckingNumber([phoneNumber, err]);
			await client.sendMessage(message.from, "Gagal memproses nomor anda!");
			return;
		}

		const isOverdue = user.borrows.some(borrow => borrow.status === "overdue");

		// Mode melihat daftar perintah
		if (["/show", "show", "sow"].includes(input)) {
			return client.sendMessage(message.from, messages.show);
		}

		if (user.is_phone_verified === 1) {
			await setPermanentUserState(phoneNumber, 'verified');
		} else if (user.is_phone_verified === 0 && permanentState !== 'verified' && !['otp', 'return', 'extend'].includes(input)) {
			sessions.set("user", "unverified");

			if (sessions.get('user') === 'spam') {
				sessions.clear();
				return client.sendMessage(message.from, 'Perintah salah, ketik dan kirim *OTP*.')
			}
			if (sessions.get("session") == 0) {
				sessions.set('session', sessions.get('session') + 1);
				return client.sendMessage(message.from, messages.forUnverifiedUserAndUnverifiedNumber);
			}
			if (sessions.get("session") == 1) {
				sessions.set('session', sessions.get('session') + 1);
				return client.sendMessage(message.from, messages.forUnverifiedUserAndUnverifiedNumber2);
			}
			if (sessions.get("session") == 2) {
				sessions.set("session", 0);
				sessions.set("user", "spam");
				return client.sendMessage(message.from, messages.forUnverifiedUserAndUnverifiedNumber3);
			}

			return;
		}

		// Mode start bot
		if (['/bot', 'bot', 'bt', 'bpt'].includes(input)) {
			await setUserState(phoneNumber, 'welcome');
			return await client.sendMessage(message.from, String(welcome(user.name)));
		}


		// Tentang chatbot / /about
		if (['about', '/about', 'aboit', 'aboyt', 'anout'].includes(input)) {
			return client.sendMessage(message.from, messages.about);
		}

		if (state === 'welcome' || ['otp', 'return', 'extend'].includes(input)) {
			if (input === 'otp') {

				if (user.is_phone_verified === 1) {
					await setPermanentUserState(phoneNumber, 'verified');
					return client.sendMessage(message.from, messages.forVerifiedUser(message.body, user.name))
				}

				logs.messageFrom(phoneNumber);
				logs.prompt([message.body.toUpperCase(), phoneNumber]);

				await util.sleep(4000);
				await client.sendSeen(message.from);

				await util.sleep(4000);
				await client.sendMessage(message.from, String(otp().opening(message.body)));

				try {
					await util.sleep(8000);
					logs.createOTP(user.phone_number);
					const data = await getOTP(user.user_id, user.phone_number);

					if (!data) {
						logs.createOTPFail();
						return await client.sendMessage(message.from, String(otp().failure2()));
					}

					await util.sleep(4000);
					logs.createOTPSuccess([data.otp, phoneNumber]);
					logs.replayOTP([phoneNumber, JSON.stringify(data)]);

					await sendOTP(user.user_id, user.phone_number);
					await setUserState(phoneNumber, 'welcome');
				} catch (error) {
					await util.sleep(4000);
					errors.errorCreateOTP(error);
					await client.sendMessage(message.from, "Terjadi kesalahan saat memproses permintaan.");
				}

			} else if (input === "extend" && user.is_phone_verified != null && !isOverdue) {

				if (user.member_status === 'suspend') {
					await client.sendMessage(message.from, String(suspendedMember()));
					return;
				}

				await util.sleep(4000);
				await client.sendMessage(message.from, String(extend.opening(message.body)));

				await util.sleep(4000);
				await client.sendMessage(message.from, "Berikut ini adalah daftar peminjaman anda yang aktif!");

				await util.sleep(4000);
				if (user.borrows && user.borrows.length > 0) {
					let msg = "";

					user.borrows.forEach((borrow) => {
						const borrowedAtFormatted = new Date(borrow.borrowed_at).toLocaleString("id-ID", {
							day: "2-digit",
							month: "long",
							year: "numeric"
						});

						msg += `> Peminjaman ${borrow.id} - ${borrow.book.title} | ${borrowedAtFormatted} | Status: ${borrow.status}\n\n`;
					});

					await client.sendMessage(message.from, msg);

					await util.sleep(4000);
					await setUserState(phoneNumber, "extend_waiting");

					await util.sleep(2000);
					let admin;
					try {
						admin = await getAdmin();
					} catch (error) {
						console.error(error.message);
					}

					await util.sleep(2000);
					await sendNotificationToAdmin(admin.id, admin.phone_number);

					return await client.sendMessage(message.from, String(extend.selectBook));
				}
			} else if (isOverdue || input === "return") {
				await util.sleep(4000);
				await client.sendMessage(message.from, String(returned.opening));

				await util.sleep(4000);
				let msg = "";

				const overdueBorrows = user.borrows.filter(borrow => borrow.status === "overdue");

				overdueBorrows.forEach((borrow) => {
					const borrowedAtFormatted = new Date(borrow.borrowed_at).toLocaleString("id-ID", {
						day: "2-digit",
						month: "long",
						year: "numeric"
					});
					msg += `> Peminjaman ${borrow.id} - ${borrow.book.title} | ${borrowedAtFormatted} | Status: ${borrow.status}\n\n`;
				});

				await util.sleep(4000);
				await setUserState(phoneNumber, 'return_waiting');

				await client.sendMessage(message.from, msg);
				return await client.sendMessage(message.from, String(returned.selectBook));
			} else {
				return await client.sendMessage(message.from, String(welcome(user.name)));
			}
		}

		if (state === 'extend_waiting' || state === 'extend_fail' || user.member_status === 'active') {
			if (/^\d+$/.test(input)) {
				const borrowId = message.body;

				await util.sleep(4000);
				await client.sendMessage(message.from, String(extend.selectedBookToExtend(message.body)));

				await util.sleep(4000);
				await extendBook(Number(borrowId));
				await setUserState(phoneNumber, `extended_book_${borrowId}`);
			} else {
				await setUserState(phoneNumber, 'extend_fail');
				return await client.sendMessage(message.from, "Input salah atau id peminjaman tidak tersedia. Periksa daftar peminjaman anda dengan kirim /show_borrow atau /bot melihat daftar perintah yang tersedia");
			}
		}

		if (state === 'return_waiting') {
			if (/^\d+$/.test(message.body)) {
				await util.sleep(4000);
				await setUserState(phoneNumber, 'overdue_detected');
				return await client.sendMessage(message.from, String(returned.selectedBookToReturn(message.body)));
			}
		}
	} catch (e) {
		console.error("Error in message handler:", e);
		// Optionally send a fallback message here:
		// await client.sendMessage(message.from, "Terjadi kesalahan, silakan coba lagi.");
	}
});
