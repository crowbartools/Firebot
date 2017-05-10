// Add New Group
// This button adds a new group to the app.
function addNewGroup(){

    var uniqueid = new Date().getTime().toString();

    var groupTemplate = `
        <div class="interactive-group-wrap col-sm-12 col-md-3 group${uniqueid}">
            <div class="interactive-groupheader">
            <div class="interactive-group-name pull-left">
                Unnamed
            </div>
            <div class="interactive-group-controls pull-right">
                <div class="edit-interactive-control">
                <button class="edit-control btn btn-default" group="${uniqueid}">
                    <i class="fa fa-pencil" aria-hidden="true"></i>
                </button>
                </div>
            </div>
            </div>
            <div class="interactive-group-main">
            <div class="description">
                Custom Userlist
            </div>
            </div>
        </div>
    `;

    // Throw it onto the page.
    $('.interactive-group-container').append(groupTemplate);
}

//////////////////////
// On Click Functions
/////////////////////

// Add in a new group on click.
$( ".add-group" ).click(function() {
    addNewGroup();
});