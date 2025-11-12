// API Configuration
const API_BASE_URL = window.location.origin;

// DOM Elements
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const messagesContainer = document.getElementById('messagesContainer');
const sendBtn = document.getElementById('sendBtn');
const resetBtn = document.getElementById('resetBtn');

// State
let isTyping = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    autoResizeTextarea();
});

// Event Listeners
function setupEventListeners() {
    chatForm.addEventListener('submit', handleSubmit);
    resetBtn.addEventListener('click', handleReset);
    
    // Handle Enter key (submit) and Shift+Enter (new line)
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatForm.requestSubmit();
        }
    });
    
    // Auto-resize textarea
    messageInput.addEventListener('input', autoResizeTextarea);
}

// Auto-resize textarea based on content
function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();
    
    const message = messageInput.value.trim();
    if (!message || isTyping) return;
    
    // Clear input
    messageInput.value = '';
    autoResizeTextarea();
    
    // Add user message
    addMessage(message, 'user');
    
    // Disable input while processing
    setInputState(false);
    
    // Show typing indicator
    const typingId = showTypingIndicator();
    
    try {
        // Send message to API
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Remove typing indicator
        removeTypingIndicator(typingId);
        
        // Add bot response
        addMessage(data.reply, 'bot', data.actions);
        
    } catch (error) {
        console.error('Error:', error);
        removeTypingIndicator(typingId);
        addMessage('Sorry, something went wrong. Please try again.', 'bot', null, true);
    } finally {
        setInputState(true);
        messageInput.focus();
    }
}

// Handle reset button
async function handleReset() {
    if (!confirm('Are you sure you want to reset the conversation?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/chat/reset`, {
            method: 'POST',
        });
        
        if (response.ok) {
            // Clear messages except welcome message
            const welcomeMessage = messagesContainer.firstElementChild;
            messagesContainer.innerHTML = '';
            if (welcomeMessage) {
                messagesContainer.appendChild(welcomeMessage);
            }
            
            // Show success notification
            showNotification('Conversation reset successfully!', 'success');
        }
    } catch (error) {
        console.error('Error resetting conversation:', error);
        showNotification('Failed to reset conversation', 'error');
    }
}

// Add message to chat
function addMessage(text, sender, actions = null, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-slide-in mb-4';
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (sender === 'user') {
        messageDiv.innerHTML = `
            <div class="flex items-start justify-end space-x-3">
                <div class="flex-1 text-right">
                    <div class="inline-block rounded-2xl rounded-tr-none bg-gray-100 px-4 py-3 shadow-sm">
                        <p class="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">${escapeHtml(text)}</p>
                    </div>
                    <span class="mt-1 block text-xs text-gray-500">${timestamp}</span>
                </div>
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-300">
                    <svg class="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
            </div>
        `;
    } else {
        const actionsHtml = actions && actions.length > 0 ? generateActionsHtml(actions) : '';
        const errorClass = isError ? 'from-red-500 to-red-600' : 'from-indigo-500 to-purple-600';
        
        messageDiv.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${errorClass}">
                    <svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                </div>
                <div class="flex-1">
                    <div class="rounded-2xl rounded-tl-none bg-gradient-to-br ${errorClass} px-4 py-3 shadow-md">
                        <p class="text-sm font-medium leading-relaxed text-white whitespace-pre-wrap">${escapeHtml(text)}</p>
                    </div>
                    ${actionsHtml}
                    <span class="mt-1 block text-xs text-gray-500">${timestamp}</span>
                </div>
            </div>
        `;
    }
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// Generate actions HTML (for customer creation results)
function generateActionsHtml(actions) {
    if (!actions || actions.length === 0) return '';
    
    let html = '<div class="mt-2 space-y-2">';
    
    actions.forEach(action => {
        if (action.result && action.result.status === 'success') {
            html += `
                <div class="rounded-lg bg-green-50 border border-green-200 p-3">
                    <div class="flex items-center space-x-2">
                        <svg class="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="text-sm font-medium text-green-900">Customer Created Successfully</span>
                    </div>
                    ${action.result.customerId ? `
                        <p class="mt-1 text-xs text-green-700">Customer ID: <span class="font-mono font-semibold">#${action.result.customerId}</span></p>
                    ` : ''}
                </div>
            `;
        } else if (action.error || (action.result && action.result.status === 'error')) {
            html += `
                <div class="rounded-lg bg-red-50 border border-red-200 p-3">
                    <div class="flex items-center space-x-2">
                        <svg class="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="text-sm font-medium text-red-900">Action Failed</span>
                    </div>
                    <p class="mt-1 text-xs text-red-700">${escapeHtml(action.error || action.result.error || 'Unknown error')}</p>
                </div>
            `;
        }
    });
    
    html += '</div>';
    return html;
}

// Show typing indicator
function showTypingIndicator() {
    const id = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.id = id;
    typingDiv.className = 'message-slide-in mb-4';
    typingDiv.innerHTML = `
        <div class="flex items-start space-x-3">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
                <svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            </div>
            <div class="flex-1">
                <div class="inline-flex items-center space-x-2 rounded-2xl rounded-tl-none bg-gray-100 px-4 py-3">
                    <div class="typing-indicator flex space-x-1">
                        <span class="h-2 w-2 rounded-full bg-gray-500"></span>
                        <span class="h-2 w-2 rounded-full bg-gray-500"></span>
                        <span class="h-2 w-2 rounded-full bg-gray-500"></span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    scrollToBottom();
    isTyping = true;
    
    return id;
}

// Remove typing indicator
function removeTypingIndicator(id) {
    const typingDiv = document.getElementById(id);
    if (typingDiv) {
        typingDiv.remove();
    }
    isTyping = false;
}

// Set input state (enabled/disabled)
function setInputState(enabled) {
    messageInput.disabled = !enabled;
    sendBtn.disabled = !enabled;
    
    if (enabled) {
        messageInput.classList.remove('opacity-50', 'cursor-not-allowed');
        sendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        messageInput.classList.add('opacity-50', 'cursor-not-allowed');
        sendBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

// Scroll to bottom of messages
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 message-slide-in`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-10px)';
        notification.style.transition = 'all 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
