"use strict";
(function() {

    const uuidv1 = require("uuid/v1");

    angular
        .module('firebotApp')
        .component("restrictionsList", {
            bindings: {
                trigger: "@",
                triggerMeta: "<",
                restrictions: "=",
                modalId: "@"
            },
            template: `
                <div style="margin-bottom: 20px;">
                    <h3 style="margin-bottom: 5px;">Restrictions</h3>
                    <div class="muted" style="padding-bottom: 4px;padding-left: 2px;font-size: 13px;font-family: 'Quicksand';">Permissons, currency costs, and more</div>
                    <div>
                        <restriction-item ng-repeat="restriction in $ctrl.restrictions" 
                            restriction="restriction" 
                            restriction-definition="$ctrl.getRestrictionDefinition(restriction.type)"
                            on-delete="$ctrl.deleteRestriction(restriction.id)">
                        </restriction-item>
                    </div>
                    <div>
                        <div class="filter-bar clickable"
                            ng-show="$ctrl.canAddMoreRestrictions"
                            ng-click="$ctrl.showAddRestrictionModal()" 
                            uib-tooltip="Add Restriction" 
                            tooltip-append-to-body="true">
                                <i class="far fa-plus"></i> 
                        </div>
                    </div>
                </div>
            `,
            controller: function(utilityService, backendCommunicator) {
                let $ctrl = this;

                let restrictionDefinitions = backendCommunicator.fireEventSync("getRestrictions")
                    .map(r => {
                        return {
                            definition: r.definition,
                            optionsTemplate: r.optionsTemplate,
                            optionsController: eval(r.optionsControllerRaw), // eslint-disable-line no-eval
                            optionsValueDisplay: eval(r.optionsValueDisplayRaw) // eslint-disable-line no-eval
                        };
                    });

                $ctrl.canAddMoreRestrictions = true;
                function updateCanAddMoreRestrictions() {
                    $ctrl.canAddMoreRestrictions = restrictionDefinitions
                        .some(r => {
                            return !$ctrl.restrictions.some(rs => rs.type === r.definition.id);
                        });
                }

                $ctrl.$onInit = function() {
                    if ($ctrl.restrictions == null) {
                        $ctrl.restrictions = [];
                    }

                    updateCanAddMoreRestrictions();
                };

                $ctrl.deleteRestriction = function(restrictionId) {
                    $ctrl.restrictions = $ctrl.restrictions.filter(r => r.id !== restrictionId);

                    updateCanAddMoreRestrictions();
                };

                $ctrl.getRestrictionDefinition = function(restrictionType) {
                    return restrictionDefinitions.find(r => r.definition.id === restrictionType);
                };

                $ctrl.showAddRestrictionModal = function() {

                    let options = restrictionDefinitions
                        .filter(r => {
                            return !$ctrl.restrictions.some(rs => rs.type === r.definition.id);
                        })
                        .map(r => {
                            return {
                                id: r.definition.id,
                                name: r.definition.name,
                                description: r.definition.description
                            };
                        });

                    utilityService.openSelectModal(
                        {
                            label: "Add Restriction",
                            options: options,
                            saveText: "Add",
                            validationText: "Please select a restriction type."

                        },
                        (selectedId) => {
                            // just in case, remove any other restrictions of the same type
                            $ctrl.restrictions = $ctrl.restrictions.filter(r => r.type !== selectedId);

                            $ctrl.restrictions.push({
                                id: uuidv1(),
                                type: selectedId
                            });

                            updateCanAddMoreRestrictions();
                        });
                };
            }
        });
}());
