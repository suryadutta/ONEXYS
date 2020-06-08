
$(document).ready(function () {
    if (heroku != undefined) { // Only do this stuff if the heroku server's name is defined
        $(".moduleEditor").change(function () { // Attach to all module editing checkboxes
            var submit = {}; submit.id = $(this).attr('id'); // Set ID
            if ($(this).attr("edit") == "open") submit.open = $(this).is(":checked"); // Set either open or due
            else if ($(this).attr("edit") == "due") submit.due = $(this).is(":checked");
            $.post("https://" + heroku + ".herokuapp.com/admin/updateModule", submit).always((data, status) => { // This function fires after the GET req
                console.log("moduleAJAX submit data:")
                console.log(submit)
                if (status != 'success') { // If unsuccessful, handle the failure
                    alert("Update failed. Try again later."); // Notify the user
                    $(this).prop("checked", !$(this).is(":checked")); // Reverse the change
                }
            });
        });
    } else { // Lock the checkboxes if the GETs are not being performed
        $(".moduleEditor").prop("disabled", true);
    }
});
