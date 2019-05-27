
$(document).ready(function() {
    setEarnedBadges();
});


// for each badge image, sets to completed if the badge has been earned
function setEarnedBadges(){
    $("#badge_display").children().forEach(function(badge){
        if(badge.hasClass("completed")){
            badge.children(".badge_portrait").css('background-image', 'url(https://conex.herokuapp.com/images/badgePics/' + badge.attr("earned_url") + ')');
        }else{
            badge.children(".badge_portrait").css('background-image', 'url(https://conex.herokuapp.com/images/badgePics/' + badge.attr("unearned_url") + ')');
        }
    });
}
