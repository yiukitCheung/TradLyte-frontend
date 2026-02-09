export interface Milestone {
  id: string;
  title: string;
  financialTarget: number;
  completed: boolean;
  description: string;
  order: number;
}

export const generateMilestones = (goalTitle: string, targetAmount: number): Milestone[] => {
  const goalLower = goalTitle.toLowerCase();
  const milestones: Milestone[] = [];
  let order = 1;

  // Emergency Fund Goal
  if (goalLower.includes('emergency') || goalLower.includes('fund')) {
    milestones.push({
      id: `${order}-1`,
      title: 'Build $1,000 Starter Fund',
      financialTarget: 1000,
      completed: false,
      description: 'Start with a small emergency fund',
      order: order++
    });
    milestones.push({
      id: `${order}-1`,
      title: 'Reach $5,000 Milestone',
      financialTarget: 5000,
      completed: false,
      description: 'Build a solid foundation',
      order: order++
    });
    if (targetAmount > 10000) {
      milestones.push({
        id: `${order}-1`,
        title: 'Complete Emergency Fund',
        financialTarget: targetAmount,
        completed: false,
        description: 'Full 6-month expense coverage',
        order: order++
      });
    }
  }
  // Home Purchase Goal
  else if (goalLower.includes('home') || goalLower.includes('house') || goalLower.includes('property')) {
    milestones.push({
      id: `${order}-1`,
      title: 'Build Emergency Fund First',
      financialTarget: 10000,
      completed: false,
      description: 'Save 6 months of expenses before home purchase',
      order: order++
    });
    milestones.push({
      id: `${order}-1`,
      title: 'Save 10% of Down Payment',
      financialTarget: targetAmount * 0.1,
      completed: false,
      description: 'First milestone toward down payment',
      order: order++
    });
    milestones.push({
      id: `${order}-1`,
      title: 'Reach 50% of Down Payment',
      financialTarget: targetAmount * 0.5,
      completed: false,
      description: 'Halfway to your down payment goal',
      order: order++
    });
    milestones.push({
      id: `${order}-1`,
      title: 'Complete Down Payment',
      financialTarget: targetAmount,
      completed: false,
      description: 'Full down payment saved',
      order: order++
    });
  }
  // Retirement Goal
  else if (goalLower.includes('retirement') || goalLower.includes('retire')) {
    milestones.push({
      id: `${order}-1`,
      title: 'First $10,000 Saved',
      financialTarget: 10000,
      completed: false,
      description: 'Start your retirement journey',
      order: order++
    });
    milestones.push({
      id: `${order}-1`,
      title: 'Reach $50,000 Milestone',
      financialTarget: 50000,
      completed: false,
      description: 'Building momentum',
      order: order++
    });
    if (targetAmount > 100000) {
      milestones.push({
        id: `${order}-1`,
        title: 'Reach $100,000 Milestone',
        financialTarget: 100000,
        completed: false,
        description: 'Significant progress',
        order: order++
      });
    }
    milestones.push({
      id: `${order}-1`,
      title: 'Quarter Way to Goal',
      financialTarget: targetAmount * 0.25,
      completed: false,
      description: '25% of retirement goal',
      order: order++
    });
  }
  // Investment/Portfolio Goal
  else if (goalLower.includes('investment') || goalLower.includes('portfolio') || goalLower.includes('invest')) {
    milestones.push({
      id: `${order}-1`,
      title: 'First $5,000 Invested',
      financialTarget: 5000,
      completed: false,
      description: 'Start your investment journey',
      order: order++
    });
    milestones.push({
      id: `${order}-1`,
      title: 'Reach $25,000 Milestone',
      financialTarget: 25000,
      completed: false,
      description: 'Building your portfolio',
      order: order++
    });
    if (targetAmount > 50000) {
      milestones.push({
        id: `${order}-1`,
        title: 'Halfway to Goal',
        financialTarget: targetAmount * 0.5,
        completed: false,
        description: '50% of investment goal',
        order: order++
      });
    }
  }
  // Travel Goal
  else if (goalLower.includes('travel') || goalLower.includes('trip') || goalLower.includes('vacation')) {
    milestones.push({
      id: `${order}-1`,
      title: 'Save 25% of Trip Cost',
      financialTarget: targetAmount * 0.25,
      completed: false,
      description: 'First quarter saved',
      order: order++
    });
    milestones.push({
      id: `${order}-1`,
      title: 'Reach Halfway Point',
      financialTarget: targetAmount * 0.5,
      completed: false,
      description: '50% of travel fund',
      order: order++
    });
    milestones.push({
      id: `${order}-1`,
      title: 'Complete Travel Fund',
      financialTarget: targetAmount,
      completed: false,
      description: 'Ready for your adventure',
      order: order++
    });
  }
  // Business/Startup Goal
  else if (goalLower.includes('business') || goalLower.includes('startup') || goalLower.includes('company')) {
    milestones.push({
      id: `${order}-1`,
      title: 'Initial Capital: $5,000',
      financialTarget: 5000,
      completed: false,
      description: 'Startup capital milestone',
      order: order++
    });
    milestones.push({
      id: `${order}-1`,
      title: 'Reach 25% of Goal',
      financialTarget: targetAmount * 0.25,
      completed: false,
      description: 'Quarter way to business funding',
      order: order++
    });
    milestones.push({
      id: `${order}-1`,
      title: 'Halfway to Funding',
      financialTarget: targetAmount * 0.5,
      completed: false,
      description: '50% of business capital',
      order: order++
    });
  }
  // Default: Generic milestones
  else {
    const quarter = targetAmount * 0.25;
    const half = targetAmount * 0.5;
    const threeQuarter = targetAmount * 0.75;

    if (targetAmount > 10000) {
      milestones.push({
        id: `${order}-1`,
        title: 'First $5,000',
        financialTarget: 5000,
        completed: false,
        description: 'Initial milestone',
        order: order++
      });
    }
    milestones.push({
      id: `${order}-1`,
      title: '25% Complete',
      financialTarget: quarter,
      completed: false,
      description: 'Quarter way to goal',
      order: order++
    });
    milestones.push({
      id: `${order}-1`,
      title: 'Halfway There',
      financialTarget: half,
      completed: false,
      description: '50% of goal achieved',
      order: order++
    });
    milestones.push({
      id: `${order}-1`,
      title: '75% Complete',
      financialTarget: threeQuarter,
      completed: false,
      description: 'Almost there',
      order: order++
    });
  }

  // Always add final goal milestone
  milestones.push({
    id: `${order}-1`,
    title: 'Goal Achieved!',
    financialTarget: targetAmount,
    completed: false,
    description: 'Congratulations! You reached your goal',
    order: order++
  });

  return milestones;
};
