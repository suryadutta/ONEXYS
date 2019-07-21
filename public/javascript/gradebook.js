// Mode = 1: sort from least -> greatest
// Mode = -1: sort from greatest -> least
var mode = -1;
// The column which was most recently sorted.
var lastSorted = 0;

var teamCol = 0;
var lockProgression = 1;

// Sorts the table according to the specified column.
function sortTable(column) {
	lastSorted = column;
	var rows = $('.student');
	var teamLock = (lockProgression == 3);
	var aText, bText, r;

	rows.sort( (a, b) => {
		if(teamLock) {
			aText = $(a).find('td').eq(teamCol).text();
			bText = $(b).find('td').eq(teamCol).text();
		} else {
			aText = $(a).find('td').eq(column).text();
			bText = $(b).find('td').eq(column).text();
		}

		r = (aText < bText) ? 1 : aText == bText ? 0 : -1;
		// Sort empty boxes to the bottom of the table.
		if(aText == '') return 1;
		if(bText == '') return -1;

		if(isNaN(aText) || isNaN(bText)) {
			// One or both of the boxes is not a number, so
			// we have to use string sorting.
			if(teamLock && r == 0) {
				// In a team locked sort, we have to resolve ties using
				// the column which was requested.
				var aText = $(a).find('td').eq(column).text(),
					bText = $(b).find('td').eq(column).text();
				if(aText == '') return 1;
				if(bText == '') return -1;
				return (aText < bText) ? mode : aText == bText ? 0 : -1 * mode;
			} else if(teamLock) {
				return (aText < bText) ? -1 : aText == bText ? 0 : 1;
			}
			return (aText < bText) ? mode : aText == bText ? 0 : -1 * mode;
		} else {
			// Both boxes are numbers, so we should use a
			// number sorting method.
			if(teamLock && r == 0) {
				// In a team locked sort, we have to resolve ties using
				// the column which was requested.
				var aText = $(a).find('td').eq(column).text(),
					bText = $(b).find('td').eq(column).text();
				if(aText == '') return 1;
				if(bText == '') return -1;
				return (parseFloat(aText) - parseFloat(bText)) * mode;
			} else if(teamLock) {
				return (parseFloat(aText) - parseFloat(bText));
			}
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

$(document).ready( () => {
	var i = 0;
	$('#gradebook').first('tr').find('th').each( () => {
		// Assign column values to track which head was clicked.
		$(this).attr('col', i);

		// The functionality assigned to the Team Name column
		// is a little bit different, so we're going to give
		// it it's own onclick function.
		if( $(this).text() == 'Team Name' ) {
			teamCol = i;
			$(this).addClass('bg-info');
			$(this).removeClass('bg-light');
			$(this).click( () => {
				$('#gradebook').first('tr').find('th').each( () => {
					$(this).removeClass('bg-info');
					$(this).addClass('bg-light');
				});
				$(this).removeClass('bg-light');
				$(this).addClass('bg-info');
				switch(lockProgression) {
					case 1:
						// Sorting by direction 1. Switch to sort by 2
						swapDirection();
						break;
					case 2:
						// Sorting by direction 2. Switch to lock enabled
						swapDirection();
						$(this).addClass('team-lock-highlight');
						break;
					case 3:
						// Team lock enabled. Switch to button not selected
						lockProgression = -1;
						$(this).removeClass('team-lock-highlight');
						$(this).addClass('bg-light');
						$(this).removeClass('bg-info');
						break;
					default:
						// Not selected. Switch to sort by 1
						sortTable(parseInt($(this).attr('col')), mode);
						break;
				}
				lockProgression++;
			});
		} else {
			// Assign sorting and highlighting functionality
			// to each column header.
			$(this).click( () => {
				// If this box is already highlighted, the user
				// has asked to swap sorting order. We also don't
				// need to run highlighting code.
				if($(this).hasClass('bg-info')) swapDirection();
				else {
					$('#gradebook').first('tr').find('th').each( () => {
						$(this).removeClass('bg-info');
						$(this).addClass('bg-light');
					});
					$(this).removeClass('bg-light');
					$(this).addClass('bg-info');
					sortTable(parseInt($(this).attr('col')), mode);
				}
				if(lockProgression != 0 && lockProgression != 3) lockProgression = 0;
			});
		}
		i++;
	});

	// When hovering over a row, it should be outlined
	// with a border to make following a row easier.
	$('#gradebook tr').each( () => {
		if($(this).attr('id') != 'first') {
			$(this).hover( () => {
				$(this).css('border', '1px dashed black');
			},
			() => {
				$(this).css('border', '');
			});
		}
	});

	sortTable(teamCol, mode);
	exportcsv();
});

// Functionality to create CSV from grade table
function exportcsv() {
	var exp = [];
	$("#gradebook tr").each( () => {
		var row = [];
		$(this).children().each( () => {
			row.push($(this).text());
		});
		exp.push(row);
	});

	// "exp" is an array of 'rows'. Each 'row' is an array of each cell in the row.
	// Now, it must be converted into a csv.
	var raw = "";
	exp.forEach(row => {
		row.forEach(cell => {
			raw += cell + ", ";
		});
		raw += "\n";
	});

	var csvdata = "data:application/csv;charset=utf-8," + encodeURIComponent(raw);
	$("#export").text("Download CSV");
	$("#export").attr({
		"href": csvdata,
	});
}

function hideFutureAssignments() {
	var head = $("#gradebook-table-header th");
	head.each( () => {
		console.log($(this).attr('due'));
		if($(this).attr('due')) {
			console.log('Found date!');
		}
	})
}
