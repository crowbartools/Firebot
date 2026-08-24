"use strict";

(function() {
    angular
        .module("firebotApp")
        .component("emojiPicker", {
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
                    <ui-select-match placeholder="Select an emoji...">
                        <span class="flex-row-center" style="gap: 8px;">
                            <span class="emoji-glyph">{{$ctrl.model}}</span>
                            <span>{{$ctrl.getName($ctrl.model)}}</span>
                        </span>
                    </ui-select-match>
                    <ui-select-choices repeat="emoji.id as emoji in $ctrl.emojis | filter: { name: $select.search } | limitTo: 60" style="position:relative;">
                        <div class="flex-row-center" style="gap: 8px;">
                            <span class="emoji-glyph">{{emoji.emoji}}</span>
                            <span ng-bind-html="emoji.name | highlight: $select.search"></span>
                        </div>
                    </ui-select-choices>
                    <ui-select-no-choice>
                        <b>No emojis found</b>
                    </ui-select-no-choice>
                </ui-select>
            `,
            controller: function(emojiService) {
                const $ctrl = this;

                $ctrl.$onInit = () => {
                    $ctrl.emojis = emojiService.getEmojis();
                };

                $ctrl.selected = () => {
                    if ($ctrl.onSelect) {
                        $ctrl.onSelect();
                    }
                };

                $ctrl.getName = (emoji) => {
                    return emojiService.getName(emoji);
                };
            }
        });
}());
