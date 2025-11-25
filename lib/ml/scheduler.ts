/**
 * ML Background Optimization Scheduler
 *
 * Runs the background optimizer on an hourly schedule
 */

import { runHourlyOptimization } from './background-optimizer';

/**
 * Simple in-memory scheduler
 * In production, use a proper job queue like Bull or node-cron
 */
export class MLScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start the hourly optimization scheduler
   */
  start(): void {
    if (this.intervalId) {
      console.log('[ML Scheduler] Already running');
      return;
    }

    console.log('[ML Scheduler] Starting hourly optimization scheduler...');

    // Run immediately on start
    this.runOptimization();

    // Then run every hour
    this.intervalId = setInterval(() => {
      this.runOptimization();
    }, 60 * 60 * 1000); // 1 hour

    console.log('[ML Scheduler] Scheduler started successfully');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[ML Scheduler] Scheduler stopped');
    }
  }

  /**
   * Run optimization (with debouncing)
   */
  private async runOptimization(): Promise<void> {
    if (this.isRunning) {
      console.log('[ML Scheduler] Optimization already running, skipping...');
      return;
    }

    this.isRunning = true;

    try {
      await runHourlyOptimization();
    } catch (error) {
      console.error('[ML Scheduler] Optimization failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    isActive: boolean;
    isRunning: boolean;
  } {
    return {
      isActive: this.intervalId !== null,
      isRunning: this.isRunning,
    };
  }
}

/**
 * Singleton scheduler instance
 */
export const mlScheduler = new MLScheduler();

/**
 * Initialize ML scheduler (call this in your app startup)
 */
export function initializeMLScheduler(): void {
  mlScheduler.start();

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('[ML Scheduler] Received SIGINT, shutting down...');
    mlScheduler.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('[ML Scheduler] Received SIGTERM, shutting down...');
    mlScheduler.stop();
    process.exit(0);
  });
}
