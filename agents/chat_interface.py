'''
chat_interface.py
'''
import logging
from typing import Dict, Any, Optional
from agents.intent_classifier import IntentClassifier
from datetime import datetime

logger = logging.getLogger(__name__)

class ChatInterface:
    def __init__(self):
        self.classifier = IntentClassifier()
        self.conversation_history = {}  # Optional: store per-user chat history
    
    def process_message(self, user_id: int, message: str, session_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Main entry point for chatbot
        
        Args:
            user_id: Unique user identifier
            message: User's natural language message
            session_id: Optional session identifier for conversation context
            
        Returns:
            Dict with response and metadata
        """
        try:
            # Classify intent and get response
            classification = self.classifier.classify_intent(
                user_query=message,
                user_id=user_id
            )
            
            # Extract the actual response text
            if classification["intent"] in ['CREATE', 'UPDATE', 'DELETE']:
                response_text = classification["result"]["message"]
            elif classification["intent"] == 'VIEW':
                response_text = classification["result"]["answer"]
            else:
                response_text = "I'm not sure how to handle that. Could you rephrase?"
            
            # Optional: Store in conversation history
            if session_id:
                self._update_history(user_id, session_id, message, response_text)
            
            # Return structured response
            return {
                "success": True,
                "response": response_text,
                "intent": classification["intent"],
                "confidence": classification.get("confidence", 0.5),
                "metadata": {
                    "handler_used": classification.get("handler"),
                    "sql_generated": classification["result"].get("sql") if classification["result"] else None,
                    "original_query": message
                }
            }
            
        except Exception as e:
            logger.error(f"Chat processing failed: {e}")
            return {
                "success": False,
                "response": "I encountered an error processing your request. Please try again.",
                "error": str(e)
            }
    
    def _update_history(self, user_id: int, session_id: str, user_message: str, bot_response: str):
        """Optional: Maintain conversation history"""
        key = f"{user_id}_{session_id}"
        if key not in self.conversation_history:
            self.conversation_history[key] = []
        
        self.conversation_history[key].append({
            "role": "user",
            "content": user_message,
            "timestamp": datetime.now().isoformat()
        })
        self.conversation_history[key].append({
            "role": "assistant", 
            "content": bot_response,
            "timestamp": datetime.now().isoformat()
        })
        
        # Keep only last N messages to manage memory
        if len(self.conversation_history[key]) > 20:
            self.conversation_history[key] = self.conversation_history[key][-20:]