import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Custom hook to automatically clear model memory on page refresh/load
 * @param {string} convId - Conversation ID (optional)
 * @param {Object} options - Configuration options
 * @param {boolean} options.clearOnMount - Clear memory when component mounts (default: true)
 * @param {boolean} options.clearOnUnload - Clear memory when page unloads (default: true)
 * @param {string} options.endpoint - API endpoint to call for reset (default: '/api/proxy-chat')
 */
export const useModelMemoryReset = (convId = null, options = {}) => {
  const { data: session } = useSession();
  const {
    clearOnMount = true,
    clearOnUnload = true,
    endpoint = '/api/proxy-chat'
  } = options;

  const userId = session?.user?.id || 'anon';

  useEffect(() => {
    if (!clearOnMount && !clearOnUnload) return;

    const resetModelMemory = async () => {
      try {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reset: true, userId, convId }),
        });
        console.log('Model memory cleared');
      } catch (error) {
        console.warn('Failed to clear model memory:', error);
      }
    };

    // Clear memory on component mount (page refresh/initial load)
    if (clearOnMount) {
      resetModelMemory();
    }

    // Clear memory when page is about to unload (refresh/navigation)
    const handleBeforeUnload = () => {
      if (!clearOnUnload) return;
      
      // Use sendBeacon for reliable cleanup during page unload
      const data = JSON.stringify({ reset: true, userId, convId });
      const blob = new Blob([data], { type: 'application/json' });
      
      try {
        navigator.sendBeacon(endpoint, blob);
      } catch (error) {
        console.warn('Failed to clear model memory on page unload:', error);
      }
    };

    if (clearOnUnload) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    // Cleanup
    return () => {
      if (clearOnUnload) {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
    };
  }, [userId, convId, clearOnMount, clearOnUnload, endpoint]);

  // Return a manual reset function for programmatic use
  const manualReset = async () => {
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true, userId, convId }),
      });
      return { success: true };
    } catch (error) {
      console.error('Manual reset failed:', error);
      return { success: false, error };
    }
  };

  return { manualReset };
};

export default useModelMemoryReset;
