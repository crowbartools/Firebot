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
                controller: function($scope, $element, $q, backendCommunicator, $timeout,
                    commandsService) {


                    const insertAt = (str, sub, pos) => `${str.slice(0, pos)}${sub}${str.slice(pos)}`;


                    const firebotCommandMenuItems = [
                        ...commandsService.getCustomCommands(),
                        ...commandsService.getSystemCommands()
                    ]
                        .filter(c => c.active)
                        .map(c => [
                            {
                                display: c.trigger,
                                description: c.description,
                                text: c.trigger
                            },
                            ...(c.subCommands ? c.subCommands.map(sc => ({
                                display: `${c.trigger} ${sc.usage ? sc.usage : sc.arg}`,
                                description: sc.description,
                                text: `${c.trigger} ${sc.arg}`
                            })) : [])
                        ]).flat();

                    const categories = [
                        {
                            onlyStart: true,
                            token: "!",
                            items: firebotCommandMenuItems
                        },
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

                    function ensureMenuItemVisible() {
                        const autocompleteMenu = $(".chat-autocomplete-menu");
                        const menuItem = autocompleteMenu.children()[$scope.selectedIndex];

                        menuItem.scrollIntoView({
                            block: "nearest"
                        });
                    }

                    $scope.selectedIndex = 0;
                    $element.bind("keyup", function (event) {
                        if (!$scope.menuOpen) return;
                        const key = event.key;
                        if (key === "ArrowUp" && $scope.selectedIndex > 0) {
                            $scope.selectedIndex -= 1;
                            $scope.$apply();
                            ensureMenuItemVisible();
                        } else if (key === "ArrowDown" && $scope.selectedIndex < $scope.menuItems.length - 1) {
                            $scope.selectedIndex += 1;
                            $scope.$apply();
                            ensureMenuItemVisible();
                        } else if (key === "Enter" || key === "Tab") {
                            console.log($scope.menuItems[$scope.selectedIndex]);
                        }
                        if (key === "ArrowUp" || key === "ArrowDown" || key === "Enter" || key === "Tab") {
                            event.stopPropagation();
                            event.preventDefault();
                            event.stopImmediatePropagation();
                        }
                    });

                    $scope.menuOpen = false;

                    $scope.menuItems = [];

                    $scope.$watch('modelValue', function(value) {
                        let matchingMenuItems = [];
                        if (value) {
                            const endsInSpace = value.endsWith(" ");
                            const oneWordSoFar = !value.trim().includes(" ");
                            if (!endsInSpace || oneWordSoFar) {
                                const isFirstWorld = !value.includes(" ");
                                const words = value.trim().split(" ");
                                const currentWord = words[words.length - 1];
                                categories.forEach(c => {
                                    if (((c.onlyStart && isFirstWorld) || !c.onlyStart) &&
                                    currentWord.startsWith(c.token)) {
                                        matchingMenuItems = c.items.filter(i => i.text.startsWith(currentWord));
                                    }
                                });
                            }
                        }
                        $scope.menuItems = matchingMenuItems;
                        $scope.selectedIndex = 0;
                        $scope.setMenuOpen(!!matchingMenuItems.length);
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
                            <div class="autocomplete-menu-item" ng-class="{ selected: selectedIndex == $index }" ng-repeat="item in menuItems track by item.text">
                                <div class="item-display">{{item.display}}</div>
                                <div ng-show="item.description != null" class="item-description">{{item.description}}</div>
                            </div>
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
