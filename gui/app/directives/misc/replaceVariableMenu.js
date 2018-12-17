"use strict";
(function() {
    //This adds the <effect-options> element

    angular.module("firebotApp")
        .directive("replaceVariables", function($compile, $document) {
            return {
                restrict: "A",
                scope: {
                    modelValue: '=ngModel'
                },
                controller: function($scope, $element, listenerService) {

                    const insertAt = (str, sub, pos) => `${str.slice(0, pos)}${sub}${str.slice(pos)}`;

                    $scope.showMenu = false;

                    $scope.variables = listenerService.fireEventSync("getReplaceVariableDefinitions");

                    $scope.toggleMenu = () => {
                        $scope.showMenu = !$scope.showMenu;
                    };

                    $scope.addVariable = (variable) => {
                        let insertIndex = $element.prop("selectionStart");

                        let currentModel = $scope.modelValue ? $scope.modelValue : "";

                        let display = variable.usage ? variable.usage : variable.handle;

                        let updatedModel = insertAt(currentModel, "$" + display + " ", insertIndex);

                        $scope.modelValue = updatedModel;

                        //$scope.showMenu = false;
                    };

                },
                link: function(scope, element) {

                    let wrapper = angular.element(`
                        <div style="position: relative;"></div>`
                    );
                    let compiled = $compile(wrapper)(scope);
                    element.wrap(compiled);

                    let button = angular.element('<span style="width: 30px;height: 15px;background: #0b8dc6;position: absolute;bottom:0;right:0;border-radius:4px;font-size: 10px;text-align: center;margin: 0 7px 7px 0;cursor: pointer;user-select: none;" ng-click="toggleMenu()" class="clickable">$vars</span>');
                    $compile(button)(scope);
                    button.insertAfter(element);

                    let menu = angular.element(`
                        <div style="width: 375px; background: #060707; position: absolute; right: 0px; top: -307px; z-index: 100; border-radius: 4px;" ng-show="showMenu">
                            <div style="padding:10px;border-bottom: 1px solid #48474a;">
                                <div style="position: relative;">
                                    <input type="text" class="form-control" placeholder="Search variables..." ng-model="variableSearchText" style="padding-left: 27px;">
                                    <span class="searchbar-icon"><i class="far fa-search"></i></span>
                                </div>
                            </div>
                            <div style="padding: 10px;overflow-y: scroll; height: 250px;">
                                <dl>
                                    <dt ng-repeat-start="variable in variables | orderBy:'handle' | variableSearch:variableSearchText" style="font-weight: 900;">\${{variable.usage ? variable.usage : variable.handle}} <i class="fal fa-plus-circle clickable" uib-tooltip="Add to textfield" style="color: #0b8dc6" ng-click="addVariable(variable)"></i></dt>
                                    <dd ng-repeat-end style="margin-bottom: 8px;" class="muted">{{variable.description || ""}}</dd>
                                </dl>
                            </div>
                            
                        </div>`
                    );
                    $compile(menu)(scope);
                    menu.insertAfter(element);


                    function documentClick(event) {
                        if (
                            scope.showMenu &&
                            //!element[0].contains(event.target) &&
                            !wrapper[0].contains(event.target) &&
                            !button[0].contains(event.target) &&
                            !menu[0].contains(event.target)
                        ) {
                            scope.showMenu = false;
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
