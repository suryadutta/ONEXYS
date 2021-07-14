//////////////////////////////////////
// TODO:
//  - Add support for editing the videos on this page
//////////////////////////////////////

function hideLoadingBar() {
  $("#fullscr-loading").animate(
    {
      opacity: 0,
    },
    750,
    "swing",
    () => {
      $("#fullscr-loading").remove();
    }
  );
}

const hostname = "https://educationvirginia.instructure.com";
$(document).ready(async function () {
  // Get the course title
  if (needs.includes("courseTitle")) {
    $.get(`${herokuAPI}/authorize/getCourseTitle`, {
      hostname,
      courseID,
    })
      .done((title, status) => {
        $("#adminPanelTitle").text(`Admin Panel for ${title}`);
      })
      .fail((err, status) => {
        $("#adminPanelTitle").text("Warning: possible cookie error present.");
      });
  }

  if (needs.includes("homepageUpdates")) {
    $.get(`${herokuAPI}/home/updates`, {
      hostname,
      courseID,
    })
      .done((homepage, status) => {
        writeBadgeThings({ link: homepage.badges_link });
        writeDailyTaskInfo({ img: homepage.daily_task_img });
        writeHomeUpdates({
          h1: homepage.main_header,
          b1: homepage.main_text,
          h2: homepage.header2,
          b2: homepage.text2,
          h3: homepage.header3,
          b3: homepage.text3,
        });
        writeLoGThings({
          title: homepage.life_on_grounds_title,
          link: homepage.life_on_grounds_link,
        });
        writePostTestChanges({
          bool: homepage.post_test == "true",
          pre_img: homepage.pre_test_button_background,
          post_img: homepage.post_test_button_background,
          page: homepage.post_test_filename,
        });
      })
      .catch((err) => {
        console.log("homepage update retrieval failed", err);
        // alert("Failed to load update information. Try again later");
        $("#previewBtn").remove();
        $("#previewModal").remove();
        alert("Homepage preview was unable to load. You will be unable to preview changes.");
      })
      .always(() => hideLoadingBar());
  }

  if (needs.includes("homepageVideos")) {
    $.get(`${herokuAPI}/home/videos`, {
      hostname,
      courseID,
    })
      .done((videos, status) => {
        writeHomeVideos(videos);
      })
      .catch((err) => {
        console.log("video retrieval failed");
      })
      .always(() => hideLoadingBar());
  }

  if (needs.includes("navigationData")) {
    $.get(`${herokuAPI}/navigation`, {
      hostname,
      courseID,
    })
      .done((data) => writeNavigationData(data))
      .fail((err) => console.log("navigation retrieval failed"))
      .always(() => hideLoadingBar());
  }

  if (needs.includes("badges")) {
    $.get(`${herokuAPI}/badges`, {
      hostname,
      courseID,
    })
      .done((data) => writeBadges(data))
      .fail((err) => console.log("badges retrieval failed"))
      .always(() => hideLoadingBar());
  }

  if (needs.includes("modules")) {
    $.get(`${herokuAPI}/modules`, {
      hostname,
      courseID,
    })
      .done((data) => writeModules(data))
      .fail((err) => console.log("module retrieval failed"))
      .always(() => hideLoadingBar());
  }
  if (needs.includes("daily")) {
    $.get(`${herokuAPI}/dailies`, {
      hostname,
      courseID,
    })
      .done((data) => writeDailiesTaskInfo(data))
      .fail((err) => console.log("dailies retrieval failed"))
      .always(() => hideLoadingBar());
  }
  if (needs.includes("lucky")) {
    $.get(`${herokuAPI}/lucky`, {
      hostname,
      courseID,
    })
      .done((data) => writeLuckyInfo(data))
      .fail((err) => console.log("lucky retrieval failed"))
      .always(() => hideLoadingBar());
  }

  // if (needs.includes("testInfo")) {
  //   $.get(`${herokuAPI}/testInfo`, {
  //     hostname: window.location.hostname,
  //     courseID,
  //   })
  //     .done((data) => writeTestInfo(data))
  //     .fail((err) => console.log("test info retrieval failed"));
  // }

  if (needs.includes("moduleVideos")) {
    $.get(`${herokuAPI}/modules`, {
      hostname,
      courseID,
    })
      .done((data) => writeModuleVidEdit(data))
      .fail((err) => console.log("module retrieval failed"))
      .always(() => hideLoadingBar());
  }
});

/*****************************************************************
 * Dynamic DOM update methods
 *
 */

// Takes care of:
//      the three headers;
//      the three text bodies
function writeHomeUpdates(updates) {
  $("#updates").html(
    `<h2>Updates</h2><div class="entry"><p class="entry_header"><strong>${updates.h1}</strong></p><p class="entry_text">${updates.b1}</p></div><div class="entry"><p class="entry_header"><strong>${updates.h2}</strong></p><p class="entry_text">${updates.b2}</p></div><div class="entry"><p class="entry_header"><strong>${updates.h3}</strong></p><p class="entry_text">${updates.b3}</p></div>`
  );
  $("#u1h").val(updates.h1);
  $("#u1t").val(updates.b1);
  $("#u2h").val(updates.h2);
  $("#u2t").val(updates.b2);
  $("#u3h").val(updates.h3);
  $("#u3t").val(updates.b3);
  autosize(document.querySelectorAll("textarea"));
}

// TODO: refactor into separate functions for homepagevideos and homepagevideosedit
// Takes care of:
//      writing all video data
function writeHomeVideos(videos) {
  // Write the videos to the editing panel
  if (typeof edit === "boolean" && edit) {
    const videoToEdit = videos.videos.find((video) => video._id.toString() === videoID.toString());

    if (videoToEdit) {
      $("#video_src").val(videoToEdit.src);
      $("#video_thumb").val(videoToEdit.thumbnail);
      $("#video_desc").val(videoToEdit.description);
      $("#video_pos").val(videoToEdit.position);
    }
  } else {
    $("#homepageVideosEdit").html(
      videos.videos
        .map(
          (video) =>
            `<div class="col-md-6 vid-obj">
            
                <div class="row">
               
                  <div class="col-md-8">
                  
                    <div class="video-element">
                    <div class = "id" value = "${video._id}">
                      <div class="onexys_video">
                      
                        <a class="colorbox" target="_blank" href="${video.src}">
                          <img class="onexys_thumbnail ${
                            video.thumbnail
                              ? `" src="${video.thumbnail}" `
                              : `default" src="${videos.thumbnail}`
                          }">
                          <img class="onexys_playbutton" src="${videos.playbutton}">
                        </a>
                      </div>
                      
                      <span style="font-size: 12pt;">
                        <p>${video.description}</p>
                      </span>
                    </div>
                  </div>
                  </div>
                  <div class="col-md-4" style="position: relative;">
                    <a class="btn btn-dark text-white" href="/admin/homeVidEdit/${
                      video._id
                    }" style="width: 80%; position: absolute; top: 25%; transform: translateY(-53%);">Edit Video</a>
                    <button class="btn btn-danger" onClick = "deleteHomeVid('${video._id}')"
                       style="width: 80%; position: absolute; top: 25%; transform: translateY(+53%);">Delete Video
                    </button>
                  </div>
                  </div>
                </div>
              </div>`
        )
        .join("")
    );
    // Set form fields
    $("#logdt").val(videos.thumbnail);
    $("#logpb").val(videos.playbutton);
  }
}

// Takes care of:
//      post_test boolean
//      pre/post button backgrounds
//      post_test_filename
function writePostTestChanges(post_test) {
  $("#pretest").css("background-image", `url(${post_test.pre_img})`);
  $("#posttest").css("background-image", `url(${post_test.post_img})`);
  if (post_test.bool) {
    $("#posttest").addClass("available");
    $("#poto").prop("checked", "true");
  }
  $("#prtb").val(post_test.pre_img);
  $("#potb").val(post_test.post_img);
  $("#ptp").val(post_test.page);
}

// Takes care of:
//      badges_link
function writeBadgeThings(badge_info) {
  $("#btl").val(badge_info.link);
}

// Takes care of:
//      life_on_grounds_link
//      life_on_grounds_title
//      life_on_grounds_thumbnail
function writeLoGThings(log) {
  $("#LoG_title").text(log.title); // Write Life on Grounds name to DOM
  $("#LoG_link").text(`Click here to see all ${log.title} videos!`); // Write Life on Grounds name to DOM
  $("#LoG_link").prop("href", log.link); // Write Life on Grounds link to DOM
  $("#logt").val(log.title);
  $("#logl").val(log.link);
}

function writeDailyTaskInfo(daily) {
  if (daily.id == null)
    $("#dailyTaskLink").prop(
      "href",
      `${herokuAPI.substring(0, herokuAPI.length - 3)}missing-resource`
    );
  else if (daily.id == -1)
    $("#dailyTaskLink").prop("href", `${herokuAPI.substring(0, herokuAPI.length - 3)}not-open`);
  else
    $("#dailyTaskLink").prop(
      "href",
      `${herokuAPI.substring(0, herokuAPI.length - 3)}assignments/${daily.id}`
    );
  $("#dailyTaskImg").prop("src", daily.img);
  $("#dti").val(daily.img);
}

// TODO:refactor
function writeDailiesTaskInfo(daily) {
  if (edit) {
    let dailyToEdit = daily.filter((daily) => daily._id == dailyID)[0];
    $("#daily_id").text(`Editing Daily ${dailyToEdit._id}`);
    $("#assignment_id").val(dailyToEdit.assignment_id);
  } else {
    let content = daily.reduce((content, daily) => {
      return (
        content +
        `
        <tr>
          <td>${daily._id}</td>
          <td>${daily.assignment_id}</td>
          <td>
            <a  class="btn btn-dark"
                href="dailyTasks/edit/${daily._id}">
                Edit
            </a>
          </td>
        </tr>`
      );
    }, ``);
    $("#dailyTable").append(content);
  }
}

function prettyDate(dateString) {
  var date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function writeLuckyInfo(lucky) {
  let content = lucky.reduce((content, lucky) => {
    return (
      content +
      `
      <tr>
        <td>Bonus ${lucky._id}</td>
        <td>Date ${prettyDate(lucky.time)}</td>
        <td>
          <a class="btn btn-dark"
            href="lucky/edit/${lucky._id}">
            Edit
          </a>
        </td>
      </tr>`
    );
  }, ``);
  $("#luckyTable").append(content);
}

/**
 * Writes coachinfo, lifeongrounds, posttest, welcome information from Mongo
 * @param { [{page: string, src, string, _id: string,}, ...] } data
 */
function writeNavigationData(data) {
  $("#coach_info").val(data[0].src);
  $("#life_on_grounds").val(data[1].src);
  $("#post_test").val(data[2].src);
  $("#welcome").val(data[3].src);
}

function writeBadges(badges) {
  if (edit) {
    let badgeToEdit = badges.filter((badge) => badge._id == badgeID)[0];

    if (badgeID !== 32) {
      $("#assignment_id").parent().parent().remove();
    } else $("#assignment_id").val(badgeToEdit.assignment_id);

    // Filter out the badge we want

    // Preload form fields and bind automatic copy functions
    $("#title")
      .val(badgeToEdit.Title)
      .change((event) => {
        $("h3.previewTitle").html($(event.target).val());
      });
    $("#description")
      .val(badgeToEdit.Description)
      .change((event) => {
        $("p.previewDescription").html($(event.target).val());
      });
    $("#badge_points")
      .val(badgeToEdit.Points)
      .change((event) => {
        $("p.previewPoints").html($(event.target).val());
      });
    // $("#assignment_id").val(badgeToEdit.);
    $("#portrait")
      .val(badgeToEdit.Portrait)
      .change((event) => {
        $("h3.previewName").html($(event.target).val());
      });
    $("#portraitdescription")
      .val(badgeToEdit.PortraitDescription)
      .change((event) => {
        $("p.previewPortraitDescription").html($(event.target).val());
      });
    $("#unearned_url")
      .val(badgeToEdit.UnearnedURL)
      .change((event) => {
        $("#previewUnearnedImage").css("background-image", `url(${$(event.target).val()})`);
      });
    $("#earned_url")
      .val(badgeToEdit.EarnedURL)
      .change((event) => {
        $("#previewEarnedImage").css("background-image", `url(${$(event.target).val()})`);
      });
    $("#earned_hover_url")
      .val(badgeToEdit.EarnedHoverURL)
      .change((event) => {
        $("#previewEarnedHoverImage").css("background-image", `url(${$(event.target).val()})`);
      });

    // Preload badge content
    $("h3.previewTitle").html(badgeToEdit.Title);
    $("p.previewDescription").html(badgeToEdit.Description);
    $("p.previewPoints").html(badgeToEdit.Points);
    $("h3.previewName").html(badgeToEdit.Portrait);
    $("p.previewPortraitDescription").html(badgeToEdit.PortraitDescription);
    $("#previewUnearnedImage").css("background-image", `url(${badgeToEdit.UnearnedURL})`);
    $("#previewEarnedImage").css("background-image", `url(${badgeToEdit.EarnedURL})`);
    $("#previewEarnedHoverImage").css("background-image", `url(${badgeToEdit.EarnedHoverURL})`);
  } else {
    badges.sort((a, b) => a._id - b._id);
    let content = badges.reduce((content, badge) => {
      return (
        content +
        `
        <tr>
          <td>${badge._id}</td>
          <td>${badge.Title}</td>
          <td>${badge.Description}</td>
          <td>${badge.Points}</td>
          <td>${badge.Portrait}</td>
          <td>${badge.PortraitDescription}</td>
          <td>
            <a class="btn btn-dark"
              href="badges/edit/${badge._id}">
              Edit
            </a>
          </td>
      </tr>`
      );
    }, ``);
    $("#badgeTable").append(content);
  }
}

// TODO: refactor into separate functions for modules and modulesEdit
function writeModules(modules) {
  if (typeof edit === "boolean" && edit) {
    const moduleToEdit = modules.find((module) => module._id.toString() === moduleID.toString());

    if (moduleToEdit) {
      $("#primary_title").val(moduleToEdit.primary_title);
      $("#secondary_title").val(moduleToEdit.secondary_title);
      $("#practice_link").val(moduleToEdit.practice_link);
      $("#practice_cutoff").val(moduleToEdit.practice_cutoff);
      $("#practice_url_redirect").val(moduleToEdit.practice_url_redirect);
      $("#multiple_practice_cutoff").val(moduleToEdit.multiple_practice_cutoff);
      $("#quiz_link").val(moduleToEdit.quiz_link);
      $("#quiz_cutoff").val(moduleToEdit.quiz_cutoff);
      $("#reflection_link").val(moduleToEdit.reflection_link);
      $("#background_image").val(moduleToEdit.background_image);
      $("#button_background_image").val(moduleToEdit.button_background_image);
      $("#background_name").val(moduleToEdit.background_name);
      $("#background_desc").val(moduleToEdit.background_desc);
      $("#overview_text").val(moduleToEdit.overview);
      $("#apply_description").val(moduleToEdit.apply_description);
      $("#apply_read_src").val(moduleToEdit.apply_read_src);
      $("#explore_text").val(moduleToEdit.explore);
      $("#subject").val(moduleToEdit.subject);

      if (moduleToEdit.open === "true") $("#open_yes").prop("checked", true);
      else $("#open_no").prop("checked", true);

      if (moduleToEdit.due === "true") $("#due_yes").prop("checked", true);
      else $("#due_no").prop("checked", true);

      if (moduleToEdit.practice_id_bool === "true")
        $("#practice_id_bool_true").prop("checked", true);
      else $("#practice_id_bool_false").prop("checked", true);

      let videos = moduleToEdit.videos;
      videos.sort((video1, video2) => video1.position > video2.position);
      let videoHTML = "";
      videos.map(
        (video, index) =>
          (videoHTML += `
          <div id="module_vid_${index}" class="video-element d-flex align-items-center">
            <div>
              <div class="onexys_video">
                <a class="colorbox" target="_blank" href="${video.video_src}">
                  <img class="onexys_thumbnail" src="/images/video/${video.video_image_src}">
                </a>
              </div>
              <span style="font-size: 12pt;">
                <p>${video.video_desc}</p>
              </span>
            </div>
            
            <div class="d-flex flex-column ml-2">
              <a class="btn btn-dark text-white mb-1" href="/admin/modules/videoEdit/${moduleToEdit._id}/${video._id}">Edit Video</a>
              <button class="btn btn-danger">Delete Video</button>
            </div>
          </div>         
          `)
      );
      $("#module_vid_container").append(videoHTML);
    }
  } else {
    let content = modules.reduce((content, module) => {
      return (
        content +
        `<tr>
            <td>${module._id}</td>
            <td>${module.primary_title}</td>
            <td>${module.secondary_title}</td>
            <td>
                <input type='checkbox' ${module.open === "true" ? "checked" : ""}/>
            </td>
            <td>
                <input type='checkbox' ${module.due === "true" ? "checked" : ""}/>
            </td>
            <td>${module.practice_link}</td>
            <td>${module.quiz_link}</td>
            <td>${module.reflection_link}</td>
            <td>
                <a  class="btn btn-dark"
                    href="modules/edit/${module._id}">
                    Edit
                </a>
            </td>
        </tr>`
      );
    }, ``);
    $("#moduleTable").append(content);
  }
}

function writeModuleVidEdit(modules) {
  const moduleToEdit = modules.find((module) => module._id.toString() === moduleID.toString());
  const moduleVidToEdit = moduleToEdit.videos.find(
    (video) => video._id.toString() === videoID.toString()
  );

  $("#video_src").val(moduleVidToEdit.video_src);
  $("#video_image_src").val(moduleVidToEdit.video_image_src);
  $("#video_desc").val(moduleVidToEdit.video_desc);
  $("#video_desc_helper").val(moduleVidToEdit.video_desc_helper);
  $("#position").val(moduleVidToEdit.position);
}
/////////////////////////////////////////////////////////////////////////////////////
// AJAX shortcut helpers
function updateHome(field, value) {
  $.post(herokuAPI + "/admin/updateHome", {
    courseID,
    field,
    value,
  })
    .done((res) => console.log("[H] done"))
    .fail((res) => console.log("[H] fail"));
}

// Any parameters which eval to false (undefined/null/etc...) will be left unmodified
function updateVideo(videoID, src, description, thumbnail, position) {
  // console.log(position, description);
  $.post(herokuAPI + "/admin/updateVideo", {
    courseID,
    id: videoID,
    src,
    description,
    thumbnail,
    position,
  })
    .done((res) => console.log("[V] done"))
    .fail((res) => console.log("[V] fail"));
}

function updateVideoDefaults(thumbnail, playbutton) {
  $.post(herokuAPI + "/admin/updateVideoDefaults", {
    courseID,
    thumbnail,
    playbutton,
  })
    .done((res) => console.log("[VD] done"))
    .fail((res) => console.log("[VD] fail"));
}

function updateNavigation(location, link) {
  $.post(herokuAPI + "/admin/updateNavigation", {
    courseID,
    location,
    link,
  })
    .done((res) => {
      console.log("[N] done");
      alert("Navigation update successful.");
    })
    .fail((res) => {
      console.log("[N] fail");
      alert("Navigation update failed.");
    });
}

function updateBadge() {
  let submit = {
    courseID,
    title: $("#title").val(),
    description: $("#description").val(),
    points: $("#badge_points").val(),
    portrait: $("#portrait").val(),
    portraitdescription: $("#portraitdescription").val(),
    unearned_url: $("#unearned_url").val(),
    earned_url: $("#earned_url").val(),
    earned_hover_url: $("#earned_hover_url").val(),
  };
  if (badgeID === 32) submit.assignment_id = $("#assignment_id").val();
  $.post(herokuAPI + `/admin/updateBadge/${badgeID}`, submit)
    .done((res) => {
      console.log("[B] done");
      alert("Badge successfully updated.");
    })
    .fail((res) => {
      console.log("[B] fail");
      alert("Badge update failed.");
    });
}

function updateModule() {
  const submit = {
    courseID,
    primary_title: $("#primary_title").val(),
    secondary_title: $("#secondary_title").val(),
    practice_link: $("#practice_link").val(),
    practice_cutoff: $("#multiple_practice_cutoff").val().split("_")[1],
    practice_url_redirect: $("#practice_url_redirect").val(),
    multiple_practice_cutoff: $("#multiple_practice_cutoff").val(),
    quiz_link: $("#quiz_link").val(),
    quiz_cutoff: $("#quiz_cutoff").val(),
    reflection_link: $("#reflection_link").val(),
    background_image: $("#background_image").val(),
    button_background_image: $("#button_background_image").val(),
    background_name: $("#background_name").val(),
    background_desc: $("#background_desc").val(),
    overview: $("#overview_text").val(),
    apply_description: $("#apply_description").val(),
    apply_read_src: $("#apply_read_src").val(),
    explore: $("#explore_text").val(),
    open: $("#open_yes").is(":checked") ? "true" : "false",
    due: $("#due_yes").is(":checked") ? "true" : "false",
    practice_id_bool: $("#practice_id_bool_true").is(":checked") ? "true" : "false",
    subject: $("#subject").val(),
  };

  $.post(herokuAPI + `/admin/updateModule/${moduleID}`, submit)
    .done((res) => {
      console.log("[M] done");
      alert("Module successfully updated.");
    })
    .fail((res) => {
      console.log("[M] fail");
      alert("Module update failed.");
    });
}

function updateModuleVid() {
  const submit = {
    video_src: $("#video_src").val(),
    video_image_src: $("#video_image_src").val(),
    video_desc: $("#video_desc").val(),
    video_desc_helper: $("#video_desc_helper").val(),
    position: $("#position").val(),
    videoID,
    moduleID,
    courseID,
  };

  $.post(herokuAPI + `/admin/updateModuleVid`, submit)
    .done((res) => {
      console.log("[MV] done");
      alert("Module video successfully updated.");
    })
    .fail((res) => {
      console.log("[MV] fail");
      alert("Module video update failed.");
    });
}

function updateDaily() {
  const submit = {
    courseID,
    assignment_id: $("#assignment_id").val(),
  };

  $.post(herokuAPI + `/admin/updateDaily/${dailyID}`, submit)
    .done((res) => {
      console.log("[D] done");
      alert("Daily successfully updated.");
    })
    .fail((res) => {
      console.log("[D] fail");
      alert("Daily update failed.");
    });
}

function updateTodaysDaily() {
  $.post(herokuAPI + `/admin/updateTodaysDaily/`, { courseID, position: $("#todaysDaily").val() })
    .done((res) => {
      console.log("[TD] done");
      alert("Today's daily successfully updated.");
    })
    .fail((res) => {
      console.log("[TD] fail");
      alert("Today's daily update failed.");
    });
}

function addHomeVid(src, description, thumbnail, position) {
  $.post(herokuAPI + "/admin/addHomeVid", {
    courseID,
    src,
    description,
    thumbnail,
    position,
  })
    .done((res) => console.log("[V] add done"))
    .fail((res) => console.log("[V] add fail"));
}

function deleteHomeVid(vidId) {
  var result = confirm("Delete this vid?");
  if (result) {
    var dataToSend = JSON.stringify({ courseID: courseID, vidId: vidId });
    $.ajax({
      url: herokuAPI + "/admin/deleteHomeVid",
      type: "DELETE",
      contentType: "application/json; charset=utf-8",
      data: dataToSend,
    })
      .done((res) => {
        location.reload();
        console.log("[V] delete success");
      })
      .fail((res) => {
        console.log("[V] delete fail");
      });
  }
}
/////////////////////////////////////////////////////////////////////////////////////
// Keep the preview up to date
function copyToPreview() {
  // Set update headers
  let headers = [$("#u1h").val(), $("#u2h").val(), $("#u3h").val()];
  $("#updates")
    .find(".entry_header")
    .each((i, elem) => {
      $(elem).html(`<strong>${headers[i]}</strong>`);
    });

  // Set update texts
  let texts = [$("#u1t").val(), $("#u2t").val(), $("#u3t").val()];
  $("#updates")
    .find(".entry_text")
    .each((i, elem) => $(elem).html(texts[i]));

  // Pre/Post test things
  $("#poto").is(":checked");
  $("#prtb").val();
  $("#potb").val();
  $("#ptp").val();

  // LoG
  $("#logt").val();
  $("#logl").val();

  // Badges tool link + daily task image
  $("#dti").val();

  // Video defaults
  $("#logdt").val();
  $("#logpb").val();

  // Copy videos from the edit panel to the preview window
  $("#homepageVideos").html(
    $.map(
      $("#homepageVideosEdit").find(".video-element"),
      (videoElem) =>
        `<div class="onexys_video">
                <a class="colorbox" target="_blank" href="${$(videoElem)
                  .find("a.colorbox")
                  .prop("href")}">
                    <img class="onexys_thumbnail" src="${$(videoElem)
                      .find("img.onexys_thumbnail")
                      .prop("src")}">
                    <img class="onexys_playbutton" src="${$(videoElem)
                      .find("img.onexys_playbutton")
                      .prop("src")}">
                </a>
            </div>
            <span style="font-size: 12pt;">
                <p>${$(videoElem).find("p").html()}</p>
            </span>
            `
    ).join("")
  );
}

function copyToModulePreview() {
  $("#preview_background_building").attr(
    "src",
    `/images/moduleBackgrounds/${$("#background_image").val()}`
  );
  $("#preview_background_building").attr("alt", $("#background_name").val());
  $("#preview_primary_text").html($("#primary_title").val());
  $("#preview_secondary_text").html($("#secondary_title").val());
  $("#preview_background_name").html($("#background_name").val());
  $("#preview_background_desc").html($("#background_desc").val());
  $("#preview_overview").html($("#overview_text").val());

  if ($("#practice_id_bool_true").is(":checked")) {
    $("#preview_practice_location").attr(
      "src",
      `${hostname}/courses/${courseID}/assignments/${$("#practice_link").val()}`
    );
  } else if ($("#practice_id_bool_false").is(":checked")) {
    $("#preview_practice_location").attr("src", $("#practice_url_redirect").val());
  }

  $("#preview_read").attr("src", `/applicationPDFs/${$("#apply_read_src").val()}`);
  $("#preview_reflect").attr(
    "src",
    `${hostname}/courses/${courseID}/assignments/${$("#reflection_link").val()}`
  );
  $("#preview_quiz_link").attr(
    "src",
    `${hostname}/courses/${courseID}/assignments/${$("#quiz_link").val()}`
  );
  $("#preview_explore_content").html($("#explore_text").val());

  //todo: refactor
  const videoImgs = Object.values($(".onexys_video img")),
    videoLinks = Object.values($(".onexys_video a")),
    videoTitles = Object.values($("#module_vid_container p"));
  let videoHTML = "";
  console.log(videoImgs, videoLinks, videoTitles);
  for (let i = 0; i < videoImgs.length; i++) {
    if (videoImgs[i] instanceof HTMLElement)
      videoHTML += `<div class="watch_video left">
                      <div class="onexys_video">
                        <a class="colorbox cboxElement" href=${videoLinks[i].href} target="_blank">
                          <img class="onexys_thumbnail" src="${videoImgs[i].src}")></img>
                          <img class="onexys_playbutton" src="/images/icons/playbutton.png", alt=""></img>
                        </a>
                      </div>
                      <p>
                        <span style="font-size: 12pt;">
                          <strong>${videoTitles[i].innerText}</strong>
                        </span>
                      </p>
                    </div>`;
  }
  videoHTML += "<div class='clear'></div>";
  $("#watch").append(videoHTML);
}

// @todo refactor use one mongo call
// Makes all changes live (saves to Mongo)
function goLive() {
  // Homepage updates
  updateHome("main_header", $("#u1h").val());
  updateHome("main_text", $("#u1t").val());
  updateHome("header2", $("#u2h").val());
  updateHome("text2", $("#u2t").val());
  updateHome("header3", $("#u3h").val());
  updateHome("text3", $("#u3t").val());

  // Pre/Post test things
  updateHome("post_test", $("#poto").is(":checked"));
  updateHome("pre_test_button_background", $("#prtb").val());
  updateHome("post_test_button_background", $("#potb").val());
  updateHome("post_test_filename", $("#ptp").val());

  // LoG
  updateHome("life_on_grounds_title", $("#logt").val());
  updateHome("life_on_grounds_link", $("#logl").val());

  // Badges tool link + daily task image
  updateHome("daily_task_img", $("#dti").val());
  updateHome("badges_link", $("#btl").val());

  // Video defaults
  updateVideoDefaults($("#logdt").val(), $("#logpb").val());
}
