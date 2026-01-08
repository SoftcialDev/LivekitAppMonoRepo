/**
 * @fileoverview seed-snapshot-reasons.ts - Script to seed default snapshot reasons
 * @summary Standalone script to seed default snapshot reasons
 * @description Can be run manually to populate the database with default snapshot reasons
 */

import { seedDefaultSnapshotReasons } from './defaultSnapshotReasons';
import { logInfo, logError } from '../../utils/standaloneLogger';

/**
 * Main function to seed default snapshot reasons
 * @description Executes the seeding process and exits with appropriate status code
 */
async function main(): Promise<void> {
  try {
    await seedDefaultSnapshotReasons();
    logInfo('Snapshot reasons seeded successfully', { operation: 'seedSnapshotReasons' });
    process.exit(0);
  } catch (error) {
    logError(error, { operation: 'seedSnapshotReasons' });
    process.exit(1);
  }
}

main();

