import {
    AES,
    enc
} from "crypto-ts";
import env from "../config/env";
import Error from "./error";
export default {
    encrypt: async (obj = {}, passkey = env.transitSecret) => {
        try {
            return await AES.encrypt(JSON.stringify(obj), passkey).toString();
        } catch (error) {
            throw Error.internalServer(error);
        }
    },

    decrypt: async (obj = {}, passkey = env.transitSecret) => {
        try {
            const bytes = await AES.decrypt(obj.toString(), passkey);
            return JSON.parse(bytes.toString(enc.Utf8));
        } catch (error) {
            throw Error.internalServer(error);
        }
    }
};