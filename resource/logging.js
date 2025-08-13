module.exports = {
    logs: {
        messageFrom: (param) => {
            return console.log('[Message] from ', param);
        },
        replayOTP: (params) => {
            return console.log(`[Reply] message from ${params[0]} with data: ${params[1]}`);
        },
        prompt: (params) => {
            return console.log(`[Prompt-${params[0]}] from ${params[1]}`);
        },
        checkingNumber: (param) => {
            return console.log('[System] checking existsting phone number for ', param);
        },
        isNumberExists: (params) => {
            if (params[0] == false || params[0] == null) {
                return console.log(`[System] phone number ${params[1]} doesn't exists in database`);
            } else if (params[0] == true || params[0] != null) {
                return console.log(`[System] phone number ${params[1]} exists in database`);
            }
        },
        createOTP: (param) => {
            return console.log(`[System] try to call API from Main App (otp/get) for ${param}`);
        },
        createOTPFail: () => {
            return console.log(`[System] failed to create OTP`);
        },
        createOTPSuccess: (params) => {
            return console.log(`[System] success sendding OTP (${params[0]}) to ${params[1]}`);
        }
    },
    errors: {
        errorCreateOTP: (param) => {
            console.error(`[System] error to create OTP ${param}`);
        },
        failToCheckingNumber: (params) => {
            console.error(`[System] fail detected number ${params[0]} with error ${params[1]}`);
        }
    }
}