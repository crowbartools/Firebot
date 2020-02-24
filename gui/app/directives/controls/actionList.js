"use strict";
(function() {
    angular.module("firebotApp").component("actionList", {
        bindings: {
            actions: "<",
            isRandom: "<",
            update: "&",
            modalId: "@"
        },
        template: `
        <div>
          <div ui-sortable="$ctrl.sortableOptions" ng-model="$ctrl.actionsArray">
              <div ng-repeat="action in $ctrl.actionsArray track by $index">
                  <div class="effect-bar clickable-dark"
                      ng-click="$ctrl.openAddOrEditActionModal($index)"
                      ng-mouseenter="hovering = true"
                      ng-mouseleave="hovering = false">
                          <span style="display: inline-block;text-overflow: ellipsis;overflow: hidden;line-height: 20px;white-space: nowrap;padding-right: 10px;">
                              <span class="muted" ng-hide="$ctrl.isRandom">{{$index + 1}}. </span>
                              {{action.type}}
                              <span ng-if="action.label" class="muted"> ({{action.label}})</span>
                          </span>
                          <span class="flex-row-center ">
                              <i class="dragHandle fal fa-bars" ng-class="{'hiddenHandle': !hovering || $ctrl.isRandom }" aria-hidden="true" style="margin-right:15px" ng-click="$event.stopPropagation()"></i>
                              <div class="clickable" style="margin-right:15px; font-size: 20px; width: 15px; text-align: center;" uib-dropdown uib-dropdown-toggle dropdown-append-to-body="true" ng-click="$event.stopPropagation()">
                                  <span class="noselect pointer"> <i class="fal fa-ellipsis-v"></i> </span>
                                  <ul class="dropdown-menu" uib-dropdown-menu>
                                      <li><a href ng-click="$ctrl.openAddOrEditActionModal($index)"><i class="fal fa-edit" style="margin-right: 10px;" aria-hidden="true"></i>  Edit</a></li>
                                      <li><a href ng-click="$ctrl.duplicateActionAtIndex($index)"><i class="fal fa-clone" style="margin-right: 10px;" aria-hidden="true"></i>  Duplicate</a></li>
                                      <li><a href ng-click="$ctrl.removeActionAtIndex($index)" style="color: #fb7373;"><i class="far fa-trash-alt" style="margin-right: 10px;"></i>  Delete</a></li>
                                  </ul>
                              </div>
                          </span> 
                  </div>
              </div>
          </div>
        
            <div class="add-more-functionality">
                <button type="button" class="btn btn-link" ng-click="$ctrl.openAddOrEditActionModal()">
                    + Add Action
                </button>
            </div>            
        </div>
            `,
        controller: function(utilityService) {
            let $ctrl = this;

            $ctrl.actionsArray = [];

            // when the element is initialized
            $ctrl.$onInit = function() {
                if ($ctrl.actions != null) {
                    $ctrl.actionsArray = JSON.parse(JSON.stringify($ctrl.actions));
                }
            };

            $ctrl.actionsUpdate = function() {
                $ctrl.update({ actions: $ctrl.actionsArray });
            };

            $ctrl.actionTypeChanged = function(actionType, index) {
                $ctrl.actionsArray[index].type = actionType;
            };

            $ctrl.sortableOptions = {
                handle: ".dragHandle",
                stop: () => {
                    $ctrl.actionsUpdate();
                }
            };

            $ctrl.duplicateActionAtIndex = function(index) {
                let action = JSON.parse(angular.toJson($ctrl.actionsArray[index]));
                $ctrl.actionsArray.splice(index + 1, 0, action);
                $ctrl.actionsUpdate();
            };

            $ctrl.removeActionAtIndex = function(index) {
                $ctrl.actionsArray.splice(index, 1);
                $ctrl.actionsUpdate();
            };

            $ctrl.openAddOrEditActionModal = function(index) {
                utilityService.showModal({
                    component: "addOrEditTimerActionModal",
                    resolveObj: {
                        action: () => $ctrl.actionsArray[index],
                        index: () => index
                    },
                    closeCallback: resp => {
                        let responseAction = resp.responseAction;


                        switch (responseAction) {
                        case "add":
                            $ctrl.actionsArray.push(resp.action);
                            break;
                        case "update":
                            $ctrl.actionsArray[resp.index] = resp.action;
                            break;
                        case "delete":
                            $ctrl.removeActionAtIndex(resp.index);
                            break;
                        }

                        $ctrl.actionsUpdate();
                    }
                });
            };
        }
    });
}());
