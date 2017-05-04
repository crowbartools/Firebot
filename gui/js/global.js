const shell = require('electron').shell;

// Open Link In Browser
// This opens link in system default browser.
$(document).on('click', 'a[href^="http"]', function(event) {
    event.preventDefault();
    shell.openExternal(this.href);
});

// Navbar Collapse
// Collapse the navbar when a menu item is selected.
$("nav").find("li").on("click", "a", function () {
    var slide = parseInt( $(this).attr('slide') );
    $('.carousel').carousel(slide);

    $('.navbar-collapse').collapse('hide');
});