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
                <h4>Name</h4>
                <input type="text" class="form-control" ng-model="$ctrl.deck.name" placeholder="Enter deck name">

                <div style="display:flex; gap: 30px; margin-top: 20px; align-items: flex-end;">
                    <div>
                        <h4>Columns</h4>
                        <input type="number" min="1" max="12" class="form-control" style="width: 90px;" ng-model="$ctrl.deck.grid.cols" ng-change="$ctrl.refreshGrid()">
                    </div>
                    <div>
                        <h4>Rows</h4>
                        <input type="number" min="1" max="12" class="form-control" style="width: 90px;" ng-model="$ctrl.deck.grid.rows" ng-change="$ctrl.refreshGrid()">
                    </div>
                </div>

                <div class="cd-page-bar" style="margin-top: 20px;">
                    <div
                        class="cd-page-tab cd-page-tab-pinned"
                        ng-class="{ active: $ctrl.activePageId === $ctrl.pinnedPageId }"
                        ng-click="$ctrl.setActivePage($ctrl.pinnedPageId)"
                        uib-tooltip="Controls here appear on every page unless overridden"
                    >
                        <i class="fas fa-thumbtack"></i>
                        <span class="cd-page-name">Pinned</span>
                    </div>
                    <ul class="cd-page-tabs" ui-sortable="$ctrl.pageSortableOptions" ng-model="$ctrl.deck.pages">
                        <li
                            ng-repeat="page in $ctrl.deck.pages"
                            class="cd-page-tab"
                            ng-class="{ active: page.id === $ctrl.activePageId }"
                            ng-click="$ctrl.setActivePage(page.id)"
                            ng-dblclick="$ctrl.renamePage(page)"
                        >
                            <span class="cd-page-grip"><i class="fas fa-grip-vertical"></i></span>
                            <span class="cd-page-name">{{page.name}}</span>
                        </li>
                    </ul>
                    <div class="cd-page-actions">
                        <button type="button" class="btn btn-default btn-sm" ng-click="$ctrl.addPage()"><i class="fas fa-plus mr-1"></i> Page</button>
                        <button type="button" class="btn btn-default btn-sm" ng-click="$ctrl.renamePage()" ng-disabled="$ctrl.activePageId === $ctrl.pinnedPageId" uib-tooltip="Rename current page"><i class="fas fa-pen"></i></button>
                        <button type="button" class="btn btn-default btn-sm" ng-click="$ctrl.deletePage()" ng-disabled="$ctrl.activePageId === $ctrl.pinnedPageId || $ctrl.deck.pages.length <= 1" uib-tooltip="Delete current page"><i class="fas fa-trash-alt"></i></button>
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
        controller: function(controlDeckService, modalService, utilityService, ngToast) {
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

            $ctrl.addControl = (col, row) => {
                modalService.showModal({
                    component: "addOrEditControlDeckControlModal",
                    size: "md",
                    closeCallback: (response) => {
                        if (response && response.control) {
                            const control = response.control;
                            control.id = randomUUID();
                            control.pageId = $ctrl.activePageId;
                            control.parentId = $ctrl.currentParentId;
                            control.position = { col, row };
                            $ctrl.deck.controls.push(control);
                            $ctrl.refreshGrid();
                        }
                    }
                });
            };

            $ctrl.editControl = (control) => {
                modalService.showModal({
                    component: "addOrEditControlDeckControlModal",
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

                // Simple swap when both controls are single cells
                if (sizeW === 1 && sizeH === 1) {
                    const occupant = $ctrl.deck.controls.find((c) => {
                        if (c.id === controlId || c.pageId !== control.pageId
                            || (c.parentId ?? null) !== (control.parentId ?? null)) {
                            return false;
                        }
                        const isSingle = (c.size?.width || 1) === 1 && (c.size?.height || 1) === 1;
                        const pos = c.position;
                        return isSingle && pos && pos.col === targetCol && pos.row === targetRow;
                    });
                    if (occupant) {
                        occupant.position = control.position || null;
                    }
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
