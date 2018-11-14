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
    animateCss: function (animationName, animationDuration, animationDelay, animationRepeat, callback, data) {
		if(callback == null || !(callback instanceof Function)) {
			callback = () => {};
		}
		var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
		if(animationName !== "none") {
			if(animationDuration) {
				$(this).css("animation-duration", animationDuration);
			}

			if(animationDelay) {
				$(this).css("animation-delay", animationDelay);
			}

			if(animationRepeat) {
				$(this).css("animation-iteration-count", animationRepeat);
			}

			this.addClass('animated ' + animationName).one(animationEnd, function() {
				if(animationDuration) {
					$(this).css("animation-duration", "");
				}

				if(animationDelay) {
					$(this).css("animation-delay", "");
				}
	
				$(this).removeClass('animated ' + animationName);
				callback(data);
			});
		} else { 
			callback(data);
		}	
        return this;
    }
});

function showTimedAnimatedElement(
	elementClass, 
	enterAnimation, 
	enterDuration,
	inbetweenAnimation,
	inbetweenDelay,
	inbetweenDuration, 
	inbetweenRepeat,
	exitAnimation, 
	exitDuration, 
	duration, 
	tokenArg) {
	enterAnimation = enterAnimation ? enterAnimation : "fadeIn";
	exitAnimation = exitAnimation ? exitAnimation : "fadeOut";
	inbetweenAnimation = inbetweenAnimation ? inbetweenAnimation : "none";
	var id = `.${elementClass}`;
	$(id).animateCss(enterAnimation, enterDuration, null, null, (data) => {
		
		$(data.id).animateCss(data.inbetweenAnimation, data.inbetweenDuration, data.inbetweenDelay, data.inbetweenRepeat);

		setTimeout(function(){ 
			if(data.inbetweenAnimation) {
				$(data.id).css("animation-duration", "");
				$(data.id).css("animation-delay", "");
				$(data.id).css("animation-iteration-count", "");
				$(this).removeClass('animated ' + data.inbetweenAnimation);
			}
			$(data.id).animateCss(data.exitAnimation, data.exitDuration, null, null, (data1) => {
				$(data1.id).remove();
			}, data);
		}, (duration === 0 || duration != null) ? duration : 5000);
	}, { 
		token: tokenArg, 
		id: id, 
		exitAnimation: exitAnimation, 
		exitDuration: exitDuration,
		inbetweenAnimation: inbetweenAnimation,
		inbetweenDuration: inbetweenDuration,
		inbetweenDelay: inbetweenDelay,
		inbetweenRepeat: inbetweenRepeat
	});
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