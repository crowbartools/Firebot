import frontendCommunicator from "../common/frontend-communicator";
import logger from "../logwrapper";

let pendingSetupFilePath: string;
let windowReady = false;

function sendSetupPathToFrontend(path) {
    frontendCommunicator.send("setup-opened", path);
}

export function setWindowReady(ready: boolean) {
    windowReady = ready;
    if (windowReady && pendingSetupFilePath) {
        sendSetupPathToFrontend(pendingSetupFilePath);
        pendingSetupFilePath = null;
    }
};

export function checkForFirebotSetupInPath(filePath: string) {
    if (filePath.endsWith(".firebotsetup")) {
        logger.info("Firebot setup file opened!", filePath);
        if (windowReady) {
            sendSetupPathToFrontend(filePath);
        } else {
            pendingSetupFilePath = filePath;
        }
        return true;
    }
    return false;
};

export function checkForFirebotSetupPathInArgs(args: string[]) {
    if (args == null) {
        return;
    }
    for (const arg of args) {
        checkForFirebotSetupInPath(arg);
    }
};