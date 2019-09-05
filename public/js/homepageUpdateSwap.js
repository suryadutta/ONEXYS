// Used to swap out forms in edit home page section of the admin panel

// Variables to store initially provided information for context
// (mode) switching later on.
var pHead1, pHead2, pHead3;
var pText1, pu2t, pu3t;
var all = true;

// When the document loads, populate the variables with the current
// information.
$(document).ready(function() {
    pHead1 = $('#u1h').attr('value');
    pText1 = $('#u1t').text();

    pHead2 = $('#u2h').attr('value');
    pu2t = $('#u2t').text();

    pHead3 = $('#u3h').attr('value');
    pu3t = $('#u3t').text();
});

function toggleUpdateEditMode() {
    if(all) doSingleUpdate();
    else doExistingUpdates();
}

// Switches the form into single update mode. In this mode, a single
// update name and body text is available to enter, and the other
// fields are filled out automatically by the system to propagate
// existing updates downwards.
function doSingleUpdate() {
    all = false;
    // Clear out the first pair of fields (so the first entry is
    // blank), then shift the existing text fields down one.
    $('#u1h').attr('value', '');
    $('#u1t').text('');
    console.log("clear");
    $('#u2h').attr('value', pHead1);
    $('#u2t').text(pText1);
    $('#u3h').attr('value', pHead2);
    $('#u3t').text(pu2t);

    // Hide the fields for the second and third updates
    $('#u2h').hide();
    $('#u2t').hide();
    $('#u3h').hide();
    $('#u3t').hide();

    // Also hide their labels
    $('#u2l').hide();
    $('#u3l').hide();

    $('#updateToggle').text('Click to edit all current updates');
}

// Switches the form into edit existing updates mode. In this mode,
// the three currently visible updates are all available to edit.
function doExistingUpdates() {
    all = true;
    // Restore the fields to the original provided data
    $('#u1h').attr('value', pHead1);
    $('#u1t').text(pText1);
    $('#u2h').attr('value', pHead2);
    $('#u2t').text(pu2t);
    $('#u3h').attr('value', pHead3);
    $('#u3t').text(pu3t);

    // Fade in the other 2 update fields
    $('#u2h').fadeIn('slow');
    $('#u2t').fadeIn('slow');
    $('#u3h').fadeIn('slow');
    $('#u3t').fadeIn('slow');

    // Also fade in their labels
    $('#u2l').fadeIn('slow');
    $('#u3l').fadeIn('slow');

    $('#updateToggle').text('Click to add a single update');
}
