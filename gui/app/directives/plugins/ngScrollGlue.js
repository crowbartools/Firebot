'use strict';
/**
 * @name AngularJS Scroll Glue
 * @type AngularJS Module
 * @version 2.0.6
 * @author Santiago G. Marín <santiago@finaldevstudio.com>
 * @description An AngularJs directive that automatically scrolls to the bottom
 *   of an element on changes in it's scope. This is a fork of Lukas Wegmann's
 *   Angular Scroll Glue (https://github.com/Luegg/angularjs-scroll-glue).
 * @license MIT
 * @see https://github.com/stgogm/ng-scroll-glue
 */

(function (angular) {

    const SCROLL = 'scroll';
    const RESIZE = 'resize';
    const MANUAL_SCROLL = 'ngScrollGlue.scroll';

    function createActivationState($parse, attr, scope) {
        function unboundState(initValue) {
            let activated = initValue;

            return {
                getValue: function () {
                    return activated;
                },

                setValue: function (value) {
                    activated = value;
                }
            };
        }

        function oneWayBindingState(getter, scope) {
            return {
                getValue: function () {
                    return getter(scope);
                },

                setValue: function () {}
            };
        }

        function twoWayBindingState(getter, setter, scope) {
            return {
                getValue: function () {
                    return getter(scope);
                },

                setValue: function (value) {
                    if (value !== getter(scope)) {
                        scope.$apply(function () {
                            setter(scope, value);
                        });
                    }
                }
            };
        }

        if (attr !== '') {
            let getter = $parse(attr);

            if (getter.assign !== undefined) {
                return twoWayBindingState(getter, getter.assign, scope);
            }
            return oneWayBindingState(getter, scope);

        }
        return unboundState(true);

    }

    function createDirective(module, attrName, direction) {
        module.directive(attrName, [
            '$parse', '$timeout', '$window',

            function ($parse, $timeout, $window) {
                return {
                    priority: 1,
                    restrict: 'A',

                    link: function ($scope, $el, $attrs) {
                        let activationState = createActivationState($parse, $attrs[attrName], $scope);
                        let $win = angular.element($window);
                        let el = $el[0];
                        let isProgrammaticallyScrolling = false;

                        function scrollIfGlued() {
                            if (activationState.getValue() && !direction.isAttached(el)) {
                                isProgrammaticallyScrolling = true;
                                $timeout(() => {
                                    console.log("scrolling");
                                    direction.scroll(el);
                                    $timeout(() => isProgrammaticallyScrolling = false, 10);
                                }, 140);
                            }
                        }

                        function onElementScroll() {
                            if (!isProgrammaticallyScrolling) {
                                activationState.setValue(direction.isAttached(el, true));
                            } else {
                                console.log("detected programmatic scroll");
                            }
                        }

                        $scope.$watch(scrollIfGlued);

                        scrollIfGlued();

                        $win.on(RESIZE, scrollIfGlued);
                        $el.on(SCROLL, onElementScroll);
                        let manualScrollListener = $scope.$on(MANUAL_SCROLL, ($event, forceScroll) => {
                            console.log("custom call scroll!");
                            if (forceScroll) {
                                direction.scroll(el);
                            } else {
                                scrollIfGlued();
                            }
                        });

                        $scope.$on('$destroy', function () {
                            $win.off(RESIZE, scrollIfGlued);
                            $el.off(SCROLL, onElementScroll);
                            //this deregisters the listener
                            manualScrollListener();
                        });
                    }
                };
            }
        ]);
    }

    let bottom = {
        isAttached: function (el, fuzzy) {
            // + 1 catches off by one errors in chrome
            let extra = fuzzy ? 75 : 2;
            return el.scrollTop + el.clientHeight + extra >= el.scrollHeight;
        },

        scroll: function (el) {
            el.scrollTop = el.scrollHeight;
        }
    };

    let top = {
        isAttached: function (el) {
            return el.scrollTop <= 1;
        },

        scroll: function (el) {
            el.scrollTop = 0;
        }
    };

    let right = {
        isAttached: function (el) {
            return el.scrollLeft + el.clientWidth + 1 >= el.scrollWidth;
        },

        scroll: function (el) {
            el.scrollLeft = el.scrollWidth;
        }
    };

    let left = {
        isAttached: function (el) {
            return el.scrollLeft <= 1;
        },

        scroll: function (el) {
            el.scrollLeft = 0;
        }
    };

    let module = angular.module('ngScrollGlue', []);

    createDirective(module, 'scrollGlue', bottom);
    createDirective(module, 'scrollGlueTop', top);
    createDirective(module, 'scrollGlueBottom', bottom);
    createDirective(module, 'scrollGlueLeft', left);
    createDirective(module, 'scrollGlueRight', right);

}(angular));