"use strict";

import Response from "../../../libs/response";
import Email from "../../../libs/mail";
import UserSchema from '../../../models/User';
import env from '../../../config/env';
import * as _ from 'lodash';
import jwt from 'jsonwebtoken';
import crypto from "crypto";
import sms from '../../../libs/sms';

class AdminAuthController {

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

    async login(req, res) {
        try {

            console.log('req.decrptedBody', req.decrptedBody);

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
                role: 'admin'
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
                    errors.push({
                        message: 'Your email address is not verified. Please verify your email address'
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

                    let token = new AdminAuthController().getToken(req, userDetail);


                    var logged_in_data = {
                        token: token,
                        user: userObj._id
                    };

                    res.status(200).json(await Response.success(logged_in_data, "Member Logged-In successfully.", req.decrptedBody.transitSecretKey));

                } else {
                    let error = [{
                        message: 'Authentication failed, User details not found.'
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


    async sendForgetPasswordToken(req, res) {


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
                role: 'admin'
            });

            // 1. IF User Not Found in Database
            if (_.isNull(userData)) {


                throw {
                    code: 412,
                    message: 'Sorry! We weren\'t able to identify you by the information provided.',
                    err: {}
                }
            }


            const forgotPasswordToken = crypto.randomBytes(16).toString('hex');


            const updatedData = {
                passwordResetKey: forgotPasswordToken
            };

            let userUpdated = await UserSchema.findOneAndUpdate({
                email: body.email,
                role: 'admin'
            }, updatedData, {
                projection: {}
            });

            let forgetPasswordLink = env.adminBaseUrl + '/reset-password/' + forgotPasswordToken;

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

            console.log('mailData', mailData);
            await Email.send(mailData);

            if (userUpdated) {
                res.status(200).json(await Response.success({}, "Email has been sent successfully, please check your email account.", body.transitSecretKey));
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

    async resetPassword(req, res) {

        let body = req.decrptedBody;



        try {

            if (!body.token) {

                throw {
                    code: 412,
                    message: 'Token is required.',
                    err: ""
                }

            }


            let userData = await UserSchema.findOne({
                passwordResetKey: body.token,
                role: 'admin'
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
                role: 'admin'
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


}

const adminAuth = new AdminAuthController();

module.exports = adminAuth;