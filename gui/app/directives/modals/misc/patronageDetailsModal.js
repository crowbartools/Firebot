'use strict';

// Basic template for a modal component, copy this and rename to build a modal.

(function() {
    angular
        .module('firebotApp')
        .component("patronageDetailsModal", {
            template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Patronage Details</h4>
            </div>
            <div class="modal-body">

                <div>
                    <div style="display:flex;">

                        <div style="position:relative;transform: translate(35px);z-index: 100;">
                            <img ng-src="{{$ctrl.getFilledVesselImageUrl()}}" style="height: 225px;width:70px;"></img>
                            <div style="height:225px;width:70px;position:absolute;top:0;left:0;">
                                <div style="height:{{$ctrl.getReversedVesselCompletedPercentage()}}%;overflow:hidden;">
                                    <img ng-src="{{$ctrl.getVesselImageUrl()}}" style="height: 225px;width:70px;"></img>
                                </div>
                            </div>
                        </div>

                        <div style="width: 150px; height: 225px; display:flex; flex-direction: column; justify-content: space-between;">
                            <div style="height: 1px;border-top: 2px dashed white;opacity: 0.3;"></div>
                            <div style="height: 1px;border-top: 2px dashed white;opacity: 0.3;"></div>
                            <div style="height: 1px;border-top: 2px dashed white;opacity: 0.3;"></div>
                            <div style="height: 1px;border-top: 2px dashed white;opacity: 0.3;"></div>
                            <div style="height: 1px;"></div>
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
            controller: function(patronageService) {
                let $ctrl = this;

                const defaultVesselImg = "https://static.mixer.com/img/design/ui/spark-crystal/001_crystal/001_crystal_empty.png";
                const defaultVesselFilledImg = "https://static.mixer.com/img/design/ui/spark-crystal/001_crystal/001_crystal_filled.png";

                $ctrl.getReversedVesselCompletedPercentage = () => {
                    return 100 - patronageService.percentageOfCurrentMilestoneGroup;
                };

                $ctrl.getVesselImageUrl = () => {
                    if (patronageService.dataLoaded) {
                        let periodData = patronageService.patronageData.period;
                        let channelData = patronageService.patronageData.channel;

                        let currentMilestoneGroupId = channelData.currentMilestoneGroupId;

                        let milestoneGroup = periodData.milestoneGroups.find(mg => mg.id === currentMilestoneGroupId);
                        if (milestoneGroup) {
                            return milestoneGroup.uiComponents.vesselImageEmptyPath;
                        }
                    }
                    return defaultVesselImg;
                };

                $ctrl.getFilledVesselImageUrl = () => {

                    if (patronageService.dataLoaded) {
                        let periodData = patronageService.patronageData.period;
                        let channelData = patronageService.patronageData.channel;

                        let currentMilestoneGroupId = channelData.currentMilestoneGroupId;

                        let milestoneGroup = periodData.milestoneGroups.find(mg => mg.id === currentMilestoneGroupId);
                        if (milestoneGroup) {
                            return milestoneGroup.uiComponents.vesselImageFullPath;
                        }
                    }

                    return defaultVesselFilledImg;
                };

                $ctrl.$onInit = function () {
                    // When the compontent is initialized
                    // This is where you can start to access bindings, such as variables stored in 'resolve'
                    // IE $ctrl.resolve.shouldDelete or whatever
                };
            }
        });
}());
