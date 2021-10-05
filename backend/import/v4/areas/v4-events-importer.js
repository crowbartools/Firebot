"use strict";
const path = require("path");
const logger = require("../../../logwrapper");
const uuid = require("uuid/v1");
const importHelpers = require("../import-helpers");
const effectsMapper = require("../v4-effect-mapper");
const eventsAccess = require("../../../events/events-access");

//v4 event types are keys, supported v5 types are values
const v4EventTypeMap = {
    "FOLLOWED": {
        eventId: "followed",
        sourceId: "mixer"
    },
    "HOSTED": {
        eventId: "hosted",
        sourceId: "mixer"
    },
    "SUBSCRIBED": {
        eventId: "subscribed",
        sourceId: "mixer"
    },
    "CHAT_CONNECTED": {
        eventId: "chat-connected",
        sourceId: "firebot"
    },
    "POLL_STARTED": {
        eventId: "poll-started",
        sourceId: "mixer"
    },
    "POLL_ENDED": {
        eventId: "poll-ended",
        sourceId: "mixer"
    },
    "CHAT_MESSAGE": {
        eventId: "chat-message",
        sourceId: "mixer"
    },
    "USER_JOINED_CHAT": {
        eventId: "user-joined-chat",
        sourceId: "mixer"
    },
    "USER_LEAVE_CHAT": {
        eventId: "user-left-chat",
        sourceId: "mixer"
    },
    "MESSAGE_DELETED": {
        eventId: "message-deleted",
        sourceId: "mixer"
    },
    "MESSAGE_PURGED": {
        eventId: "messages-purged",
        sourceId: "mixer"
    },
    "CHAT_CLEARED": {
        eventId: "chat-cleared",
        sourceId: "mixer"
    },
    "USER_BANNED": {
        eventId: "user-banned",
        sourceId: "mixer"
    },
    "EXTRALIFE_DONATION": null,
    "SKILL": {
        eventId: "skill",
        sourceId: "mixer"
    },
    "SKILL_GIF": {
        eventId: "skill",
        sourceId: "mixer"
    },
    "SKILL_STICKER": {
        eventId: "skill",
        sourceId: "mixer"
    },
    "SKILL_EFFECTS": {
        eventId: "skill",
        sourceId: "mixer"
    },
    "SKILL_EMBERS": {
        eventId: "skill",
        sourceId: "mixer"
    },
    "SKILL_STICKER_EMBERS": {
        eventId: "skill",
        sourceId: "mixer"
    },
    "PATRONAGE_MILESTONE_REACHED": {
        eventId: "patronage-milestone",
        sourceId: "mixer"
    },
    "SUB_GIFTED": {
        eventId: "subscription-gifted",
        sourceId: "mixer"
    }
};

async function checkForV4Events() {
    const v4EventsPath = path.join(importHelpers.v4DataPath, "/live-events/events.json");
    const v4EventsDetected = await importHelpers.pathExists(v4EventsPath);
    return v4EventsDetected;
}

exports.run = async () => {
    let incompatibilityWarnings = [];

    let v4EventsExist = await checkForV4Events();

    if (v4EventsExist) {
        let v4EventsObj;
        try {
            let v4EventsDb = importHelpers.getJsonDbInV4Data("/live-events/events.json");
            v4EventsObj = v4EventsDb.getData("/");
        } catch (err) {
            logger.warn("Error while attempting to load v4 events db.", err);
        }

        if (v4EventsObj != null) {
            let v4Events = Object.values(v4EventsObj);
            for (let v4Event of v4Events) {
                if (v4Event.eventType == null) continue;
                let mappedV5EventInfo = v4EventTypeMap[v4Event.eventType];
                if (mappedV5EventInfo == null) continue;

                let v5Event = {
                    active: v4Event.active,
                    eventId: mappedV5EventInfo.eventId,
                    sourceId: mappedV5EventInfo.sourceId,
                    filterData: {
                        filters: [],
                        mode: "exclusive"
                    },
                    id: uuid(),
                    name: v4Event.eventName
                };

                if (v4Event.effects != null) {
                    let effectsMapResult = effectsMapper.mapV4EffectList(v4Event.effects, { type: "Event", name: v4Event.eventName });
                    if (effectsMapResult) {
                        v5Event.effects = effectsMapResult.effects;
                        effectsMapResult.incompatibilityWarnings.forEach(w => incompatibilityWarnings.push(w));
                    }
                }

                eventsAccess.saveNewEventToMainEvents(v5Event);
            }

            eventsAccess.triggerUiRefresh();
        }
    }

    return {
        success: true,
        incompatibilityWarnings: incompatibilityWarnings
    };
};