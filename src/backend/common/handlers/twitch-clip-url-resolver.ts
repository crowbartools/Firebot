import { HelixClip } from '@twurple/api';
import { BrowserWindow } from 'electron';
import { SettingsManager } from '../settings-manager';

function attemptToAcquireDirectUrl(clipId: string): Promise<string | null> {
    return new Promise((resolve) => {
        const sandbox: {
            finished: boolean,
            timeout?: ReturnType<typeof setTimeout>,
            window?: Electron.BrowserWindow,
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
                    sandbox.window.webContents.removeAllListeners();
                } catch (err) {}
                try {
                    sandbox.window.removeAllListeners();
                    sandbox.window.destroy();
                } catch (err) {}
                sandbox.window = null;

                resolve(result);
            }
        };

        sandbox.window = new BrowserWindow({
            show: false,
            title: 'Firebot - Twitch Clip URL Resolver',
            webPreferences: {
                sandbox: true,
                nodeIntegration: false,
                contextIsolation: true
            }
        });

        // Prevent the window from doing various naughty things
        sandbox.window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
        sandbox.window.webContents.on('will-navigate', event => event.preventDefault());

        // Just in case the window hangs
        sandbox.window.on('unresponsive', () => sandbox.resolve);
        sandbox.window.on('closed', sandbox.resolve);

        sandbox.window.on('ready-to-show', () => {
            // Give window 2s to resolve url
            sandbox.timeout = setTimeout(sandbox.resolve, 2000);
        });

        sandbox.window.loadURL(`https://clips.twitch.tv/embed?clip=${clipId}&parent=firebot&muted=true&autoplay=false`)
            .then(() => {
                sandbox.window.webContents.executeJavaScript(`
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
    let url = await attemptToAcquireDirectUrl(clip.id);

    if (!url || !isValidTwitchUrl(url)) {
        url = clip.embedUrl;
        useIframe = true;
    }

    return {
        url,
        useIframe
    };
};