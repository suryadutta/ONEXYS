
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

    if(needs.includes("homepageData")) var loadHomepage = new Promise((resolve, reject) => {
        $.get(herokuAPI + "/home/updates", {
            hostname: window.location.hostname,
            courseID: 3559 // Eventually, pull this from URL
        }).done((data, status) => {
            resolve(data);
        }).catch(err => {
            reject(err);
        });
    }).then(homepage => {
        console.log(data);
    }).catch(err => {
        $("#previewBtn").remove(); $("#previewModal").remove();
        alert("Homepage preview was unable to load. You will be unable to preview changes.");
    });
});
