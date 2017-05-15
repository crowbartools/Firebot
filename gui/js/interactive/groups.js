// Group Modal
// This opens up the group modal.
function groupModal(){
    var dbGroup = new JsonDB("./user-settings/groups", true, true);

    // Clear saved settings
    $('.interactive-group-id').text('');
    $('#group-user-list .list').empty();
    $('#editGroupLabel').text('Add Group');
    $('.delete-group-button').hide();

    // Set default variable for listjs
    var usernames = [];
    
    // Set options for the list.
    var options = {
        valueNames: [ 'username' ],
        page: 10,
        pagination: true,
        item: '<li class="group-item pill"><p class="content username"></p><button class="btn btn-danger remove-group-user pull-right">X</button></li>'
    };

    // Initalize List
    groupUserList = new List('group-user-list', options, usernames);

    // Show modal
    $('#edit-group-modal').modal('toggle');
}

// Add New Group
// This button adds a new group to the app.
function refreshGroups(){
    var dbGroup = new JsonDB("./user-settings/groups", true, true);

    // TODO: Clear groups in ui, then loop through json and add in all groups.
    $('.interactive-group-container').empty();

    // Loop through json.
    var groups = dbGroup.getData('/');
    for(group in groups){
        var uniqueid = getUniqueId();
        var groupName = group;

        var groupTemplate = `
            <div class="interactive-group-wrap col-sm-12 col-md-3 group${uniqueid}">
                <div class="interactive-groupheader">
                <div class="interactive-group-name pull-left">
                    ${groupName}
                </div>
                <div class="interactive-group-controls pull-right">
                    <div class="edit-interactive-control">
                    <button class="edit-group btn btn-default" group="${uniqueid}">
                        <i class="fa fa-pencil" aria-hidden="true"></i>
                    </button>
                    </div>
                </div>
                </div>
                <div class="interactive-group-main">
                <div class="description">
                    Custom Group
                </div>
                </div>
            </div>
        `;

        // Throw it onto the page.
        $('.interactive-group-container').append(groupTemplate);
    }

    // Edit group on click.
    $( ".edit-group" ).click(function() {
        var uniqueid = $(this).attr('group');
        editGroupModal(uniqueid);
    });
}

// Edit Group
// This function edits a group.
function editGroupModal(uniqueid){
    var dbGroup = new JsonDB("./user-settings/groups", true, true);
    var groupName = $('.group'+uniqueid+' .interactive-group-name').text().trim();
    var group = dbGroup.getData('/'+groupName);

    // Load up group name.
    $('.interactive-group-id').val(groupName);
    $('#group-user-list .list').empty();

    // Load up UserList.
    var usernames = []
    for (user of group.users){
        usernames.push( {username: user} );
    }
    
    // Set options for the list.
    var options = {
        valueNames: [ 'username' ],
        page: 10,
        pagination: true,
        item: '<li class="group-item pill"><p class="content username"></p><button class="btn btn-danger remove-group-user pull-right">X</button></li>'
    };

    // Initalize List
    groupUserList = new List('group-user-list', options, usernames);


    // Change modal title to edit.
    $('#editGroupLabel').text('Edit Group');

    // Show delete button.
    $('.delete-group-button').show();

    // Show modal
    $('#edit-group-modal').modal('toggle');

}

// Add Username
// This adds a username to the current list.
function addGroupUsername(groupUserList){
    var inputData = $('.user-group-addition input').val();
    var username = {username: inputData};
    console.log(username);

    // Add user to list and json.
    groupUserList.add(username);

    // Clear Field
    $('.user-group-addition input').val('');

};

// Save List
// Takes the entire finished list and saves it.
function saveGroupUserlist(groupUserList, groupName){
    var dbGroup = new JsonDB("./user-settings/groups", true, true);
    var users = [];

    // Loop through final list.
    for(user of groupUserList.items){
        users.push( user['_values'].username );
    }

    // Push to db
    dbGroup.push('./'+groupName+'/groupName', groupName);
    dbGroup.push('./'+groupName+'/users', users);
}

// Delete Group
function deleteGroup(){
    var dbGroup = new JsonDB("./user-settings/groups", true, true);

    // Get name of current board
    var groupName = $('.interactive-group-id').val();

    // Delete it
    dbGroup.delete('/'+groupName);

    // Refresh the list.
    refreshGroups();
}

//////////////////////
// On Click Functions
/////////////////////

// Add in a new group on click.
$( ".add-group" ).click(function() {
    groupModal('new');
});

// Initialize Remove Button
$('.remove-group-user').click(function() {
    var username = $(this).closest('.group-item').find('.username').text();
    groupUserList.remove('username', username);
});

// Initialize Add Button
$('.user-group-addition button').click(function() {
    addGroupUsername(groupUserList);
});

// Save group modal on click.
$( ".group-edit-save" ).click(function() {
    var groupName = $('.interactive-group-id').val();
    saveGroupUserlist(groupUserList, groupName);
    refreshGroups();
});

// Initialize Delete Button
$('.delete-group-button').click(function() {
    deleteGroup();
});

//////////////////////
// On App start
/////////////////////
refreshGroups();
