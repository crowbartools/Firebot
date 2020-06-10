"use strict";

const { ComparisonType } = require("../../../../shared/filter-constants");

module.exports = {
    id: "firebot:skill-name",
    name: "Skill Name",
    description: "Filter by the name of the Skill",
    events: [
        { eventSourceId: "mixer", eventId: "skill" }
    ],
    comparisonTypes: [ComparisonType.IS, ComparisonType.IS_NOT, ComparisonType.CONTAINS, ComparisonType.MATCHES_REGEX],
    valueType: "text",
    predicate: (filterSettings, eventData) => {

        let { comparisonType, value } = filterSettings;
        let { eventMeta } = eventData;

        let skill = eventMeta.data.skill;

        if (!skill) {
            return false;
        }

        let skillName = skill["skill_name"] && skill["skill_name"].toLowerCase();
        let filterSkillName = value && value.toLowerCase();

        switch (comparisonType) {
        case ComparisonType.IS:
            return skillName === filterSkillName;
        case ComparisonType.IS_NOT:
            return skillName !== filterSkillName;
        case ComparisonType.CONTAINS:
            return skillName.includes(filterSkillName);
        case ComparisonType.MATCHES_REGEX: {
            let regex = new RegExp(filterSkillName, "gi");
            return regex.test(skillName);
        }
        default:
            return false;
        }
    }
};