//////////////////////////////////////
// TODO:
//  - Move video rearrangement outside of modal (too glitchy inside :( ...)
//  - Add support for editing the videos on this page
//////////////////////////////////////



$(document).ready(function() {
    // Get the course title
    if(needs.includes("courseTitle")) {
        $.get(herokuAPI + "/authorize/getCourseTitle", {
            hostname: window.location.hostname,
            courseID: 3559 // Eventually, pull this from URL
        }).done((title, status) => {
            $("#adminPanelTitle").text(`Admin Panel for ${title}`);
        }).fail((err, status) => {
            $("#adminPanelTitle").text("Warning: possible cookie error present.");
        });
    }

    if(needs.includes("homepageUpdates")) {
        $.get(herokuAPI + "/home/updates", {
            hostname: window.location.hostname,
            courseID: 3559 // Eventually, pull this from URL
        }).done((homepage, status) => {
            writeBadgeThings({link: homepage.updates.badges_link});
            writeDailyTaskInfo({id: homepage.daily.id, img: homepage.updates.daily_task_img});
            writeHomeUpdates({h1: homepage.updates.main_header, b1: homepage.updates.main_text, h2: homepage.updates.header2, b2: homepage.updates.text2, h3: homepage.updates.header3, b3: homepage.updates.text3});
            writeLoGThings({title: homepage.updates.life_on_grounds_title, link: homepage.updates.life_on_grounds_link});
            writePostTestChanges({bool: homepage.updates.post_test == "true", pre_img: homepage.updates.pre_test_button_background, post_img: homepage.updates.post_test_button_background, page: homepage.updates.post_test_filename});
            $("#fullscr-loading").animate({
                opacity: 0,
            }, 750, "swing", () => {
                $("#fullscr-loading").remove();
            });
        }).catch(err => {
            console.log("homepage update retrieval failed", err);
            // alert("Failed to load update information. Try again later");
            $("#previewBtn").remove(); $("#previewModal").remove();
            alert("Homepage preview was unable to load. You will be unable to preview changes.");
        });
    }

    if(needs.includes("homepageVideos")) {
        $.get(herokuAPI + "/home/videos", {
            hostname: window.location.hostname,
            courseID: 3559 // Eventually, pull this from URL
        }).done((videos, status) => {
            writeHomeVideos(videos);
        }).catch(err => {
            console.log("video retrieval failed");
        });
    }
});

// Takes care of:
//      the three headers;
//      the three text bodies
function writeHomeUpdates(updates) {
    $("#updates").html(`<h2>Updates</h2><div class="entry"><p class="entry_header"><strong>${updates.h1}</strong></p><p class="entry_text">${updates.b1}</p></div><div class="entry"><p class="entry_header"><strong>${updates.h2}</strong></p><p class="entry_text">${updates.b2}</p></div><div class="entry"><p class="entry_header"><strong>${updates.h3}</strong></p><p class="entry_text">${updates.b3}</p></div>`);
    $("#u1h").val(updates.h1);
    $("#u1t").val(updates.b1);
    $("#u2h").val(updates.h2);
    $("#u2t").val(updates.b2);
    $("#u3h").val(updates.h3);
    $("#u3t").val(updates.b3);
    autosize(document.querySelectorAll("textarea"));
}

// Takes care of:
//      writing all video data
function writeHomeVideos(videos) {
    var html = ``;
    videos.videos.forEach(video => {
        html += `<div id=${video._id} class="video-element"><div class="onexys_video"><a class="colorbox" href="${video.src}">`;
        if(video.thumbnail && video.thumbnail !== "") html += `<img class="onexys_thumbnail" src="${video.thumbnail}"/>`; // Use specified thumbnail
        else html += `<img class="onexys_thumbnail default" src="${videos.thumbnail}"/>`; // Use default thumbnail, found in other
        html += `<img class="onexys_playbutton" src="${videos.playbutton}"/></a></div><span style="font-size: 12pt;"><strong><p>${video.description}</p></strong></div>`;
    });
    $("#homepageVideos").html(html);

    // Set form fields
    $("#logdt").val(videos.thumbnail);
    $("#logpb").val(videos.playbutton);
}

// Takes care of:
//      post_test boolean
//      pre/post button backgrounds
//      post_test_filename
function writePostTestChanges(post_test) {
    $("#pretest").css("background-image", `url(${post_test.pre_img})`);
    $("#posttest").css("background-image", `url(${post_test.post_img})`);
    if(post_test.bool) {
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
    if(daily.id == null) $("#dailyTaskLink").prop("href", `${herokuAPI.substring(0, herokuAPI.length - 3)}missing-resource`);
    else if(daily.id == -1) $("#dailyTaskLink").prop("href", `${herokuAPI.substring(0, herokuAPI.length - 3)}not-open`);
    else $("#dailyTaskLink").prop("href", `${herokuAPI.substring(0, herokuAPI.length - 3)}assignments/${daily.id}`);
    $("#dailyTaskImg").prop("src", daily.img);
    $("#dti").val(daily.img);
}

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

/////////////////////////////////////////////////////////////////////////////////////
// AJAX shortcut helpers
function updateHome(field, value) {

    $.post(herokuAPI + "/admin/updateHome", {
        courseID: courseIDFromURL,
        field,
        value,
    }).done(res => console.log("[H] done"))
    .fail(res => console.log("[H] fail"));
}

// Any parameters which eval to false (undefined/null/etc...) will be left unmodified
function updateVideo(videoID, src, description, thumbnail, position) {

    console.log(courseIDFromURL);
    $.post(herokuAPI + "/admin/updateVideo", {
        courseID: courseIDFromURL,
        id: videoID,
        src,
        description,
        thumbnail,
        position,
    }).done(res => console.log("[V] done"))
    .fail(res => console.log("[V] fail"));
}

function updateVideoDefaults(thumbnail, playbutton) {

    $.post(herokuAPI + "/admin/updateVideoDefaults", {
        courseID: courseIDFromURL,
        thumbnail,
        playbutton,
    }).done(res => console.log("[VD] done"))
    .fail(res => console.log("[VD] fail"));
}

/////////////////////////////////////////////////////////////////////////////////////
// Keep the preview up to date
function copyToPreview() {
    // Set update headers
    let headers = [$("#u1h").val(), $("#u2h").val(), $("#u3h").val()];
    $("#updates").find(".entry_header").each((i, elem) => {
        $(elem).html(`<strong>${headers[i]}</strong>`);
    });

    // Set update texts
    let texts = [$("#u1t").val(), $("#u2t").val(), $("#u3t").val()];
    $("#updates").find(".entry_text").each((i, elem) => $(elem).html(texts[i]));

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
}
