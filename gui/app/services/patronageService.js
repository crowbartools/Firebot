'use strict';


(function() {

    angular
        .module('firebotApp')
        .factory('patronageService', function ($rootScope, logger, listenerService) {
            let service = {};

            service.dataLoaded = false;
            service.patronageData = {
                channel: null,
                period: null
            };

            service.percentageToNextMilestone = 0;
            service.percentageOfCurrentMilestoneGroup = 0;

            function getPercentageToNextMilestone() {
                let percentCompleted = 0;

                if (service.dataLoaded) {
                    let periodData = service.patronageData.period;
                    let channelData = service.patronageData.channel;

                    let currentMilestoneId = channelData.currentMilestoneId;
                    let previousMilestoneId = channelData.currentMilestoneId - 1;

                    let milestoneGroup = periodData.milestoneGroups
                        .find(mg => mg.id === channelData.currentMilestoneGroupId);

                    if (milestoneGroup) {
                        let currentMilestone = milestoneGroup.milestones.find(m => m.id === currentMilestoneId);

                        let previousTarget = 0;
                        let previousMilestone = milestoneGroup.milestones.find(m => m.id === previousMilestoneId);
                        if (previousMilestone) {
                            previousTarget = previousMilestone.target;
                        }

                        if (currentMilestone) {
                            let currentTarget = currentMilestone.target;

                            let patronageEarned = channelData.patronageEarned;
                            if (patronageEarned > currentTarget) {
                                percentCompleted = 100;
                            } else {
                                percentCompleted = (patronageEarned - previousTarget) / (currentTarget - previousTarget);
                            }
                        }
                    }
                }

                return percentCompleted;
            }

            function getPercentageOfCurrentMilestoneGroup() {
                let percentCompleted = 0;

                if (service.dataLoaded) {
                    let channelData = service.patronageData.channel;
                    let periodData = service.patronageData.period;

                    let currentMilestoneGroup = periodData.milestoneGroups
                        .find(mg => mg.id === channelData.currentMilestoneGroupId);

                    if (currentMilestoneGroup) {

                        let completedMilestoneCount = currentMilestoneGroup.milestones
                            .filter(m => m.id < channelData.currentMilestoneId)
                            .length;

                        let milestonesCount = currentMilestoneGroup.milestones.length;

                        let completedPercentage = completedMilestoneCount / milestonesCount;

                        let currentMilestonePercentage = getPercentageToNextMilestone();

                        let scaledPercentage = completedPercentage + (1 / milestonesCount * currentMilestonePercentage);

                        return scaledPercentage;
                    }
                }

                return percentCompleted;
            }

            service.getCurrentMilestoneGroup = () => {
                if (service.dataLoaded) {
                    return service.patronageData.period.milestoneGroups
                        .find(mg => mg.id === service.patronageData.channel.currentMilestoneGroupId);
                }
                return { milestones: []};
            };

            service.recalucatePercentages = () => {
                service.percentageToNextMilestone = Math.floor(getPercentageToNextMilestone() * 100);
                service.percentageOfCurrentMilestoneGroup = Math.floor(getPercentageOfCurrentMilestoneGroup() * 100);
            };

            function setData(patronageData) {
                if (patronageData == null) return;
                service.patronageData = patronageData;
                if (service.patronageData.channel && service.patronageData.period) {
                    service.dataLoaded = true;
                    service.recalucatePercentages();
                }
            }

            service.updateData = () => {
                let data = listenerService.fireEventSync("getPatronageData");
                setData(data);
            };

            listenerService.registerListener(
                { type: listenerService.ListenerType.CHANNEL_PATRONAGE_UPDATE},
                (data) => {
                    service.patronageData.channel = data;
                    if (!service.dataLoaded) {
                        let data = listenerService.fireEventSync("getPatronageData");
                        service.patronageData.period = data.period;
                        service.dataLoaded = true;
                    }
                    service.recalucatePercentages();
                    $rootScope.$broadcast("patronageUpdated");
                });


            service.updateData();

            return service;
        });
}(window.angular));
