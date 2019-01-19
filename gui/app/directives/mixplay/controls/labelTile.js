"use strict";

(function() {
    angular.module("firebotApp")
        .component("labelTile", {
            bindings: {
                control: "<"
            },
            template: `
                <div class="mixer-label-container">
                    <div ng-style="$ctrl.getLabelStyle()">{{$ctrl.control.text}}</div>
                </div>                        
            `,
            controller: function() {
                let $ctrl = this;

                $ctrl.getLabelStyle = function() {
                    let style = {};
                    if ($ctrl.control.textSize) {
                        style['font-size'] = $ctrl.control.textSize;
                    }
                    if ($ctrl.control.textColor) {
                        style['color'] = $ctrl.control.textColor;
                    }
                    if ($ctrl.control.bold) {
                        style['font-weight'] = '700';
                    }
                    if ($ctrl.control.underline) {
                        style['text-decoration'] = 'underline';
                    }
                    if ($ctrl.control.italic) {
                        style['font-style'] = 'italic';
                    }
                    return style;
                };
            }
        });
}());
