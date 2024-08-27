"use strict";

(function() {
    angular
        .module("firebotApp").directive('onResize', function() {
            return {
                restrict: 'A',
                link: function($scope, $element, $attrs) {
                    const el = $element[0];
                    const originalHeight = el.getBoundingClientRect().height;

                    let isClicking = false;

                    $element.on("mousedown", function() {
                        isClicking = true;
                    });

                    $element.on("mouseup", function() {
                        isClicking = false;
                    });

                    $element.on("mouseleave", function() {
                        isClicking = false;
                    });

                    const observer = new ResizeObserver(function(entries) {
                        const currentHeight = entries[0]?.target?.getBoundingClientRect()?.height;
                        if (isClicking && currentHeight !== originalHeight && $attrs["onResize"]) {
                            $scope.$apply($attrs["onResize"])(entries[0]);
                        }
                    });

                    observer.observe(el);

                    $scope.$on('$destroy', function() {
                        observer.unobserve(el);
                    });
                }
            };
        });
}());
