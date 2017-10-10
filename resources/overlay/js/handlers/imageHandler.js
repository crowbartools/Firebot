// Image Handling
// This will take the data that is sent to it from the GUI and render an image on the overlay.
function showImage(data){
	// Image Packet...
	// {"event":"image","filepath":filepath, "imageX":imageX, "imageY":imageY, "imageDuration":imageDuration};
	var filepath = data.filepath;
	var imagePosition = data.imagePosition;
	var imageHeight = data.imageHeight;
	var imageWidth = data.imageWidth;

	var imageDuration = parseInt(data.imageDuration) * 1000;
	
	
	var customPosStyles = "";
	if(imagePosition == 'Custom') {
		customPosStyles = getStylesForCustomCoords(data.customCoords)
	}
	
	var token = encodeURIComponent(data.resourceToken);
	var filepathNew = `http://localhost:7473/resource/${token}`;

	// Get time in milliseconds to use as class name.
	var d = new Date();
	var divClass = d.getTime();

	if (imageHeight == false && imageWidth == false){
		// Both height and width fields left blank.
		var imageFinal = '<div class="'+divClass+'-image imageOverlay" position="'+imagePosition+'" style="display:block;'+customPosStyles+'"><img src="'+filepathNew+'?time='+divClass+'" position="'+imagePosition+'" style="'+customPosStyles+'"></div>';
	} else if (imageWidth == false){
		// Width field left blank, but height provided.
		var imageFinal = '<div class="'+divClass+'-image imageOverlay" position="'+imagePosition+'" style="display:block;height:'+ imageHeight +'px;'+customPosStyles+'"><img src="'+filepathNew+'?time='+divClass+'" position="'+imagePosition+'" style="max-width:100%; max-height:100%;height:'+ imageHeight +'px;'+customPosStyles+'"></div>';
	} else if (imageHeight == false) {
		// Height field left blank, but width provided.
		var imageFinal = '<div class="'+divClass+'-image imageOverlay" style="width:100%;height:100%;position:relative;'+customPosStyles+'"><img src="'+filepathNew+'?time='+divClass+'" position="'+imagePosition+'" style="max-width:100%; max-height:100%;width:'+ imageWidth +'px;'+customPosStyles+'"></div>';
	} else {
		// Both height and width provided.
		var imageFinal = '<div class="'+divClass+'-image imageOverlay" position="'+imagePosition+'" style="display:block;height:'+ imageHeight +'px; width:'+ imageWidth +'px;'+customPosStyles+'"><img src="'+filepathNew+'?time='+divClass+'" position="'+imagePosition+'" style="max-width:100%; max-height:100%;'+customPosStyles+'"></div>';
	}
	
	$('#wrapper').append(imageFinal);
	showTimedAnimatedElement(divClass+'-image', data.enterAnimation, data.exitAnimation, imageDuration);
}