/**
 * @fileoverview UserRole - Enumeration of user roles in the system
 * @summary Defines all possible user roles
 * @description Enum representing the different user roles with their corresponding privileges
 */

/**
 * Enumeration of user roles in the system
 * @description Defines the hierarchy and types of user roles available
 */
export enum UserRole {
  /**
   * Users with the highest privileges in the system
   * @description Can access all features and manage all users
   */
  SuperAdmin = "SuperAdmin",

  /**
   * Users with administrative privileges
   * @description Can manage users and access administrative features
   */
  Admin = "Admin",

  /**
   * Users with supervisory privileges
   * @description Can supervise assigned PSOs and access supervisory features
   */
  Supervisor = "Supervisor",

  /**
   * PSO (Public Safety Officer) - Standard users who can stream video
   * @description Can access streaming features and receive commands
   */
  PSO = "PSO",

  /**
   * Contact Manager role
   * @description Can manage contacts and handle customer interactions
   */
  ContactManager = "ContactManager",

  /**
   * Users without assigned role
   * @description Default state for new users
   */
  Unassigned = "Unassigned"
}