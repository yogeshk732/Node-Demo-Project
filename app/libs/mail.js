"use strict";

import nodemailer from 'nodemailer';
import config from '../config/env';
import sgTransport from 'nodemailer-sendgrid-transport';
import hbs from 'nodemailer-express-handlebars';


class Mail {
    constructor(parameters) {
        this.authDetail = config.sendgrid;
    }

    async sendgridSMTP(opt) {
        try {
            let transporter = await nodemailer.createTransport(sgTransport(this.authDetail));
            return await this.sendMailer(opt, transporter);
        } catch (err) {
            return err;
        }

    }


    async sendMailer(opt, transporter) {


        try {
            let options = {
                viewEngine: {
                    extname: '.hbs',
                    layoutsDir: './emails/',
                    defaultLayout: 'index',
                    partialsDir: './emails/partials',
                    helpers: {
                        base_url: function () {
                            let baseUrl = config.baseUrl;
                            return baseUrl;

                        },
                        logo_url: function () {

                            let baseUrl = config.baseUrl + '/assets/images/logo.png';
                            return baseUrl;

                        },
                        /* sender_name: function () {
                            return opt.sender_name;
                        }, */
                    }
                },
                viewPath: './emails/body/',
                extName: '.hbs',
            };
            /*if(opt.type ==='withoutHeader'){
                delete options.viewEngine.defaultLayout;   
              }*/

            let email_obj = {
                from: opt.from,
                to: opt.to,
                subject: opt.subject,
            };


            if (opt.cc) {
                email_obj.cc = opt.cc;
            }

            if (opt.text) {
                email_obj.text = opt.text;
            }
            if (opt.html) {
                email_obj.html = opt.html;
            }

            if (opt.template) {
                email_obj.template = opt.template;
            }

            if (opt.attachments) {
                email_obj.attachments = opt.attachments;
            }

            if (opt.context) {
                email_obj.context = opt.context;
            }

            transporter.use('compile', hbs(options));

            let mailsent = await transporter.sendMail(email_obj, function (resp) {
                return resp;
            });

            console.log("Email Status:->>>>>>>>>>>", mailsent);
            return mailsent;
        } catch (err) {
            console.log("Email Status err:->>>>>>>>>>>", err);
            return err;
        }

    }


    async send(opt) {

        try {

            if (config.mailTransporter === 'sendgrid') {

                let settingTitle = '',
                    settingEmail = '';

                if (settingTitle && settingEmail) {

                    Object.assign(opt, {
                        from: settingTitle + ' <' + settingEmail + '>'
                    });

                } else if (opt.from) {
                    Object.assign(opt, {
                        from: opt.from
                    });
                } else {
                    Object.assign(opt, {
                        from: this.authDetail.from
                    });
                }



                return await this.sendgridSMTP(opt);

            }

        } catch (err) {
            console.log("Email Status err 2:->>>>>>>>>>>", err);
            return err;

        }


    }
}


export default new Mail();