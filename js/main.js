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
    
    $(".sort-button-wrapper .admin-panel-button").click(function() {
        $(".sort-button-wrapper .admin-panel-button").removeClass("act");
        $(this).addClass("act");
        
        return false;
    });
    
    /* menun klikkailut */
    $("#admin-panel-menu a.app-link").click(function(event) {
        event.preventDefault();
        var href = $(this).attr("href").split("#")[1];
        
        $(".admin-view").hide();
        $("#admin-panel-" + href).show();
        
        if ($("#admin-panel-summary").is(":hidden")) {
            $("#admin-panel-arrows-container").hide();
        } else {
            $("#admin-panel-arrows-container").show();
        }
    });
    
    /* näytä palautteet */
    $("#admin-panel-container").on("click", "div.show-comments", function() {
        var catid = $(this).parent(".admin-panel-cat").attr("id");
        var catname = $(this).prev(".admin-panel-cat-content").find(".category-title").text();
        
        renderComments(ajaxCall('getcomments', catid), catname);
    });
    
    /* paluu palautteiden tarkastelusta */
    $("#admin-panel-container").on("click", "a.back-link", function(event) {
        event.preventDefault();
        
        $("#admin-panel-comments").remove();
        $("#admin-panel-summary").show();
        $("#admin-panel-arrows-container").show();
        renderCategories(ajaxCall('getstaffdata'));
    });
    
    /* palautteiden poisto */
    $("#admin-panel-container").on("click", "div.button-delete", function() {
        var id = $(this).parent("div.comment-container").attr("id");
        
        ajaxCall('deletecomment', id).success(function(data) {
            if (data.status != 0) {
                $("#admin-panel-comments #"+id).remove();
            } else {
                $.each(data.errors, function(i,item){
                    alert(item);
                });
            }
        });
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
        
        ajaxCall('logincheck').success(function(loginData) {
            if (loginData.status != 0) {
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
                            '<div class="admin-panel-button show-comments"><span>Näytä palautteet</span></div>\n',
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
            } else {
                $("#login-box-container").show();
                $("#admin-panel-container").hide();
            }
        });
        
        
    });
    
}

function renderCharts(charts) {
    charts.success(function(data) {
        if(data.status != 0){
             var plot = {
                 width: 600,
                 height: 300
             };
             
             if (parseInt($("window").width()) < 600) {
                 plot.width = 400;
                 plot.height = 200;
             }
           
            $.each(data.categories, function(i,item){
                $('#plots').append('<div class="admin-panel-cat-chart"><div id="plot'+item.catid+'" class="chart-wrapper"><div class="chart-data"><h3 class="category-title">'+item.catname+'</h3><div class="plot" style="width:'+plot.width+'px;height:'+plot.height+'px;"></div></div></div></div>');        
                
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

function renderComments(comments, catname) {
    comments.success(function(data) {
        $("#admin-panel-summary li").remove();
        $("#plots .admin-panel-cat-chart").remove();
                
        ajaxCall('logincheck').success(function(loginData) {
            if (loginData.status != 0) {
                $("#admin-panel-container").append('<div id="admin-panel-comments"><div id="comments-menu"><div class="button-back"><a class="back-link" href="#">&lsaquo;</a></div><h3>Palautteet - '+catname+'</h3></div><div class="comments-wrapper"></div></div>');
        
                if (data.status != 0) {
                    $.each(data.comments, function(i,item){
                        var d = new Date(item.timestamp * 1000);
                        var month = d.getMonth()+1;
                        var dateTime = d.getDate()+"."+month+"."+d.getFullYear()+" klo "+("0" + d.getHours()).slice(-2)+":"+("0" + d.getMinutes()).slice(-2);
                        var likes = item.thumbcountplus+" tykkää<br>"+item.thumbcountminus+" ei tykkää"

                        $("#admin-panel-comments .comments-wrapper").append('<div id="'+item.id+'" class="comment-container"><div class="comment-data"><p class="comment">'+item.text+'</p><p class="date white">'+dateTime+'</p><p class="thumbs white">'+likes+'</p></div><div class="button-delete">	 –  </div></div>');
                    });
                }

                $("#admin-panel-arrows-container").hide();
                $("#admin-panel-summary").hide();
            } else {
                $("#login-box-container").show();
                $("#admin-panel-container").hide();
            }
        });
        
        
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
    
function ajaxCall() {
    
    var data = {
        act: arguments[0]
    };
    
    if (data.act == 'login') {
        data.email = arguments[1];
        data.password = arguments[2];
    } else if (data.act == 'getcomments') {
        data.catid = arguments[1];
    } else if (data.act == 'deletecomment') {
        data.id = arguments[1];
    }
    
    return $.ajax({

        url: window.serverUrl,
        data: data,
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