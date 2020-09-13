import { getMainWindow, createMainWindow } from "../windows/windows";
export function activate() {
    if (getMainWindow() == null) {
        createMainWindow();
    }
}
