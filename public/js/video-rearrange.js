$(document).ready(function () {
  $(".vid-obj .row").disableSelection(); // Disable text highlight on drag-able items
  if (herokuAPI) {
    // If the server was unable to serve this, we cannot submit AJAXes, so don't even make them movable
    $("#homepageVideosEdit").sortable({
      // Initialize jQuery UI 'sortability' (allows rearragement of items)
      revert: true, // Have items glide back into place if not dropped perfectly
      update: (event, ui) => {
        // Whenever the order is changed, post changes via AJAX
        // console.log(ui.position);
        if (herokuAPI) {
          //var end = $("#homepageVideos").children().length - 1, failed = "";
          $("#homepageVideosEdit")
            .find(".video-element")
            .each((i, elem) => {
              // Make AJAX req to update each video
              //console.log($(elem).find(".id").attr("value"));
              //console.log(i, $(elem).find("p").html());
              //console.log($(elem).find(".colorbox").attr("href"));

              let thumb = $(elem).find(".onexys_thumbnail").hasClass("default")
                ? ""
                : $(elem).find(".onexys_thumbnail").attr("src");

              updateVideo(
                $(elem).find(".id").attr("value"),
                $(elem).find(".colorbox").attr("href"),
                $(elem).find("p").html(),
                thumb,
                i + 1
              );
            });
        } else
          alert(
            "You're changes are not being saved because the local pointer to heroku was not set by the server or has been deleted."
          );
      },
    });
  }
});
