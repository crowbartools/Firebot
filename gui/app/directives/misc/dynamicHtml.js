"use strict";
(function() {
    //This a wrapped dropdown element that automatically handles the particulars

    angular.module("firebotApp").directive("dynamicHtml", [
        "$compile",
        function($compile) {
            return {
                restrict: "E",
                scope: {
                    html: "="
                },
                replace: true,
                link: function(scope, element) {
                    const htmlWrap = `<div>${scope.html}</div>`.trim();

                    const el = angular.element(htmlWrap);
                    const template = $compile(el)(scope);
                    element.replaceWith(template);
                },
                controller: [
                    "$scope",
                    "$rootScope",
                    function($scope, $rootScope) {
                        $scope.rootScope = $rootScope;
                    }
                ]
            };
        }
    ]);
}());
