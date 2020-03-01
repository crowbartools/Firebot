"use strict";

const { ComparisonType } = require("../../../../shared/filter-constants");

module.exports = {
    id: "firebot:message-type",
    name: "Message Type",
    description: "Filter by whether or not a message is a whisper",
    events: [
        { eventSourceId: "mixer", eventId: "chat-message" }
    ],
    comparisonTypes: [ComparisonType.IS, ComparisonType.IS_NOT],
    valueType: "preset",
    presetValues: () => {
        return [
            {
                value: "whisper",
                display: "Whisper"
            }
        ];
    },
    getSelectedValueDisplay: (filterSettings) => {

        if (filterSettings.value == null) {
            return "[Not set]";
        }

        return "Whisper";
    },
    predicate: (filterSettings, eventData) => {

        let { comparisonType } = filterSettings;
        let { eventMeta } = eventData;

        let isWhisper = eventMeta.data.message.meta.whisper === true;

        if (comparisonType === ComparisonType.IS) {
            return isWhisper;
        } else if (comparisonType === ComparisonType.IS_NOT) {
            return !isWhisper;
        }

        return false;
    }
};