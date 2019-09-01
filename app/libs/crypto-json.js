import cryptoJSON from "crypto-json";
export default {
    encrypt: async (
        obj, //object to encrypt
        passkey, //secret key
        keys = [], //specify which keys to encrypt / decrypt(default: [], i.e.encrypt / decrypt everything)
        algorithm = "aes-256-cbc", //select any supported by the version of Node you are using (default: aes256)
        encoding = "base64" //hex, base64, binary (default: hex)
    ) => {

        try {
            return await cryptoJSON.encrypt(obj, passkey, {
                algorithm: algorithm,
                encoding: encoding,
                keys: keys
            });
        } catch (error) {
            throw error;
        }
    },

    decrypt: async (
        obj,
        passkey,
        keys = [],
        algorithm = "aes-256-cbc",
        encoding = "base64"
    ) => {
        try {
            return await cryptoJSON.decrypt(
                JSON.parse(JSON.stringify(obj)),
                passkey, {
                    algorithm: algorithm,
                    encoding: encoding,
                    keys: keys
                }
            );
        } catch (error) {
            throw error;
        }
    }
};