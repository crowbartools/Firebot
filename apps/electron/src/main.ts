import { app, BrowserWindow} from 'electron';
import path from 'node:path';

let mainWindow : BrowserWindow;
const createWindow = () => {
    if (mainWindow) {
        return;
    }

    mainWindow = new BrowserWindow({
        width: 800,
        height: 600
    });

    const loadFile = path.join(__dirname, "../src/sample.html");
    mainWindow.loadFile(loadFile);
}


process.on('uncaughtException', function (err) {
    console.error(err.stack);
    console.log("Node NOT Exiting...");
    app.quit();
});

(async () => {

    await app.whenReady();

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });



    createWindow();
})();