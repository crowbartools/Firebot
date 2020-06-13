"use strict";
const logger = require("../../../logwrapper");
const apiAccess = require("../../../api-access");
const eventManager = require("../../../events/EventManager");

module.exports = {
    event: "channel:{streamerChannelId}:skill",
    callback: (data) => {
        logger.debug("Constellation Skill Event");
        logger.debug(data);

        //if gif skill effect, extract url and send to frontend
        if (data && data.manifest) {
            logger.debug("Checking skill for gif...");
            if (data.manifest.name === "giphy") {
                logger.debug("Detected gif effect type");
                if (data.parameters && data.parameters.giphyId) {
                    logger.debug("Gif url is present, building url and sending to FE/triggering event");

                    let giphyHost = data.parameters.giphyHost || "media1.giphy.com",
                        giphyId = data.parameters.giphyId;

                    let gifUrl = `https://${giphyHost}/media/${giphyId}/giphy.gif`;

                    renderWindow.webContents.send('gifUrlForSkill', {
                        executionId: data.executionId,
                        gifUrl: gifUrl
                    });

                    let userId = data.parameters.userId;
                    logger.debug("Getting user data for id '" + userId + "' so we can trigger gif event");

                    // build a skill obj that matches what we get from SkillAttribution event via chat so theres consistency
                    let skill = {
                        "skill_id": 'ba35d561-411a-4b96-ab3c-6e9532a33027',
                        "skill_name": 'A Gif',
                        "execution_id": data.executionId,
                        "icon_url": 'https://static.mixer.com/img/design/ui/skills-chat-attribution/giphy_chat_24.png',
                        cost: data.price,
                        currency: data.currencyType,
                        isGif: true,
                        gifUrl: gifUrl
                    };

                    apiAccess.get(`users/${userId}`)
                        .then(userData => {

                            logger.debug("user data", userData);
                            logger.debug("Got user data, triggering gif event with url: " + gifUrl);

                            return userData.username;
                        }, () => {

                            logger.debug("Failed to get user data, firing event anyway");
                        })
                        .then(username => {
                            eventManager.triggerEvent("mixer", "skill", {
                                username: username ? username : "Unknown User",
                                data: {
                                    skill: skill
                                }
                            });
                        });
                }
            }
        }
    }
};