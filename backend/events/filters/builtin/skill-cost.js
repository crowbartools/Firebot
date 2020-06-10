"use strict";

module.exports = {
    id: "firebot:skill-cost",
    name: "Cost",
    description: "Filter by the cost of the Skill",
    events: [
        { eventSourceId: "mixer", eventId: "skill" }
    ],
    comparisonTypes: ["is", "is not", "less than", "greater than"],
    valueType: "number",
    predicate: (filterSettings, eventData) => {

        let { comparisonType, value } = filterSettings;
        let { eventMeta } = eventData;

        let skill = eventMeta.data.skill;

        if (!skill) {
            return false;
        }

        switch (comparisonType) {
        case "is": {
            return skill.cost === value;
        }
        case "is not": {
            return skill.cost !== value;
        }
        case "less than": {
            return skill.cost < value;
        }
        case "greater than": {
            return skill.cost > value;
        }
        default:
            return false;
        }
    }
};