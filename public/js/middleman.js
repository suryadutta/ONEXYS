// ACCESS CURRENT COURSE ID WITH:
// courseIDFromURL
const hostname = "https://educationvirginia.instructure.com/";
$(document).ready(function () {
  // Contains all AJAX calls necessary to interface with system API
  // TODO: find way to supply hostname
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

  var getDailyTask = new Promise((resolve, reject) => {
    $.get(herokuAPI + "/dailies", {
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
      writeDailyTaskInfo(data);
    })
    .catch((err) => {
      console.log(err);
      $("#dailyTaskLink").prop(
        "href",
        `${herokuAPI.substring(0, herokuAPI.length - 3)}missing-resource`
      );
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
    .then((userProgress) => {
      getBadges(userProgress.badges);
    })
    .catch((err) => {
      console.log(err);
      console.log(
        "Failed to retrieve user progress. The page has been loaded, but omitting this data."
      );
    });

  var getModules = new Promise((resolve, reject) => {
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
});

function getBadges(earnedBadges) {
  $.get(herokuAPI + "/badges", {
    hostname,
    courseID,
  })
    .then((badges) => {
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
// Write badge progress into DOM
function writeBadges(badges, earnedBadges) {
  if (Object.keys(earnedBadges).length === 0) {
    $("#badge_content").html(`<p>Earn some badges and you will see them here!</p>`);
    return;
  }
  let badgeHTML = "",
    badgeCount = 0;
  for (let i = 0; i < badges.length; i++) {
    console.log(badges[i]);
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

function writeDailyTaskInfo(daily_tasks) {
  const todaysDaily = daily_tasks.pop();
  const daily = daily_tasks.find(
    (daily) => daily._id.toString() === todaysDaily.position.toString()
  );
  if (daily._id === -1)
    $("#dailyTaskLink").prop("href", `${herokuAPI.substring(0, herokuAPI.length - 3)}not-open`);
  else {
    $("#dailyTaskLink").prop(
      "href",
      `https://educationvirginia.instructure.com/courses/${courseID}/assignments/${daily.assignment_id.toString()}`
    );
  }
}

function writeProgress(progress) {
  $("#badge_content").html();
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
