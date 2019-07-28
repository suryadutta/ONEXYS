
$(document).ready(function() {
    // Initialize jQuery UI 'sortability' (allows rearragement of items)
	$("#home-videos-container").sortable({
		revert: true, // Have items glide back into place if not dropped perfectly
		update: (event, ui) => { // Whenever the order is changed, post changes via AJAX
			$("#home-videos-container").children().each(function() {
				console.log($(this).attr("id"));
			});
		}
	});

    // Disable text highlight on items you can drag
	$("#home-videos-container, .onexys-video").disableSelection();
});
