// Manages the display of luckies!

$(document).ready(function() {
    $(".full_background").removeClass('hide');
});

$(".full_background").click(function(){
    console.log("Hide!");
    $(".full_background").addClass('hide');
});
