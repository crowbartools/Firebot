"use strict";
(function() {
    //This a wrapped dropdown element that automatically handles the particulars
    const Effect = require("../../backend/common/EffectType.js");

    angular.module("firebotApp").component("searchableEffectDropdown", {
        bindings: {
            trigger: "@",
            triggerMeta: "<",
            selected: "<",
            update: "&"
        },
        template: `
      <ui-select ng-model="$ctrl.selectedEffect" on-select="$ctrl.selectOption($item, $model)" theme="bootstrap">
        <ui-select-match placeholder="Select or search for an effect... ">{{$select.selected.name}}</ui-select-match>
        <ui-select-choices repeat="option in $ctrl.options | filter: { name: $select.search }" style="position:relative;">
          <div ng-bind-html="option.name | highlight: $select.search"></div>
          <small class="muted">{{option.description}}</small>

          <span ng-show="option.dependencies.length > 0" class="muted" style="font-size: 12px; position: absolute; top: 4px; right: 4px;" uib-tooltip-html="'<b>Dependencies:</b><br /> ' + $ctrl.getDependencyString(option.dependencies)" tooltip-append-to-body="true"><i class="fal fa-link"></i></span>

        </ui-select-choices>
      </ui-select>
      `,
        controller: function(
            $scope,
            $element,
            $attrs,
            settingsService,
            listenerService,
            connectionService,
            backendCommunicator
        ) {
            let ctrl = this;


            let effectDefs;

            async function getSelected() {

                if (!effectDefs) {
                    effectDefs = await backendCommunicator
                        .fireEventAsync("getEffectDefinitions", {
                            triggerType: ctrl.trigger,
                            triggerMeta: ctrl.triggerMeta
                        });
                }

                // grab the effect definitions for the given trigger
                ctrl.options = effectDefs.sort((a, b) => {
                    let textA = a.name.toUpperCase();
                    let textB = b.name.toUpperCase();
                    return textA < textB ? -1 : textA > textB ? 1 : 0;
                });

                if (!connectionService.accounts.streamer.partnered && !connectionService.accounts.streamer.canClip) {
                    ctrl.options = ctrl.options.filter(e => e.name !== Effect.EffectType.CREATE_CLIP);
                }

                //find the selected effect in the list
                let selected = ctrl.options.filter(e => e.id === ctrl.selected);

                //if we have a match, set it as selected
                if (selected.length > 0) {
                    ctrl.selectedEffect = selected[0];
                }
            }

            // when the element is initialized
            ctrl.$onInit = function() {
                getSelected();
            };

            ctrl.$onChanges = function() {
                getSelected();
            };

            //when a new effect is selected, set the selected type
            ctrl.selectOption = function(option) {
                ctrl.update({ effectType: option });
            };

            ctrl.getDependencyString = function(dependencies) {
                if (dependencies.length < 1) {
                    return "None";
                }

                const capitalize = ([first, ...rest]) =>
                    first.toUpperCase() + rest.join("").toLowerCase();

                return dependencies.map(d => capitalize(d.replace("_", " "))).join();
            };
        }
    });
}());
