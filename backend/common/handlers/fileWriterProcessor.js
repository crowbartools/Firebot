"use strict";

const fs = require("fs");
const logger = require("../../logwrapper");

function removeLines(filepath, lines = []) {
    let contents = fs.readFileSync(filepath, "utf8");

    return contents
        .split('\n')
        .filter(l => l != null && l.trim() !== "")
        .filter((_, index) => !lines.includes(index))
        .join('\n');
}

exports.run = function(effect) {
    return new Promise(async resolve => {
        if (effect == null || effect.filepath == null)
            return;

        let text = effect.text || "";
        text = text.replace(/\\n/g, "\n").trim();

        try {
            if (effect.writeMode === "append") {
                fs.appendFileSync(effect.filepath, text + "\n", "utf8");
            } else if (effect.writeMode === "delete") {
                let lines = effect.lineNumbers
                    .split(",")
                    .map(l => l.trim())
                    .filter(l => !isNaN(l))
                    .map(l => parseInt(l, 10) - 1);

                fs.writeFileSync(effect.filepath, removeLines(effect.filepath, lines), 'utf8');
            } else if (effect.writeMode === "delete-all") {
                fs.writeFileSync(effect.filepath, "", "utf8");
            } else {
                fs.writeFileSync(effect.filepath, text, "utf8");
            }
        } catch (err) {
            logger.warn("Failed to write to file", err);
        }

        resolve();
    });
};
