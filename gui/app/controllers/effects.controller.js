"use strict";
(function() {
    angular
        .module("firebotApp")
        .controller("effectsController", function(
            $scope,
            effectQueuesService,
            presetEffectListsService,
            utilityService
        ) {
            $scope.activeTab = 0;

            $scope.eqs = effectQueuesService;

            $scope.addOrEditQueue = (queueId) => {
                effectQueuesService.showAddEditEffectQueueModal(queueId);
            };

            $scope.deleteQueue = (queueId) => {
                effectQueuesService.showDeleteEffectQueueModal(queueId);
            };

            $scope.getQueueModeName = (modeId) => {
                const mode = effectQueuesService.queueModes.find(m => m.id === modeId);
                return mode ? mode.display : "Unknown";
            };

            $scope.presetEffectListsService = presetEffectListsService;

            $scope.onPresetEffectListsUpdated = (items) => {
                presetEffectListsService.saveAllPresetEffectLists(items);
            };

            $scope.headers = [
                {
                    headerStyles: {
                        "padding-left": "20px"
                    },
                    name: "NAME",
                    icon: "fa-user",
                    cellTemplate: `<span style="padding-left: 20px;">{{data.name}}</span>`,
                    cellController: () => {}
                },
                {
                    name: "EFFECTS",
                    icon: "fa-magic",
                    cellTemplate: `{{data.effects ? data.effects.list.length : 0}}`,
                    cellControler: () => {}
                }
            ];

            $scope.presetEffectListOptions = (item) => {
                const options = [
                    {
                        html: `<a href ><i class="far fa-pen" style="margin-right: 10px;"></i> Edit</a>`,
                        click: function () {
                            presetEffectListsService.showAddEditPresetEffectListModal(item);
                        }
                    },
                    {
                        html: `<a href ><i class="far fa-clone" style="margin-right: 10px;"></i> Duplicate</a>`,
                        click: function () {
                            presetEffectListsService.duplicatePresetEffectList(item.id);
                        }
                    },
                    {
                        html: `<a href style="color: #fb7373;"><i class="far fa-trash-alt" style="margin-right: 10px;"></i> Delete</a>`,
                        click: function () {
                            utilityService
                                .showConfirmationModal({
                                    title: "Delete Preset Effect List",
                                    question: `Are you sure you want to delete the Preset Effect List "${item.name}"?`,
                                    confirmLabel: "Delete",
                                    confirmBtnType: "btn-danger"
                                })
                                .then(confirmed => {
                                    if (confirmed) {
                                        presetEffectListsService.deletePresetEffectList(item.id);
                                    }
                                });

                        }
                    }
                ];

                return options;
            };
        });
}());
