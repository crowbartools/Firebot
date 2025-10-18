import { randomInt } from "node:crypto";

/**
 * Returns a random integer between `min` and `max` (inclusive).
 * @param min the lower bound for the roll (rounded up to the nearest integer).
 * @param max the upper inclusive bound for the roll (rounded down to the nearest integer).
 */
export const getRandomInt = (min: number, max: number): number => {
    min = Math.ceil(min);
    max = Math.max(Math.floor(max), min); // Ensure max is at least equal to min

    // randomInt is max exclusive, so we add 1 to make inclusive
    return randomInt(min, max + 1);
};