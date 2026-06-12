import type { ControlDeckControlType } from "../../types";

import frontendCommunicator from "../common/frontend-communicator";
import { LoggerCache } from "../logger-cache";
import { buttonControlType } from "./builtin-control-types/button";
import { folderControlType } from "./builtin-control-types/folder";
import { switchControlType } from "./builtin-control-types/switch";

const CONTROL_TYPE_ID_REGEX = /^[a-z0-9_-]+:[a-z0-9_-]+$/i;

class ControlDeckControlTypeManager {
    private logger = LoggerCache.getLogger("Control Deck");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private controlTypes: Map<string, ControlDeckControlType<any, any>> = new Map();

    constructor() {
        frontendCommunicator.on("control-deck:get-control-types",
            () => this.getControlTypesForFrontend()
        );
    }

    registerBuiltInControlTypes(): void {
        this.registerControlType(buttonControlType);
        this.registerControlType(folderControlType);
        this.registerControlType(switchControlType);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private registerControlType(controlType: ControlDeckControlType<any, any>): void {
        if (controlType?.id == null || !CONTROL_TYPE_ID_REGEX.test(controlType.id)) {
            throw new Error(`Control type id "${controlType?.id}" is invalid. Ids must be in the form "namespace:name".`);
        }

        if (this.controlTypes.has(controlType.id)) {
            throw new Error(`A control type with id "${controlType.id}" is already registered.`);
        }

        this.controlTypes.set(controlType.id, controlType);

        this.logger.debug(`Registered control type ${controlType.id}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getControlType(id: string): ControlDeckControlType<any, any> | null {
        return this.controlTypes.get(id) ?? null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAllControlTypes(): ControlDeckControlType<any, any>[] {
        return Array.from(this.controlTypes.values());
    }

    private getControlTypesForFrontend() {
        return this.getAllControlTypes().map(controlType => ({
            id: controlType.id,
            name: controlType.name,
            description: controlType.description,
            icon: controlType.icon,
            defaultSize: controlType.defaultSize,
            minSize: controlType.minSize,
            maxSize: controlType.maxSize,
            resizable: controlType.resizable !== false,
            enableIcon: controlType.enableIcon === true,
            defaultIcon: controlType.defaultIcon,
            enableBackground: controlType.enableBackground === true,
            enableInputs: controlType.enableInputs === true,
            enableLabel: controlType.enableLabel === true,
            settingsSchema: controlType.settingsSchema ?? []
        }));
    }
}

const manager = new ControlDeckControlTypeManager();

export { manager as ControlDeckControlTypeManager };
