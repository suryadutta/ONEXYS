

$(document).ready(function() {
    // Contains all AJAX calls necessary to interface with system API
    var getHomeUpdates = new Promise((resolve, reject) => {
        $.get(herokuAPI + "/home/updates", {
            hostname: window.location.hostname,
            courseID: 3559, // eventually, pull from URL
        }).done( (data, status) => {
            resolve(data);
        }).fail(err => reject(err))
    }).then( data => {
        // Updates
        $("#updates").html(`<h2>Updates</h2><div class="entry"><p class="entry_header"><strong>${data.updates.main_header}</strong></p><p class="entry_text">${data.updates.main_text}</p></div><div class="entry"><p class="entry_header"><strong>${data.updates.header2}</strong></p><p class="entry_text">${data.updates.text2}</p></div><div class="entry"><p class="entry_header"><strong>${data.updates.header3}</strong></p><p class="entry_text">${data.updates.text3}</p></div>`); // Write updates to DOM

        // Life on Grounds information
        $("#LoG_title").text(data.updates.life_on_grounds_title); // Write Life on Grounds name to DOM
        $("#LoG_link").text(`Click here to see all ${data.updates.life_on_grounds_title} videos!`); // Write Life on Grounds name to DOM
        $("#LoG_link").prop("href", data.updates.life_on_grounds_link); // Write Life on Grounds link to DOM

        // Pre/post test data
        $("#pretest").css("background-image", `url(${data.updates.pre_test_button_background})`);
        $("#posttest").css("background-image", `url(${data.updates.post_test_button_background})`);
        if(data.updates.post_test == "true") $("#posttest").addClass("available");

        // Daily task data
        $("#dailyTaskImg").prop("src", data.updates.daily_task_img); // Set daily task image source
        if(data.daily.id == null) $("#dailyTaskLink").prop("href", `${herokuAPI.substring(0, herokuAPI.length - 3)}missing-resource`);
        else if(data.daily.id == -1) $("#dailyTaskLink").prop("href", `${herokuAPI.substring(0, herokuAPI.length - 3)}not-open`);
        else $("#dailyTaskLink").prop("href", `${herokuAPI.substring(0, herokuAPI.length - 3)}assignments/${data.daily.id}`);
    }).catch( err => {
        console.log(err);
        $("#updates").html(`<h2>Updates</h2><div class="entry"><p class="entry_header"><strong>Updates could not be retrieved.</strong></p></div>`); // Write updates to DOM
        $("#LoG_title").text("Available Videos"); // Write Life on Grounds name to DOM
        $("#LoG_link").text(""); // Write Life on Grounds name to DOM
        $("#LoG_link").prop("href", "#"); // Write Life on Grounds link to DOM
        $("#dailyTaskImg").prop("src", ""); // Set daily task image source
        $("#dailyTaskLink").prop("href", `${herokuAPI.substring(0, herokuAPI.length - 3)}missing-resource`);
        $("#pretest").css("background-image", "");
        $("#posttest").css("background-image", "");

    });

    var getHomeVideos = new Promise((resolve, reject) => {
        $.get(herokuAPI + "/home/videos", {
            hostname: window.location.hostname,
            courseID: 3559, // eventually, pull from URL
        }).done( (data, status) => {
            resolve(data);
        }).fail( err => {
            reject(err);
        });
    }).then( data => { // On success, write videos to DOM
        var html = ``;

        data.videos.forEach(video => {
            html += `<div class="onexys_video"><a class="colorbox" href="${video.src}">`;
            if(video.thumbnail) html += `<img class="onexys_thumbnail" src="${video.thumbnail}">`; // Use specified thumbnail
            else html += `<img class="onexys_thumbnail" src="${data.thumbnail}">`; // Use default thumbnail, found in other
            html += `<img class="onexys_playbutton" src="${data.playbutton}"></a></div><p><span style="font-size: 12pt;"><strong>${video.description}</strong></p>`;
        });

        $("#homepageVideos").html(html); // Write videos to DOM
    }).catch( err => {
        $("#homepageVideos").html("Video content failed to load."); // Write error message
    });

    //
    var addProgress = false, progress = null;

    // Gets the user's progress, including finished modules and badge status
    var getUserProgress = new Promise((resolve, reject) => {
        $.get(herokuAPI + "/users/progress", {
            hostname: window.location.hostname,
            courseID: 3559, // eventually, pull from URL
        }).done( (data, status) => {
            resolve(data);
        }).fail( err => {
            reject(err);
        });
    }).then( data => {
        if(addProgress) { // Modules have been written to DOM. Add in the user's progress
            var modules = $("#modules .module").length;
            $("#modules .module").each(function() {
                var progObj = progress.modules[$(this).find("#moduleID").attr("mID")],
                    children = $(this).children();
                if(progObj && progObj.practice) $(children[2]).addClass("completed");
                if(progObj && progObj.apply) $(children[3]).addClass("completed");
                if(progObj && progObj.practice && progObj.apply){
                    $(this).find("a").removeClass("available").addClass("completed");
                    modules--;
                }
            });
            if(modules == 0 && $("#posttest").hasClass("available")) {
                $("#posttest").prop("href", "/post-test");
                $("#posttest").prop("title", "You're ready for the Post Test. Click here to begin!")
            }
        } else progress = data;

        // Write badge progress to DOM. In order to do this, we need to:
        // 1. Figure out the user's 3 most recent badges
        // 2. Use the API to request info on those three badges
        // 3. Write those three badges to the DOM

        //==============================================================
    }).catch( err => {
        console.log("Failed to retrieve user progress. The page has been loaded, but omitting this data.")
    });

    var loadModules = new Promise((resolve, reject) => {
        console.log("Making call for module data");
        $.get(herokuAPI + "/modules", {
            hostname: window.location.hostname,
            courseID: 3559, // eventually, pull from URL
        }).done( (data, status) => {
            resolve(data);
        }).fail( err => {
            reject(err);
        });
    }).then( data => { // Write module data to DOM
        data.forEach(module => {
            var tooltip = "This module has not yet been opened.", visibility = "";
            if(module.open) {
                tooltip = "This module is currently available. Click here to open it!";
                visibility = "available";
            }
            $("#modules").append(`<div class="module"><div id="moduleID" style="display:none;" mID=${module._id}></div><a class="progress_box ${visibility}" style="width:187.5px !important; background-image:url(${module.button_background_image});" href="/modules/${module._id}" title="${tooltip}"><span>${module.primary_title}</span><br><span>${module.secondary_title}</span></a><div class="onexys_checkbox aleks_checkbox" style="margin-left:14px !important;"></div><div class="onexys_checkbox quiz_checkbox"></div></div><br>`); // Append module to the DOM
        });

        if(progress) { // If user progress has been fetched, go ahead and fill it in
            console.log("Filling in user progress from loadModules");
            var modules = $("#modules .module").length;
            $("#modules .module").each(function() {
                var progObj = progress.modules[$(this).find("#moduleID").attr("mID")],
                    children = $(this).children();
                if(progObj && progObj.practice) $(children[2]).addClass("completed");
                if(progObj && progObj.apply) $(children[3]).addClass("completed");
                if(progObj && progObj.practice && progObj.apply){
                    $(this).find("a").removeClass("available").addClass("completed");
                    modules--;
                }
            });
            if(modules >= 0 && $("#posttest").hasClass("available")) {
                $("#posttest").prop("href", "/post-test");
                $("#posttest").prop("title", "You're ready for the Post Test. Click here to begin!")
            }
        } else { // Otherwise, mark that progress needs to be added
            addProgress = true;
            console.log("User progress has not been retrieved yet. It has been flagged for completion later.")
        }
    });

    // Retrieves the leaderboard of a given course
    var getLeaderboard = new Promise((resolve, reject) => {
        reject(null);
    }).then( data => { // Write leaderboard entries into the DOM

    }).catch( err => { // Draw empty leaderboard as a placeholder
        $("#leaderboard").html(`<tr class="leader"><td></td><td>Leaderboard failed</td><td></td></tr><tr class="leader"><td></td><td>to load.</td><td></td></tr><tr class="leader"><td></td><td></td><td></td></tr>`);
    });


});
