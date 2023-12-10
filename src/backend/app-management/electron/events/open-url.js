exports.openUrl = (event, url) => {
    const logger = require("../../../logwrapper");
    logger.debug(`Received Firebot URL request: ${url}`);
};