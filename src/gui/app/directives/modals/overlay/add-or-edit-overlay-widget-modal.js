"use strict";

(function() {

    const { v4: uuid } = require("uuid");

    /** @typedef {import("../../../../../types/overlay-widgets").OverlayWidgetType} OverlayWidgetType */
    /** @typedef {import("../../../../../types/overlay-widgets").OverlayWidgetConfig} OverlayWidgetConfig */

    angular.module("firebotApp")
        .component("addOrEditOverlayWidgetModal", {
            template: `
                <scroll-sentinel element-class="edit-widget-header"></scroll-sentinel>
                <div class="modal-header sticky-header edit-widget-header">
                    <button
                        type="button"
                        class="close"
                        aria-label="Close"
                        ng-click="$ctrl.dismiss()"
                    >
                        <i class="fal fa-times" aria-hidden="true"></i>
                    </button>
                    <h4 class="modal-title">
                        <div class="action text-4xl">{{$ctrl.isNewWidget ? 'Add New Overlay Widget' : 'Edit Overlay Widget:'}}</div>
                        <div class="text-4xl font-semibold" ng-show="!$ctrl.isNewWidget">{{$ctrl.widget.name}}</div>
                    </h4>
                </div>
                <div class="modal-body">
                    <form name="widgetSettings">

                        <div class="form-group" ng-class="{'has-error': $ctrl.formFieldHasError('type')}">
                            <label for="expression" class="control-label">Type</label>
                            <firebot-searchable-select
                                name="type"
                                ng-model="$ctrl.widget.type"
                                placeholder="Select or search for a type..."
                                items="$ctrl.widgetTypes"
                                ng-required="true"
                                on-select="$ctrl.onTypeSelected(item)"
                                disabled="!$ctrl.isNewWidget"
                            />
                            <div ng-if="$ctrl.formFieldHasError('type')">
                                <span class="help-block">Please select a type.</span>
                            </div>
                        </div>

                        <div ng-if="$ctrl.widget.type != null">

                            <div class="form-group" ng-class="{'has-error': $ctrl.formFieldHasError('name')}">
                                <label for="name" class="control-label">Name</label>
                                <div style="position: relative;">
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        ng-minlength="1"
                                        ui-validate="{valid:'$ctrl.widgetNameIsValid($value)', taken:'!$ctrl.widgetNameIsTaken($value)'}"
                                        required
                                        class="form-control input-lg"
                                        placeholder="Give your {{ $ctrl.selectedType.name }} a name"
                                        ng-model="$ctrl.widget.name"
                                        ng-keyup="$event.keyCode == 13 && $ctrl.save()"
                                        ng-keydown="$event.keyCode != 13 ? $event:$event.preventDefault()"
                                    />
                                </div>
                                <div ng-if="$ctrl.formFieldHasError('name')">
                                    <span ng-if="widgetSettings.name.$error.required" class="help-block">Name is required.</span>
                                    <span ng-if="widgetSettings.name.$error.minlength" class="help-block">Name must be 1 or more characters.</span>
                                    <span ng-if="widgetSettings.name.$error.valid && !widgetSettings.name.$error.required && !widgetSettings.name.$error.minlength" class="help-block">Invalid name format.</span>
                                    <span ng-if="widgetSettings.name.$error.taken" class="help-block">This name is already in use.</span>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="overlay-instance" class="control-label">Overlay Instance</label>
                                <select class="fb-select" id="overlay-instance" ng-model="$ctrl.widget.overlayInstance">
                                    <option label="Default" value="">Default</option>
                                    <option ng-repeat="instance in $ctrl.overlayInstances" label="{{instance}}" value="{{instance}}">{{instance}}</option>
                                </select>
                            </div>

                            <div class="form-group" ng-if="$ctrl.userCanConfigure.position">
                                <label for="position" class="control-label">Position</label>
                                <overlay-position-editor
                                    ng-model="$ctrl.widget.position"
                                    min-width="25"
                                    min-height="25"
                                ></overlay-position-editor>
                            </div>

                            <div ng-if="$ctrl.selectedType != null && $ctrl.selectedType.settingsSchema != null">
                                <hr />
                                <h4 style="margin: 0;">Settings</h4>
                                <div style="margin-top: 0.25rem;font-size: 14px; color: #99a1af; margin-bottom: 1.25rem;">Configure the settings for this widget below.</div>
                                <dynamic-parameter
                                    ng-repeat="settingSchema in $ctrl.selectedType.settingsSchema"
                                    name="{{settingSchema.name}}"
                                    schema="settingSchema"
                                    ng-model="$ctrl.widget.settings[settingSchema.name]"
                                >
                                </dynamic-parameter>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer sticky-footer edit-widget-footer">
                    <button type="button" class="btn btn-danger pull-left" ng-click="$ctrl.delete()" ng-if="!$ctrl.isNewWidget">Delete</button>
                    <button type="button" class="btn btn-default" ng-click="$ctrl.dismiss()">Cancel</button>
                    <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
                </div>
                <scroll-sentinel element-class="edit-widget-footer"></scroll-sentinel>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&",
                modalInstance: "<"
            },
            controller: function($scope, modalFactory, overlayWidgetsService, settingsService, ngToast) {
                const $ctrl = this;

                $ctrl.overlayInstances = settingsService.getSetting("OverlayInstances");

                $ctrl.widgetTypes = overlayWidgetsService.overlayWidgetTypes
                    .map(t => ({
                        id: t.id,
                        name: t.name,
                        description: t.description,
                        iconClass: t.icon
                    }));

                $ctrl.isNewWidget = true;

                $ctrl.validationErrors = {};


                $ctrl.selectedType = null;

                $ctrl.userCanConfigure = {
                    position: true,
                    entryAnimation: true,
                    exitAnimation: true
                };

                /**
                 * @param {Pick<OverlayWidgetType, "id" | "name">} type
                 */
                $ctrl.onTypeSelected = (type) => {
                    /**
                     * @type {OverlayWidgetType|null}
                     */
                    const foundType = overlayWidgetsService.getOverlayWidgetType(type.id);

                    $ctrl.selectedType = foundType;

                    if (foundType != null) {
                        $ctrl.userCanConfigure.position = foundType.userCanConfigure?.position ?? true;
                        $ctrl.userCanConfigure.entryAnimation = foundType.userCanConfigure?.entryAnimation ?? true;
                        $ctrl.userCanConfigure.exitAnimation = foundType.userCanConfigure?.exitAnimation ?? true;
                    }
                };

                /**
                 * @type {OverlayWidgetConfig}
                 */
                $ctrl.widget = {
                    id: uuid(),
                    name: null,
                    type: null,
                    active: true,
                    position: undefined,
                    entryAnimation: undefined,
                    exitAnimation: undefined,
                    overlayInstance: null,
                    settings: {}
                };

                $ctrl.formFieldHasError = (fieldName) => {
                    return ($scope.widgetSettings.$submitted || $scope.widgetSettings[fieldName].$touched)
                        && $scope.widgetSettings[fieldName].$invalid;
                };

                $ctrl.widgetNameIsTaken = (name) => {
                    if (name == null) {
                        return false;
                    }
                    const matching = overlayWidgetsService.getOverlayWidgetConfigByName(name);

                    if (matching != null && ($ctrl.isNewWidget || matching.id !== $ctrl.widget.id)) {
                        return true;
                    }
                    return false;
                };

                $ctrl.widgetNameIsValid = (name) => {
                    return overlayWidgetsService.isOverlayWidgetNameValid(name);
                };

                $ctrl.$onInit = () => {
                    if ($ctrl.resolve.widget != null) {
                        $ctrl.widget = JSON.parse(angular.toJson($ctrl.resolve.widget));
                        $ctrl.isNewWidget = false;

                        const foundType = overlayWidgetsService.getOverlayWidgetType($ctrl.widget.type);
                        $ctrl.selectedType = foundType;

                        // Reset overlay instance to default (or null) if the saved instance doesn't exist anymore
                        if ($ctrl.widget.overlayInstance != null) {
                            if (!$ctrl.overlayInstances.includes($ctrl.widget.overlayInstance)) {
                                $ctrl.widget.overlayInstance = null;
                            }
                        }
                    }
                };

                $ctrl.save = () => {
                    $scope.widgetSettings.$setSubmitted();
                    if ($scope.widgetSettings.$invalid) {
                        return;
                    }

                    if ($ctrl.widget.overlayInstance === "") {
                        $ctrl.widget.overlayInstance = null;
                    }

                    overlayWidgetsService.saveOverlayWidgetConfig($ctrl.widget, $ctrl.isNewWidget).then((successful) => {
                        if (successful) {
                            $ctrl.dismiss();
                        } else {
                            ngToast.create("Failed to save overlay widget. Please try again or view logs for details.");
                        }
                    });
                };

                $ctrl.delete = function() {
                    if ($ctrl.isNewWidget) {
                        return;
                    }

                    modalFactory
                        .showConfirmationModal({
                            title: "Delete Overlay Widget",
                            question: `Are you sure you want to delete this overlay widget?`,
                            confirmLabel: "Delete",
                            confirmBtnType: "btn-danger"
                        })
                        .then((confirmed) => {
                            if (confirmed) {
                                overlayWidgetsService.deleteOverlayWidgetConfig($ctrl.widget.id);
                                $ctrl.dismiss();
                            }
                        });
                };
            }
        });
})();
