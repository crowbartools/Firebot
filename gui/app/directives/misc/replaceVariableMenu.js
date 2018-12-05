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
                controller: function($scope, listenerService) {

                    $scope.showMenu = false;

                    $scope.variables = listenerService.fireEventSync("getReplaceVariableDefinitions");

                    $scope.toggleMenu = () => {

                        
                        $scope.showMenu = !$scope.showMenu;
                    };

                    $scope.addVariable = (handle) => {
                        $scope.modelValue = ($scope.modelValue || "") + "$" + handle;
                    }

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
                        <div style="width: 300px; height: 400px; background: rgb(29, 28, 28); position: absolute; right: 0px; overflow-y: scroll; z-index: 100;" ng-show="showMenu">
                            <div style="padding:10px;">
                                <div style="position: relative;">
                                    <input type="text" class="form-control" placeholder="Search variables..." ng-model="variableSearch" style="padding-left: 27px;">
                                    <span class="searchbar-icon"><i class="far fa-search"></i></span>
                                </div>
                            </div>
                            <div style="padding: 10px;">
                                <dl>
                                    <dt ng-repeat-start="variable in variables | filter:{handle:variableSearch}" style="font-weight: 900;" ng-click="addVariable(variable.handle)" class="clickable">\${{variable.handle}}</dt>
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
                            !element[0].contains(event.target) &&
                            !wrapper[0].contains(event.target) &&
                            !button[0].contains(event.target) &&
                            !menu[0].contains(event.target)
                        ) {
                            scope.showMenu = false;
                        }
                    }

                    $document.bind("click", documentClick);

                    scope.$on("$destroy", function() {
                        $document.unbind("click", documentClick);
                    });
                }
            };
        });
}());
