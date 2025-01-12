"use strict";

(function () {
    angular
        .module('firebotApp')
        .component("firebotRadios", {
            bindings: {
                options: "=",
                model: "=",
                inline: "<?",
                style: "@?"
            },
            template: `
            <firebot-radio-container inline="$ctrl.inline" style="{{$ctrl.style}}">
                <firebot-radio
                    ng-repeat="(value, label) in $ctrl.options"
                    ng-hide="{{$ctrl.labelIsObj(label) ? label.hide : false}}"
                    label="{{$ctrl.labelIsObj(label) ? label.text : label}}"
                    description="{{$ctrl.labelIsObj(label) ? label.description : undefined}}"
                    tooltip="{{$ctrl.labelIsObj(label) ? label.tooltip : undefined}}"
                    value="value"
                    model="$ctrl.model"
                />
            </firebot-radio-container>
            `,
            controller: function () {
                const $ctrl = this;

                $ctrl.labelIsObj = label => typeof label === "object";
            }
        });
}());