"use strict";
(function() {
    //This adds the <eos-enter-exit-animations> element

    angular
        .module('firebotApp')
        .component("eosEnterExitAnimations", {
            bindings: {
                effect: '=',
                limitTo: '@',
                padTop: "<"
            },
            template: `
            <eos-container header="{{$ctrl.limitTo ? $ctrl.limitTo + ' Animation' : 'Animations'}}" pad-top="$ctrl.padTop">
                <div class="input-group" style="width: 100%" ng-hide="$ctrl.limitTo == 'Exit'">
                    <div class="fb-control-detail" ng-hide="$ctrl.limitTo != null">ENTER</div>
                    <select class="fb-select" ng-model="$ctrl.selected.enter" ng-change="$ctrl.enterUpdate()" ng-options="enter.name group by enter.category for enter in $ctrl.animations.enter"></select>
                    <div ng-hide="$ctrl.effect.enterAnimation === 'none'">
                        <div style="display: flex; flex-direction: row; width: 100%; height: 36px; margin: 5px 0 15px 25px; align-items: center;">
                            <label class="control-fb control--checkbox" style="margin: 0px 15px 0px 0px"> Custom Duration
                                <input type="checkbox" ng-init="customEnterDur = ($ctrl.effect.enterDuration != null && $ctrl.effect.enterDuration !== '')" ng-model="customEnterDur" ng-click="$ctrl.toggleEnterDurationStatus()">
                                <div class="control__indicator"></div>
                            </label>
                            <div ng-show="customEnterDur">
                                <form class="form-inline">
                                    <div class="form-group">
                                        <input type="number" class="form-control" ng-model="$ctrl.selected.enterDurationValue" ng-change="$ctrl.enterDurationUpdated()" style="width: 70px;">
                                    </div>
                                    <div class="form-group">
                                        <dropdown-select options="{s: 'seconds', ms: 'milliseconds'}" selected="$ctrl.selected.enterDurationType" on-update="$ctrl.enterDurationUpdated(option)"></dropdown-select>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="input-group" style="width: 100%" ng-hide="$ctrl.limitTo == 'Exit'">
                    <div class="fb-control-detail" ng-hide="$ctrl.limitTo != null">INBETWEEN</div>
                    <select class="fb-select" ng-model="$ctrl.selected.inbetween" ng-change="$ctrl.inbetweenUpdate()" ng-options="inbetween.name for inbetween in $ctrl.animations.inbetween"></select>
                    <div ng-hide="$ctrl.effect.inbetweenAnimation === 'none'">
                        <div style="display: flex; flex-direction: row; width: 100%; height: 36px; margin: 5px 0 0 25px; align-items: center;">
                            <span style="margin-right: 5px;width: 85px;">Delay for <tooltip text="'How long to delay after the Enter Animation before running the Inbetween Animation'"></tooltip></span>
                            <div>
                                <form class="form-inline">
                                    <div class="form-group">
                                        <input type="number" class="form-control" ng-model="$ctrl.selected.inbetweenDelayValue" ng-change="$ctrl.inbetweenDelayUpdated()" style="width: 70px;">
                                    </div>
                                    <div class="form-group">
                                        <dropdown-select options="{s: 'seconds', ms: 'milliseconds'}" selected="$ctrl.selected.inbetweenDelayType" on-update="$ctrl.inbetweenDelayUpdated(option)"></dropdown-select>
                                    </div>
                                </form>
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: row; width: 100%; height: 36px; margin: 5px 0 0 25px; align-items: center;">
                            <span style="margin-right: 5px;width: 85px;">Repeat <tooltip text="'How many times to repeat. Will get cut short if the total duration is reached and exit animation starts.'"></tooltip></span>
                            <div>
                                <form class="form-inline">
                                    <div class="form-group">
                                        <input type="number" class="form-control" ng-model="$ctrl.effect.inbetweenRepeat" ng-change="$ctrl.inbetweenRepeatUpdated()" style="width: 70px;">
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div ng-hide="$ctrl.effect.inbetweenAnimation === 'none'">
                        <div style="display: flex; flex-direction: row; width: 100%; height: 36px; margin: 5px 0 15px 25px; align-items: center;">
                            <label class="control-fb control--checkbox" style="margin: 0px 15px 0px 0px"> Custom Duration
                                <input type="checkbox" ng-init="customInbetweenDur = ($ctrl.effect.inbetweenDuration != null && $ctrl.effect.inbetweenDuration !== '')" ng-model="customInbetweenDur" ng-click="$ctrl.toggleInbetweenDurationStatus()">
                                <div class="control__indicator"></div>
                            </label>
                            <div ng-show="customInbetweenDur">
                                <form class="form-inline">
                                    <div class="form-group">
                                        <input type="number" class="form-control" ng-model="$ctrl.selected.inbetweenDurationValue" ng-change="$ctrl.inbetweenDurationUpdated()" style="width: 70px;">
                                    </div>
                                    <div class="form-group">
                                        <dropdown-select options="{s: 'seconds', ms: 'milliseconds'}" selected="$ctrl.selected.inbetweenDurationType" on-update="$ctrl.inbetweenDurationUpdated(option)"></dropdown-select>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="input-group" style="width: 100%" ng-hide="$ctrl.limitTo == 'Enter'">
                    <div class="fb-control-detail" ng-hide="$ctrl.limitTo != null">EXIT</div>
                    <select class="fb-select" ng-model="$ctrl.selected.exit" ng-change="$ctrl.exitUpdate()" ng-options="exit.name group by exit.category for exit in $ctrl.animations.exit"></select>
                    <div ng-hide="$ctrl.effect.exitAnimation === 'none'">
                        <div style="display: flex; flex-direction: row; width: 100%; height: 36px; margin: 5px 0 15px 25px; align-items: center;">
                            <label class="control-fb control--checkbox" style="margin: 0px 15px 0px 0px"> Custom Duration
                                <input type="checkbox" ng-init="customExitDur = ($ctrl.effect.exitDuration != null && $ctrl.effect.exitDuration !== '')" ng-model="customExitDur" ng-click="$ctrl.toggleExitDurationStatus()">
                                <div class="control__indicator"></div>
                            </label>
                            <div ng-show="customExitDur">
                                <form class="form-inline">
                                    <div class="form-group">
                                        <input type="number" class="form-control" ng-model="$ctrl.selected.exitDurationValue" ng-change="$ctrl.exitDurationUpdated()" style="width: 70px;">
                                    </div>
                                    <div class="form-group">
                                        <dropdown-select options="{s: 'seconds', ms: 'milliseconds'}" selected="$ctrl.selected.exitDurationType" on-update="$ctrl.exitDurationUpdated(option)"></dropdown-select>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </eos-container>
       `,
            controller: function() {
                const ctrl = this;
                ctrl.selected = {
                    enter: null,
                    enterDurationValue: 1,
                    enterDurationType: "s",
                    inbetween: null,
                    inbetweenDelayValue: 1,
                    inbetweenDelayType: "s",
                    inbetweenDurationValue: 1,
                    inbetweenDurationType: "s",
                    inbetweenRepeat: 1,
                    exit: null,
                    exitDurationValue: 1,
                    exitDurationType: "s"
                };

                function loadAnimationValues() {
                    ctrl.effect.enterAnimation = ctrl.effect.enterAnimation ? ctrl.effect.enterAnimation : 'fadeIn';
                    ctrl.selected.enter = ctrl.animations.enter.filter((ani) => {
                        return ani.class === ctrl.effect.enterAnimation;
                    })[0];

                    ctrl.effect.exitAnimation = ctrl.effect.exitAnimation ? ctrl.effect.exitAnimation : 'fadeOut';
                    ctrl.selected.exit = ctrl.animations.exit.filter((ani) => {
                        return ani.class === ctrl.effect.exitAnimation;
                    })[0];

                    ctrl.effect.inbetweenAnimation = ctrl.effect.inbetweenAnimation ? ctrl.effect.inbetweenAnimation : 'none';
                    ctrl.selected.inbetween = ctrl.animations.inbetween.filter((ani) => {
                        return ani.class === ctrl.effect.inbetweenAnimation;
                    })[0];

                    const enterDuration = ctrl.effect.enterDuration;
                    if (enterDuration != null) {
                        if (enterDuration.endsWith("ms")) {
                            ctrl.selected.enterDurationType = "ms";
                            ctrl.selected.enterDurationValue = parseFloat(enterDuration.replace("ms", ""));
                        } else if (enterDuration.endsWith("s")) {
                            ctrl.selected.enterDurationType = "s";
                            ctrl.selected.enterDurationValue = parseFloat(enterDuration.replace("s", ""));
                        }
                    }

                    const exitDuration = ctrl.effect.exitDuration;
                    if (exitDuration != null) {
                        if (exitDuration.endsWith("ms")) {
                            ctrl.selected.exitDurationType = "ms";
                            ctrl.selected.exitDurationValue = parseFloat(exitDuration.replace("ms", ""));
                        } else if (exitDuration.endsWith("s")) {
                            ctrl.selected.exitDurationType = "s";
                            ctrl.selected.exitDurationValue = parseFloat(exitDuration.replace("s", ""));
                        }
                    }

                    const inbetweenDuration = ctrl.effect.inbetweenDuration;
                    if (inbetweenDuration != null) {
                        if (inbetweenDuration.endsWith("ms")) {
                            ctrl.selected.inbetweenDurationType = "ms";
                            ctrl.selected.inbetweenDurationValue = parseFloat(inbetweenDuration.replace("ms", ""));
                        } else if (inbetweenDuration.endsWith("s")) {
                            ctrl.selected.inbetweenDurationType = "s";
                            ctrl.selected.inbetweenDurationValue = parseFloat(inbetweenDuration.replace("s", ""));
                        }
                    }

                    const inbetweenDelay = ctrl.effect.inbetweenDelay;
                    if (inbetweenDelay != null) {
                        if (inbetweenDelay.endsWith("ms")) {
                            ctrl.selected.inbetweenDelayType = "ms";
                            ctrl.selected.inbetweenDelayValue = parseFloat(inbetweenDelay.replace("ms", ""));
                        } else if (inbetweenDelay.endsWith("s")) {
                            ctrl.selected.inbetweenDelayType = "s";
                            ctrl.selected.inbetweenDelayValue = parseFloat(inbetweenDelay.replace("s", ""));
                        }
                    }

                }

                ctrl.$onInit = function() {
                    loadAnimationValues();
                };

                ctrl.$onChanges = function(changes) {
                    if (changes.effect) {
                        loadAnimationValues();
                    }
                };

                ctrl.toggleEnterDurationStatus = () => {
                    if (ctrl.effect.enterDuration) {
                        ctrl.effect.enterDuration = undefined;
                    } else {
                        ctrl.enterDurationUpdated();
                    }
                };

                ctrl.toggleExitDurationStatus = () => {
                    if (ctrl.effect.exitDuration) {
                        ctrl.effect.exitDuration = undefined;
                    } else {
                        ctrl.exitDurationUpdated();
                    }
                };

                ctrl.toggleInbetweenDurationStatus = () => {
                    if (ctrl.effect.inbetweenDuration) {
                        ctrl.effect.inbetweenDuration = undefined;
                    } else {
                        ctrl.inbetweenDurationUpdated();
                    }
                };

                ctrl.enterDurationUpdated = function() {
                    let durationValue = ctrl.selected.enterDurationValue;
                    if (durationValue == null || durationValue < 1) {
                        durationValue = 1;
                    }
                    ctrl.effect.enterDuration = `${durationValue}${ctrl.selected.enterDurationType}`;
                };

                ctrl.exitDurationUpdated = function() {
                    let durationValue = ctrl.selected.exitDurationValue;
                    if (durationValue == null || durationValue < 1) {
                        durationValue = 1;
                    }
                    ctrl.effect.exitDuration = `${durationValue}${ctrl.selected.exitDurationType}`;
                };

                ctrl.inbetweenDurationUpdated = function() {
                    let durationValue = ctrl.selected.inbetweenDurationValue;
                    if (durationValue == null || durationValue < 1) {
                        durationValue = 1;
                    }
                    ctrl.effect.inbetweenDuration = `${durationValue}${ctrl.selected.inbetweenDurationType}`;
                };

                ctrl.inbetweenDelayUpdated = function() {
                    let delayValue = ctrl.selected.inbetweenDelayValue;
                    if (delayValue == null || delayValue < 0) {
                        delayValue = 0;
                    }
                    ctrl.effect.inbetweenDelay = `${delayValue}${ctrl.selected.inbetweenDelayType}`;
                };

                ctrl.inbetweenRepeatUpdated = function() {
                    let repeat = ctrl.effect.inbetweenRepeat;
                    if (repeat == null || repeat < 0) {
                        repeat = 0;
                    }
                    ctrl.effect.inbetweenRepeat = repeat;
                };

                ctrl.enterUpdate = function() {
                    ctrl.effect.enterAnimation = ctrl.selected.enter.class;
                };

                ctrl.exitUpdate = function() {
                    ctrl.effect.exitAnimation = ctrl.selected.exit.class;
                };

                ctrl.inbetweenUpdate = function() {
                    ctrl.effect.inbetweenAnimation = ctrl.selected.inbetween.class;
                };

                ctrl.animations = {
                    enter: [
                        {
                            name: "Bounce In",
                            class: "bounceIn",
                            category: "Bouncing"
                        },
                        {
                            name: "Bounce In Up",
                            class: "bounceInUp",
                            category: "Bouncing"
                        },
                        {
                            name: "Bounce In Down",
                            class: "bounceInDown",
                            category: "Bouncing"
                        },
                        {
                            name: "Bounce In Left",
                            class: "bounceInLeft",
                            category: "Bouncing"
                        },
                        {
                            name: "Bounce In Right",
                            class: "bounceInRight",
                            category: "Bouncing"
                        },
                        {
                            name: "Fade In",
                            class: "fadeIn",
                            category: "Fade"
                        },
                        {
                            name: "Fade In Down",
                            class: "fadeInDown",
                            category: "Fade"
                        },
                        {
                            name: "Fade In Down Big",
                            class: "fadeInDownBig",
                            category: "Fade"
                        },
                        {
                            name: "Fade In Up",
                            class: "fadeInUp",
                            category: "Fade"
                        },
                        {
                            name: "Fade In Up Big",
                            class: "fadeInUpBig",
                            category: "Fade"
                        },
                        {
                            name: "Fade In Left",
                            class: "fadeInLeft",
                            category: "Fade"
                        },
                        {
                            name: "Fade In Left Big",
                            class: "fadeInLeftBig",
                            category: "Fade"
                        },
                        {
                            name: "Fade In Right",
                            class: "fadeInRight",
                            category: "Fade"
                        },
                        {
                            name: "Fade In Right Big",
                            class: "fadeInRightBig",
                            category: "Fade"
                        },
                        {
                            name: "Flip In X",
                            class: "flipInX",
                            category: "Flip"
                        },
                        {
                            name: "Flip In Y",
                            class: "flipInY",
                            category: "Flip"
                        },
                        {
                            name: "Rotate In",
                            class: "rotateIn",
                            category: "Rotate"
                        },
                        {
                            name: "Rotate In Down Left",
                            class: "rotateInDownLeft",
                            category: "Rotate"
                        },
                        {
                            name: "Rotate In Down Right",
                            class: "rotateInDownRight",
                            category: "Rotate"
                        },
                        {
                            name: "Rotate In Up Left",
                            class: "rotateInUpLeft",
                            category: "Rotate"
                        },
                        {
                            name: "Rotate In Up Right",
                            class: "rotateInUpRight",
                            category: "Rotate"
                        },
                        {
                            name: "Swirl In Forward Bottom",
                            class: "swirlInFwdBottom",
                            category: "Rotate"
                        },
                        {
                            name: "Swirl In Forward Center",
                            class: "swirlInFwdCenter",
                            category: "Rotate"
                        },
                        {
                            name: "Swirl In Forward Left",
                            class: "swirlInFwdLeft",
                            category: "Rotate"
                        },
                        {
                            name: "Swirl In Forward Right",
                            class: "swirlInFwdRight",
                            category: "Rotate"
                        },
                        {
                            name: "Swirl In Forward Top",
                            class: "swirlInFwdTop",
                            category: "Rotate"
                        },
                        {
                            name: "Swirl In Backward Bottom",
                            class: "swirlInBckBottom",
                            category: "Rotate"
                        },
                        {
                            name: "Swirl In Backward Center",
                            class: "swirlInBckCenter",
                            category: "Rotate"
                        },
                        {
                            name: "Swirl In Backward Left",
                            class: "swirlInBckLeft",
                            category: "Rotate"
                        },
                        {
                            name: "Swirl In Backward Right",
                            class: "swirlInBckRight",
                            category: "Rotate"
                        },
                        {
                            name: "Swirl In Backward Top",
                            class: "swirlInBckTop",
                            category: "Rotate"
                        },
                        {
                            name: "Zoom In",
                            class: "zoomIn",
                            category: "Zoom"
                        },
                        {
                            name: "Zoom In Down",
                            class: "zoomInDown",
                            category: "Zoom"
                        },
                        {
                            name: "Zoom In Left",
                            class: "zoomInLeft",
                            category: "Zoom"
                        },
                        {
                            name: "Zoom In Right",
                            class: "zoomInRight",
                            category: "Zoom"
                        },
                        {
                            name: "Zoom In Up",
                            class: "zoomInUp",
                            category: "Zoom"
                        },
                        {
                            name: "Slide In Down",
                            class: "slideInDown",
                            category: "Slide"
                        },
                        {
                            name: "Slide In Down Full Screen",
                            class: "slideInDownFull",
                            category: "Slide"
                        },
                        {
                            name: "Slide In Left",
                            class: "slideInLeft",
                            category: "Slide"
                        },
                        {
                            name: "Slide In Left Full Screen",
                            class: "slideInLeftFull",
                            category: "Slide"
                        },
                        {
                            name: "Slide In Right",
                            class: "slideInRight",
                            category: "Slide"
                        },
                        {
                            name: "Slide In Right Full Screen",
                            class: "slideInRightFull",
                            category: "Slide"
                        },
                        {
                            name: "Slide In Up",
                            class: "slideInUp",
                            category: "Slide"
                        },
                        {
                            name: "Slide In Up Full Screen",
                            class: "slideInUpFull",
                            category: "Slide"
                        },
                        {
                            name: "Light Speed In",
                            class: "lightSpeedIn",
                            category: "Misc"
                        },
                        {
                            name: "Jack In The Box",
                            class: "jackInTheBox",
                            category: "Misc"
                        },
                        {
                            name: "Roll In",
                            class: "rollIn",
                            category: "Misc"
                        },
                        {
                            name: "None",
                            class: "none",
                            category: "Misc"
                        }
                    ],
                    exit: [
                        {
                            name: "Bounce Out",
                            class: "bounceOut",
                            category: "Bouncing"
                        },
                        {
                            name: "Bounce Out Up",
                            class: "bounceOutUp",
                            category: "Bouncing"
                        },
                        {
                            name: "Bounce Out Down",
                            class: "bounceOutDown",
                            category: "Bouncing"
                        },
                        {
                            name: "Bounce Out Left",
                            class: "bounceOutLeft",
                            category: "Bouncing"
                        },
                        {
                            name: "Bounce Out Right",
                            class: "bounceOutRight",
                            category: "Bouncing"
                        },
                        {
                            name: "Fade Out",
                            class: "fadeOut",
                            category: "Fade"
                        },
                        {
                            name: "Fade Out Down",
                            class: "fadeOutDown",
                            category: "Fade"
                        },
                        {
                            name: "Fade Out Down Big",
                            class: "fadeOutDownBig",
                            category: "Fade"
                        },
                        {
                            name: "Fade Out Up",
                            class: "fadeOutUp",
                            category: "Fade"
                        },
                        {
                            name: "Fade Out Up Big",
                            class: "fadeOutUpBig",
                            category: "Fade"
                        },
                        {
                            name: "Fade Out Left",
                            class: "fadeOutLeft",
                            category: "Fade"
                        },
                        {
                            name: "Fade Out Left Big",
                            class: "fadeOutLeftBig",
                            category: "Fade"
                        },
                        {
                            name: "Fade Out Right",
                            class: "fadeOutRight",
                            category: "Fade"
                        },
                        {
                            name: "Fade Out Right Big",
                            class: "fadeOutRightBig",
                            category: "Fade"
                        },
                        {
                            name: "Rotate Out",
                            class: "rotateOut",
                            category: "Rotate"
                        },
                        {
                            name: "Rotate Out Down Left",
                            class: "rotateOutDownLeft",
                            category: "Rotate"
                        },
                        {
                            name: "Rotate Out Down Right",
                            class: "rotateOutDownRight",
                            category: "Rotate"
                        },
                        {
                            name: "Rotate Out Up Left",
                            class: "rotateOutUpLeft",
                            category: "Rotate"
                        },
                        {
                            name: "Rotate Out Up Right",
                            class: "rotateOutUpRight",
                            category: "Rotate"
                        },
                        {
                            name: "Swirl Out Forward Bottom",
                            class: "swirlOutFwdBottom",
                            category: "Rotate"
                        },
                        {
                            name: "Swirl Out Forward Center",
                            class: "swirlOutFwdCenter",
                            category: "Rotate"
                        },
                        {
                            name: "Swirl Out Forward Left",
                            class: "swirlOutFwdLeft",
                            category: "Rotate"
                        },
                        {
                            name: "Swirl Out Forward Right",
                            class: "swirlOutFwdRight",
                            category: "Rotate"
                        },
                        {
                            name: "Swirl Out Forward Top",
                            class: "swirlOutFwdTop",
                            category: "Rotate"
                        },
                        {
                            name: "Swirl Out Backward Bottom",
                            class: "swirlOutBckBottom",
                            category: "Rotate"
                        },
                        {
                            name: "Swirl Out Backward Center",
                            class: "swirlOutBckCenter",
                            category: "Rotate"
                        },
                        {
                            name: "Swirl Out Backward Left",
                            class: "swirlOutBckLeft",
                            category: "Rotate"
                        },
                        {
                            name: "Swirl Out Backward Right",
                            class: "swirlOutBckRight",
                            category: "Rotate"
                        },
                        {
                            name: "Swirl Out Backward Top",
                            class: "swirlOutBckTop",
                            category: "Rotate"
                        },
                        {
                            name: "Zoom Out",
                            class: "zoomOut",
                            category: "Zoom"
                        },
                        {
                            name: "Zoom Out Down",
                            class: "zoomOutDown",
                            category: "Zoom"
                        },
                        {
                            name: "Zoom Out Left",
                            class: "zoomOutLeft",
                            category: "Zoom"
                        },
                        {
                            name: "Zoom Out Right",
                            class: "zoomOutRight",
                            category: "Zoom"
                        },
                        {
                            name: "Zoom Out Up",
                            class: "zoomOutUp",
                            category: "Zoom"
                        },
                        {
                            name: "Slide Out Down",
                            class: "slideOutDown",
                            category: "Slide"
                        },
                        {
                            name: "Slide Out Down Full Screen",
                            class: "slideOutDownFull",
                            category: "Slide"
                        },
                        {
                            name: "Slide Out Left",
                            class: "slideOutLeft",
                            category: "Slide"
                        },
                        {
                            name: "Slide Out Left Full Screen",
                            class: "slideOutLeftFull",
                            category: "Slide"
                        },
                        {
                            name: "Slide Out Right",
                            class: "slideOutRight",
                            category: "Slide"
                        },
                        {
                            name: "Slide Out Right Full Screen",
                            class: "slideOutRightFull",
                            category: "Slide"
                        },
                        {
                            name: "Slide Out Up",
                            class: "slideOutUp",
                            category: "Slide"
                        },
                        {
                            name: "Slide Out Up Full Screen",
                            class: "slideOutUpFull",
                            category: "Slide"
                        },
                        {
                            name: "Light Speed Out",
                            class: "lightSpeedOut",
                            category: "Misc"
                        },
                        {
                            name: "Hinge",
                            class: "hinge",
                            category: "Misc"
                        },
                        {
                            name: "Roll Out",
                            class: "rollOut",
                            category: "Misc"
                        },
                        {
                            name: "None",
                            class: "none",
                            category: "Misc"
                        }
                    ],
                    inbetween: [
                        {
                            name: "None",
                            class: "none"
                        },
                        {
                            name: "Bounce",
                            class: "bounce"
                        },
                        {
                            name: "Flash",
                            class: "flash"
                        },
                        {
                            name: "Pulse",
                            class: "pulse"
                        },
                        {
                            name: "Shake",
                            class: "shake"
                        },
                        {
                            name: "Swing",
                            class: "swing"
                        },
                        {
                            name: "Tada",
                            class: "tada"
                        },
                        {
                            name: "Wobble",
                            class: "wobble"
                        },
                        {
                            name: "Jello",
                            class: "jello"
                        }
                    ]
                };

            }
        });
}());
