"use strict";

const { EffectCategory } = require("../../../shared/effect-constants");

const effect = {
    definition: {
        id: "firebot:http-request",
        name: "HTTP Request",
        description: "Send an HTTP request to a given url",
        icon: "fad fa-terminal",
        categories: [EffectCategory.ADVANCED, EffectCategory.SCRIPTING],
        dependencies: [],
        outputs: [
            {
                label: "Response Body",
                description: "The raw response from the request",
                defaultName: "httpResponse"
            }
        ]
    },
    globalSettings: {},
    optionsTemplate: `
    <eos-container header="URL">
        <firebot-input model="effect.url" placeholder-text="Enter url" menu-position="below"></firebot-input>
    </eos-container>

    <eos-container header="Method" pad-top="true">
        <dropdown-select options="['GET', 'POST', 'PUT', 'PATCH', 'DELETE']" selected="effect.method"></dropdown-select>
    </eos-container>

    <eos-container header="Body (JSON)" pad-top="true" ng-show="['POST', 'PUT', 'PATCH'].includes(effect.method)">
        <div
            ui-codemirror="{onLoad : codemirrorLoaded}"
            ui-codemirror-opts="editorSettings"
            ng-model="effect.body"
            replace-variables
            menu-position="under">
        </div>
    </eos-container>

    <eos-container header="Headers" pad-top="true">
        <div ui-sortable="sortableOptions" ng-model="effect.headers">
            <div ng-repeat="header in effect.headers track by $index" class="list-item selectable" ng-click="showAddOrEditHeaderModal(header)">
                <span class="dragHandle" style="height: 38px; width: 15px; align-items: center; justify-content: center; display: flex">
                    <i class="fal fa-bars" aria-hidden="true"></i>
                </span>
                <div uib-tooltip="Click to edit"  style="font-weight: 400;width: 100%;margin-left: 20px;" aria-label="{{header.key + ' (Click to edit)'}}"><b>{{header.key}}</b>: {{header.value}}</div>
                <span class="clickable" style="color: #fb7373;" ng-click="removeHeaderAtIndex($index);$event.stopPropagation();" aria-label="Remove header">
                    <i class="fad fa-trash-alt" aria-hidden="true"></i>
                </span>
            </div>
            <p class="muted" ng-show="effect.headers.length < 1">No headers added.</p>
        </div>
        <div style="margin: 5px 0 10px 0px;">
            <button class="filter-bar" ng-click="showAddOrEditHeaderModal()" uib-tooltip="Add header" tooltip-append-to-body="true" aria-label="Add header">
                <i class="far fa-plus"></i>
            </button>
        </div>
    </eos-container>

    <eos-container header="Options" pad-top="true">
        <firebot-checkbox
            label="Include Twitch auth header"
            tooltip="Automatically include an Authorization header with the streamers twitch access token. Only use when calling the Twitch API!"
            model="effect.options.useTwitchAuth"
        />
        <label ng-show="effect.options.putResponseInVariable" class="control-fb control--checkbox"> Put response body in a variable <tooltip text="'Put the response body into a variable so you can use it later'"></tooltip>
            <input type="checkbox" ng-model="effect.options.putResponseInVariable">
            <div class="control__indicator"></div>
        </label>
        <div ng-if="effect.options.putResponseInVariable" style="padding-left: 15px;">
            <firebot-input input-title="Variable Name" model="effect.options.variableName" placeholder-text="Enter name" />
            <firebot-input style="margin-top: 10px;" input-title="Variable TTL" model="effect.options.variableTtl" input-type="number" disable-variables="true" placeholder-text="Enter secs | Optional" />
            <firebot-input style="margin-top: 10px;" input-title="Variable Property Path" model="effect.options.variablePropertyPath" input-type="text" disable-variables="true" placeholder-text="Optional" />
        </div>
        <firebot-checkbox
            ng-init="timeoutRequest = effect.options.timeout != null"
            label="Set timeout"
            tooltip="Set a timeout for the request"
            model="timeoutRequest"
        />
        <div ng-show="timeoutRequest" style="padding-left: 15px;" class="mb-6">
            <firebot-input input-title="Timeout (ms)" model="effect.options.timeout" input-type="number" disable-variables="true" placeholder-text="Enter ms" />
        </div>
        <firebot-checkbox
            label="Run effects on error"
            tooltip="Run a list of effects if the request fails. Useful for when you want to do clean up or stop effect execution all together."
            model="effect.options.runEffectsOnError"
        />
    </eos-container>

    <eos-container header="Error Effects" pad-top="true" ng-if="effect.options.runEffectsOnError">
        <effect-list effects="effect.errorEffects"
            trigger="{{trigger}}"
            trigger-meta="triggerMeta"
            update="errorEffectsUpdated(effects)"
            modalId="{{modalId}}"></effect-list>
    </eos-container>

    <eos-container pad-top="true">
        <div class="effect-info alert alert-warning">
            Note: Request errors will be logged to the console, which you can access via Window > Toggle Developer Tools.
        </div>
    </eos-container>


    `,
    optionsController: ($scope, utilityService) => {

        $scope.errorEffectsUpdated = function(effects) {
            $scope.effect.errorEffects = effects;
        };

        $scope.editorSettings = {
            mode: {name: "javascript", json: true},
            theme: "blackboard",
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

        $scope.sortableOptions = {
            handle: ".dragHandle",
            stop: () => {}
        };

        $scope.showAddOrEditHeaderModal = (header) => {
            utilityService.showModal({
                component: "addOrEditHeaderModal",
                size: "sm",
                resolveObj: {
                    header: () => header
                },
                closeCallback: (newHeader) => {
                    console.log(newHeader);
                    $scope.effect.headers = $scope.effect.headers.filter(h => h.key !== newHeader.key);
                    $scope.effect.headers.push(newHeader);
                }
            });
        };

        if ($scope.effect.headers == null) {
            $scope.effect.headers = [];
        }

        if ($scope.effect.options == null) {
            $scope.effect.options = {};
        }

        $scope.removeHeaderAtIndex = (index) => {
            $scope.effect.headers.splice(index, 1);
        };

        $scope.headers = [
            {
                name: "KEY",
                icon: "fa-key",
                cellTemplate: `{{data.key}}`,
                cellController: () => {}
            },
            {
                name: "VALUE",
                icon: "fa-tag",
                cellTemplate: `{{data.value}}`,
                cellController: () => {}
            }
        ];

        $scope.headerOptions = (item) => {
            const options = [
                {
                    html: `<a href ><i class="far fa-pen" style="margin-right: 10px;"></i> Edit</a>`,
                    click: function () {
                        $scope.showAddOrEditHeaderModal(item);
                    }
                },
                {
                    html: `<a href style="color: #fb7373;"><i class="far fa-trash-alt" style="margin-right: 10px;"></i> Delete</a>`,
                    click: function () {
                        $scope.effect.headers = $scope.effect.headers.filter(h => h.key !== item.key);
                    }
                }
            ];
            return options;
        };
    },
    optionsValidator: (effect) => {
        const errors = [];
        if (effect.method === "" || effect.method == null) {
            errors.push("Please select an HTTP method");
        }
        if (effect.url === "" || effect.url == null) {
            errors.push("Please provide a url");
        }
        return errors;
    },
    onTriggerEvent: async (event) => {

        const logger = require("../../logwrapper");
        const twitchAuth = require("../../auth/twitch-auth");
        const accountAccess = require("../../common/account-access");
        const customVariableManager = require("../../common/custom-variable-manager");
        const effectRunner = require("../../common/effect-runner");

        const { effect, trigger, outputs, abortSignal } = event;

        let headers = {
            "User-Agent": "Firebot v5 - HTTP Request Effect",
            ...effect.headers.reduce((acc, next) => {
                acc[next.key] = next.value;
                return acc;
            }, {})
        };

        if (effect.options.useTwitchAuth && effect.url.startsWith("https://api.twitch.tv")) {
            const accessToken = accountAccess.getAccounts().streamer.auth.access_token;
            headers = {
                ...headers,
                "Authorization": `Bearer ${accessToken}`,
                "Client-ID": twitchAuth.twitchClientId
            };
        }

        const sendBodyData = effect.method.toLowerCase() === "post" ||
            effect.method.toLowerCase() === "put" ||
            effect.method.toLowerCase() === "patch";

        if (sendBodyData) {
            try {
                // Add the JSON header if the body is valid JSON
                JSON.parse(effect.body);
                headers = {
                    ...headers,
                    "Content-Type": "application/json"
                };
            } catch { }
        }

        let responseData;

        try {
            const response = await fetch(effect.url, {
                method: effect.method.toUpperCase(),
                headers,
                timeout: effect.options.timeout && effect.options.timeout > 0
                    ? AbortSignal.timeout(effect.options.timeout)
                    : undefined,
                body: sendBodyData === true ? effect.body : null
            });

            responseData = await response.text();

            if (!response.ok) {
                const error = new Error(`Request failed with status ${response.status}`);
                error.responseData = responseData;
                throw error;
            }

            try {
                responseData = JSON.parse(responseData);
            } catch (error) {
                //ignore error
            }

            /**
             * Deprecated
             */
            if (effect.options.putResponseInVariable) {
                customVariableManager.addCustomVariable(
                    effect.options.variableName,
                    responseData,
                    effect.options.variableTtl || 0,
                    effect.options.variablePropertyPath || null
                );
            }
        } catch (error) {
            const message = {
                errorMessage: error.message,
                responseData: error.responseData
            };

            logger.error("Error running http request", message);

            if (effect.options.runEffectsOnError && !abortSignal?.aborted) {
                const processEffectsRequest = {
                    trigger,
                    effects: effect.errorEffects,
                    outputs: outputs
                };

                const effectResult = await effectRunner.processEffects(processEffectsRequest);
                if (effectResult != null && effectResult.success === true) {
                    if (effectResult.stopEffectExecution) {
                        return {
                            success: true,
                            execution: {
                                stop: true,
                                bubbleStop: true
                            }
                        };
                    }
                }
            }
        }

        return {
            success: true,
            outputs: {
                httpResponse: responseData
            }
        };
    },
    overlayExtension: {
        dependencies: {
            css: [],
            js: []
        },
        event: {}
    }
};

module.exports = effect;
