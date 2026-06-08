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
                            grid-columns="3"
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

                <div ng-if="$ctrl.control.type === 'button'" style="margin-top:20px;">
                    <effect-list
                        header="What should this control do?"
                        effects="$ctrl.control.effectList"
                        trigger="control_deck"
                        trigger-meta="{ rootEffects: $ctrl.control.effectList }"
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
                { value: "image", label: "Image", iconClass: "fa-image" }
            ];

            $ctrl.imageSourceOptions = {
                url: { text: "URL" },
                local: { text: "Local" }
            };

            $scope.$watch("$ctrl.control.icon.type", (newType) => {
                if (newType === "none") {
                    $ctrl.control.icon = { type: "none" };
                } else if (newType === "glyph") {
                    $ctrl.control.icon = { type: "glyph", name: undefined, color: undefined };
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

                $ctrl.close({
                    $value: {
                        control: $ctrl.control
                    }
                });
            };
        }
    });
}());
