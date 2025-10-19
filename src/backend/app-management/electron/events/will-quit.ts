import { Event, app } from "electron";
import appCloseListenerManager from "../../app-close-listener-manager";
import { EventManager } from "../../../events/event-manager";
import { handleProfileDeletion, handleProfileRename } from "../../../app-management/profile-tasks";
import logger from "../../../logwrapper";

async function cleanup() {
    handleProfileRename();
    handleProfileDeletion();

    await EventManager.triggerEvent("firebot", "before-firebot-closed", {
        username: "Firebot"
    });
}

export async function willQuit(event: Event) {

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