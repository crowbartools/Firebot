import sanitizeFileName from "sanitize-filename";
import fs from "fs/promises";
import path from "path";
import logger from "../logwrapper";
import twitchApi from "../twitch-api/api";
import discordEmbedBuilder from "../integrations/builtin/discord/discord-embed-builder";
import discord from "../integrations/builtin/discord/discord-message-sender";
import { SettingsManager } from "../common/settings-manager";
import mediaProcessor from "../common/handlers/mediaProcessor";
import webServer from "../../server/http-server-manager";
import moment from "moment";
import {CustomEmbed, EmbedType} from "../../types/discord";

export async function saveScreenshotToFolder(base64ImageData: string, folderPath: string, fileName?: string) {
    try {
        if (!fileName) {
            const { title } = await twitchApi.channels.getChannelInformation();
            fileName = `${title} ${moment().format("YYYY-MM-DD HH.mm.ss.SSS A")}`;
        }
        const folder = path.join(folderPath, `${sanitizeFileName(fileName)}.png`);
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

export async function sendScreenshotToDiscord(base64ImageData: string, message: string, discordChannelId: string, color: string) {
    const filename = "screenshot.png";
    const files = [
        {
            file: Buffer.from(base64ImageData, "base64"),
            name: filename,
            description: "Screenshot by Firebot"
        }
    ];
    const screenshotEmbed = await discordEmbedBuilder.buildScreenshotEmbed(`attachment://${filename}`, color);
    await discord.sendDiscordMessage(discordChannelId, message, screenshotEmbed, files);
}

export async function sendEmbedToDiscord(base64ImageData: string, embedType: EmbedType, message: string, embed: CustomEmbed, discordChannelId: string, color: string) {
    const filename = "screenshot.png";
    const files = [
        {
            file: Buffer.from(base64ImageData, "base64"),
            name: filename,
            description: "Screenshot by Firebot"
        }
    ];

    embed.imageUrl = `attachment://${filename}`;
    const builtEmbed = await discordEmbedBuilder.buildEmbed(embedType, embed, color);
    await discord.sendDiscordMessage(discordChannelId, message, builtEmbed, files);
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
    rotation?: string;
    rotType?: string;
}

export function sendScreenshotToOverlay(screenshotDataUrl: string, effect: ScreenshotEffectData) {
    let position = effect.position;
    if (position === "Random") {
        position = mediaProcessor.randomLocation();
    }

    let overlayInstance = null;
    if (SettingsManager.getSetting("UseOverlayInstances")) {
        if (effect.overlayInstance != null) {
            if (SettingsManager.getSetting("OverlayInstances").includes(effect.overlayInstance)) {
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
        overlayInstance: overlayInstance,
        rotation: effect.rotation ? effect.rotation + effect.rotType : "0deg"
    });
}
