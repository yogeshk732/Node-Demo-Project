import mongoose from "mongoose";

import crypto from "crypto";
import uniqueValidator from "mongoose-unique-validator";
const schema = mongoose.Schema;

import config from '../config/env';


const UserSchema = new schema({

    first_name: {
        type: String,
        lowercase: true,
        trim: true,
        required: [true, 'First name is required']
    },
    middle_name: {
        type: String,
        lowercase: true,
        trim: true
    },
    last_name: {
        type: String,
        lowercase: true,
        trim: true
    },
    dob: String,
    profile: String,
    password: {
        type: String,
        required: 'Password is required.',
        minlength: [4, 'Password must be atleast 4 characters long.']
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        unique: "Email already exists.",
        validate: {
            validator: function (email) {
                return /^([\w-\.+]+@([\w-]+\.)+[\w-]{2,4})?$/.test(email);
            },
            message: '{VALUE} is not a valid email address'
        },
        required: 'Email address is required.'
    },
    email_verify: {
        type: String,
        enum: ['new', 'verified', 'unverified'],
        default: 'new'
    },
    emailVerificationKey: String,
    phone: String,
    otp: String,
    phoneVerificationKey: String,
    phone_verify: {
        type: String,
        enum: ['new', 'verified', 'unverified'],
        default: 'new'
    },
    status: {
        type: Number,
        default: 2
    },
    passwordResetKey: String,
    address: {
        country: String,
        street: String,
        city: String,
        state: String,
        zip: Number
    },

    document: {
        documentType: String,
        documentNumber: String,
        expiryDate: String,
        documentStatus: {
            type: String,
            enum: ['verified', 'unverified'],
            default: 'unverified'
        }
    },
    tag: {
        type: String,
        lowercase: true,
        trim: true,
        required: [true, 'Tag is required']
    },
    security: {
        question: {
            type: String
        },
        answer: {
            type: String
        }
    },
    emailAlert: Number,
    role: {
        type: String,
        enum: ['admin', 'subscriber'],
        default: 'subscriber'
    }

}, {
    timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
});

/* Mongoose beforeSave Hook : To hash a password */
UserSchema.pre('save', function (next) {
    let user = this;

    if (this.isModified('password') || this.isNew) {

        if (this.isNew) {
            user.emailVerificationKey = crypto.createHash('md5').update((user.first_name + Math.floor((Math.random() * 1000) + 1))).digest("hex");
        }

        user.salt = crypto.randomBytes(16).toString('hex');
        if (user.password) {
            user.password = this.hashPassword(config.secret, user.password);
        }
        return next();
    } else {
        return next();
    }
});

/**
 * Create instance method for hashing a password
 */

UserSchema.methods.hashPassword = function (salt, password) {

    if (salt && password) {
        return crypto.createHmac('sha512', salt).update(password.toString()).digest('base64');
    } else {
        return password;
    }
};

UserSchema.statics.hashPassword = function (salt, password) {
    return crypto.createHmac('sha512', salt).update(password.toString()).digest('base64');
};

/* To check a password */
UserSchema.methods.comparePassword = function (salt, password) {
    return this.password === this.hashPassword(salt, password);
};


UserSchema.set('autoIndex', config.db.autoIndex);
UserSchema.plugin(uniqueValidator, {
    type: 'mongoose-unique-validator'
});

export default mongoose.model("user", UserSchema);