"use strict";

const profileManager = require("./common/profile-manager");
const fs = require("fs");
const path = require("path");
const logger = require("./logwrapper");

function stripFontFileType(f) {
    return f.replace(/\.ttf/i, "")
        .replace(/\.woff/i, "")
        .replace(/\.woff2/i, "")
        .replace(/\.otf/i, "");
}

function getFontFormatFromFilename(f) {
    const normalized = f.toLowerCase();
    if (normalized.endsWith(".ttf")) {
        return "truetype";
    }
    if (normalized.endsWith(".woff")) {
        return "woff";
    }
    if (normalized.endsWith(".woff2")) {
        return "woff2";
    }
    if (normalized.endsWith(".otf")) {
        return "opentype";
    }
}

function getInstalledFonts() {
    const fontFolder = profileManager.getPathInProfile("/fonts");

    const fonts = fs.readdirSync(fontFolder)
        .filter(f => {
            const normalized = f.toLowerCase();
            return normalized.endsWith(".ttf")
                || normalized.endsWith(".woff")
                || normalized.endsWith(".woff2")
                || normalized.endsWith(".otf");
        })
        .map(f => {
            return {
                filename: f,
                path: path.join(fontFolder, path.sep, f).replace(/\\/g, "/"),
                name: stripFontFileType(f),
                format: getFontFormatFromFilename(f)
            };
        });

    return fonts;
}

function removeFont(name) {
    return new Promise((resolve, reject) => {
        const font = getInstalledFonts().find(f => f.name === name);
        if (font != null) {
            fs.unlink(font.path, (err) => {
                if (err) {
                    logger.error(err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        }
    });

}

function generateAppFontCssFile() {
    const fontFolder = profileManager.getPathInProfile("/fonts");

    let cssFileRaw = "";

    const fonts = getInstalledFonts();
    fonts.forEach(font => {
        const fontPath = `file:///${font.path}`;

        cssFileRaw +=
            `@font-face {
                font-family: '${font.name}';
                src: url('${fontPath}') format('${font.format}')
            }
            `;
    });

    const fontCssPath = path.join(fontFolder, path.sep, "fonts.css");
    fs.writeFileSync(fontCssPath, cssFileRaw, { encoding: "utf8" });
}

exports.generateAppFontCssFile = generateAppFontCssFile;
exports.getInstalledFonts = getInstalledFonts;
exports.removeFont = removeFont;
exports.getFont = (name) => {
    const font = getInstalledFonts().find(f => f.name === name);
    return font;
};

exports.FONTS_FOLDER = profileManager.getPathInProfile("/fonts");