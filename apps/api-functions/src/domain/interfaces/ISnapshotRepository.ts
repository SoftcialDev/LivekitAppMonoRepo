/**
 * @fileoverview ISnapshotRepository - Interface for snapshot data access operations
 * @summary Repository interface for snapshot operations
 * @description Defines the contract for snapshot data access operations
 */

/**
 * Interface for snapshot repository operations
 * @description Defines methods for snapshot data access
 */
export interface ISnapshotRepository {
  /**
   * Creates a new snapshot record
   * @description Creates a new snapshot record in the database with the provided metadata
   * @param supervisorId - The ID of the supervisor
   * @param psoId - The ID of the PSO
   * @param reasonId - The ID of the snapshot reason
   * @param description - Optional description for the snapshot
   * @param imageUrl - The URL of the uploaded image
   * @param snapshotId - Optional pre-generated UUID for the snapshot (for file naming consistency)
   * @returns Promise that resolves to the created snapshot record
   */
  create(
    supervisorId: string,
    psoId: string,
    reasonId: string,
    description: string | undefined,
    imageUrl: string,
    snapshotId?: string
  ): Promise<{ id: string }>;

  /**
   * Finds a snapshot by ID
   * @param snapshotId - The ID of the snapshot to find
   * @returns Promise that resolves to the snapshot or null
   */
  findById(snapshotId: string): Promise<{ id: string; imageUrl: string } | null>;

  /**
   * Deletes a snapshot by ID
   * @description Removes a snapshot record from the database
   * @param snapshotId - The ID of the snapshot to delete
   * @returns Promise that resolves when deletion is complete
   */
  deleteById(snapshotId: string): Promise<void>;

  /**
   * Finds all snapshots with supervisor, PSO, and reason relations
   * @returns Promise that resolves to snapshots with relations
   */
  findAllWithRelations(): Promise<Array<{
    id: string;
    reason: {
      id: string;
      label: string;
      code: string;
    };
    description: string | null;
    imageUrl: string;
    takenAt: Date;
    supervisor: { fullName: string };
    pso: { fullName: string; email: string };
  }>>;
}
