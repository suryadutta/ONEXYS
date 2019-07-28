
$(document).ready(function() {
    $("#home-videos-container, .onexys-video").disableSelection(); // Disable text highlight on drag-able items
    if(heroku) { // If the server was unable to serve this, we cannot submit AJAXes, so don't even make them movable
        $("#home-videos-container").sortable({ // Initialize jQuery UI 'sortability' (allows rearragement of items)
            revert: true, // Have items glide back into place if not dropped perfectly
            update: (event, ui) => { // Whenever the order is changed, post changes via AJAX
                if(heroku) {
                    $("#home-videos-container").children().each(function(i) { // Make AJAX req to update each video
                        $.get("https://" + heroku + ".herokuapp.com/admin/updateVideo", {
                            id: $(this).attr("id"),
                            position: i,
                        }, (data, status) => {
                            if(status != 'success') alert("Rearrangement of videos failed due to a server error. Try again later.");
                        });
                    });
                } else alert("You're changes are not being saved because the local pointer to heroku was not set by the server or has been modified.");
            }
        });
    }
});
