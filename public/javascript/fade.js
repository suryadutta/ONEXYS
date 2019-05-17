// Used to swap out forms in edit home page section of the admin panel


// Switches the form into single update mode. In this mode, a single
// update name and body text is available to enter, and the other
// fields are filled out automatically by the system to propagate
// existing updates downwards.

// Store initially provided information for context (mode) switching later on
var pHead1, pHead2, pHead3;
var pText1, pText2, pText3;

$(document).ready(function() {
    pHead1 = $('#main_header').attr('value');
    pText1 = $('#main_text').text();

    pHead2 = $('#header2').attr('value');
    pText2 = $('#text2').text();

    pHead3 = $('#header3').attr('value');
    pText3 = $('#text3').text();
});



function doSingleUpdate() {
    $('#main_header').attr('value', '');
    $('#main_text').text('');
    $('#header2').attr('value', pHead1);
    $('#text2').text(pText1);
    $('#header3').attr('value', pHead2);
    $('#text3').text(pText2);

    $('#header2').hide();
    $('#text2').hide();
    $('#header3').hide();
    $('#text3').hide();

    $('#lbl0').hide();
    $('#lbl1').hide();
    $('#lbl2').hide();
    $('#lbl3').hide();
}

// Switches the form into edit existing updates mode. In this mode,
// the three currently visible updates are all available to edit.
function doExistingUpdates() {
    $('#main_header').attr('value', pHead1);
    $('#main_text').text(pText1);
    $('#header2').attr('value', pHead2);
    $('#text2').text(pText2);
    $('#header3').attr('value', pHead3);
    $('#text3').text(pText3);

    $('#header2').fadeIn('slow');
    $('#text2').fadeIn('slow');
    $('#header3').fadeIn('slow');
    $('#text3').fadeIn('slow');

    $('#lbl0').fadeIn('slow');
    $('#lbl1').fadeIn('slow');
    $('#lbl2').fadeIn('slow');
    $('#lbl3').fadeIn('slow');
}
