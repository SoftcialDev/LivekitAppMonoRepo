/**
 * @fileoverview useCommandHandling - manages command processing and acknowledgment
 * @summary Handles START/STOP commands and missed command fetching
 * @description Provides centralized command processing, acknowledgment, and missed command handling
 * for streaming control via WebPubSub messages.
 */

import { useCallback, useRef } from 'react';
import { PendingCommand, PendingCommandsClient } from '@/shared/api/pendingCommandsClient';

export interface UseCommandHandlingProps {
  onStartCommand: () => Promise<void>;
  onStopCommand: (reason?: string) => Promise<void>;
  userEmail: string;
}

/**
 * Hook for managing command processing and acknowledgment
 * 
 * @param props - Configuration for command handling
 * @returns Object containing command handling functions
 */
export function useCommandHandling({
  onStartCommand,
  onStopCommand,
  userEmail
}: UseCommandHandlingProps) {
  const pendingClient = useRef(new PendingCommandsClient()).current;

  /**
   * Processes a single command (START/STOP)
   * 
   * @param cmd - The command to process
   * @returns Promise that resolves when command is processed
   */
  const handleCommand = useCallback(async (cmd: PendingCommand): Promise<void> => {
    const action = (cmd.command || '').toString().trim().toUpperCase();
    
    try {
      console.log(`[WS Cmd] "${action}" @ ${new Date().toISOString()}`);
      console.log(`[WS Cmd] Full command object:`, cmd);
      console.log(`[WS Cmd] Reason:`, cmd.reason);
      
      if (action === 'START') {
        await onStartCommand();
      } else if (action === 'STOP') {
        console.log(`[WS Cmd] Calling onStopCommand with reason:`, cmd.reason);
        await onStopCommand(cmd.reason);
      } else {
        // Default to stop for unknown commands
        console.log(`[WS Cmd] Unknown command "${action}", defaulting to STOP`);
        await onStopCommand(cmd.reason);
      }
    } catch (error) {
      console.error(`[WS Cmd] Failed to process command "${action}":`, error);
      throw error;
    } finally {
      // Always acknowledge the command if it has an ID
      if (cmd.id) {
        try {
          await pendingClient.acknowledge([cmd.id]);
          console.log(`[WS Cmd] Acknowledged command ${cmd.id}`);
        } catch (err) {
          console.warn(`[WS Cmd] Failed to acknowledge command ${cmd.id}:`, err);
        }
      }
    }
  }, [onStartCommand, onStopCommand, pendingClient]);

  /**
   * Fetches and processes all missed commands
   * 
   * @returns Promise that resolves when all missed commands are processed
   */
  const fetchMissedCommands = useCallback(async (): Promise<void> => {
    try {
      console.log('[WS] Fetching missed commands...');
      const missedCommands = await pendingClient.fetch();
      console.log(`[WS] Fetched ${missedCommands.length} missed commands`);
      
      for (const cmd of missedCommands) {
        await handleCommand(cmd);
      }
    } catch (error) {
      console.error('[WS] Failed to fetch missed commands:', error);
      throw error;
    }
  }, [pendingClient, handleCommand]);

  /**
   * Acknowledges a list of command IDs
   * 
   * @param commandIds - Array of command IDs to acknowledge
   * @returns Promise that resolves when commands are acknowledged
   */
  const acknowledgeCommands = useCallback(async (commandIds: string[]): Promise<void> => {
    try {
      await pendingClient.acknowledge(commandIds);
      console.log(`[WS Cmd] Acknowledged ${commandIds.length} commands`);
    } catch (error) {
      console.error('[WS Cmd] Failed to acknowledge commands:', error);
      throw error;
    }
  }, [pendingClient]);

  /**
   * Processes a batch of commands
   * 
   * @param commands - Array of commands to process
   * @returns Promise that resolves when all commands are processed
   */
  const processCommands = useCallback(async (commands: PendingCommand[]): Promise<void> => {
    console.log(`[WS Cmd] Processing ${commands.length} commands`);
    
    for (const cmd of commands) {
      await handleCommand(cmd);
    }
  }, [handleCommand]);

  /**
   * Validates if a command is for the current user
   * 
   * @param cmd - Command to validate
   * @returns True if command is for current user
   */
  const isCommandForUser = useCallback((cmd: PendingCommand): boolean => {
    // PendingCommand doesn't have employeeEmail, so all commands are for current user
    return true;
  }, []);

  /**
   * Filters commands for the current user
   * 
   * @param commands - Array of commands to filter
   * @returns Filtered commands for current user
   */
  const filterCommandsForUser = useCallback((commands: PendingCommand[]): PendingCommand[] => {
    return commands.filter(isCommandForUser);
  }, [isCommandForUser]);

  return {
    handleCommand,
    fetchMissedCommands,
    acknowledgeCommands,
    processCommands,
    isCommandForUser,
    filterCommandsForUser,
    pendingClient
  };
}
