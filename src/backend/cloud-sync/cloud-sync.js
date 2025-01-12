"use strict";

const frontendCommunicator = require("../common/frontend-communicator");
const logger = require("../logwrapper");

const sync = async (jsonData) => {
    try {
        const response = await fetch(`https://bytebin.lucko.me/post`, {
            method: "POST",
            body: JSON.stringify(jsonData),
            headers: {
                'User-Agent': 'Firebot V5 - https://firebot.app',
                'Content-Type': 'json'
            }
        });

        if (response?.ok) {
            const data = await response.json();
            logger.debug(`Bytebin key: ${data.key}`);
            return data.key;
        }

        return null;
    } catch (error) {
        if (error.code === 429) {
            logger.error('Bytebin rate limit exceeded.');
            frontendCommunicator.send(
                "error",
                "Bytebin rate limit exceeded."
            );
        } else {
            logger.error('Bytebin sync failed.', error.message);
        }

        return null;
    }
};

const getData = async (shareCode) => {
    try {
        const response = await fetch(`https://bytebin.lucko.me/${shareCode}`, {
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
exports.getData = getData;