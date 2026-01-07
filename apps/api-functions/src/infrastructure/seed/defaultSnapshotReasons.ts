/**
 * @fileoverview defaultSnapshotReasons.ts - Seed data for default snapshot reasons
 * @summary Provides default snapshot reason data for database seeding
 * @description Contains the default snapshot reasons that should be inserted into the database
 */

import prisma from '../database/PrismaClientService';

/**
 * Default snapshot reasons to seed
 */
const DEFAULT_REASONS = [
  {
    label: 'Attentiveness / Alertness',
    code: 'ATTENTIVENESS_ALERTNESS',
    isDefault: true,
    order: 0
  },
  {
    label: 'Time & Attendance (unjustified absence, no show, late)',
    code: 'TIME_ATTENDANCE',
    isDefault: true,
    order: 1
  },
  {
    label: 'Performance',
    code: 'PERFORMANCE',
    isDefault: true,
    order: 2
  },
  {
    label: 'Compliance (Background / HIPAA / Uniform / Other)',
    code: 'COMPLIANCE',
    isDefault: true,
    order: 3
  },
  {
    label: 'Professional appearance and demeanor',
    code: 'PROFESSIONAL_APPEARANCE',
    isDefault: true,
    order: 4
  },
  {
    label: 'Other',
    code: 'OTHER',
    isDefault: true,
    order: 5
  }
];

/**
 * Seeds default snapshot reasons into the database
 * @description Creates default snapshot reasons if they don't already exist
 * @returns Promise that resolves when seeding is complete
 */
export async function seedDefaultSnapshotReasons(): Promise<void> {
  for (const reason of DEFAULT_REASONS) {
    const existing = await prisma.snapshotReason.findUnique({
      where: { code: reason.code }
    });

    if (!existing) {
      await prisma.snapshotReason.create({
        data: reason
      });
    }
  }
}

