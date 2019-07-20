// Manages the display of luckies!

$(document).ready(function() {
    $(".full_background").removeClass('hide');
    alert("Fade in!");
});

$(".full_background").addEventListener('click', function(){
    $(".full_background").addClass('hide');
    alert("Fade out!");
});
