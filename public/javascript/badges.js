
$(document).ready(function() {
    setEarnedBadges();
});


// for each badge image, sets to completed if the badge has been earned
function setEarnedBadges(){
    $(".badge_container").each(function(){
        var portrait = $(this).children(".badge_portrait");
        if($(this).hasClass("completed")){
            console.log($(portrait).attr("earned_url"));
            $(portrait).css('background-image', 'url(https://conex.herokuapp.com/images/badgePics/' + $(portrait).attr("earned_url") + ')');
        }else{
            console.log($(portrait).attr("unearned_url"));
            $(portrait).css('background-image', 'url(https://conex.herokuapp.com/images/badgePics/' + $(portrait).attr("unearned_url") + ')');
        }
    });
}

$(".completed .badge_portrait").hover(
    function(){
        // mouse in
        console.log("over!");
        $(this).css('background-image', 'url(https://conex.herokuapp.com/images/badgePics/' + $(this).attr("earned_hover_url") + ')');
    }, function(){
        // mouse out
        console.log("out!");
        $(this).css('background-image', 'url(https://conex.herokuapp.com/images/badgePics/' + $(this).attr("earned_url") + ')');
    }
);
