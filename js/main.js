window.serverUrl = 'http://lamk.net/api/';

$(document).ready(function() {
    
    // initial login check
    ajaxCall('logincheck');
    
    $("#login-form").submit(function(event) {
        event.preventDefault();
        
        login();
    });
    
});

function login() {

    var email = $("#login-email").val();
    var pwd = hex_sha512($("#login-pwd").val());
    
    ajaxCall('login', email, pwd);
}
    
function ajaxCall(act, email, password) {
    
    $.ajax({

        url: window.serverUrl,
        data: {
            act: act,
            email: email,
            password: password
        },
        type: "GET",
        dataType: 'jsonp',
        crossDomain: true,
        cache : "false",
        success: function(data){
            if (act == 'logincheck' && data.status == 0) {
                $("#login-box").show();
            } else if (act == 'login' && data.status == 1) {
                $("#login-box").hide();
            }
        }

    });

}