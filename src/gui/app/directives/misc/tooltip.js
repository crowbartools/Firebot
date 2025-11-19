"use strict";

const { marked } = require("marked");
const { sanitize } = require("dompurify");

(function() {
    angular.module("firebotApp").component("tooltip", {
        bindings: {
            text: "<",
            type: "@",
            placement: "@?",
            styles: "@"
        },
        template: `
                <i
                    class="fal"
                    style="{{$ctrl.styles}}"
                    ng-class="{'fa-question-circle': $ctrl.type === 'question', 'fa-info-circle': $ctrl.type === 'info' }"
                    uib-tooltip-html="$ctrl.text"
                    tooltip-placement="{{$ctrl.placement || ''}}"
                    tooltip-append-to-body="true"
                    role="tooltip"
                    aria-label="{{$ctrl.text}}"
                ></i>
            `,
        controller: function($sce) {
            const ctrl = this;
            ctrl.$onInit = function() {
                if (ctrl.type == null) {
                    ctrl.type = "question";
                }

                ctrl.text = $sce.trustAsHtml(
                    sanitize(marked.parseInline(ctrl.text))
                );
            };
        }
    });
}());
