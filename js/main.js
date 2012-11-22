window.serverUrl = 'http://lamk.net/api/';

var settings = {
    
    maxsize: 320,
    minsize: 10, // prosentteina columnin leveydestä
    fontscale: 4,
    minfont: 14
  
}

$(document).ready(function() {
    
    settings.maxsize = Math.floor($(window).width() * 0.33 * 0.77);
    
    // initial login check
    handleLogin(ajaxCall('logincheck'));
    
    $("#login-form").submit(function(event) {
        event.preventDefault();
        
        doLogin();
    });
    
    $(window).resize(function() {
        settings.maxsize = Math.floor($(window).width() * 0.33 * 0.77);
        
        $("div.sphere").each(function() {
            var percent = ( 100 * $(this).width() / $(this).parent().width() );
            $(this).css({"height": $(this).width() + "px"});
            $(this).css({'font-size': scaleFontSize(percent)});
        });
        
        centerBallsText();
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
                        '<div class="content-balls-wrapper">\n',
                            '<div class="sphere green clearfix"><p>'+this.stats.positivepercent+'%</p></div>\n',
                            '<div class="sphere yellow clearfix"><p>'+this.stats.neutralpercent+'%</p></div>\n',
                            '<div class="sphere grey clearfix"><p>'+this.stats.negativepercent+'%</p></div>\n',
                        '</div>\n',
                        '<div class="category-thumb"><img src="'+getIconImgUrl(this.stats)+'" /></div>\n',
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
            
            // lasketaan pallojen korkeudet taulukkoon
            var heights = calcBallSizes(this.stats);

            // asetetaan pallojen koot
            $cat.find("div.green").css({
                "width": (this.stats.positivepercent < settings.minsize) ? settings.minsize + "%" : this.stats.positivepercent + "%",
                "height": heights['positivepercent'] + "px",
                "font-size": scaleFontSize(this.stats.positivepercent) + "px"
            });

            $cat.find("div.yellow").css({
                "width": (this.stats.neutralpercent < settings.minsize) ? settings.minsize + "%" : this.stats.neutralpercent + "%",
                "height": heights['neutralpercent'] + "px",
                "font-size": scaleFontSize(this.stats.neutralpercent) + "px"
            });
            
            $cat.find("div.grey").css({
                "width": (this.stats.negativepercent < settings.minsize) ? settings.minsize + "%" : this.stats.negativepercent + "%",
                "height": heights['negativepercent'] + "px",
                "font-size": scaleFontSize(this.stats.negativepercent) + "px"
            });
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
        
        // keskitetään pallojen teksti pystysuunnassa
        centerBallsText();
        
        $("#admin-panel-slider li:first").css("display", "block");
        
        if ( Modernizr.csstransforms ) {
            window.swipe = new Swipe(document.getElementById('admin-panel-slider'));
        }
    });
    
}

function scaleBalls() {
    
}

/* helper functions */
    
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

function getIconImgUrl(data) {
    var url = "";
    var maxProp = null;
    var maxValue = -1;
    for (var prop in data) {
        if (prop == 'countpositive' || prop == 'countneutral' ||prop == 'countnegative') {
            if (data.hasOwnProperty(prop)) {
                var value = data[prop];
                if (value > maxValue) {
                    maxProp = prop;
                    maxValue = value;
                }
            }
        }
    }
    
    if (maxProp == 'countpositive') {
        url = "/staff/img/icon_like_positive_active.png"
    } else if (maxProp == 'countneutral') {
        url = "/staff/img/icon_like_neutral_active.png"
    } else if (maxProp == 'countnegative') {
        url = "/staff/img/icon_like_negative_active.png"
    }
    
    return url;
}

function calcBallSizes(data) {
    var ret = {};
    
    for (var prop in data) {
        if (prop == 'positivepercent' || prop == 'neutralpercent' ||prop == 'negativepercent') {
            if (data.hasOwnProperty(prop)) {
                var size = parseInt( settings.maxsize * (data[prop] / 100) );
                
                ret[prop] = ((settings.minsize * settings.maxsize / 100) > size) ? (settings.minsize * settings.maxsize / 100) : size;
            }
        }
    }
    
    return ret;
}

function scaleFontSize(data) {
    var size = Math.floor(settings.maxsize * (data / 100) / settings.fontscale);
    
    return (settings.minfont > size) ? settings.minfont : size;
}

function centerBallsText() {
    $('.sphere p').each(function() {
        $(this).css({'position':'relative', 'top':'50%', 'overflow':'hidden', 'margin-top':-(parseInt($(this).css('line-height')) / 2) + 'px'});
    })
}