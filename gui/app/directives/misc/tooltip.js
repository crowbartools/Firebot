'use strict';

(function() {
    angular
        .module('firebotApp')
        .component("tooltip", {
            bindings: {
                text: "<",
                type: "@"
            },
            template: `
                <i class="fal" ng-class="{'fa-question-circle': $ctrl.type === 'question', 'fa-info-circle': $ctrl.type === 'info' }" uib-tooltip="{{$ctrl.text}}" tooltip-append-to-body="true"></i>
            `,
            controller: function() {
                let ctrl = this;
                ctrl.$onInit = function() {
                    if (ctrl.type == null) {
                        ctrl.type = "question";
                    }
                };
            }
        });
}());