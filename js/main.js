window.serverUrl = 'http://lamk.net/api/';

var settings = {
    
    maxsize: 320,
    minsize: 12, // prosentteina columnin leveydestä
    fontscale: 4,
    minfont: 14
  
}

$(document).ready(function() {
    
    settings.maxsize = Math.floor($(window).width() / 3 * 0.8);
    
    // initial login check
    handleLogin(ajaxCall('logincheck'));
    
    $("#login-form").submit(function(event) {
        event.preventDefault();
        
        doLogin();
    });
    
    test("fuu", "faa", "fee");
    
    $(".sort-button-wrapper .admin-panel-button").click(function() {
        $(".button-wrapper .admin-panel-button").removeClass("act");
        $(this).addClass("act");
        
        return false;
    });
    
    /* menun klikkailut */
    $("#admin-panel-menu a.admin-menu-link").click(function(event) {
        event.preventDefault();
        var href = $(this).attr("href").split("#")[1];
        
        $(".admin-view").hide();
        $("#admin-panel-" + href).show();
    });
    
    /* ikkunan koon muuttuessa.. */
    $(window).resize(function() {
        settings.maxsize = Math.floor($(window).width() / 3 * 0.8);
        
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
                '<div id="'+this.catid+'" class="admin-panel-cat">\n',
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
                    '<div class="admin-panel-button"><span>Näytä palautteet</span></div>\n',
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
                $li.appendTo("#admin-panel-summary ul");
                
                i = 0;
                $li = $("<li style='display: none'></li>");
            }
        });
        
        if (i > 0) {
            while (i < 3) {
                $li.append('<div class="admin-panel-cat"></div>');
                i++;
            }
            
            $li.appendTo("#admin-panel-summary ul");
        }
        
        // keskitetään pallojen teksti pystysuunnassa
        centerBallsText();
        
        $("#admin-panel-summary li:first").css("display", "block");
        
        if (Modernizr.csstransforms) {
            window.swipe = new Swipe(document.getElementById('admin-panel-summary'));
        }
        
        if (!Modernizr.touch) {
            $("#admin-panel-arrows-container").show();
        }
        
        /* haetaan kaavioiden data ja renderöidään se näytölle */
        renderCharts(ajaxCall('getstaffchartdata'));
    });
    
}

function renderCharts(charts) {
    charts.success(function(data) {
        if(data.status != 0){
            $.each(data.categories, function(i,item){
                $('#plots').append('<div class="admin-panel-cat-chart"><div id="plot'+item.catid+'" class="chart-wrapper"><div class="chart-data"><h3 class="category-title">'+item.catname+'</h3><div class="plot" style="width:600px;height:300px;"></div></div></div></div>');        
                
                var dNegative = [];
                var dNeutral = [];
                var dPositive = [];

                $.each(item.dates, function(i,item){
                    dNegative.push([item.date*1000, item.negativepercent]);
                    dNeutral.push([item.date*1000, item.neutralpercent]);
                    dPositive.push([item.date*1000, item.positivepercent]);
                });

                createPlot('plot'+item.catid, dNegative, dNeutral, dPositive);
            });
            
            $('#plots').find('.plot').prepend('<div class="thumbs-wrapper"><img src="/staff/img/icon_like_positive_active.png"><img src="/staff/img/icon_like_neutral_active.png"><img src="/staff/img/icon_like_negative_active.png"></div>');
        }else{
            $.each(data.errors, function(i,item){
                alert(item);
            });
        }
    });
}

/**
* Function for creating a plot
* @param d1 First data array
* @param d2 Second data array
* @param d3 Third data array
*/
function createPlot(element, d1, d2, d3){
       d1 = UTCcorrection(d1, 2);
       d2 = UTCcorrection(d2, 2);
       d3 = UTCcorrection(d3, 2);

       $.plot(
               $("#"+element+' div.plot'), 
               [ 
                       {label: 'Negative', data: d1, color:'#c5c6c8'}, 
                       {label:'Neutral', data:d2, color:'#f0eaa4'}, 
                       {label:'Positive', data:d3, color:'#c4d691'} 
               ], {
               series: {
                       stack: 0,
                       lines: { show: true, fill: true }
               },
               xaxis: { 
                       mode: "time",
                       timeformat: "%d.%m",
                       color: "#FFF"
               },
               yaxis: {
                       min: 0,
                       max: 100
               }
       });
}

/**
* Flot always display time as UTC0, so we're correcting the time by given correction
* @param data Array of data
* @param correction Correction as hour
* @return Array of the corrected array
*/
function UTCcorrection(data, correction){
       for(var i = 0; i < data.length; ++i){
               data[i][0] += 60 * 60 * 1000 * correction;
       }
       return data;
}

/* Helper functions */
    
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

function test() {
	for( var i = 0; i < arguments.length; i++ ) {
		console.log("This accident was caused by " + arguments[i]);
	}
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
                var size = settings.maxsize * (data[prop] / 100);
                
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