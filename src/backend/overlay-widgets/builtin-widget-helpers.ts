import { readFileSync } from "node:fs";
import { OverlayWidgetType } from "../../types";
import { getPathInWorkingDir } from "../common/data-access";
import { LoggerCache } from "../logger-cache";

const logger = LoggerCache.getLogger("Overlay Widgets");

export function loadComponentExtension(componentFileName: string): OverlayWidgetType<any, any>["componentExtension"] {
    const bundlePath = getPathInWorkingDir(`resources/overlay-widget-components/${componentFileName}/index.js`);
    try {
        const bundleSource = readFileSync(bundlePath, "utf8");
        return { bundleSource };
    } catch (ex) {
        logger.error(`Could not read ${componentFileName} widget bundle at '${bundlePath}'.`, ex);
        // provide empty source
        return { bundleSource: "" };
    }
}
