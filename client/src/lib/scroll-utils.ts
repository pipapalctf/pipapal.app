/**
 * Scroll utility functions for smoother page navigation
 */

/**
 * Scrolls to the top of the page with smooth scrolling
 * @param smooth - Whether to use smooth scrolling animation (default: true)
 */
export function scrollToTop(smooth: boolean = true): void {
  window.scrollTo({
    top: 0,
    behavior: smooth ? 'smooth' : 'auto'
  });
}

/**
 * Scrolls to a specific element with an offset from the top
 * @param elementId - The ID of the element to scroll to
 * @param offset - Optional offset from the top in pixels (default: 0)
 * @param smooth - Whether to use smooth scrolling animation (default: true)
 */
export function scrollToElement(elementId: string, offset: number = 0, smooth: boolean = true): void {
  // Find the element by ID
  const element = document.getElementById(elementId);
  if (!element) return;
  
  // Get the element's position relative to the viewport
  const rect = element.getBoundingClientRect();
  
  // Calculate the target scroll position (element's position + current scroll - offset)
  const targetPosition = rect.top + window.scrollY - offset;
  
  // Perform the scroll
  window.scrollTo({
    top: targetPosition,
    behavior: smooth ? 'smooth' : 'auto'
  });
}

/**
 * Scrolls to a section without changing the URL
 * Use this for in-page navigation where you don't want to change the URL hash
 * @param sectionId - The ID of the section to scroll to
 * @param headerOffset - Optional offset for fixed headers (default: 80px)
 */
export function scrollToSection(sectionId: string, headerOffset: number = 80): void {
  scrollToElement(sectionId, headerOffset);
}

/**
 * Creates a click handler function that scrolls to the specified element
 * @param elementId - The ID of the element to scroll to
 * @param headerOffset - Optional offset for fixed headers (default: 80px)
 * @returns A function that can be used as an onClick handler
 */
export function createScrollHandler(elementId: string, headerOffset: number = 80) {
  return (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToSection(elementId, headerOffset);
  };
}

/**
 * Handle tab changes with proper scroll behavior
 * @param tabContentId - The ID of the tab content container to scroll to
 * @param onValueChange - The original tab change handler
 * @param headerOffset - Optional offset for fixed headers (default: 80px)
 * @returns A function that can be used as a tab change handler
 */
export function handleTabChange(
  tabContentId: string, 
  onValueChange: (value: string) => void,
  headerOffset: number = 80
) {
  return (value: string) => {
    // First change the tab
    onValueChange(value);
    
    // Use setTimeout to ensure tab content is rendered before scrolling
    setTimeout(() => {
      scrollToSection(tabContentId, headerOffset);
    }, 10);
  };
}