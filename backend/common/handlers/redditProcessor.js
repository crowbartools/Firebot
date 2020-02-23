"use strict";

const chat = require("../mixer-chat.js");
const mediaProcessor = require("./mediaProcessor");
const settings = require("../settings-access").settings;
const logger = require("../../logwrapper");
const webServer = require("../../../server/httpServer");
const request = require("request");

function postPicker(posts) {
    while (posts.length) {
        let randomNum = Math.floor(Math.random() * posts.length);
        let item = posts[randomNum]['data'];

        // Tests
        let over18 = item['over_18'];
        let image = item['preview']['images'][0]['source']['url'];
        let ups = item['ups'];
        let downs = item['downs'];
        if (over18 !== true && image != null && ups > downs) {
            return image;
        }

        // Failed Tests
        posts.splice(randomNum, 1); // Remove the item from the array
    }

    return false;
}

function getSubredditData(subName) {
    return new Promise(resolve => {
        let normalizedSubName = subName.replace("/r/", '').replace("r/", '');
        request.get(`https://www.reddit.com/r/${normalizedSubName}/hot.json?count=15&raw_json=1`, { json: true }, (error, response, body) => {
            if (response.statusCode === 200) {
                resolve(body && body.data && body.data.children);
            } else {
                logger.warning(`Error getting subreddit ${subName}`, error);
                resolve(null);
            }
        });
    });
}

// Pulls a random image from a subreddit.
async function randomReddit(effect) {
    let chatter = effect.chatter;

    // Take the user input subreddit and clean it up incase they included /r/.
    let subName = effect.reddit;

    let subData = await getSubredditData(subName);


    if (subData == null) {
        logger.error("Couldn't find any valid posts in the subreddit.");
        renderWindow.webContents.send(
            "error",
            "Couldn't find any valid posts in the subreddit."
        );
        return false;
    }

    // Get our random post image url.
    let url = postPicker(subData);
    if (url === false) {
        logger.error("Couldn't find any valid posts in the subreddit.");
        renderWindow.webContents.send(
            "error",
            "Couldn't find any valid posts in the subreddit."
        );
        return false;
    }

    // Okay, now let's send it off.
    try {
        if (effect.show === "chat" || effect.show === "both") {
            // Send Chat
            logger.info("Random Reddit: " + url);
            chat.broadcast(chatter, "Random Reddit: " + url);
        }

        if (effect.show === "overlay" || effect.show === "both") {
            // Send image to overlay.
            let position = effect.position,
                data = {
                    url: url,
                    imageType: "url",
                    imagePosition: position,
                    imageHeight: effect.height,
                    imageWidth: effect.width,
                    imageDuration: effect.length,
                    enterAnimation: effect.enterAnimation,
                    exitAnimation: effect.exitAnimation,
                    customCoords: effect.customCoords
                };

            // Get random location.
            if (position === "Random") {
                position = mediaProcessor.getRandomPresetLocation();
            }

            if (settings.useOverlayInstances()) {
                if (effect.overlayInstance != null) {
                    if (
                        settings
                            .getOverlayInstances()
                            .includes(effect.overlayInstance)
                    ) {
                        data.overlayInstance = effect.overlayInstance;
                    }
                }
            }

            // Send to overlay.
            webServer.sendToOverlay("image", data);
        }
    } catch (err) {
        renderWindow.webContents.send(
            "error",
            "There was an error sending a reddit picture."
        );
    }
}

// Export Functions
exports.go = randomReddit;
