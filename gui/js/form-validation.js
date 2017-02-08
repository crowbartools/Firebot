const jqValidate = require('./plugins/jquery.validate.min.js');


// Button Menu Form Validation
// This function kicks off the form validation for the button menu.
function buttonMenuValidate(){
    $("#new-button-form").validate({
        settings:{
            onfocusout: false,
            onkeyup: false,
            onclick: false
        },
        rules: {
            buttonID:{
                required: true,
                number: true
            },
            buttonName:{
                required: true
            },
            cooldownButtons:{
                commaNumbers: true
            },
            cooldownLength:{
                number: true
            },
            buttonPress:{
                required: true
            },
            soundPath:{
                required:true
            }
        }
    });
}

// Comma Separated Number List Validation
jQuery.validator.addMethod("commaNumbers", function(value, element) {
  return this.optional( element ) || /^\d+(,\d+)*$/.test( value );
}, 'Incorrect value.');

// Clear Form
function clearValidate(form){
    var validator = $('#new-button-form').validate();
    validator.resetForm();
}

// Load up autocomplete for game buttons
function gameButtonValidation(){
    // First destory any pre-existing auto completes.

   // This is a list of all valid buttons for bot robotjs and kbm robot.
    var availableButtons = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "0",
    "backspace",
    "delete",
    "enter",
    "space",
    "tab",
    "escape",
    "up",
    "down",
    "left",
    "right",
    "home",
    "end",
    "pageup",
    "pagedown",
    "f1",
    "f2",
    "f3",
    "f4",
    "f5",
    "f6",
    "f7",
    "f8",
    "f9",
    "f10",
    "f11",
    "f12",
    "alt",
    "control",
    "shift",
    "numpad_0",
    "numpad_1",
    "numpad_2",
    "numpad_3",
    "numpad_4",
    "numpad_5",
    "numpad_6",
    "numpad_7",
    "numpad_8",
    "numpad_9"
    ];
    $( ".game-button-pressed input" ).autocomplete({
      source: availableButtons,
      appendTo: ".game-button-pressed"
    });
    $( ".game-button-counter input" ).autocomplete({
      source: availableButtons,
      appendTo: ".game-button-counter"
    });
    $( ".multi-button-array input" ).autocomplete({
      source: availableButtons,
      appendTo: ".multi-button-array"
    });
}

// Exports
exports.gameValidate = gameButtonValidation;
exports.clearValidate = clearValidate;

// On App Load
$(document).ready(function () {
    buttonMenuValidate();
    gameButtonValidation();
});