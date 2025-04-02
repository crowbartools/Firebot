"use strict";
(function() {
    const { marked } = require("marked");
    const { sanitize } = require("dompurify");

    const component = {
        bindings: {
            metadata: "=",
            name: "<?",
            onUpdate: "&",
            trigger: "@?",
            triggerMeta: "<?",
            modalId: "@?"
        },
        template: `
       <div ng-switch="$ctrl.metadata.type" style="padding-bottom: 20px;font-size: 15px;font-weight: 600;">

          <div
            ng-if="$ctrl.metadata.type != 'boolean' && $ctrl.title"
            style="margin-bottom: 5px;"
            class="markdown-container"
            ng-bind-html="$ctrl.title"
          ></div>
          <div
            ng-if="$ctrl.metadata.type != 'boolean' && $ctrl.description"
            style="padding-bottom: 5px;font-size: 14px;font-weight: 100;opacity:0.8;"
            class="markdown-container"
            ng-bind-html="$ctrl.description"
          ></div>

          <div ng-switch-when="string">
            <textarea ng-if="$ctrl.metadata.useTextArea" ng-model="$ctrl.metadata.value" class="form-control" placeholder="Enter text" rows="5" style="width:100%"></textarea>
            <input ng-if="!$ctrl.metadata.useTextArea" class="form-control" type="text" placeholder="Enter text" ng-model="$ctrl.metadata.value">
          </div>

          <div ng-switch-when="password">
            <input class="form-control" type="password" placeholder="Enter password" ng-model="$ctrl.metadata.value">
          </div>

          <div ng-switch-when="number">
            <input class="form-control" type="number" placeholder="{{$ctrl.metadata.placeholder ? $ctrl.metadata.placeholder : 'Enter a number'}}" ng-model="$ctrl.metadata.value">
          </div>

          <div ng-switch-when="boolean" style="padding-top:10px;">
            <label class="control-fb control--checkbox" style="font-weight: 600;">
              <span ng-if="$ctrl.title" ng-bind-html="$ctrl.title" class="markdown-container"></span>
              <span ng-if="!$ctrl.title">{{$ctrl.name}}</span>
              <tooltip ng-if="$ctrl.metadata.description" text="$ctrl.metadata.description"></tooltip>
              <input type="checkbox" ng-click="$ctrl.metadata.value = !$ctrl.metadata.value" ng-checked="$ctrl.metadata.value" aria-label="...">
              <div class="control__indicator"></div>
            </label>
          </div>

          <div ng-switch-when="enum" style="padding-top:5px;">
            <firebot-select
                ng-if="!ctrl.metadata.settings || !ctrl.metadata.settings.searchable"
                options="$ctrl.metadata.options"
                selected="$ctrl.metadata.value"
            ></firebot-select>
            <firebot-searchable-select
                ng-if="ctrl.metadata.settings && ctrl.metadata.settings.searchable"
                items="$ctrl.metadata.options"
                ng-model="$ctrl.metadata.value"
                placeholder="{{$ctrl.metadata.placeholder ? $ctrl.metadata.placeholder : 'Select value'}}"
            >
            </firebot-searchable-select>
          </div>

          <div ng-switch-when="filepath">
            <file-chooser model="$ctrl.metadata.value" options="$ctrl.metadata.fileOptions"></file-chooser>
          </div>

          <div ng-switch-when="role-percentages">
            <role-percentages model="$ctrl.metadata.value"></role-percentages>
          </div>

          <div ng-switch-when="role-numbers">
            <role-numbers model="$ctrl.metadata.value" settings="$ctrl.metadata.settings"></role-numbers>
          </div>

          <div ng-switch-when="currency-select" style="padding-top:5px;">
            <currency-select model="$ctrl.metadata.value"></currency-select>
          </div>

          <div ng-switch-when="chatter-select" style="padding-top:5px;">
            <chatter-select model="$ctrl.metadata.value"></chatter-select>
          </div>

          <div ng-switch-when="editable-list" style="padding-top:5px;">
            <editable-list model="$ctrl.metadata.value" settings="$ctrl.metadata.settings"></editable-list>
          </div>

          <div ng-switch-when="multiselect" style="padding-top:5px;">
            <multiselect-list model="$ctrl.metadata.value" settings="$ctrl.metadata.settings"></multiselect-list>
          </div>

          <div ng-switch-when="discord-channel-webhooks" style="padding-top:5px;">
            <discord-channel-webhooks model="$ctrl.metadata.value"></discord-channel-webhooks>
          </div>

          <div ng-switch-when="gift-receivers-list" class="pt-5">
            <gift-receivers-list model="$ctrl.metadata.value"></gift-receivers-list>
          </div>

          <div ng-switch-when="poll-choice-list" class="pt-5">
            <poll-choice-list model="$ctrl.metadata.value" options="$ctrl.metadata.options"></poll-choice-list>
          </div>

          <div ng-switch-when="effectlist">
            <effect-list
                effects="$ctrl.metadata.value"
                trigger="{{$ctrl.trigger ? $ctrl.trigger : 'unknown'}}"
                trigger-meta="$ctrl.triggerMeta"
                update="$ctrl.effectListUpdated(effects)"
                modalId="{{$ctrl.modalId}}"
                is-array="true"
            ></effect-list>
          </div>

          <div ng-switch-when="button">
            <firebot-button
                text="{{$ctrl.metadata.buttonText}}"
                type="{{$ctrl.metadata.buttonType}}"
                size="{{$ctrl.metadata.size}}"
                icon="{{$ctrl.metadata.icon}}"
                tooltip="{{$ctrl.metadata.tooltip}}"
                tooltip-placement="{{$ctrl.metadata.tooltipPlacement}}"
                ng-click="$ctrl.onButtonClicked()"
                loading="$ctrl.buttonLoading"
            ></firebot-button>
          </div>

          <div
            ng-if="$ctrl.tip != null && $ctrl.tip !== ''"
            class="muted markdown-container"
            style="font-size:12px; padding-top: 3px;"
            ng-bind-html="$ctrl.tip"
          ></div>
       </div>

       <hr ng-if="$ctrl.metadata.showBottomHr" style="margin-top:10px; margin-bottom:15px;" />
       `,
        controller: function($scope, $sce, backendCommunicator) {
            const ctrl = this;

            $scope.$watchCollection("$ctrl.metadata", (changes) => {
                if (changes.key === 'isAnonymous') {
                    ctrl.onUpdate({ value: changes.value });
                }
            });

            ctrl.buttonLoading = false;

            ctrl.onButtonClicked = () => {
                if (!ctrl.metadata.backendEventName) {
                    return;
                }
                ctrl.buttonLoading = true;
                backendCommunicator.fireEventAsync(ctrl.metadata.backendEventName)
                    .then(() => {
                        ctrl.buttonLoading = false;
                    });
            };

            const parseMarkdown = (text) => {
                if (!text) {
                    return text;
                }
                return $sce.trustAsHtml(
                    sanitize(marked(text))
                );
            };

            const init = () => {
                if (ctrl.metadata.value === undefined || ctrl.metadata.value === null) {
                    ctrl.metadata.value = ctrl.metadata.default;

                    // If it is an enum and no default is supplied, select the first one
                    if (ctrl.metadata.type === "enum") {
                        if (ctrl.metadata.default == null) {
                            ctrl.metadata.value = ctrl.metadata.options[0];
                        }
                    }

                    // If it is a boolean and no default is supplied, set to false
                    if (ctrl.metadata.type === "boolean") {
                        if (ctrl.metadata.default == null) {
                            ctrl.metadata.value = false;
                        }
                    }
                }

                if (ctrl.metadata.title) {
                    ctrl.title = parseMarkdown(ctrl.metadata.title);
                    ctrl.description = parseMarkdown(ctrl.metadata.description);
                } else if (!ctrl.metadata.title && ctrl.metadata.description) {
                    // backwards compatibility for scriptParameterOption
                    ctrl.title = parseMarkdown(ctrl.metadata.description);
                    ctrl.description = parseMarkdown(ctrl.metadata.secondaryDescription);
                }

                if (ctrl.metadata.tip) {
                    ctrl.tip = parseMarkdown(ctrl.metadata.tip);
                }
            };

            ctrl.$onInit = init;
            ctrl.$onChanges = init;

            ctrl.effectListUpdated = function(effects) {
                ctrl.metadata.value = effects;
            };
        }
    };
    angular.module("firebotApp").component("commandOption", component);
    angular.module("firebotApp").component("dynamicParameter", component);
}());
