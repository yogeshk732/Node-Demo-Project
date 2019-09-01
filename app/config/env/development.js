"use strict";
export default {
    port: process.env.PORT,
    admin: {
        path: "/manager"
    },
    sessionSecret: process.env.SESSION_SECRET,
    /**prefix for endpoints */
    API: {
        admin: "/admin_api/"
    },
    baseUrl: process.env.BASE_URL,

    adminBaseUrl: process.env.ADMIN_BASE_URL,

    /**url on which client app(frontend) is serving  */
    apiBaseUrl: process.env.API_BASE_URL,
    /**email */
    mailTransporter: 'sendgrid',
    sendgrid: {
        service: 'SendGrid',
        auth: {
            api_user: process.env.SENDGRID_API_USER,
            api_key: process.env.SENDGRID_API_KEY
        },
        from: process.env.EMAIL_FROM
    },



    /**database configuration */
    db: {
        name: process.env.DATABASE_NAME,
        URL: process.env.MONGO_URL,
        options: {
            user: "",
            pass: ""
        }
    },
    twilio: {
        accountSid: process.env.TWILIO_ACCOUNTSID,
        authToken: process.env.TWILIO_AUTHTOKEN,
        from: process.env.TWILIO_FROM
    },

    fileBasePath: `${process.env.API_BASE_URL}/uploads`,
    /**listing */
    listing: {
        limit: 1000 //no. of records to be send per page
    },
    otp: {
        expireTime: 60000 // in second
    },
    /**directories */
    dir: {
        documents: "uploads" //directory name for uploading documents
    },
    /**Seceret key used by jwt to create  jwt token and verifying it */
    secret: process.env.JWT_SECRET,
    /**secret key use to encrpty data at db */
    dbSecret: Buffer.from(`${process.env.DB_SECRET}`).toString("base64"),
    /**secret key use to encrpty data in transport layer */
    transitSecret: process.env.TRANSIT_SECRET,
    /**to stop morgon make it false */
    debug_mongo: true,
    /**environment */
    dev: true,
    /**transport layer encryption  */
    transitEncryption: false
};