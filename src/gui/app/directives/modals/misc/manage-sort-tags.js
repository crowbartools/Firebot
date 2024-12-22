"use strict";

(function() {
    const { v4: uuid } = require("uuid");

    angular.module("firebotApp")
        .component("manageSortTagsModal", {
            template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Edit Tags</h4>
            </div>
            <div class="modal-body">
                <div ui-sortable="$ctrl.sortableOptions" ng-model="$ctrl.tags">
                    <div ng-repeat="tag in $ctrl.tags track by tag.id" class="list-item selectable" style="padding: 1px 15px;border-radius: 7px;" ng-click="$ctrl.openAddOrEditTagModal(tag)" aria-label="{{item + ' (Click to edit)'}}">
                        <span class="dragHandle" ng-click="$event.stopPropagation();" style="height: 38px; width: 15px; align-items: center; justify-content: center; display: flex">
                            <i class="fal fa-bars" aria-hidden="true"></i>
                        </span>
                        <span>{{tag.name}}</span>
                        <span class="clickable" style="color: #fb7373;" ng-click="$ctrl.removeTag(tag.id);$event.stopPropagation();">
                            <i class="fad fa-trash-alt" aria-hidden="true"></i>
                        </span>
                    </div>
                </div>
                <div ng-show="$ctrl.tags.length < 1" class="muted" style="margin: 10px 0;">No tags created yet.</div>
                <div style="margin: 10px 0 5px 0px;">
                    <button class="btn btn-default" ng-click="$ctrl.openAddOrEditTagModal()"><i class="far fa-plus-circle"></i> Add Tag</button>
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
                modalInstance: "<"
            },
            controller: function($scope, utilityService) {
                const $ctrl = this;

                $ctrl.sortableOptions = {
                    handle: ".dragHandle",
                    stop: () => {}
                };

                $ctrl.tags = [];

                $ctrl.removeTag = tagId => {
                    $ctrl.tags = $ctrl.tags.filter(t => t.id !== tagId);
                };

                $ctrl.openAddOrEditTagModal = (tag) => {
                    utilityService.openGetInputModal(
                        {
                            model: tag ? tag.name : "",
                            label: tag ? "Edit Tag Name" : "Add Tag",
                            saveText: "OK",
                            validationFn: (value) => {
                                return new Promise(resolve => {
                                    if (value == null || value.trim().length < 1) {
                                        resolve(false);
                                    } else {
                                        resolve(true);
                                    }
                                });
                            },
                            validationText: "Tag name cannot be empty"
                        },
                        (name) => {
                            if (tag != null) {
                                tag.name = name;
                            } else {
                                $ctrl.tags.push({
                                    id: uuid(),
                                    name: name
                                });
                            }
                        });
                };

                $ctrl.$onInit = () => {
                    if ($ctrl.resolve.tags != null) {
                        $ctrl.tags = JSON.parse(angular.toJson($ctrl.resolve.tags));
                    }
                };

                $ctrl.save = () => {
                    $ctrl.close({
                        $value: $ctrl.tags
                    });
                };
            }
        });
}());
