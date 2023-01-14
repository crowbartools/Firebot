import { Firebot } from "@crowbartools/firebot-custom-scripts-types";
import { sendRawObsRequest } from "../obs-remote";
import customVariableManager from "../../../../common/custom-variable-manager";

export const SendRawOBSWebSocketRequestEffectType: Firebot.EffectType<{
    functionName: string,
    payload: string,
    options: {
        putResponseInVariable: boolean,
        variableName?: string,
        variableTtl?: number,
        variablePropertyPath?: string
    }
}> = {
  definition: {
    id: "firebot:send-raw-obs-websocket-request",
    name: "Send Raw OBS WebSocket Request",
    description: "Send a raw WebSocket request to OBS",
    icon: "fad fa-plug",
    categories: ["advanced"],
  },
  optionsTemplate: `
    <eos-container header="Function Name">
        <firebot-input model="effect.functionName" placeholder-text="Enter OBS WebSocket function name" menu-position="below" disable-variables="true"></firebot-input>
    </eos-container>

    <eos-container header="Request Payload" pad-top="true">
        <div
            ui-codemirror="{onLoad : codemirrorLoaded}"
            ui-codemirror-opts="editorSettings"
            ng-model="effect.payload"
            replace-variables
            menu-position="under">
        </div>
    </eos-container>

    <eos-container header="Options" pad-top="true">
        <label class="control-fb control--checkbox"> Put response body in a variable <tooltip text="'Put the response body into a variable so you can use it later'"></tooltip>
            <input type="checkbox" ng-model="effect.options.putResponseInVariable">
            <div class="control__indicator"></div>
        </label>
        <div ng-if="effect.options.putResponseInVariable" style="padding-left: 15px;">
            <firebot-input input-title="Variable Name" model="effect.options.variableName" placeholder-text="Enter name" />
            <firebot-input style="margin-top: 10px;" input-title="Variable TTL" model="effect.options.variableTtl" input-type="number" disable-variables="true" placeholder-text="Enter secs | Optional" />
            <firebot-input style="margin-top: 10px;" input-title="Variable Property Path" model="effect.options.variablePropertyPath" input-type="text" disable-variables="true" placeholder-text="Optional" />
        </div>
    </eos-container>

    <eos-container pad-top="true">
      <div class="effect-info alert alert-warning">
        <b>Warning!</b> This may cause undesired effects in OBS. Please use caution when using this effect.
      </div>
    </eos-container>
  `,
  optionsController: ($scope) => {
    $scope.editorSettings = {
        mode: {name: "javascript", json: true},
        theme: 'blackboard',
        lineNumbers: true,
        autoRefresh: true,
        showGutter: true
    };

    $scope.codemirrorLoaded = function(_editor) {
        // Editor part
        _editor.refresh();
        const cmResize = require("cm-resize");
        cmResize(_editor, {
            minHeight: 200,
            resizableWidth: false,
            resizableHeight: true
        });
    };

    if ($scope.effect.options == null) {
        $scope.effect.options = {
            putResponseInVariable: false
        };
    }
  },
  optionsValidator: (effect) => {
    if (effect.functionName == null || effect.functionName.length == 0) {
        return [ "You must enter a function name." ]
    }
    return [];
  },
  onTriggerEvent: async ({ effect }) => {
    const response = await sendRawObsRequest(effect.functionName, effect.payload);

    if (response && effect.options.putResponseInVariable === true) {
        customVariableManager.addCustomVariable(
            effect.options.variableName,
            response,
            effect.options.variableTtl || 0,
            effect.options.variablePropertyPath || null
        );
    }

    return true;
  },
};
