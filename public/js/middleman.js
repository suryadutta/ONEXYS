// ACCESS CURRENT COURSE ID WITH:
// courseIDFromURL

$(document).ready(function () {
  // Contains all AJAX calls necessary to interface with system API
  // TODO: find way to supply hostname
  const hostname = "https://educationvirginia.instructure.com/"; // assume URL formatted as "https://hostname/courses/courseID"

  var getHomeUpdates = new Promise((resolve, reject) => {
    $.get(herokuAPI + "/home/updates", {
      hostname,
      courseID,
    })
      .done((data, status) => {
        resolve(data);
      })
      .fail((err) => reject(err));
  })
    .then((data) => {
      writeUpdates(data.updates);
      //$("#dailyTaskImg").css("height", ""); // Set back to default height
      if (data.daily.id == null)
        $("#dailyTaskLink").prop(
          "href",
          `${herokuAPI.substring(0, herokuAPI.length - 3)}missing-resource`
        );
      else if (data.daily.id == -1)
        $("#dailyTaskLink").prop("href", `${herokuAPI.substring(0, herokuAPI.length - 3)}not-open`);
      else
        $("#dailyTaskLink").prop(
          "href",
          `${herokuAPI.substring(0, herokuAPI.length - 3)}assignments/${data.daily.id}`
        );
    })
    .catch((err) => {
      console.log(err);
      $("#updates").append(
        `<h2>Updates</h2><div class="entry"><p class="entry_header"><strong>Updates could not be retrieved.</strong></p></div>`
      ); // Write updates to DOM
      $("#LoG_title").text("Available Videos"); // Write Life on Grounds name to DOM
      $("#LoG_link").text(""); // Write Life on Grounds name to DOM
      $("#LoG_link").prop("href", "#"); // Write Life on Grounds link to DOM
      $("#dailyTaskImg").prop("src", ""); // Set daily task image source
      $("#dailyTaskLink").prop(
        "href",
        `${herokuAPI.substring(0, herokuAPI.length - 3)}missing-resource`
      );
      $("#pretest").css("background-image", "");
      $("#posttest").css("background-image", "");
    });

  var getHomeVideos = new Promise((resolve, reject) => {
    $.get(herokuAPI + "/home/videos", {
      hostname,
      courseID,
    })
      .done((data, status) => {
        resolve(data);
      })
      .fail((err) => {
        reject(err);
      });
  })
    .then((data) => {
      // On success, write videos to DOM
      writeVideos(data);
    })
    .catch((err) => {
      console.log(err);
      $("#homepageVideos").html("Video content failed to load."); // Write error message
    });

  //
  var addModuleProgress = false,
    badges = null,
    progress = null;

  // Gets the user's progress, including finished modules and badge status
  var getUserProgress = new Promise((resolve, reject) => {
    $.get(herokuAPI + "/users/progress", {
      hostname,
      courseID,
    })
      .done((data, status) => {
        resolve(data);
      })
      .fail((err) => {
        reject(err);
      });
  })
    .then((data) => {
      if (addModuleProgress) {
        // Modules have been written to DOM. Add in the user's progress
        writeModuleProgress(data);
      } else progress = data;
      if (badges) {
        //console.log("Adding badges from getUserProgress");
        writeBadges(badges);
      } else progress = data;
      //==============================================================
      $("#point_count").text(data.score);
      $("#teamName").text(data.team);
      //$("#teamScore").text("...");
    })
    .catch((err) => {
      console.log(err);
      console.log(
        "Failed to retrieve user progress. The page has been loaded, but omitting this data."
      );
    });

  var loadProgress = new Promise((resolve, reject) => {
    $.get(herokuAPI + "/progress", {
      hostname,
      courseID,
    })
      .done((data, status) => {
        resolve(data);
      })
      .fail((err) => {
        reject(err);
      });
  }).then((data) => {
    // Write module data to DOM
    writeProgress(data);
  });

  var loadModules = new Promise((resolve, reject) => {
    $.get(herokuAPI + "/modules", {
      hostname,
      courseID,
    })
      .done((data, status) => {
        resolve(data);
      })
      .fail((err) => {
        reject(err);
      });
  }).then((data) => {
    // Write module data to DOM
    writeModules(data);
    if (progress) {
      // If user progress has been fetched, go ahead and fill it in
      //console.log("Filling in user progress from loadModules");
      writeModuleProgress(progress.modules);
    } else {
      // Otherwise, mark that progress needs to be added
      addModuleProgress = true;
      //console.log("User progress has not been retrieved yet. It has been flagged for completion later.")
    }
  });

  var loadBadges = new Promise((resolve, reject) => {
    $.get(herokuAPI + "/badges", {
      hostname,
      courseID,
    })
      .done((data, status) => {
        resolve(data);
      })
      .fail((err) => {
        reject(err);
      });
  })
    .then((data) => {
      if (progress) {
        //console.log("Writing badges from loadBadges");
        writeBadges(data);
      } else {
        badges = data;
        //console.log("Badge progress has not been retrieved yet. Display badge progress has been flagged for completion later.")
      }
    })
    .catch((err) => {
      $("#recent_badges").html(
        `
        <h2>Recent Badges</h2>
          <div class="badge_container completed" style="margin-left: 1px; margin-right: 10px; margin-bottom: 20px;">
            <p>Badge loading failed.</p>
          <div>
        `
      );
    });
});

// Write badge progress into DOM
function writeBadges(badgeData) {
  var defaultBadge = { id: null, earned: new Date(0) },
    recents = [defaultBadge, defaultBadge, defaultBadge];

  function leastRecent() {
    return recents.reduce((min, badge, i) => {
      if (isNaN(min)) return 0; // start the min at the 0th element
      return badge.earned < recents[min].earned ? i : min;
    });
  }

  // Filter out all but the three most recent badges
  Object.keys(badgeData).forEach((key) => {
    badgeData[key].id = key;
    recents[leastRecent()] = badgeData[key];
  });
  // Display the 3 most recent badges (stored in recents)
  var badgeHTML = `<h2>Recent Badges</h2>`;
  if (recents.length === 0) {
    badgeHTML += `
      <h2>Recent Badges</h2>
        <div class="badge_container completed" style="margin-left: 1px; margin-right: 10px; margin-bottom: 20px;">
          <p>Earn some badges and you will see them here!</p>
        <div>
      `;
  } else {
    recents.forEach((recentBadge) => {
      if (recentBadge.id) {
        var badge = badgeData.find((item) => item._id == recentBadge.id);
        badgeHTML += `<div class="badge_container completed" style="margin-left: 1px; margin-right: 10px; margin-bottom: 20px;">
                            <div class="badge_portrait" style="width: 80px; height: 100px; background-image: url(${badge.EarnedHoverURL})"></div>
                            <div class="badge_portrait front_portrait" style="width: 80px; height: 100px; background-image: url(${badge.EarnedURL})"></div>
                          </div>`;
      }
    });
  }

  $("#recent_badges").html(badgeHTML);
}

function writeProgress(users) {
  /*var teamscore = {};
  var teampeople = {};
  const userTeam = "";
  var top3 = [];

  users.forEach((user) => {
    if (teamscore[user.team]) {
      teamscore[user.team] += user.score;
    } else {
      teamscore[user.team] = 0;
      teamscore[user.team] += user.score;
    }

    if (teampeople[user.team]) {
      teampeople[user.team] += 1;
    } else {
      teampeople[user.team] = 1;
    }

    console.log(teamscore[user.team]);

    if ($("#teamName").text() === user.team) {
      console.log(" team name:" + $("#teamName").text());
      userTeam = user.team;
    }
  });

  $("#teamScore").text(teamscore[userTeam]);

  for (var key in teamscore) {
    console.log(key);
    top3.push(teamscore[key] / teampeople[key]);
  }
  $("#leaderboard").html(
    `<tr class="leader"><td></td><td>Devs: ${top3[0]}</td><td></td></tr><tr class="leader"><td></td><td>to load.</td><td></td></tr><tr class="leader"><td></td><td></td><td></td></tr>`
  ); */
}
// Updates
function writeUpdates(updates) {
  $("#updates").html(
    `<h2>Updates</h2><div class="entry"><p class="entry_header"><strong>${updates.main_header}</strong></p><p class="entry_text">${updates.main_text}</p></div><div class="entry"><p class="entry_header"><strong>${updates.header2}</strong></p><p class="entry_text">${updates.text2}</p></div><div class="entry"><p class="entry_header"><strong>${updates.header3}</strong></p><p class="entry_text">${updates.text3}</p></div>`
  ); // Write updates to DOM

  // Life on Grounds information
  $("#recent_badges").append(
    `<div class="badge_container completed" style="margin-left: 1px; margin-right: 10px; margin-bottom: 20px;"><a href="${updates.badges_link}" target='_blank'>Click here to view all badges</a></div>`
  );

  $("#BaD_link").text(`Click here to view all possible badges!`); // Write Life on Grounds name to DOM
  $("#BaD_link").prop("href", updates.badges_link); // Write Life on Grounds link to DOM
  $("#LoG_title").text(updates.life_on_grounds_title); // Write Life on Grounds name to DOM
  $("#LoG_link").text(`Click here to see all ${updates.life_on_grounds_title} videos!`); // Write Life on Grounds name to DOM
  $("#LoG_link").prop("href", updates.life_on_grounds_link); // Write Life on Grounds link to DOM

  // Pre/post test data
  $("#pretest").css(
    "background-image",
    `url(/images/progress_bar/${updates.pre_test_button_background}_1.png)`
  );
  $("#posttest").css(
    "background-image",
    `url(/images/progress_bar/${updates.post_test_button_background}_2.png)`
  );
  if (updates.post_test == "true") $("#posttest").addClass("available");

  // Daily task image
  $("#dailyTaskImg").prop("src", updates.daily_task_img).css("height", ""); // Set daily task image source
}

function writeModuleProgress(progress) {
  console.log("Writing progress");
  // Add Module progress
  var modules = $("#modules .module").length;
  $("#modules .module").each(function () {
    var progObj = progress[$(this).find("#moduleID").attr("mID")],
      children = $(this).children();
    if (progObj && progObj.practice) $(children[2]).addClass("completed");
    if (progObj && progObj.apply) $(children[3]).addClass("completed");
    if (progObj && progObj.practice && progObj.apply) {
      $(this).find("a").removeClass("available").addClass("completed");
      modules--;
    }
  });
  if (modules >= 0 && $("#posttest").hasClass("available")) {
    $("#posttest").prop("href", "/post-test");
    $("#posttest").prop("title", "You're ready for the Post Test. Click here to begin!");
  }
}

function writeModules(modules) {
  modules.forEach((module) => {
    var tooltip = "This module has not yet been opened.",
      visibility = "";
    if (module.open) {
      tooltip = "This module is currently available. Click here to open it!";
      visibility = "available";
    }
    if (module.open === "false") {
      $("#modules").append(
        `<div class="module"><div id="moduleID" style="display:none;" mID=${module._id}></div><a class="progress_box ${visibility}" style="background-image:url(/images/progress_bar/${module.button_background_image}_2.png);" title="${tooltip}"><span>${module.primary_title}</span><br><span>${module.secondary_title}</span></a><div class="onexys_checkbox aleks_checkbox" style="margin-left:14px !important;"></div><div class="onexys_checkbox quiz_checkbox"></div></div><br>`
      );
    } else {
      $("#modules").append(
        `<div class="module"><div id="moduleID" style="display:none;" mID=${module._id}></div><a class="progress_box ${visibility}" style="background-image:url(/images/progress_bar/${module.button_background_image}_0.png);" href="/modules/${module._id}" title="${tooltip}"><span>${module.primary_title}</span><br><span>${module.secondary_title}</span></a><div class="onexys_checkbox aleks_checkbox" style="margin-left:14px !important;"></div><div class="onexys_checkbox quiz_checkbox"></div></div><br>`
      );
    } // Append module to the DOM
  });
}

function writeVideos(videos) {
  var html = ``;
  videos.videos.forEach((video) => {
    html += `<div class="onexys_video"><a class="colorbox" href="${video.src}">`;
    if (video.thumbnail) html += `<img class="onexys_thumbnail" src="${video.thumbnail}">`;
    // Use specified thumbnail
    else html += `<img class="onexys_thumbnail" src="${videos.thumbnail}">`; // Use default thumbnail, found in other
    html += `<img class="onexys_playbutton" src="${videos.playbutton}"></a></div><p><span style="font-size: 12pt;"><strong>${video.description}</strong></p>`;
  });
  $("#homepageVideos").html(html); // Write videos to DOM
}
