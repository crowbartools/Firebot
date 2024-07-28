"use strict";

(function() {
    angular.module("firebotApp")
        .component("firebotComponentListModal", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">Select {{$ctrl.label}}</h4>
                </div>
                <div class="modal-body">
                    <div id="roles" class="modal-subheader" style="padding: 0 0 4px 0">
                        {{$ctrl.label}}
                    </div>
                    <div style="height: 55px; display: flex; align-items: center;">
                        <searchbar search-id="componentSearch" placeholder-text="Search {{$ctrl.label}}..." query="$ctrl.componentSearch" style="width: 100%;"></searchbar>
                    </div>
                    <div class="viewer-group-list" style="height: inherit; min-height: 100px;max-height: 300px;">
                        <label class="control-fb control--checkbox"
                            ng-repeat="component in $ctrl.allComponents | filter: ($ctrl.componentSearch.startsWith('!') ? $ctrl.componentSearch.slice(1) : $ctrl.componentSearch) track by component.id"
                        >
                            {{component.name}}
                            <input type="checkbox" ng-click="$ctrl.toggleComponentSelected(component.id)" ng-checked="$ctrl.componentIsSelected(component.id)"  aria-label="..." >
                            <div class="control__indicator"></div>
                        </label>
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
            controller: function($timeout) {
                const $ctrl = this;

                $ctrl.label = "";
                $ctrl.allComponents = [];
                $ctrl.selectedIds = [];

                $ctrl.componentIsSelected = id => $ctrl.selectedIds.includes(id);
                $ctrl.toggleComponentSelected = (id) => {
                    const index = $ctrl.selectedIds.findIndex(i => i === id);
                    if (index < 0) {
                        $ctrl.selectedIds.push(id);
                    } else {
                        $ctrl.selectedIds.splice(index, 1);
                    }
                };

                $ctrl.$onInit = () => {
                    $ctrl.label = $ctrl.resolve.label || "";

                    if ($ctrl.resolve.allComponents) {
                        $ctrl.allComponents = $ctrl.resolve.allComponents;
                    }

                    if ($ctrl.resolve.selectedIds) {
                        $ctrl.selectedIds = $ctrl.resolve.selectedIds;
                    }

                    $timeout(() => {
                        angular.element("#componentSearch").trigger("focus");
                    }, 50);
                };

                $ctrl.save = () => {
                    $ctrl.close({
                        $value: JSON.parse(angular.toJson($ctrl.selectedIds))
                    });
                };
            }
        });
}());
