"use strict";

(function() {
    angular
        .module("firebotApp")
        .component("lucideIconPicker", {
            bindings: {
                model: "=",
                onSelect: "&?"
            },
            template: `
                <ui-select
                    ng-model="$ctrl.model"
                    on-select="$ctrl.selected()"
                    theme="bootstrap"
                    class="control-type-list"
                >
                    <ui-select-match placeholder="Select a glyph...">
                        <span class="flex-row-center" style="gap: 8px;">
                            <lucide-icon name="{{$ctrl.model}}" size="18"></lucide-icon>
                            <span>{{$ctrl.getIconName($ctrl.model)}}</span>
                        </span>
                    </ui-select-match>
                    <ui-select-choices repeat="icon.id as icon in $ctrl.icons | filter: { name: $select.search } | limitTo: 60" style="position:relative;">
                        <div class="flex-row-center" style="gap: 8px;">
                            <lucide-icon name="{{icon.name}}" size="18"></lucide-icon>
                            <span ng-bind-html="icon.name | highlight: $select.search"></span>
                        </div>
                    </ui-select-choices>
                    <ui-select-no-choice>
                        <b>No icons found</b>
                    </ui-select-no-choice>
                </ui-select>
            `,
            controller: function(lucideService) {
                const $ctrl = this;

                $ctrl.$onInit = () => {
                    $ctrl.icons = lucideService.getIcons();
                };

                $ctrl.selected = () => {
                    if ($ctrl.onSelect) {
                        $ctrl.onSelect();
                    }
                };

                $ctrl.getIconName = (iconId) => {
                    const icon = $ctrl.icons.find(i => i.id === iconId);
                    return icon ? icon.name : "";
                };
            }
        });
}());
