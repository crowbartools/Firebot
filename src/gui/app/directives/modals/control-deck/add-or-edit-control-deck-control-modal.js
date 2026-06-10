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
                    <firebot-radio-cards
                        options="$ctrl.controlTypeOptions"
                        ng-model="$ctrl.control.type"
                        grid-columns="2"
                    />
                </firebot-form-group>

                <firebot-form-group name="control-icon" label="Icon">
                   <div>
                        <firebot-radio-cards
                            options="$ctrl.iconOptions"
                            ng-model="$ctrl.control.icon.type"
                            grid-columns="4"
                        />

                        <div ng-if="$ctrl.control.icon.type === 'image'" style="margin-top:10px;">
                            <firebot-radios
                                options="$ctrl.imageSourceOptions"
                                model="$ctrl.control.icon.source"
                                inline="true"
                            />
                        </div>

                        <div ng-if="$ctrl.control.icon.type === 'image' && $ctrl.control.icon.source === 'local'" style="margin-top:10px;">
                            <file-chooser
                                model="$ctrl.control.icon.path"
                                options="{ filters: [ {name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']} ] }"
                            ></file-chooser>
                        </div>

                        <div ng-if="$ctrl.control.icon.type === 'image' && $ctrl.control.icon.source === 'url'" style="margin-top:10px;">
                            <firebot-input
                                model="$ctrl.control.icon.path"
                                placeholder-text="https://..."
                                disable-variables="true"
                            />
                        </div>

                        <div ng-if="$ctrl.control.icon.type === 'glyph'" style="margin-top:10px;">
                            <lucide-icon-picker model="$ctrl.control.icon.name"></lucide-icon-picker>
                            <div style="margin-top:10px;">
                                <color-picker-input label="Glyph Color" model="$ctrl.control.icon.color" show-clear="true"></color-picker-input>
                            </div>
                        </div>

                        <div ng-if="$ctrl.control.icon.type === 'emoji'" style="margin-top:10px;">
                            <emoji-picker model="$ctrl.control.icon.emoji"></emoji-picker>
                        </div>
                   </div>
                </firebot-form-group>

                <firebot-form-group name="control-background" label="Background Color">
                    <color-picker-input model="$ctrl.control.backgroundColor" show-clear="true"></color-picker-input>
                </firebot-form-group>

                <div ng-if="$ctrl.control.type === 'folder'" class="form-group flex-row jspacebetween">
                    <div>
                        <label class="control-label" style="margin:0;">Auto Return</label>
                        <p class="help-block">If enabled, the folder will automatically return to the parent after a button within it is pressed.</p>
                    </div>
                    <div>
                        <toggle-button toggle-model="$ctrl.control.autoReturn" auto-update-value="true" font-size="32"></toggle-button>
                    </div>
                </div>

                <firebot-form-group ng-if="$ctrl.control.type === 'button'" name="control-inputs" label="Inputs">
                    <p class="help-block">Inputs are shown when this button is pressed on a device. Effects can access the values via $controlDeckInput[name].</p>
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

                <div ng-if="$ctrl.control.type === 'button'" style="margin-top:20px;">
                    <effect-list
                        header="What should this control do?"
                        effects="$ctrl.control.effectList"
                        trigger="control_deck"
                        trigger-meta="{ rootEffects: $ctrl.control.effectList, controlInputs: $ctrl.control.inputs }"
                        update="$ctrl.effectListUpdated(effects)"
                        modalId="{{$ctrl.modalId}}"
                    ></effect-list>
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
        controller: function($scope, ngToast) {
            const $ctrl = this;

            $ctrl.isNew = true;

            $ctrl.controlTypeOptions = [
                { value: "button", label: "Button", iconClass: "fa-square", description: "A button that runs effects when pressed" },
                { value: "folder", label: "Folder", iconClass: "fa-folder", description: "A folder that can contain other controls" }
            ];

            $ctrl.iconOptions = [
                { value: "none", label: "None", iconClass: "fa-ban" },
                { value: "glyph", label: "Glyph", iconClass: "fa-icons" },
                { value: "emoji", label: "Emoji", iconClass: "fa-smile" },
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

            $scope.$watch("$ctrl.control.icon.type", (newType, oldType) => {
                if (newType === oldType) {
                    return;
                }
                if (newType === "none") {
                    $ctrl.control.icon = { type: "none" };
                } else if (newType === "glyph") {
                    $ctrl.control.icon = { type: "glyph", name: undefined, color: undefined };
                } else if (newType === "emoji") {
                    $ctrl.control.icon = { type: "emoji", emoji: undefined };
                } else if (newType === "image") {
                    $ctrl.control.icon = { type: "image", source: "url", path: "" };
                }
            });

            $ctrl.control = {
                name: "",
                type: "button",
                icon: { type: "none" },
                backgroundColor: "",
                effectList: { id: undefined, list: [] }
            };

            $ctrl.$onInit = () => {
                if ($ctrl.resolve.control) {
                    $ctrl.control = JSON.parse(angular.toJson($ctrl.resolve.control));
                    $ctrl.isNew = false;
                }
                if ($ctrl.control.effectList == null) {
                    $ctrl.control.effectList = { id: undefined, list: [] };
                }
            };

            $ctrl.effectListUpdated = (effects) => {
                $ctrl.control.effectList = effects;
            };

            $ctrl.save = () => {
                if ($ctrl.control.name == null || $ctrl.control.name.trim() === "") {
                    ngToast.create("Please provide a name for the control.");
                    return;
                }

                if ($ctrl.control.type === "button" && $ctrl.control.inputs?.length) {
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
