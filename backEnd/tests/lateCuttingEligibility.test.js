import test from "node:test";
import assert from "node:assert/strict";
import {
  getLateCuttingEligibleMinutes,
  getMorningLeaveAfternoonPunchNotMarked
} from "../controller/authController.js";

const day = ({ late = 20, early = 20, onsite = {}, leave = {} } = {}) => ({
  late,
  early,
  coverage: { onsite, leave }
});

test("late cutting ignores full-day onsite and leave", () => {
  assert.deepEqual(
    getLateCuttingEligibleMinutes(day({ onsite: { morning: true, afternoon: true } })),
    { late: 0, early: 0 }
  );
  assert.deepEqual(
    getLateCuttingEligibleMinutes(day({ leave: { morning: true, afternoon: true } })),
    { late: 0, early: 0 }
  );
});

test("late cutting retains only the attendance half not covered by onsite", () => {
  assert.deepEqual(
    getLateCuttingEligibleMinutes(day({ onsite: { morning: true, afternoon: false } })),
    { late: 0, early: 20 }
  );
  assert.deepEqual(
    getLateCuttingEligibleMinutes(day({ onsite: { morning: false, afternoon: true } })),
    { late: 20, early: 0 }
  );
});

test("morning half-day leave with an afternoon punch after 1:30 retains 0.5 not marked", () => {
  assert.equal(
    getMorningLeaveAfternoonPunchNotMarked({
      inTime: "1:57 PM",
      coverage: {
        leave: { morning: true, afternoon: false },
        attendance: { morning: false, afternoon: true }
      }
    }),
    0.5
  );
  assert.equal(
    getMorningLeaveAfternoonPunchNotMarked({
      inTime: "1:20 PM",
      coverage: {
        leave: { morning: true, afternoon: false },
        attendance: { morning: false, afternoon: true }
      }
    }),
    null
  );
});
