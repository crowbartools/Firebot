"use strict";

const eventAccess = require("../../events/events-access");
const { EffectCategory } = require('../../../shared/effect-constants');

const chat = {
    definition: {
        id: "firebot:toggle-event-set",
        name: "Toggle Event Set",
        description: "Toggle an event sets active status",
        icon: "fad fa-toggle-off",
        categories: [EffectCategory.COMMON],
        dependencies: []
    },
    globalSettings: {},
    optionsTemplate: `
        <eos-container>
            <p>This effect let's you automatically toggle the active status of Event Sets (which you can create in the Events tab).</p>
        </eos-container>

        <eos-container ng-hide="hasEventSets" pad-top="true">
            <span class="muted">No Event Sets created yet! You can create them in the <b>Events</b> tab.</span>
        </eos-container>

        <eos-container ng-show="hasEventSets" header="Event Set" pad-top="true">
            <dropdown-select options="eventSetOptions" selected="effect.selectedEventGroupId"></dropdown-select>
        </eos-container>

        <eos-container ng-show="hasEventSets" header="Toggle Action" pad-top="true">
            <dropdown-select options="toggleOptions" selected="effect.toggleType"></dropdown-select>
        </eos-container>
    `,
    optionsController: ($scope, eventsService) => {

        const eventGroups = eventsService.getEventGroups();

        $scope.eventSetOptions = {};

        for (const eventGroup of eventGroups) {
            $scope.eventSetOptions[eventGroup.id] = eventGroup.name;
        }

        $scope.hasEventSets = eventGroups != null && eventGroups.length > 0;

        if ($scope.eventSetOptions[$scope.effect.selectedEventGroupId] == null) {
            $scope.effect.selectedEventGroupId = undefined;
        }

        $scope.toggleOptions = {
            disable: "Deactivate",
            enable: "Activate"
        };

        if ($scope.effect.toggleType == null) {
            $scope.effect.toggleType = "disable";
        }
    },
    optionsValidator: effect => {
        const errors = [];
        if (effect.selectedEventGroupId == null) {
            errors.push("Please select an event set.");
        }
        return errors;
    },
    getDefaultLabel: (effect, eventsService) => {
        const eventGroup = eventsService.getEventGroup(effect.selectedEventGroupId);
        const action = effect.toggleType === "enable" ? "Activate" : "Deactivate";
        return `${action} ${eventGroup?.name ?? "Unknown Event Set"}`;
    },
    onTriggerEvent: async event => {
        const { effect } = event;

        eventAccess.updateEventGroupActiveStatus(effect.selectedEventGroupId, effect.toggleType === "enable");

        return true;
    }
};

module.exports = chat;
