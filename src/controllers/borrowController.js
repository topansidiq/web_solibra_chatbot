const axios = require('axios');

async function extendBook(bookId) {
    try {
        const { data } = await axios.post(
            `${process.env.LARAVEL_URL}/api/puks/borrows/${bookId}/extend`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${process.env.LARAVEL_TOKEN}`,
                    Accept: "application/json",
                },
            }
        );

        return data;
    } catch (error) {
        console.error("extend failed:", error.response?.data || error.message);
        return null;
    }
}

async function getAdmin() {
    try {
        const { data } = await axios.get(
            `${process.env.LARAVEL_URL}/api/puks/get-admin`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.LARAVEL_TOKEN}`,
                    Accept: "application/json",
                },
                params: { phone_number: phoneNumber },
            }
        );
        return data;
    } catch (error) {
        console.error('getAdmin failed:', error.response?.data || error.message)
        return null;
    }
}

async function sendNotificationToAdmin(admin, type, message) {
    try {
        const { data } = await axios.post(
            `${process.env.LARAVEL_URL}/api/puks/send-notification-to-admin`,
            {
                user_id: admin.id,
                type: type,
                message: message
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.LARAVEL_TOKEN}`,
                    Accept: "application/json",
                },
            }
        );

        return data;
    } catch (error) {
        console.error("sendNotificationToAdmin failed:", error.response?.data || error.message);
        return null;
    }
}

module.exports = {
    extendBook,
    getAdmin,
    sendNotificationToAdmin,
}