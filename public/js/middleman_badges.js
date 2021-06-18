// COURSE ID AVAILABLE IN:
// courseIDFromURL
const hostname = "https://educationvirginia.instructure.com/";
$(document).ready(function () {
  $.get(herokuAPI + "/users/progress", {
    hostname,
    courseID,
  })
    .then((userProgress) => {
      getBadges(userProgress.badges);
    })
    .catch((err) => {
      getBadges(null);
      console.log(err);
      console.log(
        "Failed to retrieve user progress. The page has been loaded, but omitting this data."
      );
    });
});

function getBadges(progress) {
  $.get(herokuAPI + "/badges", {
    hostname,
    courseID,
  })
    .then((badges) => {
      if (!progress) throw "Failed to retrieve user progress.";
      writeBadges(badges, progress);
      // console.log("Badge progress has not been retrieved yet. Display badge progress has been flagged for completion later.")
    })
    .catch((err) => {
      // TODO
      writeBadges(badges, {});
      console.log("Badge loading failed.");
    });
}

function writeBadges(badges, progress) {
  var badgeHTML = ``;

  badges.map((badge) => {
    let completed = progress[badge._id] && progress[badge._id].has ? "completed" : "";
    badgeHTML += `<div class="badge_container ${completed}"><div class="badge_descriptor badge_box"><h3>${badge.Title}</h3><p>${badge.Description}</p></div><div class="badge_points badge_box"><p>${badge.Points}</p></div>`;

    if (completed === "completed")
      badgeHTML += `<div class="badge_portrait" style="background-image: url(${badge.EarnedHoverURL})"></div><div class="badge_portrait front_portrait" style="background-image: url(${badge.EarnedURL})"></div>`;
    else
      badgeHTML += `<div class="badge_portrait" style="background-image: url(${badge.UnearnedURL})"></div>`;

    badgeHTML += `<div class="badge_label badge_box"><h3>${badge.Portrait}</h3><p>${badge.PortraitDescription}</p></div></div>`;
  });
  $("#badge_display").html(badgeHTML);
}
