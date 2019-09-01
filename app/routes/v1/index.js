"use strict";

import "babel-polyfill";

import AdminRoutes from './admin-routes';
import UserRoutes from './user-routes';


module.exports = {
    userRoutes: UserRoutes.init(),
    adminRoutes: AdminRoutes.init()
};