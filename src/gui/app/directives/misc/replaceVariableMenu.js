"use strict";
(function() {

    const { VariableCategory } = require("../../shared/variable-constants");

    const { marked } = require("marked");
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
                controller: function($scope, $element, replaceVariableService, $timeout, $sce, variableMacroService) {

                    const insertAt = (str, sub, pos) => `${str.slice(0, pos)}${sub}${str.slice(pos)}`;

                    $scope.showMenu = false;

                    $scope.variables = [];

                    $scope.magicVariables = {
                        customVariables: [],
                        effectOutputs: [],
                        presetListArgs: []
                    };

                    $scope.hasMagicVariables = false;

                    $scope.variableMacroService = variableMacroService;

                    $scope.activeCategory = "common";
                    $scope.setActiveCategory = (category) => {
                        $scope.activeCategory = category;
                    };
                    $scope.categories = Object.values(VariableCategory);

                    $scope.searchUpdated = () => {
                        if ($scope.activeCategory !== "magic") {
                            $scope.activeCategory = null;
                        }
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

                        if (triggerMeta?.magicVariables) {
                            $scope.magicVariables = triggerMeta.magicVariables;
                            $scope.hasMagicVariables = Object.values($scope.magicVariables).some(v => v.length > 0);
                        }

                        $timeout(function() {
                            const offset = $element.offset();
                            const menuHeight = ($scope.hasMagicVariables ? 385 : 350) + 10; // 10px to account for app title bar
                            if (offset.top <= menuHeight && ($scope.menuPosition === "above" || $scope.menuPosition == null)) {
                                $scope.menuPosition = "under";
                            }
                        }, 0, false);

                        if (!$scope.disableVariableMenu) {
                            $scope.variables = replaceVariableService.getVariablesForTrigger({
                                type: trigger,
                                id: triggerMeta && triggerMeta.triggerId,
                                dataOutput: $scope.replaceVariables
                            }).map((v) => {
                                return {
                                    ...v,
                                    description: parseMarkdown(v.description || ""),
                                    examples: v.examples?.map((e) => {
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

                    $scope.insertText = (text) => {
                        if ($scope.onVariableInsert != null) {
                            $scope.onVariableInsert({ text });
                            $scope.toggleMenu();
                        } else {
                            const currentModel = $scope.modelValue ? $scope.modelValue : "";

                            const insertIndex = $element.prop("selectionStart") || currentModel.length;

                            const updatedModel = insertAt(currentModel, text, insertIndex);

                            $scope.modelValue = updatedModel;
                        }
                    };

                    $scope.addMacro = (macro) => {
                        let baseVariableText = `$%${macro.name}`;
                        if (macro.argNames?.length) {
                            baseVariableText += `[${macro.argNames.join(", ")}]`;
                        }
                        $scope.insertText(baseVariableText);
                    };

                    $scope.addVariable = (variable) => {
                        const display = variable.usage ? variable.usage : variable.handle;
                        $scope.insertText(`$${display}`);
                    };

                    $scope.showAddOrEditVariableMacroModal = (macro) => {
                        $scope.keepMenuOpen = true;
                        variableMacroService.showAddOrEditVariableMacroModal(macro, () => {
                            $element.next(".variable-menu").find("#variable-search").focus();
                            $scope.keepMenuOpen = false;
                        });
                    };

                    $scope.getAliases = (variable) => {
                        return variable.aliases?.map(a => `$${a}`).join(", ");
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
                        <div class="variable-menu" ng-show="showMenu" ng-class="[menuPosition, { 'has-magic-vars': hasMagicVariables }]">
                            <div style="padding:10px;border-bottom: 1px solid #48474a;">
                                <div style="position: relative;">
                                    <input id="variable-search" type="text" class="form-control" placeholder="Search variables..." ng-model="variableSearchText" ng-change="searchUpdated()" style="padding-left: 27px;">
                                    <span class="searchbar-icon"><i class="far fa-search"></i></span>
                                </div>
                            </div>

                            <div style="display: flex; flex-direction: row;">
                                <div class="effect-categories dark">
                                    <div
                                        class="effect-category-wrapper dark"
                                        ng-class="{'selected': activeCategory === 'macros'}"
                                        ng-click="setActiveCategory('macros');"
                                    >
                                        <div class="category-text"><i class="fas fa-layer-group"></i> Macros</div>
                                    </div>
                                    <div
                                        class="effect-category-wrapper dark"
                                        ng-class="{'selected': activeCategory === 'magic'}"
                                        ng-click="setActiveCategory('magic');"
                                        ng-show="hasMagicVariables"
                                    >
                                        <div class="category-text"><i class="far fa-magic"></i> Magic</div>
                                    </div>
                                    <div class="effect-category-header muted" style="padding-top:5px;">Categories</div>
                                    <div class="effect-category-wrapper dark" ng-class="{'selected': activeCategory == null}" ng-click="setActiveCategory(null);">
                                        <div class="category-text">All</div>
                                    </div>
                                    <div class="effect-category-wrapper dark" ng-repeat="category in categories" ng-class="{'selected': activeCategory === category}" ng-click="setActiveCategory(category);">
                                        <div class="category-text">{{category}}
                                            <tooltip
                                                style="margin-left: 5px"
                                                ng-if="category === 'integrations' || category === 'obs'"
                                                text="'Integrations need to be linked / configured in Settings -> Integrations in order for the variables to work.'"
                                            ></tooltip>
                                        </div>
                                    </div>
                                </div>
                                <div style="overflow-y: auto;width: 100%;" ng-style="{ height: hasMagicVariables ? '408px': '375px', padding: activeCategory === 'macros' ? '10px 0' : '10px' }">
                                    <div ng-hide="activeCategory === 'magic' || activeCategory === 'macros'" ng-repeat="variable in variables | orderBy:'handle' | variableCategoryFilter:activeCategory | variableSearch:variableSearchText" style="margin-bottom: 8px;">
                                        <div style="font-weight: 900;">\${{variable.usage ? variable.usage : variable.handle}} <i class="fal fa-plus-circle clickable" uib-tooltip="Add to textfield" style="color: #0b8dc6" ng-click="addVariable(variable)"></i></div>
                                        <div ng-if="variable.aliases && variable.aliases.length > 0">
                                            <div style="font-size: 12px; opacity: 0.75;">Aliases: {{getAliases(variable)}}</div>
                                        </div>
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
                                    <div ng-show="activeCategory === 'macros'" style="position: relative;">
                                        <div class="mb-2 pr-4" style="text-align: right;">
                                            <firebot-button type="primary" size="small" icon="fas fa-plus-circle" text="Add Macro" ng-click="showAddOrEditVariableMacroModal()" />
                                        </div>
                                        <macro-list-item
                                            ng-repeat="macro in variableMacroService.macros | filter: { name: variableSearchText } track by macro.name"
                                            macro="macro"
                                            on-edit-clicked="showAddOrEditVariableMacroModal(macro)"
                                            on-add-to-text-clicked="addMacro(macro)"
                                        />
                                    </div>
                                    <div ng-show="activeCategory === 'magic'" style="position: relative;">
                                        <div style="position: absolute; right: 0;">
                                            <a
                                                class="magic-tooltip"
                                                uib-tooltip="These are custom variables, effect outputs, and preset list arg variables that Firebot thinks might be relevant to this effect. This is not an exhaustive list and the variables that are listed may or may not be available at the time of effect execution. Treat these as a helpful hint rather than a guarantee."
                                                tooltip-append-to-body="true"
                                                tooltip-placement="auto top"
                                            >What are these?</a>
                                        </div>
                                        <div ng-if="magicVariables.customVariables.length > 0">
                                            <div class="effect-category-header" style="padding-top: 0; padding-left: 0;">Custom Variables</div>
                                            <div ng-repeat="variable in magicVariables.customVariables | variableSearch:variableSearchText track by variable.name" style="margin-bottom: 8px;">
                                                <div style="font-weight: 900;">{{variable.handle}} <i class="fal fa-plus-circle clickable" uib-tooltip="Add to textfield" style="color: #0b8dc6" ng-click="insertText(variable.handle)"></i></div>
                                                <div ng-show="variable.examples && variable.examples.length > 0" style="font-size: 13px;padding-left: 5px; margin-top:3px;">
                                                    <collapsable-section show-text="Other examples" hide-text="Other examples" text-color="#0b8dc6">
                                                        <div ng-repeat="example in variable.examples" style="margin-bottom: 6px;">
                                                            <div style="font-weight: 900;">{{example.handle}} <i class="fal fa-plus-circle clickable" uib-tooltip="Add to textfield" style="color: #0b8dc6" ng-click="insertText(example.handle)"></i></div>
                                                            <div class="muted" ng-bind-html="example.description"></div>
                                                        </div>
                                                    </collapsable-section>
                                                </div>
                                            </div>
                                        </div>

                                        <div ng-if="magicVariables.effectOutputs.length > 0">
                                            <div class="effect-category-header" style="padding-left: 0;">Effect Outputs</div>
                                            <div ng-repeat="variable in magicVariables.effectOutputs | variableSearch:variableSearchText track by variable.name" style="margin-bottom: 8px;">
                                                <div style="font-weight: 900;">{{variable.handle}} <i class="fal fa-plus-circle clickable" uib-tooltip="Add to textfield" style="color: #0b8dc6" ng-click="insertText(variable.handle)"></i></div>
                                                <div ng-show="variable.description" class="muted">{{variable.description}}</div>
                                                <div ng-show="variable.effectLabel" style="font-size: 12px; opacity: 0.75;">Effect: {{variable.effectLabel}}</div>
                                                <div ng-show="variable.examples && variable.examples.length > 0" style="font-size: 13px;padding-left: 5px; margin-top:3px;">
                                                    <collapsable-section show-text="Other examples" hide-text="Other examples" text-color="#0b8dc6">
                                                        <div ng-repeat="example in variable.examples" style="margin-bottom: 6px;">
                                                            <div style="font-weight: 900;">{{example.handle}} <i class="fal fa-plus-circle clickable" uib-tooltip="Add to textfield" style="color: #0b8dc6" ng-click="insertText(example.handle)"></i></div>
                                                            <div class="muted" ng-bind-html="example.description"></div>
                                                        </div>
                                                    </collapsable-section>
                                                </div>
                                            </div>
                                        </div>

                                        <div ng-if="magicVariables.presetListArgs.length > 0">
                                            <div class="effect-category-header" style="padding-left: 0;">Preset List Args</div>
                                            <div ng-repeat="variable in magicVariables.presetListArgs | variableSearch:variableSearchText track by variable.name" style="margin-bottom: 8px;">
                                                <div style="font-weight: 900;">{{variable.handle}} <i class="fal fa-plus-circle clickable" uib-tooltip="Add to textfield" style="color: #0b8dc6" ng-click="insertText(variable.handle)"></i></div>
                                            </div>
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
                            !menu[0].contains(event.target) &&
                            !scope.keepMenuOpen
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
