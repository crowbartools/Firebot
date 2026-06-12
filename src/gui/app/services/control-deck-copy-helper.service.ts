"use strict";

import type { ControlDeckControl, ControlDeckPage, ControlDeckService, EffectList, ObjectCopyHelper } from "../../../types";

(function() {

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { randomUUID } = require("crypto");

    // @ts-ignore
    angular
        .module("firebotApp")
        .factory("controlDeckCopyHelper", function(objectCopyHelper: ObjectCopyHelper, controlDeckService: ControlDeckService) {

            let COPIED_PAGE: {
                page: ControlDeckPage;
                controls: ControlDeckControl[];
            } | null = null;

            let COPIED_CONTROL: {
                control: ControlDeckControl;
                nestedControls?: ControlDeckControl[];
            } | null = null;


            function copyObject<T>(object: T): T {
                // @ts-ignore
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return JSON.parse(angular.toJson(object));
            }

            function isFolderControl(control: ControlDeckControl): boolean {
                return control.type === "firebot:folder";
            }

            // Regenerate effect ids within any effectlist settings params
            function regenerateEffectListIds(control: ControlDeckControl): ControlDeckControl {
                const typeDef = controlDeckService.getControlType(control.type);
                for (const param of typeDef?.settingsSchema ?? []) {
                    if (param.type === "effectlist" && control.settings?.[param.name] != null) {
                        control.settings[param.name] = objectCopyHelper.copyAndReplaceIds(
                            control.settings[param.name] as EffectList
                        );
                    }
                }
                return control;
            }

            function getCopiedNestedControls(originalId: string, newId: string, allControls: ControlDeckControl[]): ControlDeckControl[] {
                const directChildren = allControls.filter(c => c.parentId === originalId && c.id !== originalId);
                const copiedControls: ControlDeckControl[] = [];
                for (const child of directChildren) {
                    const copiedChild = copyObject(child);
                    copiedChild.id = randomUUID();
                    copiedChild.parentId = newId;
                    copiedControls.push(copiedChild);
                    if (isFolderControl(child)) {
                        const copiedNested = getCopiedNestedControls(child.id, copiedChild.id, allControls);
                        copiedControls.push(...copiedNested);
                    }
                }
                return copiedControls;
            }

            function copyControl(control: ControlDeckControl, allControls: ControlDeckControl[]) {
                const newControlId = randomUUID();

                const copiedControl = copyObject(control);
                copiedControl.id = newControlId;

                if (!isFolderControl(control)) {
                    return {
                        control: regenerateEffectListIds(copiedControl)
                    };
                }

                const copiedNestedControls = getCopiedNestedControls(control.id, copiedControl.id, allControls)
                    .map(c => regenerateEffectListIds(c));

                return {
                    control: copiedControl,
                    nestedControls: copiedNestedControls
                };
            }

            function copyPage(page: ControlDeckPage, allControls: ControlDeckControl[]) {
                const copiedPage = copyObject(page);

                const newPageId = randomUUID();
                const originalPageId = page.id;

                copiedPage.id = newPageId;

                const folderIdMap = {};
                const copiedFolders = allControls.filter(c => c.pageId === originalPageId && isFolderControl(c)).map((c) => {
                    const originalId = c.id;
                    const cloned = copyObject(c);
                    cloned.id = randomUUID();
                    folderIdMap[originalId] = cloned.id;
                    cloned.pageId = newPageId;
                    return cloned;
                });

                // Update parentId references in copied folders to point to the new ids of copied parent folders
                for (const copiedFolder of copiedFolders) {
                    if (copiedFolder.parentId != null && folderIdMap[copiedFolder.parentId] != null) {
                        copiedFolder.parentId = folderIdMap[copiedFolder.parentId];
                    }
                }

                const copiedNonFolders = allControls.filter(c => c.pageId === originalPageId && !isFolderControl(c)).map((c) => {
                    const cloned = copyObject(c);
                    cloned.id = randomUUID();
                    cloned.pageId = newPageId;
                    if (cloned.parentId != null && folderIdMap[cloned.parentId] != null) {
                        cloned.parentId = folderIdMap[cloned.parentId];
                    }
                    return cloned;
                });

                const copiedControls = [...copiedFolders, ...copiedNonFolders].map(c => regenerateEffectListIds(c));

                return {
                    page: copiedPage,
                    controls: copiedControls
                };
            }

            return {
                hasCopiedPage: function() {
                    return COPIED_PAGE != null;
                },
                copyPage: function(page: ControlDeckPage, allControls: ControlDeckControl[]) {
                    COPIED_PAGE = copyPage(page, allControls);
                },
                getCopiedPage: function() {
                    if (!COPIED_PAGE) {
                        return null;
                    }
                    const copied = copyPage(COPIED_PAGE.page, COPIED_PAGE.controls);
                    copied.page.name += " (Copy)";
                    return copied;
                },
                hasCopiedControl: function() {
                    return COPIED_CONTROL != null;
                },
                copyControl: function(control: ControlDeckControl, allControls: ControlDeckControl[]) {
                    COPIED_CONTROL = copyControl(control, allControls);
                },
                getCopiedControl: function() {
                    if (!COPIED_CONTROL) {
                        return null;
                    }
                    return copyControl(COPIED_CONTROL.control, COPIED_CONTROL.nestedControls || []);
                }
            };
        });
}());
