'use strict';
(function($) {

    // This handles the Groups tab


    angular
        .module('firebotApp')
        .controller('groupsController', function($scope, groupsService, utilityService) {
            $scope.groupsService = groupsService;
            /*
             * On tab load
             */
            // Make sure groups are loaded into memory
            groupsService.loadViewerGroups();

            /*
             * ADD/EDIT BOARD MODAL
             */
            $scope.showAddEditGroupModal = function(groupToEdit) {
                let addEditGroupModalContext = {
                    templateUrl: "addEditViewerGroupModal.html",
                    // This is the controller to be used for the modal.
                    controllerFunc: ($scope, $uibModalInstance, utilityService, groupToEdit) => {
                        // The model for the board id text field
                        $scope.group = {
                            groupName: "",
                            users: []
                        };

                        $scope.isNewGroup = groupToEdit == null;

                        if (!$scope.isNewGroup) {
                            $scope.group = $.extend(true, {}, groupToEdit);
                        }

                        $scope.pagination = {
                            currentPage: 1,
                            pageSize: 5
                        };

                        $scope.addNewUser = function() {
                            if ($scope.newUser != null && $scope.newUser !== "") {
                                $scope.group.users.push($scope.newUser);
                            }
                            $scope.newUser = "";
                        };

                        $scope.deleteUserAtIndex = function(index) {
                            let mappedIndex = index + (($scope.pagination.currentPage - 1) * $scope.pagination.pageSize);
                            $scope.group.users.splice(mappedIndex, 1);
                        };

                        // When the user clicks "Save/Add", we want to pass the group back
                        $scope.saveChanges = function(shouldDelete) {
                            shouldDelete = shouldDelete === true;

                            let defaultGroups = [
                                "Pro",
                                "Subscribers",
                                "Moderators",
                                "Channel Editors",
                                "Staff",
                                "Streamer"
                            ];

                            let groupName = $scope.group.groupName;

                            if (defaultGroups.includes(groupName)) {
                                utilityService.showErrorModal("You cannot create a custom group with the same name as a default Mixer group (Pro, Subscribers, Moderators, Channel Editors, Staff, Streamer).");
                                return;
                            }

                            if (!shouldDelete && groupName === "") return;
                            $uibModalInstance.close({
                                shouldDelete: shouldDelete,
                                group: shouldDelete ? groupToEdit : $scope.group
                            });

                            // Refresh the interactive control cache.
                            ipcRenderer.send('refreshInteractiveCache');
                        };

                        // When they hit cancel or click outside the modal, we dont want to do anything
                        $scope.dismiss = function() {
                            $uibModalInstance.dismiss();
                        };
                    },
                    resolveObj: {
                        groupToEdit: () => {
                            if (groupToEdit != null) {
                                return $.extend(true, {}, groupToEdit);
                            }
                            return null;

                        }
                    },
                    // The callback to run after the modal closed via "Save changes" or "Delete"
                    closeCallback: (context) => {
                        let group = context.group;
                        if (context.shouldDelete === true) {
                            groupsService.removeViewerGroup(group.groupName);
                        } else {
                            let previousGroupName = null;
                            if (groupToEdit != null) {
                                previousGroupName = groupToEdit.groupName;
                            }
                            groupsService.addOrUpdateViewerGroup(group, previousGroupName);
                        }
                    }
                };
                utilityService.showModal(addEditGroupModalContext);
            };

        });
}(window.jQuery));
