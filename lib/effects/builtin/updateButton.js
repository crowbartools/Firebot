"use strict";

const {
    EffectDependency,
    EffectTrigger
} = require("../models/effectModels");

/**
 * The Update Button effect
 */
const updateButton = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:updatebutton",
        name: "Update Button",
        description: "Updates an interactive button.",
        tags: ["Built in"],
        dependencies: [EffectDependency.INTERACTIVE],
        triggers: [EffectTrigger.ALL]
    },
    /**
   * Global settings that will be available in the Settings tab
   */
    globalSettings: {},
    /**
   * The HTML template for the Options view (ie options when effect is added to something such as a button.
   * You can alternatively supply a url to a html file via optionTemplateUrl
   */
    optionsTemplate: `
  <eos-container header="Button To Update">
    <ui-select ng-model="effect.control" theme="bootstrap">
        <ui-select-match placeholder="Select or search for an button... ">{{$select.selected.text}}</ui-select-match>
        <ui-select-choices repeat="option in buttons | filter: { text: $select.search }" style="position:relative;">
            <div ng-bind-html="option.text | highlight: $select.search"></div>
            <small class="muted">Id: {{option.controlId}}  |  Scene: {{option.scene}}</small>
        </ui-select-choices>
    </ui-select>
    </eos-container>

    <eos-container header="Properties">
        <label class="control-fb control--checkbox"> Button Text
            <input type="checkbox" ng-model="effect.properties.text.shouldUpdate">
            <div class="control__indicator"></div>
        </label>
        <div uib-collapse="!effect.properties.text.shouldUpdate" style="margin: 0 0 15px 15px;">
            <input type="text" class="form-control" ng-model="effect.properties.text.value" placeholder="Enter text">
        </div>

        <label class="control-fb control--checkbox"> Tooltip
            <input type="checkbox" ng-model="effect.properties.tooltip.shouldUpdate">
            <div class="control__indicator"></div>
        </label>
        <div uib-collapse="!effect.properties.tooltip.shouldUpdate" style="margin: 0 0 15px 15px;">
            <input type="text" class="form-control" ng-model="effect.properties.tooltip.value" placeholder="Enter text">
        </div>

        <label class="control-fb control--checkbox"> Spark Cost
            <input type="checkbox" ng-model="effect.properties.cost.shouldUpdate">
            <div class="control__indicator"></div>
        </label>
        <div uib-collapse="!effect.properties.cost.shouldUpdate" style="margin: 0 0 15px 15px;">
            <input type="text" class="form-control" ng-model="effect.properties.cost.value" placeholder="Enter value or expression">
        </div>

        <label class="control-fb control--checkbox"> Progress Bar Precentage
            <input type="checkbox" ng-model="effect.properties.progress.shouldUpdate">
            <div class="control__indicator"></div>
        </label>
        <div uib-collapse="!effect.properties.progress.shouldUpdate" style="margin: 0 0 15px 15px;">
            <input type="text" class="form-control" ng-model="effect.properties.progress.value" placeholder="Enter value or expression">
        </div>
        <label class="control-fb control--checkbox"> Edit Active Status
            <input type="checkbox" ng-model="effect.properties.disabled.shouldUpdate">
            <div class="control__indicator"></div>
        </label>
        <div uib-collapse="!effect.properties.disabled.shouldUpdate" style="margin: 0 0 15px 15px;">
            <div class="btn-group" uib-dropdown>
                <button id="single-button" type="button" class="btn btn-default" uib-dropdown-toggle>
                {{effect.properties.disabled.value === 'toggle' ? 'Toggle' : effect.properties.disabled.value == true ? "Disabled" : "Active"}} <span class="caret"></span>
                </button>
                <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                <li role="menuitem" ng-click="effect.properties.disabled.value = false"><a href>Active</a></li>
                <li role="menuitem" ng-click="effect.properties.disabled.value = true"><a href>Disabled</a></li>
                <li role="menuitem" ng-click="effect.properties.disabled.value = 'toggle'"><a href>Toggle</a></li>
                </ul>
            </div>
        </div>
        <eos-collapsable-panel show-label="Show Variables & Expression Info" hide-label="Hide Variables & Expression Info">
                <h4>Text & Tooltip Only</h4>
                <ul>
                    <li><b>$(text)</b> - Current text for the selected button.</li>
                    <li><b>$(tooltip)</b> - Current tooltip for the selected button.</li>
                </ul>

                <h4>All Properties</h4>
                <ul>
                    <li><b>$(cost)</b> - Current spark cost for the selected button.</li>
                    <li><b>$(progress)</b> - Current percentage of the progress bar (0-100) for the selected button.</li>
                </ul>
        
                <h4 style="padding-top: 10px">Cost and Progress Expressions</h4>
                <p style="padding-bottom: 10px">The Spark Cost and Progress Bar properties support math and logic expressions, which allow you to create multipliers, incrementing values, and more! We use <a href ng-click="openLinkExternally('http://mathjs.org/docs/expressions/syntax.html')">mathjs</a> to parse expressions, feel free to take a look at their documentation to learn the cool stuff you can do!</p>
                <ul>
                    <li><b>Incrementing Progress Bar</b> - "$(progress) + 1"</li>
                    <li><b>Spark 2x Multipler</b> - "$(cost) * 2"</li>
                    <li><b>Randomly Increasing Sparks w/Auto Reset (Advanced)</b> - "a = $(cost) + randomInt(1,10); a < 100 ? a : 1"</li>
                </ul>
        </eos-collapsable-panel>     
    </eos-container>
    `,
    /**
   * The controller for the front end Options
   * Port over from effectHelperService.js
   */
    optionsController: ($scope, boardService) => {
        if ($scope.effect.properties == null) {
            $scope.effect.properties = {
                text: {
                    shouldUpdate: false,
                    value: ""
                },
                tooltip: {
                    shouldUpdate: false,
                    value: ""
                },
                cost: {
                    shouldUpdate: false,
                    value: ""
                },
                progress: {
                    shouldUpdate: false,
                    value: ""
                },
                disabled: {
                    shouldUpdate: false,
                    value: false
                }
            };
        }

        $scope.buttons = boardService
            .getControlsForSelectedBoard()
            .filter(c => c.kind === "button")
            .map(b => {
                return {
                    controlId: b.controlId,
                    text: b.text,
                    scene: b.scene
                };
            });
    },
    /**
   * When the effect is triggered by something
   * Used to validate fields in the option template.
   */
    optionsValidator: effect => {
        let errors = [];
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: event => {
        return new Promise((resolve, reject) => {
            // What should this do when triggered.
            let effect = event.effect;
            if (
                effect != null &&
        effect.control != null &&
        effect.properties != null
            ) {
                /*Interactive.updateButtonProperties(
                    effect.control.controlId,
                    effect.properties,
                    trigger
                );*/
            }
            resolve(true);
        });
    },
    /**
   * Code to run in the overlay
   */
    overlayExtension: {
        dependencies: {
            css: [],
            js: []
        },
        event: {
            name: "updatebutton",
            onOverlayEvent: event => {
                console.log("yay update button");
                //need to implement this
            }
        }
    }
};

module.exports = updateButton;
