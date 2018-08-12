"use strict";

const { settings } = require("../../common/settings-access");
const effectRunner = require("../../common/effect-runner");

const {
    EffectDefinition,
    EffectDependency,
    EffectTrigger
} = require("../models/effectModels");

/**
 * The Random Effect effect
 */
const effectGroup = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:effectGroup",
        name: "Effect Group",
        description:
      "Group multiple effects to be treated as one (Useful in a Random Effect)",
        tags: ["Logic control", "Built in"],
        dependencies: [],
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
  <p>All effects in the below list will be treated as one effect. This is useful when used in a Random Effect. You can optionally give it a label to help identify what this effect does in the root effect list.</p>

    <div style="margin-bottom: 10px">
        <eos-container header="Effect Label">
            <div class="input-group">
                <span class="input-group-addon">Label</span>
                <input ng-model="effect.effectLabel" type="text" class="form-control" type="text">
            </div>
        </eos-container>
    </div>
    
    <effect-list effects="effect.effectList" 
                trigger="{{trigger}}" 
                update="effectListUpdated(effects)"
                header="Effects"
                header-classes="h4"
                effect-container-classes="effect-setting-content" 
                modalId="{{modalId}}"
                is-array="true"></effect-list>
    `,
    /**
   * The controller for the front end Options
   */
    optionsController: $scope => {
        if ($scope.effect.effectList == null) {
            $scope.effect.effectList = [];
        }

        $scope.effectListUpdated = function(effects) {
            $scope.effect.effectList = effects;
        };
    },
    /**
   * When the effect is saved
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
            let effectList = event.effect.effectList;

            let processEffectsRequest = {
                trigger: event.trigger,
                effects: effectList
            };

            effectRunner.processEffects(processEffectsRequest).then(() => {
                resolve(true);
            });
        });
    }
};

module.exports = effectGroup;
