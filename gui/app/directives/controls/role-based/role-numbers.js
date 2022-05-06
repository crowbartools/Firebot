"use strict";

(function() {
    angular
        .module('firebotApp')
        .component("roleNumbers", {
            bindings: {
                model: "=",
                settings: "<",
                onUpdate: '&'
            },
            template: `
            <div>
                <div style="margin: 5px 0 10px 0px;">
                    <button class="btn btn-default" ng-click="$ctrl.openAddRoleModal()"><i class="far fa-plus-circle"></i> Add Role</button>
                </div>

                <div ui-sortable="$ctrl.sortableOptions" ng-model="$ctrl.model.roles">
                    <div ng-repeat="role in $ctrl.model.roles track by role.roleId" style="display: flex;flex-direction: row;align-items: center;justify-content: space-between;background: #41444b;border-radius: 15px;padding: 0 15px;margin-bottom:5px;height:54px;">
                        <span class="dragHandle" style="height: 38px; width: 15px; align-items: center; justify-content: center; display: flex">
                            <i class="fal fa-bars" aria-hidden="true"></i>
                        </span>
                        <role-number model="role.value" role-id="role.roleId" min-value="$ctrl.settings.min" max-value="$ctrl.settings.max" style="width:100%;"></role-number>
                        <span class="clickable" style="color: #fb7373;" ng-click="$ctrl.removeRole(role.roleId)">
                            <i class="fad fa-trash-alt" aria-hidden="true"></i>
                        </span>
                    </div>
                </div>

                <div style="display: flex;flex-direction: row;align-items: center;justify-content: space-between;background: #41444b;border-radius: 15px;padding: 0 10px;margin-bottom:5px;height:54px;">
                    <role-number model="$ctrl.model.base" role-name="Everyone" style="width:100%;" min-value="$ctrl.settings.min" max-value="$ctrl.settings.max"></role-number>
                </div>
            </div>
            `,
            controller: function(viewerRolesService, utilityService) {

                const $ctrl = this;

                $ctrl.sortableOptions = {
                    handle: ".dragHandle",
                    stop: () => {}
                };

                let settings = {
                    defaultBase: 1.5,
                    defaultOther: 2,
                    min: 0,
                    max: null
                };

                $ctrl.$onInit = () => {
                    if ($ctrl.settings != null) {
                        settings = $ctrl.settings;
                    }

                    if ($ctrl.model == null) {
                        $ctrl.model = {
                            base: settings.defaultBase,
                            roles: []
                        };
                    }

                    $ctrl.model.roles = $ctrl.model.roles.filter(r => viewerRolesService.doesRoleExist(r.roleId));
                };

                $ctrl.removeRole = (roleId) => {
                    $ctrl.model.roles = $ctrl.model.roles.filter(r => r.roleId !== roleId);
                };

                $ctrl.openAddRoleModal = () => {
                    const allRoles = viewerRolesService.getTwitchRoles().concat(viewerRolesService.getCustomRoles()).concat(viewerRolesService.getTeamRoles());

                    const options = allRoles
                        .filter(r =>
                            !$ctrl.model.roles.some(rd => rd.roleId === r.id))
                        .map(r => {
                            return {
                                id: r.id,
                                name: r.name
                            };
                        });

                    utilityService.openSelectModal(
                        {
                            label: "Add Role",
                            options: options,
                            saveText: "Add",
                            validationText: "Please select a role."

                        },
                        (roleId) => {
                            if (!roleId) {
                                return;
                            }

                            $ctrl.model.roles.unshift({
                                roleId: roleId,
                                value: settings.defaultOther
                            });
                        });
                };
            }
        });
}());
