import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const SECONDS_IN_MINUTE = 60;
const SECONDS_IN_HOUR = SECONDS_IN_MINUTE * 60;
const SECONDS_IN_DAY = SECONDS_IN_HOUR * 24;
const SECONDS_IN_WEEK = SECONDS_IN_DAY * 7;
const SECONDS_IN_YEAR = SECONDS_IN_DAY * 365;

const SUFFIXES = [
    ["yr", "yrs", "year", "years"],
    ["wk", "wks", "week", "weeks"],
    ["day", "days", "day", "days"],
    ["hr", "hrs", "hour", "hours"],
    ["min", "mins", "minute", "minutes"],
    ["sec", "secs", "second", "seconds"]
];

const divide = (nom: number, dom: number) => [Math.trunc(nom / dom), nom % dom];

const model : ReplaceVariable = {
    definition: {
        handle: 'formatDuration',
        description: 'Formats an input number of seconds into a human-readable duration',
        usage: 'formatDuration[seconds]',
        examples: [
            {
                usage: 'formatDuration[61, raw]',
                description: 'Returns an array containing the number of years, weeks, days, hours, minutes and seconds in that order for the duration'
            }, {
                usage: 'formatDuration[61, long]',
                description: 'Returns the duration in the long format, omitting 0-based values: 1 minute and 1 second'
            }, {
                usage: 'formatDuration[61, long, true]',
                description: 'Returns the duration in the long format, omitting 0-based values: 1 minute and 1 second'
            }, {
                usage: 'formatDuration[61, long, false]',
                description: 'Returns the duration in the long format: 0 years, 0 weeks, 0 days, 0 hours, 1 minute and 1 second'
            }, {
                usage: 'formatDuration[61, colon]',
                description: 'Returns the duration in the colon format, omitting leading 0-based values: 1:1'
            }, {
                usage: 'formatDuration[61, colon, true]',
                description: 'Returns the duration in the colon format, omitting leading 0-based values: 1:1'
            }, {
                usage: 'formatDuration[61, colon, false]',
                description: 'Returns the duration in the colon format: 0:0:0:0:1:1'
            }, {
                usage: 'formatDuration[61, colon-alt]',
                description: 'Returns the duration in the colon with padding format, omitting leading 0-based values: 01:01'
            }, {
                usage: 'formatDuration[61, colon-alt, true]',
                description: 'Returns the duration in the colon with padding format, omitting leading 0-based values: 01:01'
            }, {
                usage: 'formatDuration[61, colon-alt, false]',
                description: 'Returns the duration in the colon with padding format: 00:00:00:00:01:01'
            }, {
                usage: 'formatDuration[61, short]',
                description: 'Returns the duration in the short format, omitting 0-based values: 1min 1sec'
            }, {
                usage: 'formatDuration[61, short, true]',
                description: 'Returns the duration in the short format, omitting 0-based values: 1min 1sec'
            }, {
                usage: 'formatDuration[61, short, false]',
                description: 'Returns the duration in the short format: 0yrs 0wks 0days 0hrs 1min 1sec'
            }, {
                usage: 'formatDuration[61, short-alt]',
                description: 'Returns the duration in the short with spaces format, omitting 0-based values: 1 min 1 sec'
            }, {
                usage: 'formatDuration[61, short-alt, true]',
                description: 'Returns the duration in the short with spaces format, omitting 0-based values: 1 min 1 sec'
            }, {
                usage: 'formatDuration[61, short-alt, false]',
                description: 'Returns the duration in the short with spaces format: 0 yrs 0 wks 0 days 0 hrs 1 min 1 sec'
            }
        ],
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.ARRAY]
    },
    evaluator(trigger: Trigger, seconds, format, omit = true) {

        let alt = false;
        format = `${format}`.toLowerCase();
        switch (format) {
            case 'raw':
            case 'colon':
            case 'long':
                break;

            case 'colon-alt':
                alt = true;
                format = 'colon';
                break;

            case 'short-alt':
                alt = true;
                format = 'short';
                break;

            default:
                format = 'short';
        }

        omit = (omit === true || omit === "true");

        seconds = Number(seconds);

        let years: number, weeks: number, days: number, hours: number, minutes: number;
        [years, seconds] = divide(<number>seconds, SECONDS_IN_YEAR);
        [weeks, seconds] = divide(<number>seconds, SECONDS_IN_WEEK);
        [days, seconds] = divide(<number>seconds, SECONDS_IN_DAY);
        [hours, seconds] = divide(<number>seconds, SECONDS_IN_HOUR);
        [minutes, seconds] = divide(<number>seconds, SECONDS_IN_MINUTE);

        if (format === 'raw') {
            return [years, weeks, days, hours, minutes, seconds];
        }

        let blocks = [
            [years, ...SUFFIXES[0]],
            [weeks, ...SUFFIXES[1]],
            [days, ...SUFFIXES[2]],
            [hours, ...SUFFIXES[3]],
            [minutes, ...SUFFIXES[4]],
            [<number>seconds, ...SUFFIXES[5]]
        ];

        // Formats: colon, colon-alt
        if (format === 'colon') {
            if (omit === true) {
                while (blocks.length > 0 && blocks[0][0] === 0) {
                    blocks.shift();
                }
            }
            if (blocks.length === 0) {
                return alt ? '00' : '0';
            }
            return blocks.map(block => (alt ? `${block[0]}`.padStart(2, '0') : `${block[0]}`)).join(':');
        }

        // omit values of 0
        if (omit === true) {
            blocks = blocks.filter(block => block[0] !== 0);
        }

        // Format: long
        if (format === 'long') {
            if (blocks.length === 0) {
                return '0 seconds';
            }
            if (blocks.length === 1) {
                return `${blocks[0][0]} ${blocks[0][0] === 1 ? blocks[0][3] : blocks[0][4]}`;
            }

            return blocks
                .map(block => `${block[0]} ${block[0] === 1 ? block[3] : block[4]}`)
                .reduce((result, block, index) => {
                    if (index === 0) {
                        return block;
                    }
                    if (index === (blocks.length - 1)) {
                        return `${result} and ${block}`;
                    }
                    return `${result}, ${block}`;
                }, '');
        }

        // Format: short, short-alt
        if (blocks.length === 0) {
            return alt ? '0 secs' : '0secs';
        }
        return blocks.map(block => `${block[0]}${alt ? ' ' : ''}${block[0] === 1 ? block[1] : block[2]}`).join(' ');
    }
};


export default model;