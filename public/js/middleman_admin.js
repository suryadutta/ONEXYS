
$(document).ready(function() {
    if(needs.includes("courseTitle")) var getTitle = new Promise((resolve, reject) => {
        $.get(herokuAPI + "/authorize/getCourseTitle", {
            hostname: window.location.hostname,
            courseID: 3559 // Eventually, pull this from URL
        }).done((data, status) => {
            resolve(data, status);
        }).fail((err, status) => {
            reject(err, status);
        });
    }).then(title => {
        $("#adminPanelTitle").text(`Admin Panel for ${title}`);
    })
    .catch(err => {
        $("#adminPanelTitle").text("Warning: possible cookie error present.");
    });

    if(needs.includes("homepageUpdates")) var loadHomepage = new Promise((resolve, reject) => {
        $.get(herokuAPI + "/home/updates", {
            hostname: window.location.hostname,
            courseID: 3559 // Eventually, pull this from URL
        }).done((data, status) => {
            resolve(data);
        }).catch(err => {
            reject(err);
        });
    }).then(homepage => {
        writeBadgeThings({link: homepage.updates.badges_link});
        writeDailyTaskInfo({id: homepage.daily.id, img: homepage.updates.daily_task_img});
        writeHomeUpdates({h1: homepage.updates.main_header, b1: homepage.updates.main_text, h2: homepage.updates.header2, b2: homepage.updates.text2, h3: homepage.updates.header3, b3: homepage.updates.text3});
        writeLoGThings({title: homepage.updates.life_on_grounds_title, link: homepage.updates.life_on_grounds_link});
        writePostTestChanges({bool: homepage.updates.post_test == "true", pre_img: homepage.updates.pre_test_button_background, post_img: homepage.updates.post_test_button_background, page: homepage.updates.post_test_filename});
    }).catch(err => {
        //$("#previewBtn").remove(); $("#previewModal").remove();
        //alert("Homepage preview was unable to load. You will be unable to preview changes.");
        console.log("update retrieval failed", err);
    });

    if(needs.includes("homepageVideos")) var loadHomepageVideos = new Promise((resolve, reject) => {
        $.get(herokuAPI + "/home/videos", {
            hostname: window.location.hostname,
            courseID: 3559 // Eventually, pull this from URL
        }).done((data, status) => {
            resolve(data);
        }).catch(err => {
            reject(err);
        });
    }).then(videos => {
        writeHomeVideos(videos);
    }).catch(err => {
        console.log("video retrieval failed");
    });
});

// Takes care of:
//      the three headers;
//      the three text bodies
function writeHomeUpdates(updates) {
    $("#updates").html(`<h2>Updates</h2><div class="entry"><p class="entry_header"><strong>${updates.h1}</strong></p><p class="entry_text">${updates.b1}</p></div><div class="entry"><p class="entry_header"><strong>${updates.h2}</strong></p><p class="entry_text">${updates.b2}</p></div><div class="entry"><p class="entry_header"><strong>${updates.h3}</strong></p><p class="entry_text">${updates.b3}</p></div>`);
    $("#u1h").val(updates.h1).focusout(event => { // Fill form, add autosave listener
        postAJAXHome("main_header", $(event.currentTarget).val());
    });
    $("#u1t").val(updates.b1).focusout(event => { // Fill form, add autosave listener
        postAJAXHome("main_text", $(event.currentTarget).val());
    });
    $("#u2h").val(updates.h2).focusout(event => { // Fill form, add autosave listener
        postAJAXHome("header2", $(event.currentTarget).val());
    });
    $("#u2t").val(updates.b2).focusout(event => { // Fill form, add autosave listener
        postAJAXHome("text2", $(event.currentTarget).val());
    });
    $("#u3h").val(updates.h3).focusout(event => { // Fill form, add autosave listener
        postAJAXHome("header3", $(event.currentTarget).val());
    });
    $("#u3t").val(updates.b3).focusout(event => { // Fill form, add autosave listener
        postAJAXHome("text3", $(event.currentTarget).val());
    });
    autosize(document.querySelectorAll("textarea"));
}

// Takes care of:
//      writing all video data
function writeHomeVideos(videos) {
    var html = ``;
    videos.videos.forEach(video => {
        html += `<div class="onexys_video"><a class="colorbox" href="${video.src}">`;
        if(video.thumbnail) html += `<img class="onexys_thumbnail" src="${video.thumbnail}">`; // Use specified thumbnail
        else html += `<img class="onexys_thumbnail" src="${videos.thumbnail}">`; // Use default thumbnail, found in other
        html += `<img class="onexys_playbutton" src="${videos.playbutton}"></a></div><p><span style="font-size: 12pt;"><strong>${video.description}</strong></p>`;
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
    $("#poto").change(() => {
        postAJAXHome("post_test", $("#poto").is(":checked"));
    });
    $("#prtb").val(post_test.pre_img).focusout(event => { // Fill form, add autosave listener
        postAJAXHome("pre_test_button_background", $(event.currentTarget).val());
    });
    $("#potb").val(post_test.post_img).focusout(event => { // Fill form, add autosave listener
        postAJAXHome("post_test_button_background", $(event.currentTarget).val());
    });
    $("#ptp").val(post_test.page).focusout(event => { // Fill form, add autosave listener
        postAJAXHome("post_test_filename", $(event.currentTarget).val());
    });
}

// Takes care of:
//      badges_link
function writeBadgeThings(badge_info) {
    $("#btl").val(badge_info.link).focusout(event => { // Fill form, add autosave listener
        postAJAXHome("badges_link", $(event.currentTarget).val());
    });
}

// Takes care of:
//      life_on_grounds_link
//      life_on_grounds_title
//      life_on_grounds_thumbnail
function writeLoGThings(log) {
    $("#LoG_title").text(log.title); // Write Life on Grounds name to DOM
    $("#LoG_link").text(`Click here to see all ${log.title} videos!`); // Write Life on Grounds name to DOM
    $("#LoG_link").prop("href", log.link); // Write Life on Grounds link to DOM
    $("#logt").val(log.title).focusout(event => { // Fill form, add autosave listener
        postAJAXHome("life_on_grounds_title", $(event.currentTarget).val());
    });
    $("#logl").val(log.link).focusout(event => { // Fill form, add autosave listener
        postAJAXHome("life_on_grounds_link", $(event.currentTarget).val());
    });
}

function writeDailyTaskInfo(daily) {
    if(daily.id == null) $("#dailyTaskLink").prop("href", `${herokuAPI.substring(0, herokuAPI.length - 3)}missing-resource`);
    else if(daily.id == -1) $("#dailyTaskLink").prop("href", `${herokuAPI.substring(0, herokuAPI.length - 3)}not-open`);
    else $("#dailyTaskLink").prop("href", `${herokuAPI.substring(0, herokuAPI.length - 3)}assignments/${daily.id}`);
    $("#dailyTaskImg").prop("src", daily.img);
    $("#dti").val(daily.img).focusout(event => { // Fill form, add autosave listener
        postAJAXHome("daily_task_img", $(event.currentTarget).val());
    });
}

// Homepage AJAX POSTers
function postAJAXHome(field, value) {
    //console.log(field, value);
    $.post(herokuAPI + "/admin/updateHome", {
        courseID: courseIDFromURL,
        field,
        value,
    }).done(res => {
        console.log("done");
    }).fail(res => {
        console.log("fail");
    });
}

function postAJAXVideoUpdate() {

}

function postAJAXVideoDefaults(field, value) {

}

// Build AJAX request creator(s) here.
// Bind .on('focus-lost') to each form element
// On the focus loss, build the request and POST to the API


// After all that, update the homepage prevew in the modal if the POST was successful.
// If it failed, alert the user and do nothing.
