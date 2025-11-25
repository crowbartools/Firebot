"use strict";

import type { BackendCommunicator, StreamScheduleService } from "../../../types";
import type { StreamSchedule } from "../../../types/stream-schedule";

(function() {
    // @ts-ignore
    angular
        .module("firebotApp")
        .factory("streamScheduleService", function(backendCommunicator: BackendCommunicator) {
            const service = {} as StreamScheduleService;

            service.streamSchedule = {} as StreamSchedule;

            service.loadStreamSchedule = () => {
                backendCommunicator.fireEventAsync<StreamSchedule>("get-stream-schedule").then((streamSchedule) => {
                    service.streamSchedule = streamSchedule;
                }).catch((err) => {
                    console.error("Error getting stream schedule:", err);
                });
            };

            service.getStreamSchedule = () => {
                return service.streamSchedule;
            }

            return service;
        });
}());
