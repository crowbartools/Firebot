"use strict";

(function() {
    angular
        .module('firebotApp')
        .component("giftReceiversList", {
            bindings: {
                model: "=",
                onUpdate: '&'
            },
            template: `
                <div>
                    <div ng-repeat="receiver in $ctrl.model track by $index" class="list-item selectable" ng-click="$ctrl.showAddOrEditGiftReceiverModal(receiver)">
                        <div uib-tooltip="Click to edit" class="ml-8" style="font-weight: 400;width: 100%;" aria-label="{{receiver.gifteeUsername + ' (Click to edit)'}}"><div><b>Giftee Username:</b> {{receiver.gifteeUsername}}</div> <b>Gift Sub Months:</b> {{receiver.giftSubMonths}}</div>
                        <span class="clickable" style="color: #fb7373;" ng-click="$ctrl.removeGiftReceiverAtIndex($index);$event.stopPropagation();" aria-label="Remove gift receiver">
                            <i class="fad fa-trash-alt" aria-hidden="true"></i>
                        </span>
                    </div>
                    <p class="muted" ng-show="$ctrl.model.length < 1">No gift receivers added.</p>
                    <div class="mx-0 mt-2.5 mb-4">
                        <button class="filter-bar" ng-click="$ctrl.showAddOrEditGiftReceiverModal()" uib-tooltip="Add gift receiver" tooltip-append-to-body="true" aria-label="Add gift receiver">
                            <i class="far fa-plus"></i>
                        </button>
                    </div>
                </div>
            `,
            controller: function(utilityService) {
                const $ctrl = this;

                $ctrl.$onInit = () => {
                    if ($ctrl.model == null) {
                        $ctrl.model = [];
                    }
                };

                $ctrl.showAddOrEditGiftReceiverModal = (giftReceiver) => {
                    utilityService.showModal({
                        component: "addOrEditGiftReceiverModal",
                        size: "sm",
                        resolveObj: {
                            giftReceiver: () => giftReceiver
                        },
                        closeCallback: giftReceiver => {
                            $ctrl.model = $ctrl.model.filter(gr => gr.gifteeUsername !== giftReceiver.gifteeUsername);
                            $ctrl.model.push(giftReceiver);
                        }
                    });
                };


                $ctrl.removeGiftReceiverAtIndex = (index) => {
                    $ctrl.model.splice(index, 1);
                };

            }
        });
}());