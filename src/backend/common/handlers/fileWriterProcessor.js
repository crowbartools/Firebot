"use strict";

const fs = require("fs");
const path = require("path");
const logger = require("../../logwrapper");
const uuid = require("uuid").v4;

function doesTextExistInFile(filepath, text) {
    const contents = fs.readFileSync(filepath, { encoding: "utf8" });
    return contents.includes(text);
}

const doesFileExist = (filepath) => {
    return fs.existsSync(filepath);
};

function removeLines(filepath, lines = []) {
    const contents = fs.readFileSync(filepath, { encoding: "utf8" });
    return `${contents
        .split('\n')
        .filter(l => l != null && l.trim() !== "")
        .filter((_, index) => !lines.includes(index))
        .join('\n')}\n`;
}

function removeLinesWithText(filepath, text) {
    const contents = fs.readFileSync(filepath, { encoding: "utf8" });
    return `${contents
        .split('\n')
        .map((l) => {
            return l.replace('\r', "");
        })
        .filter(l => l != null && l.trim() !== "")
        .filter(l => l !== text)
        .join('\n')}\n`;
}

function replaceLines(filepath, lineNumbers = [], replacement) {
    const contents = fs.readFileSync(filepath, { encoding: "utf8" });

    return `${contents
        .split('\n')
        .filter(l => l != null && l.trim() !== "")
        .map((l, index) => {
            return lineNumbers.includes(index) ? replacement : l;
        })
        .join('\n')}\n`;
}

function replaceLinesWithText(filepath, text, replacement) {
    const contents = fs.readFileSync(filepath, { encoding: "utf8" });
    return `${contents
        .split('\n')
        .map((l) => {
            return l.replace('\r', "");
        })
        .filter(l => l != null && l.trim() !== "")
        .map((l) => {
            return l === text ? replacement : l;
        })
        .join('\n')}\n`;
}

exports.run = async (effect) => {
    if (effect == null || effect.filepath == null) {
        return;
    }

    let text = effect.text || "";
    let escapedNewline = "␚";
    while (text.includes(escapedNewline)) {
        escapedNewline = `␚${uuid()}␚`;
    }
    text = text.replace(/\\\\n/g, escapedNewline);
    text = effect.writeMode === "suffix" ? text.replace(/\\n/g, "\n") : text.replace(/\\n/g, "\n").trim();
    text = text.replaceAll(escapedNewline, "\\n");

    try {
        if (effect.writeMode === "suffix") {
            fs.appendFileSync(effect.filepath, text, { encoding: "utf8" });

        } else if (effect.writeMode === "append") {
            if (doesFileExist(effect.filepath) && effect.dontRepeat) {
                if (!doesTextExistInFile(effect.filepath, text)) {
                    fs.appendFileSync(effect.filepath, `${text}\n`, { encoding: "utf8" });
                }
            } else {
                fs.mkdirSync(path.dirname(effect.filepath), { recursive: true });
                fs.appendFileSync(effect.filepath, `${text}\n`, { encoding: "utf8" });
            }
        } else if (effect.writeMode === "delete") {

            if (effect.deleteLineMode === 'lines' || effect.deleteLineMode == null) {

                const lines = effect.lineNumbers
                    .split(",")
                    .map(l => l.trim())
                    .filter(l => !isNaN(l))
                    .map(l => parseInt(l, 10) - 1);

                fs.writeFileSync(effect.filepath, removeLines(effect.filepath, lines), { encoding: "utf8" });

            } else if (effect.deleteLineMode === 'text') {
                fs.writeFileSync(effect.filepath, removeLinesWithText(effect.filepath, effect.text, effect.replacementText), { encoding: "utf8" });
            }

        } else if (effect.writeMode === "replace-line") {

            if (effect.replaceLineMode === 'lineNumbers' || effect.replaceLineMode == null) {

                const lines = effect.lineNumbers
                    .split(",")
                    .map(l => l.trim())
                    .filter(l => !isNaN(l))
                    .map(l => parseInt(l, 10) - 1);

                fs.writeFileSync(effect.filepath, replaceLines(effect.filepath, lines, effect.replacementText), { encoding: "utf8" });

            } else if (effect.replaceLineMode === 'text') {
                fs.writeFileSync(effect.filepath, replaceLinesWithText(effect.filepath, effect.text, effect.replacementText), { encoding: "utf8" });
            }

        } else if (effect.writeMode === "delete-all") {
            fs.writeFileSync(effect.filepath, "", { encoding: "utf8" });
        } else {
            fs.writeFileSync(effect.filepath, text.toString(), { encoding: "utf8" });
        }
    } catch (err) {
        logger.warn("Failed to write to file", err);
    }

    return true;
};
