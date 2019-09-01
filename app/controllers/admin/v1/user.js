"use strict";

import Response from "../../../libs/response";
import Email from "../../../libs/mail";
import UserSchema from '../../../models/User';
import env from '../../../config/env';
import * as _ from 'lodash';
import jwt from 'jsonwebtoken';
import crypto from "crypto";
import sms from '../../../libs/sms';
import otp from '../../../libs/otp';
import cryptoJSON from '../../../libs/crypto-json';
import fs from 'fs-extra';
import path from 'path';

class AdminUserController {

    constructor() {

    }

    getToken(reqst, data) {
        var token = jwt.sign({
            auth: data,
            agent: reqst.headers['user-agent'],
            exp: Math.floor(new Date().getTime() / 1000) + 7 * 24 * 60 * 60
        }, env.secret);
        return token;
    }

    async one(req, res) {

        try {
            let body = req.decrptedQuery;

            let projection = {
                password: 0,
                otp: 0,
                "security.answer": 0,
                "document.documentType": 0,
                "document.documentType": 0,
                "document.expiryDate": 0,
                phoneVerificationKey: 0,
                passwordResetKey: 0,
                status: 0,
                emailVerificationKey: 0,
                created_at: 0,
                updated_at: 0
            };
            const user = await UserSchema.findById(body.id, projection).then(user => {
                if (!user) {
                    throw {
                        message: `No record found with user_id:${user_id}`,
                        code: 204,
                        err: ''
                    };
                } else {
                    if (user.profile) {
                        user['profile'] = `${env.fileBasePath}/${user._id}/profile/${user.profile}`;
                    }

                    return user;
                }
            });

            res.status(200).json(await Response.success(user, "Data found", req.decrptedQuery.transitSecretKey));

            return user;
        } catch (error) {
            return res.status(error.code).json(
                await Response.errors({
                    err: error.err,
                    message: error.message,
                    code: error.code
                })
            );
        }
    }

    async updateUser(req, res) {

        try {
            let body = req.decrptedBody;




            if (!body) {
                throw {
                    err: '',
                    message: 'Data missing.',
                    code: 412
                };
            }

            if (body && !body.id) {
                throw {
                    err: '',
                    message: 'User id is missing.',
                    code: 412
                };
            };

            if (body.phoneChange && body.phoneChange == 1) {
                body.phone_verify = 'unverified';
            }

            if (body.emailChange && body.emailChange == 1) {
                body.email_verify = 'unverified';
            }

            let encryptedBody = await cryptoJSON.encrypt(body, env.dbSecret, ['document.documentNumber', 'document.expiryDate']);

            if (body.security || !_.isEmpty(body.security)) {
                encryptedBody.security = await cryptoJSON.encrypt(body.security, env.dbSecret, ['answer']);
            }

            let userUpdated = await UserSchema.findOneAndUpdate({
                _id: body.id
            }, encryptedBody);

            if (userUpdated) {
                res.status(200).json(await Response.success({}, "Profile has been updated successfully.", req.decrptedBody.transitSecretKey));
            } else {
                throw {
                    err: '',
                    message: 'Something went wrong',
                    code: 412
                };
            }

        } catch (error) {
            return res.status(error.code).json(
                await Response.errors({
                    err: error.err,
                    message: error.message,
                    code: error.code
                })
            );
        }

    }


    async uploadProfile(req, res) {
        if (req.decrptedBody.fileResult && req.decrptedBody.fileResult.status) {
            req.decrptedBody.fileResult['url'] = `${env.fileBasePath}/${req.decrptedBody.fileResult.folder}/${req.decrptedBody.fileResult.name}`;

            res.status(200).json(await Response.success(req.decrptedBody.fileResult, "Image has been uploaded successfully.", req.decrptedBody.transitSecretKey));

        } else {
            res.status(204).json(
                await Response.errors({
                    err: [],
                    message: "Error in uploading the image.",
                    code: 204
                })
            );

        }

    }

    async getUserList(req, res) {

        let body = req.decrptedQuery;

        try {

            let userData = await UserSchema.find({}, {
                password: 0,
                emailVerificationKey: 0,
                otp: 0,
                phoneVerificationKey: 0,
                passwordResetKey: 0,
            });

            // 1. IF User Not Found in Database
            if (_.isNull(userData)) {

                throw {
                    code: 412,
                    message: 'User not found.',
                    err: {}
                }
            } else {
                res.status(200).json(await Response.success(userData, "User listing.", body.transitSecretKey));
            }

        } catch (error) {
            return res.status(error.code).json(
                await Response.errors({
                    err: error.err,
                    message: error.message,
                    code: error.code
                })
            );
        }

    }




    async getUserDetail(req, res) {

        let body = req.decrptedQuery;



        try {

            if (!body.id) {

                throw {
                    code: 412,
                    message: 'User id is required',
                    err: {}
                }

            }


            let userData = await UserSchema.findById(body.id, {
                password: 0,
                emailVerificationKey: 0,
                otp: 0,
                "security.answer": 0,
                phoneVerificationKey: 0,
                passwordResetKey: 0,
            }).then(user => {
                if (!user) {
                    throw {
                        message: `No record found with user_id:${user_id}`,
                        code: 204,
                        err: ''
                    };
                } else {
                    if (user.profile) {
                        user['profile'] = `${env.fileBasePath}/${user._id}/profile/${user.profile}`;
                    }

                    return user;
                }
            });

            // 1. IF User Not Found in Database
            if (_.isNull(userData)) {

                throw {
                    code: 412,
                    message: 'User not found.',
                    err: {}
                }
            } else {
                res.status(200).json(await Response.success(userData, "User listing.", body.transitSecretKey));
            }

        } catch (error) {
            return res.status(error.code).json(
                await Response.errors({
                    err: error.err,
                    message: error.message,
                    code: error.code
                })
            );
        }

    }


    async checkTagAvailability(req, res) {

        try {

            let body = req.decrptedBody;

            let condition = {
                tag: body.tag,
                _id: {
                    "$ne": body.user_id
                },
                role: 'subscriber'
            };


            if (body.user_id) {
                condition['_id'] = {
                    "$ne": body.user_id
                };
            }

            const userDetail = await UserSchema.findOne(condition);


            console.log(userDetail);

            if (!userDetail) {

                res.status(200).json(await Response.success({}, "Tag is available.", body.transitSecretKey));

            } else {
                throw {
                    err: '',
                    message: 'Tag is not available.',
                    code: 200
                };
            }

        } catch (error) {
            return res.status(error.code).json(
                await Response.errors({
                    err: error.err,
                    message: error.message,
                    code: error.code
                })
            );
        }

    }

    async updateUser(req, res) {

        try {
            let body = req.decrptedBody;

            if (!body) {
                throw {
                    err: '',
                    message: 'Data missing.',
                    code: 412
                };
            }

            if (body && !body.id) {
                throw {
                    err: '',
                    message: 'User id is missing.',
                    code: 412
                };
            };

            if (body.phoneChange && body.phoneChange == 1) {
                body.phone_verify = 'unverified';
            }

            if (body.emailChange && body.emailChange == 1) {
                body.email_verify = 'unverified';
            }

            let encryptedBody = await cryptoJSON.encrypt(body, env.dbSecret, ['document.documentNumber', 'document.expiryDate']);

            if (body.security || !_.isEmpty(body.security)) {
                encryptedBody.security = await cryptoJSON.encrypt(body.security, env.dbSecret, ['answer']);
            }

            let userUpdated = await UserSchema.findOneAndUpdate({
                _id: body.id,
                role: 'subscriber'
            }, encryptedBody);

            if (userUpdated) {
                res.status(200).json(await Response.success({}, "Profile has been updated successfully.", req.decrptedBody.transitSecretKey));
            } else {
                throw {
                    err: '',
                    message: 'Something went wrong',
                    code: 412
                };
            }

        } catch (error) {
            return res.status(error.code).json(
                await Response.errors({
                    err: error.err,
                    message: error.message,
                    code: error.code
                })
            );
        }

    }


    async updateUserPassword(req, res) {

        console.log('req.decrptedBody', req.decrptedBody);

        let body = req.decrptedBody;

        try {



            if (!body.id) {

                throw {
                    code: 412,
                    message: 'User id is required.',
                    err: errors
                }
            }


            if (!body.password) {

                throw {
                    code: 412,
                    message: 'password is required.',
                    err: errors
                }
            }


            let userData = await UserSchema.findOne({
                _id: body.id,
                role: 'subscriber'
            });


            // 1. IF User Not Found in Database
            if (_.isNull(userData)) {

                throw {
                    code: 412,
                    message: 'Authentication failed, User details not found.',
                    err: {}
                }
            }


            let newPassword = userData.hashPassword(env.secret, body.password);

            let updatedData = {
                "password": newPassword
            };

            let userUpdated = await UserSchema.findOneAndUpdate({
                _id: body.id,
                role: 'subscriber'
            }, updatedData, {
                projection: {}
            });

            if (userUpdated) {
                res.status(200).json(await Response.success(body.fileResult, "Password has been updated successfully.", body.transitSecretKey));
            } else {
                throw {
                    err: '',
                    message: 'Error in password update.',
                    code: 204
                };
            }

        } catch (error) {
            return res.status(error.code).json(
                await Response.errors({
                    err: error.err,
                    message: error.message,
                    code: error.code
                })
            );
        }

    }



    async addUser(req, res) {

        try {
            let reqObj = req.decrptedBody;

            console.log('reqObj', reqObj);

            if (reqObj.phone) {
                const checkNumber = await sms.isValid(reqObj.phone).catch(err => err);
                if (!checkNumber.status) {
                    throw {
                        code: checkNumber.code,
                        message: checkNumber.message,
                        err: {}
                    }
                }
            } else {
                throw {
                    code: 412,
                    message: 'Phone number empty or invalid.',
                    err: {}
                }
            }

            const otpData = await otp.getOtp();

            reqObj.otp = otpData.secret;

            reqObj.security = await cryptoJSON.encrypt(reqObj.security, env.dbSecret, ['answer']);

            if (reqObj.fileResult) {
                reqObj.profile = reqObj.fileResult.name;
            }


            const newUser = await new UserSchema(reqObj);

            newUser.save().then(async newUser => {
                let signupLink = env.apiBaseUrl + '/api/v1/verify/' + newUser.emailVerificationKey;


                let mailData = {
                    to: reqObj.email,
                    subject: 'Registration:- email verification',
                    template: 'registration',
                    context: {
                        receiver_name: `${reqObj.first_name}`,
                        activation_link: signupLink
                    },
                    request: req
                };
                await Email.send(mailData).catch(err => err);

                console.log('otp>>>>>>>>>>>', otpData.otp);

                let smsObj = {
                    to: reqObj.phone,
                    body: `You have been successfully registered for mobile wallet. OTP:- ${otpData.otp}`,
                }


                let sent = await sms.send(smsObj).catch(err => err);
                console.log('sent', sent);
                let user = newUser.toObject();

                if (reqObj.fileResult) {
                    let sourceFolder = path.join(`./public/uploads/${reqObj.fileResult.folder_id}`);
                    let destination = path.join(`./public/uploads/${user._id}`);
                    await fs.moveSync(sourceFolder, destination);
                }


                if (body.fileResult) {
                    let sourceFolder = path.join(`./public/uploads/${body.fileResult.folder_id}/${body.fileResult.folder}`);
                    let destination = path.join(`./public/uploads/${user._id}/${body.fileResult.folder}`);

                    let removeSourceFolder = path.join(`./public/uploads/${body.fileResult.folder_id}`);
                    await fs.copy(sourceFolder, destination);
                    await fs.remove(removeSourceFolder);
                }

                const data = {
                    _id: user._id
                };

                res.status(200).json(await Response.success(data, "New user has been added successfully.", req.decrptedBody.transitSecretKey));

            }).catch(async err => {
                return res.status(412).json(
                    await Response.errors({
                        err: err.errors,
                        message: 'Something went wrong.',
                        code: 412
                    })
                );
            });

        } catch (error) {

            return res.status(error.code).json(
                await Response.errors({
                    err: error.err,
                    message: error.message,
                    code: error.code
                })
            );

        }

    }





    async loginUserDashboard(req, res) {
        try {

            let body = req.decrptedQuery;


            if (!body.id) {

                throw {
                    code: 412,
                    message: 'User id is required.',
                    err: {}
                }
            }

            let userObj = await UserSchema.findOne({
                _id: body.id,
                role: 'subscriber'
            }, {
                emailVerificationKey: 0,
                updated: 0,
                rooms: 0,
                salt: 0,
                created: 0,
                department: 0
            });

            console.log('userObj', userObj);

            if (_.isNull(userObj) || !_.isNull(userObj)) {


                // 1. IF User Not Found in Database
                if (_.isNull(userObj)) {

                    throw {
                        code: 412,
                        message: 'Authentication failed, User details not found.',
                        err: {}
                    }


                } else if (userObj.status == 2) {

                    throw {
                        code: 412,
                        message: 'It seems account is Inactive.',
                        err: {}
                    }
                }

            }



            let transitKey = crypto.randomBytes(16).toString('hex');

            let userDetail = {
                first_name: userObj.first_name,
                middle_name: userObj.middle_name,
                last_name: userObj.last_name,
                email: userObj.email,
                _id: userObj._id,
                token: transitKey
            };

            console.log('userDetail', userDetail);

            let token = new AdminUserController().getToken(req, userDetail);

            var logged_in_data = {
                token: token,
                user: userObj._id
            };

            res.status(200).json(await Response.success(logged_in_data, "Member Logged-In successfully.", req.decrptedBody.transitSecretKey));


        } catch (error) {

            return res.status(error.code).json(
                await Response.errors({
                    err: error.err,
                    message: error.message,
                    code: error.code
                })
            );

        }


    }



    async deleteUser(req, res) {

        try {

            let body = req.decrptedQuery;

            if (!body.id) {
                throw {
                    code: 412,
                    message: 'User id is required.',
                    err: {}
                }
            }

            let updatedData = await UserSchema.deleteOne({
                _id: body.id
            });

            // 1. IF User Not Found in Database
            if (_.isNull(updatedData)) {

                throw {
                    code: 412,
                    message: 'Data not found.',
                    err: {}
                }
            } else {
                res.status(200).json(await Response.success(updatedData, "User has been deleted successfully.", body.transitSecretKey));
            }

        } catch (error) {
            return res.status(error.code).json(
                await Response.errors({
                    err: error.err,
                    message: error.message,
                    code: error.code
                })
            );
        }

    }


}

const adminUser = new AdminUserController();

module.exports = adminUser;