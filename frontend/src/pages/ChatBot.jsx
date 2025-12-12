import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import NavBar from './NavBar';

const ChatBot = () => {
  const [activeChat, setActiveChat] = useState(0);
  const [inputText, setInputText] = useState('');

  // Initial empty chat
  const chatHistory = [
    {
      id: 0,
      title: "New Chat",
      date: new Date().toLocaleDateString(),
      messages: []
    }
  ];

  const [chats, setChats] = useState(chatHistory);

  const chatEndRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chats, activeChat]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const updatedChats = [...chats];
    updatedChats[activeChat].messages.push({ type: 'user', text: inputText });
    setChats(updatedChats);
    setInputText('');

    setTimeout(() => {
      const newChats = [...updatedChats];
      newChats[activeChat].messages.push({
        type: 'bot',
        text: 'I can help you with budgeting, savings goals, and financial planning!'
      });
      setChats(newChats);
    }, 1000);
  };

  const handleChatSelect = (chatId) => {
    setActiveChat(chatId);
  };

  // New Chat button handler
  const handleNewChat = () => {
    const newChat = {
      id: chats.length, // unique id
      title: `New Chat ${chats.length + 1}`,
      date: new Date().toLocaleDateString(),
      messages: []
    };
    setChats([...chats, newChat]);
    setActiveChat(newChat.id);
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
              className="w-full py-2 px-4 bg-[#89ce94] text-white font-semibold rounded-lg hover:bg-[#7dc987] transition-colors"
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
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Chatbot Header */}
        <div className="px-8 py-4 flex-shrink-0">
          <h5 className="text-2xl text-gray-600 font-medium">ClariFi Assistant</h5>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 px-8 py-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-6">
            {chats[activeChat].messages.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.type === 'bot' && (
                  <div className="flex flex-col items-center mr-4">
                    <div className="w-16 h-16 bg-[#7d5ba6] rounded-full flex items-center justify-center">
                      <div className="text-white text-3xl">🤖</div>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">ClariFi Assistant</span>
                  </div>
                )}
                <div className={`max-w-md p-4 rounded-2xl ${
                  message.type === 'bot' 
                    ? 'bg-white border-2 border-[#7d5ba6]' 
                    : 'bg-[#86a59c] text-white'
                }`}>
                  <p className={message.type === 'bot' ? 'text-[#333333]' : 'text-white'}>
                    {message.text}
                  </p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="px-8 py-6 flex-shrink-0">
          <div className="max-w-3xl mx-auto flex items-center space-x-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message here..."
              className="flex-1 px-6 py-3 border-2 border-[#86a59c] rounded-full focus:outline-none focus:border-[#7d5ba6] text-[#333333]"
            />
            <button
              onClick={handleSend}
              className="w-12 h-12 bg-[#89ce94] rounded-full flex items-center justify-center hover:bg-[#7dc987] transition-colors"
            >
              <Send className="w-5 h-5 text-white" />
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