import jwt from "jsonwebtoken";
import env from "../config/env";
import atob from "atob";
import btoa from "btoa";
import transitCrypto from "../libs/trainst-crypto";
import Response from "../libs/response";

const middleware = {

    jwtVerify: async (req, res, next) => {
        try {

            if (!req.headers.authorization) {
                throw {
                    code: 412,
                    err: "auhorization header is missing",
                    message: "while verifying token"
                };

            }
            /*STEP1- verifiation of token and decode after successful verification of token */
            let encryptedData = req.headers.authorization.replace("Bearer ", "");
            const token = encryptedData;

            const decodedToken = await jwt.verify(
                token,
                env.secret,
                (err, result) => {
                    if (err) {
                        throw {
                            code: 401,
                            message: "Token Verificaton failed",
                            err: err
                        };
                    } else {
                        return result;
                    }
                }
            );

            if (decodedToken) {

                if (decodedToken.agent != req.headers['user-agent']) {
                    throw {
                        code: 401,
                        message: "Token Verificaton failed",
                        err: 'Invalid token'
                    };
                }


                let userId = req.body.login_id || req.query.login_id || req.headers.login_id;

                if (userId) {

                    if (req.body) {
                        req.body.login_id = userId;
                    } else {
                        req.query.login_id = userId;
                    }

                }


                next();
            }

            /**STEP2:- Verify the token authenticity */
            // let userId =
            //     req.body.login_id || req.query.login_id || req.headers.login_id;
            // if (userId === decodedToken._id) {
            //     req.user = decodedToken;
            //     /**check if private key is correct */
            //     let isPrivateKeymatched = false;

            //     const user = await new UserController().one(decodedToken._id, {
            //         auth: 1
            //     });

            //     const decrpted = await transitCrypto.decrypt(
            //         auth,
            //         `${user.auth}${userId}`
            //     );

            //     const encrypted = await transitCrypto.encrypt(
            //         user.auth,
            //         `${user.auth}${userId}`
            //     );
            //     if (decrpted === user.auth) isPrivateKeymatched = true;

            //     req.isPrivateKeymatched = isPrivateKeymatched;
            //     next();
            // } else {
            //     throw {
            //         code: 403,
            //         message: "Token authenticity failed",
            //         err: "Token authenticity failed"
            //     };
            // }
        } catch (error) {

            res.status(error.code || 412).json(

                await Response.errors({
                    err: error.err || error,
                    code: error.code,
                    message: error.message
                })
            );
        }
    },

    transitDecrypt: async (req, res, next) => {

        try {
            let body = {},
                query = {},
                transitKey = env.transitSecret;
            if (!env.transitEncryption) {
                body = req.body || {};
                query = req.query || {};
            } else {

                if (req.headers.authorization) {

                    let authToken = req.headers.authorization.replace("Bearer ", "");
                    const token = authToken;

                    const decodedToken = await jwt.verify(
                        token,
                        env.secret,
                        (err, result) => {
                            if (err) {
                                throw {
                                    code: 401,
                                    message: "Token Verificaton failed",
                                    err: err
                                };
                            } else {
                                return result;
                            }
                        }
                    );

                    if (decodedToken) {
                        if (decodedToken.auth) {
                            transitKey = `&%@)${decodedToken['auth']['token']}${decodedToken['auth']['_id']}*^$`;
                            transitKey = btoa(transitKey);
                        }
                    }
                }

                if (req.body.encoded) {
                    body = await transitCrypto.decrypt(req.body.encoded, transitKey);

                }

                if (req.query.encoded) {
                    const decrypted = atob(req.query.encoded);
                    query = await transitCrypto.decrypt(decrypted, transitKey);
                    query.transitSecretKey = transitKey;
                }
            }
            if (body) {
                body.transitSecretKey = transitKey;
            }

            if (query) {
                query.transitSecretKey = transitKey;
            }

            req.decrptedBody = body;
            req.decrptedQuery = query;
            next();
        } catch (error) {
            res.status(412).json(await Response.errors(error));
        }
    },


};

export default middleware;