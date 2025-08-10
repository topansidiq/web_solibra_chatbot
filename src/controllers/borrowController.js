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

module.exports = {
    extendBook,
}