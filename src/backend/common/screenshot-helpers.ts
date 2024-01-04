import sanitizeFileName from "sanitize-filename";
import fs from "fs/promises";
import path from "path";
import logger from "../logwrapper";
import twitchApi from "../twitch-api/api";
import discordEmbedBuilder from "../integrations/builtin/discord/discord-embed-builder";
import discord from "../integrations/builtin/discord/discord-message-sender";
import { settings } from "../common/settings-access";
import mediaProcessor from "../common/handlers/mediaProcessor";
import webServer from "../../server/http-server-manager";

export async function saveScreenshotToFolder(base64ImageData: string, folderPath: string) {
    try {
        const { title, gameName } = await twitchApi.channels.getChannelInformation();
        const fileName = sanitizeFileName(`${title}-${gameName}-${new Date().getTime()}`);
        const folder = path.join(folderPath, `${fileName}.png`);
        await fs.writeFile(folder, base64ImageData, { encoding: "base64" });
    } catch (error) {
        logger.error("Failed to save screenshot locally", error);
    }
}

export async function saveScreenshotToFile(base64ImageData: string, filePath: string) {
    try {
        await fs.writeFile(filePath, base64ImageData, { encoding: "base64" });
    } catch (error) {
        logger.error("Failed to save screenshot locally", error);
    }
}

export async function sendScreenshotToDiscord(base64ImageData: string, discordChannelId: string) {
    const filename = "screenshot.png";
    const files = [
        {
            file: Buffer.from(base64ImageData, "base64"),
            name: filename,
            description: "Screenshot by Firebot"
        }
    ];
    const screenshotEmbed = await discordEmbedBuilder.buildScreenshotEmbed(`attachment://${filename}`);
    await discord.sendDiscordMessage(discordChannelId, "A new screenshot was taken!", screenshotEmbed, files);
}

export type ScreenshotEffectData = {
    position: string;
    overlayInstance: string;
    width: number;
    height: number;
    duration: number;
    customCoords?: string;
    enterAnimation?: string;
    enterDuration?: number;
    inbetweenAnimation?: string;
    inbetweenDuration?: number;
    inbetweenDelay?: number;
    inbetweenRepeat?: number;
    exitAnimation?: string;
    exitDuration?: number;
}

export function sendScreenshotToOverlay(screenshotDataUrl: string, effect: ScreenshotEffectData) {
    let position = effect.position;
    if (position === "Random") {
        position = mediaProcessor.randomLocation();
    }

    let overlayInstance = null;
    if (settings.useOverlayInstances()) {
        if (effect.overlayInstance != null) {
            if (settings.getOverlayInstances().includes(effect.overlayInstance)) {
                overlayInstance = effect.overlayInstance;
            }
        }
    }

    webServer.sendToOverlay("showScreenshot", {
        screenshotDataUrl: screenshotDataUrl,
        width: effect.width,
        height: effect.height,
        duration: effect.duration || 5,
        position: position,
        customCoords: effect.customCoords,
        enterAnimation: effect.enterAnimation,
        enterDuration: effect.enterDuration,
        inbetweenAnimation: effect.inbetweenAnimation,
        inbetweenDuration: effect.inbetweenDuration,
        inbetweenDelay: effect.inbetweenDelay,
        inbetweenRepeat: effect.inbetweenRepeat,
        exitAnimation: effect.exitAnimation,
        exitDuration: effect.exitDuration,
        overlayInstance: overlayInstance
    });
}
