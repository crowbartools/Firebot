"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("animationService", function() {
            const service = {};

            service.animations = {
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

            return service;
        });
}());