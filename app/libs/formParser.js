import formidable from "formidable";
import transitCrypto from './trainst-crypto';
import env from '../config/env';
/**
 * to parse incoming request's form data
 * #NOTE:- send files in file field and data in data field of form data
 * @param {Object} req incoming request(req)
 * @param {Object} options  formidable options
 * @returns {Object} {file:Array,data:Object}
 */
const formParser = async (req, options = {}) => {
    return new Promise((resolve, reject) => {
        try {
            let form = new formidable.IncomingForm();
            form.multiples = options.multiples || true;
            form.keepExtensions = options.keepExtensions || true;
            form.parse(req, async (err, fields, files) => {
                if (err) return reject(err);
                let file = [];
                /**if multiple files are coming in request */
                if (Array.isArray(files.file)) file = files.file;
                else if (files.file) file.push(files.file);

                let decryptedData = fields.data;
                if (env.transitEncryption)
                    decryptedData = await transitCrypto.decrypt(fields.data);
                const data = JSON.parse(decryptedData);

                return resolve({
                    file,
                    data
                });
            });
        } catch (error) {
            throw reject(error);
        }
    });
};
export default formParser;