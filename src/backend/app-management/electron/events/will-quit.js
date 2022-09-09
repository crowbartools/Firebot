"use strict";

exports.willQuit = () => {
    const {
        handleProfileDeletion,
        handleProfileRename
    } = require("../../../app-management/profile-tasks");
    handleProfileRename();
    handleProfileDeletion();
};