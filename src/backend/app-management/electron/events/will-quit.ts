import { app, type Event } from "electron";
import logger from "../../../logwrapper";

async function cleanup() {
    const { handleProfileDeletion, handleProfileRename } = await import("../../../app-management/profile-tasks");
    handleProfileRename();
    handleProfileDeletion();

    const { EventManager } = await import("../../../events/event-manager");
    await EventManager.triggerEvent("firebot", "before-firebot-closed", {
        username: "Firebot"
    });
}

export async function willQuit(event: Event) {
    const { AppCloseListenerManager } = await import("../../app-close-listener-manager");

    logger.debug("Will quit event triggered");

    event.preventDefault();

    logger.debug("Running app close listeners...");

    try {
        await AppCloseListenerManager.runListeners();
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