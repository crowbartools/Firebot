"use strict";
(function() {

    function debounce(func, timeout = 300) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                func.apply(this, args);
            }, timeout);
        };
    }

    function getWordByPosition(str, pos) {
        let leftSideString = str.substr(0, pos);
        let rightSideString = str.substr(pos);

        let leftMatch = leftSideString.match(/[^.,\s]*$/);
        let rightMatch = rightSideString.match(/^[^.,\s]*/);

        let resultStr = '';

        if (leftMatch) {
            resultStr += leftMatch[0];
        }

        if (rightMatch) {
            resultStr += rightMatch[0];
        }

        return {
            index: leftMatch.index,
            endIndex: leftMatch.index + resultStr.length,
            text: resultStr
        };
    }

    angular.module("firebotApp")
        .directive("chatAutoCompleteMenu", function($compile, $document) {
            return {
                priority: 1,
                restrict: "A",
                scope: {
                    modelValue: '=ngModel',
                    inputId: "@",
                    onAutocomplete: "&?",
                    menuPosition: "@"
                },
                controller: function($scope, $element, $q, backendCommunicator, $timeout,
                    commandsService, chatMessagesService) {

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

                    const chatUsersCategory = {
                        onlyStart: false,
                        token: "@",
                        items: []
                    };

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
                        },
                        chatUsersCategory
                    ];

                    function buildChatUserItems() {
                        chatUsersCategory.items = chatMessagesService.chatUsers.map(user => ({
                            display: user.username,
                            text: `@${user.username}`
                        }));
                    }
                    buildChatUserItems();

                    $scope.chatMessagesService = chatMessagesService;
                    $scope.$watchCollection("chatMessagesService.chatUsers", () => {
                        buildChatUserItems();
                    });

                    function ensureMenuItemVisible() {
                        const autocompleteMenu = $(".chat-autocomplete-menu");
                        const menuItem = autocompleteMenu.children()[$scope.selectedIndex];

                        menuItem.scrollIntoView({
                            block: "nearest"
                        });
                    }

                    let currentWord = {};

                    $scope.selectedIndex = 0;
                    $(`#${$scope.inputId}`).bind("keydown", function (event) {
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
                            $scope.modelValue = $scope.modelValue.substring(0, currentWord.index)
                                + $scope.menuItems[$scope.selectedIndex].text
                                + $scope.modelValue.substring(currentWord.endIndex, $scope.modelValue.length) + " ";
                            $scope.$apply();
                        }
                        if (key === "ArrowUp" || key === "ArrowDown" || key === "Enter" || key === "Tab") {
                            event.stopPropagation();
                            event.preventDefault();
                            event.stopImmediatePropagation();
                        }
                    });

                    $scope.menuOpen = false;
                    $scope.menuItems = [];

                    $scope.$watch("modelValue", debounce((value) => {
                        let matchingMenuItems = [];

                        if (value && value.length > 0) {
                            const cursorIndex = $(`#${$scope.inputId}`).prop("selectionStart");

                            currentWord = getWordByPosition(value, cursorIndex);

                            const token = currentWord.text[0];

                            categories.forEach(c => {
                                if (token === c.token && (!c.onlyStart || currentWord.index === 0)) {
                                    debugger;
                                    matchingMenuItems = c.items.filter(i => i.text.startsWith(currentWord.text));
                                }
                            });
                        }

                        if ($scope.menuItems.length > 0 || matchingMenuItems.length > 0) {
                            $scope.menuItems = matchingMenuItems;
                            $scope.selectedIndex = 0;
                            $scope.setMenuOpen(!!matchingMenuItems.length);
                            $scope.$apply();
                        }
                    }, 150));

                    $scope.toggleMenu = () => {
                        $scope.setMenuOpen(!$scope.menuOpen);
                    };

                    $scope.setMenuOpen = (value) => {
                        $scope.menuOpen = value;
                        if (!value) {
                            $timeout(() => {
                                $element.focus();
                            }, 10);
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
