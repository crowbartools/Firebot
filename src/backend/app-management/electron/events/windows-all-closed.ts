import { app } from "electron";
import logger from "../../../logwrapper";

export function windowsAllClosed() {
    logger.debug("All windows closed triggered");

    app.quit();
};