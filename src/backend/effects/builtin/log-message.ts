import { EffectType } from "../../../types/effects";
import { EffectCategory } from "../../../shared/effect-constants";
import logger from "../../logwrapper";

const model: EffectType<{
    logLevel: "Info" | "Warning" | "Error" | "Debug";
    logMessage: string;
}> = {
    definition: {
        id: "firebot:log-message",
        name: "Log Message",
        description: "Adds an entry to the Firebot log. This is useful for debugging.",
        icon: "fad fa-file-alt",
        categories: [EffectCategory.ADVANCED, EffectCategory.SCRIPTING],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container header="Message Text">
            <p class="muted">Enter the message you would like to write to the Firebot log file.</p>
            <textarea ng-model="effect.logMessage" id="log-message-text" class="form-control" placeholder="Enter log message text" menu-position="under" replace-variables></textarea>
        </eos-container>

        <eos-container header="Log Level" pad-top="true">
            <p class="muted">Choose the log level you would like the message written as. Note that <strong>Debug</strong> level messages will ONLY be written when Debug Mode is enabled.</p>
            <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <span class="log-message-type-effect-log-level">{{effect.logLevel ? effect.logLevel : "Pick one"}}</span> <span class="caret"></span>
            </button>
            <ul class="dropdown-menu">
                <li ng-repeat="logLevel in logLevelTypes"
                    ng-click="effect.logLevel = logLevel">
                    <a href>{{logLevel}}</a>
                </li>
            </ul>
        </eos-container>
    `,
    optionsController: ($scope) => {
        $scope.logLevelTypes = ["Info", "Warning", "Error", "Debug"];
        $scope.effect.logLevel = $scope.effect.logLevel ?? "Info";
    },
    optionsValidator: (effect) => {
        const errors = [];
        if (!(effect.logMessage?.length > 0)) {
            errors.push("Please input a log message.");
        }
        if (effect.logLevel == null) {
            errors.push("Please select a log level.");
        }
        return errors;
    },
    onTriggerEvent: async ({ effect }) => {
        switch (effect.logLevel) {
            case "Error":
                logger.error(effect.logMessage);
                break;

            case "Warning":
                logger.warn(effect.logMessage);
                break;

            case "Debug":
                logger.debug(effect.logMessage);
                break;

            // Use Info as default
            default:
                logger.info(effect.logMessage);
                break;
        }
    }
};

module.exports = model;