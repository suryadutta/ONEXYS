// COURSE ID AVAILABLE IN:
// courseIDFromURL

$(document).ready(function() {
    var progress = null, badges = null;

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
        if(badges) {
            //console.log("Adding badges from getUserProgress");
            writeBadges(badges, data.badges);
        } else progress = data.badges;
    }).catch( err => {
        console.log(err);
        console.log("Failed to retrieve user progress. The page has been loaded, but omitting this data.")
    });

    var loadBadges = new Promise((resolve, reject) => {
        $.get(herokuAPI + "/badges", {
            hostname: window.location.hostname,
            courseID: 3559, // eventually, pull from URL
        }).done( (data, status) => {
            resolve(data);
        }).fail(err => reject(err));
    }).then( data => {
        if(progress) {
            writeBadges(data, progress);
        } else {
            badges = data;
            //console.log("Badge progress has not been retrieved yet. Display badge progress has been flagged for completion later.")
        }
    }).catch( err => {
        // TODO
        console.log("Badge loading failed.");
    });
});

function writeBadges(badges, progress) {
    // TODO
}
