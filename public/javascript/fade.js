// Used to swap out forms in edit home page section of the admin panel


// Switches the form into single update mode. In this mode, a single
// update name and body text is available to enter, and the other
// fields are filled out automatically by the system to propagate
// existing updates downwards.

// Store initially provided information for context (mode) switching later on
var pHead1, pHead2, pHead3;
var pText1, pText2, pText3;

$(document).ready(function() {
    pHead1 = $('#main_header').innerHTML;
    pText1 = $('#main_text').innerHTML;

    pHead2 = $('#header2').innerHTML;
    pText2 = $('#text2').innerHTML;

    pHead3 = $('#header3').innerHTML;
    pText3 = $('#text3').innerHTML;
});



function doSingleUpdate() {
    $('#main_header').innerHTML = '';
    $('#main_text').innerHTML = '';
    $('#header2').innerHTML = pHead1;
    $('#text2').innerHTML = pText1;
    $('#header3').innerHTML = pHead2;
    $('#text3').innerHTML = pText2;

    $('#header2').hide();
    $('#text2').hide();
    $('#header3').hide();
    $('#text3').hide();
}

// Switches the form into edit existing updates mode. In this mode,
// the three currently visible updates are all available to edit.
function doExistingUpdates() {
    $('#main_header').innerHTML = pHead1;
    $('#main_text').innerHTML = pText1;
    $('#header2').innerHTML = pHead2;
    $('#text2').innerHTML = pText2;
    $('#header3').innerHTML = pHead3;
    $('#text3').innerHTML = pText3;

    $('#header2').fadeIn('slow');
    $('#text2').fadeIn('slow');
    $('#header3').fadeIn('slow');
    $('#text3').fadeIn('slow');
}
