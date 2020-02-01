"use strict";

const fs = require("fs");
const logger = require("../../logwrapper");

function removeLines(filepath, lines = []) {
    let contents = fs.readFileSync(filepath, "utf8");

    contents = contents.split('\n');

    contents = contents.filter(function(val, index) {
        if (lines.includes(index) === false) {
            return val;
        }
    });

    return contents.join('\n');
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
                let lines = text.split(',');

                lines = lines.filter(function(number) {
                    if (!isNaN(parseInt(number))) {
                        return number;
                    }
                });

                lines = lines.map(function (line) {
                    return parseInt(line, 10) - 1; // Minus one, to get user expected line.
                });

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
