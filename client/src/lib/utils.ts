import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number with comma separators and optional decimal places
 * @param value The number to format
 * @param decimals The number of decimal places to include (default: 0)
 * @returns A formatted string representation of the number
 */
export function formatNumber(value?: number, decimals: number = 0): string {
  if (value === undefined || value === null) return "0";
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Scroll to the top of the page with a smooth animation
 * Used when navigating between pages or sections
 */
export function scrollToTop(smooth: boolean = true): void {
  window.scrollTo({
    top: 0,
    behavior: smooth ? 'smooth' : 'auto'
  });
}
