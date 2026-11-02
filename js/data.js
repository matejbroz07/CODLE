window.CodleData = {
  user: {
    streakActive: true,
    streakCount: 67,
    gems: 2450,
    xpToday: 120,
    dailyGoal: 200,
    rank: "Global Elite",
    level: 12,
    levelXp: 340,        // XP earned inside the current level (demo value)
    levelXpNeeded: 500,  // XP required to reach the next level (demo value)
    nextBadge: {
      name: "Markup Rookie",
      label: "Complete Unit 2",
      progressPercent: 50
    }
  },
  // Courses and lessons come from js/curriculum.js; this is only how far the demo learner got.
  activeCourse: "html",
  progress: {
    html: {
      currentUnit: 2,
      currentMilestone: 3,
      currentMilestoneProgress: 40
    },
    css: {
      currentUnit: 1,
      currentMilestone: 2,
      currentMilestoneProgress: 0
    },
    javascript: {
      currentUnit: 1,
      currentMilestone: 3,
      currentMilestoneProgress: 20
    }
  }
};
