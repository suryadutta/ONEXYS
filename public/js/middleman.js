// TODO: find way to supply hostname
const hostname = "https://educationvirginia.instructure.com/";
$(document).ready(function () {
  // Contains all AJAX calls necessary to interface with system API
  $.get(herokuAPI + "/home/updates", {
    hostname,
    courseID,
  })
    .then((data) => {
      writeUpdates(data.updates);
    })
    .catch((err) => {
      console.log(err);
      $("#updates").append(
        `<h2>Updates</h2><div class="entry"><p class="entry_header"><strong>Updates could not be retrieved.</strong></p></div>`
      ); // Write updates to DOM
      $("#LoG_title").text("Available Videos"); // Write Life on Grounds name to DOM
      $("#LoG_link").text(""); // Write Life on Grounds name to DOM
      $("#LoG_link").prop("href", "/missing-resource"); // Write Life on Grounds link to DOM
      $("#dailyTaskImg").prop("src", ""); // Set daily task image source
      $("#dailyTaskLink").prop("href", "/missing-daily");
      $("#pretest").css("background-image", "");
      $("#posttest").css("background-image", "");
    });

  $.get(herokuAPI + "/todaysDaily", {
    hostname,
    courseID,
  })
    .then((data) => {
      writeDailyTaskInfo(data);
    })
    .catch((err) => {
      console.log(err);
      $("#dailyTaskLink").prop("href", "/missing-daily");
    });

  $.get(herokuAPI + "/home/videos", {
    hostname,
    courseID,
  })
    .then((data) => {
      // On success, write videos to DOM
      writeVideos(data);
    })
    .catch((err) => {
      console.log(err);
      $("#homepageVideos").html("Video content failed to load."); // Write error message
    });

  // Gets the user's progress, including finished modules and badge status
  $.get(herokuAPI + "/users/progress", {
    hostname,
    courseID,
  })
    .then((userProgress) => {
      getBadges(userProgress.badges);
      getModules(userProgress.modules);
      $("#point_count").html(parseInt(userProgress.score));
      $("#teamName").html(userProgress.team);
      getLeaderboard();
    })
    .catch((err) => {
      console.log(err.responseText);
      getBadges(null);
      getModules(null);
      alert("Failed to retrieve user progress. The page has been loaded, but omitting this data.");
    });
});

/*---------- Badge and Module API calls --------*/
function getLeaderboard() {
  $.get(herokuAPI + "/progress", {
    hostname,
    courseID,
  })
    .then((data) => {
      writeLeaderboard(data);
    })
    .catch((err) => {
      console.log(err);
      $("#leaderboard").text("Leaderboard info not available.");
    });
}

function getBadges(earnedBadges) {
  $.get(herokuAPI + "/badges", {
    hostname,
    courseID,
  })
    .then((badges) => {
      if (!earnedBadges) throw 500;
      writeBadges(badges, earnedBadges);
    })
    .catch((err) => {
      $("#badge_content").html(
        `<div style="margin-left: 1px; margin-right: 10px; margin-bottom: 20px;">
          <p>Badge loading failed.</p>
         <div>
        `
      );
    });
}

function getModules(completedModules) {
  $.get(herokuAPI + "/modules", {
    hostname,
    courseID,
  }).then((data) => {
    writeModules(data);
    if (completedModules) writeModuleProgress(completedModules);
  });
}

/*---------- Dynamic DOM update methods -----------*/

// Write badge progress into DOM
function writeBadges(badges, earnedBadges) {
  if (Object.keys(earnedBadges).length === 0) {
    $("#badge_content").html(`<p>Earn some badges and you will see them here!</p>`);
    return;
  }
  let badgeHTML = "",
    badgeCount = 0;
  for (let i = 0; i < badges.length; i++) {
    if (typeof earnedBadges[badges[i]._id] === "object") {
      badgeHTML += `<div class="badge_container completed" style="margin-left: 1px; margin-right: 10px; margin-bottom: 20px;">
                      <div class="badge_portrait" style="width: 80px; height: 100px; background-image: url(${badges[i].EarnedHoverURL})"></div>
                      <div class="badge_portrait front_portrait" style="width: 80px; height: 100px; background-image: url(${badges[i].EarnedURL})"></div>
                    </div>`;
      badgeCount++;
    }
    if (badgeCount >= 3) break;
  }
  $("#badge_content").html(badgeHTML);
}

// Updates
function writeUpdates(updates) {
  $("#updates").html(
    `<h2>Updates</h2><div class="entry"><p class="entry_header"><strong>${updates.main_header}</strong></p><p class="entry_text">${updates.main_text}</p></div><div class="entry"><p class="entry_header"><strong>${updates.header2}</strong></p><p class="entry_text">${updates.text2}</p></div><div class="entry"><p class="entry_header"><strong>${updates.header3}</strong></p><p class="entry_text">${updates.text3}</p></div>`
  ); // Write updates to DOM

  $("#all_badge_link").append(
    `<a href="${updates.badges_link}" target='_blank'>
        Click here to view all badges!
      </a>
    `
  );

  // Life on Grounds information
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

function writeDailyTaskInfo(todaysDaily) {
  if (todaysDaily.assignment_id.toString() !== -1) {
    $("#dailyTaskLink").prop(
      "href",
      `${hostname}/courses/${courseID}/assignments/${todaysDaily.assignment_id.toString()}`
    );
  } else {
    $("#dailyTaskLink").prop("href", `${herokuAPI}/not-open`);
  }
}

function writeModuleProgress(progress) {
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
        `<div class="module">
          <div id="moduleID" style="display:none;" mID=${module._id}>
          </div>
          <a class="progress_box ${visibility}" style="background-image:url(/images/progress_bar/${module.button_background_image}_2.png);" title="${tooltip}">
            <span>${module.primary_title}</span>
            <br>
            <span>${module.secondary_title}</span>
          </a>
          <div class="onexys_checkbox aleks_checkbox" style="margin-left:14px !important;"></div>
          <div class="onexys_checkbox quiz_checkbox"></div>
        </div>
        <br>`
      );
    } else {
      $("#modules").append(
        `<div class="module">
          <div id="moduleID" style="display:none;" mID=${module._id}>
          </div>
          <a class="progress_box ${visibility}" style="background-image:url(/images/progress_bar/${module.button_background_image}_0.png);" href="/modules/${module._id}" title="${tooltip}">
            <span>${module.primary_title}</span><br><span>${module.secondary_title}</span>
          </a>
          <div class="onexys_checkbox aleks_checkbox" style="margin-left:14px !important;"></div>
          <div class="onexys_checkbox quiz_checkbox"></div>
        </div>
        <br>`
      );
    } // Append module to the DOM
  });
}

function writeVideos(videos) {
  var html = ``;
  videos.videos.forEach((video) => {
    html += `<div class="onexys_video"><a class="colorbox" href="${video.src}">`;
    // Use specified thumbnail
    if (video.thumbnail) html += `<img class="onexys_thumbnail" src="${video.thumbnail}">`;
    // Use default thumbnail, found in other
    else html += `<img class="onexys_thumbnail" src="${videos.thumbnail}">`;
    html += `<img class="onexys_playbutton" src="${videos.playbutton}"></a></div><p><span style="font-size: 12pt;"><strong>${video.description}</strong></p>`;
  });
  $("#homepageVideos").html(html); // Write videos to DOM
}

function writeLeaderboard(progress) {
  var points = {};
  var count = {};
  var averages = {};
  var html = "";
  progress.forEach((user_progress) => {
    if (user_progress.team) {
      var team = user_progress.team;
      //creates dict of key(team), value(total team score)
      if (team in points) {
        points[team] += user_progress.score;
      } else {
        points[team] = user_progress.score;
      }
      //creates dict of key(team), value(# of members in team)
      if (team in count) {
        count[team] += 1;
      } else {
        count[team] = 1;
      }
    }
  });
  //creates dict of key(team), value(average score in team)

  Object.keys(points).forEach(function (key) {
    if (key in averages) {
      averages[key] += points[key] / count[key];
    } else {
      averages[key] = points[key] / count[key];
    }
  });

  //updates team score
  $("#teamScore").html(parseInt(averages[$("#teamName").text()]));
  //Finds teams with max scores
  var max_teams = ["None", "None", "None"];
  Object.keys(averages).forEach(function (key) {
    for (i = 0; i < max_teams.length; i++) {
      if (averages[key] > averages[max_teams[i]] || max_teams[i] === "None") {
        for (j = max_teams.length; j > i; j--) {
          max_teams[j] = max_teams[j - 1];
        }
        max_teams[i] = key;

        break;
      }
    }
  });
  //Accounts for there being not enough teams
  for (i = 0; i < max_teams.length; i++) {
    if (max_teams[i] === "None") {
      averages[max_teams[i]] = "N/A";
    }
  }

  html += `<tr class="leader"><td>1</td><td>${max_teams[0]}</td><td>${parseInt(
    averages[max_teams[0]]
  )}</td></tr><tr class="leader"><td>2</td><td>${max_teams[1]}</td><td>${parseInt(
    averages[max_teams[1]]
  )}</td></tr><tr class="leader"><td>3</td><td>${max_teams[2]}</td><td>${parseInt(
    averages[max_teams[2]]
  )}</td></tr>`;
  $("#leaderboard").html(html);
}
