
$(document).ready(function() {
    if(heroku != undefined) { // Only do this stuff if the heroku server's name is defined
        $(".moduleEditor").change(function() { // Attach to all module editing checkboxes
            console.log("ID " + $(this).attr("id"));
            var submit = {}; submit.id = $(this).attr('id'); // Set ID
            // Set either due or open
            if($(this).attr("edit") == "open") submit.open = $(this).is(":checked");
            else if($(this).attr("edit") == "due") submit.due = $(this).is(":checked");
            console.log(submit.open + " " + submit.due);
            $.get("https://" + heroku + ".herokuapp.com/admin/updateModule", submit).complete((data, status) => { // This function fires after the GET req
                console.log(status);
                if(status != 'success') { // If unsuccessful, handle the failure
                    alert("Update failed. Try again later."); // Notify the user
                    $(this).prop("checked", !$(this).is(":checked")); // Reverse the change
                }
            });
        });
    } else { // Lock the checkboxes if the GETs are not being performed
        $(".moduleEditor").prop("disabled", true);
    }
});
