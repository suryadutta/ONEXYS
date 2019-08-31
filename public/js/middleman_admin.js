
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
        if(homepage.daily.id == null) $("#dailyTaskLink").prop("href", `${herokuAPI.substring(0, herokuAPI.length - 3)}missing-resource`);
        else if(homepage.daily.id == -1) $("#dailyTaskLink").prop("href", `${herokuAPI.substring(0, herokuAPI.length - 3)}not-open`);
        else $("#dailyTaskLink").prop("href", `${herokuAPI.substring(0, herokuAPI.length - 3)}assignments/${homepage.daily.id}`);
        $("#dailyTaskImg").prop("src", homepage.updates.daily_task_img);
        $("#updates").html(`<h2>Updates</h2><div class="entry"><p class="entry_header"><strong>${homepage.updates.main_header}</strong></p><p class="entry_text">${homepage.updates.main_text}</p></div><div class="entry"><p class="entry_header"><strong>${homepage.updates.header2}</strong></p><p class="entry_text">${homepage.updates.text2}</p></div><div class="entry"><p class="entry_header"><strong>${homepage.updates.header3}</strong></p><p class="entry_text">${homepage.updates.text3}</p></div>`);
        $("#LoG_title").text(homepage.updates.life_on_grounds_title); // Write Life on Grounds name to DOM
        $("#LoG_link").text(`Click here to see all ${homepage.updates.life_on_grounds_title} videos!`); // Write Life on Grounds name to DOM
        $("#LoG_link").prop("href", homepage.updates.life_on_grounds_link); // Write Life on Grounds link to DOM
        $("#pretest").css("background-image", `url(${homepage.updates.pre_test_button_background})`);
        $("#posttest").css("background-image", `url(${homepage.updates.post_test_button_background})`);
        if(updates.post_test == "true") $("#posttest").addClass("available");
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
        var html = ``;
        videos.videos.forEach(video => {
            html += `<div class="onexys_video"><a class="colorbox" href="${video.src}">`;
            if(video.thumbnail) html += `<img class="onexys_thumbnail" src="${video.thumbnail}">`; // Use specified thumbnail
            else html += `<img class="onexys_thumbnail" src="${videos.thumbnail}">`; // Use default thumbnail, found in other
            html += `<img class="onexys_playbutton" src="${videos.playbutton}"></a></div><p><span style="font-size: 12pt;"><strong>${video.description}</strong></p>`;
        });
        $("#homepageVideos").html(html);
    }).catch(err => {
        console.log("video retrieval failed");
    });
});
