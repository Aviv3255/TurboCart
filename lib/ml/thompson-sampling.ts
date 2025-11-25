/**
 * Thompson Sampling (Bayesian Multi-Armed Bandit) Implementation
 *
 * This algorithm balances exploration vs exploitation by:
 * - Maintaining Beta distribution parameters (alpha, beta) for each arm
 * - Sampling from each distribution to select the best option
 * - Updating distributions based on observed outcomes
 */

/**
 * Beta distribution random sample using Cheng's rejection algorithm
 * Returns a random sample from Beta(alpha, beta)
 */
export function sampleBeta(alpha: number, beta: number): number {
  // Handle edge cases
  if (alpha <= 0 || beta <= 0) {
    return 0.5;
  }

  // Use Gamma distribution to generate Beta samples
  // Beta(alpha, beta) = Gamma(alpha, 1) / (Gamma(alpha, 1) + Gamma(beta, 1))
  const gammaA = sampleGamma(alpha, 1);
  const gammaB = sampleGamma(beta, 1);

  return gammaA / (gammaA + gammaB);
}

/**
 * Gamma distribution random sample using Marsaglia and Tsang's method
 */
function sampleGamma(shape: number, scale: number): number {
  if (shape < 1) {
    // Use Johnk's generator for shape < 1
    return sampleGamma(shape + 1, scale) * Math.pow(Math.random(), 1 / shape);
  }

  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);

  while (true) {
    let x, v;

    do {
      x = randomNormal();
      v = 1 + c * x;
    } while (v <= 0);

    v = v * v * v;
    const u = Math.random();
    const xSquared = x * x;

    if (u < 1 - 0.0331 * xSquared * xSquared) {
      return d * v * scale;
    }

    if (Math.log(u) < 0.5 * xSquared + d * (1 - v + Math.log(v))) {
      return d * v * scale;
    }
  }
}

/**
 * Generate random sample from standard normal distribution
 * Using Box-Muller transform
 */
function randomNormal(): number {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();

  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Thompson Sampling Arm
 * Represents one option in the multi-armed bandit
 */
export interface ThompsonArm {
  id: string;
  alpha: number; // Success count + 1 (prior)
  beta: number; // Failure count + 1 (prior)
  totalTrials: number;
  totalSuccesses: number;
  metadata?: Record<string, unknown>;
}

/**
 * Thompson Sampling Result
 */
export interface ThompsonSample {
  armId: string;
  sample: number;
  alpha: number;
  beta: number;
  estimatedMean: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

/**
 * Thompson Sampling Engine
 */
export class ThompsonSamplingEngine {
  /**
   * Select the best arm using Thompson Sampling
   *
   * @param arms - Array of arms to choose from
   * @returns The selected arm and sampling details
   */
  selectArm(arms: ThompsonArm[]): {
    selectedArm: ThompsonArm;
    samples: ThompsonSample[];
    reasoning: string;
  } {
    if (arms.length === 0) {
      throw new Error('No arms provided');
    }

    if (arms.length === 1) {
      return {
        selectedArm: arms[0]!,
        samples: this.getSamples([arms[0]!]),
        reasoning: 'Only one arm available',
      };
    }

    // Sample from each arm's Beta distribution
    const samples = arms.map((arm) => {
      const sample = sampleBeta(arm.alpha, arm.beta);

      return {
        arm,
        sample,
        sampleData: {
          armId: arm.id,
          sample,
          alpha: arm.alpha,
          beta: arm.beta,
          estimatedMean: arm.alpha / (arm.alpha + arm.beta),
          confidenceInterval: this.calculateConfidenceInterval(arm.alpha, arm.beta),
        },
      };
    });

    // Select arm with highest sample
    samples.sort((a, b) => b.sample - a.sample);
    const winner = samples[0]!;

    return {
      selectedArm: winner.arm,
      samples: samples.map((s) => s.sampleData),
      reasoning: `Sampled ${winner.sample.toFixed(4)} (highest) from Beta(${winner.arm.alpha.toFixed(
        2
      )}, ${winner.arm.beta.toFixed(2)})`,
    };
  }

  /**
   * Get samples from multiple arms without selection
   */
  getSamples(arms: ThompsonArm[]): ThompsonSample[] {
    return arms.map((arm) => ({
      armId: arm.id,
      sample: sampleBeta(arm.alpha, arm.beta),
      alpha: arm.alpha,
      beta: arm.beta,
      estimatedMean: arm.alpha / (arm.alpha + arm.beta),
      confidenceInterval: this.calculateConfidenceInterval(arm.alpha, arm.beta),
    }));
  }

  /**
   * Update arm after observing an outcome
   *
   * @param arm - The arm to update
   * @param success - Whether the outcome was successful
   * @returns Updated arm
   */
  updateArm(arm: ThompsonArm, success: boolean): ThompsonArm {
    return {
      ...arm,
      alpha: arm.alpha + (success ? 1 : 0),
      beta: arm.beta + (success ? 0 : 1),
      totalTrials: arm.totalTrials + 1,
      totalSuccesses: arm.totalSuccesses + (success ? 1 : 0),
    };
  }

  /**
   * Update arm with weighted outcome (for revenue-based rewards)
   *
   * @param arm - The arm to update
   * @param reward - Reward value (0-1, or will be normalized)
   * @param maxReward - Maximum possible reward for normalization
   */
  updateArmWithReward(arm: ThompsonArm, reward: number, maxReward: number = 1): ThompsonArm {
    // Normalize reward to [0, 1]
    const normalizedReward = maxReward > 0 ? Math.min(reward / maxReward, 1) : 0;

    // Update using weighted approach
    // This treats reward as a fractional success
    return {
      ...arm,
      alpha: arm.alpha + normalizedReward,
      beta: arm.beta + (1 - normalizedReward),
      totalTrials: arm.totalTrials + 1,
      totalSuccesses: arm.totalSuccesses + normalizedReward,
    };
  }

  /**
   * Calculate 95% confidence interval for Beta distribution
   * Using normal approximation (works well for alpha, beta > 5)
   */
  calculateConfidenceInterval(
    alpha: number,
    beta: number
  ): { lower: number; upper: number } {
    const mean = alpha / (alpha + beta);
    const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
    const stdDev = Math.sqrt(variance);

    // 95% confidence interval (1.96 standard deviations)
    const margin = 1.96 * stdDev;

    return {
      lower: Math.max(0, mean - margin),
      upper: Math.min(1, mean + margin),
    };
  }

  /**
   * Calculate expected regret for not choosing each arm
   * Used for diagnostics and optimization
   */
  calculateRegrets(arms: ThompsonArm[]): Array<{ armId: string; regret: number }> {
    const means = arms.map((arm) => ({
      armId: arm.id,
      mean: arm.alpha / (arm.alpha + arm.beta),
    }));

    const bestMean = Math.max(...means.map((m) => m.mean));

    return means.map((m) => ({
      armId: m.armId,
      regret: bestMean - m.mean,
    }));
  }

  /**
   * Determine if an arm needs more exploration
   * Returns true if sample size is too small for reliable estimates
   */
  needsExploration(arm: ThompsonArm, minSamples: number = 100): boolean {
    return arm.totalTrials < minSamples;
  }

  /**
   * Calculate statistical significance between two arms
   * Returns p-value using approximate test
   */
  calculateSignificance(arm1: ThompsonArm, arm2: ThompsonArm): {
    pValue: number;
    significant: boolean;
    winner: string | null;
  } {
    // Using normal approximation for Beta distributions
    const mean1 = arm1.alpha / (arm1.alpha + arm1.beta);
    const mean2 = arm2.alpha / (arm2.alpha + arm2.beta);

    const var1 = (arm1.alpha * arm1.beta) / ((arm1.alpha + arm1.beta) ** 2 * (arm1.alpha + arm1.beta + 1));
    const var2 = (arm2.alpha * arm2.beta) / ((arm2.alpha + arm2.beta) ** 2 * (arm2.alpha + arm2.beta + 1));

    const se = Math.sqrt(var1 + var2);
    const zScore = Math.abs(mean1 - mean2) / se;

    // Convert z-score to p-value (two-tailed test)
    const pValue = 2 * (1 - normalCDF(zScore));

    return {
      pValue,
      significant: pValue < 0.05,
      winner: pValue < 0.05 ? (mean1 > mean2 ? arm1.id : arm2.id) : null,
    };
  }

  /**
   * Get arm statistics for reporting
   */
  getArmStatistics(arm: ThompsonArm): {
    estimatedMean: number;
    confidenceInterval: { lower: number; upper: number };
    successRate: number;
    sampleSize: number;
    confidenceScore: number;
  } {
    const estimatedMean = arm.alpha / (arm.alpha + arm.beta);
    const confidenceInterval = this.calculateConfidenceInterval(arm.alpha, arm.beta);
    const successRate = arm.totalTrials > 0 ? arm.totalSuccesses / arm.totalTrials : 0;

    // Confidence increases with sample size
    const confidenceScore = Math.min(arm.totalTrials / 1000, 1);

    return {
      estimatedMean,
      confidenceInterval,
      successRate,
      sampleSize: arm.totalTrials,
      confidenceScore,
    };
  }
}

/**
 * Cumulative Distribution Function for standard normal distribution
 */
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const prob =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

  return x > 0 ? 1 - prob : prob;
}

/**
 * Helper to create a new Thompson Sampling arm
 */
export function createArm(
  id: string,
  priorAlpha: number = 1,
  priorBeta: number = 1,
  metadata?: Record<string, unknown>
): ThompsonArm {
  return {
    id,
    alpha: priorAlpha,
    beta: priorBeta,
    totalTrials: 0,
    totalSuccesses: 0,
    metadata,
  };
}

/**
 * Default Thompson Sampling engine instance
 */
export const thompsonSampling = new ThompsonSamplingEngine();
