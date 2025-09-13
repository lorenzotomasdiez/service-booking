// Debounce utility for Argentina mobile optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | undefined;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => func(...args), delay);
  };
}

// Advanced debounce with leading and trailing options
export function advancedDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  } = {}
): (...args: Parameters<T>) => void {
  let timeoutId: number | undefined;
  let maxTimeoutId: number | undefined;
  let lastCallTime = 0;
  let lastInvokeTime = 0;
  
  const { leading = false, trailing = true, maxWait } = options;
  
  function invokeFunc(args: Parameters<T>) {
    lastInvokeTime = Date.now();
    return func(...args);
  }
  
  function leadingEdge(args: Parameters<T>) {
    lastInvokeTime = Date.now();
    timeoutId = window.setTimeout(timerExpired, delay);
    return leading ? invokeFunc(args) : undefined;
  }
  
  function remainingWait() {
    const timeSinceLastCall = Date.now() - lastCallTime;
    const timeSinceLastInvoke = Date.now() - lastInvokeTime;
    const timeWaiting = delay - timeSinceLastCall;
    
    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }
  
  function shouldInvoke() {
    const timeSinceLastCall = Date.now() - lastCallTime;
    const timeSinceLastInvoke = Date.now() - lastInvokeTime;
    
    return (
      timeSinceLastCall >= delay ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }
  
  function timerExpired() {
    if (shouldInvoke()) {
      return trailingEdge();
    }
    timeoutId = window.setTimeout(timerExpired, remainingWait());
  }
  
  function trailingEdge() {
    timeoutId = undefined;
    
    if (trailing && lastCallTime !== lastInvokeTime) {
      return invokeFunc(lastArgs!);
    }
    
    lastArgs = undefined;
    return undefined;
  }
  
  let lastArgs: Parameters<T> | undefined;
  
  return (...args: Parameters<T>) => {
    const isInvoking = shouldInvoke();
    
    lastArgs = args;
    lastCallTime = Date.now();
    
    if (isInvoking) {
      if (timeoutId === undefined) {
        return leadingEdge(args);
      }
      if (maxWait) {
        // Handle invocations in a tight loop
        timeoutId = window.setTimeout(timerExpired, delay);
        return invokeFunc(args);
      }
    }
    
    if (timeoutId === undefined) {
      timeoutId = window.setTimeout(timerExpired, delay);
    }
    
    return undefined;
  };
}

// Throttle utility for high-frequency events (scroll, resize, etc.)
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}