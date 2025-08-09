module.exports = {
    welcome: (params) => {
        return `
            Selamat datang ${params[0]}. Ini adalah Layanan Chatbot Perpustakaan Umum Kota Solok.\nBerikut ini adalah daftar perintah yang bisa anda gunakan.\n\n- Layanan Aktivasi Nomor WhatsApp (OTP)\n- Layanan Perpanjangan Peminjaman\n- Layanan Pengembalian Peminjaman\n\nUntuk mengaktifkan layanan silahkan mengirim sesuai kode/kata kunci di bawah:\n\n- *OTP* untuk Layanan Aktivasi Nomor WhatsApp\n- *EXTEND* untuk Perpanjangan Peminjaman\n- *RETURN* untuk Pengembalian Peminjaman\n\n_Note:_ Harap tidak membalas selain dari kata kunci diatas. Terima kasih\n\n> *Perpustakaan Umum Kota Solok*
        `
    }
}