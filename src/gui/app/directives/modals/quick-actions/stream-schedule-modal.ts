"use strict";

import { StreamScheduleService, DateTimeHelper } from "../../../../../types";
import { StreamSchedule } from "../../../../../types/stream-schedule";

(function() {
    // @ts-ignore
    angular.module("firebotApp")
        .component("streamScheduleModal", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">Edit Stream Schedule</h4>
                </div>
                <div class="modal-body">
                    <div class="effect-list">
                        <div class="p-6 flex flex-col justify-between">
                            <h4 class="mb-4">{{$ctrl.monday}} - {{$ctrl.sunday}}</h4>
                            <div ng-repeat="day in ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']" class="mt-4">
                                <h5 class="uppercase">{{day}}</h5>
                                <div
                                    class="effect-item"
                                    ng-if="day === 'Monday'"
                                >
                                    <div class="pr-4 flex flex-col justify-center" style="text-overflow: ellipsis;overflow: hidden;flex-grow: 1;">
                                        <div class="flex items-center">
                                            <div class="effect-name truncate">
                                                {{"schedule segment"}}
                                            </div>
                                        </div>
                                    </div>
                                    <span class="flex-row-center" style="flex-shrink: 0;">
                                        <button
                                            class="effect-edit-btn"
                                            ng-click=""
                                            aria-label="Edit Segment"
                                            uib-tooltip="Edit Segment"
                                            tooltip-append-to-body="true"
                                        >
                                            <i class="fas fa-pen"></i>
                                        </button>
                                        <div
                                            class="flex items-center justify-center"
                                            style="font-size: 20px;height: 38px;width: 35px;text-align: center;"
                                        >
                                            <a
                                                href
                                                class="effects-actions-btn"
                                                aria-label="Open segment menu"
                                                uib-tooltip="Open segment menu"
                                                tooltip-append-to-body="true"
                                                role="button"
                                                context-menu=""
                                                context-menu-on="click"
                                                context-menu-orientation="top"
                                            >
                                                <i class="fal fa-ellipsis-v"></i>
                                            </a>
                                        </div>
                                    </span>
                                </div>


                                <div class="effect-list-add-btn-wrapper">
                                    <button
                                        type="button"
                                        class="effect-list-add-btn"
                                        ng-click=""
                                        aria-label="Add new segment"
                                    >
                                        <span class="effect-list-add-btn__icon-wrapper">
                                            <i class="far fa-plus"></i>
                                        </span>
                                        <span class="effect-list-add-btn__label">
                                            Add Segment
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer sticky-footer">
                    <button type="button" class="btn btn-default" ng-click="$ctrl.dismiss()">Cancel</button>
                    <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(streamScheduleService: StreamScheduleService, dateTimeHelper: DateTimeHelper) {
                const $ctrl = this;

                $ctrl.streamSchedule = {} as StreamSchedule;

                $ctrl.$onInit = async () => {
                    $ctrl.streamSchedule = await streamScheduleService.getStreamSchedule();
                    
                    $ctrl.monday = dateTimeHelper.formatDate(dateTimeHelper.getFirstWeekDayDate(), "LLLL d, y");
                    $ctrl.sunday = dateTimeHelper.formatDate(dateTimeHelper.getLastWeekDayDate(), "LLLL d, y");
                };
            }
        });
}());
