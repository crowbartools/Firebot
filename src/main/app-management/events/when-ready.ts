import { createMainWindow } from "../windows/windows";
import installExtension, {
    REACT_DEVELOPER_TOOLS,
    MOBX_DEVTOOLS,
} from "electron-devtools-installer";

export async function whenReady() {
    if (process.env.NODE_ENV !== "production") {
        try {
            await installExtension(REACT_DEVELOPER_TOOLS, true);
            await installExtension(MOBX_DEVTOOLS, true);
        } catch (err) {
            console.log("failed to load extension(s)", err);
        }
    }

    createMainWindow();
}
