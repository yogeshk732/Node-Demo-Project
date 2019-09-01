"use strict";

import Response from "../../libs/response";
import Email from "../../libs/mail";

import env from '../../config/env';

import * as _ from 'lodash';
import jwt from 'jsonwebtoken';

import crypto from "crypto";


import sms from '../../libs/sms';
import otp from '../../libs/otp';
import cryptoJSON from '../../libs/crypto-json';


import needle from 'needle';


class CronController {

    constructor() {

    }

    async start(req, res) {

    }


}
const user = new CronController();

module.exports = user;