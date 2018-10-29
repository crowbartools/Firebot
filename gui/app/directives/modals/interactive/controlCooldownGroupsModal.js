'use strict';

(function() {
    angular
        .module('firebotApp')
        .component("controlCooldownGroupsModal", {
            template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Cooldown Groups</h4>
            </div>
            <div class="modal-body">
                <p class="muted">Cooldown groups make it easy to group multiple controls together so that they all cooldown anytime one is clicked.</p>
                <button class="btn btn-default" ng-click="showAddOrEditCooldownGroupModal()"><i class="fas fa-plus-circle" style="margin-right:5px;"></i> New Cooldown Group</button>
                <div class="board-cooldown-content" style="margin-top: 15px;">
                    
                    <div class="board-cooldown-groups">
                    <!-- Create cooldown groups -->
                    <div ng-repeat="cooldownGroup in getCooldownGroupSettings() track by $index" class="fb-tile flex-start light-blue">
                        <div class="edit-btn" ng-click="showAddOrEditCooldownGroupModal(cooldownGroup)"></div>
                        <div class="header">
                        <div class="title edit-btn-spacer">
                            {{cooldownGroup.groupName}}
                        </div>
                        </div>
                        <div class="content row">
                        <div class="detail-wrapper">
                            <div class="detail">
                            {{cooldownGroup.buttons ? cooldownGroup.buttons.length : 0}}
                            </div>
                            <div class="detail-description">
                            Buttons
                            </div>
                        </div>
                        <div class="detail-wrapper">
                            <div class="detail">
                            {{cooldownGroup.length ? cooldownGroup.length : 0}}
                            </div>
                            <div class="detail-description">
                            Secs
                            </div>
                        </div>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" ng-click="$ctrl.close()">Close</button>
            </div>
            `,
            bindings: {
                resolve: '<',
                close: '&',
                dismiss: '&'
            },
            controller: function($scope, utilityService, boardService) {
                let $ctrl = this;

                $scope.getCooldownGroupSettings = function() {
                    let settings = [];
                    if ($ctrl.resolve.board != null) {
                        settings = Object.values($ctrl.resolve.board.cooldownGroups);
                    }
                    return settings;
                };

                $ctrl.$onInit = function () {
                    // When the compontent is initialized
                    // This is where you can start to access bindings, such as variables stored in 'resolve'
                    // IE $ctrl.resolve.shouldDelete or whatever
                };

                /*
             * ADD OR EDIT COOLDOWN GROUP MODAL
             */
                $scope.showAddOrEditCooldownGroupModal = function(cooldownGroup) {
                    let editViewerGroupDefaultsModalContext = {
                        templateUrl: "./templates/interactive/modals/addOrEditCooldownGroupModal.html",
                        // This is the controller to be used for the modal.
                        controllerFunc: ($scope, $uibModalInstance, boardService, utilityService, cooldownGroup) => {

                            $scope.cooldownGroup = {};

                            $scope.isNewGroup = true;


                            if (cooldownGroup != null) {
                                $scope.cooldownGroup = cooldownGroup;
                                $scope.isNewGroup = false;
                            }

                            $scope.allControlIds = boardService.getControlsForSelectedBoard()
                                .filter(c => c.kind === "button" || c.kind === "textbox")
                                .map(b => b.controlId);

                            $scope.updateCheckedArrayWithElement = function(array, element) {
                                $scope.cooldownGroup.buttons = utilityService.getNewArrayWithToggledElement(array, element);
                            };

                            $scope.arrayContainsElement = utilityService.arrayContainsElement;

                            $scope.save = function() {
                                if ($scope.cooldownGroup.groupName != null && $scope.cooldownGroup.groupName !== "") {
                                    $uibModalInstance.close({ shouldDelete: false, newCooldownGroup: $scope.cooldownGroup });

                                    // Refresh the interactive control cache.
                                    ipcRenderer.send('refreshInteractiveCache');
                                }
                            };

                            $scope.delete = function() {
                                $uibModalInstance.close({ shouldDelete: true });
                            };

                            // When they hit cancel or click outside the modal, we dont want to do anything
                            $scope.dismiss = function() {
                                $uibModalInstance.dismiss('cancel');
                            };
                        },
                        closeCallback: (response) => {
                            let previousName = "";
                            if (cooldownGroup != null) {
                                previousName = cooldownGroup.groupName;
                            }

                            if (response.shouldDelete) {
                                boardService.deleteCooldownGroupForCurrentBoard(previousName, cooldownGroup);
                            } else {
                                boardService.saveCooldownGroupForCurrentBoard(previousName, response.newCooldownGroup);
                            }

                            // Refresh the interactive control cache.
                            ipcRenderer.send('refreshInteractiveCache');
                        },
                        resolveObj: {
                            cooldownGroup: () => {
                                if (cooldownGroup == null) {
                                    return null;
                                }
                                return $.extend(true, {}, cooldownGroup);
                            }
                        }
                    };
                    utilityService.showModal(editViewerGroupDefaultsModalContext);
                };
            }
        });
}());
