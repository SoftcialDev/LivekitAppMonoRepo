/**
 * @fileoverview seed-snapshot-reasons.ts - Script to seed default snapshot reasons
 * @summary Standalone script to seed default snapshot reasons
 * @description Can be run manually to populate the database with default snapshot reasons
 */

import { seedDefaultSnapshotReasons } from './defaultSnapshotReasons';

/**
 * Main function to seed default snapshot reasons
 * @description Executes the seeding process and exits with appropriate status code
 */
async function main(): Promise<void> {
  try {
    await seedDefaultSnapshotReasons();
    // Using console here is acceptable for standalone scripts
    // eslint-disable-next-line no-console
    console.log('✅ Snapshot reasons seeded successfully');
    process.exit(0);
  } catch (error) {
    // Using console here is acceptable for standalone scripts
    // eslint-disable-next-line no-console
    console.error('❌ Error seeding snapshot reasons:', error);
    process.exit(1);
  }
}

main();

