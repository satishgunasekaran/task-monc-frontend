/**
 * Utility functions for handling datetime conversions between UTC storage and local display
 */

/**
 * Converts a local datetime to UTC for database storage
 * @param localDateTime - Date object in local time
 * @returns ISO string in UTC
 */
export function toUTC(localDateTime: Date): string {
    return localDateTime.toISOString();
}

/**
 * Converts a UTC datetime string from database to local Date object
 * @param utcString - UTC datetime string from database
 * @returns Date object in local time
 */
export function fromUTC(utcString: string): Date {
    return new Date(utcString);
}

/**
 * Formats a UTC datetime string to local time display
 * @param utcString - UTC datetime string from database
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Formatted local datetime string
 */
export function formatLocalDateTime(
    utcString: string | null | undefined,
    options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }
): string {
    if (!utcString) return '';

    const localDate = fromUTC(utcString);
    return localDate.toLocaleDateString(undefined, options);
}

/**
 * Formats a UTC datetime string to local date only (no time)
 * @param utcString - UTC datetime string from database
 * @returns Formatted local date string
 */
export function formatLocalDate(utcString: string | null | undefined): string {
    if (!utcString) return '';

    const localDate = fromUTC(utcString);
    return localDate.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Formats a UTC datetime string to local time only (no date)
 * @param utcString - UTC datetime string from database
 * @returns Formatted local time string
 */
export function formatLocalTime(utcString: string | null | undefined): string {
    if (!utcString) return '';

    const localDate = fromUTC(utcString);
    return localDate.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Gets the current local datetime as a Date object
 * @returns Date object representing current local time
 */
export function now(): Date {
    return new Date();
}

/**
 * Checks if a datetime is in the past
 * @param utcString - UTC datetime string from database
 * @returns boolean indicating if the datetime is in the past
 */
export function isInPast(utcString: string | null | undefined): boolean {
    if (!utcString) return false;

    const date = fromUTC(utcString);
    return date < now();
}

/**
 * Checks if a datetime is due soon (within next 24 hours)
 * @param utcString - UTC datetime string from database
 * @returns boolean indicating if the datetime is due soon
 */
export function isDueSoon(utcString: string | null | undefined): boolean {
    if (!utcString) return false;

    const date = fromUTC(utcString);
    const nowTime = now();
    const in24Hours = new Date(nowTime.getTime() + 24 * 60 * 60 * 1000);

    return date > nowTime && date <= in24Hours;
}

/**
 * Combines a date and time input into a single Date object
 * @param date - Date object (date part will be used)
 * @param timeString - Time string in HH:MM format
 * @returns Combined Date object
 */
export function combineDateAndTime(date: Date, timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
}

/**
 * Extracts time from a Date object as HH:MM string
 * @param date - Date object
 * @returns Time string in HH:MM format
 */
export function extractTimeFromDate(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Creates a Date object for today at the specified time
 * @param timeString - Time string in HH:MM format
 * @returns Date object for today at the specified time
 */
export function todayAtTime(timeString: string): Date {
    const today = new Date();
    return combineDateAndTime(today, timeString);
}