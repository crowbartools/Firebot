"use strict";

(function() {
    const { randomUUID } = require("crypto");

    angular.module("firebotApp")
        .component("manageSortTagsModal", {
            template: `
            <div class="modal-header">
                <button type="button" class="close" aria-label="Close" ng-click="$ctrl.dismiss()"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title">Edit Tags</h4>
            </div>
            <div class="modal-body">
                <firebot-list
                    ng-model="$ctrl.tags"
                    name="tags"
                    id="tags"
                    settings="$ctrl.tagListSettings"
                    on-add-new-clicked="$ctrl.addNewTag()"
                    on-edit-clicked="$ctrl.editTag(index)"
                    on-delete-clicked="$ctrl.deleteTag(index)"
                ></firebot-list>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" ng-click="$ctrl.dismiss()">Cancel</button>
                <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
            </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&",
                modalInstance: "<"
            },
            controller: function(utilityService) {
                const $ctrl = this;

                $ctrl.tagListSettings = {
                    sortable: true,
                    nameProperty: 'name',
                    connectItems: false,
                    showIndex: false,
                    addLabel: 'Add Tag',
                    noneAddedText: 'No tags added yet.'
                };

                $ctrl.tags = [];

                const openAddOrEditTagModal = (tag) => {
                    utilityService.openGetInputModal(
                        {
                            model: tag ? tag.name : "",
                            label: tag ? "Edit Tag Name" : "Add Tag",
                            saveText: "OK",
                            validationFn: (value) => {
                                return new Promise((resolve) => {
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
                                    id: randomUUID(),
                                    name: name
                                });
                            }
                        });
                };

                $ctrl.addNewTag = () => {
                    openAddOrEditTagModal();
                };

                $ctrl.editTag = (index) => {
                    openAddOrEditTagModal($ctrl.tags[index]);
                };

                $ctrl.deleteTag = (index) => {
                    $ctrl.tags.splice(index, 1);
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