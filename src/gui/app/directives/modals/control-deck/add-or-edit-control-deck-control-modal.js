"use strict";

(function() {
    angular.module("firebotApp").component("addOrEditControlDeckControlModal", {
        template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">{{$ctrl.isNew ? 'Add Control' : 'Edit Control'}}</h4>
            </div>
            <div class="modal-body">
                <firebot-form-group name="control-name" label="Name">
                    <firebot-input
                        model="$ctrl.control.name"
                        placeholder-text="Enter name"
                        disable-variables="true"
                    />
                </firebot-form-group>

                <firebot-form-group name="control-type" label="Type">
                    <firebot-searchable-select
                        name="type"
                        ng-model="$ctrl.control.type"
                        placeholder="Select type"
                        items="$ctrl.controlTypeOptions"
                    />
                    <div ng-if="!$ctrl.selectedType" class="alert alert-warning" style="margin-top:10px;margin-bottom:0;">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        The control type "{{$ctrl.control.type}}" is not registered. It may belong to a plugin that is uninstalled or disabled.
                    </div>
                </firebot-form-group>

                <hr />

                <firebot-form-group ng-if="$ctrl.selectedType.enableLabel" name="control-label" label="Label">
                    <p class="help-block">Optional text shown on the control itself.</p>
                    <firebot-input
                        model="$ctrl.control.label"
                        placeholder-text="Enter text"
                        disable-variables="true"
                    />
                    <div ng-if="$ctrl.control.label" style="margin-top:10px;">
                        <label class="control-label" style="font-size: 13px;">Label Font</label>
                        <font-options ng-model="$ctrl.control.labelFont" hide-size="true"></font-options>
                        <div style="margin-top:10px;">
                            <label class="control-label" style="font-size: 13px;">Label Size ({{$ctrl.control.labelSize || 100}}%)</label>
                            <div class="volume-slider-wrapper">
                                <rzslider rz-slider-model="$ctrl.control.labelSize" rz-slider-options="$ctrl.sizeSliderOptions"></rzslider>
                            </div>
                        </div>
                    </div>
                </firebot-form-group>

                <firebot-form-group ng-if="$ctrl.selectedType.enableIcon" name="control-icon" label="Icon">
                   <div>
                        <firebot-radio-cards
                            options="$ctrl.iconOptions"
                            ng-model="$ctrl.iconKind"
                            grid-columns="4"
                        />

                        <div ng-if="$ctrl.iconKind === 'image'" style="margin-top:10px;">
                            <firebot-radios
                                options="$ctrl.imageSourceOptions"
                                model="$ctrl.control.icon.source"
                                inline="true"
                            />
                        </div>

                        <div ng-if="$ctrl.iconKind === 'image' && $ctrl.control.icon.source === 'local'" style="margin-top:10px;">
                            <file-chooser
                                model="$ctrl.control.icon.path"
                                options="{ filters: [ {name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']} ] }"
                            ></file-chooser>
                        </div>

                        <div ng-if="$ctrl.iconKind === 'image' && $ctrl.control.icon.source === 'url'" style="margin-top:10px;">
                            <firebot-input
                                model="$ctrl.control.icon.path"
                                placeholder-text="https://..."
                                disable-variables="true"
                            />
                        </div>

                        <div ng-if="$ctrl.iconKind === 'glyph'" style="margin-top:10px;">
                            <lucide-icon-picker model="$ctrl.control.icon.name"></lucide-icon-picker>
                            <div style="margin-top:10px;">
                                <color-picker-input label="Glyph Color" model="$ctrl.control.icon.color" show-clear="true"></color-picker-input>
                            </div>
                        </div>

                        <div ng-if="$ctrl.iconKind === 'emoji'" style="margin-top:10px;">
                            <emoji-picker model="$ctrl.control.icon.emoji"></emoji-picker>
                        </div>

                        <div ng-if="$ctrl.iconKind !== 'none'" style="margin-top:10px;">
                            <label class="control-label" style="font-size: 13px;">Icon Size ({{$ctrl.control.iconSize || 100}}%)</label>
                            <div class="volume-slider-wrapper">
                                <rzslider rz-slider-model="$ctrl.control.iconSize" rz-slider-options="$ctrl.sizeSliderOptions"></rzslider>
                            </div>
                        </div>
                   </div>
                </firebot-form-group>

                <firebot-form-group ng-if="$ctrl.selectedType.enableBackground" name="control-background" label="Background">
                    <div>
                        <firebot-radio-cards
                            options="$ctrl.backgroundOptions"
                            ng-model="$ctrl.backgroundKind"
                            grid-columns="3"
                        />

                        <div ng-if="$ctrl.backgroundKind === 'color'" style="margin-top:10px;">
                            <color-picker-input model="$ctrl.control.background.color" show-clear="true"></color-picker-input>
                        </div>

                        <div ng-if="$ctrl.backgroundKind === 'image'" style="margin-top:10px;">
                            <firebot-radios
                                options="$ctrl.imageSourceOptions"
                                model="$ctrl.control.background.source"
                                inline="true"
                            />
                            <div ng-if="$ctrl.control.background.source === 'local'" style="margin-top:10px;">
                                <file-chooser
                                    model="$ctrl.control.background.path"
                                    options="{ filters: [ {name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']} ] }"
                                ></file-chooser>
                            </div>
                            <div ng-if="$ctrl.control.background.source === 'url'" style="margin-top:10px;">
                                <firebot-input
                                    model="$ctrl.control.background.path"
                                    placeholder-text="https://..."
                                    disable-variables="true"
                                />
                            </div>
                        </div>
                    </div>
                </firebot-form-group>

                <firebot-form-group ng-if="$ctrl.selectedType.enableInputs" name="control-inputs" label="Inputs">
                    <p class="help-block">Inputs are shown when this control is pressed on a device. Effects can access the values via $controlDeckInput[name].</p>
                    <div ng-repeat="input in $ctrl.control.inputs track by $index" style="margin-bottom:3px;">
                        <div class="expandable-item"
                            style="justify-content: space-between;"
                            ng-click="input._expanded = !input._expanded"
                            ng-class="{'expanded': input._expanded}">

                            <div style="padding-left: 15px;font-family: 'Quicksand';font-size: 16px;">{{input.name || 'New Input'}}</div>

                            <div style="display: flex; align-items: center;">
                                <div ng-show="!input._expanded" style="opacity: 0.6; margin-right: 20px; max-width: 200px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;">
                                    {{$ctrl.inputTypeOptions[input.type]}}
                                </div>
                                <div style="width:30px;">
                                    <i class="fas" ng-class="{'fa-chevron-right': !input._expanded, 'fa-chevron-down': input._expanded}"></i>
                                </div>
                            </div>

                        </div>
                        <div uib-collapse="!input._expanded" class="expandable-item-expanded">
                            <div style="padding: 15px 20px 10px 20px;">
                                <div class="form-group" style="margin-bottom:10px;">
                                    <label class="control-label">Name</label>
                                    <firebot-input
                                        model="input.name"
                                        placeholder-text="Enter unique name"
                                        disable-variables="true"
                                    />
                                </div>
                                <div class="form-group" style="margin-bottom:10px;">
                                    <label class="control-label">Description <span class="muted">(optional)</span></label>
                                    <firebot-input
                                        model="input.description"
                                        placeholder-text="Shown to the user in the prompt"
                                        disable-variables="true"
                                    />
                                </div>
                                <div class="form-group" style="margin-bottom:10px;">
                                    <label class="control-label">Type</label>
                                    <div>
                                        <dropdown-select
                                            options="$ctrl.inputTypeOptions"
                                            selected="input.type"
                                            on-update="$ctrl.inputTypeChanged(input)"
                                        ></dropdown-select>
                                    </div>
                                </div>
                                <div ng-if="input.type === 'preset'" class="form-group" style="margin-bottom:10px;">
                                    <label class="control-label">Options</label>
                                    <editable-list
                                        model="input.options"
                                        settings="{ addLabel: 'Add Option', editLabel: 'Edit Option', noneAddedText: 'No options added', sortable: true }"
                                    ></editable-list>
                                </div>
                                <div style="padding-top: 10px">
                                    <button class="btn btn-danger" ng-click="$ctrl.removeInput($index)" aria-label="Delete input"><i class="far fa-trash"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button type="button" class="btn btn-default btn-sm" ng-click="$ctrl.addInput()">
                        <i class="far fa-plus mr-1"></i> Add Input
                    </button>
                </firebot-form-group>

                <div ng-if="$ctrl.selectedType.settingsSchema.length > 0" style="margin-top:20px;">
                    <hr />
                    <dynamic-parameters
                        settings-schema="$ctrl.selectedType.settingsSchema"
                        settings="$ctrl.control.settings"
                        trigger="control_deck"
                        trigger-meta="$ctrl.effectsTriggerMeta"
                        modal-id="{{$ctrl.modalId}}"
                    ></dynamic-parameters>
                </div>
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
            modalInstance: "<",
            modalId: "@"
        },
        controller: function($scope, $timeout, controlDeckService, ngToast) {
            const $ctrl = this;

            $ctrl.isNew = true;

            $ctrl.selectedType = null;

            $ctrl.sizeSliderOptions = {
                floor: 25,
                ceil: 300,
                step: 5,
                hideLimitLabels: true,
                hidePointerLabels: true,
                showSelectionBar: true
            };

            $ctrl.controlTypeOptions = controlDeckService.controlTypes.map(t => ({
                id: t.id,
                name: t.name,
                iconClass: t.icon,
                description: t.description
            }));

            $ctrl.iconOptions = [
                { value: "none", label: "None", iconClass: "fa-ban" },
                { value: "glyph", label: "Glyph", iconClass: "fa-icons" },
                { value: "emoji", label: "Emoji", iconClass: "fa-smile" },
                { value: "image", label: "Image", iconClass: "fa-image" }
            ];

            $ctrl.backgroundOptions = [
                { value: "none", label: "None", iconClass: "fa-ban" },
                { value: "color", label: "Color", iconClass: "fa-palette" },
                { value: "image", label: "Image", iconClass: "fa-image" }
            ];

            $ctrl.imageSourceOptions = {
                url: { text: "URL" },
                local: { text: "Local" }
            };

            $ctrl.inputTypeOptions = {
                "text": "Text",
                "number": "Number",
                "toggle": "Toggle Switch",
                "preset": "Preset Values"
            };

            $ctrl.addInput = () => {
                if ($ctrl.control.inputs == null) {
                    $ctrl.control.inputs = [];
                }
                $ctrl.control.inputs.push({
                    type: "text",
                    name: "",
                    description: "",
                    _expanded: true
                });
            };

            $ctrl.removeInput = (index) => {
                $ctrl.control.inputs.splice(index, 1);
            };

            $ctrl.inputTypeChanged = (input) => {
                if (input.type === "preset") {
                    if (input.options == null) {
                        input.options = [];
                    }
                } else {
                    delete input.options;
                }
            };

            $ctrl.iconKind = "none";
            $ctrl.backgroundKind = "none";

            $ctrl.effectsTriggerMeta = {};

            const updateEffectsTriggerMeta = () => {
                $ctrl.effectsTriggerMeta = {
                    rootEffects: $ctrl.control.settings?.effects,
                    controlInputs: $ctrl.control.inputs
                };
            };

            const applySettingsDefaults = () => {
                if ($ctrl.control.settings == null) {
                    $ctrl.control.settings = {};
                }
                for (const param of ($ctrl.selectedType?.settingsSchema || [])) {
                    if ($ctrl.control.settings[param.name] === undefined && param.default !== undefined) {
                        $ctrl.control.settings[param.name] = JSON.parse(angular.toJson(param.default));
                    }
                }
            };

            const applyDefaultIcon = () => {
                if ($ctrl.selectedType?.enableIcon
                    && $ctrl.control.icon == null
                    && $ctrl.selectedType.defaultIcon != null) {
                    $ctrl.control.icon = JSON.parse(angular.toJson($ctrl.selectedType.defaultIcon));
                    $ctrl.iconKind = $ctrl.control.icon.type;
                }
            };

            $scope.$watch("$ctrl.control.type", (newTypeId, oldTypeId) => {
                $ctrl.selectedType = controlDeckService.getControlType(newTypeId);

                if (newTypeId === oldTypeId) {
                    return;
                }

                // Reset type-specific settings when switching types
                $ctrl.control.settings = {};
                applySettingsDefaults();

                if (!$ctrl.selectedType?.enableIcon) {
                    $ctrl.iconKind = "none";
                    delete $ctrl.control.icon;
                } else {
                    applyDefaultIcon();
                }
                if (!$ctrl.selectedType?.enableBackground) {
                    $ctrl.backgroundKind = "none";
                    delete $ctrl.control.background;
                }
                if (!$ctrl.selectedType?.enableInputs) {
                    delete $ctrl.control.inputs;
                }
                if (!$ctrl.selectedType?.enableLabel) {
                    delete $ctrl.control.label;
                    delete $ctrl.control.labelFont;
                }

                updateEffectsTriggerMeta();
            });

            $scope.$watch("$ctrl.iconKind", (newKind, oldKind) => {
                if (newKind === oldKind) {
                    return;
                }
                // Already in sync (e.g. a default icon was just applied)
                if ($ctrl.control.icon?.type === newKind) {
                    return;
                }
                if (newKind === "none") {
                    delete $ctrl.control.icon;
                } else if (newKind === "glyph") {
                    $ctrl.control.icon = { type: "glyph", name: undefined, color: undefined };
                } else if (newKind === "emoji") {
                    $ctrl.control.icon = { type: "emoji", emoji: undefined };
                } else if (newKind === "image") {
                    $ctrl.control.icon = { type: "image", source: "url", path: "" };
                }
            });

            $scope.$watch("$ctrl.backgroundKind", (newKind, oldKind) => {
                if (newKind === oldKind) {
                    return;
                }
                if (newKind === "none") {
                    delete $ctrl.control.background;
                } else if (newKind === "color") {
                    $ctrl.control.background = { type: "color", color: "" };
                } else if (newKind === "image") {
                    $ctrl.control.background = { type: "image", source: "url", path: "" };
                }
            });

            $ctrl.control = {
                name: "",
                type: "firebot:button",
                settings: {}
            };

            $ctrl.$onInit = () => {
                if ($ctrl.resolve.control) {
                    $ctrl.control = JSON.parse(angular.toJson($ctrl.resolve.control));
                    $ctrl.isNew = false;
                }

                $ctrl.selectedType = controlDeckService.getControlType($ctrl.control.type);

                if ($ctrl.isNew) {
                    applyDefaultIcon();
                }

                $ctrl.iconKind = $ctrl.control.icon?.type ?? "none";
                $ctrl.backgroundKind = $ctrl.control.background?.type ?? "none";

                if ($ctrl.control.iconSize == null) {
                    $ctrl.control.iconSize = 100;
                }
                if ($ctrl.control.labelSize == null) {
                    $ctrl.control.labelSize = 100;
                }

                applySettingsDefaults();
                updateEffectsTriggerMeta();

                $timeout(() => {
                    $scope.$broadcast("rzSliderForceRender");
                }, 100);
            };

            $ctrl.save = () => {
                if ($ctrl.control.name == null || $ctrl.control.name.trim() === "") {
                    ngToast.create("Please provide a name for the control.");
                    return;
                }

                if ($ctrl.selectedType == null) {
                    ngToast.create("This control's type is not registered, so it can't be saved.");
                    return;
                }

                if ($ctrl.selectedType.enableLabel) {
                    const label = ($ctrl.control.label || "").trim();
                    if (label === "") {
                        delete $ctrl.control.label;
                        delete $ctrl.control.labelFont;
                    } else {
                        $ctrl.control.label = label;
                    }
                }

                if ($ctrl.control.icon == null || $ctrl.control.iconSize === 100) {
                    delete $ctrl.control.iconSize;
                }
                if ($ctrl.control.label == null || $ctrl.control.labelSize === 100) {
                    delete $ctrl.control.labelSize;
                }

                if ($ctrl.selectedType.enableInputs && $ctrl.control.inputs?.length) {
                    const seenNames = {};
                    for (const input of $ctrl.control.inputs) {
                        const name = (input.name || "").trim();
                        if (name === "") {
                            ngToast.create("Every input must have a name.");
                            return;
                        }
                        const nameKey = name.toLowerCase();
                        if (seenNames[nameKey]) {
                            ngToast.create(`Input names must be unique ("${name}" is used more than once).`);
                            return;
                        }
                        seenNames[nameKey] = true;
                        input.name = name;
                        if (input.type === "preset" && !(input.options?.length)) {
                            ngToast.create(`Preset input "${name}" must have at least one option.`);
                            return;
                        }
                    }
                    for (const input of $ctrl.control.inputs) {
                        delete input._expanded;
                    }
                }

                $ctrl.close({
                    $value: {
                        control: $ctrl.control
                    }
                });
            };
        }
    });
}());
