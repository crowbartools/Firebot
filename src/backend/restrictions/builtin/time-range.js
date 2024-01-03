"use strict";

const moment = require("moment");

const model = {
    definition: {
        id: "firebot:timeRange",
        name: "Time / Day",
        description: "Restrict usage to a specific local time or day.",
        triggers: []
    },
    optionsTemplate: `
        <div>
            <div class="modal-subheader" style="padding: 0 0 4px 0">
                Mode
            </div>
            <div style="margin-bottom: 10px">
                <label class="control-fb control--radio">Time <span class="muted"><br />Restrict access to a specific time range</span>
                    <input type="radio" ng-model="restriction.mode" value="time"/>
                    <div class="control__indicator"></div>
                </label>
                <label class="control-fb control--radio" >Days <span class="muted"><br />Restrict access to specific days</span>
                    <input type="radio" ng-model="restriction.mode" value="days"/>
                    <div class="control__indicator"></div>
                </label>
            </div>

            <div ng-if="restriction.mode === 'time'">
                <div id="startTime" class="modal-subheader" style="padding: 0 0 4px 0">
                    Start Time
                </div>
                <div uib-timepicker ng-model="restriction.startTime" show-spinners="false"></div>

                <div id="endTime" class="modal-subheader" style="padding: 1em 0 4px 0">
                    End Time
                </div>
                <div uib-timepicker ng-model="restriction.endTime" show-spinners="false"></div>
            </div>
            
            <div ng-if="restriction.mode === 'days'">
                <div id="roles" class="modal-subheader" style="padding: 0 0 4px 0">
                    Days
                </div>
                <div class="viewer-group-list">
                    <label ng-repeat="day in getAllDays()" class="control-fb control--checkbox">{{day}}
                        <input type="checkbox" ng-click="toggleDay(day)" ng-checked="isDayChecked(day)"  aria-label="..." >
                        <div class="control__indicator"></div>
                    </label>
                </div>
            </div>
        </div>
    `,
    optionsController: ($scope, viewerRolesService) => {
        if (!$scope.restriction.mode) {
            $scope.restriction.mode = "time";
        }

        if (!$scope.restriction.days) {
            $scope.restriction.days = [];
        }

        $scope.allDays = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday'
        ];

        $scope.getAllDays = function () {
            return $scope.allDays;
        };

        $scope.isDayChecked = function(day) {
            return $scope.restriction.days.includes(day);
        };

        $scope.toggleDay = function(day) {
            if ($scope.isDayChecked(day)) {
                $scope.restriction.days = $scope.restriction.days.filter(id => id !== day);
            } else {
                $scope.restriction.days.push(day);
            }
        };
    },
    optionsValueDisplay: (restriction) => {
        function formatAMPM(date) {
            date = new Date(date);
            let hours = date.getHours();
            let minutes = date.getMinutes();
            const ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            minutes = minutes < 10 ? `0${minutes}` : minutes;

            if (isNaN(hours)) {
                hours = 12;
            }

            if (isNaN(minutes)) {
                minutes = "00";
            }

            return `${hours}:${minutes} ${ampm}`;
        }

        function daySorter(a, b) {
            const dayOrder = [
                'Sunday',
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday'
            ];
            return dayOrder.indexOf(a) - dayOrder.indexOf(b);
        }

        if (restriction.mode === "days") {
            const days = restriction.days;
            let output = "None selected";
            if (days.length > 0) {
                const sortedDays = days.sort(daySorter);
                output = sortedDays.join(", ");
            }
            return `Days (${output})`;
        } else if (restriction.mode === "time") {
            const startTime = formatAMPM(restriction.startTime);
            const endTime = formatAMPM(restriction.endTime);

            return `Between ${startTime} - ${endTime}`;
        }

        return "";

    },
    /*
      function that resolves/rejects a promise based on if the restriction criteria is met
    */
    predicate: async (trigger, restrictionData) => {
        return new Promise(async (resolve, reject) => {

            if (restrictionData.mode === "days") {
                const currentDayOfWeek = new Date().toLocaleString('en-us', { weekday: 'long' });
                const restrictionDays = restrictionData.days;
                if (restrictionDays.includes(currentDayOfWeek)) {
                    resolve();
                } else {
                    reject(`Day must be ${restrictionDays.join(", ")}.`);
                }

            } else if (restrictionData.mode === "time") {
                const time = moment(),
                    startTime = moment(restrictionData.startTime);
                let endTime = moment(restrictionData.endTime);

                if (endTime.isSameOrBefore(startTime)) {
                    endTime = endTime.add(1, 'days');
                }

                if (time.isBetween(startTime, endTime)) {
                    resolve();
                } else {
                    reject(`Time must be between ${moment(restrictionData.startTime).format('hh:mm A')} and ${moment(restrictionData.endTime).format('hh:mm A')}.`);
                }
            }
        });
    }
};

module.exports = model;