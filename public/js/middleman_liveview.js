const hostname = "https://educationvirginia.instructure.com/";
$(document).ready(function () {
  $.get(`${herokuAPI}/modules`, {
    hostname,
    courseID,
  })
    .then((modules) => {
      writeModules(modules);
    })
    .catch((err) => {
      console.log(err);
      alert("There was an error getting modules.");
    })
    .always(() => hideLoadingBar());
});

function writeModules(modules) {
  modules.map((module) => {
    $("#module_table").append(
      `<tr>
        <td>${module._id}</td>
        <td>=${module.primary_title}</td>
        <td>=${module.secondary_title}</td>
        <td>=${module.open}</td>
        <td>=${module.practice_link}</td>
        <td>=${module.quiz_link}</td>
        <td>=${module.reflection_link}</td>
        <td>
          <a class="btn.btn-primary" href="/modules/${module._id}" target="_blank"> Live View </a>
      </tr>`
    );
  });
}

function hideLoadingBar() {
  $("#fullscr-loading").animate(
    {
      opacity: 0,
    },
    750,
    "swing",
    () => {
      $("#fullscr-loading").remove();
    }
  );
}
