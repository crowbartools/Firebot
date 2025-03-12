'use strict';

// Change to more recent version once tested
const minimumTag = 'v5.50.0';

const {
    processVersion,
    compareVersions
} = require('./process-version');

module.exports = async (version) => {
    if (typeof version === 'string' || version instanceof String) {
        version = `${version}`;

        if (version[0] !== 'v') {
            version = `v${version}`;
        }
    } else {
        version = `v${version.full}`;
    }
    const currentTag = version;

    const releases = [];

    let found = false,
        page = 1;

    // github limits release listing to latest 1000 releases
    while (!found && page < 11) {
        const result = await fetch(`https://api.github.com/repos/crowbartools/Firebot/releases?page=${page}&per_page=100`, {
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.github+json',
                'X-Github-Api-Version': '2022-11-28',
                "Response-Type": "application/json"
            }
        });
        if (!result.ok) {
            return {status: "error", message: "failed to get releases list"};
        }
        const data = await result.json();
        if (data == null || data.length === 0) {
            break;
        }

        data.find((value) => {
            if (value.draft) {
                return;
            }
            value.version = processVersion(value.tag_name);
            releases.push(value);
            return found = value.tag_name === currentTag || value.tag_name === minimumTag;
        });
        page += 1;
    }

    /* sort(newest releases first) */
    releases.sort((r1, r2) => compareVersions(r1.version, r2.version));

    /* remove stale patch updates */
    let last = releases[0].version, idx = 1;
    while (idx < releases.length) {
        const cur = releases[idx].version;
        if (last.major === cur.major && last.minor === cur.minor) {
            releases.splice(idx, 1);
        } else {
            last = cur;
            idx += 1;
        }
    }
    return { status: 'ok', data: releases };
};