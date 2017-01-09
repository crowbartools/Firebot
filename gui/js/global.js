// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// Random BG Image
function randomBG(){
    var random = Math.floor(Math.random() * 5) + 1 ;
    $('body').css('background-image', 'url("./images/bg/'+random+'.jpg")');
}
randomBG();

// Toggles the side menu.
function startMenu(){
    $('.menu-toggle').sidr({
        name: 'main-menu',
        source: '#main-menu',
        renaming: false
    });
}
startMenu();

// Navigates between various main pages.
function pageNavigation(){
    $('.navigation a').click( function(e) {
        e.preventDefault(); 
        var nextup = $(this).attr('data');
        $('.current').slideToggle(500).removeClass('current');
        $('.'+nextup).slideToggle(500).addClass('current');
        $.sidr('close','main-menu');
        return false; 
    } );
}
pageNavigation();
