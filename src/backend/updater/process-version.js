'use strict';

/**
 * @typedef {Object} PreReleaseVersion
 * @property {'alpha' | 'beta' | 'rc' | 'nightly'} type - Type of prerelease
 * @property {number} typeNum - type enum: 0 = alpha, 1 = beta, 2 = rc, 0 = nightly
 * @property {boolean} isNightly - true if prerelease is a nightly
 * @property {number} major - The prerelease major version
 * @property {number} minor - The prerelease minor version
 * @property {number} patch - The prerelease patch version
 * @property {string} version - The prerelease version
 */

/**
 * @typedef {Object} ProcessedVersion
 * @property {string} full - The full version
 * @property {number} major - The major version
 * @property {number} minor - The minor version
 * @property {number} patch - The patch version
 * @property {?PreReleaseVersion} prerelease - Prerelease details
 */


/**
 * @param {number} v1Major
 * @param {number} v1Minor
 * @param {number} v1Patch
 * @param {number} v2Major
 * @param {number} v2Minor
 * @param {number} v2Patch
 * @returns {number}
 */
const compareVersionSegments = (
    v1Major, v1Minor, v1Patch,
    v2Major, v2Minor, v2Patch
) => {
    if (v1Major > v2Major) {
        return -1;
    }
    if (v1Major < v2Major) {
        return 1;
    }
    if (v1Minor > v2Minor) {
        return -1;
    }
    if (v1Minor < v2Minor) {
        return 1;
    }
    if (v1Patch > v2Patch) {
        return -1;
    }
    if (v1Patch < v2Patch) {
        return 1;
    }
    return 0;
};


/**
 * @param {string | String} version
 * @returns {ProcessedVersion}
 */
const processVersion = (version) => {
    version = `${version}`;

    let workingVersion = version;

    // cut off 'v' prefix
    if (workingVersion[0] === 'v') {
        workingVersion = workingVersion.slice(1);
    }

    // chop off semvar meta data
    workingVersion = workingVersion.replace(/\+.*$/, '');

    const parts = workingVersion.split('-');

    const [major, minor, patch] = parts[0].split('.');

    const result = {
        raw: version,
        full: workingVersion,
        major: Number(major),
        minor: Number(minor),
        patch: Number(patch)
    };



    if (parts[1] != null && parts[1] !== '') {
        const prerelease = (parts[1] || '').toLowerCase().split('.');

        const [pretype, premajor, preminor, prepatch] = prerelease;

        result.prerelease = {
            type: pretype,
            isNightly: pretype === 'nightly',
            typeNum: {alpha: 1, beta: 2, rc: 3}[pretype] || 0,
            major: premajor == null ? 0 : Number(premajor),
            minor: preminor == null ? 0 : Number(preminor),
            patch: prepatch == null ? 0 : Number(prepatch)
        };
        result.prerelease.version = [
            result.prerelease.type,
            result.prerelease.major,
            result.prerelease.minor,
            result.prerelease.patch
        ].join('.');
    }

    return result;
};


/** Compares two versions and returns based on which is newer
  * @param {string | String | ProcessedVersion } v1
  * @param {string | String | ProcessedVersion } v2
  * @returns {number | null} - -1 if v1 is newer, 0 if versions are the same, 1 if v1 is older, null if versions cannot be compared(nightly v alpha|beta|rc)
  */
const compareVersions = (v1, v2) => {
    if (typeof v1 === 'string' || v1 instanceof String) {
        /** @type {ProcessedVersion} */
        v1 = processVersion(`${v1}`);
    }
    if (typeof v2 === 'string' || v2 instanceof String) {
        /** @type {ProcessedVersion} */
        v2 = processVersion(`${v2}`);
    }

    // compare main major.minor.patch
    const comparison = compareVersionSegments(
        v1.major, v1.minor, v1.patch,
        v2.major, v2.minor, v2.patch
    );
    if (comparison !== 0) {
        return comparison;
    }

    // no prerelease tagging
    if (!v1.prerelease && !v2.prerelease) {
        return 0;
    }

    // prerelease v non-prerelease
    if (!v1.prerelease && v2.prerelease) {
        return -1;
    }
    if (v1.prerelease && !v2.prerelease) {
        return 1;
    }
    if (
        v1.prerelease.isNightly && !v2.prerelease.isNightly ||
        !v1.prerelease.isNightly && v2.prerelease.isNightly
    ) {
        return null;
    }

    if (v1.prerelease.typeNum > v2.prerelease.typeNum) {
        return -1;
    }
    if (v1.prerelease.typeNum < v2.prerelease.typeNum) {
        return 1;
    }

    // compare prerelease taggin
    return compareVersionSegments(
        v1.prerelease.major, v1.prerelease.minor, v1.prerelease.patch,
        v2.prerelease.major, v2.prerelease.minor, v2.prerelease.patch
    );
};

module.exports = {
    processVersion,
    compareVersions
};