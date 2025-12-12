import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import NavBar from './NavBar';
import { chatbotAPI } from '../services/api';

const ChatBot = () => {
  const [activeChat, setActiveChat] = useState(0);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Initial empty chat
  const [chats, setChats] = useState([
    {
      id: 0,
      title: "New Chat",
      date: new Date().toLocaleDateString(),
      messages: [],
      sessionId: sessionId
    }
  ]);

  const chatEndRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chats, activeChat]);

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    const userMessage = inputText.trim();
    const currentChatId = activeChat;
    const currentChat = chats.find(c => c.id === currentChatId);

    // Add user message to UI immediately
    setChats(prevChats => {
      const newChats = [...prevChats];
      const chatToUpdate = newChats.find(c => c.id === currentChatId);
      
      if (chatToUpdate) {
        chatToUpdate.messages.push({
          id: `user-${Date.now()}`,
          type: 'user',
          text: userMessage,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
      return newChats;
    });

    setInputText('');

    try {
      // Send message to backend
      const apiResponse = await chatbotAPI.sendMessage(userMessage, currentChat.sessionId);
      
      // Extract response from backend
      const agentResponse = apiResponse.data.response;

      // Add agent response to UI
      setChats(prevChats => {
        const newChats = [...prevChats];
        const chatToUpdate = newChats.find(c => c.id === currentChatId);
        
        if (chatToUpdate) {
          chatToUpdate.messages.push({
            id: `bot-${Date.now()}`,
            type: 'bot',
            text: agentResponse,
            timestamp: new Date().toLocaleTimeString(),
            intent: apiResponse.data.intent,
            confidence: apiResponse.data.confidence
          });
        }
        return newChats;
      });

    } catch (err) {
      console.error('Chatbot API error:', err);
      
      // Extract error message
      const errorMessage = err.response?.data?.detail?.message 
        || err.response?.data?.message 
        || 'The chatbot service is currently unavailable. Please try again later.';
      
      // Add error message to UI
      setChats(prevChats => {
        const newChats = [...prevChats];
        const chatToUpdate = newChats.find(c => c.id === currentChatId);
        
        if (chatToUpdate) {
          chatToUpdate.messages.push({
            id: `error-${Date.now()}`,
            type: 'bot',
            text: errorMessage,
            timestamp: new Date().toLocaleTimeString(),
            isError: true
          });
        }
        return newChats;
      });
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChatHistory = async () => {
    try {
      // Fetch chat history from backend
      const response = await chatbotAPI.getChatHistory(50);
      const history = response.data; // Array of {id, role, content, timestamp}

      if (history && history.length > 0) {
        // Update the initial chat session with history
        setChats(prevChats => {
          const newChats = [...prevChats];
          const initialChat = newChats.find(c => c.id === 0);
          
          if (initialChat) {
            // Map backend format to frontend format
            initialChat.messages = history.map(msg => {
              // Convert 'role' to 'type' for frontend
              const messageType = msg.role === 'user' ? 'user' : 'bot';
              
              return {
                id: msg.id,
                type: messageType,
                text: msg.content,
                timestamp: new Date(msg.timestamp).toLocaleTimeString(),
              };
            });
          }
          return newChats;
        });
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  };

  const handleChatSelect = (chatId) => {
    setActiveChat(chatId);
    setError(null);
  };

  const handleNewChat = () => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newChat = {
      id: chats.length,
      title: `New Chat ${chats.length + 1}`,
      date: new Date().toLocaleDateString(),
      messages: [],
      sessionId: newSessionId
    };
    setChats([...chats, newChat]);
    setActiveChat(newChat.id);
    setError(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ backgroundColor: '#E0E0E0' }}>
      <NavBar />

      {/* Chat History Sidebar */}
      <div className="w-64 bg-gray-200 border-r-4 flex-shrink-0" style={{ borderColor: '#89CE94' }}>
        <div className="p-4 flex flex-col h-full">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#7D5BA6' }}>Chat History</h3>

          {/* New Chat Button */}
          <div className="mb-4">
            <button
              onClick={handleNewChat}
              className="w-full py-2 px-4 bg-[#89ce94] text-white font-semibold rounded-lg hover:bg-[#7dc987] transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              + New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {chats.map((chat) => (
              <div 
                key={chat.id} 
                onClick={() => handleChatSelect(chat.id)}
                className={`p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50 border-2 ${activeChat === chat.id ? 'ring-2 ring-[#7D5BA6]' : ''}`}
                style={{ borderColor: '#89CE94' }}
              >
                <p className="font-medium text-sm text-gray-800">{chat.title}</p>
                <p className="text-xs text-gray-500 mt-1">{chat.date}</p>
                <p className="text-xs text-gray-400 mt-1">{Math.floor(chat.messages.length / 2)} messages</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Chatbot Header */}
        <div className="px-8 py-4 flex-shrink-0 border-b border-gray-300">
          <h5 className="text-2xl text-gray-600 font-medium">ClariFi Assistant</h5>
          <p className="text-sm text-gray-500 mt-1">
            AI-powered financial assistant
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-8 mt-4 p-3 bg-red-100 border-2 border-red-300 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 px-8 py-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-6">
            {chats[activeChat].messages.length === 0 && (
              <div className="text-center text-gray-500 mt-20">
                <p className="text-lg mb-2">👋 Hello! I'm your ClariFi Assistant</p>
                <p className="text-sm">Ask me about your finances, expenses, budgets, or goals!</p>
                <div className="mt-6 grid grid-cols-1 gap-3 max-w-md mx-auto">
                  <button 
                    onClick={() => setInputText("How much did I spend this month?")}
                    className="p-3 bg-white border-2 border-[#89ce94] rounded-lg hover:bg-gray-50 text-sm text-left"
                  >
                    "How much did I spend this month?"
                  </button>
                  <button 
                    onClick={() => setInputText("Show my expense categories")}
                    className="p-3 bg-white border-2 border-[#89ce94] rounded-lg hover:bg-gray-50 text-sm text-left"
                  >
                    "Show my expense categories"
                  </button>
                  <button 
                    onClick={() => setInputText("What are my financial goals?")}
                    className="p-3 bg-white border-2 border-[#89ce94] rounded-lg hover:bg-gray-50 text-sm text-left"
                  >
                    "What are my financial goals?"
                  </button>
                </div>
              </div>
            )}

            {chats[activeChat].messages.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.type === 'bot' && (
                  <div className="flex flex-col items-center mr-4">
                    <div className="w-16 h-16 bg-[#7d5ba6] rounded-full flex items-center justify-center">
                      <div className="text-white text-3xl">🤖</div>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">ClariFi</span>
                  </div>
                )}
                <div className={`max-w-md p-4 rounded-2xl ${
                  message.type === 'bot' 
                    ? message.isError 
                      ? 'bg-red-100 border-2 border-red-300'
                      : 'bg-white border-2 border-[#7d5ba6]' 
                    : 'bg-[#86a59c] text-white'
                }`}>
                  <p className={message.type === 'bot' && !message.isError ? 'text-[#333333]' : message.isError ? 'text-red-700' : 'text-white'}>
                    {message.text}
                  </p>
                  {message.intent && (
                    <p className="text-xs text-gray-400 mt-2">
                      Intent: {message.intent} {message.confidence && `(${(message.confidence * 100).toFixed(0)}%)`}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-16 h-16 bg-[#7d5ba6] rounded-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                  <span className="text-xs text-gray-500 mt-1">Thinking...</span>
                </div>
                <div className="max-w-md p-4 rounded-2xl bg-white border-2 border-[#7d5ba6]">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-[#7d5ba6] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-[#7d5ba6] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-[#7d5ba6] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="px-8 py-6 flex-shrink-0 border-t border-gray-300">
          <div className="max-w-3xl mx-auto flex items-center space-x-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your finances..."
              disabled={isLoading}
              className="flex-1 px-6 py-3 border-2 border-[#86a59c] rounded-full focus:outline-none focus:border-[#7d5ba6] text-[#333333] disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !inputText.trim()}
              className="w-12 h-12 bg-[#89ce94] rounded-full flex items-center justify-center hover:bg-[#7dc987] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-3">
            This service is for general information only and not financial advice
          </p>
        </div>

        <div className="fixed bottom-4 right-4 text-xs text-gray-500">
          App is owned by Team Nova
        </div>
      </div>
    </div>
  );
};

export default ChatBot;