// Performance optimizations for instant UI response

// Debounce function to prevent excessive API calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for scroll and resize events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Prefetch links on hover for instant navigation
export function enableLinkPrefetching() {
  if (typeof window === 'undefined') return;

  const prefetchedUrls = new Set<string>();

  document.addEventListener('mouseover', (e) => {
    const link = (e.target as HTMLElement).closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || prefetchedUrls.has(href)) {
      return;
    }

    // Prefetch the link
    const prefetchLink = document.createElement('link');
    prefetchLink.rel = 'prefetch';
    prefetchLink.href = href;
    document.head.appendChild(prefetchLink);
    prefetchedUrls.add(href);
  });
}

// Enable instant visual feedback
export function enableInstantFeedback() {
  if (typeof window === 'undefined') return;

  document.addEventListener('click', (e) => {
    const button = (e.target as HTMLElement).closest('button, a');
    if (!button) return;

    // Add instant visual feedback
    button.style.transition = 'transform 0.05s ease';
    button.style.transform = 'scale(0.98)';
    
    setTimeout(() => {
      button.style.transform = '';
    }, 50);
  });
}