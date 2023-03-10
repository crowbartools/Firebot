import { screen, desktopCapturer } from "electron";
import logger from "../../logwrapper";

export function getAllDisplays() {
    return screen.getAllDisplays();
};

export function getPrimaryDisplay() {
    return screen.getPrimaryDisplay();
};

export function takeScreenshot(displayId) {
    const screens = screen.getAllDisplays();
    const matchingScreen = screens.find(d => d.id === displayId);

    const resolution = matchingScreen ? {
        width: matchingScreen.size.width * matchingScreen.scaleFactor,
        height: matchingScreen.size.height * matchingScreen.scaleFactor
    } : {
        width: 1920,
        height: 1080
    };

    desktopCapturer
        .getSources({
            types: ['screen'],
            thumbnailSize: resolution
        })
        .then(sources => {
            const foundSource = sources.find(s => s.display_id.toString() === displayId.toString());

            if (foundSource) {
                return foundSource.thumbnail.toDataURL();
            }

            return null;
        }, err => {
            logger.error("Failed to take screenshot", err.message);
            return null;
        })
        .catch(err => {
            logger.error('Failed to take screenshot', err.message);
            return null;
        });
};