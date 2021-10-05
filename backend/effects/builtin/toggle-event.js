"use strict";

const eventAccess = require("../../events/events-access");
const { EffectCategory } = require('../../../shared/effect-constants');

const chat = {
    definition: {
        id: "firebot:toggle-event",
        name: "Toggle Event",
        description: "Toggle an event's active status",
        icon: "fad fa-toggle-off",
        categories: [EffectCategory.COMMON],
        dependencies: []
    },
    globalSettings: {},
    optionsTemplate: `
        <eos-container>
            <p>This effect let's you automatically toggle the active status of an Event (which you can create in the Events tab).</p>
        </eos-container>

        <eos-container header="Event Group" pad-top="true">
            <dropdown-select options="eventGroupNames" selected="effect.selectedGroupName"></dropdown-select>
        </eos-container>

        <eos-container header="Event" pad-top="true" ng-show="effect.selectedGroupName">
            <dropdown-select options="eventOptions[effect.selectedGroupName]" selected="effect.selectedEventId"></dropdown-select>
        </eos-container>

        <eos-container header="Toggle Action" pad-top="true">
            <dropdown-select options="toggleOptions" selected="effect.toggleType"></dropdown-select>
        </eos-container>
    `,
    optionsController: ($scope, eventsService) => {

        const mainEvents = eventsService.getMainEvents();
        const groups = eventsService.getAllEventGroups();

        $scope.eventOptions = {
            "General Events": {}
        };

        for (const mainEvent of mainEvents) {
            $scope.eventOptions["General Events"][mainEvent.id] = mainEvent.name;
        }

        for (const [groupId, group] of Object.entries(groups)) {
            $scope.eventOptions[group.name] = {};

            for (const groupEvent of groups[groupId].events) {
                $scope.eventOptions[group.name][groupEvent.id] = groupEvent.name;
            }
        }

        $scope.eventGroupNames = Object.keys($scope.eventOptions);

        $scope.toggleOptions = {
            disable: "Deactivate",
            enable: "Activate",
            toggle: "Toggle"
        };

        if ($scope.effect.toggleType == null) {
            $scope.effect.toggleType = "disable";
        }
    },
    optionsValidator: effect => {
        let errors = [];
        if (effect.selectedEventId == null) {
            errors.push("Please select an event.");
        }
        return errors;
    },
    onTriggerEvent: async event => {
        const { effect } = event;
        const selectedEvent = eventAccess.getEvent(effect.selectedEventId);
        const isActive = effect.toggleType === "toggle" ? !selectedEvent.active : effect.toggleType === "enable";

        eventAccess.updateEventActiveStatus(effect.selectedEventId, isActive);

        return true;
    }
};

module.exports = chat;
