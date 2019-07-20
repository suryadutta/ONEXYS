// Manages the display of luckies!

$(document).ready(function() {
    $(".full_background").fadeIn(500);

    // Hide on click
    $(".full_background").click(function(e){
        console.log("Hide!");
        $(".full_background").fadeOut(500);
    });
});
