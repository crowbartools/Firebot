"use strict";
(function() {

    const { VariableCategory } = require("../../shared/variable-constants");

    const marked = require("marked");
    const { sanitize } = require("dompurify");

    angular.module("firebotApp")
        .directive("replaceVariables", function($compile, $document) {
            return {
                restrict: "A",
                scope: {
                    modelValue: '=ngModel',
                    replaceVariables: "@",
                    disableVariableMenu: "<",
                    onVariableInsert: "&?",
                    menuPosition: "@",
                    buttonPosition: "@"
                },
                controller: function($scope, $element, replaceVariableService, $timeout, $sce) {

                    const insertAt = (str, sub, pos) => `${str.slice(0, pos)}${sub}${str.slice(pos)}`;

                    $scope.showMenu = false;

                    $scope.variables = [];

                    $scope.activeCategory = "common";
                    $scope.setActiveCategory = (category) => {
                        $scope.activeCategory = category;
                    };
                    $scope.categories = Object.values(VariableCategory);

                    $scope.searchUpdated = () => {
                        $scope.activeCategory = null;
                    };

                    const parseMarkdown = (text) => {
                        return $sce.trustAsHtml(
                            sanitize(marked(text))
                        );
                    };

                    function findTriggerDataScope(currentScope) {
                        if (currentScope == null) {
                            currentScope = $scope;
                        }
                        if (currentScope.trigger || currentScope.triggerMeta) {
                            return currentScope;
                        }
                        if (currentScope.$parent == null) {
                            return {};
                        }
                        return findTriggerDataScope(currentScope.$parent);
                    }

                    function getVariables() {
                        const { trigger, triggerMeta } = findTriggerDataScope();

                        if (!$scope.disableVariableMenu) {
                            $scope.variables = replaceVariableService.getVariablesForTrigger({
                                type: trigger,
                                id: triggerMeta && triggerMeta.triggerId,
                                dataOutput: $scope.replaceVariables
                            }).map(v => {
                                return {
                                    ...v,
                                    description: parseMarkdown(v.description || ""),
                                    examples: v.examples?.map(e => {
                                        return {
                                            ...e,
                                            description: parseMarkdown(e.description || "")
                                        };
                                    })
                                };
                            });
                        }
                    }
                    getVariables();

                    $scope.$parent.$watch('trigger', function() {
                        getVariables();
                    });

                    $scope.toggleMenu = () => {
                        $scope.setMenu(!$scope.showMenu);
                    };
                    $scope.setMenu = (value) => {
                        $scope.showMenu = value;
                        if (!value) {
                            $timeout(() => {
                                $element.focus();
                            }, 10);
                        } else {
                            $timeout(() => {
                                $element.next(".variable-menu").find("#variable-search").focus();
                            }, 5);
                        }
                    };

                    $scope.addVariable = (variable) => {
                        if ($scope.onVariableInsert != null) {
                            $scope.onVariableInsert({ variable: variable});
                            $scope.toggleMenu();
                        } else {
                            const currentModel = $scope.modelValue ? $scope.modelValue : "";

                            const insertIndex = $element.prop("selectionStart") || currentModel.length;

                            const display = variable.usage ? variable.usage : variable.handle;

                            const updatedModel = insertAt(currentModel, `$${display}`, insertIndex);

                            $scope.modelValue = updatedModel;
                        }
                    };

                },
                link: function(scope, element) {

                    if (scope.disableVariableMenu) {
                        return;
                    }

                    const parent = element.parent();

                    let wrapper = parent;
                    if (!parent.hasClass("input-group")) {
                        wrapper = angular.element(`
                            <div style="position: relative;"></div>`
                        );
                        const compiled = $compile(wrapper)(scope);
                        element.wrap(compiled);
                    }

                    const button = angular.element(`<span class="variables-btn ${scope.buttonPosition ? scope.buttonPosition : ''}" ng-click="toggleMenu()">$vars</span>`);
                    $compile(button)(scope);

                    if (!scope.disableVariableMenu) {
                        button.insertAfter(element);
                    }

                    if (scope.menuPosition == null) {
                        scope.menuPosition = "above";
                    }

                    const menu = angular.element(`
                        <div class="variable-menu" ng-show="showMenu" ng-class="menuPosition">
                            <div style="padding:10px;border-bottom: 1px solid #48474a;">
                                <div style="position: relative;">
                                    <input id="variable-search" type="text" class="form-control" placeholder="Search variables..." ng-model="variableSearchText" ng-change="searchUpdated()" style="padding-left: 27px;">
                                    <span class="searchbar-icon"><i class="far fa-search"></i></span>
                                </div>
                            </div>

                            <div style="display: flex; flex-direction: row;">
                                <div style="width: 125px;display:flex;flex-direction:column;flex-shrink: 0;background: #18191b;">
                                    <div class="effect-category-header">Categories</div>
                                    <div class="effect-category-wrapper dark" ng-class="{'selected': activeCategory == null}" ng-click="setActiveCategory(null);">
                                        <div class="category-text">All</div>
                                    </div>
                                    <div class="effect-category-wrapper dark" ng-repeat="category in categories" ng-class="{'selected': activeCategory === category}" ng-click="setActiveCategory(category);">
                                        <div class="category-text">{{category}}</div>
                                    </div>
                                </div>
                                <div style="padding: 10px;overflow-y: auto; height: 250px;width: 100%;">
                                    <div ng-repeat="variable in variables | orderBy:'handle' | variableCategoryFilter:activeCategory | variableSearch:variableSearchText" style="margin-bottom: 8px;">
                                        <div style="font-weight: 900;">\${{variable.usage ? variable.usage : variable.handle}} <i class="fal fa-plus-circle clickable" uib-tooltip="Add to textfield" style="color: #0b8dc6" ng-click="addVariable(variable)"></i></div>
                                        <div class="muted" ng-bind-html="variable.description"></div>
                                        <div ng-show="variable.examples && variable.examples.length > 0" style="font-size: 13px;padding-left: 5px; margin-top:3px;">
                                            <collapsable-section show-text="Other examples" hide-text="Other examples" text-color="#0b8dc6">
                                                <div ng-repeat="example in variable.examples" style="margin-bottom: 6px;">
                                                    <div style="font-weight: 900;">\${{example.usage}} <i class="fal fa-plus-circle clickable" uib-tooltip="Add to textfield" style="color: #0b8dc6" ng-click="addVariable(example)"></i></div>
                                                    <div class="muted" ng-bind-html="example.description"></div>
                                                </div>
                                            </collapsable-section>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>`
                    );
                    $compile(menu)(scope);
                    menu.insertAfter(element);

                    function documentClick(event) {
                        if (
                            scope.showMenu &&
                            !wrapper[0].contains(event.target) &&
                            !button[0].contains(event.target) &&
                            !menu[0].contains(event.target)
                        ) {
                            scope.setMenu(false);
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
