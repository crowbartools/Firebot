/* angularjs Scroll Glue
 * version 2.1.0
 * https://github.com/Luegg/angularjs-scroll-glue
 * An AngularJs directive that automatically scrolls to the bottom of an element on changes in its scope.
*/

// Allow module to be loaded via require when using common js. e.g. npm
if(typeof module === "object" && module.exports){
    module.exports = 'ebScrollLock';
}

(function(angular, undefined){
    'use strict';

    function throttle(func, timeout = 300){
        let timer;
        return (...args) => {
            if(timer) return;
            timer = setTimeout(() => { func.apply(this, args); timer = null; }, timeout);
        };
    }

    function createActivationState($parse, attr, scope){
        function unboundState(initValue){
            var activated = initValue;
            return {
                getValue: function(){
                    return activated;
                },
                setValue: function(value){
                    activated = value;
                }
            };
        }

        function oneWayBindingState(getter, scope){
            return {
                getValue: function(){
                    return getter(scope);
                },
                setValue: function(){}
            };
        }

        function twoWayBindingState(getter, setter, scope){
            return {
                getValue: function(){
                    return getter(scope);
                },
                setValue: function(value){
                    if(value !== getter(scope)){
                        scope.$apply(function(){
                            setter(scope, value);
                        });
                    }
                }
            };
        }

        if(attr !== ""){
            var getter = $parse(attr);
            if(getter.assign !== undefined){
                return twoWayBindingState(getter, getter.assign, scope);
            } else {
                return oneWayBindingState(getter, scope);
            }
        } else {
            return unboundState(true);
        }
    }

    function createDirective(module, attrName, direction){
        module.directive(attrName, ['$parse', '$window', '$timeout', function($parse, $window, $timeout){
            return {
                priority: 1,
                restrict: 'A',
                link: function(scope, $el, attrs){
                    var el = $el[0],
                        activationState = createActivationState($parse, attrs[attrName], scope);

                    function scrollIfGlued() {
                        if(activationState.getValue()){
                            // Ensures scroll after angular template digest
                            $timeout(function() {
                              direction.scroll(el);
                            });
                        }
                    }

                    function onScroll() {
                        activationState.setValue(direction.isAttached(el));
                    }

                    const processScroll = throttle(() => onScroll(), 100);

                    $timeout(scrollIfGlued, 0, false);

                    if (!$el[0].hasAttribute('force-glue')) {
                      $el.on('wheel', processScroll);
                    }
                    
                    // observe new elements getting added 
                    const observer = new MutationObserver(function(mutationsList) {
                        for(const mutation of mutationsList) {
                            if(mutation.addedNodes.length) {

                                const child = mutation.addedNodes[0];
                                [...child.getElementsByTagName("img")].forEach(img => {
                                    if(!img.complete) {
                                        img.addEventListener('load', () => {
                                            scrollIfGlued();
                                        })
                                    }
                                });

                                if(child.hasAttribute("scroll-glue-anchor")) {
                                    scope.$watch(function() { return child.offsetHeight }, 
                                    function(newVal, oldVal) {
                                        if(newVal !== oldVal) {
                                            scrollIfGlued();
                                        }
                                    });
                                }
                            }
                        }
                        scrollIfGlued();
                    });
                    
                    observer.observe($el[0], {
                        childList: true
                    });   

                    $window.addEventListener('resize', scrollIfGlued, false);

                    scope.$watch(() => activationState.getValue(), function(newVal) {
                        if(newVal === true) {
                            scrollIfGlued();
                        }
                    })

                    // Remove listeners on directive destroy
                    $el.on('$destroy', function() {
                        $el.unbind('wheel', onScroll);
                        observer.disconnect();
                    });

                    scope.$on('$destroy', function() {
                        $window.removeEventListener('resize', scrollIfGlued, false);
                    });
                }
            };
        }]);
    }

    var bottom = {
        isAttached: function(el){
            // + 1 catches off by one errors in chrome
            return el.scrollTop + el.clientHeight + 1 >= el.scrollHeight;
        },
        scroll: function(el){
            el.scrollTop = el.scrollHeight;
        }
    };

    var top = {
        isAttached: function(el){
            return el.scrollTop <= 1;
        },
        scroll: function(el){
            el.scrollTop = 0;
        }
    };

    var right = {
        isAttached: function(el){
            return el.scrollLeft + el.clientWidth + 1 >= el.scrollWidth;
        },
        scroll: function(el){
            el.scrollLeft = el.scrollWidth;
        }
    };

    var left = {
        isAttached: function(el){
            return el.scrollLeft <= 1;
        },
        scroll: function(el){
            el.scrollLeft = 0;
        }
    };

    var module = angular.module('ebScrollLock', []);

    createDirective(module, 'scrollGlue', bottom);
    createDirective(module, 'scrollGlueTop', top);
    createDirective(module, 'scrollGlueBottom', bottom);
    createDirective(module, 'scrollGlueLeft', left);
    createDirective(module, 'scrollGlueRight', right);
}(angular));