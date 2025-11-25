/**
 * Thompson Sampling (Bayesian Multi-Armed Bandit) Implementation
 *
 * PRODUCTION-GRADE ML ALGORITHM for optimal decision making.
 *
 * This algorithm balances exploration vs exploitation by:
 * - Maintaining Beta distribution parameters (alpha, beta) for each arm
 * - Sampling from each distribution to select the best option
 * - Updating distributions based on observed outcomes
 * - Using Jeffreys prior (0.5, 0.5) for uninformative starting point
 * - Calculating Bayesian Upper Confidence Bounds for optimistic exploration
 * - Computing expected improvement for acquisition function
 * - Implementing regret minimization with theoretical bounds
 *
 * Mathematical Foundation:
 * - Beta(α, β) is the conjugate prior for Bernoulli likelihood
 * - Posterior after n trials with s successes: Beta(α + s, β + n - s)
 * - Expected value: E[θ] = α / (α + β)
 * - Variance: Var[θ] = αβ / ((α + β)² × (α + β + 1))
 */

// Constants for numerical precision
const EPSILON = 1e-10;
const MAX_ITERATIONS = 1000;

/**
 * Jeffreys Prior Parameters
 * Using Jeffreys prior (0.5, 0.5) as uninformative prior
 * This is the minimum information prior for binomial data
 */
export const JEFFREYS_PRIOR = { alpha: 0.5, beta: 0.5 };

/**
 * Beta distribution random sample using Cheng's rejection algorithm
 * Returns a random sample from Beta(alpha, beta)
 *
 * Implementation uses the ratio of gamma variates method:
 * If X ~ Gamma(α, 1) and Y ~ Gamma(β, 1), then X/(X+Y) ~ Beta(α, β)
 */
export function sampleBeta(alpha: number, beta: number): number {
  // Numerical stability: ensure parameters are positive
  const a = Math.max(alpha, EPSILON);
  const b = Math.max(beta, EPSILON);

  // For very small parameters, use direct method
  if (a < 0.01 || b < 0.01) {
    return a / (a + b); // Return expected value for stability
  }

  // Use Gamma distribution to generate Beta samples
  // Beta(alpha, beta) = Gamma(alpha, 1) / (Gamma(alpha, 1) + Gamma(beta, 1))
  const gammaA = sampleGamma(a, 1);
  const gammaB = sampleGamma(b, 1);

  // Avoid division by zero
  const sum = gammaA + gammaB;
  if (sum < EPSILON) {
    return a / (a + b);
  }

  return gammaA / sum;
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

// ============================================================================
// ADVANCED STATISTICAL METHODS
// ============================================================================

/**
 * Calculate Bayesian Upper Confidence Bound (UCB)
 * Combines expected value with uncertainty bonus for optimistic exploration
 *
 * UCB = E[θ] + κ × σ[θ]
 * where κ is the exploration parameter (typically 2 for 95% confidence)
 */
export function calculateBayesianUCB(
  alpha: number,
  beta: number,
  explorationParam: number = 2.0
): number {
  const mean = alpha / (alpha + beta);
  const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
  const stdDev = Math.sqrt(variance);

  return Math.min(1, mean + explorationParam * stdDev);
}

/**
 * Calculate Bayesian Lower Confidence Bound (LCB)
 * Used for conservative estimates
 */
export function calculateBayesianLCB(
  alpha: number,
  beta: number,
  explorationParam: number = 2.0
): number {
  const mean = alpha / (alpha + beta);
  const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
  const stdDev = Math.sqrt(variance);

  return Math.max(0, mean - explorationParam * stdDev);
}

/**
 * Calculate Expected Improvement (EI)
 * Acquisition function for Bayesian optimization
 *
 * EI(x) = E[max(f(x) - f_best, 0)]
 *
 * @param alpha - Beta distribution alpha parameter
 * @param beta - Beta distribution beta parameter
 * @param currentBest - Current best observed value
 * @returns Expected improvement over current best
 */
export function calculateExpectedImprovement(
  alpha: number,
  beta: number,
  currentBest: number
): number {
  const mean = alpha / (alpha + beta);
  const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
  const stdDev = Math.sqrt(variance);

  if (stdDev < EPSILON) {
    return Math.max(0, mean - currentBest);
  }

  const z = (mean - currentBest) / stdDev;
  const cdfZ = normalCDF(z);
  const pdfZ = normalPDF(z);

  // EI = (μ - f*) × Φ(z) + σ × φ(z)
  return (mean - currentBest) * cdfZ + stdDev * pdfZ;
}

/**
 * Calculate Probability of Improvement (PI)
 * Simpler acquisition function - probability that arm beats current best
 */
export function calculateProbabilityOfImprovement(
  alpha: number,
  beta: number,
  currentBest: number
): number {
  const mean = alpha / (alpha + beta);
  const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
  const stdDev = Math.sqrt(variance);

  if (stdDev < EPSILON) {
    return mean > currentBest ? 1 : 0;
  }

  const z = (mean - currentBest) / stdDev;
  return normalCDF(z);
}

/**
 * Calculate Information Gain (Entropy Reduction)
 * Measures how much we learn by pulling this arm
 *
 * H(θ) = -∫ p(θ) log p(θ) dθ
 * For Beta: H = ln(B(α,β)) - (α-1)ψ(α) - (β-1)ψ(β) + (α+β-2)ψ(α+β)
 */
export function calculateInformationGain(alpha: number, beta: number): number {
  const n = alpha + beta;

  // Approximate entropy using asymptotic formula
  // Higher values = more uncertainty = more information to gain
  if (n < 2) {
    return 1; // High information gain for new arms
  }

  const variance = (alpha * beta) / (n ** 2 * (n + 1));
  return Math.sqrt(variance) * Math.log(n); // Scaled entropy proxy
}

/**
 * Calculate Knowledge Gradient (KG)
 * Value of learning - expected improvement in decision quality
 */
export function calculateKnowledgeGradient(
  alpha: number,
  beta: number,
  numRemainingTrials: number
): number {
  const n = alpha + beta;
  const mean = alpha / n;
  const variance = (alpha * beta) / (n ** 2 * (n + 1));

  // KG approximation: variance reduction × remaining opportunities
  const varianceReduction = variance / (n + 1);
  return varianceReduction * Math.sqrt(numRemainingTrials);
}

/**
 * Calculate Gittins Index approximation
 * Optimal index for multi-armed bandit with geometric discounting
 *
 * @param alpha - Beta distribution alpha
 * @param beta - Beta distribution beta
 * @param discountFactor - Discount factor γ (0 < γ < 1)
 */
export function calculateGittinsIndex(
  alpha: number,
  beta: number,
  discountFactor: number = 0.99
): number {
  const n = alpha + beta;
  const mean = alpha / n;
  const variance = (alpha * beta) / (n ** 2 * (n + 1));
  const stdDev = Math.sqrt(variance);

  // Whittle's approximation to Gittins index
  // G ≈ μ + σ × √(2 × ln(1/(1-γ)) / n)
  const explorationBonus = stdDev * Math.sqrt((2 * Math.log(1 / (1 - discountFactor))) / n);

  return mean + explorationBonus;
}

/**
 * Calculate regret bound for Thompson Sampling
 * Lai-Robbins lower bound: Regret(T) ≥ ln(T) × Σ Δᵢ / KL(pᵢ || p*)
 *
 * @param arms - Array of arms with their parameters
 * @param horizon - Total number of trials T
 */
export function calculateExpectedRegretBound(
  arms: ThompsonArm[],
  horizon: number
): {
  lowerBound: number;
  upperBound: number;
  optimalArm: string;
} {
  if (arms.length === 0) {
    return { lowerBound: 0, upperBound: 0, optimalArm: '' };
  }

  // Find optimal arm
  const armStats = arms.map((arm) => ({
    id: arm.id,
    mean: arm.alpha / (arm.alpha + arm.beta),
  }));

  const optimalArm = armStats.reduce((best, current) =>
    current.mean > best.mean ? current : best
  );

  // Calculate gaps and KL divergences
  let regretSum = 0;
  for (const arm of armStats) {
    if (arm.id === optimalArm.id) continue;

    const gap = optimalArm.mean - arm.mean;
    if (gap <= 0) continue;

    // KL divergence for Bernoulli: p*log(p/q) + (1-p)log((1-p)/(1-q))
    const kl = klDivergence(arm.mean, optimalArm.mean);
    if (kl > EPSILON) {
      regretSum += gap / kl;
    }
  }

  // Lai-Robbins bound
  const lowerBound = Math.log(horizon) * regretSum;

  // Thompson Sampling upper bound: O(K × ln(T) × √T) for K arms
  const upperBound = arms.length * Math.log(horizon) * Math.sqrt(horizon);

  return { lowerBound, upperBound, optimalArm: optimalArm.id };
}

/**
 * KL Divergence between two Bernoulli distributions
 */
function klDivergence(p: number, q: number): number {
  // Clamp to avoid log(0)
  const pClamped = Math.max(EPSILON, Math.min(1 - EPSILON, p));
  const qClamped = Math.max(EPSILON, Math.min(1 - EPSILON, q));

  return (
    pClamped * Math.log(pClamped / qClamped) +
    (1 - pClamped) * Math.log((1 - pClamped) / (1 - qClamped))
  );
}

/**
 * Calculate optimal exploration rate using Kelly Criterion adaptation
 * Balances growth vs risk based on edge and variance
 */
export function calculateOptimalExplorationRate(
  arms: ThompsonArm[],
  minExploration: number = 0.05,
  maxExploration: number = 0.30
): number {
  if (arms.length < 2) return maxExploration;

  // Calculate total sample size
  const totalSamples = arms.reduce((sum, arm) => sum + arm.totalTrials, 0);

  if (totalSamples < 100) {
    return maxExploration; // High exploration when data is scarce
  }

  // Calculate average uncertainty
  const avgUncertainty =
    arms.reduce((sum, arm) => {
      const n = arm.alpha + arm.beta;
      const variance = (arm.alpha * arm.beta) / (n ** 2 * (n + 1));
      return sum + Math.sqrt(variance);
    }, 0) / arms.length;

  // More exploration when uncertainty is high, less when it's low
  const explorationRate = avgUncertainty * 2;

  return Math.max(minExploration, Math.min(maxExploration, explorationRate));
}

/**
 * Probability Density Function for standard normal distribution
 */
function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Calculate credible interval using Beta quantile function
 * More accurate than normal approximation for small samples
 *
 * @param alpha - Beta distribution alpha
 * @param beta - Beta distribution beta
 * @param level - Credible level (default 0.95 for 95% CI)
 */
export function calculateCredibleInterval(
  alpha: number,
  beta: number,
  level: number = 0.95
): { lower: number; upper: number; median: number } {
  const lowerQuantile = (1 - level) / 2;
  const upperQuantile = 1 - lowerQuantile;

  return {
    lower: betaQuantile(lowerQuantile, alpha, beta),
    upper: betaQuantile(upperQuantile, alpha, beta),
    median: betaQuantile(0.5, alpha, beta),
  };
}

/**
 * Beta distribution quantile function (inverse CDF)
 * Uses Newton-Raphson iteration
 */
function betaQuantile(p: number, alpha: number, beta: number): number {
  // Initial guess using normal approximation
  const mean = alpha / (alpha + beta);
  const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
  let x = mean + Math.sqrt(variance) * normalQuantile(p);
  x = Math.max(EPSILON, Math.min(1 - EPSILON, x));

  // Newton-Raphson iteration
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const cdf = incompleteBeta(x, alpha, beta);
    const pdf = betaPDF(x, alpha, beta);

    if (pdf < EPSILON) break;

    const error = cdf - p;
    if (Math.abs(error) < EPSILON) break;

    x = x - error / pdf;
    x = Math.max(EPSILON, Math.min(1 - EPSILON, x));
  }

  return x;
}

/**
 * Beta distribution PDF
 */
function betaPDF(x: number, alpha: number, beta: number): number {
  if (x <= 0 || x >= 1) return 0;

  const logPdf =
    (alpha - 1) * Math.log(x) +
    (beta - 1) * Math.log(1 - x) -
    logBeta(alpha, beta);

  return Math.exp(logPdf);
}

/**
 * Log of Beta function using log-gamma
 */
function logBeta(a: number, b: number): number {
  return logGamma(a) + logGamma(b) - logGamma(a + b);
}

/**
 * Log-gamma function using Stirling's approximation
 */
function logGamma(x: number): number {
  if (x <= 0) return 0;

  // Stirling's approximation
  const c = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5,
  ];

  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;

  for (let j = 0; j < 6; j++) {
    ser += c[j]! / ++y;
  }

  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

/**
 * Regularized incomplete beta function
 * I_x(a,b) = B_x(a,b) / B(a,b)
 */
function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  // Use continued fraction expansion
  const bt =
    x === 0 || x === 1
      ? 0
      : Math.exp(
          logGamma(a + b) -
            logGamma(a) -
            logGamma(b) +
            a * Math.log(x) +
            b * Math.log(1 - x)
        );

  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betaCF(x, a, b)) / a;
  } else {
    return 1 - (bt * betaCF(1 - x, b, a)) / b;
  }
}

/**
 * Continued fraction for incomplete beta
 */
function betaCF(x: number, a: number, b: number): number {
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;

  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < EPSILON) d = EPSILON;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= MAX_ITERATIONS; m++) {
    const m2 = 2 * m;

    // Even step
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < EPSILON) d = EPSILON;
    c = 1 + aa / c;
    if (Math.abs(c) < EPSILON) c = EPSILON;
    d = 1 / d;
    h *= d * c;

    // Odd step
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < EPSILON) d = EPSILON;
    c = 1 + aa / c;
    if (Math.abs(c) < EPSILON) c = EPSILON;
    d = 1 / d;
    const del = d * c;
    h *= del;

    if (Math.abs(del - 1) < EPSILON) break;
  }

  return h;
}

/**
 * Normal quantile function (inverse CDF)
 * Abramowitz and Stegun approximation
 */
function normalQuantile(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;

  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.383577518672690e2, -3.066479806614716e1, 2.506628277459239e0,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0,
    -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0,
    3.754408661907416e0,
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q, r;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1)
    );
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (
      ((((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r + a[5]!) * q) /
      (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1)
    );
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return (
      -(((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1)
    );
  }
}

/**
 * Calculate effect size (Cohen's h) between two Beta distributions
 * Measures practical significance of difference
 */
export function calculateEffectSize(
  arm1: ThompsonArm,
  arm2: ThompsonArm
): {
  cohensH: number;
  interpretation: 'negligible' | 'small' | 'medium' | 'large';
} {
  const p1 = arm1.alpha / (arm1.alpha + arm1.beta);
  const p2 = arm2.alpha / (arm2.alpha + arm2.beta);

  // Cohen's h = 2 × (arcsin(√p₁) - arcsin(√p₂))
  const h = 2 * (Math.asin(Math.sqrt(p1)) - Math.asin(Math.sqrt(p2)));
  const absH = Math.abs(h);

  let interpretation: 'negligible' | 'small' | 'medium' | 'large';
  if (absH < 0.2) interpretation = 'negligible';
  else if (absH < 0.5) interpretation = 'small';
  else if (absH < 0.8) interpretation = 'medium';
  else interpretation = 'large';

  return { cohensH: h, interpretation };
}

/**
 * Calculate Bayes Factor for comparing two arms
 * Evidence for H1 (arm1 > arm2) vs H0 (arm1 = arm2)
 */
export function calculateBayesFactor(
  arm1: ThompsonArm,
  arm2: ThompsonArm,
  numSamples: number = 10000
): {
  bayesFactor: number;
  interpretation: string;
} {
  // Monte Carlo estimate of P(θ₁ > θ₂)
  let countArm1Better = 0;

  for (let i = 0; i < numSamples; i++) {
    const sample1 = sampleBeta(arm1.alpha, arm1.beta);
    const sample2 = sampleBeta(arm2.alpha, arm2.beta);
    if (sample1 > sample2) countArm1Better++;
  }

  const probArm1Better = countArm1Better / numSamples;
  const probArm2Better = 1 - probArm1Better;

  // Bayes Factor = P(θ₁ > θ₂) / P(θ₂ > θ₁)
  const bayesFactor =
    probArm2Better < EPSILON
      ? Infinity
      : probArm1Better / probArm2Better;

  // Interpret using Kass & Raftery scale
  let interpretation: string;
  const bf = bayesFactor;
  if (bf < 1) interpretation = `Evidence favors arm2 (BF = ${(1 / bf).toFixed(2)})`;
  else if (bf < 3.2) interpretation = 'Barely worth mentioning';
  else if (bf < 10) interpretation = 'Substantial evidence for arm1';
  else if (bf < 100) interpretation = 'Strong evidence for arm1';
  else interpretation = 'Decisive evidence for arm1';

  return { bayesFactor, interpretation };
}
