// Manages the display of luckies!

$(document).ready(function() {
    $(".full_background").removeClass('hide');
});

$("*").click(function(e){
    console.log(e);
});

$(".full_background").click(function(){
    console.log("Hide!");
    $(".full_background").addClass('hide');
});
