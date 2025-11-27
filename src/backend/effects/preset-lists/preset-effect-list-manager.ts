import { PresetEffectList } from "../../../types/effects";

import JsonDbManager from "../../database/json-db-manager";
import frontendCommunicator from "../../common/frontend-communicator";

class PresetEffectListManager extends JsonDbManager<PresetEffectList> {
    constructor() {
        super("Preset Effect List", "/effects/preset-effect-lists");

        frontendCommunicator.on("preset-effect-lists:get-preset-effect-lists",
            () => this.getAllItems()
        );

        frontendCommunicator.on("preset-effect-lists:save-preset-effect-list",
            (data: { presetEffectList: PresetEffectList, isNew: boolean }) =>
                this.saveItem(data.presetEffectList, data.isNew)
        );

        frontendCommunicator.on("preset-effect-lists:save-all-preset-effect-lists",
            (allPresetEffectLists: PresetEffectList[]) => this.saveAllItems(allPresetEffectLists)
        );

        frontendCommunicator.on("preset-effect-lists:delete-preset-effect-list",
            (id: string) => this.deleteItem(id)
        );
    }

    triggerUiRefresh(): void {
        frontendCommunicator.send("all-preset-lists", this.getAllItems());
    }
}

const presetEffectListManager = new PresetEffectListManager();

export { presetEffectListManager as PresetEffectListManager };