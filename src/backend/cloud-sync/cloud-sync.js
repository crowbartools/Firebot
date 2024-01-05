"use strict";

const logger = require("../logwrapper");
const axios = require("axios").default;

const sync = async (jsonData) => {
    try {
        const response = await axios.post(`https://bytebin.lucko.me/post`,
            JSON.stringify(jsonData),
            {
                headers: {
                    'User-Agent': 'Firebot V5 - https://firebot.app',
                    'Content-Type': 'json'
                }
            });

        if (response) {
            logger.debug(`Bytebin key: ${response.data.key}`);
            return response.data.key;
        }

        return null;
    } catch (error) {
        if (error.code === 429) {
            logger.error('Bytebin rate limit exceeded.');
            renderWindow.webContents.send(
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
        const response = await axios.get(`https://bytebin.lucko.me/${shareCode}`,
            {
                headers: {
                    'User-Agent': 'Firebot V5 - https://firebot.app'
                }
            });

        if (response) {
            return JSON.parse(JSON.stringify(response.data));
        }

        return null;
    } catch (error) {
        return null;
    }
};

exports.sync = sync;
exports.getData = getData;