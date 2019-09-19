"use strict";

(function() {
    angular.module("firebotApp")
        .component("restrictionItem", {
            bindings: {
                restriction: "=",
                restrictionDefinition: "<",
                onDelete: "&"
            },
            template: `
                <div style="margin-bottom:3px;">
                    
                    <div class="expandable-item"
                        style="justify-content: space-between;" 
                        ng-init="hidePanel = true" 
                        ng-click="hidePanel = !hidePanel" 
                        ng-class="{'expanded': !hidePanel}">
                        
                            <div style="flex-basis: 30%;padding-left: 15px;">{{$ctrl.restrictionDefinition.definition.name}}</div>

                            <div style="flex-basis:30px; flex-shrink: 0;">
                                <i class="fas" ng-class="{'fa-chevron-right': hidePanel, 'fa-chevron-down': !hidePanel}"></i>
                            </div>

                    </div>
                    <div uib-collapse="hidePanel" class="expandable-item-expanded">
                        <div style="padding: 15px 20px 10px 20px;">
                            <div style="padding-top: 10px">
                                <button class="btn btn-danger" ng-click="$ctrl.delete()"><i class="far fa-trash"></i></button>
                            </div>
                        </div>
                    </div>

                </div>
          `,
            controller: function() {
                const $ctrl = this;
                $ctrl.$onInit = function() {
                };

                $ctrl.delete = function() {
                    $ctrl.onDelete();
                };
            }
        });
}());
