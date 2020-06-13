"use strict";

const { ComparisonType } = require("../../../../shared/filter-constants");

module.exports = {
    id: "firebot:message-text",
    name: "Message Text",
    description: "Filter based on chat message text",
    events: [
        { eventSourceId: "mixer", eventId: "chat-message" }
    ],
    comparisonTypes: [ComparisonType.IS, ComparisonType.IS_NOT, ComparisonType.CONTAINS, ComparisonType.MATCHES_REGEX],
    valueType: "text",
    predicate: (filterSettings, eventData) => {

        let { comparisonType, value } = filterSettings;
        let { eventMeta } = eventData;

        let chatMessage = "";
        let chatEvent = eventMeta.data;
        chatEvent.message.message.forEach(m => {
            chatMessage += m.text;
        });

        switch (comparisonType) {
        case ComparisonType.IS:
            return chatMessage === value;
        case ComparisonType.IS_NOT:
            return chatMessage !== value;
        case ComparisonType.CONTAINS:
            return chatMessage.includes(value);
        case ComparisonType.MATCHES_REGEX: {
            let regex = new RegExp(value, "gi");
            return regex.test(chatMessage);
        }
        default:
            return false;
        }
    }
};