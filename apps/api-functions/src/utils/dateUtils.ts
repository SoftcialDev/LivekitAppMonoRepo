/**
 * @fileoverview dateUtils - Utility functions for date and time operations
 * @description Provides centralized date handling with Central America Time (CST/CDT)
 */

import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';

/**
 * Central America Time zone identifier
 * CST (UTC-6) during standard time
 * CDT (UTC-5) during daylight saving time
 */
export const CENTRAL_AMERICA_TIMEZONE = 'America/Guatemala';

/**
 * Gets the current date and time in Central America Time
 * @returns Date object in Central America Time
 */
export function getCentralAmericaTime(): Date {
  const now = new Date();
  
  // Convert current UTC time to Central America Time
  const catTime = toZonedTime(now, CENTRAL_AMERICA_TIMEZONE);
  
  // Create a new Date object that represents the local time in Costa Rica
  // This ensures the database stores the actual Costa Rica time, not UTC
  return new Date(
    catTime.getFullYear(),
    catTime.getMonth(),
    catTime.getDate(),
    catTime.getHours(),
    catTime.getMinutes(),
    catTime.getSeconds(),
    catTime.getMilliseconds()
  );
}

/**
 * Converts a UTC date to Central America Time
 * @param utcDate - UTC date to convert
 * @returns Date object in Central America Time
 */
export function toCentralAmericaTime(utcDate: Date): Date {
  const catTime = toZonedTime(utcDate, CENTRAL_AMERICA_TIMEZONE);
  return new Date(
    catTime.getFullYear(),
    catTime.getMonth(),
    catTime.getDate(),
    catTime.getHours(),
    catTime.getMinutes(),
    catTime.getSeconds(),
    catTime.getMilliseconds()
  );
}

/**
 * Converts a Central America Time date to UTC
 * @param catDate - Central America Time date to convert
 * @returns Date object in UTC
 */
export function fromCentralAmericaTime(catDate: Date): Date {
  // Convert local time to UTC using date-fns-tz
  return fromZonedTime(catDate, CENTRAL_AMERICA_TIMEZONE);
}

/**
 * Formats a date to Central America Time string
 * @param date - Date to format
 * @param includeTime - Whether to include time (default: true)
 * @returns Formatted date string in Central America Time
 */
export function formatCentralAmericaTime(date: Date, includeTime: boolean = true): string {
  const pattern = includeTime ? 'yyyy-MM-dd HH:mm:ss' : 'yyyy-MM-dd';
  return format(date, pattern, { timeZone: CENTRAL_AMERICA_TIMEZONE });
}

/**
 * Gets the current timestamp in Central America Time as ISO string
 * @returns ISO string in Central America Time
 */
export function getCentralAmericaTimeISO(): string {
  return getCentralAmericaTime().toISOString();
}

/**
 * Creates a new Date object with Central America Time
 * @param year - Year
 * @param month - Month (0-11)
 * @param day - Day
 * @param hour - Hour (0-23)
 * @param minute - Minute (0-59)
 * @param second - Second (0-59)
 * @returns Date object in Central America Time
 */
export function createCentralAmericaTime(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
  second: number = 0
): Date {
  const date = new Date(year, month, day, hour, minute, second);
  return toCentralAmericaTime(date);
}

/**
 * Checks if a date is in daylight saving time for Central America
 * @param date - Date to check
 * @returns True if date is in daylight saving time
 */
export function isCentralAmericaDaylightTime(date: Date): boolean {
  const jan = new Date(date.getFullYear(), 0, 1);
  const jul = new Date(date.getFullYear(), 6, 1);
  
  // Central America typically observes DST from first Sunday in April to last Sunday in October
  const dstStart = new Date(date.getFullYear(), 3, 1); // April 1st
  const dstEnd = new Date(date.getFullYear(), 9, 31); // October 31st
  
  return date >= dstStart && date <= dstEnd;
}

/**
 * Gets the timezone offset for Central America Time
 * @param date - Date to get offset for
 * @returns Offset in minutes from UTC
 */
export function getCentralAmericaOffset(date: Date): number {
  const utc = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const cat = new Date(date.toLocaleString('en-US', { timeZone: CENTRAL_AMERICA_TIMEZONE }));
  return (cat.getTime() - utc.getTime()) / (1000 * 60);
}
