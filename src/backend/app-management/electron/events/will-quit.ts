import { Event, app } from "electron";

let hasCleanedUp = false;

async function cleanup() {
    const {
        handleProfileDeletion,
        handleProfileRename
    } = require("../../../app-management/profile-tasks");
    handleProfileRename();
    handleProfileDeletion();
}

export function willQuit(event: Event) {
    const logger = require("../../../logwrapper");

    if (!hasCleanedUp) {
        event.preventDefault();
        logger.debug("Will quit triggered, doing clean up...");
        cleanup().then(() => {
            hasCleanedUp = true;
            logger.debug("...clean up complete");
            app.quit();
        });
        return;
    }

    logger.debug("App quitting");
}