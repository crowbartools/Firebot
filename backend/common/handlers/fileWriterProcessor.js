"use strict";

const fs = require("fs");
const logger = require("../../logwrapper");

exports.run = function(effect) {
    return new Promise(async resolve => {
        if (effect == null || effect.filepath == null)
            return;

        let text = effect.text || "";
        text = text.replace(/\\n/g, "\n").trim();

        try {
            if (effect.writeMode === "append") {
                fs.appendFileSync(effect.filepath, text + "\n", "utf8");
            } else {
                fs.writeFileSync(effect.filepath, text, "utf8");
            }
        } catch (err) {
            logger.warn("Failed to write to file", err);
        }

        resolve();
    });
};
