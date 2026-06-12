"use strict";

(function() {
    const FOLDER_TYPE_ID = "firebot:folder";

    angular
        .module("firebotApp")
        .component("controlDeckGrid", {
            bindings: {
                deck: "<",
                pageId: "<",
                pinnedPageId: "<",
                parentId: "<",
                onAddControl: "&",
                onEditControl: "&",
                onDeleteControl: "&",
                onPasteControl: "&",
                onOpenFolder: "&",
                onMoveControl: "&",
                onResizeControl: "&"
            },
            template: `
                <div class="control-deck-grid" ng-style="$ctrl.gridStyle()">
                    <div
                        ng-repeat="cell in $ctrl.cells track by (cell.control ? cell.control.id : ('empty-' + cell.col + '-' + cell.row))"
                        class="cd-cell"
                        ng-class="{ 'cd-cell-empty': !cell.control, 'cd-cell-folder': cell.control._typeInfo.isFolder, 'cd-cell-missing': cell.control._typeInfo.missing, 'cd-cell-pinned': cell.pinned, 'cd-cell-resizing': cell.control && cell.control.id === $ctrl.resizingId }"
                        ng-style="$ctrl.cellStyle(cell)"
                        data-col="{{cell.col}}"
                        data-row="{{cell.row}}"
                        data-control-id="{{!cell.pinned ? cell.control.id : ''}}"
                        draggable="{{cell.control && !cell.pinned ? 'true' : 'false'}}"
                        ng-click="$ctrl.cellClicked(cell)"
                    >
                        <div ng-if="!cell.control" class="cd-cell-add">
                            <i class="fas fa-plus muted"></i>
                            <div class="cd-cell-actions">
                                <span
                                    uib-dropdown
                                    dropdown-append-to-body
                                    ng-click="$event.stopPropagation()"
                                >
                                    <span
                                        class="cd-action"
                                        uib-tooltip="Options"
                                        tooltip-append-to-body="true"
                                        uib-dropdown-toggle
                                    >
                                        <i class="fas fa-ellipsis-v"></i>
                                    </span>
                                    <ul class="dropdown-menu" uib-dropdown-menu role="menu">
                                        <li role="menuitem" ng-class="{'disabled': !$ctrl.hasCopiedControl()}"><a href ng-disabled="!$ctrl.hasCopiedControl()" ng-click="$ctrl.paste(cell)"><i class="far fa-paste mr-2 text-center" style="width: 20px;"></i> Paste control</a></li>
                                    </ul>
                                </span>
                            </div>
                        </div>
                        <div ng-if="cell.control" class="cd-cell-content">
                            <i ng-if="cell.control._typeInfo.missing" class="fas fa-exclamation-triangle cd-cell-missing-glyph" uib-tooltip="This control's type ('{{cell.control.type}}') is not registered. It may belong to an uninstalled plugin." tooltip-append-to-body="true"></i>
                            <img ng-if="cell.control._previewIcon.kind === 'image'" class="cd-cell-icon" ng-src="{{cell.control._previewIcon.url}}" ng-style="cell.control._previewIcon.style" />
                            <lucide-icon ng-if="cell.control._typeInfo.def.id === 'firebot:switch'" class="cd-cell-glyph" name="toggle-left" color="white" size="45"></lucide-icon>
                            <lucide-icon ng-if="cell.control._previewIcon.kind === 'glyph'" class="cd-cell-glyph" name="{{cell.control._previewIcon.name}}" color="{{cell.control._previewIcon.color}}" size="{{cell.control._previewIcon.size}}"></lucide-icon>
                            <span ng-if="cell.control._previewIcon.kind === 'emoji'" class="cd-cell-emoji" ng-style="cell.control._previewIcon.style">{{cell.control._previewIcon.emoji}}</span>
                            <div class="cd-cell-name" ng-style="cell.control._labelStyle">{{cell.control.label || cell.control.name}}</div>
                            <div class="cd-cell-actions">
                                <span ng-if="!cell.pinned && cell.control._typeInfo.isFolder" class="cd-action" uib-tooltip="Open" tooltip-append-to-body="true" ng-click="$ctrl.openFolder($event, cell.control)"><i class="fas fa-folder-open"></i></span>
                                <span ng-if="!cell.pinned" class="cd-action" uib-tooltip="Edit" tooltip-append-to-body="true" ng-click="$ctrl.edit($event, cell.control)"><i class="fas fa-pen"></i></span>
                                <span
                                    ng-if="!cell.pinned"
                                    uib-dropdown
                                    dropdown-append-to-body
                                    ng-click="$event.stopPropagation()"
                                >
                                    <span
                                        class="cd-action"
                                        uib-tooltip="Options"
                                        tooltip-append-to-body="true"
                                        uib-dropdown-toggle
                                    >
                                        <i class="fas fa-ellipsis-v"></i>
                                    </span>
                                    <ul class="dropdown-menu" uib-dropdown-menu role="menu">
                                        <li role="menuitem"><a href ng-click="$ctrl.copy(cell.control)"><i class="far fa-copy mr-2 text-center" style="width: 20px;"></i> Copy</a></li>
                                        <li role="menuitem"><a href ng-click="$ctrl.delete(cell.control)" style="color: #fb7373;"><i class="far fa-trash-alt mr-2 text-center" style="width: 20px;"></i> Delete</a></li>
                                    </ul>
                                </span>
                                <span
                                    ng-if="cell.pinned"
                                    uib-dropdown
                                    dropdown-append-to-body
                                    ng-click="$event.stopPropagation()"
                                >
                                    <span
                                        class="cd-action"
                                        uib-tooltip="Options"
                                        tooltip-append-to-body="true"
                                        uib-dropdown-toggle
                                    >
                                        <i class="fas fa-ellipsis-v"></i>
                                    </span>
                                    <ul class="dropdown-menu" uib-dropdown-menu role="menu">
                                        <li role="menuitem" ng-class="{'disabled': !$ctrl.hasCopiedControl()}"><a href ng-disabled="!$ctrl.hasCopiedControl()" ng-click="$ctrl.paste(cell)"><i class="far fa-paste mr-2 text-center" style="width: 20px;"></i> Paste control</a></li>
                                    </ul>
                                </span>
                            </div>
                            <span ng-if="!cell.pinned && cell.control._typeInfo.resizable" class="cd-resize-handle" uib-tooltip="Drag to resize" tooltip-append-to-body="true"></span>
                            <div ng-if="cell.pinned" class="cd-pinned-badge" uib-tooltip="Pinned control - click to override on this page" tooltip-append-to-body="true"><i class="fas fa-thumbtack"></i></div>
                            <div ng-if="cell.pinned" class="cd-pinned-add"><i class="fas fa-plus"></i></div>
                        </div>
                    </div>
                </div>
            `,
            controller: function($element, $scope, controlDeckService, controlDeckCopyHelper, ngToast) {
                const $ctrl = this;

                $ctrl.cells = [];

                $ctrl.gridStyle = () => {
                    const grid = $ctrl.getGrid();
                    return {
                        "grid-template-columns": `repeat(${grid.cols}, 1fr)`,
                        "grid-template-rows": `repeat(${grid.rows}, 1fr)`,
                        "aspect-ratio": `${grid.cols} / ${grid.rows}`
                    };
                };

                $ctrl.getGrid = () => {
                    if (!$ctrl.deck || $ctrl.deck.grid == null) {
                        return { cols: 3, rows: 5 };
                    }
                    return $ctrl.deck.grid;
                };

                const resolvePreview = (control) => {
                    const iconScale = Math.max(control.iconSize || 100, 1) / 100;
                    const icon = control.icon;
                    if (icon == null) {
                        control._previewIcon = { kind: "none" };
                    } else if (icon.type === "glyph") {
                        control._previewIcon = {
                            kind: "glyph",
                            name: icon.name,
                            color: icon.color,
                            size: Math.round(35 * iconScale)
                        };
                    } else if (icon.type === "emoji") {
                        control._previewIcon = {
                            kind: "emoji",
                            emoji: icon.emoji,
                            style: { "font-size": `${Math.round(32 * iconScale)}px` }
                        };
                    } else if (icon.type === "image" && icon.path) {
                        const url = icon.source === "url"
                            ? icon.path
                            : (icon.path.startsWith("file://") ? icon.path : `file://${icon.path}`);
                        control._previewIcon = {
                            kind: "image",
                            url,
                            style: {
                                "max-width": `${Math.round(50 * iconScale)}px`,
                                "max-height": `${Math.round(50 * iconScale)}px`
                            }
                        };
                    } else {
                        control._previewIcon = { kind: "none" };
                    }

                    const typeDef = controlDeckService.getControlType(control.type);
                    control._typeInfo = {
                        def: typeDef,
                        missing: typeDef == null,
                        isFolder: control.type === FOLDER_TYPE_ID,
                        resizable: typeDef?.resizable !== false
                    };

                    const bg = control.background;
                    if (bg?.type === "color" && bg.color) {
                        control._previewBg = { "background-color": bg.color };
                    } else if (bg?.type === "image" && bg.path) {
                        const url = bg.source === "url"
                            ? bg.path
                            : (bg.path.startsWith("file://") ? bg.path : `file://${bg.path}`);
                        control._previewBg = {
                            "background-image": `url("${url.replace(/"/g, '\\"')}")`,
                            "background-size": "cover",
                            "background-position": "center"
                        };
                    } else {
                        control._previewBg = null;
                    }

                    const labelFont = control.label ? control.labelFont : null;
                    const labelScale = control.label ? Math.max(control.labelSize || 100, 1) / 100 : 1;
                    control._labelStyle = (labelFont || labelScale !== 1)
                        ? {
                            "font-family": labelFont?.family || undefined,
                            "font-weight": labelFont?.weight || undefined,
                            "font-style": labelFont?.italic ? "italic" : undefined,
                            "color": labelFont?.color || undefined,
                            "font-size": labelScale !== 1 ? `${Math.round(12 * labelScale)}px` : undefined
                        }
                        : null;
                };

                $ctrl.cellStyle = (cell) => {
                    const style = {
                        "grid-column": `${cell.col} / span ${cell.w}`,
                        "grid-row": `${cell.row} / span ${cell.h}`,
                        "background-color": cell.control ? "#2c3035" : "transparent"
                    };
                    if (cell.control?._previewBg) {
                        Object.assign(style, cell.control._previewBg);
                    }
                    return style;
                };

                const effectiveSize = (control) => {
                    const grid = $ctrl.getGrid();
                    const src = control._previewSize || control.size || { width: 1, height: 1 };
                    return {
                        w: Math.max(1, Math.min(src.width || 1, grid.cols)),
                        h: Math.max(1, Math.min(src.height || 1, grid.rows))
                    };
                };

                $ctrl.rebuildCells = () => {
                    const grid = $ctrl.getGrid();
                    const parentId = $ctrl.parentId ?? null;
                    const controls = ($ctrl.deck?.controls || []).filter(c =>
                        c.pageId === $ctrl.pageId && (c.parentId ?? null) === parentId);

                    const occupied = {};
                    const placed = [];
                    const needsAuto = [];

                    const fits = (col, row, w, h) => {
                        if (col < 1 || row < 1 || col + w - 1 > grid.cols || row + h - 1 > grid.rows) {
                            return false;
                        }
                        for (let r = row; r < row + h; r++) {
                            for (let c = col; c < col + w; c++) {
                                if (occupied[`${c}:${r}`]) {
                                    return false;
                                }
                            }
                        }
                        return true;
                    };

                    const mark = (col, row, w, h, control) => {
                        for (let r = row; r < row + h; r++) {
                            for (let c = col; c < col + w; c++) {
                                occupied[`${c}:${r}`] = control;
                            }
                        }
                    };

                    const findFit = (w, h) => {
                        for (let row = 1; row <= grid.rows - h + 1; row++) {
                            for (let col = 1; col <= grid.cols - w + 1; col++) {
                                if (fits(col, row, w, h)) {
                                    return { col, row };
                                }
                            }
                        }
                        return null;
                    };

                    // First pass: controls with explicit positions that still fit
                    for (const control of controls) {
                        resolvePreview(control);
                        const { w, h } = effectiveSize(control);
                        const pos = control.position;
                        if (pos && fits(pos.col, pos.row, w, h)) {
                            mark(pos.col, pos.row, w, h, control);
                            placed.push({ control, col: pos.col, row: pos.row, w, h });
                        } else {
                            needsAuto.push(control);
                        }
                    }

                    // Second pass: auto-flow remaining controls; shrink to 1x1 if needed
                    for (const control of needsAuto) {
                        const { w, h } = effectiveSize(control);
                        let spot = findFit(w, h);
                        let ew = w;
                        let eh = h;
                        if (!spot && (w > 1 || h > 1)) {
                            spot = findFit(1, 1);
                            ew = 1;
                            eh = 1;
                        }
                        if (spot) {
                            mark(spot.col, spot.row, ew, eh, control);
                            control.position = { col: spot.col, row: spot.row };
                            placed.push({ control, col: spot.col, row: spot.row, w: ew, h: eh });
                        }
                    }

                    // Pinned overlay: when editing a real page at root, show pinned
                    // controls (muted) wherever a page control hasn't claimed the slot.
                    const isPinnedContext = $ctrl.pageId === $ctrl.pinnedPageId;
                    if (!isPinnedContext && parentId == null && $ctrl.pinnedPageId != null) {
                        const pinnedControls = ($ctrl.deck?.controls || []).filter(c =>
                            c.pageId === $ctrl.pinnedPageId && (c.parentId ?? null) === null);
                        for (const control of pinnedControls) {
                            resolvePreview(control);
                            const { w, h } = effectiveSize(control);
                            const pos = control.position;
                            if (pos && fits(pos.col, pos.row, w, h)) {
                                mark(pos.col, pos.row, w, h, control);
                                placed.push({ control, col: pos.col, row: pos.row, w, h, pinned: true });
                            }
                        }
                    }

                    const cells = [...placed];
                    for (let row = 1; row <= grid.rows; row++) {
                        for (let col = 1; col <= grid.cols; col++) {
                            if (!occupied[`${col}:${row}`]) {
                                cells.push({ col, row, w: 1, h: 1, control: null });
                            }
                        }
                    }
                    $ctrl.cells = cells;
                };

                $ctrl.cellClicked = (cell) => {
                    // Empty cells add a control; pinned cells add a page override at
                    // the pinned control's anchor. Real page controls do nothing here.
                    if (!cell.control || cell.pinned) {
                        $ctrl.onAddControl({ col: cell.col, row: cell.row });
                    }
                };

                $ctrl.$onChanges = () => {
                    $ctrl.rebuildCells();
                };

                $ctrl.edit = ($event, control) => {
                    $event.stopPropagation();
                    $ctrl.onEditControl({ control });
                };

                $ctrl.delete = (control) => {
                    $ctrl.onDeleteControl({ control });
                };

                $ctrl.openFolder = ($event, control) => {
                    $event.stopPropagation();
                    $ctrl.onOpenFolder({ control });
                };

                $ctrl.copy = (control) => {
                    controlDeckCopyHelper.copyControl(control, ($ctrl.deck?.controls || []));
                    ngToast.success("Control copied to clipboard");
                };

                $ctrl.hasCopiedControl = () => {
                    return controlDeckCopyHelper.hasCopiedControl();
                };

                $ctrl.paste = (cell) => {
                    if (!$ctrl.hasCopiedControl()) {
                        return;
                    }
                    $ctrl.onPasteControl({ col: cell.col, row: cell.row });
                };

                // Native HTML5 drag-and-drop (move) + pointer-based resize handle
                $ctrl.$postLink = () => {
                    const container = $element[0];
                    let draggedControlId = null;
                    let dragOffset = { col: 0, row: 0 };
                    let resizeState = null;

                    const findControl = (controlId) => {
                        return ($ctrl.deck?.controls || []).find(c => c.id === controlId) || null;
                    };

                    const getGridEl = () => container.querySelector(".control-deck-grid");

                    // Map a screen point to a 1-based grid cell using the grid geometry
                    const cellFromPoint = (clientX, clientY) => {
                        const gridEl = getGridEl();
                        const rect = gridEl.getBoundingClientRect();
                        const styles = getComputedStyle(gridEl);
                        const gap = parseFloat(styles.columnGap || styles.gap || "0") || 0;
                        const grid = $ctrl.getGrid();
                        const cellW = (rect.width - gap * (grid.cols - 1)) / grid.cols;
                        const cellH = (rect.height - gap * (grid.rows - 1)) / grid.rows;
                        let col = Math.floor((clientX - rect.left) / (cellW + gap)) + 1;
                        let row = Math.floor((clientY - rect.top) / (cellH + gap)) + 1;
                        col = Math.max(1, Math.min(grid.cols, col));
                        row = Math.max(1, Math.min(grid.rows, row));
                        return { col, row };
                    };

                    // Occupancy snapshot of every OTHER control at the current render.
                    // Pinned overlay controls don't block resizing — a page control
                    // grows over them and occludes them.
                    const occupancyExcluding = (excludeId) => {
                        const occ = {};
                        for (const cell of $ctrl.cells) {
                            if (!cell.control || cell.control.id === excludeId || cell.pinned) {
                                continue;
                            }
                            for (let r = cell.row; r < cell.row + cell.h; r++) {
                                for (let c = cell.col; c < cell.col + cell.w; c++) {
                                    occ[`${c}:${r}`] = true;
                                }
                            }
                        }
                        return occ;
                    };

                    // Largest w×h (within wanted bounds) that fits from the control's origin
                    const largestFit = (control, wantW, wantH, occ) => {
                        const grid = $ctrl.getGrid();
                        const origin = control.position;
                        const maxW = Math.min(wantW, grid.cols - origin.col + 1);
                        const maxH = Math.min(wantH, grid.rows - origin.row + 1);
                        const cellFree = (c, r) => !occ[`${c}:${r}`];
                        let best = { width: 1, height: 1 };
                        for (let h = 1; h <= maxH; h++) {
                            for (let w = 1; w <= maxW; w++) {
                                let ok = true;
                                for (let r = origin.row; r < origin.row + h && ok; r++) {
                                    for (let c = origin.col; c < origin.col + w; c++) {
                                        if (!cellFree(c, r)) {
                                            ok = false;
                                            break;
                                        }
                                    }
                                }
                                if (ok && w * h > best.width * best.height) {
                                    best = { width: w, height: h };
                                }
                            }
                        }
                        return best;
                    };

                    const onResizeMove = (e) => {
                        if (!resizeState) {
                            return;
                        }
                        const { col, row } = cellFromPoint(e.clientX, e.clientY);
                        const wantW = Math.max(1, col - resizeState.originCol + 1);
                        const wantH = Math.max(1, row - resizeState.originRow + 1);
                        const best = largestFit(resizeState.control, wantW, wantH, resizeState.occ);
                        $scope.$apply(() => {
                            resizeState.control._previewSize = best;
                            $ctrl.rebuildCells();
                        });
                    };

                    const onResizeEnd = () => {
                        window.removeEventListener("pointermove", onResizeMove);
                        window.removeEventListener("pointerup", onResizeEnd);
                        if (!resizeState) {
                            return;
                        }
                        const control = resizeState.control;
                        const size = control._previewSize || { width: 1, height: 1 };
                        resizeState = null;
                        $ctrl.resizingId = null;
                        $scope.$apply(() => {
                            delete control._previewSize;
                            $ctrl.onResizeControl({ controlId: control.id, width: size.width, height: size.height });
                        });
                    };

                    container.addEventListener("pointerdown", (e) => {
                        const handle = e.target.closest(".cd-resize-handle");
                        if (!handle) {
                            return;
                        }
                        const cell = handle.closest(".cd-cell");
                        const control = findControl(cell && cell.dataset.controlId);
                        if (!control || !control.position) {
                            return;
                        }
                        e.preventDefault();
                        e.stopPropagation();
                        resizeState = {
                            control,
                            originCol: control.position.col,
                            originRow: control.position.row,
                            occ: occupancyExcluding(control.id)
                        };
                        $ctrl.resizingId = control.id;
                        window.addEventListener("pointermove", onResizeMove);
                        window.addEventListener("pointerup", onResizeEnd);
                    });

                    container.addEventListener("dragstart", (e) => {
                        // Don't start a move-drag when resizing via the handle
                        if (resizeState || e.target.closest(".cd-resize-handle")) {
                            e.preventDefault();
                            return;
                        }
                        const cell = e.target.closest(".cd-cell");
                        if (cell && cell.dataset.controlId) {
                            draggedControlId = cell.dataset.controlId;
                            // Remember which sub-cell of the control was grabbed, so the
                            // drop anchors from the control's top-left rather than the cursor.
                            const control = findControl(draggedControlId);
                            const grab = cellFromPoint(e.clientX, e.clientY);
                            if (control && control.position) {
                                dragOffset = {
                                    col: grab.col - control.position.col,
                                    row: grab.row - control.position.row
                                };
                            } else {
                                dragOffset = { col: 0, row: 0 };
                            }
                            e.dataTransfer.effectAllowed = "move";
                            e.dataTransfer.setData("text/plain", draggedControlId);
                        }
                    });

                    container.addEventListener("dragover", (e) => {
                        const cell = e.target.closest(".cd-cell");
                        if (cell) {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                        }
                    });

                    container.addEventListener("drop", (e) => {
                        if (!draggedControlId) {
                            return;
                        }
                        e.preventDefault();
                        // Anchor to the control's top-left by removing the grab offset
                        const cursor = cellFromPoint(e.clientX, e.clientY);
                        const col = cursor.col - dragOffset.col;
                        const row = cursor.row - dragOffset.row;
                        const controlId = draggedControlId;
                        draggedControlId = null;
                        dragOffset = { col: 0, row: 0 };
                        $scope.$apply(() => {
                            $ctrl.onMoveControl({ controlId, col, row });
                        });
                    });
                };
            }
        });
}());
