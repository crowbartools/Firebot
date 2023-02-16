// Migration: info needed
"use strict";
const moment = require("moment");
const logger = require("../../logwrapper");
const { EffectTrigger } = require("../../../shared/effect-constants");
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");
const triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.EVENT] = true;
triggers[EffectTrigger.MANUAL] = true;
triggers[EffectTrigger.CUSTOM_SCRIPT] = true;
triggers[EffectTrigger.PRESET_LIST] = true;
triggers[EffectTrigger.CHANNEL_REWARD] = true;
const model = {
    definition: {
        handle: "discordTimestamp",
        description: "Outputs a discord timestamp that shows the appropriate time for all users in their own timezone.",
        usage: "discordTimestamp[]",
        examples: [
            {
                usage: "discordTimestamp[]",
                description: "Create discord timestamp using your current time."
            },
            {
                usage: "discordTimestamp[2076-01-26 13:00:00]",
                description: "Create discord timestamp using specified time, in default discord format."
            },
            {
                usage: "discordTimestamp[2076-01-26 13:00:00:t]",
                description: "Create a 'short time' discord timestamp. EX: 01:00 | 1:00 PM"
            },
            {
                usage: "discordTimestamp[2076-01-26 13:00:00:T]",
                description: "Create a 'long time' discord timestamp. EX: 01:00:00 | 01:00:00 PM"
            },
            {
                usage: "discordTimestamp[2076-01-26 13:00:00:d]",
                description: "Create a 'short date' discord timestamp. EX: 1/26/2076 | 26/01/2076"
            },
            {
                usage: "discordTimestamp[2076-01-26 13:00:00:D]",
                description: "Create a 'long date' discord timestamp. EX: January 26, 2076 | 26 January 2076"
            },
            {
                usage: "discordTimestamp[2076-01-26 13:00:00:f]",
                description: "Create a 'short date/time' discord timestamp. EX: January 26, 2076 1:00 PM | 26 January 2076 13:00"
            },
            {
                usage: "discordTimestamp[2076-01-26 13:00:00:F]",
                description: "Create a 'long date/time' discord timestamp. EX: Sunday, January 26, 2076 1:00 PM | Sunday, 26 January 2076, 13:00"
            },
            {
                usage: "discordTimestamp[2076-01-26 13:00:00:R]",
                description: "Create a 'relative' discord timestamp. EX: 'in 53 years' | 'in 23 minutes'"
            },
            {
                usage: "discordTimestamp[13:00:00]",
                description: "Create discord timestamp using a specified time on the current date."
            },
            {
                usage: "discordTimestamp[now, R]",
                description: "Create discord timestamp using current date and time in a specified format."
            }
        ],
        triggers: triggers,
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, dateString, format) => {
        let timestamp = moment().unix();
        const validFormats = [
            't',
            'T',
            'd',
            'D',
            'f*',
            'F',
            'R'
        ];

        // Create dateString using current time if no dateString provided.
        if (dateString == null || dateString === 'now') {
            dateString = moment().format('YYYY-MM-DD HH:mm:ss');
        }

        dateString = dateString.trim();

        // If user only includes time, assume they want that time on the current day.
        if (!dateString.includes('-')) {
            let userDate = new Date();
            const offset = userDate.getTimezoneOffset();
            userDate = new Date(userDate.getTime() - (offset * 60 * 1000));
            userDate = userDate.toISOString().split('T')[0];
            dateString = `${userDate} ${dateString}`;
        }

        // Now, validate dateString format.
        if (!moment(dateString, 'YYYY-MM-DD HH:mm:ss', true).isValid()) {
            logger.error(`Incorrect date format provided to discord timestamp.`);
            return '[Incorrect date format]';
        }

        // Convert dateString to unix for discord.
        timestamp = moment(dateString, 'YYYY-MM-DD HH:mm:ss').unix();

        // If no format given, use discord default.
        if (format == null || format === '') {
            return `<t:${timestamp}>`;
        }

        format = format.trim();

        // Validate format is a valid discord format. If not, log error and use discord default format.
        if (!validFormats.includes(format)) {
            logger.error(`Incorrect format passed to discord timestamp, using discord defaults.`);
            return `<t:${timestamp}>`;
        }

        // Otherwise, use the given format.
        return `<t:${timestamp}:${format}>`;
    }
};
module.exports = model;