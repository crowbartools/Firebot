"use strict";

(function() {
    angular.module("firebotApp")
        .component("labelTile", {
            bindings: {
                control: "<"
            },
            template: `
                <div class="mixer-label-container">
                    <div ng-style="$ctrl.getLabelStyle()">{{$ctrl.control.mixplay.text}}</div>
                </div>                        
            `,
            controller: function() {
                let $ctrl = this;

                $ctrl.getLabelStyle = function() {
                    let style = {};
                    if ($ctrl.control.mixplay) {
                        if ($ctrl.control.mixplay.textSize) {
                            style['font-size'] = $ctrl.control.mixplay.textSize;
                        }
                        if ($ctrl.control.mixplay.textColor) {
                            style['color'] = $ctrl.control.mixplay.textColor;
                        }
                        if ($ctrl.control.mixplay.bold) {
                            style['font-weight'] = '700';
                        }
                        if ($ctrl.control.mixplay.underline) {
                            style['text-decoration'] = 'underline';
                        }
                        if ($ctrl.control.mixplay.italic) {
                            style['font-style'] = 'italic';
                        }
                    }
                    return style;
                };
            }
        });
}());
