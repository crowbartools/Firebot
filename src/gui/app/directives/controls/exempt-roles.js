"use strict";
(function() {
    angular
        .module('firebotApp')
        .component("exemptRoles", {
            bindings: {
                model: "=",
                onUpdate: '&'
            },
            template: `
                <div class="role-bar" ng-repeat="role in $ctrl.getExemptRoles() track by $index">
                    <span>{{role.name}}</span>
                    <span
                        class="clickable pl-4"
                        ng-click="$ctrl.removeExemptRole($index)"
                        uib-tooltip="Remove role"
                        tooltip-append-to-body="true"
                        aria-label="Remove role"
                    >
                        <i class="far fa-times"></i>
                    </span>
                </div>
                <div
                    class="role-bar clickable"
                    ng-click="$ctrl.openAddExemptRoleModal()"
                    uib-tooltip="Add role"
                    tooltip-append-to-body="true"
                    aria-label="Add role"
                >
                    <i class="far fa-plus"></i>
                </div>
            `,
            controller: function(viewerRolesService, utilityService) {
                const $ctrl = this;
                const getAllRoles = () => {
                    return [
                        ...viewerRolesService.getTwitchRoles(),
                        ...viewerRolesService.getCustomRoles(),
                        ...viewerRolesService.getTeamRoles()
                    ];
                };

                $ctrl.getExemptRoles = () => {
                    const roles = getAllRoles();
                    return roles.filter(r => $ctrl.model.includes(r.id));
                };

                $ctrl.openAddExemptRoleModal = () => {
                    const roles = getAllRoles();
                    const options = roles.filter(r => !$ctrl.model.includes(r.id));
                    utilityService.openSelectModal(
                        {
                            label: "Add Exempt Role",
                            options: options.map(r => ({
                                id: r.id,
                                name: r.name
                            })),
                            saveText: "Add",
                            validationText: "Please select a role."
                        },
                        (roleId) => {
                            if (!roleId) {
                                return;
                            }

                            $ctrl.model.push(roleId);
                            $ctrl.onUpdate();
                        });
                };

                $ctrl.removeExemptRole = (index) => {
                    $ctrl.model.splice(index, 1);
                    $ctrl.onUpdate();
                };
            }
        });
}());