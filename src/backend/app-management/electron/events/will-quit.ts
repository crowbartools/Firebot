import { Event, app } from "electron";

async function cleanup() {
    const { ProfileManager } = require("../../../common/profile-manager");
    ProfileManager.handleProfileRename();
    ProfileManager.handleProfileDeletion();

    const eventManager = require("../../../events/EventManager");
    await eventManager.triggerEvent("firebot", "before-firebot-closed", {
        username: "Firebot"
    });
}

export async function willQuit(event: Event) {
    const logger = require("../../../logwrapper");

    logger.debug("Will quit event triggered");

    event.preventDefault();

    logger.debug("Doing clean up...");

    await cleanup();

    logger.debug("...clean up complete. Exiting app");

    app.exit();
}
