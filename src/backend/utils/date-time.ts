import { DateTime, Duration, DurationLikeObject } from "luxon";

function getHumanizedString(
    duration: Duration,
    units: (keyof DurationLikeObject)[],
    unitDisplay: "short" | "long" = "long"
): string {
    return duration.shiftTo(...units).toHuman({
        maximumFractionDigits: 0,
        roundingMode: "floor",
        unitDisplay: unitDisplay
    });
}

/**
 * Returns the difference between the two dates in a format similar to {@linkcode humanizeTime}.
 *
 * @param date1 FIrst date
 * @param date2 Second date
 * @param includeSeconds Whether to include seconds in the output. Default is `false`.
 * @param format Which format to output, either `default` or `short`. See {@linkcode humanizeTime} for more information.
 */
export const getDateDiffString = (
    date1: Date,
    date2: Date,
    includeSeconds = false,
    format: "default" | "short" = "default"
): string => {
    const a = DateTime.fromJSDate(date2),
        b = DateTime.fromJSDate(date1),
        units: (keyof DurationLikeObject)[] = ["years", "months", "days", "hours", "minutes"];

    if (includeSeconds === true) {
        units.push("seconds");
    }

    return getHumanizedString(a.diff(b), units, format === "short" ? "short" : "long");
};

/**
 * Translates seconds into human readable format.
 *
 * Examples:
 *
 * `default` format:
 * `"1 year, 4 months, 3 days, 5 hours, 6 minutes, 30 seconds"`
 *
 * `short` format:
 * `"1 yr, 4 mths, 3 days, 5 hr, 6 min, 30 sec"`
 *
 * `simple` format:
 * `"42:30"` (only hours and minutes)
 *
 * @param seconds The number of seconds to be processed
 * @param format The output format to use
 */
export const humanizeTime = (
    seconds: number,
    format: "default" | "short" | "simple" = "default"
): string => {
    const duration = Duration.fromDurationLike({ seconds });

    if (format === "simple") {
        return duration.shiftTo("hours", "minutes").toFormat("h:mm");
    }

    const units: (keyof DurationLikeObject)[] = ["years", "months", "days", "hours", "minutes", "seconds"];
    const shiftedDuration = duration.shiftToAll();
    const includedUnits: (keyof DurationLikeObject)[] = [];

    for (const unit of units) {
        if (shiftedDuration.get(unit) > 0) {
            includedUnits.push(unit);
        }
    }

    return getHumanizedString(duration, includedUnits, format === "short" ? "short" : "long");
};