// Manages the display of luckies!

$(document).ready(function() {
    $(".full_background").removeClass('hide');
});

$("*").click(function(e){
    console.log(e);
});

$(".full_background").click(function(e){
    console.log("Hide!");
    $(".full_background").addClass('hide');
});

$(".lucky_img").click(function(e){
    console.log("Hide2.0!");
    $(".full_background").addClass('hide');
});
