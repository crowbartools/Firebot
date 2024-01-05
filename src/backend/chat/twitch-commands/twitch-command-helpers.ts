export class TwitchCommandHelpers {
    static getRawDurationInSeconds(rawDuration: string, originalUnit: "seconds" | "minutes" | "hours" | "days" | "weeks" = "seconds"): number {
        if (rawDuration == null) {
            return 0;
        }

        rawDuration = rawDuration.trim();

        if (rawDuration.length === 0) {
            return 0;
        }

        // Is it just a number?
        const digitsOnlyRegEx = /^\d+$/;
        if (digitsOnlyRegEx.test(rawDuration) === true) {
            const parsedDuration = parseInt(rawDuration);

            if (parsedDuration < 0) {
                return null;
            }

            switch (originalUnit.toLowerCase()) {
                case "months":
                    return parsedDuration * 60 * 60 * 24 * 30;

                case "weeks":
                    return parsedDuration * 60 * 60 * 24 * 7;

                case "days":
                    return parsedDuration * 60 * 60 * 24;

                case "hours":
                    return parsedDuration * 60 * 60;

                case "minutes":
                    return parsedDuration * 60;

                case "seconds":
                    return parsedDuration;
            }


        }

        // Or is it a Twitch shorthand value?
        const shorthandMatchRegEx = /^(\d+)(\w+)$/;

        const [, count, unit] = rawDuration.trim().match(shorthandMatchRegEx);
        const parsedCount = parseInt(count);

        if (count == null || unit == null || Number.isNaN(parsedCount)) {
            return null;
        }

        switch (unit.toLowerCase()) {
            case "mo":
                return parsedCount * 60 * 60 * 24 * 30;

            case "w":
                return parsedCount * 60 * 60 * 24 * 7;

            case "d":
                return parsedCount * 60 * 60 * 24;

            case "h":
                return parsedCount * 60 * 60;

            case "m":
                return parsedCount * 60;

            case "s":
                return parsedCount;

            default:
                return null;
        }
    }

    static getNormalizedUsername(rawUsername: string): string {
        rawUsername = rawUsername.trim();

        if (rawUsername.startsWith("@")) {
            return rawUsername.substring(1);
        }

        return rawUsername;
    }
}