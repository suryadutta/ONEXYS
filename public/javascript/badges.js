
$(document).ready(function() {
    setEarnedBadges();
});


// for each badge image, sets to completed if the badge has been earned
function setEarnedBadges(){
    $(".badge_container").each(function(badge){
        var portrait = $(badge).children(".badge_portrait")[0];
        if($(badge).hasClass("completed")){
            console.log('url(https://conex.herokuapp.com/images/badgePics/' + $(portrait).attr("earned_url") + ')');
            $(portrait).css('background-image', 'url(https://conex.herokuapp.com/images/badgePics/' + $(portrait).attr("earned_url") + ')');
        }else{
            console.log('url(https://conex.herokuapp.com/images/badgePics/' + $(portrait).attr("unearned_url") + ')');
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
