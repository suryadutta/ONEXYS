// Used to swap out forms in edit home page section of the admin panel

// Variables to store initially provided information for context
// (mode) switching later on.
var pHead1, pHead2, pHead3;
var pText1, pText2, pText3;

// When the document loads, populate the variables with the current
// information.
$(document).ready(function() {
    pHead1 = $('#main_header').attr('value');
    pText1 = $('#main_text').text();

    pHead2 = $('#header2').attr('value');
    pText2 = $('#text2').text();

    pHead3 = $('#header3').attr('value');
    pText3 = $('#text3').text();
});


// Switches the form into single update mode. In this mode, a single
// update name and body text is available to enter, and the other
// fields are filled out automatically by the system to propagate
// existing updates downwards.
function doSingleUpdate() {
    // Clear out the first pair of fields (so the first entry is
    // blank), then shift the existing text fields down one.
    $('#main_header').attr('value', '');
    $('#main_text').text('');
    $('#header2').attr('value', pHead1);
    $('#text2').text(pText1);
    $('#header3').attr('value', pHead2);
    $('#text3').text(pText2);

    // Hide the fields for the second and third updates
    $('#header2').hide();
    $('#text2').hide();
    $('#header3').hide();
    $('#text3').hide();

    // Also hide their labels
    $('#lbl0').hide();
    $('#lbl1').hide();
    $('#lbl2').hide();
    $('#lbl3').hide();
    $('#hr1').hide();
    $('#hr2').hide();

    $('#btn-single').removeClass("btn-secondary").addClass("btn-dark");
    $('#btn-existing').removeClass("btn-dark").addClass("btn-secondary");
}

// Switches the form into edit existing updates mode. In this mode,
// the three currently visible updates are all available to edit.
function doExistingUpdates() {
    // Restore the fields to the original provided data
    $('#main_header').attr('value', pHead1);
    $('#main_text').text(pText1);
    $('#header2').attr('value', pHead2);
    $('#text2').text(pText2);
    $('#header3').attr('value', pHead3);
    $('#text3').text(pText3);

    // Fade in the other 2 update fields
    $('#header2').fadeIn('slow');
    $('#text2').fadeIn('slow');
    $('#header3').fadeIn('slow');
    $('#text3').fadeIn('slow');

    // Also fade in their labels
    $('#lbl0').fadeIn('slow');
    $('#lbl1').fadeIn('slow');
    $('#lbl2').fadeIn('slow');
    $('#lbl3').fadeIn('slow');
    $('#hr1').fadeIn('slow');
    $('#hr2').fadeIn('slow');

    $('#btn-existing').removeClass("btn-secondary").addClass("btn-dark");
    $('#btn-single').removeClass("btn-dark").addClass("btn-secondary");
}
