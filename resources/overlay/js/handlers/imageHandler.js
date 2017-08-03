// Image Handling
// This will take the data that is sent to it from the GUI and render an image on the overlay.
function showImage(data){
	// Image Packet...
	// {"event":"image","filepath":filepath, "imageX":imageX, "imageY":imageY, "imageDuration":imageDuration};
	var filepath = data.filepath;
	var filepathNew = filepath.replace(/\\/g,"/");
	var imagePosition = data.imagePosition;
	var imageHeight = data.imageHeight;
	var imageWidth = data.imageWidth;
	var imageDuration = parseInt(data.imageDuration) * 1000;

	// Get time in milliseconds to use as class name.
	var d = new Date();
	var divClass = d.getTime();

	if (imageHeight === false && imageWidth === false){
		// Both height and width fields left blank.
		var imageFinal = '<div class="'+divClass+'-image imageOverlay" position="'+imagePosition+'" style="display:none;"><img src="'+filepathNew+'?time='+divClass+'"></div>';
	} else if (imageWidth === false){
		// Width field left blank, but height provided.
		var imageFinal = '<div class="'+divClass+'-image imageOverlay" position="'+imagePosition+'" style="display:none; height:'+ imageHeight +'px;"><img src="'+filepathNew+'?time='+divClass+'" style="max-width:100%; max-height:100%;"></div>';
	} else if (imageHeight === false) {
		// Height field left blank, but width provided.
		var imageFinal = '<div class="'+divClass+'-image imageOverlay" position="'+imagePosition+'" style="display:none; width:'+ imageWidth +'px;"><img src="'+filepathNew+'?time='+divClass+'" style="max-width:100%; max-height:100%;"></div>';
	} else {
		// Both height and width provided.
		var imageFinal = '<div class="'+divClass+'-image imageOverlay" position="'+imagePosition+'" style="display:none; height:'+ imageHeight +'px; width:'+ imageWidth +'px;"><img src="'+filepathNew+'?time='+divClass+'" style="max-width:100%; max-height:100%;"></div>';
	}
	
	$('#wrapper').append(imageFinal);
	$('.'+divClass+'-image').fadeIn('fast');

	setTimeout(function(){ 
		$('.'+divClass+'-image').fadeOut('fast', function(){
			$('.'+divClass+'-image').remove();
		});
	}, imageDuration);
}