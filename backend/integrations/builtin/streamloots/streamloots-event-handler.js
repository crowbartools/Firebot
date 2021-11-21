"use strict";

const logger = require("../../../logwrapper");

const eventManager = require("../../../events/EventManager");

const EVENT_SOURCE_ID = "streamloots";
const EventId = {
    PURCHASE: "purchase",
    REDEMPTION: "redemption"
};

const eventSourceDefinition = {
    id: EVENT_SOURCE_ID,
    name: "StreamLoots",
    description: "Purchase/Redemption events from StreamLoots",
    events: [
        {
            id: EventId.PURCHASE,
            name: "Chest Purchase",
            description: "When someone purchases or gifts chests.",
            cached: false
        },
        {
            id: EventId.REDEMPTION,
            name: "Card Redemption",
            description: "When someone redeems a card.",
            cached: false
        }
    ]
};

exports.registerEvents = () => {
    eventManager.registerEventSource(eventSourceDefinition);
};

function getFieldValue(fieldName, fields) {
    if (fields == null) {
        return null;
    }
    let field = fields.find(f => f.name === fieldName);
    return field ? field.value : null;
}

exports.processStreamLootsEvent = (eventData) => {

    logger.debug("Received StreamLoots event:", eventData);

    let metadata = {
        imageUrl: eventData.imageUrl,
        soundUrl: eventData.soundUrl
    };

    let streamlootsEventType = eventData.data.type;

    metadata.message = getFieldValue("message", eventData.data.fields);
    metadata.username = getFieldValue("username", eventData.data.fields);

    let eventId;
    if (streamlootsEventType === "purchase") {
        eventId = EventId.PURCHASE;

        let quantity = getFieldValue("quantity", eventData.data.fields);
        let giftee = getFieldValue("giftee", eventData.data.fields);

        metadata.quantity = quantity;
        metadata.giftee = giftee;

    } else if (streamlootsEventType === "redemption") {
        eventId = EventId.REDEMPTION;

        let cardRarity = getFieldValue("rarity", eventData.data.fields);
        metadata.cardRarity = cardRarity;
        metadata.cardName = eventData.data.cardName;
    }

    eventManager.triggerEvent(EVENT_SOURCE_ID, eventId, metadata);
};