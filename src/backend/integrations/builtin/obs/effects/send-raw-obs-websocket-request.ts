import { Firebot } from "@crowbartools/firebot-custom-scripts-types";
import { sendRawObsRequest } from "../obs-remote";

export const SendRawOBSWebSocketRequestEffectType: Firebot.EffectType<{
    functionName: string,
    payload: string
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
  },
  optionsValidator: () => {
    return [];
  },
  onTriggerEvent: async ({ effect }) => {
    sendRawObsRequest(effect.functionName, effect.payload);
    return true;
  },
};
