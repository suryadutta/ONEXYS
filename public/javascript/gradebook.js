// Mode = 1: sort from least -> greatest
// Mode = -1: sort from greatest -> least
var mode = 1;
// The column which was most recently sorted.
var lastSorted = 0;

// Sorts the table according to the specified column.
function sortTable(column) {
	lastSorted = column;
	var rows = $('.student');
	
	rows.sort(function(a, b) {
		var aText = $(a).find('td').eq(column).text(),
			bText = $(b).find('td').eq(column).text();
		
		// Sort empty boxes to the bottom of the table.
		if(aText == '') return 1;
		if(bText == '') return -1;
		
		if(isNaN(aText) || isNaN(bText)) {
			// One or both of the boxes is not a number, so
			// we have to use string sorting.
			return (aText < bText) ? mode : aText == bText ? 0 : -1 * mode;
		} else {
			// Both boxes are numbers, so we should use a
			// number sorting method.
			return (parseFloat(aText) - parseFloat(bText)) * mode;
		}
	});
	
	// Display the sorted rows.
	$('#gradebook').append(rows);
}

// Switches the direction of the sorting
// and sorts with the new direction.
function swapDirection() {
	if(mode == 1) mode = -1;
	else mode = 1;
	sortTable(lastSorted);
}

$(document).ready(function() {
	var i = 0;
	$('#gradebook').first('tr').find('th').each(function() {
		// Assign column values to track which head was clicked.
		$(this).attr('col', i);
		
		// Assign sorting and highlighting functionality
		// to each column header.
		$(this).click(function() {
			// If this box is already highlighted, the user
			// has asked to swap sorting order. We also don't
			// need to run highlighting code.
			if($(this).hasClass('bg-info')) swapDirection();
			else {
				$('#gradebook').first('tr').find('th').each(function() {
					$(this).removeClass('bg-info');
					$(this).addClass('bg-light');
				});
				$(this).removeClass('bg-light');
				$(this).addClass('bg-info');
				sortTable(parseInt($(this).attr('col')), mode);
			}
		});
		i++;
	});
	
	// When hovering over a row, it should be outlined
	// with a border to make following a row easier.
	$('#gradebook tr').each(function() {
		if($(this).attr('id') != 'first') {
			$(this).hover(function() {
				$(this).css('border', '1px dashed black');
			},
			function() {
				$(this).css('border', '');
			});
		}
	});
});



