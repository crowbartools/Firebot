const JsonDB = require('node-json-db');
const request = require('request');

var dbSettings = new JsonDB("./app-settings/settings", true, false);
var dbAuth = new JsonDB("./user-settings/auth", true, false);

// Options
var options = {
    client_id: dbSettings.getData('/client_Id'),
    scopes: dbSettings.getData('/scopes')
};

// Login Kickoff
function login(type){
    // Make a request to get a shortcode.
    request.post({url:'https://beam.pro/api/v1/oauth/shortcode', form: {client_id: options.client_id, scope: options.scopes}}, function(err,httpResponse,body){
        if (err === null){
            // Success!
            var body = JSON.parse(body);
            var handle = body.handle;
            var code = body.code;

            // Display a popup with the six digit code and instructions.
            loginModal(code);

            // Start check loop every second until we either get a 403, 404, or 200 response.
            // Once response is received close the popup window.
            loginLoop(handle, type);

        } else {
            console.log(err);
        }
    })
}

// Login Modal
// This function pop up a modal with the six digit code to approve access.
function loginModal(code){
    var modalTemplate = `<div class="modal fade" id="loginModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                            <div class="modal-dialog" role="document">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title" id="exampleModalLabel">Login Code</h5>
                                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                        </button>
                                    </div>
                                    <div class="modal-body">
                                        <p>Click the code below to be taken to an authorization page. On the auth page please paste in the code to give Firebot access to run on your account.</p>
                                        <div class="login-code">Code: <br> <a href="https://beam.pro/go">${code}</a></div>
                                    </div>
                                </div>
                            </div>
                        </div>`;

    // Put it in the html and render it.
    $('body').append(modalTemplate);
    $('#loginModal').modal(options);

    // When this modal gets hidden, remove it from the html.
    $('#loginModal').on('hidden.bs.modal', function (e) {
        $('#loginModal').remove();
    })
}

// Login Loop
// The login loop waits for the user to put in the six digit code, then grabs auth tokens.
function loginLoop(handle, type){

    var refreshInterval = setInterval(function(){
        request.get('https://beam.pro/api/v1/oauth/shortcode/check/'+handle, function (error, response, body) {
            var status = response.statusCode;

            // User denied access or key expired.
            if(status === 403 || status === 404){

                // Close and remove modal.
                $('#loginModal').modal('hide');

                // Stop loop
                clearInterval(refreshInterval);
            }

            // User Approved Access
            if(status === 200){
                var body = JSON.parse(body);
                var code = body.code;

                // Take the code and send it off for the auth tokens info.
                request.post({url:'https://beam.pro/api/v1/oauth/token', form: {client_id: options.client_id, code: code, grant_type: "authorization_code"}}, function(err,response,body){
                    if (err === null){
                        console.log('Success! Trying to get token...');
                        var body = JSON.parse(body);
                        // Success!
                        var accessToken = body.access_token;
                        var expires = body.expires_in;
                        var refreshToken = body.refresh_token;
                        var tokenType = body.token_type;

                        // Awesome, we got the auth token. Now to save it out for later.
                        userInfo(type, accessToken, expires, refreshToken);              

                    } else {
                        console.log(err);
                    }
                })

                // Close and remove modal.
                $('#loginModal').modal('hide');

                // Stop loop
                clearInterval(refreshInterval);
            }
        })
    }, 2000);

}

// User Info
// This function grabs info from the currently logged in user.
function userInfo(type, accessToken, expires, refreshToken){

    // Request user info and save out everything to auth file.
    request({
        url: 'https://beam.pro/api/v1/users/current',
        auth: {
            'bearer': accessToken
        }
    }, function(err, res) {
        var data = JSON.parse(res.body);

        // Calc token expire time in milliseconds.
        var curTime = new Date().getTime();
        var expireTime = curTime + 21599000;

        // Push all to db.
        dbAuth.push('./'+type+'/username', data.username);
        dbAuth.push('./'+type+'/userId',data.id);
        dbAuth.push('./'+type+'/channelId',data.channel.id);
        dbAuth.push('./'+type+'/avatar',data.avatarUrl);
        dbAuth.push('./'+type+'/accessToken',accessToken);
        dbAuth.push('./'+type+'/refreshToken',refreshToken);
        dbAuth.push('./'+type+'/tokenExpires',expireTime);

        // Style up the login page.
        loadLogin();
    });
}

// Load Login
// This function styles up the login page if there is info saved for anyone.
function loadLogin(){
    // Get streamer info.
    try {
        var streamer = dbAuth.getData('/streamer');
    } catch(error) {
        console.log('No streamer logged into the app.')
        var streamer = '';
    }
    // Get bot info
    try {
        var bot = dbAuth.getData('/bot');
    } catch(error) {
        console.log('No bot logged into the app.')
        var bot = '';
    }

    if (streamer !== ''){
        var username = dbAuth.getData('/streamer/username');
        var avatar = dbAuth.getData('/streamer/avatar');

        // Put avatar and username on page.
        $('.streamer-login h2').text(username);
        $('.streamer-login img').attr('src', avatar);

        // Flip the login button.
        $('.streamer-login button').removeClass('btn-success').addClass('btn-danger').text('Logout').attr('action','logout');

    }

    if (bot !== ''){
        var username = dbAuth.getData('/bot/username');
        var avatar = dbAuth.getData('/bot/avatar');

        $('.bot-login h2').text(username);
        $('.bot-login img').attr('src', avatar);

        // Flip the login button.
        $('.bot-login button').removeClass('btn-success').addClass('btn-danger').text('Logout').attr('action','logout');
    }
}

// Logout
// This will remove user info and log someone out.
function logout(type){
    if(type == "streamer"){
        $('.streamer-login h2').text('Broadcaster');
        $('.streamer-login img').attr('src','./images/placeholders/default.jpg');

        // Flip login button
        $('.streamer-login button').addClass('btn-success').removeClass('btn-danger').text('Login').attr('action','login');

        // Delete Info
        dbAuth.delete('/streamer');
    } else {
        $('.bot-login h2').text('Broadcaster');
        $('.bot-login img').attr('src','./images/placeholders/default.jpg');

        // Flip login button
        $('.bot-login button').addClass('btn-success').removeClass('btn-danger').text('Login').attr('action','login');

        // Delete Info
        dbAuth.delete('/bot');
    }
}


// Click Handlers
// Handle login buttons
$( ".loginBtn" ).click(function() {
    // Get data attr to see which button was clicked.
    var type = $(this).attr('data');
    var action = $(this).attr('action');

    // If button is ready for login...
    if(action == 'login'){
        login(type);
    } else {
        logout(type);
    }
});


// On App Load
loadLogin()