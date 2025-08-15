# Model Memory Reset Feature

This feature automatically clears the AI model's memory/conversation history when the page is refreshed or when the user navigates away from the chat page.

## Implementation

### 1. Custom Hook: `useModelMemoryReset`

Located in `hooks/useModelMemoryReset.js`, this hook provides:

- **Automatic memory clearing on page load** (page refresh/initial visit)
- **Automatic memory clearing on page unload** (navigation/tab close)
- **Manual reset function** for programmatic control

#### Usage:

```javascript
import useModelMemoryReset from '../hooks/useModelMemoryReset';

const { manualReset } = useModelMemoryReset(convId, {
  clearOnMount: true,     // Clear on page load
  clearOnUnload: true,    // Clear on page unload
  endpoint: '/api/proxy-chat'
});
```

### 2. API Endpoints

#### `/api/proxy-chat`
- Supports `reset: true` parameter to clear model memory
- Used for external AI model backends

#### `/api/chat`
- Enhanced to support `reset: true` parameter
- Clears MongoDB chat history for the user

### 3. Memory Clearing Events

1. **Page Refresh**: Automatically triggered when user refreshes the page
2. **Page Load**: Triggered on initial page visit
3. **Navigation**: Triggered when user navigates away from the page
4. **Tab Close**: Triggered when user closes the browser tab
5. **Manual**: Can be triggered programmatically via the `manualReset()` function

### 4. Technical Details

- Uses `navigator.sendBeacon()` for reliable cleanup during page unload
- Handles both frontend state clearing and backend memory reset
- Includes error handling and logging for debugging
- Works with both authenticated and anonymous users

### 5. Benefits

- **Privacy**: Ensures conversations don't persist across sessions
- **Fresh Context**: Each page load starts with a clean conversation
- **Memory Management**: Prevents AI model from accumulating long conversation histories
- **User Control**: Provides both automatic and manual reset capabilities

## Files Modified

1. `pages/chat/index.js` - Main chat page implementation
2. `pages/api/chat.js` - Enhanced chat API with reset support
3. `pages/api/proxy-chat.js` - Already had reset functionality
4. `hooks/useModelMemoryReset.js` - New custom hook (created)
5. `MEMORY_RESET.md` - This documentation file (created)
