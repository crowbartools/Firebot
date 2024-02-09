const { ipcRenderer } = require('electron');

// wait for the window to be ready
const isReady = new Promise((resolve) => {
    window.onload = resolve;
});

// Pass the portToBackend to the renderer's context
ipcRenderer.on('firebot-port', async (event) => {
    await isReady;
    window.postMessage('firebot-port', '*', event.ports);
});