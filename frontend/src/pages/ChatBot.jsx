import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertCircle, User, MessageSquare } from 'lucide-react';
import NavBar from './NavBar';
import { chatbotAPI, authAPI } from '../services/api';

const ChatBot = () => {
  const [activeChat, setActiveChat] = useState(0);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
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

  // Load user info and chat history on mount
  useEffect(() => {
    loadUserInfo();
    loadChatHistory();
  }, []);

  // Load user info from token
  const loadUserInfo = async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Try to get user profile from API if not in token
        let userProfile = {
          id: payload.user_id || payload.sub,
          email: payload.email,
          accountType: payload.account_type || payload.user_type || 'personal',
          firstName: payload.first_name,
          lastName: payload.last_name,
          businessName: payload.business_name,
          displayName: payload.display_name,
          initials: null
        };
        
        // If we don't have name info in token, try to fetch profile
        if (!userProfile.firstName && !userProfile.lastName) {
          try {
            const profileResponse = await authAPI.getProfile();
            if (profileResponse.data) {
              const profile = profileResponse.data;
              userProfile.firstName = profile.first_name || profile.firstName;
              userProfile.lastName = profile.last_name || profile.lastName;
              userProfile.businessName = profile.business_name || profile.businessName;
              userProfile.displayName = profile.display_name || profile.displayName;
            }
          } catch (profileError) {
            console.log("Could not fetch user profile:", profileError);
          }
        }
        
        // Generate initials
        if (userProfile.firstName && userProfile.lastName) {
          userProfile.initials = `${userProfile.firstName.charAt(0)}${userProfile.lastName.charAt(0)}`.toUpperCase();
        } else if (userProfile.firstName) {
          userProfile.initials = userProfile.firstName.charAt(0).toUpperCase();
        } else if (userProfile.email) {
          userProfile.initials = userProfile.email.charAt(0).toUpperCase();
        } else {
          userProfile.initials = "U";
        }
        
        setUserInfo(userProfile);
      }
    } catch (error) {
      console.error("Error loading user info:", error);
    }
  };

  const loadChatHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await chatbotAPI.getChatHistory(50);
      const history = response.data; // Array of {id, role, content, timestamp}

      if (history && history.length > 0) {
        // Group messages by session ID from backend
        const sessions = {};
        
        // First, organize by session_id (from the IDs or group sequential messages)
        let currentSessionId = null;
        let sessionCounter = 0;
        
        for (let i = 0; i < history.length; i += 2) {
          if (i + 1 < history.length) {
            const userMessage = history[i];
            const botMessage = history[i + 1];
            
            // Create session ID if not exists
            if (!currentSessionId) {
              currentSessionId = `session_${sessionCounter}`;
              sessionCounter++;
            }
            
            if (!sessions[currentSessionId]) {
              // Generate meaningful title from first user message
              const title = generateChatTitle(userMessage.content);
              
              sessions[currentSessionId] = {
                id: Object.keys(sessions).length,
                sessionId: currentSessionId,
                title: title,
                date: new Date(userMessage.timestamp).toLocaleDateString(),
                messages: []
              };
            }
            
            // Add user message
            sessions[currentSessionId].messages.push({
              id: userMessage.id,
              type: 'user',
              text: userMessage.content,
              timestamp: new Date(userMessage.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
            });
            
            // Add bot response
            sessions[currentSessionId].messages.push({
              id: botMessage.id,
              type: 'bot',
              text: botMessage.content,
              timestamp: new Date(botMessage.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
            });
            
            // Reset session ID for next pair (if messages are far apart)
            const nextIndex = i + 2;
            if (nextIndex < history.length) {
              const nextTime = new Date(history[nextIndex].timestamp);
              const currentTime = new Date(userMessage.timestamp);
              const timeDiff = Math.abs(nextTime - currentTime) / (1000 * 60); // minutes
              
              // If next message is more than 30 minutes later, start new session
              if (timeDiff > 30) {
                currentSessionId = null;
              }
            }
          }
        }

        // Convert sessions object to array
        const sessionArray = Object.values(sessions);
        
        if (sessionArray.length > 0) {
          setChats(sessionArray);
          setActiveChat(sessionArray[0].id);
        } else {
          setChats([{
            id: 0,
            title: "New Chat",
            date: new Date().toLocaleDateString(),
            messages: [],
            sessionId: sessionId
          }]);
        }
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
      if (error.response?.status === 401) {
        setError("Please log in to view your chat history");
      } else if (error.response?.status === 404) {
        console.log("No chat history found for user");
      } else {
        setError("Failed to load chat history. Please try again.");
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Generate meaningful chat title from user message
  const generateChatTitle = (message) => {
    const lowerMessage = message.toLowerCase();
    
    // Business-related titles
    if (lowerMessage.includes('business') || lowerMessage.includes('company') || lowerMessage.includes('revenue')) {
      if (lowerMessage.includes('expense')) return "Business Expenses";
      if (lowerMessage.includes('revenue')) return "Revenue Analysis";
      if (lowerMessage.includes('profit')) return "Profit Margin";
      if (lowerMessage.includes('cash flow')) return "Cash Flow";
      if (lowerMessage.includes('tax')) return "Tax Deductions";
      return "Business Inquiry";
    }
    
    // Personal finance titles
    if (lowerMessage.includes('spend') || lowerMessage.includes('expense')) return "Monthly Expenses";
    if (lowerMessage.includes('budget')) return "Budget Planning";
    if (lowerMessage.includes('goal') || lowerMessage.includes('save')) return "Financial Goals";
    if (lowerMessage.includes('transaction')) return "Recent Transactions";
    if (lowerMessage.includes('category')) return "Expense Categories";
    
    // Shorten long messages
    if (message.length > 20) {
      return message.substring(0, 20) + '...';
    }
    
    return message || "New Chat";
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    const userMessage = inputText.trim();
    const currentChatId = activeChat;
    const currentChat = chats.find(c => c.id === currentChatId);

    // Create or update chat with user message
    setChats(prevChats => {
      const newChats = [...prevChats];
      let chatToUpdate = newChats.find(c => c.id === currentChatId);
      
      // If this is a new chat (empty), update its title
      if (chatToUpdate && chatToUpdate.messages.length === 0) {
        const newTitle = generateChatTitle(userMessage);
        chatToUpdate.title = newTitle;
        chatToUpdate.date = new Date().toLocaleDateString();
      }
      
      if (chatToUpdate) {
        // Add user message
        chatToUpdate.messages.push({
          id: `user-${Date.now()}`,
          type: 'user',
          text: userMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }
      return newChats;
    });

    setInputText('');

    try {
      // Send message to backend
      const apiResponse = await chatbotAPI.sendMessage(userMessage, currentChat.sessionId);
      const agentResponse = apiResponse.data.response;

      // Add bot response to UI
      setChats(prevChats => {
        const newChats = [...prevChats];
        const chatToUpdate = newChats.find(c => c.id === currentChatId);
        
        if (chatToUpdate) {
          chatToUpdate.messages.push({
            id: `bot-${Date.now()}`,
            type: 'bot',
            text: agentResponse,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            intent: apiResponse.data.intent,
            confidence: apiResponse.data.confidence
          });
          
          // Update chat date to last message time
          chatToUpdate.date = new Date().toLocaleDateString();
        }
        return newChats;
      });

    } catch (err) {
      console.error('Chatbot API error:', err);
      
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
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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

  const handleChatSelect = (chatId) => {
    setActiveChat(chatId);
    setError(null);
  };

  const handleNewChat = () => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newChat = {
      id: chats.length,
      title: "New Chat",
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

  // Get user display name
  const getUserDisplayName = () => {
    if (!userInfo) return "User";
    
    if (userInfo.displayName) {
      return userInfo.displayName;
    }
    
    if (userInfo.firstName && userInfo.lastName) {
      return `${userInfo.firstName} ${userInfo.lastName}`;
    } else if (userInfo.firstName) {
      return userInfo.firstName;
    } else if (userInfo.email) {
      // Get name from email before @ symbol, capitalize first letter
      const emailName = userInfo.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    
    return "User";
  };

  // Get account type display
  const getAccountTypeDisplay = () => {
    if (!userInfo) return "Personal Account";
    
    if (userInfo.accountType === 'business') {
      return userInfo.businessName 
        ? `${userInfo.businessName} (Business)` 
        : "Business Account";
    }
    
    return "Personal Account";
  };

  // Get user initials for avatars
  const getUserInitials = () => {
    if (!userInfo || !userInfo.initials) {
      return "U";
    }
    return userInfo.initials;
  };

  // Count message pairs in a chat
  const countMessagePairs = (messages) => {
    return Math.floor(messages.filter(m => m.type === 'user').length);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ backgroundColor: '#E0E0E0' }}>
      <NavBar />

      {/* Chat History Sidebar */}
      <div className="w-64 bg-gray-200 border-r-4 flex-shrink-0" style={{ borderColor: '#89CE94' }}>
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: '#7D5BA6' }}>Chat History</h3>
            <MessageSquare className="w-5 h-5" style={{ color: '#7D5BA6' }} />
          </div>

          {/* User Info Card */}
          {userInfo && (
            <div className="mb-4 p-3 bg-white rounded-lg border-2 shadow-sm" style={{ borderColor: '#89CE94' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-[#7D5BA6] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {getUserInitials()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{userInfo.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  userInfo.accountType === 'business' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {userInfo.accountType === 'business' ? 'Business' : 'Personal'}
                </span>
                <span className="text-xs text-gray-500 font-mono">ID: {userInfo.id}</span>
              </div>
            </div>
          )}

          {/* New Chat Button */}
          <div className="mb-4">
            <button
              onClick={handleNewChat}
              className="w-full py-2.5 px-4 bg-[#89ce94] text-white font-semibold rounded-lg hover:bg-[#7dc987] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm hover:shadow"
              disabled={isLoading}
            >
              <span>+</span>
              <span>New Chat</span>
            </button>
          </div>

          {/* Chat History List */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingHistory ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 mx-auto animate-spin text-[#7D5BA6]" />
                <p className="text-sm text-gray-500 mt-3">Loading your conversations...</p>
              </div>
            ) : chats.length > 0 ? (
              <div className="space-y-3">
                {chats.map((chat) => {
                  const messageCount = countMessagePairs(chat.messages);
                  const lastMessageTime = chat.messages.length > 0 
                    ? chat.messages[chat.messages.length - 1].timestamp 
                    : '';
                  
                  return (
                    <div 
                      key={chat.id} 
                      onClick={() => handleChatSelect(chat.id)}
                      className={`p-4 bg-white rounded-lg cursor-pointer hover:bg-gray-50 border-2 transition-all ${
                        activeChat === chat.id 
                          ? 'ring-2 ring-[#7D5BA6] border-[#7D5BA6] shadow-md' 
                          : 'border-[#89CE94]'
                      }`}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <div className="w-8 h-8 bg-[#89CE94] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">C</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm truncate">{chat.title}</p>
                          <p className="text-xs text-gray-500">{chat.date}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">
                            {messageCount} {messageCount === 1 ? 'exchange' : 'exchanges'}
                          </span>
                        </div>
                        {lastMessageTime && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                            {lastMessageTime}
                          </span>
                        )}
                      </div>
                      
                      {chat.messages.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-600 truncate">
                            <span className="font-medium text-[#7D5BA6]">Q:</span> 
                            {" "}{chat.messages.find(m => m.type === 'user')?.text.substring(0, 40) || ''}
                            {chat.messages.find(m => m.type === 'user')?.text.length > 40 ? '...' : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">No conversations yet</p>
                <p className="text-xs text-gray-400 mt-1">Start by asking a question!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Chatbot Header */}
        <div className="px-8 py-4 flex-shrink-0 border-b border-gray-300 bg-white">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">ClariFi Assistant</h1>
              <p className="text-sm text-gray-600 mt-1">
                AI-powered {userInfo?.accountType === 'business' ? 'business' : 'financial'} assistant
              </p>
            </div>
            
            {userInfo && (
              <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-gray-800">{getUserDisplayName()}</p>
                  <p className="text-xs text-gray-500">{getAccountTypeDisplay()}</p>
                </div>
                <div className="w-10 h-10 bg-[#7D5BA6] rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white font-semibold text-sm">
                    {getUserInitials()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-100 border-2 border-red-300 rounded-lg flex items-center gap-2 animate-fadeIn sm:mx-8 lg:mx-auto lg:max-w-5xl">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700 flex-1">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 text-lg flex-shrink-0"
            >
              ×
            </button>
          </div>
        )}

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto px-4 py-6">
            <div className="max-w-5xl mx-auto">
              {/* Empty State */}
              {chats[activeChat]?.messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gradient-to-br from-[#7D5BA6] to-[#89CE94] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <div className="text-white text-4xl">🤖</div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    👋 Hello, {getUserDisplayName()}!
                  </h2>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    I'm your ClariFi {userInfo?.accountType === 'business' ? 'Business' : 'Financial'} Assistant.
                    How can I help you today?
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    {userInfo?.accountType === 'business' ? (
                      <>
                        <button 
                          onClick={() => setInputText("What are my business expenses this quarter?")}
                          className="p-4 bg-white border-2 border-[#89ce94] rounded-xl hover:bg-gray-50 text-left transition-all hover:shadow-md"
                        >
                          <div className="font-medium text-gray-800 mb-1">Business Expenses</div>
                          <div className="text-sm text-gray-600">Get quarterly expense breakdown</div>
                        </button>
                        <button 
                          onClick={() => setInputText("Show revenue breakdown by category")}
                          className="p-4 bg-white border-2 border-[#89ce94] rounded-xl hover:bg-gray-50 text-left transition-all hover:shadow-md"
                        >
                          <div className="font-medium text-gray-800 mb-1">Revenue Analysis</div>
                          <div className="text-sm text-gray-600">Category-wise revenue insights</div>
                        </button>
                        <button 
                          onClick={() => setInputText("How is my profit margin trending?")}
                          className="p-4 bg-white border-2 border-[#89ce94] rounded-xl hover:bg-gray-50 text-left transition-all hover:shadow-md"
                        >
                          <div className="font-medium text-gray-800 mb-1">Profit Trends</div>
                          <div className="text-sm text-gray-600">Track profit margin changes</div>
                        </button>
                        <button 
                          onClick={() => setInputText("Project cash flow for next quarter")}
                          className="p-4 bg-white border-2 border-[#89ce94] rounded-xl hover:bg-gray-50 text-left transition-all hover:shadow-md"
                        >
                          <div className="font-medium text-gray-800 mb-1">Cash Flow Projection</div>
                          <div className="text-sm text-gray-600">Future cash flow estimates</div>
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => setInputText("How much did I spend this month?")}
                          className="p-4 bg-white border-2 border-[#89ce94] rounded-xl hover:bg-gray-50 text-left transition-all hover:shadow-md"
                        >
                          <div className="font-medium text-gray-800 mb-1">Monthly Spending</div>
                          <div className="text-sm text-gray-600">Track your monthly expenses</div>
                        </button>
                        <button 
                          onClick={() => setInputText("Show my expense categories")}
                          className="p-4 bg-white border-2 border-[#89ce94] rounded-xl hover:bg-gray-50 text-left transition-all hover:shadow-md"
                        >
                          <div className="font-medium text-gray-800 mb-1">Expense Categories</div>
                          <div className="text-sm text-gray-600">See where your money goes</div>
                        </button>
                        <button 
                          onClick={() => setInputText("What are my financial goals?")}
                          className="p-4 bg-white border-2 border-[#89ce94] rounded-xl hover:bg-gray-50 text-left transition-all hover:shadow-md"
                        >
                          <div className="font-medium text-gray-800 mb-1">Financial Goals</div>
                          <div className="text-sm text-gray-600">Track savings and goals</div>
                        </button>
                        <button 
                          onClick={() => setInputText("Show my recent transactions")}
                          className="p-4 bg-white border-2 border-[#89ce94] rounded-xl hover:bg-gray-50 text-left transition-all hover:shadow-md"
                        >
                          <div className="font-medium text-gray-800 mb-1">Recent Transactions</div>
                          <div className="text-sm text-gray-600">View your latest spending</div>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              {chats[activeChat]?.messages.length > 0 && (
                <div className="space-y-8">
                  {chats[activeChat].messages.map((message, index) => (
                    <div 
                      key={index} 
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                    >
                      <div className={`max-w-2xl w-full ${message.type === 'user' ? 'pl-12' : 'pr-12'}`}>
                        {/* Message Container */}
                        <div className={`rounded-2xl p-5 ${message.type === 'user' 
                          ? 'bg-gradient-to-r from-[#86a59c] to-[#7da693] text-white ml-auto' 
                          : message.isError 
                            ? 'bg-red-50 border-2 border-red-200' 
                            : 'bg-white border-2 border-gray-200'
                        } shadow-sm`}>
                          {/* Message Header */}
                          <div className="flex items-center gap-2 mb-3">
                            {message.type === 'bot' ? (
                              <div className="w-8 h-8 bg-gradient-to-br from-[#7D5BA6] to-[#8a65b9] rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-bold">C</span>
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-gradient-to-r from-[#86a59c] to-[#94b3aa] rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                  {getUserInitials()}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-sm">
                                {message.type === 'bot' 
                                  ? 'ClariFi Assistant' 
                                  : getUserDisplayName()}
                              </p>
                              <p className="text-xs opacity-75">
                                {message.timestamp}
                              </p>
                            </div>
                          </div>
                          
                          {/* Message Content */}
                          <div className={`text-sm leading-relaxed ${
                            message.type === 'user' 
                              ? 'text-white' 
                              : message.isError 
                                ? 'text-red-700' 
                                : 'text-gray-800'
                          }`}>
                            {message.text}
                          </div>
                          
                          {/* Message Footer (for bot messages) */}
                          {message.type === 'bot' && !message.isError && message.intent && (
                            <div className="mt-4 pt-3 border-t border-gray-100">
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="font-medium">Intent:</span>
                                <span className="px-2 py-1 bg-gray-100 rounded">{message.intent}</span>
                                {message.confidence && (
                                  <span className="ml-auto">
                                    Confidence: {(message.confidence * 100).toFixed(0)}%
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Loading Indicator */}
                  {isLoading && (
                    <div className="flex justify-start animate-fadeIn">
                      <div className="max-w-2xl w-full pr-12">
                        <div className="rounded-2xl p-5 bg-white border-2 border-gray-200 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#7D5BA6] to-[#8a65b9] rounded-full flex items-center justify-center">
                              <Loader2 className="w-4 h-4 text-white animate-spin" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">ClariFi Assistant</p>
                              <p className="text-xs text-gray-500">Thinking...</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <div className="w-2 h-2 bg-[#7D5BA6] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-[#7D5BA6] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-[#7D5BA6] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="px-8 py-6 flex-shrink-0 border-t border-gray-300 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  userInfo?.accountType === 'business'
                    ? `Ask about ${userInfo.businessName || 'your business'} finances, revenue, expenses, or growth...`
                    : `Ask about your personal finances, budgets, expenses, or goals...`
                }
                disabled={isLoading}
                className="flex-1 px-6 py-4 border-2 border-[#86a59c] rounded-full focus:outline-none focus:border-[#7d5ba6] focus:ring-2 focus:ring-[#7d5ba6] focus:ring-opacity-30 text-gray-800 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !inputText.trim()}
                className="w-14 h-14 bg-gradient-to-r from-[#89ce94] to-[#7dc987] rounded-full flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Send className="w-6 h-6 text-white" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-4">
              {userInfo?.accountType === 'business'
                ? "Business financial insights are for informational purposes only. Consult with a financial advisor for specific advice."
                : "This service provides general information only. Not a substitute for professional financial advice."
              }
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-3 flex-shrink-0 bg-gray-50 border-t border-gray-200">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="text-xs text-gray-500">
              ClariFi by Team Nova • {getUserDisplayName()} • ID: {userInfo?.id || 'Not logged in'}
            </div>
            <div className="text-xs text-gray-400">
              {chats[activeChat]?.title || 'New Chat'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add CSS for animations
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
`;

// Add styles to document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default ChatBot;