// Video Handling
// This will take the data that is sent to it from the GUI and render a video on the overlay.
function showVideo(data){
	// Video Packet...
	// {"event":"video","filepath":filepath, "videoX":videoX, "videoY":videoY, "videoDuration":videoDuration};
	var filepath = data.filepath;
	var youtubeId = data.youtubeId;
	var filepathNew = filepath.replace(/\\/g,"/");
	var videoPosition = data.videoPosition;
	var videoHeight = data.videoHeight;
	var videoWidth = data.videoWidth;
	var videoDuration = parseInt(data.videoDuration) * 1000;

	// Get time in milliseconds to use as class name.
	var d = new Date();
	var divClass = d.getTime();

	if(!youtubeId){
		if (videoHeight === false && videoWidth === false){
			// Both height and width fields left blank.
			var videoFinal = '<div class="'+divClass+'-video videoOverlay" position="'+videoPosition+'" style="display:none;"><video class="player" autoplay ><source  src="'+filepathNew+'?time='+divClass+'" type="video/mp4" ></video></div>';
		} else if (videoWidth === false){
			// Width field left blank, but height provided.
			// var videoFinal = '<div class="'+divClass+'-video videoOverlay" position="'+videoPosition+'" style="display:none; height:'+ videoHeight +'px;"><img src="'+filepathNew+'?time='+divClass+'" style="max-width:100%; max-height:100%;"></div>';
			var videoFinal = '<div class="'+divClass+'-video videoOverlay" position="'+videoPosition+'" style="display:none;"><video height="'+ videoHeight +'" class="player" autoplay ><source  src="'+filepathNew+'?time='+divClass+'" type="video/mp4" ></video></div>';
		} else if (videoHeight === false) {
			// Height field left blank, but width provided.
			// var videoFinal = '<div class="'+divClass+'-video videoOverlay" position="'+videoPosition+'" style="display:none; width:'+ videoWidth +'px;"><img src="'+filepathNew+'?time='+divClass+'" style="max-width:100%; max-height:100%;"></div>';
			var videoFinal = '<div class="'+divClass+'-video videoOverlay" position="'+videoPosition+'" style="display:none;"><video width="'+ videoWidth +'" class="player" autoplay ><source  src="'+filepathNew+'?time='+divClass+'" type="video/mp4" ></video></div>';
		} else {
			// Both height and width provided.
			// var videoFinal = '<div class="'+divClass+'-video videoOverlay" position="'+videoPosition+'" style="display:none; height:'+ videoHeight +'px; width:'+ imageWidth +'px;"><img src="'+filepathNew+'?time='+divClass+'" style="max-width:100%; max-height:100%;"></div>';
			var videoFinal = '<div class="'+divClass+'-video videoOverlay" position="'+videoPosition+'" style="display:none;"><video height="'+ videoHeight +'" width="'+ videoWidth +'" class="player" autoplay ><source  src="'+filepathNew+'?time='+divClass+'" type="video/mp4" ></video></div>';
		}
	}else{
		var videoFinal = '<div class="'+divClass+'-video videoOverlay" position="'+videoPosition+'" style="display:none;">';
		var videoFinal = videoFinal + '<iframe width="'+ videoWidth +'" height="'+ videoHeight +'" src="https://www.youtube.com/embed/'+ youtubeId +'?rel=0&amp;autoplay=1&amp;showinfo=0&amp;controls=0&amp;autohide=1" frameborder="0" allowfullscreen></iframe>';
		var videoFinal = videoFinal + '</div>';
	}
	
	$('#wrapper').append(videoFinal);
	$('.'+divClass+'-video').fadeIn('fast');

	setTimeout(function(){ 
		$('.'+divClass+'-video').fadeOut('fast', function(){
			$('.'+divClass+'-video').remove();
		});
	}, videoDuration);
}