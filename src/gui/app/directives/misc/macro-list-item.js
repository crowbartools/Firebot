"use strict";

(function() {
    angular.module("firebotApp")
        .component("macroListItem", {
            bindings: {
                macro: "<",
                onEditClicked: "&",
                onAddToTextClicked: "&"
            },
            template: `
                <div
                    class="py-2 flex macro-line-item"
                    ng-mouseenter="$ctrl.isHovering = true"
                    ng-mouseleave="$ctrl.isHovering = false"
                >
                    <div style="flex-grow: 1;">
                        <div style="font-weight: 900;">{{$ctrl.macroDisplay()}} <i class="fal fa-plus-circle clickable" uib-tooltip="Add to textfield" style="color: #0b8dc6" ng-click="$ctrl.onAddToTextClicked()"></i></div>
                        <div class="muted">{{$ctrl.macro.description}}</div>
                    </div>
                    <div style="width: 50px;" class="flex justify-end items-center">
                        <button ng-show="$ctrl.isHovering" class="edit-macro-btn" ng-click="$ctrl.onEditClicked()">Edit</button>
                    </div>
                </div>
                `,
            controller: function() {
                const $ctrl = this;

                $ctrl.macroDisplay = () => {
                    if ($ctrl.macro) {
                        return `$%${$ctrl.macro.name}${$ctrl.macro.argNames?.length ? `[${$ctrl.macro.argNames.join(", ")}]` : ""}`;
                    }
                    return "";
                };

                $ctrl.isHovering = false;
            }
        });
}());
