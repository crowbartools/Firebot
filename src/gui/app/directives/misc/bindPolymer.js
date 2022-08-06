"use strict";

angular.module('firebotApp').
    directive('bindPolymer', ['$parse', function($parse) {
        return {
            restrict: 'A',
            scope: {
                control: "="
            },
            compile: function bindPolymerCompile($element, $attr) {
                const attrMap = {};

                // eslint-disable-next-line guard-for-in
                for (const prop in $attr) {
                    const dashProp = prop.
                        replace(/([a-z])([A-Z])/g, '$1-$2').
                        toLowerCase();

                    if (angular.isString($attr[prop])) {
                        const _match = $attr[prop].match(/\{\{\s*([\.\w]+)\s*\}\}/); // eslint-disable-line no-useless-escape
                        if (_match) {
                            attrMap[prop] = $parse(_match[1]);
                            if (dashProp !== prop) {
                                attrMap[dashProp] = $parse(_match[1]);
                            }
                        }
                    }
                }

                return function bindPolymerLink(scope, element) {

                    // When Polymer sees a change to the bound variable,
                    // $apply / $digest the changes here in Angular
                    const observer = new MutationObserver(function processMutations(mutations) {
                        mutations.forEach(function processMutation(mutation) {
                            let attributeName, newValue, oldValue, getter;
                            attributeName = mutation.attributeName;

                            if (attributeName in attrMap) {
                                newValue = element.attr(attributeName);
                                getter = attrMap[attributeName];
                                oldValue = getter(scope);

                                if (!isNaN(newValue)) {
                                    newValue = parseInt(newValue);
                                }

                                if (oldValue !== newValue && angular.isFunction(getter.assign)) {
                                    getter.assign(scope, newValue);
                                }
                            }
                        });
                        scope.$apply();
                    });

                    observer.observe(element[0], {attributes: true});
                    scope.$on('$destroy', observer.disconnect.bind(observer));
                };
            }
        };
    }]);