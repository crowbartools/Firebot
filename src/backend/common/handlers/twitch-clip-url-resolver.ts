import { BrowserWindow } from 'electron';

interface Sandbox {
    finished: boolean,
    timeout?: ReturnType<typeof setTimeout>,
    window?: Electron.BrowserWindow,
    resolve?: (url?: string | null) => void,
}

export const resolveTwitchClipVideoUrl = async (clipId: string): Promise<string | null> => {

    if (typeof clipId !== 'string' || clipId === '') {
        return null;
    }

    return new Promise((resolve) => {

        const sandbox : Sandbox = {
            finished: false
        };

        const cleanup = () => {
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
        };

        // Called when the sandbox successfully returns a result
        sandbox.resolve = (result: string | null) => {
            if (!sandbox.finished) {
                cleanup();
                resolve(result);
            }
        };

        // Create a new, hidden, browser window
        sandbox.window = new BrowserWindow({
            show: false,
            title: 'Firebot - Twitch Clip URL Resolver',
            webPreferences: {
                sandbox: true,
                nodeIntegration: false,
                contextIsolation: true
            }
        });

        // Prevent sandbox js from opening windows
        sandbox.window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
        sandbox.window.webContents.on('will-navigate', event => event.preventDefault());
        sandbox.window.on('unresponsive', () => sandbox.resolve(null));
        sandbox.window.on('closed', () => sandbox.resolve(null));

        // Wait for the contents of the sandbox window to be ready
        sandbox.window.on('ready-to-show', () => {

            // Give evaluation 2s to resolve
            sandbox.timeout = setTimeout(() => sandbox.resolve(null), 2000);
        });

        //StupidDepressedFerretCoolStoryBro-hGPAxHQmseHMcuJR
        sandbox.window.loadURL(`https://clips.twitch.tv/embed?clip=${clipId}&parent=firebot`).then(() => {
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
                .then((url: string | null) => {
                    sandbox.resolve(url);
                })
                .catch(() => {
                    sandbox.resolve(null);
                });
        });
    });
};