require("dotenv").config();
const QR_CODE = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");
const express = require("express");
const util = require("./src/utils/util");
const { getUserByPhoneNumber } = require("./src/services/userService");
const { getOTP, sendOTP } = require("./src/services/otpService");
const { welcome, otp, wrongPrompt, notExistingUser, wrongPrompt2, activatedChatbot, notVerifyNumber, suspendedMember, extend, returned } = require("./resource/message");
const { Helper } = require("./src/helper/helper");
const { logs, errors } = require("./resource/logging");
const { extendBook, getAdmin, sendNotificationToAdmin } = require("./src/services/borrowService");
const { getUserState, setUserState } = require("./src/handlers/userStateHandler");

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

/**
 * Handler message from user
 */
client.on("message", async (message) => {
	const phoneNumber = Helper.formatPhoneTo08(message.from.replace('@c.us', ""));
	const state = await getUserState(phoneNumber)
	const input = message.body.toLowerCase().trim();

	let user;

	// Cek apakah nomor terdaftar di database dan masukkan ke variabel user
	try {
		logs.checkingNumber(phoneNumber);
		await util.sleep(2000);

		// Isi user dengan memanggil API dari Laravel
		user = await getUserByPhoneNumber(phoneNumber);

		// Jika nomor tidak terdaftar
		if (!user) {
			client.sendMessage(message.from, notExistingUser([phoneNumber, process.env.LARAVEL_URL]));
			return;
		}
		logs.isNumberExists([user, user.phone_number]);
	} catch (err) {
		errors.failToCheckingNumber([phoneNumber, err]);
		return client.sendMessage(message.from, "Gagal memproses nomor anda!");
	}

	// Jika user ada cek apakah ada peminjaman yang jatuh tempo
	let isOverdue = user.borrows.some(borrow => borrow.status === "overdue");

	// Bot mulai
	if (input === "/bot") {
		await setUserState(phoneNumber, 'welcome');
		return await client.sendMessage(message.from, welcome(user.name));
	}

	if (input === "/show") {
		return client.sendMessage(message.from, '> Daftar Perintah Chatbot\n\n> otp - Aktivasi Akun\n> extend - Perpanjangan Peminjaman\n> return - Pengembalian\n> /show - Melihat Daftar Perintah\n> /show_borrow - Melihat Daftar Peminjaman\n> /profile - Melihat Data Pengguna');
	}

	// Cek jika status pengirim pesan saat ini adalah pertama kali
	if (state === 'welcome' || state === "extend_witing" ) {

		// Jika isi pesan adalah otp
		if (input === 'otp') {
			logs.message(phoneNumber);
			logs.prompt([message.body.toUpperCase(), phoneNumber]);

			await util.sleep(4000);
			await client.sendSeen(message.from);

			await util.sleep(4000);
			client.sendMessage(message.from, otp().opening(message.body));

			// Buat OTP dan kirimkan
			try {
				await util.sleep(8000);
				logs.createOTP(user.phone_number);
				const data = await getOTP(user.user_id, user.phone_number);

				if (!data) {
					logs.createOTPFail();
					return client.sendMessage(message.from, otp().failure2());
				}

				await util.sleep(4000);
				logs.createOTPSuccess([data.otp, phoneNumber]);
				logs.replayOTP([phoneNumber, JSON.stringify(data)]);

				// Kirim OTP dengan memanggil API dari Laravel
				await sendOTP(user.user_id, user.phone_number);

				// Tetapkan status pengirim pesan saat ini
				await setUserState(phoneNumber, 'welcome');

			} catch (error) {
				await util.sleep(4000);
				errors.errorCreateOTP(error);
				client.sendMessage(message.from, "Terjadi kesalahan saat memproses permintaan.");
			}

		} else if (input === "extend" && user.is_phone_verified != null && !isOverdue) {

			/** Bagian ini adalah jika pesan masuk adalah extend dan
			 * nomor whatsapp telah terverifikasi 
			 * Cek terlebih dahulu apakah status pengguna berdasarkan
			 * data yang diperoleh dari cek user
			*/
			if (user.member_status == 'suspend') {
				client.sendMessage(message.from, suspendedMember());
				return;
			}

			// Jika melewati filter status suspend kirimkan pesan pembuka untuk perpanjangan buku
			await util.sleep(4000);
			client.sendMessage(message.from, extend.opening(message.body));

			// Kirimkan pesan berisi daftar peminjaman yang tersedia
			await util.sleep(4000);
			client.sendMessage(message.from, "Berikut ini adalah daftar peminjaman anda yang aktif!");

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

				client.sendMessage(message.from, msg);

				await util.sleep(4000);

				// Tetapkan status saat ini adalah menunggu konfirmasi perpanjangan
				await setUserState(phoneNumber, "extend_waiting");

				// Mengirim notifikasi kepada admin bahwa ada perpanjangan
				await util.sleep(2000);
				let admin;
				try {
					admin = await getAdmin();
				} catch (error) {
					console.error(error.message);
				}

				await util.sleep(2000);
				// await sendNotificationToAdmin(admin.id, admin.phone_number);

				// Balasa pesan user bahwa dia telah melakukan perpanjangan
				return client.sendMessage(message.from, extend.selectBook);

			}
		} else if (isOverdue || input === "return") {

			// Jika user tetap kirim return tetapi tidak ada buku yang overdue
			if (!isOverdue) {
				await setUserState('welcome');
				return client.sendMessage(message.from, 'Anda tidak memiliki buku yang jatuh tempo. Silahkan datang ke Perpustakaan Umum Kota Solok untuk melakukan pengembalian buku.');
			}

			/**
			 * Ini adalah bagian jika pesan masuk adalah return
			 */
			await util.sleep(4000);
			client.sendMessage(message.from, returned.opening);

			await util.sleep(4000);
			let msg = "";

			// Ambil daftar peminjaman yang jatuh tempo
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

			// Tetapkan status saat ini
			await setUserState(phoneNumber, 'return_waiting');

			// Kirimkan daftar peminjaman
			client.sendMessage(message.from, msg);
			return client.sendMessage(message.body, returned.selectBook);

		} else {
			return await client.sendMessage(message.from, welcome(user.name));
		}
	}

	// Jika status saat ini adalah menunggu konfirmasi perpanjangan
	if (state === 'extend_waiting' || state === 'extend_fail' || user.member_status === 'active') {
		if (/^\d+$/.test(input)) {

			const borrowId = message.body;

			await util.sleep(4000);
			client.sendMessage(message.from, extend.selectedBookToExtend(message.body));

			if (user.borrows.extend === 3) {
				await setUserState(phoneNumber, 'welcome');
				return client.sendMessage(message.from, "Anda telah mencapai batas perpanjangan sebanyak tiga(3) kali. Silahkan memerikan tanggal jatuh tempo. Terima kasih!");
			}

			await util.sleep(4000);
			await extendBook(Number(borrowId));
			await setUserState(phoneNumber, `welcome`);
		} else {
			await setUserState(phoneNumber, 'extend_fail');
			return client.sendMessage(message.from, "Input salah atau id peminjaman tidak tersedia. Periksa daftar peminjaman anda dengan kirim /show_borrow atau /bot melihat daftar perintah yang tersedia");
		}
	}

	// Jika status saaat ini adalah menunggu proses pengembalian
	if (state === 'return_waiting') {
		if (/^\d+$/.test(message.body)) {
			await util.sleep(4000);
			await setUserState(phoneNumber, 'overdue_detected');
			return client.sendMessage(message.from, returned.selectedBookToReturn(message.body));
		}
	}
});


