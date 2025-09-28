import { Event, app } from "electron";
import appCloseListenerManager from "../../app-close-listener-manager";


async function cleanup() {
    const {
        handleProfileDeletion,
        handleProfileRename
    } = require("../../../app-management/profile-tasks");
    handleProfileRename();
    handleProfileDeletion();

    const eventManager = require("../../../events/EventManager");
    await eventManager.triggerEvent("firebot", "before-firebot-closed", {
        username: "Firebot"
    });
}

export async function willQuit(event: Event) {
    const logger = require("../../../logwrapper");

    logger.debug("Will quit event triggered");

    event.preventDefault();

    logger.debug("Running app close listeners...");

    try {
        await appCloseListenerManager.runListeners();
    } catch {}

    logger.debug("App close listeners complete.");

    logger.debug("Doing clean up...");

    try {
        await cleanup();
    } catch (e) {
        logger.error("Error during cleanup before app exit", e);
    }

    logger.debug("...clean up complete. Exiting app");

    app.exit();
}
