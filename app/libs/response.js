'use strict';

import transitCrypto from './trainst-crypto';
import env from "../config/env";

/*   
 * commaon function for entire application
 * Return the success format with data object
 * data: {
 *  // your format
 * }
 */

class Response {

    async success(responseObj, message, transitSecretKey) {

        let respData = {
            status: true,
            data: responseObj,
            message: message || 'success',
        };
        if (env.transitEncryption) {
            respData = await transitCrypto.encrypt(respData, transitSecretKey);
        }
        return respData;

    }
    /**
     * commaon function for entire application
     * Return the error format with errors object
     * errors: {
     *  // your format
     * }
     */
    async errors(errorObj, transitSecretKey) {
        let respData = {
            code: errorObj.code,
            status: false,
            errors: errorObj.err,
            message: errorObj.message || 'Something went wrong.'
        };
        /* if (env.transitEncryption) {
            respData = await transitCrypto.encrypt(respData, transitSecretKey);
        } */

        return respData;
    }

}

export default new Response();