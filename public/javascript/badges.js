
$(document).ready(function() {
    setEarnedBadges();

    $(".completed .badge_portrait").hover(
        function(event){
            // mouse in
            $(this).css('background-image', 'url(https://conex.herokuapp.com/images/badgePics/' + $(this).attr("earned_hover_url") + ')');
        }, function(event){
            // mouse out
            $(this).css('background-image', 'url(https://conex.herokuapp.com/images/badgePics/' + $(this).attr("earned_url") + ')');
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
