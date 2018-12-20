"use strict";

angular.module('firebotApp')
    .directive('gridListener', ['$parse', '$timeout', function($parse, $timeout) {
        return {
            restrict: 'A',
            scope: {
                onUpdate: "&"
            },
            compile: function() {
                return function link(scope, element, attrs) {

                    element.on("resize", () => {
                        $timeout(() => {
                            scope.onUpdate();
                        }, 10);

                    });

                    element.on("move", () => {
                        $timeout(() => {
                            scope.onUpdate();
                        }, 10);
                    });
                };
            }
        };
    }]);