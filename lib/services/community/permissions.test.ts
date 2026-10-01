import { describe, expect, it } from "vitest";
import {
  canGrantMaintainer,
  canGrantReviewer,
  canModerate,
  canReview,
  canReviewContribution,
  reviewableSkillIds,
  roleChangeBlock,
  type CommunityActor,
} from "@/lib/services/community/permissions";

const learner: CommunityActor = { id: "learner", appRole: "USER", roles: [] };
const reviewer: CommunityActor = { id: "reviewer", appRole: "USER", roles: [{ skillId: "skill", role: "REVIEWER" }] };
const maintainer: CommunityActor = { id: "maintainer", appRole: "USER", roles: [{ skillId: "skill", role: "MAINTAINER" }] };
const admin: CommunityActor = { id: "admin", appRole: "ADMIN", roles: [] };

describe("community permissions", () => {
  it("lets reviewers review that niche only, and never their own contribution", () => {
    expect(canReview(reviewer, "skill")).toBe(true);
    expect(canReview(reviewer, "other")).toBe(false);
    expect(canReview(learner, "skill")).toBe(false);
    expect(canReviewContribution(reviewer, "skill", "author")).toBe(true);
    expect(canReviewContribution(reviewer, "skill", "reviewer")).toBe(false);
    expect(canReviewContribution(reviewer, "skill", null)).toBe(true);
  });

  it("treats someone with both rows as a maintainer", () => {
    const both: CommunityActor = {
      id: "both",
      appRole: "USER",
      roles: [
        { skillId: "skill", role: "REVIEWER" },
        { skillId: "skill", role: "MAINTAINER" },
      ],
    };
    expect(canModerate(both, "skill")).toBe(true);
  });

  it("lets admins change any role, maintainers change reviewers here, and nobody change their own", () => {
    expect(roleChangeBlock(admin, "someone", "skill", "MAINTAINER")).toBeNull();
    expect(roleChangeBlock(maintainer, "someone", "skill", "REVIEWER")).toBeNull();
    expect(roleChangeBlock(maintainer, "someone", "other", "REVIEWER")).not.toBeNull();
    expect(roleChangeBlock(maintainer, "someone", "skill", "MAINTAINER")).not.toBeNull();
    expect(roleChangeBlock(reviewer, "someone", "skill", "REVIEWER")).not.toBeNull();
    expect(roleChangeBlock(admin, "admin", "skill", "REVIEWER")).not.toBeNull();
  });

  it("lists the niches a person reviews", () => {
    expect(reviewableSkillIds(admin)).toBe("all");
    expect(reviewableSkillIds(reviewer)).toEqual(["skill"]);
    expect(reviewableSkillIds(maintainer)).toEqual(["skill"]);
    expect(reviewableSkillIds(learner)).toEqual([]);
  });

  it("lets maintainers moderate one niche and admins moderate all of them", () => {
    expect(canModerate(maintainer, "skill")).toBe(true);
    expect(canModerate(maintainer, "other")).toBe(false);
    expect(canModerate(reviewer, "skill")).toBe(false);
    expect(canModerate(admin, "other")).toBe(true);
    expect(canGrantReviewer(maintainer, "skill")).toBe(true);
    expect(canGrantMaintainer(maintainer)).toBe(false);
    expect(canGrantMaintainer(admin)).toBe(true);
  });
});
