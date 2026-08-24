import type { ManifestFirebotVersion } from "../../types";

/**
 * Checks whether a given Firebot version meets the provided minimum and/or maximum version spec
 * @param current Current Firebot version
 * @param min Minimum required Firebot version
 * @param max Maximum compatible Firebot version
 * @returns `true` if the supplied current version is within the constraints, or `false` if not
 */
export const meetsFirebotVersionRequirement = (
    current: ManifestFirebotVersion,
    min?: ManifestFirebotVersion,
    max?: ManifestFirebotVersion
): boolean => {
    // No limits, all good
    if (min == null && max == null) {
        return true;
    }

    if (min != null) {
        if (current.major < min.major) {
            return false;
        }

        if (current.major === min.major) {
            if (min.minor != null && (current.minor ?? 0) < min.minor) {
                return false;
            }

            if (min.minor != null && (current.minor ?? 0) === min.minor) {
                if (min.patch != null && (current.patch ?? 0) < min.patch) {
                    return false;
                }
            }
        }
    }

    if (max != null) {
        if (current.major > max.major) {
            return false;
        }

        if (current.major === max.major) {
            if (max.minor != null && (current.minor ?? 0) > max.minor) {
                return false;
            }

            if (max.minor != null && (current.minor ?? 0) === max.minor) {
                if (max.patch != null && (current.patch ?? 0) > max.patch) {
                    return false;
                }
            }
        }
    }

    return true;
};