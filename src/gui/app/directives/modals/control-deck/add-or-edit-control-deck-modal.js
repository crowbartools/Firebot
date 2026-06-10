"use strict";

(function() {
    const { randomUUID } = require("crypto");

    // Must match CONTROL_DECK_PINNED_PAGE_ID in src/types/control-deck.ts
    const PINNED_PAGE_ID = "pinned";

    angular.module("firebotApp").component("addOrEditControlDeckModal", {
        template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">{{$ctrl.isNew ? 'Add Control Deck' : 'Edit Control Deck'}}</h4>
            </div>
            <div class="modal-body">
                <firebot-form-group name="deck-name" label="Name">
                    <firebot-input
                        model="$ctrl.deck.name"
                        placeholder-text="Enter deck name"
                        disable-variables="true"
                    />
                </firebot-form-group>

                <firebot-form-group name="deck-dimensions" label="Dimensions">
                    <div class="input-group" style="width: 25%;">
                        <input type="number" min="1" max="12" class="form-control" ng-model="$ctrl.deck.grid.cols" ng-change="$ctrl.refreshGrid()">
                        <div class="input-group-addon">&times;</div>
                        <input type="number" min="1" max="12" class="form-control" ng-model="$ctrl.deck.grid.rows" ng-change="$ctrl.refreshGrid()">
                    </div>
                </firebot-form-group>

                <label class="control-label">Grid</label>
                <div class="cd-page-bar">
                    <div
                        class="cd-page-tab cd-page-tab-pinned"
                        ng-class="{ active: $ctrl.activePageId === $ctrl.pinnedPageId }"
                        ng-click="$ctrl.setActivePage($ctrl.pinnedPageId)"
                        uib-tooltip="Controls here appear on every page unless overridden"
                    >
                        <i class="fas fa-thumbtack"></i>
                        <span class="cd-page-name">Pinned</span>
                    </div>
                    <div class="cd-page-divider"></div>
                    <ul class="cd-page-tabs" ui-sortable="$ctrl.pageSortableOptions" ng-model="$ctrl.deck.pages">
                        <li
                            ng-repeat="page in $ctrl.deck.pages"
                            class="cd-page-tab tab-btn"
                            ng-class="{ active: page.id === $ctrl.activePageId }"
                            ng-click="$ctrl.setActivePage(page.id)"
                            ng-dblclick="$ctrl.renamePage(page)"
                        >
                            <span class="cd-page-grip"><i class="fas fa-grip-vertical"></i></span>
                            <span class="cd-page-name">{{page.name}}</span>
                            <a
                                href role="button"
                                aria-label="Open page menu"
                                class="noselect clickable"
                                style="color: white;padding: 0 12px 0 6px;"
                                context-menu="$ctrl.pageMenuOptions(page)"
                                context-menu-on="click"
                            >
                                <i class="fas fa-ellipsis-v"></i>
                            </a>
                        </li>
                    </ul>
                    <div class="btn-group" uib-dropdown dropdown-append-to-body>
                        <button
                            type="button"
                            class="btn btn-default-outlined btn-sm"
                            style="padding: 4px 10px !important;"
                            uib-dropdown-toggle
                        ><i class="fas fa-plus mr-1"></i> Add Page <span class="caret"></span></button>
                        <ul class="dropdown-menu" uib-dropdown-menu role="menu">
                            <li role="menuitem"><a href ng-click="$ctrl.addPage()"><i class="far fa-plus mr-2 text-center" style="width: 20px;"></i> New Page</a></li>
                            <li role="menuitem" ng-class="{'disabled': !$ctrl.hasCopiedPage()}"><a href ng-disabled="!$ctrl.hasCopiedPage()" ng-click="$ctrl.pastePage()"><i class="far fa-paste mr-2 text-center" style="width: 20px;"></i> Paste Page</a></li>
                        </ul>
                    </div>
                </div>

                <div class="cd-breadcrumb" style="margin-top: 15px;">
                    <span class="cd-crumb clickable" ng-click="$ctrl.goToRoot()">Home</span>
                    <span ng-repeat="folder in $ctrl.folderTrail">
                        <span class="cd-crumb-sep"> / </span>
                        <span class="cd-crumb clickable" ng-click="$ctrl.goToFolder($index)">{{folder.name}}</span>
                    </span>
                </div>

                <control-deck-grid
                    deck="$ctrl.gridDeck"
                    page-id="$ctrl.activePageId"
                    pinned-page-id="$ctrl.pinnedPageId"
                    parent-id="$ctrl.currentParentId"
                    on-add-control="$ctrl.addControl(col, row)"
                    on-edit-control="$ctrl.editControl(control)"
                    on-delete-control="$ctrl.deleteControl(control)"
                    on-paste-control="$ctrl.pasteControl(col, row)"
                    on-open-folder="$ctrl.openFolder(control)"
                    on-move-control="$ctrl.moveControl(controlId, col, row)"
                    on-resize-control="$ctrl.resizeControl(controlId, width, height)"
                ></control-deck-grid>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
            </div>
        `,
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&",
            modalInstance: "<"
        },
        controller: function(controlDeckService, modalService, utilityService, controlDeckCopyHelper, ngToast) {
            const $ctrl = this;

            $ctrl.isNew = true;
            $ctrl.folderStack = [];
            $ctrl.activePageId = null;
            $ctrl.pinnedPageId = PINNED_PAGE_ID;

            $ctrl.deck = {
                name: "",
                grid: { cols: 7, rows: 3 },
                pages: [],
                controls: []
            };

            $ctrl.pageSortableOptions = {
                handle: ".cd-page-grip",
                stop: () => {
                    $ctrl.refreshGrid();
                }
            };

            $ctrl.pageMenuOptions = (page) => {
                return [
                    {
                        html: `<a href><i class="far fa-pen mr-2 text-center" style="width: 20px;"></i> Rename</a>`,
                        click: () => {
                            $ctrl.renamePage(page);
                        }
                    },
                    {
                        html: `<a href><i class="far fa-copy mr-2 text-center" style="width: 20px;"></i> Copy</a>`,
                        click: () => {
                            $ctrl.copyPage(page);
                        }
                    },
                    {
                        html: `<a href style="color: #fb7373;"><i class="far fa-trash-alt text-center mr-2" style="width: 20px;"></i> Delete</a>`,
                        click: () => {
                            $ctrl.deletePage(page);
                        },
                        enabled: $ctrl.deck.pages.length > 1
                    }
                ];
            };

            const ensurePages = () => {
                if (!Array.isArray($ctrl.deck.pages) || $ctrl.deck.pages.length === 0) {
                    const pageId = randomUUID();
                    $ctrl.deck.pages = [{ id: pageId, name: "Page 1" }];
                    // Assign any page-less controls to the first page
                    $ctrl.deck.controls.forEach((c) => {
                        if (c.pageId == null) {
                            c.pageId = pageId;
                        }
                    });
                }
                if (!$ctrl.deck.pages.some(p => p.id === $ctrl.activePageId) && $ctrl.activePageId !== PINNED_PAGE_ID) {
                    $ctrl.activePageId = $ctrl.deck.pages[0].id;
                }
            };

            $ctrl.$onInit = () => {
                if ($ctrl.resolve.deck) {
                    $ctrl.deck = JSON.parse(angular.toJson($ctrl.resolve.deck));
                    $ctrl.isNew = false;
                }
                if ($ctrl.deck.grid == null) {
                    $ctrl.deck.grid = { cols: 3, rows: 5 };
                }
                if ($ctrl.deck.controls == null) {
                    $ctrl.deck.controls = [];
                }
                ensurePages();
                $ctrl.refreshGrid();
            };

            // The grid component rebuilds on binding reference change
            $ctrl.refreshGrid = () => {
                $ctrl.gridDeck = angular.extend({}, $ctrl.deck);
            };

            $ctrl.setActivePage = (pageId) => {
                if (pageId === $ctrl.activePageId) {
                    return;
                }
                $ctrl.activePageId = pageId;
                $ctrl.folderStack = [];
                $ctrl.refreshGrid();
            };

            $ctrl.addPage = () => {
                const pageId = randomUUID();
                $ctrl.deck.pages.push({ id: pageId, name: `Page ${$ctrl.deck.pages.length + 1}` });
                $ctrl.setActivePage(pageId);
            };

            $ctrl.renamePage = (page) => {
                const target = page || $ctrl.deck.pages.find(p => p.id === $ctrl.activePageId);
                if (target == null) {
                    return;
                }
                utilityService.openGetInputModal(
                    {
                        model: target.name,
                        label: "Rename Page",
                        saveText: "Save",
                        validationFn: value => value != null && value.trim().length > 0,
                        validationText: "Page name cannot be empty."
                    },
                    (newName) => {
                        target.name = newName.trim();
                        $ctrl.refreshGrid();
                    }
                );
            };

            $ctrl.copyPage = (page) => {
                controlDeckCopyHelper.copyPage(page, $ctrl.deck.controls);
                ngToast.success("Page copied to clipboard.");
            };

            $ctrl.hasCopiedPage = () => {
                return controlDeckCopyHelper.hasCopiedPage();
            };

            $ctrl.pastePage = () => {
                if (!$ctrl.hasCopiedPage()) {
                    return;
                }
                const copiedPageDetails = controlDeckCopyHelper.getCopiedPage();
                if (copiedPageDetails == null) {
                    return;
                }
                const { page: copiedPage, controls: copiedControls } = copiedPageDetails;

                $ctrl.deck.pages.push(copiedPage);
                $ctrl.deck.controls.push(...copiedControls);

                $ctrl.setActivePage(copiedPage.id);
            };

            $ctrl.deletePage = () => {
                if ($ctrl.deck.pages.length <= 1) {
                    return;
                }
                const target = $ctrl.deck.pages.find(p => p.id === $ctrl.activePageId);
                if (target == null) {
                    return;
                }
                utilityService
                    .showConfirmationModal({
                        title: "Delete Page",
                        question: `Delete the page "${target.name}" and all of its controls?`,
                        confirmLabel: "Delete",
                        confirmBtnType: "btn-danger"
                    })
                    .then((confirmed) => {
                        if (confirmed) {
                            $ctrl.deck.pages = $ctrl.deck.pages.filter(p => p.id !== target.id);
                            $ctrl.deck.controls = $ctrl.deck.controls.filter(c => c.pageId !== target.id);
                            $ctrl.activePageId = $ctrl.deck.pages[0].id;
                            $ctrl.folderStack = [];
                            $ctrl.refreshGrid();
                        }
                    });
            };

            Object.defineProperty($ctrl, "currentParentId", {
                get() {
                    return $ctrl.folderStack.length ? $ctrl.folderStack[$ctrl.folderStack.length - 1] : null;
                }
            });

            Object.defineProperty($ctrl, "folderTrail", {
                get() {
                    return $ctrl.folderStack.map(id => $ctrl.deck.controls.find(c => c.id === id)).filter(c => c != null);
                }
            });

            $ctrl.goToRoot = () => {
                $ctrl.folderStack = [];
                $ctrl.refreshGrid();
            };

            $ctrl.goToFolder = (index) => {
                $ctrl.folderStack = $ctrl.folderStack.slice(0, index + 1);
                $ctrl.refreshGrid();
            };

            $ctrl.openFolder = (control) => {
                $ctrl.folderStack.push(control.id);
                $ctrl.refreshGrid();
            };

            function addNewControl(col, row, control) {
                control.id = randomUUID();
                control.pageId = $ctrl.activePageId;
                control.parentId = $ctrl.currentParentId;
                control.position = { col, row };
                $ctrl.deck.controls.push(control);
                $ctrl.refreshGrid();
            }

            $ctrl.addControl = (col, row) => {
                modalService.showModal({
                    component: "addOrEditControlDeckControlModal",
                    breadcrumbName: "Add Control",
                    size: "md",
                    closeCallback: (response) => {
                        if (response && response.control) {
                            const control = response.control;
                            addNewControl(col, row, control);
                        }
                    }
                });
            };

            $ctrl.pasteControl = (col, row) => {
                if (!controlDeckCopyHelper.hasCopiedControl()) {
                    return;
                }

                const { control: copiedControl, nestedControls } = controlDeckCopyHelper.getCopiedControl();

                if (nestedControls?.length) {
                    $ctrl.deck.controls.push(...nestedControls.map((c) => {
                        c.pageId = $ctrl.activePageId;
                        return c;
                    }));
                }

                const controlAtLocation = $ctrl.deck.controls.find((c) => {
                    if (c.pageId !== $ctrl.activePageId || (c.parentId ?? null) !== $ctrl.currentParentId) {
                        return false;
                    }
                    const pos = c.position;
                    return pos && col >= pos.col && col < pos.col + (c.size?.width || 1) &&
                        row >= pos.row && row < pos.row + (c.size?.height || 1);
                });

                if (controlAtLocation) {
                    // shouldn't be possible to have a paste option there is an existing control here, but just in case
                    return;
                }

                // see if control at its current size can fit in the target location, if not, resize it to 1x1
                const grid = $ctrl.deck.grid;

                // clamp size to the grid dimensions. example if grid is 8x4 and control is 2x1 but pasted in column 8, it would need to be resized to 1x1 to fit
                let sizeW = Math.min(copiedControl.size?.width || 1, grid.cols);
                if (col + sizeW - 1 > grid.cols) {
                    sizeW = grid.cols - col + 1;
                }
                let sizeH = Math.min(copiedControl.size?.height || 1, grid.rows);
                if (row + sizeH - 1 > grid.rows) {
                    sizeH = grid.rows - row + 1;
                }

                const overlapsWithExistingControl = $ctrl.deck.controls.some((c) => {
                    if (c.pageId !== $ctrl.activePageId || (c.parentId ?? null) !== $ctrl.currentParentId) {
                        return false;
                    }
                    const pos = c.position;
                    // check if any part of the pasted control would overlap with an existing control
                    return pos && col < pos.col + (c.size?.width || 1) && col + sizeW > pos.col &&
                        row < pos.row + (c.size?.height || 1) && row + sizeH > pos.row;
                });

                if (overlapsWithExistingControl) {
                    // if it would overlap, just place the control as 1x1
                    copiedControl.size = { width: 1, height: 1 };
                } else {
                    copiedControl.size = { width: sizeW, height: sizeH };
                }

                copiedControl.pageId = $ctrl.activePageId;
                copiedControl.parentId = $ctrl.currentParentId;
                copiedControl.position = { col, row };

                $ctrl.deck.controls.push(copiedControl);

                $ctrl.refreshGrid();
            };

            $ctrl.editControl = (control) => {
                modalService.showModal({
                    component: "addOrEditControlDeckControlModal",
                    breadcrumbName: "Edit Control",
                    size: "md",
                    resolveObj: {
                        control: () => control
                    },
                    closeCallback: (response) => {
                        if (response && response.control) {
                            const index = $ctrl.deck.controls.findIndex(c => c.id === control.id);
                            if (index > -1) {
                                const updated = response.control;
                                updated.id = control.id;
                                updated.pageId = control.pageId;
                                updated.parentId = control.parentId ?? null;
                                updated.position = control.position;
                                delete updated._previewIcon;
                                $ctrl.deck.controls[index] = updated;
                                $ctrl.refreshGrid();
                            }
                        }
                    }
                });
            };

            const collectDescendantIds = (controlId) => {
                const ids = [controlId];
                const children = $ctrl.deck.controls.filter(c => c.parentId === controlId);
                for (const child of children) {
                    ids.push(...collectDescendantIds(child.id));
                }
                return ids;
            };

            $ctrl.deleteControl = (control) => {
                const isFolder = control.type === "folder";
                utilityService
                    .showConfirmationModal({
                        title: "Delete Control",
                        question: isFolder
                            ? `Delete the folder "${control.name}" and everything inside it?`
                            : `Delete the control "${control.name}"?`,
                        confirmLabel: "Delete",
                        confirmBtnType: "btn-danger"
                    })
                    .then((confirmed) => {
                        if (confirmed) {
                            const idsToRemove = collectDescendantIds(control.id);
                            $ctrl.deck.controls = $ctrl.deck.controls.filter(c => !idsToRemove.includes(c.id));
                            $ctrl.refreshGrid();
                        }
                    });
            };

            $ctrl.moveControl = (controlId, col, row) => {
                const control = $ctrl.deck.controls.find(c => c.id === controlId);
                if (control == null) {
                    return;
                }

                const grid = $ctrl.deck.grid;
                const sizeW = Math.min(control.size?.width || 1, grid.cols);
                const sizeH = Math.min(control.size?.height || 1, grid.rows);

                // Keep the control's footprint within the grid bounds
                const targetCol = Math.max(1, Math.min(col, grid.cols - sizeW + 1));
                const targetRow = Math.max(1, Math.min(row, grid.rows - sizeH + 1));

                // Simple swap when both controls are same size and there's an occupant
                const occupant = $ctrl.deck.controls.find((c) => {
                    if (c.id === controlId || c.pageId !== control.pageId
                        || (c.parentId ?? null) !== (control.parentId ?? null)) {
                        return false;
                    }
                    const pos = c.position;
                    return pos && (targetCol >= pos.col && targetCol < pos.col + (c.size?.width || 1)) &&
                        (targetRow >= pos.row && targetRow < pos.row + (c.size?.height || 1));
                });
                if (occupant) {
                    // Only swap if occupant is same size and would fit in the original position
                    const occupantSizeW = occupant.size?.width || 1;
                    const occupantSizeH = occupant.size?.height || 1;
                    if (occupantSizeW !== sizeW || occupantSizeH !== sizeH) {
                        return;
                    }
                    occupant.position = control.position || null;
                }

                control.position = { col: targetCol, row: targetRow };
                $ctrl.refreshGrid();
            };

            $ctrl.resizeControl = (controlId, width, height) => {
                const control = $ctrl.deck.controls.find(c => c.id === controlId);
                if (control == null) {
                    return;
                }
                if (width <= 1 && height <= 1) {
                    delete control.size;
                } else {
                    control.size = { width, height };
                }
                $ctrl.refreshGrid();
            };

            const stripPreview = (controls) => {
                return controls.map((c) => {
                    const clone = angular.extend({}, c);
                    delete clone._previewIcon;
                    delete clone._previewSize;
                    return clone;
                });
            };

            $ctrl.save = () => {
                if ($ctrl.deck.name == null || $ctrl.deck.name.trim() === "") {
                    ngToast.create("Please provide a name for the deck.");
                    return;
                }

                const deckToSave = angular.extend({}, $ctrl.deck);
                deckToSave.controls = stripPreview($ctrl.deck.controls);

                const saved = controlDeckService.saveDeck(deckToSave);
                if (saved) {
                    $ctrl.close();
                } else {
                    ngToast.create("Failed to save control deck. Check logs for details.");
                }
            };
        }
    });
}());
