"use strict";

(function() {
    angular
        .module('firebotApp')
        .component("overlayPositionEditor", {
            bindings: {
                model: "=",
                minWidth: "<?",
                minHeight: "<?",
                canResetPosition: "<?",
                defaultAspectRatio: "<?",
                resetKey: "<?"
            },
            template: `
                <div class="overlay-position-editor">
                    <div class="overlay-dimensions" uib-tooltip="Overlay Resolution" tooltip-append-to-body="true" ng-click="$ctrl.openEditResolutionModal()">
                        {{ $ctrl.overlayResWidth }} x {{ $ctrl.overlayResHeight }} <i class="far fa-edit" aria-hidden="true"></i>
                    </div>
                    <div class="overlay-canvas" ng-style="$ctrl.getCanvasStyle()">
                        <div
                            class="overlay-widget-preview"
                            ng-style="$ctrl.getPreviewStyle()"
                            ng-mousedown="$ctrl.startDragging($event)"
                            ng-transclude>
                            <div
                                class="resize-handle corner-handle top-left"
                                ng-mousedown="$ctrl.startCornerResizing($event, 'topLeft')">
                            </div>
                            <div
                                class="resize-handle corner-handle top-right"
                                ng-mousedown="$ctrl.startCornerResizing($event, 'topRight')">
                            </div>
                            <div
                                class="resize-handle corner-handle bottom-left"
                                ng-mousedown="$ctrl.startCornerResizing($event, 'bottomLeft')">
                            </div>
                            <div
                                class="resize-handle corner-handle bottom-right"
                                ng-mousedown="$ctrl.startCornerResizing($event, 'bottomRight')">
                            </div>
                        </div>

                        <!-- Center guide overlays -->
                        <div class="center-guide horizontal" ng-show="$ctrl.showHorizontalGuide"></div>
                        <div class="center-guide vertical" ng-show="$ctrl.showVerticalGuide"></div>

                        <!-- Alignment buttons -->
                        <div class="alignment-controls">
                            <button class="alignment-button" ng-click="$ctrl.centerHorizontally()" uib-tooltip="Center Horizontally" tooltip-append-to-body="true" title="Center Horizontally">
                                <i class="fas fa-arrows-alt-h"></i>
                            </button>
                            <button class="alignment-button" ng-click="$ctrl.centerVertically()" uib-tooltip="Center Vertically" tooltip-append-to-body="true" title="Center Vertically">
                                <i class="fas fa-arrows-alt-v"></i>
                            </button>
                            <button class="alignment-button" ng-click="$ctrl.centerBoth()" uib-tooltip="Center Both" tooltip-append-to-body="true" title="Center Both">
                                <i class="fas fa-bullseye"></i>
                            </button>
                            <button class="alignment-button" ng-click="$ctrl.undoPosition()" ng-disabled="!$ctrl.canUndo()" uib-tooltip="Undo Last Change" tooltip-append-to-body="true" title="Undo Last Change">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="position-controls mt-3">
                        <div class="input-group mb-2">
                            <span class="input-group-addon" style="width: 25%">X Position (px)</span>
                            <input
                                type="number"
                                class="form-control"
                                ng-model="$ctrl.displayModel.x"
                                min="0"
                                step="1"
                                ng-change="$ctrl.updateFromDisplayModel()">

                            <span class="input-group-addon ms-2" style="width: 25%">Y Position (px)</span>
                            <input
                                type="number"
                                class="form-control"
                                ng-model="$ctrl.displayModel.y"
                                min="0"
                                step="1"
                                ng-change="$ctrl.updateFromDisplayModel()">
                        </div>
                        <div class="input-group">
                            <span class="input-group-addon" style="width: 25%">Width (px)</span>
                            <input
                                type="number"
                                class="form-control"
                                ng-model="$ctrl.displayModel.width"
                                min="1"
                                step="1"
                                ng-change="$ctrl.updateFromDisplayModel(false)"
                                ng-blur="$ctrl.updateFromDisplayModel(true)"
                            >

                            <span class="input-group-addon ms-2" style="width: 25%">Height (px)</span>
                            <input
                                type="number"
                                class="form-control"
                                ng-model="$ctrl.displayModel.height"
                                min="1"
                                step="1"
                                ng-change="$ctrl.updateFromDisplayModel(false)"
                                ng-blur="$ctrl.updateFromDisplayModel(true)"
                            >
                        </div>
                    </div>
                </div>
            `,
            transclude: true,
            controller: function($element, $document, $scope, settingsService, modalFactory) {
                const $ctrl = this;

                // Calculated rendered scale (area ratio) of the editor vs the overlay resolution
                $ctrl.scalePercentage = 1; // 1 as default/fallback

                function computeScale() {
                    const canvasEl = $element.find('.overlay-canvas')[0];
                    if (!canvasEl) {
                        return;
                    }
                    const rect = canvasEl.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        const areaRatio = (rect.width * rect.height) / ($ctrl.overlayResWidth * $ctrl.overlayResHeight);
                        $scope.$applyAsync(() => {
                            $ctrl.scalePercentage = areaRatio;
                        });
                    }
                }

                // Dynamically create a default model:
                // - 16:9 aspect ratio
                // - ~25% of the overlay area
                // - Centered
                function resetModelToDefault() {
                    const W = $ctrl.overlayResWidth;
                    const H = $ctrl.overlayResHeight;

                    const aspectW = $ctrl.defaultAspectRatio?.width ?? 16;
                    const aspectH = $ctrl.defaultAspectRatio?.height ?? 9;
                    const aspectRatio = aspectW / aspectH;

                    // Target 50% of both overlay width and height while maintaining aspect ratio
                    const targetWidth = 0.50 * W;
                    const targetHeight = 0.50 * H;

                    // Calculate which dimension is the limiting factor based on aspect ratio
                    let width, height;
                    if (targetWidth / aspectRatio <= targetHeight) {
                        // Width is the limiting factor
                        width = targetWidth;
                        height = width / aspectRatio;
                    } else {
                        // Height is the limiting factor
                        height = targetHeight;
                        width = height * aspectRatio;
                    }

                    // Ensure it fits within the overlay (just in case of extreme aspect ratios)
                    if (width > W || height > H) {
                        const fitScale = Math.min(W / width, H / height);
                        width *= fitScale;
                        height *= fitScale;
                    }

                    // Round to whole pixels
                    width = Math.round(width);
                    height = Math.round(height);

                    // Center the rectangle
                    const x = Math.round((W - width) / 2);
                    const y = Math.round((H - height) / 2);

                    $ctrl.model = { x, y, width, height };


                }

                function init() {
                    const overlayResSetting = settingsService.getSetting("OverlayResolution") || {};

                    // Set default overlay resolution (1280x720) if not provided
                    $ctrl.overlayResWidth = overlayResSetting.width || 1280;
                    $ctrl.overlayResHeight = overlayResSetting.height || 720;

                    // Defer scale calc until after DOM paints
                    setTimeout(computeScale, 0);

                    // Derive aspect ratio from the resolved dimensions
                    $ctrl.aspectRatioValue = $ctrl.overlayResWidth / $ctrl.overlayResHeight;

                    // Set minimum dimensions for the preview widget in pixels
                    const minPixelWidth = $ctrl.minWidth || 50; // minimum 50px width
                    const minPixelHeight = $ctrl.minHeight || 50; // minimum 50px height

                    // Convert minimum dimensions to percentages for internal use
                    $ctrl.minimumWidth = (minPixelWidth / $ctrl.overlayResWidth) * 100;
                    $ctrl.minimumHeight = (minPixelHeight / $ctrl.overlayResHeight) * 100;

                    // Initialize model with default values if not provided
                    if (!$ctrl.model) {
                        resetModelToDefault();
                    }

                    // Make sure all required properties exist with pixel defaults
                    $ctrl.model.x = $ctrl.model.x !== undefined ? $ctrl.model.x : 128;
                    $ctrl.model.y = $ctrl.model.y !== undefined ? $ctrl.model.y : 72;
                    $ctrl.model.width = $ctrl.model.width !== undefined ? $ctrl.model.width : 384;
                    $ctrl.model.height = $ctrl.model.height !== undefined ? $ctrl.model.height : 144;

                    // Create a working display model that's a copy of the actual model
                    $ctrl.displayModel = {
                        x: $ctrl.model.x,
                        y: $ctrl.model.y,
                        width: $ctrl.model.width,
                        height: $ctrl.model.height
                    };

                    // Convert pixel values to percentages for internal rendering
                    $ctrl.internalModel = {
                        x: ($ctrl.model.x / $ctrl.overlayResWidth) * 100,
                        y: ($ctrl.model.y / $ctrl.overlayResHeight) * 100,
                        width: ($ctrl.model.width / $ctrl.overlayResWidth) * 100,
                        height: ($ctrl.model.height / $ctrl.overlayResHeight) * 100
                    };

                    $ctrl.updateInternalModel();

                    // Initialize history stack
                    $ctrl.history = [];
                    $ctrl.pushHistorySnapshot();
                }

                // Set default values and initialize
                $ctrl.$onInit = function() {
                    console.log("OverlayPositionEditor initialized with model:", $ctrl.model);
                    init();
                };

                let waitingForAspectRatioChange = false;
                $ctrl.$onChanges = function(changes) {
                    if (!$ctrl.canResetPosition) {
                        return;
                    }
                    if (changes.resetKey && !changes.resetKey.isFirstChange() && changes.resetKey.currentValue !== changes.resetKey.previousValue) {
                        waitingForAspectRatioChange = true;
                    } else if (changes.defaultAspectRatio && waitingForAspectRatioChange) {
                        waitingForAspectRatioChange = false;
                        resetModelToDefault();
                        $ctrl.updateModel();
                    }
                };

                $ctrl.openEditResolutionModal = function() {
                    modalFactory.openEditOverlayResolutionModal(() => {
                        init();
                    });
                };

                // Calculate canvas dimensions
                $ctrl.getCanvasStyle = function() {
                    return {
                        'position': 'relative',
                        'width': '100%',
                        'padding-top': `${100 / $ctrl.aspectRatioValue}%`,
                        'background-color': '#333',
                        'border': '2px solid #555',
                        'overflow': 'hidden'
                    };
                };

                // Calculate preview widget style
                $ctrl.getPreviewStyle = function() {
                    return {
                        'position': 'absolute',
                        'left': `${$ctrl.internalModel.x}%`,
                        'top': `${$ctrl.internalModel.y}%`,
                        'width': `${$ctrl.internalModel.width}%`,
                        'height': `${$ctrl.internalModel.height}%`,
                        'background-color': 'rgba(50, 120, 255, 0.5)',
                        'border': '2px solid rgba(50, 120, 255, 0.8)',
                        'cursor': 'move',
                        'user-select': 'none',
                        'display': 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                        'overflow': 'hidden'
                    };
                };

                // Update the ngModel value
                $ctrl.updateModel = function(enforceMinimums = true) {
                    // Update display model with pixel values
                    $ctrl.displayModel.x = Math.round($ctrl.model.x);
                    $ctrl.displayModel.y = Math.round($ctrl.model.y);
                    $ctrl.displayModel.width = Math.round($ctrl.model.width);
                    $ctrl.displayModel.height = Math.round($ctrl.model.height);

                    // Ensure pixel values are within valid range
                    $ctrl.displayModel.x = Math.min($ctrl.overlayResWidth - $ctrl.displayModel.width,
                        Math.max(0, $ctrl.displayModel.x));
                    $ctrl.displayModel.y = Math.min($ctrl.overlayResHeight - $ctrl.displayModel.height,
                        Math.max(0, $ctrl.displayModel.y));
                    if (enforceMinimums) {
                        $ctrl.displayModel.width = Math.min($ctrl.overlayResWidth,
                            Math.max(Math.round($ctrl.minimumWidth * $ctrl.overlayResWidth / 100), $ctrl.displayModel.width));
                        $ctrl.displayModel.height = Math.min($ctrl.overlayResHeight,
                            Math.max(Math.round($ctrl.minimumHeight * $ctrl.overlayResHeight / 100), $ctrl.displayModel.height));
                    } else {
                        $ctrl.displayModel.width = Math.min($ctrl.overlayResWidth,
                            Math.max(1, $ctrl.displayModel.width));
                        $ctrl.displayModel.height = Math.min($ctrl.overlayResHeight,
                            Math.max(1, $ctrl.displayModel.height));
                    }

                    // Update model with corrected pixel values
                    $ctrl.model.x = $ctrl.displayModel.x;
                    $ctrl.model.y = $ctrl.displayModel.y;
                    $ctrl.model.width = $ctrl.displayModel.width;
                    $ctrl.model.height = $ctrl.displayModel.height;

                    // Update internal percentage model for rendering
                    $ctrl.updateInternalModel();
                };

                // Update from display model inputs
                $ctrl.updateFromDisplayModel = function(enforceMinimums = true) {
                    // Copy values from display model to actual model
                    $ctrl.model.x = $ctrl.displayModel.x;
                    $ctrl.model.y = $ctrl.displayModel.y;
                    $ctrl.model.width = $ctrl.displayModel.width;
                    $ctrl.model.height = $ctrl.displayModel.height;

                    $ctrl.updateModel(enforceMinimums);
                };

                // Update internal percentage model for rendering
                $ctrl.updateInternalModel = function() {
                    // Convert pixel values to percentages for canvas display
                    $ctrl.internalModel = {
                        x: ($ctrl.model.x / $ctrl.overlayResWidth) * 100,
                        y: ($ctrl.model.y / $ctrl.overlayResHeight) * 100,
                        width: ($ctrl.model.width / $ctrl.overlayResWidth) * 100,
                        height: ($ctrl.model.height / $ctrl.overlayResHeight) * 100
                    };
                };

                // Handle dragging
                $ctrl.startDragging = function(event) {
                    // Ignore if clicking on any resize handle
                    if (event.target.classList &&
                        (event.target.classList.contains('resize-handle') ||
                        (event.target.parentElement && event.target.parentElement.classList.contains('resize-handle')))) {
                        return;
                    }

                    event.preventDefault();

                    const canvas = $element.find('.overlay-canvas')[0];
                    const canvasRect = canvas.getBoundingClientRect();

                    // Calculate the start position
                    const startX = event.pageX;
                    const startY = event.pageY;
                    const initialX = $ctrl.model.x;
                    const initialY = $ctrl.model.y;

                    // Set snapping threshold in pixels
                    const snapThresholdX = $ctrl.overlayResWidth * 0.02; // 2% of width
                    const snapThresholdY = $ctrl.overlayResHeight * 0.02; // 2% of height

                    // Hide guides initially
                    $ctrl.showHorizontalGuide = false;
                    $ctrl.showVerticalGuide = false;

                    let lockAxis = null; // 'x' | 'y' | null
                    let hasMovedForLock = false;

                    function mousemove(event) {
                        // Calculate the delta in pixels
                        const deltaXPercent = ((event.pageX - startX) / canvasRect.width) * 100;
                        const deltaYPercent = ((event.pageY - startY) / canvasRect.height) * 100;

                        let deltaX = (deltaXPercent / 100) * $ctrl.overlayResWidth;
                        let deltaY = (deltaYPercent / 100) * $ctrl.overlayResHeight;

                        const shiftPressed = event.shiftKey;

                        if (shiftPressed) {
                            if (!lockAxis) {
                                // Wait for some movement before deciding axis
                                const movementThreshold = 1; // pixels
                                if (Math.abs(deltaX) > movementThreshold || Math.abs(deltaY) > movementThreshold) {
                                    hasMovedForLock = true;
                                    lockAxis = Math.abs(deltaX) >= Math.abs(deltaY) ? 'x' : 'y';
                                }
                            }

                            if (lockAxis === 'x') {
                                deltaY = 0;
                            } else if (lockAxis === 'y') {
                                deltaX = 0;
                            }
                        } else {
                            // If Shift released mid-drag, unlock axis
                            lockAxis = null;
                            hasMovedForLock = false;
                        }

                        let newX = Math.min($ctrl.overlayResWidth - $ctrl.model.width,
                            Math.max(0, initialX + deltaX));
                        let newY = Math.min($ctrl.overlayResHeight - $ctrl.model.height,
                            Math.max(0, initialY + deltaY));

                        // Calculate center positions in pixels
                        const horizontalCenter = ($ctrl.overlayResWidth - $ctrl.model.width) / 2;
                        const verticalCenter = ($ctrl.overlayResHeight - $ctrl.model.height) / 2;

                        // Check for horizontal center snap
                        if (Math.abs(newX - horizontalCenter) < snapThresholdX) {
                            newX = horizontalCenter;
                            $ctrl.showVerticalGuide = true;
                        } else {
                            $ctrl.showVerticalGuide = false;
                        }

                        // Check for vertical center snap
                        if (Math.abs(newY - verticalCenter) < snapThresholdY) {
                            newY = verticalCenter;
                            $ctrl.showHorizontalGuide = true;
                        } else {
                            $ctrl.showHorizontalGuide = false;
                        }

                        // Update model with new position
                        $scope.$apply(function() {
                            $ctrl.model.x = newX;
                            $ctrl.model.y = newY;
                            $ctrl.updateModel();
                        });
                    }

                    function mouseup() {
                        // Hide guides when done dragging
                        $scope.$apply(function() {
                            $ctrl.showHorizontalGuide = false;
                            $ctrl.showVerticalGuide = false;
                            // Save state to history after drag ends
                            $ctrl.pushHistorySnapshot();
                        });

                        $document.off('mousemove', mousemove);
                        $document.off('mouseup', mouseup);
                    }

                    $document.on('mousemove', mousemove);
                    $document.on('mouseup', mouseup);
                };

                // Handle resizing
                $ctrl.startResizing = function(event) {
                    event.preventDefault();
                    event.stopPropagation();

                    const canvas = $element.find('.overlay-canvas')[0];
                    const canvasRect = canvas.getBoundingClientRect();

                    const startX = event.pageX;
                    const startY = event.pageY;
                    const initialWidth = $ctrl.model.width;
                    const initialHeight = $ctrl.model.height;

                    function mousemove(event) {
                        // Calculate the delta in pixels
                        const deltaXPercent = ((event.pageX - startX) / canvasRect.width) * 100;
                        const deltaYPercent = ((event.pageY - startY) / canvasRect.height) * 100;

                        const deltaX = (deltaXPercent / 100) * $ctrl.overlayResWidth;
                        const deltaY = (deltaYPercent / 100) * $ctrl.overlayResHeight;

                        // Update model with new dimensions
                        $scope.$apply(function() {
                            $ctrl.model.width = Math.min($ctrl.overlayResWidth - $ctrl.model.x,
                                Math.max(Math.round($ctrl.minimumWidth * $ctrl.overlayResWidth / 100), initialWidth + deltaX));
                            $ctrl.model.height = Math.min($ctrl.overlayResHeight - $ctrl.model.y,
                                Math.max(Math.round($ctrl.minimumHeight * $ctrl.overlayResHeight / 100), initialHeight + deltaY));
                            $ctrl.updateModel();
                        });
                    }

                    function mouseup() {
                        $scope.$apply(function() {
                            $ctrl.pushHistorySnapshot();
                        });
                        $document.off('mousemove', mousemove);
                        $document.off('mouseup', mouseup);
                    }

                    $document.on('mousemove', mousemove);
                    $document.on('mouseup', mouseup);
                };

                // Handle corner resizing
                $ctrl.startCornerResizing = function(event, corner) {
                    event.preventDefault();
                    event.stopPropagation();

                    const canvas = $element.find('.overlay-canvas')[0];
                    const canvasRect = canvas.getBoundingClientRect();

                    const startX = event.pageX;
                    const startY = event.pageY;
                    const initialX = $ctrl.model.x;
                    const initialY = $ctrl.model.y;
                    const initialWidth = $ctrl.model.width;
                    const initialHeight = $ctrl.model.height;

                    // Aspect ratio used when holding Shift
                    const initialAspectRatio = initialWidth / initialHeight || 1;

                    function mousemove(event) {
                        // Calculate the delta in pixels
                        const deltaXPercent = ((event.pageX - startX) / canvasRect.width) * 100;
                        const deltaYPercent = ((event.pageY - startY) / canvasRect.height) * 100;

                        const deltaX = (deltaXPercent / 100) * $ctrl.overlayResWidth;
                        const deltaY = (deltaYPercent / 100) * $ctrl.overlayResHeight;

                        const minWidthPx = Math.round($ctrl.minimumWidth * $ctrl.overlayResWidth / 100);
                        const minHeightPx = Math.round($ctrl.minimumHeight * $ctrl.overlayResHeight / 100);

                        const shiftPressed = event.shiftKey;

                        $scope.$apply(function() {
                            let newX = initialX;
                            let newY = initialY;
                            let newWidth = initialWidth;
                            let newHeight = initialHeight;

                            if (shiftPressed) {
                                // Maintain aspect ratio based on drag direction
                                switch (corner) {
                                    case 'topLeft': {
                                        const sizeDelta = Math.max(deltaX, deltaY);
                                        newWidth = initialWidth - sizeDelta;
                                        newHeight = newWidth / initialAspectRatio;
                                        newWidth = Math.max(minWidthPx, newWidth);
                                        newHeight = Math.max(minHeightPx, newHeight);
                                        newX = initialX + (initialWidth - newWidth);
                                        newY = initialY + (initialHeight - newHeight);
                                        break;
                                    }
                                    case 'topRight': {
                                        const sizeDelta = Math.max(deltaX, -deltaY);
                                        newWidth = initialWidth + sizeDelta;
                                        newHeight = newWidth / initialAspectRatio;
                                        newWidth = Math.max(minWidthPx, newWidth);
                                        newHeight = Math.max(minHeightPx, newHeight);
                                        newY = initialY + (initialHeight - newHeight);
                                        break;
                                    }
                                    case 'bottomLeft': {
                                        const sizeDelta = Math.max(-deltaX, -deltaY);
                                        newWidth = initialWidth + sizeDelta;
                                        newHeight = newWidth / initialAspectRatio;
                                        newWidth = Math.max(minWidthPx, newWidth);
                                        newHeight = Math.max(minHeightPx, newHeight);
                                        newX = initialX + (initialWidth - newWidth);
                                        break;
                                    }
                                    case 'bottomRight': {
                                        const sizeDelta = Math.max(deltaX, deltaY);
                                        newWidth = initialWidth + sizeDelta;
                                        newHeight = newWidth / initialAspectRatio;
                                        newWidth = Math.max(minWidthPx, newWidth);
                                        newHeight = Math.max(minHeightPx, newHeight);
                                        break;
                                    }
                                }
                            } else {
                                // Freeform resize (existing behavior)
                                switch (corner) {
                                    case 'topLeft':
                                        newX = Math.min(initialX + initialWidth - minWidthPx,
                                            Math.max(0, initialX + deltaX));
                                        newY = Math.min(initialY + initialHeight - minHeightPx,
                                            Math.max(0, initialY + deltaY));
                                        newWidth = Math.max(minWidthPx, initialWidth - deltaX);
                                        newHeight = Math.max(minHeightPx, initialHeight - deltaY);
                                        break;
                                    case 'topRight':
                                        newY = Math.min(initialY + initialHeight - minHeightPx,
                                            Math.max(0, initialY + deltaY));
                                        newWidth = Math.min($ctrl.overlayResWidth - initialX,
                                            Math.max(minWidthPx, initialWidth + deltaX));
                                        newHeight = Math.max(minHeightPx, initialHeight - deltaY);
                                        break;
                                    case 'bottomLeft':
                                        newX = Math.min(initialX + initialWidth - minWidthPx,
                                            Math.max(0, initialX + deltaX));
                                        newWidth = Math.max(minWidthPx, initialWidth - deltaX);
                                        newHeight = Math.min($ctrl.overlayResHeight - initialY,
                                            Math.max(minHeightPx, initialHeight + deltaY));
                                        break;
                                    case 'bottomRight':
                                        newWidth = Math.min($ctrl.overlayResWidth - initialX,
                                            Math.max(minWidthPx, initialWidth + deltaX));
                                        newHeight = Math.min($ctrl.overlayResHeight - initialY,
                                            Math.max(minHeightPx, initialHeight + deltaY));
                                        break;
                                }
                            }

                            // Clamp to canvas bounds
                            newWidth = Math.min(newWidth, $ctrl.overlayResWidth - newX);
                            newHeight = Math.min(newHeight, $ctrl.overlayResHeight - newY);

                            $ctrl.model.x = newX;
                            $ctrl.model.y = newY;
                            $ctrl.model.width = newWidth;
                            $ctrl.model.height = newHeight;
                            $ctrl.updateModel();
                        });
                    }

                    function mouseup() {
                        $scope.$apply(function() {
                            $ctrl.pushHistorySnapshot();
                        });
                        $document.off('mousemove', mousemove);
                        $document.off('mouseup', mouseup);
                    }

                    $document.on('mousemove', mousemove);
                    $document.on('mouseup', mouseup);
                };

                // Center horizontally
                $ctrl.centerHorizontally = function(snapshot = true) {
                    $ctrl.model.x = Math.round(($ctrl.overlayResWidth - $ctrl.model.width) / 2);
                    $ctrl.updateModel();
                    if (snapshot) {
                        $ctrl.pushHistorySnapshot();
                    }
                    // Flash guide for visual feedback
                    $ctrl.showVerticalGuide = true;
                    setTimeout(() => {
                        $scope.$apply(() => {
                            $ctrl.showVerticalGuide = false;
                        });
                    }, 1000);
                };

                // Center vertically
                $ctrl.centerVertically = function(snapshot = true) {
                    $ctrl.model.y = Math.round(($ctrl.overlayResHeight - $ctrl.model.height) / 2);
                    $ctrl.updateModel();
                    if (snapshot) {
                        $ctrl.pushHistorySnapshot();
                    }
                    // Flash guide for visual feedback
                    $ctrl.showHorizontalGuide = true;
                    setTimeout(() => {
                        $scope.$apply(() => {
                            $ctrl.showHorizontalGuide = false;
                        });
                    }, 1000);
                };

                $ctrl.centerBoth = function() {
                    $ctrl.centerHorizontally(false);
                    $ctrl.centerVertically(false);
                    $ctrl.pushHistorySnapshot();
                };

                $ctrl.pushHistorySnapshot = function() {
                    if (!$ctrl.model) {
                        return;
                    }
                    const snapshot = {
                        x: $ctrl.model.x,
                        y: $ctrl.model.y,
                        width: $ctrl.model.width,
                        height: $ctrl.model.height
                    };

                    if (!$ctrl.history) {
                        $ctrl.history = [];
                    }

                    $ctrl.history.push(snapshot);
                };

                $ctrl.canUndo = function() {
                    return $ctrl.history && $ctrl.history.length > 1;
                };

                $ctrl.undoPosition = function() {
                    if (!$ctrl.canUndo()) {
                        return;
                    }

                    // Remove current state
                    $ctrl.history.pop();
                    const previous = $ctrl.history[$ctrl.history.length - 1];
                    if (!previous) {
                        return;
                    }

                    $ctrl.model.x = previous.x;
                    $ctrl.model.y = previous.y;
                    $ctrl.model.width = previous.width;
                    $ctrl.model.height = previous.height;
                    $ctrl.updateModel();
                };
            }
        });
}());


/**

<div>
    <overlay-position-editor
        model="$ctrl.yourPositionSettings"
        min-width="5"
        min-height="5">
    </overlay-position-editor>
</div>

 */