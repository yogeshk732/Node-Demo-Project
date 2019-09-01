"use strict";


import config from '../config/env';

import otplib from 'otplib';
import authenticator from 'otplib/authenticator';



class Otp {
    constructor(parameters) {
        this.authDetail = config.sendgrid;

        authenticator.options = {
            step: config.otp.expireTime
        };
    }

    async generateSecret() {
        return await authenticator.generateSecret();
    }


    async getOtp() {

        const secret = await this.generateSecret();
        const token = await authenticator.generate(secret);


        console.log('getOtp token', token);
        console.log('getOtp secret', secret);

        return {
            otp: token,
            secret: secret
        }

    }

    async verify(token, secret) {

        console.log('verify token', token);
        console.log('verify secret', secret);
        const verifyToken = await authenticator.verify({
            token,
            secret
        });

        if (verifyToken) {
            return verifyToken;
        } else {
            return false;
        }

    }


}


export default new Otp();