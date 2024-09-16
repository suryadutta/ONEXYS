/// <reference types="Cypress" />

describe("Homepage Regression Test", { defaultCommandTimeout: 5000 }, () => {
  before(() => {
    cy.intercept("GET", "/api/home/updates?**").as("updates");
    cy.intercept("GET", "/api/home/videos?**").as("videos");
    cy.intercept("GET", "/api/todaysDaily?**").as("todaysDaily");
    cy.intercept("GET", "/api/users/progress?**").as("progress");
    cy.intercept("GET", "/api/badges?**").as("badges");
    cy.intercept("GET", "/api/modules?**").as("modules");

    cy.setCookie("session", Cypress.env("session"));
    cy.setCookie("session.sig", Cypress.env("session_sig"));
    cy.visit("/home");

    // Wait for API calls to finish
    cy.wait("@updates");
    cy.wait("@videos");
    cy.wait("@todaysDaily");
    cy.wait("@progress");
    cy.wait("@badges");
    cy.wait("@modules");
  });

  /**
   * @todo - Find a better way to preserve data between each test. Alias get cleared out past the first test, so all alias checks are here
   */
  it("displays the modules, badges, updates, and life on grounds videos", () => {
    // Check modules titles and links appear
    cy.get("@modules").should(({ request, response }) => {
      const modules = response.body;
      cy.get(".aleks_checkbox").should("have.length", modules.length);
      cy.get(".quiz_checkbox").should("have.length", modules.length);
      cy.get(".progress_box").each(($a, index, $list) => {
        switch (index) {
          case 0:
            expect($a.text()).to.equal("Pre-Test");
            break;
          case $list.length - 1:
            expect($a.text()).to.equal("Post-Test");
            break;
          default:
            expect($a.attr("href")).to.equal(`/modules/${modules[index - 1]._id}`);
            expect($a.children()[0].innerText).to.equal(modules[index - 1].primary_title);
            expect($a.children()[2].innerText).to.equal(modules[index - 1].secondary_title);
        }
      });
    });

    // Check badges or correct message appears
    cy.get("@progress").should(({ request, response }) => {
      const progress = response.body;
      cy.get("#recent_badges").within(() => {
        if (Object.keys(progress.badges).length <= 0)
          cy.findByText("Earn some badges and you will see them here!");
        else {
          cy.get(".badge_container").should(
            "have.length",
            Math.min(3, Object.keys(progress.badges).length)
          );
        }
      });
    });

    // Check update text is visible
    cy.get("@updates").should(({ request, response }) => {
      const updates = response.body;
      cy.get("#updates").within(() => {
        cy.findByText(updates.main_header.replace(/<[^>]*>?/gm, ""));
        cy.findAllByText(new RegExp(updates.main_text.split(" ")[0]));
        cy.findByText(updates.header2.replace(/<[^>]*>?/gm, ""));
        cy.findAllByText(new RegExp(updates.text2.split(" ")[0]));
        cy.findByText(updates.header3.replace(/<[^>]*>?/gm, ""));
        cy.findAllByText(new RegExp(updates.text3.split(" ")[0]));
      });
    });
  });

  it("checks point count is a number", () => {
    cy.get("#point_count").then(($p) => expect(parseInt($p.text())).to.satisfy(Number.isInteger));
  });

  it("ensures daily task image and link are correct", () => {
    cy.get("#dailyTaskImg").then(($img) => expect($img.attr("src")).to.exist);
    cy.get("#dailyTaskLink").then(($a) => {
      const today = new Date();
      if (today.getDay() === 7 || today.getDay() === 0)
        expect($a[0].pathname).to.eq("/missing-daily");
      else expect($a[0].pathname).to.match(/\/courses\/\d{4}\/assignments\/\d{5}/);
    });
  });

  it("displays no leaderboard errors", () => {
    cy.findByText(/Leaderboard info not available./).should("not.exist");
  });
});
