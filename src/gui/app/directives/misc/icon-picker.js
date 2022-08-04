"use strict";

(function() {
    angular.module("firebotApp")
        .directive("iconPicker", function ($compile, $document) {
            return {
                scope: {
                    modelValue: '=ngModel'
                },
                controller: function($scope, $timeout, $element, iconsService) {
                    $scope.icons = iconsService.icons;
                    $scope.showIconPicker = false;
                    $scope.displayLimit = 50;

                    $scope.searchFilter = "";
                    $scope.searchText = "";
                    $scope.searchTerm = `${$scope.searchFilter} ${$scope.searchText}`;
                    $scope.toggleIconPicker = () => {
                        $scope.setIconPicker(!$scope.showIconPicker);
                    };

                    $scope.setIconPicker = (value) => {
                        $scope.showIconPicker = value;
                        if (!value) {
                            $timeout(() => {
                                $element.focus();
                            }, 10);
                        } else {
                            $timeout(() => {
                                $element.next(".icon-picker").find("#icon-search").focus();
                            }, 5);
                        }
                    };

                    $scope.selectIcon = (className) => {
                        $scope.modelValue = className;
                    };
                },
                link: function(scope, element) {
                    const wrapper = angular.element(`
                        <div class="input-group"></div>`
                    );

                    const compiled = $compile(wrapper)(scope);
                    element.wrap(compiled);

                    const button = angular.element(`
                        <span class="input-group-btn">
                            <button class="btn btn-primary" ng-click="toggleIconPicker()" type="button"><i class="fab fa-font-awesome-flag"></i></button>
                        </span>
                    `);
                    $compile(button)(scope);

                    button.insertBefore(element);

                    const iconPicker = angular.element(`
                        <div class="icon-picker" ng-show="showIconPicker">
                            <div class="p-4" style="border-bottom: 1px solid #48474a;">
                                <div class="input-group" style="position: relative;">
                                    <input id="icon-search" type="text" class="form-control pl-11" aria-label="Search icons" placeholder="Search icons..." ng-model="searchText" style="background: #484848;border-radius: 3px;">
                                    <span class="searchbar-icon"><i class="far fa-search"></i></span>
                                    <div class="input-group-btn">
                                        <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Filter <span class="caret"></span></button>
                                        <ul class="dropdown-menu dropdown-menu-right">
                                            <li><a href="#" ng-click="searchFilter = 'Solid'">Solid</a></li>
                                            <li><a href="#" ng-click="searchFilter = 'Regular'">Regular</a></li>
                                            <li><a href="#" ng-click="searchFilter = 'Light'">Light</a></li>
                                            <li><a href="#" ng-click="searchFilter = 'Duotone'">Duotone</a></li>
                                            <li><a href="#" ng-click="searchFilter = 'Brands'">Brands</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div class="icon-container flex p-4" style="flex-wrap: wrap;overflow-y: scroll; height: 250px;align-content: flex-start;">
                                <div ng-repeat="icon in icons | iconSearch:searchFilter + ' ' + searchText  | limitTo: displayLimit" class="text-4xl flex" style="width: 20%;height: 50px;justify-content: center;align-items: center;">
                                    <i
                                        class="clickable {{icon.className}}"
                                        aria-label="{{icon.style}}: {{icon.name}}"
                                        ng-click="selectIcon(icon.className)"
                                        uib-tooltip="{{icon.style}} {{icon.name}}"
                                    ></i>
                                </div>
                            </div>
                        </div>
                    `);

                    $compile(iconPicker)(scope);
                    iconPicker.insertAfter(element);

                    const container = iconPicker.find(".icon-container")[0];
                    angular.element(container).on('scroll', () => {
                        scope.$apply(() => {
                            if (container.scrollTop + container.offsetHeight >= container.scrollHeight) {
                                scope.displayLimit = scope.displayLimit + 50;
                            }
                        });
                    });

                    const documentClick = (event) => {
                        if (
                            scope.showIconPicker &&
                            !wrapper[0].contains(event.target) &&
                            !button[0].contains(event.target) &&
                            !iconPicker[0].contains(event.target)
                        ) {
                            scope.setIconPicker(false);
                        }
                    };

                    $document.bind("mousedown", documentClick);

                    scope.$on("$destroy", () => {
                        $document.unbind("mousedown", documentClick);
                    });
                }
            };
        });
}());