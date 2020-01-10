"use strict";
(function() {

    const uuidv1 = require("uuid/v1");

    angular
        .module('firebotApp')
        .component("restrictionsList", {
            bindings: {
                trigger: "@",
                triggerMeta: "<",
                restrictionData: "=",
                modalId: "@"
            },
            template: `
                <div style="margin-bottom: 20px;">
                    <h3 style="margin-bottom: 5px;">Restrictions <span class="muted" style="padding-bottom: 4px;padding-left: 2px;font-size: 13px;font-family: 'Quicksand';">(Permissions, currency costs, and more)</span></h3>
                    
                    <div style="padding-bottom: 4px;padding-left: 2px;font-size: 13px;font-family: 'Quicksand'; color: #8A8B8D;">
                        <span>Only trigger when </span>

                        <div class="text-dropdown filter-mode-dropdown" uib-dropdown uib-dropdown-toggle>
                            <div class="noselect pointer ddtext" style="font-size: 12px;">{{$ctrl.getRestrictionModeDisplay()}}<span class="fb-arrow down ddtext"></span></div>
                            <ul class="dropdown-menu" style="z-index: 10000000;" uib-dropdown-menu>

                                <li ng-click="$ctrl.restrictionData.mode = 'all'">
                                    <a style="padding-left: 10px;">all restrictions pass</a>
                                </li>

                                <li ng-click="$ctrl.restrictionData.mode = 'any'">
                                    <a style="padding-left: 10px;">any restriction passes</a>
                                </li>
                            </ul>
                        </div>
                        <span>:</span>
                    </div>
                    <div>
                        <restriction-item ng-repeat="restriction in $ctrl.restrictionData.restrictions" 
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

                $ctrl.getRestrictionModeDisplay = function() {
                    return $ctrl.restrictionData.mode === "any" ? "any restriction passes" : "all restrictions pass";
                };

                $ctrl.canAddMoreRestrictions = true;
                function updateCanAddMoreRestrictions() {
                    /*$ctrl.canAddMoreRestrictions = restrictionDefinitions
                        .some(r => {
                            return !$ctrl.restrictionData.restrictions.some(rs => rs.type === r.definition.id);
                        });*/
                }

                $ctrl.$onInit = function() {
                    if ($ctrl.restrictionData == null) {
                        $ctrl.restrictionData = {
                            restrictions: [],
                            mode: "all"
                        };
                    }

                    if ($ctrl.restrictionData.mode == null) {
                        $ctrl.restrictionData.mode = "all";
                    }

                    if ($ctrl.restrictionData.restrictions == null) {
                        $ctrl.restrictionData.restrictions = [];
                    }

                    updateCanAddMoreRestrictions();
                };

                $ctrl.deleteRestriction = function(restrictionId) {
                    $ctrl.restrictionData.restrictions = $ctrl.restrictionData.restrictions
                        .filter(r => r.id !== restrictionId);

                    updateCanAddMoreRestrictions();
                };

                $ctrl.getRestrictionDefinition = function(restrictionType) {
                    return restrictionDefinitions.find(r => r.definition.id === restrictionType);
                };

                $ctrl.showAddRestrictionModal = function() {

                    let options = restrictionDefinitions
                        /*.filter(r => {
                            return !$ctrl.restrictionData.restrictions.some(rs => rs.type === r.definition.id);
                        })*/
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
                            /*$ctrl.restrictionData.restrictions = $ctrl.restrictionData.restrictions
                                .filter(r => r.type !== selectedId);*/

                            $ctrl.restrictionData.restrictions.push({
                                id: uuidv1(),
                                type: selectedId
                            });

                            updateCanAddMoreRestrictions();
                        });
                };
            }
        });
}());
