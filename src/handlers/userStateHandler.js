const connection = require("../../db");

function getUserState(phoneNumber) {
    return new Promise((resolve, reject) => {
        connection.query(
            'SELECT state FROM user_state WHERE phone_number = ?',
            [phoneNumber],
            (err, rows) => {
                if (err) return reject(err);

                if (rows.length === 0) {
                    // Insert user baru
                    connection.query(
                        'INSERT INTO user_state (phone_number) VALUES (?)',
                        [phoneNumber],
                        (err2) => {
                            if (err2) return reject(err2);
                            return resolve('welcome');
                        }
                    );
                } else {
                    return resolve(rows[0].state);
                }
            }
        );
    });
}

function setUserState(phoneNumber, state) {
    return new Promise((resolve, reject) => {
        connection.query(
            'UPDATE user_state SET state = ? WHERE phone_number = ?',
            [state, phoneNumber],
            (err) => {
                if (err) return reject(err);
                resolve();
            }
        );
    });
}

function setPermanentUserState(phoneNumber, state) {
    return new Promise((resolve, reject) => {
        connection.query(
            'UPDATE user_state SET permanent_state = ? WHERE phone_number = ?',
            [state, phoneNumber],
            (err) => {
                if (err) return reject(err);
                resolve();
            }
        );
    });
}

function getPermanentUserState(phoneNumber) {
    return new Promise((resolve, reject) => {
        connection.query(
            'SELECT permanent_state FROM user_state WHERE phone_number = ?',
            [phoneNumber],
            (err, rows) => {
                if (err) return reject(err);

                if (rows.length === 0) {
                    // Insert user baru
                    connection.query(
                        'INSERT INTO user_state (phone_number) VALUES (?)',
                        [phoneNumber],
                        (err2) => {
                            if (err2) return reject(err2);
                            return resolve('unverified');
                        }
                    );
                } else {
                    return resolve(rows[0].state);
                }
            }
        );
    });
}

module.exports = { getUserState, setUserState, setPermanentUserState, getPermanentUserState };
