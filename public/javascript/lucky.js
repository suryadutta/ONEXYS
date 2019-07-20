// Manages the display of luckies!

$(document).ready(function() {
    // Hide on click
    $(".full_background").click(function(e){
        console.log("Hide!");
        $(".full_background").fadeOut(500);
    });

    // Show for max of 7 seconds
    $(".full_background").fadeIn(1000).delay(7000).fadeOut(500);
});
