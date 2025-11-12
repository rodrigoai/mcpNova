# Chatbot UI Guide

## Overview

The chatbot features a beautiful, responsive web interface built with Tailwind CSS that works seamlessly on desktop and mobile devices.

## Features

### 🎨 Design
- **Modern UI**: Clean, gradient-based design with indigo and purple colors
- **Responsive Layout**: Adapts perfectly to mobile, tablet, and desktop screens
- **Smooth Animations**: Message slide-ins, typing indicators, and transitions
- **Custom Scrollbar**: Styled scrollbar for better aesthetics

### 💬 Chat Interface
- **Real-time Chat**: Instant message sending and receiving
- **Typing Indicator**: Animated dots when bot is processing
- **Message Timestamps**: Shows when each message was sent
- **Auto-scroll**: Automatically scrolls to latest messages
- **Action Cards**: Visual feedback for customer creation (success/error)

### 📱 Mobile Optimized
- Touch-friendly buttons and inputs
- Optimized text sizes for mobile
- Responsive spacing and layout
- Keyboard-aware input area

### ⌨️ Keyboard Shortcuts
- `Enter` - Send message
- `Shift + Enter` - New line in message
- Auto-resizing textarea (up to 120px height)

## Usage

### Starting the UI

```bash
# Development mode (with auto-reload)
yarn chatbot:dev

# Production mode
yarn build
yarn chatbot:start
```

The interface will be available at: **http://localhost:3000**

### Using the Chat

1. **Type your message** in the input field at the bottom
2. **Press Enter** or click the send button
3. **Watch the typing indicator** while the bot processes
4. **View the response** with any action results (customer creation, etc.)
5. **Reset conversation** anytime using the "Reset Chat" button

### Example Interactions

**Simple Query:**
```
User: Hello! What can you do?
Bot: I can help you create customer records. Please provide name, email, and phone.
```

**Customer Registration:**
```
User: Register Maria Silva, maria@example.com, (11) 98765-4321
Bot: [Processing...]
Bot: Customer created successfully! Customer ID: #915
```

## UI Components

### Header
- **Logo & Title**: Customer Assistant branding
- **Reset Button**: Clears conversation history
- **Responsive**: Collapses on mobile devices

### Chat Container
- **Messages Area**: Scrollable chat history
- **Welcome Message**: Initial greeting with instructions
- **User Messages**: Right-aligned, gray background
- **Bot Messages**: Left-aligned, gradient purple/indigo background
- **Action Cards**: Green for success, red for errors

### Input Area
- **Auto-resizing Textarea**: Grows with content (max 120px)
- **Send Button**: Gradient purple button with icon
- **Keyboard Hints**: Shows Enter/Shift+Enter shortcuts
- **Disabled State**: While bot is typing

### Status Bar
- **Online Indicator**: Green dot showing system status
- **Connection Status**: "Online and ready to assist"

## Responsive Breakpoints

The UI uses Tailwind's default breakpoints:

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px (sm, md)
- **Desktop**: > 1024px (lg, xl)

### Mobile Optimizations
- Single column layout
- Larger touch targets
- Condensed header
- Optimized font sizes
- Full-width chat container

### Desktop Enhancements
- Max-width containers (4xl)
- Wider spacing
- Larger text in header
- Better use of whitespace

## Customization

### Colors

Edit `public/index.html` to change the color scheme:

```javascript
tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: '#6366f1',    // Change primary color
                secondary: '#8b5cf6',  // Change secondary color
            }
        }
    }
}
```

### Animations

The UI includes custom animations:
- **slideIn**: Messages fade in from bottom
- **blink**: Typing indicator dots animation
- **Custom scrollbar**: Styled for consistency

Edit the `<style>` section in `index.html` to modify animations.

### Branding

Update these elements in `index.html`:
- Logo icon (SVG in header)
- Title: "Customer Assistant"
- Subtitle: "AI-powered customer registration"
- Welcome message text

## Files

```
public/
├── index.html          # Main HTML file with Tailwind CSS
└── app.js             # Client-side JavaScript for chat functionality
```

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- **Tailwind CDN**: Fast loading via CDN
- **Minimal JavaScript**: ~300 lines of vanilla JS
- **No build step for frontend**: Direct HTML/JS/CSS
- **Lazy loading**: Messages load as needed

## Security

- **XSS Protection**: All user input is escaped
- **HTTPS Ready**: Works with SSL certificates
- **No localStorage**: Privacy-focused (conversation not persisted)

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- High contrast text
- Focus indicators on buttons

## Troubleshooting

### UI doesn't load
- Check server is running on port 3000
- Verify `public/` directory exists
- Check browser console for errors

### Tailwind styles not applying
- Ensure CDN is loaded (check network tab)
- Verify `tailwind.config` is properly set
- Check for JavaScript errors

### Chat not working
- Verify API endpoints are responding
- Check browser console for API errors
- Ensure MCP server is initialized

## Future Enhancements

Potential improvements:
- Dark mode toggle
- Message history persistence
- File upload support
- Multiple conversation threads
- Voice input
- Emoji picker
- Message search

## License

MIT
