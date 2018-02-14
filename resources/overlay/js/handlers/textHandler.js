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

	let container = `
		<div class="${divClass} text-container"
			position="${data.position}"
			style="height:${data.height};width:${data.width};${customPosStyles}">
				${data.text}
		</div>
	`;

	console.log("adding text to page");
	// Throw text on page.
	$('#wrapper').append(container);

	var exitAnimation = data.exitAnimation ? data.exitAnimation : "fadeOut",
	enterAnimation = data.enterAnimation;

	showTimedAnimatedElement(divClass, enterAnimation, exitAnimation, data.duration * 1000);
}
