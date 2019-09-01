"use strict";

import Error from "../../../libs/error";
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



class UserController {

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

    async register(req, res) {

        try {
            let reqObj = req.decrptedBody;


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
            reqObj.role = 'subscriber';


            reqObj.security = await cryptoJSON.encrypt(reqObj.security, env.dbSecret, ['answer']);



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
                const data = {
                    _id: user._id
                };
                res.status(200).json(await Response.success(data, "Registered succesfully", req.decrptedBody.transitSecretKey));

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

    async resetPassword(req, res) {

        let body = req.decrptedBody;

        try {

            if (!body.token) {

                throw {
                    code: 412,
                    message: 'Token is required.',
                    err: errors
                }
            }


            let userData = await UserSchema.findOne({
                passwordResetKey: body.token,
                role: 'subscriber'
            });

            // 1. IF User Not Found in Database
            if (_.isNull(userData)) {

                throw {
                    code: 412,
                    message: 'Token invalid or expired. Please try again later.',
                    err: {}
                }
            }

            let newPassword = userData.hashPassword(env.secret, body.password);
            const updatedData = {
                passwordResetKey: null,
                password: newPassword
            };

            let userUpdated = await UserSchema.findOneAndUpdate({
                _id: userData._id,
                role: 'subscriber'
            }, updatedData, {
                    projection: {}
                });

            let mailData = {
                to: userData.email,
                subject: 'Your password has been changed.',
                template: 'password-reset-completed',
                context: {
                    receiver_name: `${userData.first_name}`
                },
                request: req
            };

            await Email.send(mailData);


            let smsObj = {
                to: userData.phone,
                body: ` Your Mobile wallet account password has been changed. if you have not changed. please reset your password  immediately.`,
            }

            let sent = await sms.send(smsObj).catch(err => err);
            console.log('sent', sent);

            if (userUpdated) {
                res.status(200).json(await Response.success({}, "Your password has been updated successfully.", body.transitSecretKey));
            } else {
                throw {
                    err: '',
                    message: 'Something went wrong. Please try again later.',
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


    async sendForgetPasswordToken(req, res) {

        console.log('req.decrptedBody', req.decrptedBody);

        let body = req.decrptedBody;

        try {

            if (!body.email) {

                throw {
                    code: 412,
                    message: 'Email is required.',
                    err: errors
                }
            }

            body.email = body.email.toLowerCase();

            let userData = await UserSchema.findOne({
                email: body.email,
                role: 'subscriber'
            });

            // 1. IF User Not Found in Database
            if (_.isNull(userData)) {

                throw {
                    code: 412,
                    message: 'Sorry! We weren\'t able to identify you by the information provided.',
                    err: {}
                }
            }

            /*  Check by security method */

            if (body.method == 1) {

                body = await cryptoJSON.encrypt(body, env.dbSecret, ['security_answer']);
                console.log('userData', userData);

                if (userData.security && userData.security.question != body.security_question) {
                    throw {
                        err: '',
                        message: 'You have provided wrong credential.',
                        code: 412
                    };
                } else if (userData.security.answer != body.security_answer) {
                    throw {
                        err: '',
                        message: 'You have provided wrong credential.',
                        code: 412
                    };

                }
            }

            const forgotPasswordToken = crypto.randomBytes(16).toString('hex');

            const updatedData = {
                passwordResetKey: forgotPasswordToken
            };

            let userUpdated = await UserSchema.findOneAndUpdate({
                email: body.email,
                role: 'subscriber'
            }, updatedData, {
                    projection: {}
                });

            let forgetPasswordLink = env.baseUrl + '/reset-password/' + forgotPasswordToken;

            if (body.method != 1) {
                let mailData = {
                    to: body.email,
                    subject: 'Password Reset',
                    template: 'forgot-password',
                    context: {
                        receiver_name: `${userData.first_name}`,
                        forgotPasswordLink: forgetPasswordLink
                    },
                    request: req
                };
                await Email.send(mailData);

            }

            let resposeData = {};
            let responseMessage = "Email has been sent successfully, please check your email account.";

            if (body.method == 1) {
                resposeData.redirectLink = `/reset-password/${forgotPasswordToken}`;
                responseMessage = "You have successfully authenticated. Please wait while redirecting...";
            }

            if (userUpdated) {
                res.status(200).json(await Response.success(resposeData, responseMessage, body.transitSecretKey));
            } else {
                throw {
                    err: '',
                    message: 'Something went wrong. Please try again later.',
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


    async changePassword(req, res) {

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

            if (!body.old_password) {

                throw {
                    code: 412,
                    message: 'Old password is required.',
                    err: errors
                }
            }

            if (!body.new_password) {

                throw {
                    code: 412,
                    message: 'New password is required.',
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

            let password = body.old_password;
            if (!userData.comparePassword(env.secret, password)) {

                throw {
                    code: 412,
                    message: 'Old password did not match.',
                    err: {}
                }
            }

            let newPassword = userData.hashPassword(env.secret, body.new_password);

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



    async uploadProfile(req, res) {


        if (req.decrptedBody.fileResult && req.decrptedBody.fileResult.status) {
            res.status(200).json(await Response.success(req.decrptedBody.fileResult, "Profile image has been uploaded successfully.", req.decrptedBody.transitSecretKey));
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


    async verifyTokenAfterRegistration(req, res) {


        try {

            let reqParams = req.params;
            let emailVerificationKey = reqParams.hashkey;

            const userDetail = await UserSchema.findOne({
                emailVerificationKey: emailVerificationKey
            });


            console.log('userDetail', userDetail);


            if (!userDetail) {
                throw {
                    err: '',
                    message: 'User not found.',
                    code: 412
                };
            }

            var baseUrl = env.baseUrl;

            let userdata = {
                email_verify: 'verified',
                emailVerificationKey: null,
                status: 1
            };


            let otpToken;
            if (userDetail.email_verify == 'new') {
                otpToken = crypto.randomBytes(16).toString('hex');
                userdata.phoneVerificationKey = otpToken
            }



            let userVerification = await UserSchema.findOneAndUpdate({
                emailVerificationKey: emailVerificationKey
            }, userdata);


            console.log('userVerification', userVerification);

            if (!userVerification) {
                console.log('111111111111', baseUrl);
                return res.redirect(baseUrl);
            } else {

                if (userDetail.email_verify == 'new') {


                    console.log('3333333333', baseUrl + `/verify/${otpToken}`);
                    return res.redirect(`${baseUrl}/verify/${otpToken}`);
                } else {
                    console.log('22222222222222', baseUrl + '/verify/true');
                    return res.redirect(`${baseUrl}/verify/true`);
                }

            }
        } catch (error) {
            res.redirect(baseUrl);
        }






    }



    async login(req, res) {
        try {

            let email = req.decrptedBody.email;

            let password = req.decrptedBody.password;

            if (!email || !password) {
                var errors = {
                    message: {
                        'message': 'Email address and password are required.'
                    }
                }
                throw {
                    code: 412,
                    message: 'Email address and password are required.',
                    err: errors
                }
            }

            email = email.toLowerCase();

            let userObj = await UserSchema.findOne({
                email: email,
                // role: 'subscriber'
            }, {
                    emailVerificationKey: 0,
                    updated: 0,
                    rooms: 0,
                    salt: 0,
                    created: 0,
                    department: 0
                });

            var errors = [],
                error = false;

            console.log('userObj', userObj);

            if (_.isNull(userObj) || !_.isNull(userObj)) {


                // 1. IF User Not Found in Database
                if (_.isNull(userObj)) {
                    errors.push({
                        message: 'Authentication failed, User details not found.'
                    });
                    error = true;
                }

                // 2.  if used email is not verified
                else if (userObj.email_verify && userObj.email_verify === 'new') {
                    error = true;
                    /*   errors.push({
                          message: 'Your email address is not verified. Please verify your email address. Click here to resend the activation link.'
                      }); */
                    errors.push({
                        message: 'resend'
                    });

                }

                // 3. IF User Account is not active
                /* else if (userObj.status == 3) {

                    errors.push({
                        message: 'It seems your account is Inactive. Please verify phone number.'
                    });
                    error = true;
                } */
                else if (userObj.status == 2) {
                    errors.push({
                        message: 'It seems your account is Inactive. Please contact Admin for further assistance.'
                    });
                    error = true;
                }

            }

            if (error) {
                throw {
                    code: 401,
                    message: 'something went wrong',
                    err: errors
                };
            } else {
                if (userObj.comparePassword(env.secret, password)) {

                    let transitKey = crypto.randomBytes(16).toString('hex');

                    let userDetail = {
                        first_name: userObj.first_name,
                        middle_name: userObj.middle_name,
                        last_name: userObj.last_name,
                        email: userObj.email,
                        _id: userObj._id,
                        token: transitKey
                    };

                    let token = new UserController().getToken(req, userDetail);


                    var logged_in_data = {
                        token: token,
                        user: userObj._id
                    };

                    res.status(200).json(await Response.success(logged_in_data, "Member Logged-In successfully.", req.decrptedBody.transitSecretKey));

                } else {
                    let error = [{
                        message: 'Authentication failed, User details not found.1'
                    }];
                    throw {
                        code: 401,
                        message: 'something went wrong',
                        err: error
                    };

                }

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

const user = new UserController();

module.exports = user;