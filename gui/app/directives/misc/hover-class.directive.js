"use strict";

(function() {
    angular
        .module('firebotApp')
        .directive('hoverClass', [function() {

            return {
                link: function(scope, elem, attrs) {

                    scope.$watch(attrs.piClassHover, function(newValue) {
                        if (newValue == null) {
                            return;
                        }

                        elem.bind('mouseover', function() {
                            elem.addClass(attrs.piClassHover);
                        });

                        elem.bind('mouseleave', function() {
                            elem.removeClass(attrs.piClassHover);
                        });
                    });
                }
            };
        }]);
}());