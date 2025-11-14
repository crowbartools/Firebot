import { wait, convertByteArrayJsonToByteArray } from "../../utils";
import logger from "../../logwrapper";
import fs from "fs/promises";
import path from "path";
import { SettingsManager } from "../settings-manager";
import { ResourceTokenManager } from "../../resource-token-manager";
import webServer from "../../../server/http-server-manager";
import frontendCommunicator from "../frontend-communicator";

export type SoundType = "url" | "rawData" | "folderRandom" | "local";

export async function playSound(soundData: {
    soundType: SoundType;
    filePath?: string;
    url?: string;
    rawData?: Uint8Array | number[] | string;
    mimeType?: string;
    folder?: string;
    volume?: number;
    overlayInstance?: string;
    audioOutputDeviceId?: string;
    waitForSound?: boolean;
}) {
    if (soundData.soundType === "rawData") {
        soundData.soundType = "url";
        try {
            // Attempt to convert back to binary
            soundData.rawData = convertByteArrayJsonToByteArray(soundData.rawData as string);
        } finally {
            const buffer = Buffer.from(soundData.rawData);
            soundData.url = `data:${soundData.mimeType};base64,${buffer.toString("base64")}`;
        }
    }

    const data: {
        filepath?: string;
        url?: string;
        isUrl: boolean;
        volume?: number;
        overlayInstance?: string;
        resourceToken?: string;
        audioOutputDeviceId?: string;
    } = {
        filepath: soundData.filePath,
        url: soundData.url,
        isUrl: soundData.soundType === "url",
        volume: soundData.volume,
        overlayInstance: soundData.overlayInstance,
        audioOutputDeviceId: undefined
    };

    // Get random sound
    if (soundData.soundType === "folderRandom") {
        let files: string[] = [];
        try {
            files = await fs.readdir(soundData.folder);
        } catch (err) {
            logger.warn("Unable to read sound folder", err);
        }

        const filteredFiles = files.filter(i => (/\.(mp3|ogg|oga|wav|flac)$/i).test(i));
        if (filteredFiles.length === 0) {
            logger.error('No sounds were found in the select sound folder.');
            return true;
        }

        const chosenFile = filteredFiles[Math.floor(Math.random() * filteredFiles.length)];
        data.filepath = path.join(soundData.folder, chosenFile);
    }

    // Set output device.
    let selectedOutputDeviceId = soundData.audioOutputDeviceId;
    if (!selectedOutputDeviceId) {
        selectedOutputDeviceId = SettingsManager.getSetting("AudioOutputDevice")?.deviceId;
    }
    data.audioOutputDeviceId = selectedOutputDeviceId;

    // Generate token if going to overlay, otherwise send to gui.
    if (selectedOutputDeviceId === "overlay") {
        if (soundData.soundType !== "url") {
            const resourceToken = ResourceTokenManager.storeResourcePath(
                data.filepath,
                30
            );
            data.resourceToken = resourceToken;
        }

        // send event to the overlay
        webServer.sendToOverlay("sound", data);
    } else {
        data.filepath = data.filepath?.replaceAll("%", "%25").replaceAll("#", "%23");
        frontendCommunicator.send("playsound", data);
    }

    if (soundData.waitForSound) {
        try {
            const duration = await frontendCommunicator.fireEventAsync<number>("getSoundDuration", {
                path: data.isUrl ? data.url : data.filepath
            });

            if (selectedOutputDeviceId === "overlay"
                        && SettingsManager.getSetting("ForceOverlayEffectsToContinueOnRefresh") === true) {
                let currentDuration = 0;
                let returnNow = false;
                const overlayInstance = soundData.overlayInstance ?? "Default";

                webServer.on("overlay-connected", (instance) => {
                    if (instance === overlayInstance) {
                        returnNow = true;
                    }
                });

                while (currentDuration < duration) {
                    if (returnNow) {
                        return true;
                    }
                    currentDuration += 1;

                    await wait(1000);
                }
            } else {
                const durationInMils = (Math.round(duration) || 0) * 1000;
                await wait(durationInMils);
            }

            return true;
        } catch {
            return true;
        }
    }
    return true;
}