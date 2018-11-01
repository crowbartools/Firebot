// Show Text
// This will take the data that is sent to it from the GUI and render on the overlay.
function showText(data){

	var customPosStyles = "";
	if(data.position == 'Custom') {
		console.log("Getting styles for custom coords");
		customPosStyles = getStylesForCustomCoords(data.customCoords)
	}

	// Get time in milliseconds to use as class name.
	var d = new Date();
	var divClass = d.getTime() + "-text";

	//border: 2px solid green;
	let styles = `height:${data.height}px;width:${data.width}px;${customPosStyles}`;

	styles += `justify-content:${data.justify};text-align:${data.justify};`

	if(data.dontWrap) {
		styles += "overflow: hidden; white-space: nowrap;"
	}

	if(borderColor) {
		styles += `border: 2px solid ${borderColor};`
	}

	let container = `
		<div class="${divClass} text-container"
			position="${data.position}"
			style="${styles}">
				${data.text}
		</div>
	`;

	// Throw text on page.
	$('#wrapper').append(container);

	var exitAnimation = data.exitAnimation ? data.exitAnimation : "fadeOut",
	enterAnimation = data.enterAnimation;
	var enterDuration = data.enterDuration;
	var exitDuration = data.exitDuration;
	var inbetweenAnimation = data.inbetweenAnimation ? data.inbetweenAnimation : "none";
	var inbetweenDuration = data.inbetweenDuration;
	var inbetweenDelay = data.inbetweenDelay;

	showTimedAnimatedElement(divClass, enterAnimation, enterDuration, inbetweenAnimation, inbetweenDelay, inbetweenDuration, exitAnimation, exitDuration, data.duration * 1000);
}
