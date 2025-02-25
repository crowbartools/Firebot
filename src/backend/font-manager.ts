import fsp from "fs/promises";
import path from "path";
import logger from "./logwrapper";
import frontendCommunicator from "./common/frontend-communicator";
import profileManager from "./common/profile-manager";
import { SettingsManager } from "./common/settings-manager";
import webServer from "../server/http-server-manager";
import { FirebotSettingsDefaults } from "../types/settings";

export enum FontFormat {
    TrueType = "truetype",
    OpenType = "opentype",
    WOFF = "woff",
    WOFF2 = "woff2"
}

export type FirebotFont = {
    filename: string;
    path: string;
    name: string;
    format: FontFormat
}

class FontManager {
    cachedFonts: FirebotFont[] = [];

    constructor() {
        frontendCommunicator.on("fonts:get-font-folder-path", () => {
            return this.fontsFolder;
        });

        frontendCommunicator.on("fonts:get-generated-css-path", () => {
            return this.fontCssPath;
        });

        frontendCommunicator.on("fonts:get-installed-fonts", () => {
            return this.cachedFonts;
        });

        frontendCommunicator.on("fonts:get-font", (name: string) => {
            return this.getFont(name);
        });

        frontendCommunicator.onAsync("fonts:install-font", async (filepath: string) => {
            return await this.installFont(filepath);
        });

        frontendCommunicator.onAsync("fonts:remove-font", async (name: string) => {
            await this.removeFont(name);
        });
    }

    private stripFontFileType(f: string): string {
        return f.replace(/\.ttf/i, "")
            .replace(/\.woff/i, "")
            .replace(/\.woff2/i, "")
            .replace(/\.otf/i, "");
    }

    private getFontFormatFromFilename(f: string): FontFormat {
        const normalized = f.toLowerCase();
        if (normalized.endsWith(".ttf")) {
            return FontFormat.TrueType;
        }
        if (normalized.endsWith(".woff")) {
            return FontFormat.WOFF;
        }
        if (normalized.endsWith(".woff2")) {
            return FontFormat.WOFF2;
        }
        if (normalized.endsWith(".otf")) {
            return FontFormat.OpenType;
        }
    }

    get fontsFolder() {
        return profileManager.getPathInProfile("/fonts");
    }

    get fontCssPath() {
        return path.join(this.fontsFolder, "fonts.css");
    }

    async loadInstalledFonts(): Promise<void> {
        const fonts = (await fsp.readdir(this.fontsFolder))
            .filter((f) => {
                const normalized = f.toLowerCase();
                return normalized.endsWith(".ttf")
                    || normalized.endsWith(".woff")
                    || normalized.endsWith(".woff2")
                    || normalized.endsWith(".otf");
            })
            .map((f): FirebotFont => {
                return {
                    filename: f,
                    path: path.join(this.fontsFolder, f).replace(/\\/g, "/"),
                    name: this.stripFontFileType(f),
                    format: this.getFontFormatFromFilename(f)
                };
            });

        this.cachedFonts = fonts;
        await this.generateAppFontCssFile();
    }

    getFont(name: string): FirebotFont {
        const font = this.cachedFonts.find(f => f.name === name);
        return font;
    }

    async installFont(filepath: string): Promise<boolean> {
        try {
            const filename = path.parse(filepath).base;
            const destination = path.join(this.fontsFolder, filename);

            await fsp.cp(filepath, destination);
            this.cachedFonts.push({
                filename: filename,
                path: destination.replace(/\\/g, "/"),
                name: this.stripFontFileType(filename),
                format: this.getFontFormatFromFilename(filename)
            });
            logger.info(`Font ${filename} installed`);

            await this.generateAppFontCssFile();

            return true;
        } catch (error) {
            logger.error(`Error installing font from ${path}`, error);
            return false;
        }
    }

    async removeFont(name: string): Promise<void> {
        const font = this.cachedFonts.find(f => f.name === name);

        if (font != null) {
            if (SettingsManager.getSetting("ChatCustomFontFamily") === name) {
                SettingsManager.saveSetting("ChatCustomFontFamily", FirebotSettingsDefaults.ChatCustomFontFamily);
                SettingsManager.saveSetting("ChatCustomFontFamilyEnabled", false);
            }

            try {
                await fsp.unlink(font.path);
                this.cachedFonts.splice(this.cachedFonts.indexOf(font), 1);
                logger.info(`Font ${name} removed`);

                await this.generateAppFontCssFile();
            } catch (error) {
                logger.error(`Error removing font ${name}`, error);
            }
        }
    }

    async generateAppFontCssFile(): Promise<void> {
        try {
            let cssFileRaw = "";

            this.cachedFonts.forEach((font) => {
                const fontPath = `file:///${font.path}`;

                cssFileRaw +=
                    `@font-face {
                        font-family: '${font.name}';
                        src: url('${fontPath}') format('${font.format}')
                    }
                    `;
            });

            await fsp.writeFile(this.fontCssPath, cssFileRaw, { encoding: "utf8" });

            frontendCommunicator.send("fonts:reload-font-css");
            webServer.sendToOverlay("OVERLAY:RELOAD_FONTS");

            logger.info("Font CSS file generated");
        } catch (error) {
            logger.error("Error generated font CSS file", error);
        }
    }
}

const fontManager = new FontManager();

export { fontManager as FontManager };