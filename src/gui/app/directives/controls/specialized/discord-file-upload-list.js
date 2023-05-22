"use strict";
(function() {
    angular
        .module('firebotApp')
        .component("discordFileUploadList", {
            bindings: {
                model: "="
            },
            template: `
                <div>
                    <div ng-repeat="channel in $ctrl.model track by $index" style="margin-bottom: 4px;">
                        <div style="display:flex;height: 45px; align-items: center; justify-content: space-between;padding: 0 15px;background-color:#44474e;border-radius: 4px;">
                            <div style="font-weight: 100;font-size: 16px;">{{channel.name}}</div>
                            <div style="display: flex;align-items: center;justify-content: center;">
                                <button class="filter-bar" ng-click="$ctrl.editFile($index)" style="margin: 0; margin-right: 13px;" aria-label="Edit File">Edit</button>
                                <span class="delete-button" ng-click="$ctrl.removeFile($index)">
                                    <i class="far fa-trash-alt"></i>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <button ng-if="$ctrl.model.length < 10" class="filter-bar" ng-click="$ctrl.addFile()" uib-tooltip="Add File" tooltip-append-to-body="true" aria-label="Add File">
                            <i class="far fa-plus"></i>
                        </button>
                    </div>
                </div>
            `,
            controller: function(utilityService) {

                const $ctrl = this;


                $ctrl.$onInit = () => {
                    if ($ctrl.model == null) {
                        $ctrl.model = [];
                    }
                };

                function openAddOrEditFileModal(file, cb) {

                    utilityService.showModal({
                        component: "addOrEditDiscordFileUploadModal",
                        size: 'sm',
                        resolveObj: {
                            file: () => file
                        },
                        closeCallback: resp => {
                            cb(resp.file);
                        }
                    });
                }

                $ctrl.editFile = (index) => {
                    openAddOrEditFileModal($ctrl.model[index], (newFile) => {
                        $ctrl.model[index] = newFile;
                    });
                };

                $ctrl.addFile = () => {
                    openAddOrEditFileModal(null, (newFile) => {
                        $ctrl.model.push(newFile);
                    });
                };

                $ctrl.removeFile = (index) => {
                    $ctrl.model.splice(index, 1);
                };

            }
        });
}());
