"use strict";

const { ComparisonType } = require("../../../../shared/filter-constants");

module.exports = {
    id: "firebot:message-text",
    name: "Message Text",
    description: "Filter based on chat message text",
    events: [
        { eventSourceId: "twitch", eventId: "chat-message" },
        { eventSourceId: "twitch", eventId: "announcement" }
    ],
    comparisonTypes: [
        ComparisonType.IS,
        ComparisonType.IS_NOT,
        ComparisonType.CONTAINS,
        ComparisonType.DOESNT_CONTAIN,
        ComparisonType.STARTS_WITH,
        ComparisonType.DOESNT_STARTS_WITH,
        ComparisonType.ENDS_WITH,
        ComparisonType.DOESNT_END_WITH,
        ComparisonType.MATCHES_REGEX_CS,
        ComparisonType.DOESNT_MATCH_REGEX_CS,
        ComparisonType.MATCHES_REGEX,
        ComparisonType.DOESNT_MATCH_REGEX
    ],
    valueType: "text",
    predicate: (filterSettings, eventData) => {

        const { comparisonType, value } = filterSettings;
        const { eventMeta } = eventData;

        /**
         * @type {string}
         */
        const chatMessage = eventMeta.messageText || "";

        switch (comparisonType) {
            case ComparisonType.IS:
                return chatMessage === value;
            case ComparisonType.IS_NOT:
                return chatMessage !== value;
            case ComparisonType.CONTAINS:
                return chatMessage.includes(value);
            case ComparisonType.DOESNT_CONTAIN:
                return !chatMessage.includes(value);
            case ComparisonType.STARTS_WITH:
                return chatMessage.startsWith(value);
            case ComparisonType.DOESNT_STARTS_WITH:
                return !chatMessage.startsWith(value);
            case ComparisonType.ENDS_WITH:
                return chatMessage.endsWith(value);
            case ComparisonType.DOESNT_END_WITH:
                return !chatMessage.endsWith(value);
            case ComparisonType.MATCHES_REGEX: {
                const regex = new RegExp(value, "gi");
                return regex.test(chatMessage);
            }
            case ComparisonType.DOESNT_MATCH_REGEX: {
                const regex = new RegExp(value, "gi");
                return !regex.test(chatMessage);
            }
            case ComparisonType.MATCHES_REGEX_CS: {
                const regex = new RegExp(value, "g");
                return regex.test(chatMessage);
            }
            case ComparisonType.DOESNT_MATCH_REGEX_CS: {
                const regex = new RegExp(value, "g");
                return !regex.test(chatMessage);
            }
            default:
                return false;
        }
    }
};