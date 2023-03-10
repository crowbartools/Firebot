'use strict';

// Change to more recent version once tested
const minimumTag = 'v5.50.0';

const axios = require('axios');
const processVersion = require('./process-version');

module.exports = async (version) => {
    const currentTag = 'v' + version;

    const releases = [];

    let found = false,
        page = 1;

    // github limits release listing to latest 1000 releases
    while (!found && page < 11) {
        const result = await axios({
            method: 'GET',
            url: `https://api.github.com/repos/crowbartools/Firebot/releases?page=${page}&per_page=100`,
            headers: {
                'Accept': 'application/vnd.github+json',
                'X-Github-Api-Version': '2022-11-28'
            },
            responseType: 'json'
        });
        if (result.status !== 200) {
            return {status: "error", message: "failed to get releases list"};
        }
        if (result.data == null || result.data.length === 0) {
            break;
        }

        result.data.find(value => {
            value.version = processVersion(value.tag_name);
            releases.push(value);
            return found = value.tag_name === currentTag || value.tag_name === minimumTag;
        });
        page += 1;
    }

    /* remove stale patch updates */
    let lastRelease = releases[0].version, idx = 1;
    while (idx < releases.length) {
        const releaseItem = releases[idx].version;
        if (
            lastRelease.major === releaseItem.major &&
            lastRelease.minor === releaseItem.minor
        ) {
            releases.splice(idx, 1);
        } else {
            lastRelease = releaseItem;
            idx += 1;
        }
    }

    return { status: 'ok', data: releases };
};