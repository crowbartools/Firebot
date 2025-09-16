"use strict";

const frontendCommunicator = require("../common/frontend-communicator");
const logger = require("../logwrapper");
const accountAccess = require("../common/account-access");

const sync = async (jsonData) => {
    const streamer = accountAccess.getAccounts().streamer;

    if (!streamer || !streamer.loggedIn) {
        return null;
    }

    try {
        const response = await fetch(`https://api.crowbar.tools/v1/data-bin`, {
            method: "POST",
            body: JSON.stringify(jsonData),
            headers: {
                'User-Agent': 'Firebot V5 - https://firebot.app',
                'Authorization': `Bearer ${streamer.auth.access_token}`
            }
        });

        if (response?.ok) {
            const data = await response.json();
            logger.debug(`DataBin key: ${data.key}`);
            return data.key;
        }

        return null;
    } catch (error) {
        if (error.code === 429) {
            logger.error('DataBin rate limit exceeded.');
            frontendCommunicator.send(
                "error",
                "DataBin rate limit exceeded."
            );
        } else {
            logger.error('DataBin sync failed.', error.message);
        }

        return null;
    }
};

const syncProfileData = async (profileData) => {

    const streamer = accountAccess.getAccounts().streamer;

    if (!streamer || !streamer.loggedIn) {
        return null;
    }

    try {
        const response = await fetch("https://api.crowbar.tools/v1/profile-data/", {
            method: "PUT",
            body: JSON.stringify(profileData),
            headers: {
                'User-Agent': 'Firebot V5 - https://firebot.app',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${streamer.auth.access_token}`
            }
        });

        if (response?.ok) {
            return streamer.username;
        }

        const errorData = await response.json();
        logger.error('DataBin sync failed.', errorData);

        return null;
    } catch (error) {
        if (error.code === 429) {
            logger.error('DataBin rate limit exceeded.');
            frontendCommunicator.send(
                "error",
                "DataBin rate limit exceeded."
            );
        } else {
            logger.error('DataBin sync failed.', error.message);
        }

        return null;
    }
};

const getData = async (shareCode) => {
    try {
        const response = await fetch(`https://api.crowbar.tools/v1/data-bin/${shareCode}`, {
            headers: {
                'User-Agent': 'Firebot V5 - https://firebot.app'
            }
        });

        if (response?.ok) {
            return await response.json();
        }

        return null;
    } catch (error) {
        return null;
    }
};

exports.sync = sync;
exports.syncProfileData = syncProfileData;
exports.getData = getData;