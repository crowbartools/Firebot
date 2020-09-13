import { getMainWindow } from "../windows/windows";
export function secondInstance() {
    const mainWindow = getMainWindow();
    if (mainWindow) {
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        }
        mainWindow.focus();
    }
}
