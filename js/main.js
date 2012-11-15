window.serverUrl = 'http://lamk.net/api/';

$(document).ready(function() {
    
    // initial login check
    handleLogin(ajaxCall('logincheck'));
    
    $("#login-form").submit(function(event) {
        event.preventDefault();
        
        doLogin();
    });
});

function doLogin() {

    var email = $("#login-email").val();
    var pwd = hex_sha512($("#login-pwd").val());
    
    handleLogin(ajaxCall('login', email, pwd));
}

function handleLogin(loginState) {
    loginState.success(function(data) {
        if (data.status == 0) {
            $("#login-box-container").show();
            $("#admin-panel-container").hide();
        } else if (data.status == 1) {
            showAdminpanel();
        }
    });
}

function showAdminpanel() {
    $("#login-box-container").hide();
    $("#admin-panel-container").show();
    
    renderCategories(ajaxCall('getcategories'));
}

function renderCategories(cats) {
    cats.success(function(data) {
        $.each(data.categories, function() {
            var html = [
                '<div class="admin-panel-cat">\n',
                        '<div class="admin-panel-cat-content">\n',
                            '<h3 class="category-title">'+this.name+'</h3>\n',
                            '<div class="sphere green clearfix" style="width: 250px; height: 250px;"><p>50 %</p></div>\n',
                            '<div class="sphere yellow clearfix" style="width: 100px; height: 100px;"><p>20 %</p></div>\n',
                            '<div class="sphere grey clearfix" style="width: 50px; height: 50px;"><p>10 %</p></div>\n',
                            '<div class="category-thumb"></div>\n',
                            '<div class="category-data"></div>\n',
                        '</div>\n',
                    '</div>\n'
            ].join("");
            
            var $cat = jQuery(html);
            $cat.appendTo("#admin-panel-cats");
            
            return (this.id != 3)
        });
    });
}
    
function ajaxCall(act, email, password) {
    
    return $.ajax({

        url: window.serverUrl,
        data: {
            act: act,
            email: email,
            password: password
        },
        type: "GET",
        dataType: 'jsonp',
        crossDomain: true,
        cache : "false"

    });

}