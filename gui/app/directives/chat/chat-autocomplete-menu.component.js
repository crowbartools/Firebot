"use strict";
(function() {

    angular.module("firebotApp")
        .directive("chatAutoCompleteMenu", function($compile, $document) {
            return {
                priority: 1,
                restrict: "A",
                scope: {
                    modelValue: '=ngModel',
                    onAutocomplete: "&?",
                    menuPosition: "@"
                },
                controller: function($scope, $element, $q, backendCommunicator, $timeout) {

                    const insertAt = (str, sub, pos) => `${str.slice(0, pos)}${sub}${str.slice(pos)}`;

                    const categories = [
                        {
                            onlyStart: true,
                            token: "/",
                            items: [
                                {
                                    display: "/ban [username]",
                                    description: "Ban a user",
                                    text: "/ban"
                                },
                                {
                                    display: "/mod [username]",
                                    description: "Mod a user",
                                    text: "/mod"
                                },
                                {
                                    display: "/mods",
                                    description: "Display mods in this channel",
                                    text: "/mods"
                                }
                            ]
                        }
                    ];

                    $scope.menuOpen = false;

                    $scope.menuItems = [];

                    $scope.$watch('modelValue', function(value) {
                        console.log(value);
                        let matchingMenuItems = [];
                        if (value) {
                            const endsInSpace = value.endsWith(" ");
                            const isFirstWorld = !value.includes(" ");
                            const words = value.trim().split(" ");
                            const currentWord = words[words.length - 1];
                            categories.forEach(c => {
                                if (c.onlyStart && isFirstWorld &&
                                    currentWord.startsWith(c.token)) {
                                    matchingMenuItems = c.items.filter(i => currentWord.startsWith(i.text));
                                }
                            });
                        }
                        $scope.setMenuOpen(false);

                    });

                    $scope.toggleMenu = () => {
                        $scope.setMenuOpen(!$scope.menuOpen);
                    };

                    $scope.setMenuOpen = (value) => {
                        $scope.menuOpen = value;
                        if (!value) {
                            $timeout(() => {
                                $element.focus();
                            }, 10);
                        } else {
                            $timeout(() => {
                                //$element.next(".variable-menu").find("#variable-search").focus();
                            }, 5);
                        }
                    };
                },
                link: function(scope, element) {

                    const wrapper = angular.element(`
                        <div style="position: relative;width:100%;"></div>`
                    );
                    const compiled = $compile(wrapper)(scope);
                    element.wrap(compiled);

                    if (scope.menuPosition == null) {
                        scope.menuPosition = "above";
                    }

                    const menu = angular.element(`
                        <div class="chat-autocomplete-menu" ng-show="menuOpen" ng-class="menuPosition">
                            hello world
                        </div>`
                    );
                    $compile(menu)(scope);
                    menu.insertAfter(element);

                    function documentClick(event) {
                        if (
                            scope.menuOpen &&
                            !wrapper[0].contains(event.target) &&
                            !menu[0].contains(event.target)
                        ) {
                            scope.setMenuOpen(false);
                        }
                    }

                    $document.bind("mousedown", documentClick);

                    scope.$on("$destroy", function() {
                        $document.unbind("mousedown", documentClick);
                    });
                }
            };
        });
}());
