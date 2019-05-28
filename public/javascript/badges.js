
$(document).ready(function() {
    setEarnedBadges();

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


// for each badge image, sets to completed if the badge has been earned
function setEarnedBadges(){
    $(".badge_container").each(function(){
        var portrait = $(this).children(".badge_portrait");
        if($(this).hasClass("completed")){
            $(portrait).css('background-image', 'url(https://conex.herokuapp.com/images/badgePics/' + $(portrait).attr("earned_url") + ')');
        }else{
            $(portrait).css('background-image', 'url(https://conex.herokuapp.com/images/badgePics/' + $(portrait).attr("unearned_url") + ')');
        }
    });
}
