import { HelixClip } from '@twurple/api';
import { BrowserWindow } from 'electron';
import { SettingsManager } from '../settings-manager';
import windowManagement from '../../app-management/electron/window-management';

let window: BrowserWindow = null;

windowManagement.events.on('main-window-closed', () => {
    if (window != null && !window.isDestroyed()) {
        window.close();
    }
});

function attemptToAcquireDirectUrl(clipId: string): Promise<string | null> {

    if (window == null) {
        window = new BrowserWindow({
            show: false,
            title: 'Firebot - Twitch Clip URL Resolver',
            webPreferences: {
                sandbox: true,
                nodeIntegration: false,
                contextIsolation: true
            }
        });

        // Prevent the window from doing various naughty things
        window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
        window.webContents.on('will-navigate', event => event.preventDefault());
    }

    return new Promise((resolve) => {
        const sandbox: {
            finished: boolean,
            timeout?: ReturnType<typeof setTimeout>,
            resolve?: (url?: string | null) => void,
        } = {
            finished: false
        };

        sandbox.resolve = (result: string | null) => {
            if (!sandbox.finished) {
                sandbox.finished = true;

                if (sandbox.timeout) {
                    clearTimeout(sandbox.timeout);
                    sandbox.timeout = null;
                }

                try {
                    window.removeAllListeners();
                } catch (err) {}

                resolve(result);
            }
        };


        // Just in case the window hangs
        window.on('unresponsive', () => sandbox.resolve);
        window.on('closed', sandbox.resolve);

        window.on('ready-to-show', () => {
            // Give window 2s to resolve url
            sandbox.timeout = setTimeout(sandbox.resolve, 2000);
        });

        window.loadURL(`https://clips.twitch.tv/embed?clip=${clipId}&parent=firebot&muted=true&autoplay=false`)
            .then(() => {
                window.webContents.executeJavaScript(`
                new Promise(async (resolve) => {
                    const findVideoElement = async () => {
                        const videoElement = document.querySelector("video");

                        if (videoElement) {
                            return videoElement;
                        }

                        await new Promise(r => setTimeout(r, 100));
                        return findVideoElement();
                    };

                    const videoElement = await findVideoElement();

                    resolve(videoElement?.src ?? null);
                });
            `)
                    .then(sandbox.resolve)
                    .catch(sandbox.resolve);
            });
    });
}

const resolveUrlRequestQueue: Array<{
    clipId: string;
    resolve: (url: string | null) => void;
}> = [];

let processingResolveUrlRequestQueue = false;

async function processResolveUrlRequestQueue() {
    if (resolveUrlRequestQueue.length === 0) {
        processingResolveUrlRequestQueue = false;
        return;
    }

    processingResolveUrlRequestQueue = true;

    const { clipId, resolve } = resolveUrlRequestQueue.shift();

    const url = await attemptToAcquireDirectUrl(clipId);

    resolve(url);

    process.nextTick(processResolveUrlRequestQueue);
}

async function addResolveUrlRequest(clipId: string): Promise<string | null> {
    return new Promise((resolve) => {
        resolveUrlRequestQueue.push({ clipId, resolve });
        if (processingResolveUrlRequestQueue) {
            return;
        }
        processingResolveUrlRequestQueue = true;
        process.nextTick(processResolveUrlRequestQueue);
    });
}

function isValidTwitchUrl(url: string): boolean {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.endsWith('twitchcdn.net')
            && urlObj.pathname.endsWith('.mp4');
    } catch {
        return false;
    }
}

export const resolveTwitchClipVideoUrl = async (clip: HelixClip): Promise<{ url: string; useIframe: boolean; }> => {
    const useExperimentalTwitchClipUrlResolver = SettingsManager.getSetting("UseExperimentalTwitchClipUrlResolver");

    if (!useExperimentalTwitchClipUrlResolver) {
        return {
            url: clip.embedUrl,
            useIframe: true
        };
    }

    let useIframe = false;
    let url = await addResolveUrlRequest(clip.id);

    if (!url || !isValidTwitchUrl(url)) {
        url = clip.embedUrl;
        useIframe = true;
    }

    return {
        url,
        useIframe
    };
};