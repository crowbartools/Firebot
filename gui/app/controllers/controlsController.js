"use strict";
(function() {
    angular
        .module("firebotApp")
        .controller("controlsController", function(
            $scope,
            mixplayService,
            utilityService
        ) {

            $scope.mps = mixplayService;

            $scope.GridSize = {
                LARGE: "large",
                MEDIUM: "medium",
                SMALL: "small"
            };

            $scope.tiles = [
                {
                    x: 0,
                    y: 0,
                    height: 4,
                    width: 6
                },
                {
                    x: 6,
                    y: 5,
                    height: 4,
                    width: 6
                }
            ];


            $scope.gridUpdated = function() {
                console.log("grid updated!");
                console.log($scope.tiles);
                $scope.$apply();
            };

            $scope.getSelectedProjectName = function() {
                let currentProject = mixplayService.getCurrentProject();
                if (currentProject != null) {
                    return currentProject.name;
                }
                return "No project selected";
            };

            $scope.deleteCurrentProject = function() {
                let currentProject = mixplayService.getCurrentProject();
                if (currentProject != null) {
                    mixplayService.deleteProject(currentProject.id);
                }
            };


            $scope.showCreateMixplayModal = function() {

                utilityService.openGetInputModal(
                    {
                        model: "",
                        label: "New Project Name",
                        saveText: "Create",
                        validationFn: (value) => {
                            return new Promise(resolve => {
                                if (value == null || value.length < 1) {
                                    resolve(false);
                                } else {
                                    resolve(true);
                                }
                            });
                        },
                        validationText: "Project name cannot be empty."

                    },
                    (name) => {
                        mixplayService.createNewProject(name);
                    });
            };
        });
}());
