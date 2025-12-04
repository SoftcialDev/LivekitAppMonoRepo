/**
 * @fileoverview seed-snapshot-reasons.ts - Script to seed default snapshot reasons
 * @summary Standalone script to seed default snapshot reasons
 * @description Can be run manually to populate the database with default snapshot reasons
 */

import { seedDefaultSnapshotReasons } from '../shared/infrastructure/seed/defaultSnapshotReasons';

async function main() {
  try {
    await seedDefaultSnapshotReasons();
    console.log('✅ Snapshot reasons seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding snapshot reasons:', error);
    process.exit(1);
  }
}

main();

