// Global
notificationShown = false;

// Handle notifications
function notification(status, text){
	var divStatus = $('.notification').is(':visible');

	// Check if we need to show notification or not.
	if(divStatus === false && status === "open" && notificationShown === false){
		// Show the notification
		notificationShown = true;
		$('body').prepend('<div class="notification" style="display:none"><p>'+text+'</p></div>');
		$('.notification').fadeIn('fast');
		setTimeout(function(){ 
			$(".notification p").text("I'll keep trying in the background...");
			setTimeout(function(){ 
				$(".notification").fadeOut(300, function() { $(this).remove(); });
			}, 5000);
		}, 30000);
	} else if (status === "close"){
		// Fade out and remove notification
		notificationShown = false;
		$(".notification").fadeOut(300, function() { $(this).remove(); });
	}
}

$.fn.extend({
    animateCss: function (animationName, callback, data) {
		if(callback == null || !(callback instanceof Function)) {
			callback = () => {};
		}
		var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
		if(animationName !== "none") {
			this.addClass('animated ' + animationName).one(animationEnd, function() {
				$(this).removeClass('animated ' + animationName);
				callback(data);
			});
		} else { 
			callback(data);
		}	
        return this;
    }
});

function showTimedAnimatedElement(elementClass, enterAnimation, exitAnimation, duration, tokenArg) {
	enterAnimation = enterAnimation ? enterAnimation : "fadeIn";
	exitAnimation = exitAnimation ? exitAnimation : "fadeOut";
	var id = `.${elementClass}`;
	$(id).animateCss(enterAnimation, (data) => {
		setTimeout(function(){ 
			$(data.id).animateCss(data.exitAnimation, (data1) => {
				$(data1.id).remove();
			}, data);
		}, (duration === 0 || duration != null) ? duration : 5000);
	}, { token: tokenArg, id: id, exitAnimation: exitAnimation });
}

function getStylesForCustomCoords(customCoords) {
	
	var style = "position:absolute;margin:auto;"
	if(customCoords.top !== null) {
		style = style + "top:" + customCoords.top.toString() + "px;"
	}
	if(customCoords.bottom !== null) {
		style = style + "bottom:" + customCoords.bottom.toString() + "px;"
	}
	if(customCoords.left !== null) {
		style = style + "left:" + customCoords.left.toString() + "px;"
	}
	if(customCoords.right !== null) {
		style = style + "right:" + customCoords.right.toString() + "px;"
	}
	
	return style;
}

/* Polyfill EventEmitter. */
var EventEmitter = function () {
    this.events = {};
};

EventEmitter.prototype.on = function (event, listener) {
    if (typeof this.events[event] !== 'object') {
        this.events[event] = [];
    }

    this.events[event].push(listener);
};

EventEmitter.prototype.removeListener = function (event, listener) {
    var idx;

    if (typeof this.events[event] === 'object') {
        idx = this.events[event].indexOf(listener);

        if (idx > -1) {
            this.events[event].splice(idx, 1);
        }
    }
};

EventEmitter.prototype.emit = function (event) {
    var i, listeners, length, args = [].slice.call(arguments, 1);

    if (typeof this.events[event] === 'object') {
        listeners = this.events[event].slice();
        length = listeners.length;

        for (i = 0; i < length; i++) {
            listeners[i].apply(this, args);
        }
    }
};

EventEmitter.prototype.once = function (event, listener) {
    this.on(event, function g () {
        this.removeListener(event, g);
        listener.apply(this, arguments);
    });
};