/// <reference types="jest" />

const { updateModuleProgress, updateBadgeProgress } = require("../bin/cron");
const cron = require("node-cron");
jest.mock("../models/mongo");
const mongo = require("../models/mongo");
jest.mock("node-cron", () => ({ schedule: jest.fn() }));

describe("Cron job", () => {
  const courseID = "8310",
    assignmentIdToType = {
      10000: { type: "practice", moduleID: 1, subject: "econ" },
      10001: { type: "apply", moduleID: 1, subject: "econ" },
      10002: { type: "daily" },
      10003: { type: "reflection", moduleID: 1 },
    },
    userProgress = {
      user: "99999",
      badges: {},
      modules: {},
      score: 0,
      team: "Jest",
    },
    modules = [{ _id: 1, practice_cutoff: 90, quiz_cutoff: 1, subject: "econ" }],
    badgeIdToPoints = { 1: 200, 7: 200, 11: 200, 15: 200, 28: 200 },
    submissions = [
      { assignment_id: 10000, score: 90 },
      { assignment_id: 10001, score: 2 },
      { assignment_id: 10002, score: 50 },
      { assignment_id: 10003, score: 90 },
    ],
    logs = {};
  let completed;

  describe("updateModuleProgress()", () => {
    const submissionCombinations = [
      ["practice", [submissions[0]]],
      ["apply", [submissions[1]]],
      ["daily", [submissions[2]]],
      ["reflection", [submissions[3]]],
    ];

    beforeEach(() => {
      completed = {
        practice: 0,
        apply: 0,
        reflection: 0,
        daily: 0,
      };
    });

    it.each(submissionCombinations)("updates %s progress", async (inputType, submissions) => {
      const score = await updateModuleProgress(
        courseID,
        assignmentIdToType,
        modules,
        userProgress,
        submissions,
        completed,
        {}
      );
      expect(score).toBe(100);
      Object.keys(completed).map((type) => {
        if (type === inputType || type === assignmentIdToType[submissions[0].assignment_id].subject)
          expect(completed[type]).toBe(1);
        else expect(completed[type]).toBe(0);
      });
      if (inputType === "practice" || inputType === "apply") {
        expect(mongo.updateUserProgressField).toHaveBeenCalledTimes(1);
        expect(mongo.updateUserProgressField).toHaveBeenCalledWith(
          courseID,
          userProgress.user,
          "$set",
          "modules",
          { 1: { [inputType]: true } }
        );
      }
    });

    it("updates with a combination of submssions", async () => {
      const score = await updateModuleProgress(
        courseID,
        assignmentIdToType,
        modules,
        userProgress,
        submissions,
        completed,
        logs
      );
      expect(score).toBe(400);
      expect(completed).toEqual({
        practice: 1,
        apply: 1,
        reflection: 1,
        daily: 1,
        econ: 2,
      });
      expect(mongo.updateUserProgressField).toHaveBeenCalledTimes(1);
      expect(mongo.updateUserProgressField).toHaveBeenCalledWith(
        courseID,
        userProgress.user,
        "$set",
        "modules",
        {
          1: { practice: true, apply: true },
        }
      );
    });
  });

  describe("updateBadgeProgress()", () => {
    it("updates score for multiple badges", async () => {
      const completed = {
        practice: 1,
        apply: 1,
        reflection: 1,
        daily: 1,
        econ: 2,
      };
      const score = await updateBadgeProgress(
        courseID,
        userProgress,
        completed,
        badgeIdToPoints,
        logs
      );
      expect(mongo.updateUserProgressField).toHaveBeenCalledTimes(1);
      expect(score).toBe(1000);
    });
  });

  /**
   * @todo - integration test
   */
  // describe("cron.schedule()", () => {
  //   cron.schedule.mockImplementation(async (freq, callback) => await callback());
  //   mongo.client.db.mockImplementation(() => ({
  //     collection: (col) => ({ find: () => ({ sort: () => ({ toArray: () => {
  //       if (col === "modules")
  //     } }) }) }),
  //   }));
  //   require("../bin/cron");
  //   expect(cron.schedule).toBeCalledWith("*/15 * * * *", expect.any(Function));
  // });
});
