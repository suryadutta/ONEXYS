
$(document).ready(function() {
    setEarnedBadges();
});


// for each badge image, sets to completed if the badge has been earned
function setEarnedBadges(){
    $(".badge_container").each(function(badge){
        var portrait = badge.children(".badge_portrait");
        if(badge.hasClass("completed")){
            portrait.css('background-image', 'url(https://conex.herokuapp.com/images/badgePics/' + portrait.attr("earned_url") + ')');
        }else{
            portrait.css('background-image', 'url(https://conex.herokuapp.com/images/badgePics/' + portrait.attr("unearned_url") + ')');
        }
    });
}

$(".completed .badge_portrait").hover(
    function(){
        // mouse in
        $(this).css('background-image', 'url(https://conex.herokuapp.com/images/badgePics/' + $(this).attr("earned_hover_url") + ')');
    }, function(){
        // mouse out
        $(this).css('background-image', 'url(https://conex.herokuapp.com/images/badgePics/' + $(this).attr("earned_url") + ')');
    }
);
