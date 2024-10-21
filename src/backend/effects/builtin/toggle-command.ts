import commandManager from "../../chat/commands/command-manager";
import {EffectCategory} from "../../../shared/effect-constants";
import {EffectType} from "../../../types/effects";

const effect: EffectType<{
    commandId: string;
    toggleType: "disable" | "enable" | "toggle";
    commandType: "system" | "custom" | "tag";
    sortTagId?: string;
}> = {
    definition: {
        id: "firebot:toggle-command",
        name: "Toggle Command",
        description: "Toggle a command's active status",
        icon: "fad fa-toggle-off",
        categories: [EffectCategory.COMMON],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container>
            <p>This effect lets you automatically toggle the active status of Commands.</p>
        </eos-container>

        <eos-container header="Command Type" pad-top="true">
            <dropdown-select options="commandOptions" selected="effect.commandType"></dropdown-select>
        </eos-container>

        <eos-container ng-show="effect.commandType === 'system'" header="System Commands" pad-top="true">
            <ui-select ng-model="effect.commandId" theme="bootstrap">
                <ui-select-match placeholder="Select or search for a command... ">{{$select.selected.trigger}}</ui-select-match>
                <ui-select-choices repeat="command.id as command in systemCommands | filter: { trigger: $select.search }" style="position:relative;">
                    <div ng-bind-html="command.trigger | highlight: $select.search"></div>
                </ui-select-choices>
            </ui-select>
        </eos-container>

        <eos-container ng-show="effect.commandType === 'custom'" header="Custom Commands" pad-top="true">
            <ui-select ng-model="effect.commandId" theme="bootstrap">
                <ui-select-match placeholder="Select or search for a command... ">{{$select.selected.trigger}}</ui-select-match>
                <ui-select-choices repeat="command.id as command in customCommands | filter: { trigger: $select.search }" style="position:relative;">
                    <div ng-bind-html="command.trigger | highlight: $select.search"></div>
                </ui-select-choices>
            </ui-select>
        </eos-container>

        <eos-container ng-show="effect.commandType === 'tag'" header="Custom Command Tags" pad-top="true">
            <ui-select ng-model="effect.sortTagId" theme="bootstrap">
                <ui-select-match placeholder="Select or search for a tag... ">{{$select.selected.name}}</ui-select-match>
                <ui-select-choices repeat="sortTag.id as sortTag in sortTags | filter: { name: $select.search }" style="position:relative;">
                    <div ng-bind-html="sortTag.name | highlight: $select.search"></div>
                </ui-select-choices>
            </ui-select>
        </eos-container>

        <eos-container header="Toggle Action" pad-top="true">
            <dropdown-select options="toggleOptions" selected="effect.toggleType"></dropdown-select>
        </eos-container>
    `,
    optionsController: ($scope, commandsService, sortTagsService) => {
        $scope.systemCommands = commandsService.getSystemCommands();
        $scope.customCommands = commandsService.getCustomCommands();
        $scope.sortTags = sortTagsService.getSortTags('commands');
        $scope.hasTags = $scope.sortTags != null && $scope.sortTags.length > 0;

        $scope.commandOptions = {
            system: 'System',
            custom: 'Custom',
            tag: 'Custom (by tag)'
        };

        if (!$scope.hasTags) {
            delete $scope.commandOptions.tag;
        }

        $scope.toggleOptions = {
            disable: "Deactivate",
            enable: "Activate",
            toggle: "Toggle"
        };

        if ($scope.effect.toggleType == null) {
            $scope.effect.toggleType = "disable";
        }
    },
    optionsValidator: (effect) => {
        const errors = [];
        if (effect.commandType !== "tag" && effect.commandId == null) {
            errors.push("Please select a command.");
        }
        if (effect.commandType === "tag" && effect.sortTagId == null) {
            errors.push("Please select a command tag.");
        }
        return errors;
    },
    onTriggerEvent: async (event) => {
        const { commandId, commandType, toggleType, sortTagId } = event.effect;

        if (commandType === "system") {
            const systemCommand = commandManager
                .getAllSystemCommandDefinitions().find(c => c.id === commandId);

            if (systemCommand == null) {
                // command doesnt exist anymore
                return true;
            }

            systemCommand.active = toggleType === "toggle" ? !systemCommand.active : toggleType === "enable";

            commandManager.saveSystemCommandOverride(systemCommand);
        } else if (commandType === "custom") {
            const customCommand = commandManager.getCustomCommandById(commandId);

            if (customCommand == null) {
                // command doesn't exist anymore
                return true;
            }

            customCommand.active = toggleType === "toggle" ? !customCommand.active : toggleType === "enable";

            commandManager.saveCustomCommand(customCommand, "System");
        } else if (commandType === "tag") {
            let commands = commandManager.getAllCustomCommands();
            commands = commands.filter(c => c.sortTags?.includes(sortTagId));

            commands.forEach((customCommand) => {
                customCommand.active = toggleType === "toggle" ? !customCommand.active : toggleType === "enable";

                commandManager.saveCustomCommand(customCommand, "System");
            });
        }
    }
};

export = effect;