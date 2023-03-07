"use strict";

exports.willQuit = () => {
    const logger = require("../../../logwrapper");
    logger.info("Will quit triggered [REMOVE LATER]");
    const {
        handleProfileDeletion,
        handleProfileRename
    } = require("../../../app-management/profile-tasks");
    handleProfileRename();
    handleProfileDeletion();
};