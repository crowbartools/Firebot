"use strict";

exports.willQuit = () => {
    const logger = require("../../../logwrapper");
    logger.debug("Will quit triggered");
    const {
        handleProfileDeletion,
        handleProfileRename
    } = require("../../../app-management/profile-tasks");
    handleProfileRename();
    handleProfileDeletion();
};