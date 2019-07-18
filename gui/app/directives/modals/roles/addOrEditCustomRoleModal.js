"use strict";

// Basic template for a modal component, copy this and rename to build a modal.

(function() {
    angular.module("firebotApp").component("addOrEditCustomRoleModal", {
        template: `
            <div class="modal-header">
                <button type="button" class="close" aria-label="Close" ng-click="dismiss()"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title" id="editGroupLabel">{{$ctrl.isNewRole ? "Add Custom Role" : "Edit Custom Role"}}</h4>
            </div>
            <div class="modal-body">
                <div class="general-group-settings">
                    <div class="input-group settings-groupid">
                        <span class="input-group-addon" id="basic-addon3">Role Name</span>
                        <input type="text" class="form-control interactive-group-id" aria-describedby="basic-addon3" ng-model="$ctrl.role.name">
                    </div>
                </div>
                <div style="padding-top: 25px;">
                    <div class="user-list-header">
                        <div class="settings-title">
                            <h3 style="display:inline-block; font-size:28px; font-weight: 300;">Users</h3>
                            <div style="display:inline-block; width:50%; float:right; position: relative;" ng-show="$ctrl.role.viewers.length > 5 || searchText.length > 0">
                            <input type="text" class="form-control" placeholder="Search users" ng-model="searchText" style="padding-left: 27px;">
                            <span class="searchbar-icon"><i class="far fa-search"></i></span>
                        </div>      
                    </div>
                </div>
                <div id="user-list" style="padding-bottom: 20px;">
                    <table class="table" ng-hide="$ctrl.role.viewers.length == 0">
                        <thead>
                            <tr>
                                <th>NAME</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr ng-repeat="viewer in viewerList = ($ctrl.role.viewers | filter:searchText) | startFrom:($trl.pagination.currentPage-1)*$ctrlpagination.pageSize | limitTo:$ctrl.pagination.pageSize track by $index">
                                <td>{{user}}</td>
                                <td>
                                    <span class="delete-button pull-right" ng-click="deleteViewer(viewer)">
                                        <i class="far fa-trash-alt"></i>
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <p ng-show="$ctrl.role.viewers.length == 0" class="muted">No users with this role</p>
                    <div ng-show="$ctrl.role.viewers.length > $ctrl.pagination.pageSize" style="text-align: center;">
                        <ul uib-pagination total-items="viewerList.length" ng-model="$ctrl.pagination.currentPage" items-per-page="$ctrl.pagination.pageSize" class="pagination-sm" max-size="5" boundary-link-numbers="true" rotate="true"></ul>
                    </div>
                    <div style="display: flex; padding-top: 15px;">
                        <button class="btn btn-default" type="button" ng-click="addNewUser()">Add</button>
                    </div>
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
            dismiss: "&"
        },
        controller: function(ngToast) {
            let $ctrl = this;

            $ctrl.isNewRole = true;

            $ctrl.role = {
                name: "",
                viewers: []
            };

            $ctrl.pagination = {
                currentPage: 1,
                pageSize: 5
            };

            $ctrl.$onInit = function() {
                if ($ctrl.resolve.role) {
                    $ctrl.role = $ctrl.resolve.role;
                    $ctrl.isNewRole = false;
                }
            };

            $ctrl.save = function() {

            };
        }
    });
}());
