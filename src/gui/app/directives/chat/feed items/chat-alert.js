"use strict";

(function () {
    const marked = require("marked");
    const { sanitize } = require("dompurify");

    angular
        .module('firebotApp')
        .component("chatAlert", {
            bindings: {
                message: "<"
            },
            template: `
                <div class="chat-alert">
                    <span style="font-size:25px;margin-right: 10px;"><i class="fad fa-exclamation-circle"></i></span>
                    <span style="margin-top: 8px;" ng-bind-html="$ctrl.message"></span>
                </div>
            `,
            controller: function ($scope, $sce) {
                const $ctrl = this;
                $ctrl.message = null;

                const parseMarkdown = (text) => {
                    return $sce.trustAsHtml(
                        sanitize(marked(text))
                    );
                };

                $scope.$parent.$watch("trigger", function () {
                    if ($ctrl.message) {
                        $ctrl.message = parseMarkdown($ctrl.message);
                    }
                });
            }
        });
}());
