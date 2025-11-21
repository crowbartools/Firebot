"use strict";
(function() {
    angular.module("firebotApp").component("fbParamButton", {
        bindings: {
            schema: '<',
            value: '<',
            onInput: '&',
            onTouched: '&'
        },
        template: `
          <div>
            <firebot-button
                text="{{$ctrl.schema.buttonText}}"
                type="{{$ctrl.schema.buttonType}}"
                size="{{$ctrl.schema.size}}"
                icon="{{$ctrl.schema.icon}}"
                tooltip="{{$ctrl.schema.tooltip}}"
                tooltip-placement="{{$ctrl.schema.tooltipPlacement}}"
                ng-click="$ctrl.onButtonClicked()"
                loading="$ctrl.buttonLoading"
            ></firebot-button>
          </div>
        `,
        controller: function(backendCommunicator) {
            const $ctrl = this;

            $ctrl.buttonLoading = false;

            $ctrl.onButtonClicked = () => {
                if (!$ctrl.schema.backendEventName) {
                    return;
                }
                if ($ctrl.schema.sync) {
                    backendCommunicator.fireEvent($ctrl.schema.backendEventName);
                } else {
                    $ctrl.buttonLoading = true;
                    backendCommunicator.fireEventAsync($ctrl.schema.backendEventName)
                        .then(() => {
                            $ctrl.buttonLoading = false;
                        });
                }
            };
        }
    });
}());