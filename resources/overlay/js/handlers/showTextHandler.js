// Show Text Replace
// This will animate out any showing effects before showing the next one.
// Note that if there is a lot of spam this will drop many inputs.
function showTextElementReplace(enterAnimation, exitAnimation, duration, textFinal) {
	enterAnimation = enterAnimation ? enterAnimation : "fadeIn";
	exitAnimation = exitAnimation ? exitAnimation : "fadeOut";
    
    // Animate old showText message off of the page.
    if ( $('.showTextMessage').length > 0 ){
        $('.showTextMessage').animateCss(exitAnimation, () => {
            // Remove old message.
            $('.showTextMessage').remove();
            $('.showTextHolder').append(textFinal);
    
            // Add in new message and remove it after max duration
            $('.showTextMessage').animateCss(enterAnimation, () => {
                setTimeout(function(){ 
                    $('.showTextMessage').animateCss(exitAnimation, () => {
                        $('.showTextMessage').remove();
                    });
                }, (duration === 0 || duration != null) ? duration : 5000);
            });
        });
    } else {
        $('.showTextHolder').append(textFinal);
        
        // Add in new message and remove it after max duration
        $('.showTextMessage').animateCss(enterAnimation, () => {
            setTimeout(function(){ 
                $('.showTextMessage').animateCss(exitAnimation, () => {
                    $('.showTextMessage').remove();
                });
            }, (duration === 0 || duration != null) ? duration : 5000);
        });
    }
}

// Show Text Animation
// This will add the text element to the bottom of the list.
// This should be able to keep up with spam fine and works similar to most chat overlays.
function showTextElementList(enterAnimation, exitAnimation, duration, textFinal, divClass) {
	enterAnimation = enterAnimation ? enterAnimation : "fadeIn";
	exitAnimation = exitAnimation ? exitAnimation : "fadeOut";
    
    // Animate old showText message off of the page.
    $('.showTextHolder').append(textFinal);
    
    // Add in new message and remove it after max duration
    $('.'+divClass).animateCss(enterAnimation, () => {
        setTimeout(function(){ 
            $('.'+divClass).animateCss(exitAnimation, () => {
                $('.'+divClass).remove();
            });
        }, (duration === 0 || duration != null) ? duration : 5000);
    });
}


// Show Text Handling
// This will take the data that is sent to it from the GUI and push some text to the overlay.
function showText(data){
    var showTextText = data.showTextText;
    var showTextColor = data.showTextColor;
    var showTextBackgroundColor = data.showTextBackgroundColor;
    var showTextFontSize = data.showTextFontSize;
	var showTextPosition = data.showTextPosition;
	var showTextHeight = data.showTextHeight;
	var showTextWidth = data.showTextWidth;
    var showTextDuration = parseInt(data.showTextDuration) * 1000;
    var showTextType = data.showTextType;
    var showTextAlignment = data.showTextAlignment;
	
	
	var customPosStyles = "";
	if(showTextPosition == 'Custom') {
		customPosStyles = getStylesForCustomCoords(data.customCoords)
    }
    

	// Get time in milliseconds to use as class name.
	var d = new Date();
	var divClass = d.getTime();

    // Add in our showText wrapper if it's not added already.
    // This container can have a set width and height and holds all of the showText messages.
    if($('.showTextOverlay').width() !== showTextWidth || $('.showTextOverlay').height() !== showTextHeight){
        $('.showTextOverlay').remove();

        if (showTextHeight == false && showTextWidth == false){
            // Both height and width fields left blank.
            var showTextFinal = '<div class="showTextOverlay" position="'+showTextPosition+'" style="display:block;'+customPosStyles+'"><div class="showTextHolder"></div></div>';
        } else if (showTextWidth == false){
            // Width field left blank, but height provided.
            var showTextFinal = '<div class="showTextOverlay" position="'+showTextPosition+'" style="display:block;height:'+ showTextHeight +'px;'+customPosStyles+'"><div class="showTextHolder"></div></div>';
        } else if (showTextHeight == false) {
            // Height field left blank, but width provided.
            var showTextFinal = '<div class="showTextOverlay" position="'+showTextPosition+'" style="display:block;width:'+ showTextWidth +'px;height:100%;'+customPosStyles+'"><div class="showTextHolder"></div></div>';
        } else {
            // Both height and width provided.
            var showTextFinal = '<div class="showTextOverlay" position="'+showTextPosition+'" style="display:block;height:'+ showTextHeight +'px;width:'+ showTextWidth +'px;'+customPosStyles+'"><div class="showTextHolder"></div></div>';
        }
        $('#wrapper').append(showTextFinal);
    }

    // Put the showText text into the showText container.
    var textFinal = '<div class="'+divClass+'-showText showTextMessage" style="color: '+showTextColor+'; background-color: '+showTextBackgroundColor+'; font-size: '+showTextFontSize+'; text-align: '+showTextAlignment+'">'+showTextText+'</div>';

    // Animate it!
    console.log(showTextType);
    if(showTextType === "replace"){
        showTextElementReplace(data.enterAnimation, data.exitAnimation, showTextDuration, textFinal);
    } else {
        showTextElementList(data.enterAnimation, data.exitAnimation, showTextDuration, textFinal, divClass+'-showText');
    }
}