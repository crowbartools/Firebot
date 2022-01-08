"use strict";
(function() {

    angular.module("firebotApp").directive("messageActions", function() {
        return {
            restrict: "A",
            scope: {
                message: "=",
                role: "<",
                onActionSelected: "&"
            },
            controller: function(
                $scope,
                $rootScope,
                $element,
                $compile,
                $document,
                $uibPosition,
                $timeout,
                connectionService
            ) {
                let vm = this;

                let template = `
                        <div class="popover message-actions" role="{{vm.role}}">
                            <div class="name-wrapper">
                                <img class="user-avatar" ng-src="{{vm.message.profilePicUrl}}">
                                <span style="margin-left: 10px" class="user-name">{{vm.message.username}}</span>
                            </div>
                            <div class="message-action" ng-repeat="action in vm.actions" ng-click="vm.actionClicked(action.name)">
                                <span class="action-icon"><i class="fal" ng-class="action.icon"></i></span>
                                <span class="action-name">{{action.name}}</span>
                            </div>
                        </div>
                    `;

                let popoverScope = $rootScope.$new(true);
                popoverScope.vm = vm;

                let popover = {};

                function loadPopover() {
                    popover = angular.element(template);
                    popover.css("display", "none");
                    $compile(popover)(popoverScope);
                    return popover;
                }
                loadPopover();

                vm.isVisible = false;
                vm.message = $scope.message;
                vm.role = $scope.role;

                function getActions() {
                    let actions = [];

                    actions.push({
                        name: "Details",
                        icon: "fa-info-circle"
                    });

                    actions.push({
                        name: "Delete",
                        icon: "fa-trash-alt"
                    });

                    actions.push({
                        name: "Mention",
                        icon: "fa-at"
                    });

                    if (vm.message.username !== connectionService.accounts.streamer.username &&
                        vm.message.username !== connectionService.accounts.bot.username) {

                        actions.push({
                            name: "Whisper",
                            icon: "fa-envelope"
                        });

                        actions.push({
                            name: "Quote This Message",
                            icon: "fa-quote-right"
                        });

                        actions.push({
                            name: "Shoutout",
                            icon: "fa-megaphone"
                        });

                        if (vm.message.roles.includes("mod")) {
                            actions.push({
                                name: "Unmod",
                                icon: "fa-user-times"
                            });
                        } else {
                            actions.push({
                                name: "Mod",
                                icon: "fa-user-plus"
                            });
                        }

                        actions.push({
                            name: "Timeout",
                            icon: "fa-clock"
                        });

                        actions.push({
                            name: "Ban",
                            icon: "fa-ban"
                        });
                    }
                    return actions;
                }

                vm.actions = getActions();

                function hidePopover() {
                    if (vm.isVisible) {
                        popover.css({ display: "none" });
                        popover.remove();
                        vm.isVisible = false;
                    }
                }

                vm.actionClicked = actionName => {
                    $scope.onActionSelected({
                        actionName: actionName,
                        userName: $scope.message.username,
                        userId: $scope.message.userId,
                        msgId: $scope.message.id,
                        rawText: $scope.message.rawText
                    });
                    hidePopover();
                };

                let lastPlacement;
                function positionPopover() {
                    $timeout(() => {
                        popover.css({ display: "block" });
                        let position = $uibPosition.positionElements(
                            $element,
                            popover,
                            "auto right",
                            true
                        );
                        let initialHeight = angular.isDefined(popover.offsetHeight)
                            ? popover.offsetHeight
                            : popover.prop("offsetHeight");
                        let elementPos = $uibPosition.offset($element);
                        let placementClasses = position.placement.split("-");

                        if (!popover.hasClass(placementClasses[0])) {
                            if (lastPlacement != null) {
                                popover.removeClass(lastPlacement.split("-")[0]);
                            }
                            popover.addClass(placementClasses[0]);
                        }
                        position.top += "px";
                        position.left += "px";
                        popover.css(position);
                        $timeout(() => {
                            let currentHeight = angular.isDefined(popover.offsetHeight)
                                ? popover.offsetHeight
                                : popover.prop("offsetHeight");
                            let adjustment = $uibPosition.adjustTop(
                                placementClasses,
                                elementPos,
                                initialHeight,
                                currentHeight
                            );
                            if (adjustment) {
                                popover.css(adjustment);
                            }
                        }, 0);
                        lastPlacement = position.placement;
                    }, 0);
                }

                function showPopover() {
                    if (!vm.isVisible) {
                        loadPopover();
                        $document.find("body").append(popover);
                        positionPopover();
                        vm.isVisible = true;
                    }
                }

                function togglePopover() {
                    if (!vm.isVisible) {
                        showPopover();
                    } else {
                        hidePopover();
                    }
                }

                function documentClick(event) {
                    if (vm.isVisible && !popover[0].contains(event.target) && !$element[0].contains(event.target)) {
                        hidePopover();
                    }
                }

                vm.showPopover = showPopover;
                vm.hidePopover = hidePopover;
                vm.togglePopover = togglePopover;

                $element.bind("click", togglePopover);

                $document.bind("click", documentClick);

                $scope.$on("$destroy", function() {
                    popover.remove();
                    $element.unbind("click", togglePopover);
                    $document.unbind("click", documentClick);
                    popoverScope.$destroy();
                });
            }
        };
    });
}());
