"use strict";
const logger = require("../../../logwrapper");

module.exports = {
    accountType: "streamer",
    event: "SkillAttribution",
    callback: (data) => {
        const eventManager = require("../../../events/EventManager");

        logger.debug("SkillAtro Chat Skill event");
        logger.debug(data);

        data.fbEvent = 'Skill';
        data.skill.isSticker = false;

        let isGif = data.skill.skill_id === 'ba35d561-411a-4b96-ab3c-6e9532a33027' ||
            data.skill.skill_name.toLowerCase().includes("gif");

        // we trigger skill events for gifs via constellation instead because we have access to gif url there
        if (!isGif) {
            eventManager.triggerEvent("mixer", "skill", {
                username: data.user_name,
                data: {
                    skill: data.skill
                }
            });
        }

        renderWindow.webContents.send('eventlog', {
            type: "general",
            username: data['user_name'],
            event: `used the Skill "${data.skill.skill_name}" Cost: ${data.skill.cost} ${data.skill.currency}`
        });

        renderWindow.webContents.send('nonChatSkill', data);
    }
};