window.serverUrl = 'http://lamk.net/api/';

var settings = {
    
    maxsize: 300,
    fontscale: 12
  
}

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
    
    renderCategories(ajaxCall('getstaffdata'));
}

function renderCategories(cats) {
    cats.success(function(data) {
        var i = 0;
        var $li = $("<li style='display: none'></li>");
        
        $.each(data.categories, function() {
            var html = [
                '<div class="admin-panel-cat">\n',
                    '<div class="admin-panel-cat-content">\n',
                        '<h3 class="category-title">'+this.catname+'</h3>\n',
                        '<div class="sphere green clearfix"><p>'+this.stats.positivepercent+' %</p></div>\n',
                        '<div class="sphere yellow clearfix"><p>'+this.stats.neutralpercent+' %</p></div>\n',
                        '<div class="sphere grey clearfix"><p>'+this.stats.negativepercent+' %</p></div>\n',
                        '<div class="category-thumb"><img src="img/icon_like_positive_active.png" /></div>\n',
                        '<div class="category-data">\n',
                            '<div>Palautteita yhteensä:<span class="num">'+this.stats.count+'</span></div>\n',
                            '<div>joista</div>\n',
                            '<div class="positive">Positiivisia:<span class="num">'+this.stats.countpositive+'</span></div>\n',
                            '<div class="neutral">Neutraaleja:<span class="num">'+this.stats.countneutral+'</span></div>\n',
                            '<div class="negative">Negatiivisia:<span class="num">'+this.stats.countnegative+'</span></div>\n',
                        '</div>\n',
                    '</div>\n',
                '</div>\n'
            ].join("");
            
            var $cat = $(html);
            
            if (this.stats.positivepercent > 0) {
                $cat.find("div.green").css({
                    "width": (settings.maxsize * (this.stats.positivepercent / 100)) + "px",
                    "height": (settings.maxsize * (this.stats.positivepercent / 100)) + "px",
                    "font-size": Math.floor(settings.maxsize * (this.stats.positivepercent / 100) / settings.fontscale) + "px"
                });
            } else {
                $cat.find("div.green").remove();
            }
            
            if (this.stats.neutralpercent > 0) {
                $cat.find("div.yellow").css({
                    "width": (settings.maxsize * (this.stats.neutralpercent / 100)) + "px",
                    "height": (settings.maxsize * (this.stats.neutralpercent / 100)) + "px"
                });
            } else {
                $cat.find("div.yellow").remove();
            }
            
            if (this.stats.negativepercent > 0) {
                $cat.find("div.grey").css({
                    "width": (settings.maxsize * (this.stats.negativepercent / 100)) + "px",
                    "height": (settings.maxsize * (this.stats.negativepercent / 100)) + "px"
                });
            } else {
                $cat.find("div.grey").remove();
            }
            $li.append($cat);
            
            i++;
            if (i == 3) {
                $li.appendTo("#admin-panel-slider ul");
                
                i = 0;
                $li = $("<li style='display: none'></li>");
            }
        });
        
        if (i > 0) {
            $li.appendTo("#admin-panel-slider ul");
        }
        
        $('.sphere p').each(function() {
            $(this).css({'position':'relative', 'top':'50%', 'overflow':'hidden', 'margin-top':-(parseInt($(this).height() + 20) / 2) + 'px'});
        })
        
        $("#admin-panel-slider li:first").css("display", "block");
        
        if ( Modernizr.csstransforms ) {
            window.swipe = new Swipe(document.getElementById('admin-panel-slider'));
        }
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