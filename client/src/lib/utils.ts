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
 * Scroll to a specific element or the top of the page with a smooth animation
 * Used when navigating between pages or sections
 * @param elementId The ID of the element to scroll to (optional)
 * @param offset Offset in pixels from the top of the element (default: 0)
 * @param smooth Whether to use smooth scrolling animation (default: true)
 */
export function scrollToElement(elementId?: string, offset: number = 0, smooth: boolean = true): void {
  if (elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      const rect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const targetPosition = rect.top + scrollTop - offset;
      
      window.scrollTo({
        top: targetPosition,
        behavior: smooth ? 'smooth' : 'auto'
      });
      return;
    }
  }
  
  // Default to scroll to top if no element found or no ID provided
  window.scrollTo({
    top: 0,
    behavior: smooth ? 'smooth' : 'auto'
  });
}

/**
 * Scroll to the top of the page with a smooth animation
 * Used when navigating between pages or sections
 * @param smooth Whether to use smooth scrolling animation (default: true)
 */
export function scrollToTop(smooth: boolean = true): void {
  window.scrollTo({
    top: 0,
    behavior: smooth ? 'smooth' : 'auto'
  });
}
