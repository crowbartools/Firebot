"use strict";

const { settings } = require("../../common/settings-access");
const resourceTokenManager = require("../../resourceTokenManager");
const webServer = require("../../../server/httpServer");

const {
    EffectDefinition,
    EffectDependency,
    EffectTrigger
} = require("../models/effectModels");

/**
 * The Celebration effect
 */
const celebration = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:celebration",
        name: "Celebration",
        description: "Celebrate with a variety of overlay effects.",
        tags: ["Fun", "Built in"],
        dependencies: [EffectDependency.OVERLAY],
        triggers: [EffectTrigger.ALL]
    },
    /**
   * Global settings that will be available in the Settings tab
   */
    globalSettings: {},
    /**
   * The HTML template for the Options view (ie options when effect is added to something such as a button.
   * You can alternatively supply a url to a html file via optionTemplateUrl
   */
    optionsTemplate: `
  <div class="effect-setting-container">
  <div class="effect-specific-title"><h4>How should we celebrate?</h4></div>
  <div class="btn-group">
        <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            <span class="celebrate-effect-type">{{effect.celebration ? effect.celebration : 'Pick one'}}</span> <span class="caret"></span>
        </button>
        <ul class="dropdown-menu celebrate-effect-dropdown">
            <li ng-repeat="celebration in celebrationTypes"
                ng-click="effect.celebration = celebration">
                <a href>{{celebration}}</a>
            </li>
        </ul>
    </div>
    </div>
    <div class="effect-setting-container">
        <div class="effect-specific-title"><h4>How many seconds should the party last?</h4></div>
        <div class="input-group">
            <span class="input-group-addon" id="celebration-length-effect-type">Seconds</span>
            <input type="text" ng-model="effect.length" class="form-control" id="celebration-amount-setting" aria-describedby="celebration-length-effect-type" type="number">
        </div>
    </div>
    <div class="effect-info alert alert-warning">
        This effect requires the Firebot overlay to be loaded in your broadcasting software. <a href ng-click="showOverlayInfoModal()" style="text-decoration:underline">Learn more</a>
    </div>
    `,
    /**
   * The controller for the front end Options
   * Port over from effectHelperService.js
   */
    optionsController: $scope => {
        $scope.celebrationTypes = ["Fireworks"];
        if ($scope.effect.length == null) {
            $scope.effect.length = 5;
        }
    },
    /**
   * When the effect is triggered by something
   * Used to validate fields in the option template.
   */
    optionsValidator: effect => {
        let errors = [];
        if (effect.celebration == null) {
            errors.push("Please select how you'd like to celebrate.");
        }
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: event => {
        return new Promise((resolve, reject) => {
            // What should this do when triggered.
            let effect = event.effect;

            // Get report info
            let celebrationType = effect.celebration;
            let celebrationDuration = effect.length;

            // Send data to renderer.
            let data = {
                event: "celebration",
                celebrationType: celebrationType,
                celebrationDuration: celebrationDuration
            };

            // Send to overlay.
            webServer.sendToOverlay("celebrate", data);
            resolve(true);
        });
    },
    /**
   * Code to run in the overlay
   */
    overlayExtension: {
        dependencies: {
            css: [],
            js: []
        },
        event: {
            name: "celebrate",
            onOverlayEvent: event => {
                console.log("yay celebration");
                // fireworks
                // Uses the create.js plugin.
                function fireworks() {
                    let Fireworks,
                        GRAVITY,
                        K,
                        SPEED,
                        ToRadian,
                        canvas,
                        context,
                        ctx,
                        fireBoss,
                        repeat,
                        stage;
                    canvas = document.getElementById("fireworks");
                    context = canvas.getContext("2d");
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                    stage = new createjs.Stage(canvas);
                    stage.autoClear = false;
                    ctx = canvas.getContext("2d");
                    ctx.fillStyle = "rgba(0, 0, 0, 0)";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    createjs.Ticker.setFPS(50);
                    createjs.Touch.enable(stage);
                    stage.update();
                    GRAVITY = 1;
                    K = 0.9;
                    SPEED = 12;

                    ToRadian = function(degree) {
                        return degree * Math.PI / 180.0;
                    };

                    Fireworks = (function() {
                        function Fireworks(sx, sy, particles) {
                            let circle, i, j, rad, ref, speed;
                            this.sx = sx != null ? sx : 100;
                            this.sy = sy != null ? sy : 100;
                            this.particles = particles != null ? particles : 70;
                            this.sky = new createjs.Container();
                            this.r = 0;
                            this.h = (Math.random() * 360) | 0;
                            this.s = 100;
                            this.l = 50;
                            this.size = 3;
                            for (
                                i = j = 0, ref = this.particles;
                                0 <= ref ? j < ref : j > ref;
                                i = 0 <= ref ? ++j : --j
                            ) {
                                speed = Math.random() * 12 + 2;
                                circle = new createjs.Shape();
                                circle.graphics
                                    .f(
                                        "hsla(" + this.h + ", " + this.s + "%, " + this.l + "%, 1)"
                                    )
                                    .dc(0, 0, this.size);
                                circle.snapToPixel = true;
                                circle.compositeOperation = "lighter";
                                rad = ToRadian((Math.random() * 360) | 0);
                                circle.set({
                                    x: this.sx,
                                    y: this.sy,
                                    vx: Math.cos(rad) * speed,
                                    vy: Math.sin(rad) * speed,
                                    rad: rad
                                });
                                this.sky.addChild(circle);
                            }
                            stage.addChild(this.sky);
                        }

                        Fireworks.prototype.explode = function() {
                            let circle, j, p, ref;
                            if (this.sky) {
                                ++this.h;
                                for (
                                    p = j = 0, ref = this.sky.getNumChildren();
                                    0 <= ref ? j < ref : j > ref;
                                    p = 0 <= ref ? ++j : --j
                                ) {
                                    circle = this.sky.getChildAt(p);
                                    circle.vx = circle.vx * 0.95;
                                    circle.vy = circle.vy * 0.95;
                                    circle.x += circle.vx;
                                    circle.y += circle.vy + GRAVITY;
                                    this.l = Math.random() * 100;
                                    this.size = this.size + 0.0015;
                                    if (this.size > 0) {
                                        circle.graphics
                                            .c()
                                            .f("hsla(" + this.h + ", 100%, " + this.l + "%, 1)")
                                            .dc(0, 0, this.size);
                                    }
                                }
                                if (this.sky.alpha > 0.1) {
                                    this.sky.alpha -= K / 100;
                                } else {
                                    stage.removeChild(this.sky);
                                    this.sky = null;
                                }
                            } else {
                            }
                        };

                        return Fireworks;
                    }());

                    fireBoss = [];

                    setInterval(function() {
                        let x, y;
                        x = (Math.random() * canvas.width) | 0;
                        y = (Math.random() * canvas.height) | 0;
                        fireBoss.push(new Fireworks(x, y));
                        return fireBoss.push(new Fireworks(x, y));
                    }, 1300);

                    repeat = function() {
                        let fireworks, j, ref;
                        for (
                            fireworks = j = 0, ref = fireBoss.length;
                            0 <= ref ? j < ref : j > ref;
                            fireworks = 0 <= ref ? ++j : --j
                        ) {
                            if (fireBoss[fireworks].sky) {
                                fireBoss[fireworks].explode();
                            }
                        }

                        // Clear Stage
                        ctx.clearRect(0, 0, canvas.width, canvas.height);

                        // Update Stage
                        stage.update();
                    };

                    createjs.Ticker.on("tick", repeat);
                } // End Fireworks

                let data = event;
                // Celebrate Packet
                //{"event": "celebration", "celebrationType": celebrationType, "celebrationDuration":celebrationDuration};
                let type = data.celebrationType;
                let duration = parseFloat(data.celebrationDuration) * 1000; //convert to milliseconds.

                // Get time in milliseconds to use as class name.
                let d = new Date();
                let divClass = d.getTime();

                if (type === "Fireworks") {
                    let canvas =
            '<canvas id="fireworks" class="' +
            divClass +
            "-image celebration " +
            type +
            '" style="display:none;"></canvas>';

                    // Throw div on page and start up.
                    $(".wrapper").append(canvas);
                    $("." + divClass + "-image").fadeIn("fast");
                    fireworks();

                    setTimeout(function() {
                        $("." + divClass + "-image").fadeOut("fast", function() {
                            $("." + divClass + "-image").remove();
                        });
                    }, duration);
                }
            } //End event trigger
        }
    }
};

module.exports = celebration;
