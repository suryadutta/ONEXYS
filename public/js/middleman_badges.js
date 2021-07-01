// COURSE ID AVAILABLE IN:
// courseIDFromURL
const hostname = "https://educationvirginia.instructure.com/";
$(document).ready(function () {
  $.get(herokuAPI + "/users/progress", {
    hostname,
    courseID,
    userID,
  })
    .then((userProgress) => {
      getBadges(userProgress.badges);
    })
    .catch((err) => {
      getBadges(null);
      console.log(err);
      alert(
        "Failed to retrieve user progress. The badges will be loaded, but omits user progress."
      );
    });
});

function getBadges(progress) {
  $.get(herokuAPI + "/badges", {
    hostname,
    courseID,
  })
    .then((badges) => {
      if (!progress) writeBadges(badges, null);
      else writeBadges(badges, progress);
    })
    .catch((err) => {
      console.log(err);
    });
}

function writeBadges(badges, progress) {
  var badgeHTML = ``;

  badges.map((badge) => {
    let completed = progress && progress[badge._id] && progress[badge._id].has ? "completed" : "";
    badgeHTML += `<div class="badge_container ${completed}"><div class="badge_descriptor badge_box"><h3>${badge.Title}</h3><p>${badge.Description}</p></div><div class="badge_points badge_box"><p>${badge.Points}</p></div>`;

    if (completed === "completed")
      badgeHTML += `<div class="badge_portrait" style="background-image: url(${badge.EarnedHoverURL})"></div><div class="badge_portrait front_portrait" style="background-image: url(${badge.EarnedURL})"></div>`;
    else
      badgeHTML += `<div class="badge_portrait" style="background-image: url(${badge.UnearnedURL})"></div>`;

    badgeHTML += `<div class="badge_label badge_box"><h3>${badge.Portrait}</h3><p>${badge.PortraitDescription}</p></div></div>`;
  });
  $("#badge_display").html(badgeHTML);
}
