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
                return `[${param.toUpperCase()}] Permintaan dimengerti\n\nPermintaan OTP untuk verifikasi WhatsApp berhasil dikirimkan. Sistem sedang memeriksa apakah nomor anda terdaftar. Silakan menunggu beberapa saat!`
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
            return `[${param.toUpperCase()}] Permintaan dimengerti\n\nPermintaan EXTEND untuk melakukan perpanjangan peminjaman berhasil dikirimkan. Sistem sedang memeriksa status peminjaman. Harap menunggu!\n\n> SHOW_BORROW - untuk melihat riwayat peminjaman anda`
        },
        selectBook: "Pilih buku yang ingin perpanjang dengan mengirim nomor peminjaman contoh (1)",
        selectedBookToExtend: (book) => {
            return `Anda telah memilih peminjaman ${book}. Konfirmasi perpanjangan akan diproses.`
        }
    },
    returned: {
        opening: "Anda memiliki buku yang sudah jatuh tempo. Harap melakukan pengembalian agar dapat menggunakan Layanan Peminjaman dan Perpanjangan. Berikut ini adalah daftar peminjaman anda yang sudah jatuh tempo:",
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
    }
}