"use strict";

import "babel-polyfill";
import middleware from "../../middleware";
import fileUpload from "../../middleware/fileUpload";
import path from 'path';
import fs from 'fs';
import express from "express";
const router = express.Router();

class AppRouter {

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
        fs.readdirSync(path.resolve('./app/controllers/front/v1')).forEach(file => {
            let name = file.substr(0, file.indexOf('.'));
            this.controllerObj[name] = require(path.resolve(`./app/controllers/front/v1/${name}`));
        });
        this.router = router;
    }


    /**
     * Define routes
     *
     */
    userRoutes() {

        /**
         * Login into user dashboard
         *
         * @Method : POST
         * @Params :  { email: string , password: string }
         * @header : {Authorization(Bearer token): false, login_id: false}
         *
         */
        this.router.post(
            "/login",
            middleware.transitDecrypt,
            this.controllerObj.user.login
        );


        /**
         * User registration
         *
         * @Method : POST
         * @Params : {
             first_name: string,
             middle_name: string,
             last_name: string,
             dob: Date,
             email: string,
             password: string,
             phone: string,
             address: {
                country: string,
                state: string,
                city: string,
                zip: string,
                street: string,
            },
            security: {
                question:string,
                answer:string
            }
         }
         * @header : {Authorization(Bearer token): false, login_id: false}
         *
         */
        this.router.post(
            "/register",
            middleware.transitDecrypt,
            this.controllerObj.user.register
        );


        /**
         * Verify email address
         *
         * @Method : Get
         * @Params : {
             hashkey: string
         }
         * @header : {Authorization(Bearer token): false, login_id: false}
         *
         */
        this.router.get(
            "/verify/:hashkey",
            middleware.transitDecrypt,
            this.controllerObj.user.verifyTokenAfterRegistration
        );


        /**
        * Upload profile image     
        *        
        * @Method : Post
        * @Params : {
                data: {folder:String,user_id:string},
                file:File
            }
        * @header : {Authorization(Bearer token): true, login_id: true}
        *
        */
        this.router.post(
            "/file/upload",
            middleware.jwtVerify,
            middleware.transitDecrypt,
            fileUpload.upload,
            this.controllerObj.user.uploadProfile
        );

        /**
        * Update Password    
        *        
        * @Method : Put
        * @Params : {
                id: string(user id),
                old_password: string,
                new_password: string
            }
        * @header : {Authorization(Bearer token): true, login_id: true}
        *
        */
        this.router.put(
            "/password/update",
            middleware.jwtVerify,
            middleware.transitDecrypt,
            this.controllerObj.user.changePassword
        );




        /**
        * Send forgot password link    
        *        
        * @Method : Post
        * @Params : {               
                email: string
            }
        * @header : {Authorization(Bearer token): false, login_id: false }
        *
        */
        this.router.post(
            "/password/forgot",
            middleware.transitDecrypt,
            this.controllerObj.user.sendForgetPasswordToken
        );


        /**
        * Reset password after forgot password   
        *        
        * @Method : Put
        * @Params : {               
                token: string,
                password: string
            }
        * @header : {Authorization(Bearer token): false, login_id: false }
        *
        */
        this.router.put(
            "/password/reset",
            middleware.transitDecrypt,
            this.controllerObj.user.resetPassword
        );








    }

    /**
     * Function to initialize routes
     *
     */
    init() {
        this.userRoutes();
        return this.router;
    }

}

//export default new AppRouter();


module.exports = new AppRouter();