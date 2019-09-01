"use strict";

import "babel-polyfill";
import middleware from "../../middleware";
import fileUpload from "../../middleware/fileUpload";
import path from 'path';
import fs from 'fs';
import express from "express";
const router = express.Router();

class AdminAppRouter {

    /**
     * Define object
     *
     */
    controllerObj = {};


    /**
     * Constructor function initialize automatically when object create
     *
     */
    constructor() {

        /**
         * Take all controller file into object.
         */
        fs.readdirSync(path.resolve('./app/controllers/admin/v1')).forEach(file => {
            let name = file.substr(0, file.indexOf('.'));
            this.controllerObj[name] = require(path.resolve(`./app/controllers/admin/v1/${name}`));
        });
        this.router = router;
    }


    /**
     * Define routes
     *
     */
    adminRoutes() {

        /**** Auth api routes ****/

        /**
         * Login into admin dashboard
         *
         * @Method : POST
         * @Params :  { email: string , password: string }
         * @header : {Authorization(Bearer token): false, login_id: false}
         *
         */
        this.router.post(
            "/login",
            middleware.transitDecrypt,
            this.controllerObj.auth.login
        );


        /**
         * Send password reset url
         *
         * @Method : POST
         * @Params :  { email: string }
         * @header : {Authorization(Bearer token): false, login_id: false}
         *
         */
        this.router.post(
            "/password/forgot",
            middleware.transitDecrypt,
            this.controllerObj.auth.sendForgetPasswordToken
        );

        /**
         * Reset password from reset link
         *
         * @Method : PUT
         * @Params :  { password: string }
         * @header : {Authorization(Bearer token): false, login_id: false}
         *
         */
        this.router.put(
            "/password/reset",
            middleware.transitDecrypt,
            this.controllerObj.auth.resetPassword
        );

    }

    /**
     * Function to initialize routes
     *
     */
    init() {
        this.adminRoutes();
        return this.router;
    }

}


module.exports = new AdminAppRouter();