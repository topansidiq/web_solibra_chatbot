const Helper = {
    formatPhoneTo62: (phone) => {
        let clean = phone.replace(/\D/g, "");
        if (clean.startsWith("0")) {
            clean = "62" + clean.substring(1);
        }
        return clean;
    },
    formatPhoneTo08: (phone) => {
        let clean = phone.replace(/\D/g, "");
        if (clean.startsWith("62")) {
            clean = "0" + clean.substring(2);
        }
        return clean;
    }

}

module.exports = {
    Helper,
}