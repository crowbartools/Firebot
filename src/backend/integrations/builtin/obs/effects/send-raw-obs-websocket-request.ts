import { EffectType } from "../../../../../types/effects";
import { sendRawObsRequest } from "../obs-remote";

export const SendRawOBSWebSocketRequestEffectType: EffectType<{
    functionName: string,
    payload: string
}> = {
    definition: {
        id: "firebot:send-raw-obs-websocket-request",
        name: "Send Raw OBS WebSocket Request",
        description: "Send a raw WebSocket request to OBS",
        icon: "fad fa-plug",
        categories: ["advanced"],
        outputs: [
            {
                label: "API Response",
                description: "The raw response from the OBS WebSocket API",
                defaultName: "apiResponse"
            }
        ]
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
    optionsValidator: (effect) => {
        if (effect.functionName == null || effect.functionName.length === 0) {
            return ["You must enter a function name."];
        }
        return [];
    },
    getDefaultLabel: (effect) => {
        return `${effect.functionName}`;
    },
    onTriggerEvent: async ({ effect }) => {
        const response = await sendRawObsRequest(effect.functionName, effect.payload);

        return {
            success: response.success,
            outputs: {
                apiResponse: response.response
            }
        };
    }
};
