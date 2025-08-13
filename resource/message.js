module.exports = {
    welcome: (param) => {
        return `> Layanan Chatbot Perpustakaan Umum Kota Solok\n\nSelamat datang ${param}. Ini adalah Layanan Chatbot Perpustakaan Umum Kota Solok.\nBerikut ini adalah daftar perintah yang bisa anda gunakan.\n\n- Layanan Aktivasi Nomor WhatsApp (OTP)\n- Layanan Perpanjangan Peminjaman\n- Layanan Pengembalian Peminjaman\n\nUntuk mengaktifkan layanan silahkan mengirim sesuai kode/kata kunci di bawah:\n\n> *OTP* untuk Layanan Aktivasi Nomor WhatsApp\n> *EXTEND* untuk Perpanjangan Peminjaman\n> *RETURN* untuk Pengembalian Peminjaman\n> */show* untuk melihat daftar perintah\n_Note: Harap tidak membalas selain dari kata kunci diatas._\n\n> *Perpustakaan Umum Kota Solok*`
    },
    wrongPrompt: (params) => {
        return `> Layanan Chatbot Perpustakaan Umum Kota Solok\n> Kirim /bot untuk mengaktifkan\n\nSelamat datang ${params[0]}. Kami telah mendeteksi bahwa nomor anda terdaftar di Perpustakaan Umum Kota Solok. Perintah ini (*${params[1]}*) tidak benar\n\n> OTP - untuk Aktivasi\n> EXTEND - untuk Perpanjang\n> RETURN - untuk Pengembalian`;
    },
    wrongPrompt2: (param) => {
        return `[${param}] Tidak dimengerti\n\n> OTP - untuk Aktivasi\n> EXTEND - untuk Perpanjang\n> RETURN - untuk Pengembalian`;
    },
    notExistingUser: (params) => {
        return `Selamat Datang Kami telah melakukan cek nomor anda. Nomor ${params[0]} tidak terdaftar dan tidak bisa menggunakan layanan chatbot. Silahkan melakukan pendaftaran di link ${params[1]}/register`
    },
    otp: () => {
        return {
            opening: (param) => {
                return `> [${param.toUpperCase()}] permintaan dimengerti\n\nPermintaan OTP untuk verifikasi WhatsApp berhasil dikirimkan. Sistem sedang memeriksa apakah nomor kamu terdaftar. Silakan menunggu beberapa saat!`
            },
            failure: (params) => {
                return `Nomor ${params[0]} tidak terdaftar. Silahkan melakukan pendaftaran di ${params[1]}/register`
            },
            failure2: () => {
                return `Gagal membuat OTP. Coba lagi!`
            },
        }
    },
    extend: {
        opening: (param) => {
            return `> [${param.toUpperCase()}] Permintaan dimengerti\n\nPermintaan EXTEND untuk melakukan perpanjangan peminjaman berhasil dikirimkan. Sistem sedang memeriksa status peminjaman. Harap menunggu!\n\n> /show_borrow untuk melihat riwayat peminjaman anda`
        },
        selectBook: "Pilih buku yang ingin diperpanjang dengan mengirim nomor peminjaman contoh (1)",
        selectedBookToExtend: (book) => {
            return `Anda telah memilih peminjaman ${book}. Konfirmasi perpanjangan akan diproses.`
        }
    },
    returned: {
        opening: "> Layanan Chatbot Perpustakaan Umum Kota Solok\n\nAnda memiliki buku yang sudah jatuh tempo. Harap melakukan pengembalian agar dapat menggunakan Layanan Peminjaman dan Perpanjangan. Berikut ini adalah daftar peminjaman anda yang sudah jatuh tempo:",
        selectBook: "Pilih buku yang ingin dikembalikan dengan mengirim nomor peminjaman contoh (1)",
        selectedBookToReturn: (book) => {
            return `Anda telah memilih peminjaman ${book}. Konfirmasi pengembalian akan diproses. Silahkan mengantarkan buku ke Perpustakaan.`
        }
    },
    notVerifyNumber: () => {
        return `Status keanggotaan anda belum aktif. Lakukan verifikasi data ke Perpustakaan Umum Kota Solok. Untuk menikmati Layanan Peminjaman`;
    },
    suspendedMember: () => {
        return `Akun ada telah di tahan. Berikut ini adalah beberapa penyebab akun anda di suspend:\n- Terdapat peminjaman yang belum di kembalikan\n- Kesalahan dalam penulisan data\n - Akun telah melewati kadaluarsa\n\nLakukan aktivasi akun di Perpustakaan Umum Kota Solok`;
    },
    messages: {
        about: '> Layanan Chatbot Perpustakaan Umum Kota Solok\n\n*Chatbot* ini adalah asisten pribadi kamu dalam mengelola peminjaman dan pengembalian buku di Perpustakaan Umum Kota Solok. Chatbot ini juga merupakan alat pengingat otomatis untuk peminjaman yang akan dan sudah jatuh tempo. Kamu dapat menggunakan chatbot ini dengan mengirim perintah-perintah khusus. Untuk melihat daftar perintah, kamu bisa kirimkan */bot*.\n\nAgar dapat menggunakan chatbot dengan baik, harap tidak mengirimkan chat selain perintah yang ada. Saat kamu mengakses perintah ini artinya, kamu adalah pengguna terdaftar di Perpustakaan Umum Kota Solok. Chatbot ini akan mengirimkan pesan otomatis secara otomatis pada dua kondisis di atas yaitu saat akan dan jatuh tempo. Saat H-3, H-2, H-1 deadline peminjaman. Chatbot akan mengirimkan pesan setiap pukul 08.00 WIB.\n\n🤖 Terima kasih',
        forVerifiedUser: (command, user) => `> [*${command}*] permintaan dimengerti\n\nHalo ${user}, saat ini kamu mengakses layanan untuk aktivasi akun. Namun, status verifikasi akun kamu telah aktif. Silahkan menikmati layanan chatbot lainnya. Terima kasih!`,
        show: '> Daftar Perintah Chatbot\n\n> otp - aktivasi akun\n> extend - perpanjangan peminjaman\n> return - pengembalian\n> /show - melihat daftar perintah\n> /show_borrow - melihat daftar peminjaman\n> /profile - Melihat Data Pengguna\n> /show_active - melihat daftar peminjaman aktif\n> /show_overdue - untuk melihat daftar jatuh tempo\n> /password - lupa password\n> /about - tentang chatbot',
        forUnverifiedUserAndUnverifiedNumber: '> Layanan Chatbot Perpustakaan Umum Kota Solok\n\nKami mendeteksi bahwa nomor kamu terdaftar di dalam Aplikasi Perpustakaan Umum Kota Solok. Untuk menikmati layanan chatbot ini, harap melakukan verifikasi dengan menjalankan perintah *OTP*. Terima kasih!',
        forUnverifiedUserAndUnverifiedNumber2: '> Layanan Chatbot Perpustakaan Umum Kota Solok\n\nNomor kamu terdaftar di sebagai member namun belum terverifikasi. Silahkan melakukan verifikasi dengan cara ketik dan kirim *OTP*. Terima kasih!',
        forUnverifiedUserAndUnverifiedNumber3: 'Kami mendeteksi bahwa kamu mencoba untuk menggunakan layanan chatbot Perpustakaan Umum Kota Solok. Untuk melanjutkan, silahkan verifikasi nomor kamu dengan ketik perintah *OTP* atau */show* untuk melihat daftar perintah!',
    }
}