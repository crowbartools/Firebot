import type { ControlDeckControlType } from "../../../types";

import { CONTROL_DECK_FOLDER_TYPE_ID } from "../../../types/control-deck";

type FolderParams = {
    autoReturn: boolean;
};

export const folderControlType: ControlDeckControlType<FolderParams> = {
    id: CONTROL_DECK_FOLDER_TYPE_ID,
    name: "Folder",
    description: "A folder that can contain other controls",
    icon: "fa-folder",
    enableIcon: true,
    defaultIcon: { type: "glyph", name: "folder" },
    enableBackground: true,
    enableLabel: true,
    settingsSchema: [
        {
            name: "autoReturn",
            title: "Auto Return",
            description: "If enabled, the folder will automatically return to the parent after a control within it is pressed.",
            type: "boolean",
            useSwitch: true,
            default: false
        }
    ],
    onInteraction: () => {
        // Folder navigation is handled client-side on the hosted page
    }
};
