"use strict";

(function() {

    const { v4: uuid } = require("uuid");

    angular.module("firebotApp").component("addOrEditCustomRoleModal", {
        template: `
            <div class="modal-header">
                <button type="button" class="close" aria-label="Close" ng-click="$ctrl.dismiss()"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title" id="editGroupLabel">{{$ctrl.isNewRole ? "Add Custom Role" : "Edit Custom Role"}}</h4>
            </div>
            <div class="modal-body">
                <div class="general-group-settings">
                    <div style="display:inline-block;font-size: 14px;font-weight: 500;opacity: 0.7;margin:0;padding:0;text-transform: uppercase;margin-bottom: 1px;margin-left: 10px;">Name</div>
                    <input type="text" class="form-control" ng-model="$ctrl.role.name" placeholder="Enter name">
                </div>
                <div style="padding-top: 25px;">
                    <div>
                        <div class="settings-title" style="margin-bottom: 4px;display: flex;justify-content: space-between;">
                            <div style="display:flex; align-items: center;">
                                <div style="display:inline-block;font-size: 14px;font-weight: 500;opacity: 0.7;margin:0;padding:0;text-transform: uppercase;margin-bottom: 1px;margin-left: 10px;">Viewers</div>
                                <div class="clickable" ng-click="$ctrl.addViewer()" style="margin-left:6px;font-size: 14px;"><i class="fas fa-plus-circle"></i></div>
                            </div>

                            <div style="display:inline-block; width:50%;position: relative;" ng-show="$ctrl.role.viewers.length > 5 || searchText.length > 0">
                                <input type="text" class="form-control" placeholder="Search viewers" ng-model="searchText" style="height: 30px;padding-left:27px;">
                                <span class="searchbar-icon" style="top:5px;"><i class="far fa-search"></i></span>
                            </div>
                    </div>
                </div>
                <div id="user-list" style="padding-bottom: 20px;">
                    <div style="min-height: 45px;background-color:#282a2e;border-radius:8px;">

                        <div ng-show="$ctrl.role.viewers.length == 0" style="display:flex;height: 45px; align-items: center; justify-content: space-between;padding: 0 15px;">
                            <span class="muted">No users with this role.</span>
                        </div>

                        <div ng-repeat="viewer in viewerList = ($ctrl.role.viewers | filter:searchText) | startFrom:($ctrl.pagination.currentPage-1)*$ctrl.pagination.pageSize | limitTo:$ctrl.pagination.pageSize track by $index">
                            <div style="display:flex;height: 45px; align-items: center; justify-content: space-between;padding: 0 15px;">
                                <div style="font-weight: 100;font-size: 16px;">{{viewer.displayName}}<span ng-if="viewer.displayName.toLowerCase() !== viewer.username.toLowerCase()" class="muted"> ({{viewer.username}})</span></div>
                                <span class="delete-button" ng-click="$ctrl.deleteViewer(viewer.id, viewer.displayName)">
                                    <i class="far fa-trash-alt"></i>
                                </span>
                            </div>
                        </div>

                    </div>
                    <div ng-show="$ctrl.role.viewers.length > $ctrl.pagination.pageSize" style="text-align: center;">
                        <ul uib-pagination total-items="viewerList.length" ng-model="$ctrl.pagination.currentPage" items-per-page="$ctrl.pagination.pageSize" class="pagination-sm" max-size="5" boundary-link-numbers="true" rotate="true"></ul>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button ng-if="!$ctrl.isNewRole" type="button" class="btn btn-danger pull-left" ng-click="$ctrl.delete()" uib-tooltip="Delete Role"><i class="fal fa-trash-alt"></i></button>
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
        controller: function($scope, ngToast, utilityService) {
            const $ctrl = this;

            $ctrl.isNewRole = true;

            $ctrl.role = {
                name: "",
                viewers: []
            };

            $ctrl.pagination = {
                currentPage: 1,
                pageSize: 5
            };

            $ctrl.addViewer = function() {
                utilityService.openViewerSearchModal(
                    {
                        label: "Add Viewer",
                        saveText: "Add",
                        validationFn: (user) => {
                            return new Promise(resolve => {
                                if (user == null) {
                                    return resolve(false);
                                }
                                if ($ctrl.role.viewers.map(v => v.id).includes(user.id)) {
                                    return resolve(false);
                                }
                                resolve(true);
                            });
                        },
                        validationText: "Viewer already has this role."
                    },
                    (user) => {
                        $ctrl.role.viewers.push({
                            id: user.id,
                            username: user.username,
                            displayName: user.displayName
                        });
                    });
            };

            $ctrl.deleteViewer = function(userId, displayName) {
                utilityService.showConfirmationModal({
                    title: "Remove Viewer",
                    question: `Are you sure you want to remove ${displayName} from this role?`,
                    confirmLabel: "Remove",
                    confirmBtnType: "btn-danger"
                }).then(confirmed => {
                    if (confirmed) {
                        $ctrl.role.viewers = $ctrl.role.viewers.filter(v => v.id !== userId);
                    }
                });
            };

            $ctrl.$onInit = function() {
                if ($ctrl.resolve.role) {
                    $ctrl.role = JSON.parse(JSON.stringify($ctrl.resolve.role));
                    $ctrl.isNewRole = false;
                }
            };

            $ctrl.delete = function() {
                if ($ctrl.isNewRole) {
                    return;
                }

                $ctrl.close({
                    $value: {
                        role: $ctrl.role,
                        action: "delete"
                    }
                });
            };

            $ctrl.save = function() {
                if ($ctrl.role.name == null || $ctrl.role.name.trim() === "") {
                    ngToast.create("Please provide a name for this role.");
                    return;
                }

                if ($ctrl.isNewRole) {
                    $ctrl.role.id = uuid();
                }

                $ctrl.close({
                    $value: {
                        role: $ctrl.role,
                        action: "save"
                    }
                });
            };
        }
    });
}());
