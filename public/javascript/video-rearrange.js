
$(document).ready(function() {
    console.log("https://" + heroku + ".herokuapp.com/updateVideo");
    if(heroku) { // If the server was unable to serve this, we cannot submit AJAXes, so don't even make them movable
        $("#home-videos-container").sortable({ // Initialize jQuery UI 'sortability' (allows rearragement of items)
            revert: true, // Have items glide back into place if not dropped perfectly
            update: (event, ui) => { // Whenever the order is changed, post changes via AJAX
                $("#home-videos-container").children().each(function(i) {
                    if(heroku) {
                        console.log(i);
                        $.get("https://" + heroku + ".herokuapp.com/updateVideo", {
                            id: $(this).attr("id"),
                            position: i,
                        }, (data, status) => {
                            console.log(data);
                            console.log(status);
                        });
                    } else alert("Rearrangement of videos has not been saved due to a server error. Try reloading the page.");
                });
            }
        });
    }

    // Disable text highlight on drag-able items
	$("#home-videos-container, .onexys-video").disableSelection();
});
