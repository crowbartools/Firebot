"use strict";

const chat = require("../mixer-chat.js");
const randomPuppy = require("random-puppy");
const requestImageSize = require("request-image-size");
const mediaProcessor = require("./mediaProcessor");
const settings = require("../settings-access").settings;
const logger = require("../../logwrapper");
const webServer = require("../../../server/httpServer");

// Imgur Broken Image Checker
// This checks the imgur image to see if it is 161px wide.
// This is a really weird way of doing it, but imgur is redirect hell and it's hard to get an accurate status code.
// The timeout is there because without it this function seems to fail during spamming.
function imageCheck(url) {
    return new Promise((resolve, reject) => {
        logger.info("Checking image...");
        setTimeout(function() {
            requestImageSize(url).then(
                size => {
                    if (size.width === 161) {
                        logger.info("Size is 161, most likely broken image. Retrying");
                        reject("retry");
                    } else {
                        logger.info("Image is good. Showing now.");
                        resolve(true);
                    }
                },
                err => {
                    logger.error("Error checking image.", err);
                    reject("retry");
                }
            );
        }, 500);
    });
}

// Pulls a random image from a subreddit.
function randomReddit(effect) {
    let chatter = effect.chatter;

    // Take the user input subreddit and clean it up incase they included /r/.
    let reddit = effect.reddit;
    let cleanReddit = reddit.replace("/r/", '').replace("r/", '');

    console.log(cleanReddit);
    console.log('---------------------------');

    // Let's pull an image!
    randomPuppy(cleanReddit).then(url => {
        imageCheck(url).then(
            () => {
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
                        "There was an error sending a cat picture."
                    );
                }
            },
            error => {
                logger.error(error);
                randomReddit(effect);
            }
        );
    });
}

// Export Functions
exports.go = randomReddit;
