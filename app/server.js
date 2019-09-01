"use strict";

import morgan from "morgan";
import express from "express";
import helmet from "helmet";
import bodyParser from "body-parser";
import cors from "cors";
import http from "http";
import cookieParser from "cookie-parser";
import env from "./config/env";
import routesV1 from "./routes/v1";

import userRoute from './routes/v1/user-routes';
import adminRoute from './routes/v1/admin-routes';
import database from "./libs/mongoose";
import path from "path";
import cluster from 'cluster';
import os from 'os';


var CronJob = require('cron').CronJob;

import cronController from './controllers/other/cron';



class Server {


    constructor() {
        /*defining PORT for application*/
        this.port = env.PORT || 3000;

        /*init express app*/
        this.app = express();

        /*init a sever*/
        // this.server = http.createServer(this.app);
        let numCores = os.cpus().length;
        if (cluster.isMaster) {
            for (var i = 0; i < numCores; i++) {
                cluster.fork();
            }
        } else {
            this.server = http.createServer(this.app).listen(this.port, () => {
                console.log("listening on", this.server.address().port);
                console.log("process.pid", process.pid);
            });
        }






        /*init helmets for securing http headers*/
        this.helmet = helmet();

        /*init cors for multiple origin requests*/
        this.cors = cors();


        this.routes;
    }

    secureHeaders() {
        /*protect http headers of server through Helmet*/
        this.app.use(this.helmet);
    }

    appConfig() {
        /*allow application to read and send data in body*/
        this.app.use(cookieParser()); // read cookies (needed for auth)
        this.app.use(bodyParser.json({
            limit: "50mb"
        }));
        this.app.use(bodyParser.urlencoded({
            limit: "50mb",
            extended: true
        }));
        this.app.use(morgan("dev"));
    }

    enablingCors() {
        /*enable application CORS*/
        this.app.use(this.cors);
    }

    connectoToDB() {
        new database().dbConnect();
    }

    setStaticPaths() {

        this.app.use(express.static(path.resolve("./public/uploads/")));
        this.app.use("/", express.static(path.resolve("./public/")));
    }

    setAPIRoutes() {

        /* API routing version 1*/

        this.app.use("/api/v1", routesV1.userRoutes);
        this.app.use("/admin-api/v1", routesV1.adminRoutes);
    }

    allowToServe() {
        /*rendering file on routes*/


        this.app.get(/^((?!\/(api)).)*$/, (req, res) => {

            res.sendFile(path.resolve("./public/index.html"));
        });
    }

    startCron() {
        new CronJob('0 * * * *', function () {

            console.log('Cron completed:- Exchange rate has been updated', new Date());
            cronController.start();
        }, null, true, 'America/Los_Angeles');

    }


    startServer() {


    }
    init() {
        /*Listen on Server Port*/
        this.secureHeaders();
        this.appConfig();
        this.enablingCors();
        this.connectoToDB();
        this.setStaticPaths();
        this.setAPIRoutes();
        this.allowToServe();
        this.startCron();

    }
}

const application = new Server();

application.init();