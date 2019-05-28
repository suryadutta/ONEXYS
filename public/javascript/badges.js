
$(document).ready(function() {

    $(".completed .badge_portrait").hover(
        function(event){
            // mouse in
            $(this).css('opacity', '0');
        }, function(event){
            // mouse out
            $(this).css('opacity', '1');
        }
    );
});
