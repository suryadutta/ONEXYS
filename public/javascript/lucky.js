// Manages the display of luckies!

$(document).ready(function() {
    $(".full_background").classList.remove('hide');
    alert("Fade in!");
});

$(".full_background").addEventListener('click', function(){
    $(".full_background").classList.add('hide');
    alert("Fade out!");
});
