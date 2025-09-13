<script lang="ts">
  // Real-time Chat - Using Day 8 communication infrastructure
  import { onMount, onDestroy, createEventDispatcher, afterUpdate } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { authStore } from '$lib/stores/auth';
  import { socketService } from '$lib/services/socket';
  import { uxAnalyticsService } from '$lib/services/ux-analytics';
  import Button from '../Button.svelte';
  import LoadingSpinner from '../LoadingSpinner.svelte';
  
  export let chatId: string;
  export let participantId: string;
  export let userType = 'client'; // client, provider
  export let argentinaOptimized = true;
  
  const dispatch = createEventDispatcher();
  
  // Chat state
  let messages: any[] = [];
  let newMessage = '';
  let isConnected = false;
  let isTyping = false;
  let otherUserTyping = false;
  let socketConnection: any = null;
  let messagesContainer: HTMLElement;
  let messageInput: HTMLInputElement;
  
  // Chat features
  let chatInfo: any = {};
  let unreadCount = 0;
  let isOnline = false;
  let lastSeen = '';
  
  // Argentina-specific features
  let argentinaFeatures = {
    whatsappIntegration: true,
    spanishSupport: true,
    mobileOptimized: true,
    emojiSupport: true,
    voiceMessages: false // Future feature
  };
  
  // Message types
  const messageTypes = {
    text: 'text',
    booking: 'booking',
    payment: 'payment',
    system: 'system',
    image: 'image'
  };
  
  // Emoji shortcuts for Argentina
  const emojiShortcuts = [
    { code: '👍', name: 'like' },
    { code: '❤️', name: 'love' },
    { code: '😊', name: 'smile' },
    { code: '🔥', name: 'fire' },
    { code: '💯', name: 'hundred' },
    { code: '👏', name: 'clap' },
    { code: '🎉', name: 'party' },
    { code: '💪', name: 'strong' }
  ];
  
  // Typing indicator timer
  let typingTimer: number;
  
  onMount(async () => {
    try {
      // Initialize socket connection
      await initializeChat();
      
      // Load chat history
      await loadChatHistory();
      
      // Load chat info
      await loadChatInfo();
      
      // Track chat access
      uxAnalyticsService.trackEvent('real_time_chat_accessed', {
        chatId,
        userType,
        argentinaOptimized
      });
    } catch (error) {
      console.error('[RealTimeChat] Initialization error:', error);
    }
  });
  
  onDestroy(() => {
    if (socketConnection) {
      socketConnection.emit('leave_chat', { chatId });
      socketConnection.off('message_received');
      socketConnection.off('typing_start');
      socketConnection.off('typing_stop');
      socketConnection.off('user_online');
      socketConnection.off('user_offline');
      socketConnection.disconnect();
    }
    
    if (typingTimer) {
      clearTimeout(typingTimer);
    }
  });
  
  afterUpdate(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });
  
  async function initializeChat() {
    try {
      socketConnection = await socketService.connect();
      
      // Join chat room
      socketConnection.emit('join_chat', {
        chatId,
        userId: $authStore.user?.id,
        userType
      });
      
      // Set up event listeners
      socketConnection.on('connect', () => {
        isConnected = true;
      });
      
      socketConnection.on('disconnect', () => {
        isConnected = false;
      });
      
      socketConnection.on('message_received', handleMessageReceived);
      socketConnection.on('typing_start', handleTypingStart);
      socketConnection.on('typing_stop', handleTypingStop);
      socketConnection.on('user_online', handleUserOnline);
      socketConnection.on('user_offline', handleUserOffline);
      socketConnection.on('message_read', handleMessageRead);
      
      isConnected = true;
    } catch (error) {
      console.error('[RealTimeChat] Socket initialization error:', error);
    }
  }
  
  async function loadChatHistory() {
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        headers: {
          'Authorization': `Bearer ${$authStore.token}`,
          'X-Argentina-Chat': 'true'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        messages = data.messages || [];
        
        // Mark messages as read
        markMessagesAsRead();
      }
    } catch (error) {
      console.error('[RealTimeChat] Load history error:', error);
    }
  }
  
  async function loadChatInfo() {
    try {
      const response = await fetch(`/api/chats/${chatId}/info`, {
        headers: {
          'Authorization': `Bearer ${$authStore.token}`
        }
      });
      
      if (response.ok) {
        chatInfo = await response.json();
        isOnline = chatInfo.otherUser?.isOnline || false;
        lastSeen = chatInfo.otherUser?.lastSeen || '';
      }
    } catch (error) {
      console.error('[RealTimeChat] Load info error:', error);
    }
  }
  
  function handleMessageReceived(data: any) {
    const message = data.message;
    
    // Only add if not already in messages
    if (!messages.find(m => m.id === message.id)) {
      messages = [...messages, message];
      
      // Mark as read if chat is active
      if (document.hasFocus()) {
        markMessageAsRead(message.id);
      } else {
        unreadCount++;
      }
      
      // Track message received
      uxAnalyticsService.trackEvent('chat_message_received', {
        chatId,
        messageType: message.type,
        fromUserType: message.senderType
      });
    }
  }
  
  function handleTypingStart(data: any) {
    if (data.userId !== $authStore.user?.id) {
      otherUserTyping = true;
    }
  }
  
  function handleTypingStop(data: any) {
    if (data.userId !== $authStore.user?.id) {
      otherUserTyping = false;
    }
  }
  
  function handleUserOnline(data: any) {
    if (data.userId === participantId) {
      isOnline = true;
    }
  }
  
  function handleUserOffline(data: any) {
    if (data.userId === participantId) {
      isOnline = false;
      lastSeen = data.lastSeen;
    }
  }
  
  function handleMessageRead(data: any) {
    messages = messages.map(msg => 
      msg.id === data.messageId ? { ...msg, read: true } : msg
    );
  }
  
  async function sendMessage() {
    if (!newMessage.trim() || !socketConnection) {
      return;
    }
    
    const messageText = newMessage.trim();
    newMessage = '';
    
    // Stop typing indicator
    stopTyping();
    
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${$authStore.token}`
        },
        body: JSON.stringify({
          content: messageText,
          type: messageTypes.text,
          recipientId: participantId,
          argentinaOptimized: true
        })
      });
      
      if (response.ok) {
        const message = await response.json();
        
        // Add to local messages (optimistic update)
        messages = [...messages, message];
        
        // Emit via socket for real-time delivery
        socketConnection.emit('send_message', {
          chatId,
          message,
          recipientId: participantId
        });
        
        // Track message sent
        uxAnalyticsService.trackEvent('chat_message_sent', {
          chatId,
          messageLength: messageText.length,
          messageType: messageTypes.text
        });
      } else {
        const error = await response.json();
        console.error('[RealTimeChat] Send message error:', error);
        alert('Error al enviar mensaje');
      }
    } catch (error) {
      console.error('[RealTimeChat] Send message error:', error);
      alert('Error al enviar mensaje');
    }
  }
  
  function handleTyping() {
    if (!isTyping && socketConnection) {
      isTyping = true;
      socketConnection.emit('typing_start', {
        chatId,
        userId: $authStore.user?.id
      });
    }
    
    // Reset typing timer
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      stopTyping();
    }, 1000);
  }
  
  function stopTyping() {
    if (isTyping && socketConnection) {
      isTyping = false;
      socketConnection.emit('typing_stop', {
        chatId,
        userId: $authStore.user?.id
      });
    }
  }
  
  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    } else {
      handleTyping();
    }
  }
  
  function addEmoji(emoji: string) {
    newMessage += emoji;
    messageInput?.focus();
  }
  
  async function markMessageAsRead(messageId: string) {
    try {
      await fetch(`/api/chats/${chatId}/messages/${messageId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${$authStore.token}`
        }
      });
      
      // Emit read status via socket
      if (socketConnection) {
        socketConnection.emit('message_read', {
          chatId,
          messageId,
          userId: $authStore.user?.id
        });
      }
    } catch (error) {
      console.error('[RealTimeChat] Mark read error:', error);
    }
  }
  
  function markMessagesAsRead() {
    const unreadMessages = messages.filter(m => 
      m.senderId !== $authStore.user?.id && !m.read
    );
    
    unreadMessages.forEach(message => {
      markMessageAsRead(message.id);
    });
    
    unreadCount = 0;
  }
  
  function formatMessageTime(timestamp: string): string {
    return new Intl.DateTimeFormat('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Argentina/Buenos_Aires'
    }).format(new Date(timestamp));
  }
  
  function formatLastSeen(timestamp: string): string {
    const now = new Date();
    const lastSeenDate = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'hace un momento';
    if (diffMinutes < 60) return `hace ${diffMinutes} min`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `hace ${diffHours}h`;
    
    return lastSeenDate.toLocaleDateString('es-AR');
  }
  
  function getMessageBubbleClass(message: any): string {
    const isOwnMessage = message.senderId === $authStore.user?.id;
    
    if (isOwnMessage) {
      return 'bg-blue-600 text-white ml-auto max-w-xs lg:max-w-md';
    } else {
      return 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white mr-auto max-w-xs lg:max-w-md';
    }
  }
  
  function shouldShowAvatar(message: any, index: number): boolean {
    if (message.senderId === $authStore.user?.id) return false;
    
    const nextMessage = messages[index + 1];
    return !nextMessage || nextMessage.senderId !== message.senderId;
  }
  
  function shouldShowTimestamp(message: any, index: number): boolean {
    const prevMessage = messages[index - 1];
    if (!prevMessage) return true;
    
    const currentTime = new Date(message.createdAt);
    const prevTime = new Date(prevMessage.createdAt);
    
    // Show timestamp if more than 5 minutes apart
    return (currentTime.getTime() - prevTime.getTime()) > 5 * 60 * 1000;
  }
</script>

<!-- Real-time Chat Component -->
<div class="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
  <!-- Chat Header -->
  <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
    <div class="flex items-center space-x-3">
      <!-- Participant Avatar -->
      <div class="relative">
        <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
          {chatInfo.otherUser?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        
        <!-- Online Status Indicator -->
        <div class="absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white dark:border-gray-700 rounded-full"
             class:bg-green-400={isOnline}
             class:bg-gray-400={!isOnline}>
        </div>
      </div>
      
      <!-- Participant Info -->
      <div>
        <h3 class="font-semibold text-gray-900 dark:text-white">
          {chatInfo.otherUser?.name || 'Usuario'}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {#if otherUserTyping}
            <span class="text-blue-600 dark:text-blue-400">escribiendo...</span>
          {:else if isOnline}
            <span class="text-green-600 dark:text-green-400">en línea</span>
          {:else if lastSeen}
            <span>visto {formatLastSeen(lastSeen)}</span>
          {:else}
            <span>offline</span>
          {/if}
        </p>
      </div>
    </div>
    
    <!-- Connection Status -->
    <div class="flex items-center space-x-2">
      <div class="w-3 h-3 rounded-full"
           class:bg-green-400={isConnected}
           class:bg-red-400={!isConnected}
           class:animate-pulse={!isConnected}>
      </div>
      <span class="text-xs text-gray-500 dark:text-gray-400">
        {isConnected ? 'Conectado' : 'Conectando...'}
      </span>
    </div>
  </div>
  
  <!-- Messages Container -->
  <div 
    bind:this={messagesContainer}
    class="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900"
    style="height: 400px; max-height: 60vh;"
  >
    {#if messages.length > 0}
      {#each messages as message, index (message.id)}
        <div in:fly={{ y: 20, duration: 200, delay: index * 50 }}>
          <!-- Timestamp Divider -->
          {#if shouldShowTimestamp(message, index)}
            <div class="flex justify-center mb-4">
              <span class="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                {formatMessageTime(message.createdAt)}
              </span>
            </div>
          {/if}
          
          <!-- Message Bubble -->
          <div class="flex items-end space-x-2"
               class:flex-row-reverse={message.senderId === $authStore.user?.id}>
            
            <!-- Avatar (for received messages only) -->
            {#if shouldShowAvatar(message, index)}
              <div class="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {chatInfo.otherUser?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            {:else if message.senderId !== $authStore.user?.id}
              <div class="w-8 h-8 flex-shrink-0"></div>
            {/if}
            
            <!-- Message Content -->
            <div class="relative {getMessageBubbleClass(message)} px-4 py-2 rounded-2xl">
              {#if message.type === messageTypes.text}
                <p class="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              {:else if message.type === messageTypes.booking}
                <div class="bg-white bg-opacity-20 rounded-lg p-3">
                  <div class="flex items-center space-x-2 mb-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span class="text-sm font-medium">Reserva</span>
                  </div>
                  <p class="text-sm">{message.content}</p>
                </div>
              {:else if message.type === messageTypes.system}
                <div class="text-center">
                  <span class="text-xs opacity-75 italic">{message.content}</span>
                </div>
              {/if}
              
              <!-- Message Status -->
              {#if message.senderId === $authStore.user?.id}
                <div class="absolute -bottom-1 -right-1 flex items-center space-x-1">
                  {#if message.read}
                    <svg class="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    <svg class="w-3 h-3 text-blue-400 -ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  {:else}
                    <svg class="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  {/if}
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/each}
      
      <!-- Typing Indicator -->
      {#if otherUserTyping}
        <div class="flex items-end space-x-2" in:fade>
          <div class="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {chatInfo.otherUser?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          
          <div class="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-2xl max-w-xs">
            <div class="flex space-x-1">
              <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
              <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
              <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            </div>
          </div>
        </div>
      {/if}
    {:else}
      <!-- Empty Chat State -->
      <div class="flex items-center justify-center h-full" in:fade>
        <div class="text-center">
          <div class="text-6xl mb-4">💬</div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            ¡Inicia la conversación!
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            Envía tu primer mensaje para comenzar a chatear
          </p>
        </div>
      </div>
    {/if}
  </div>
  
  <!-- Message Input Area -->
  <div class="border-t border-gray-200 dark:border-gray-600 p-4 bg-white dark:bg-gray-800">
    <!-- Emoji Bar (Argentina optimized) -->
    <div class="flex items-center space-x-2 mb-3 overflow-x-auto pb-2">
      {#each emojiShortcuts as emoji}
        <button
          on:click={() => addEmoji(emoji.code)}
          class="flex-shrink-0 w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title={emoji.name}
        >
          {emoji.code}
        </button>
      {/each}
    </div>
    
    <!-- Input and Send Button -->
    <div class="flex items-end space-x-3">
      <div class="flex-1 relative">
        <textarea
          bind:this={messageInput}
          bind:value={newMessage}
          on:keydown={handleKeyPress}
          placeholder="Escribe un mensaje..."
          rows="1"
          class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
          style="min-height: 48px; max-height: 120px;"
          disabled={!isConnected}
        ></textarea>
        
        <!-- Character Counter (mobile friendly) -->
        {#if newMessage.length > 100}
          <div class="absolute bottom-2 right-2 text-xs text-gray-400">
            {newMessage.length}/500
          </div>
        {/if}
      </div>
      
      <!-- Send Button -->
      <Button
        variant="primary"
        size="md"
        on:click={sendMessage}
        disabled={!newMessage.trim() || !isConnected}
        class="flex-shrink-0 w-12 h-12 rounded-xl p-0 flex items-center justify-center"
      >
        {#if !isConnected}
          <LoadingSpinner size="small" />
        {:else}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        {/if}
      </Button>
    </div>
    
    <!-- Chat Actions (Argentina features) -->
    <div class="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
      <div class="flex items-center space-x-4">
        <span>
          {isConnected ? '🟢' : '🔴'} {isConnected ? 'Conectado' : 'Desconectado'}
        </span>
        
        {#if argentinaFeatures.whatsappIntegration}
          <button class="hover:text-green-600 transition-colors">
            📱 WhatsApp
          </button>
        {/if}
      </div>
      
      <div class="flex items-center space-x-2">
        <span>Enter para enviar</span>
        <span>•</span>
        <span>Shift+Enter para nueva línea</span>
      </div>
    </div>
  </div>
</div>

<style>
  /* Custom scrollbar for Argentina mobile optimization */
  .overflow-y-auto {
    -webkit-overflow-scrolling: touch;
  }
  
  .overflow-y-auto::-webkit-scrollbar {
    width: 6px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .overflow-y-auto::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
    border-radius: 3px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background-color: rgba(156, 163, 175, 0.8);
  }
  
  /* Message bubble animations */
  .max-w-xs, .max-w-md {
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  
  /* Typing animation */
  @keyframes bounce {
    0%, 60%, 100% {
      transform: translateY(0);
    }
    30% {
      transform: translateY(-10px);
    }
  }
  
  .animate-bounce {
    animation: bounce 1.4s infinite;
  }
  
  /* Mobile optimization for Argentina */
  @media (max-width: 768px) {
    .max-w-xs {
      max-width: 85%;
    }
    
    /* Larger touch targets */
    button {
      min-height: 44px;
      min-width: 44px;
    }
    
    /* Emoji bar scroll */
    .overflow-x-auto {
      -webkit-overflow-scrolling: touch;
    }
  }
  
  /* Dark mode optimizations */
  @media (prefers-color-scheme: dark) {
    .bg-gradient-to-b {
      background: linear-gradient(to bottom, #1f2937, #111827);
    }
  }
  
  /* Smooth transitions */
  .transition-colors {
    transition-property: color, background-color, border-color;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
  }
</style>