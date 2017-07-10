// Video Handling
// This will take the data that is sent to it from the GUI and render a video on the overlay.
function showVideo(data){
	// Video Packet...
	// {"event":"video","filepath":filepath, "videoX":videoX, "videoY":videoY, "videoDuration":videoDuration};
	var videoType = data.videoType;
	var filepath = data.filepath;
	var youtubeId = data.youtubeId;
	var filepathNew = filepath.replace(/\\/g,"/");
	var videoPosition = data.videoPosition;
	var videoHeight = data.videoHeight;
	var videoWidth = data.videoWidth;
	var videoDuration = parseInt(data.videoDuration) * 1000;
	var videoVolume = data.videoVolume;
	console.log(videoVolume);

	// Get time in milliseconds to use as class name.
	var d = new Date();
	var divClass = d.getTime();

	if(videoType === "Local Video"){
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
		var videoFinal = videoFinal + '<iframe id="youtubeApi" width="'+ videoWidth +'" height="'+ videoHeight +'" src="https://www.youtube.com/embed/'+ youtubeId +'?enablejsapi=1&amp;rel=0&amp;autoplay=1&amp;showinfo=0&amp;controls=0&amp;autohide=1" frameborder="0" allowfullscreen></iframe>';
		var videoFinal = videoFinal + '</div>';
	}
	
	$('#wrapper').append(videoFinal);
	$('.'+divClass+'-video').fadeIn('fast');
	if(videoType === "Local Video"){
		videoVolume = parseInt(videoVolume) / 10;
		console.log(videoVolume);
		$('.player').prop("volume", videoVolume);
	}else{
		var tag = document.createElement('script');
		tag.id = 'iframe-demo';
		tag.src = 'https://www.youtube.com/iframe_api';
		var firstScriptTag = document.getElementsByTagName('script')[0];
		firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
	  
		var player;

		function onYouTubeIframeAPIReady() {
		  player = new YT.Player('youtubeApi', {
			  events: {
				'onReady': onPlayerReady,
				'onStateChange': onPlayerStateChange
			  }
		  });
		}

		function onPlayerReady(event) {
		  document.getElementById('youtubeApi').style.borderColor = '#FF6D00';
		  videoVolume = parseInt(videoVolume) * 10;
		  console.log(videoVolume);
		  event.target.setVolume(videoVolume);
		}
		// Just to have an form of visual feedback that the scrpt works while testing and stuff
		function changeBorderColor(playerStatus) {
		  var color;
		  if (playerStatus == -1) {
			color = "#37474F"; // unstarted = gray
		  } else if (playerStatus == 0) {
			color = "#FFFF00"; // ended = yellow
		  } else if (playerStatus == 1) {
			color = "#33691E"; // playing = green
		  } else if (playerStatus == 2) {
			color = "#DD2C00"; // paused = red
		  } else if (playerStatus == 3) {
			color = "#AA00FF"; // buffering = purple
		  } else if (playerStatus == 5) {
			color = "#FF6DOO"; // video cued = orange
		  }
		  if (color) {
			document.getElementById('youtubeApi').style.borderColor = color;
		  }
		}
		
		function onPlayerStateChange(event) {
		  changeBorderColor(event.data);
		}
	}

	setTimeout(function(){ 
		$('.'+divClass+'-video').fadeOut('fast', function(){
			$('.'+divClass+'-video').remove();
		});
	}, videoDuration);
}