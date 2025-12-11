# file name: intent_classifier.py (updated version)
import logging
import re
import json
from typing import Dict, Any
from langchain_ollama import OllamaLLM
from ...backend.config import settings
from agents.query_runner import QueryRunner
from agents.data_handler import DataHandler

logger = logging.getLogger(__name__)

class IntentClassifier:
    def __init__(self):
        self.llm = OllamaLLM(model=settings.LLM_MODEL)
        self.query_runner = QueryRunner()
        self.data_handler = DataHandler()
        
        # Enhanced keywords for different intents
        self.insert_keywords = [
            'add', 'insert', 'create', 'record', 'log', 'enter', 'save',
            'new', 'make', 'set', 'establish', 'input', 'register',
            'spent', 'bought', 'paid', 'cost', 'expense', 'purchase',  # Added spending-related keywords
            'earned', 'made', 'received', 'income', 'got', 'gained'   # Added income-related keywords
        ]
        
        self.update_keywords = [
            'update', 'change', 'modify', 'edit', 'alter', 'adjust',
            'revise', 'correct', 'fix', 'amend', 'set to', 'change to',
            'increase', 'decrease', 'raise', 'lower'
        ]
        
        self.delete_keywords = [
            'delete', 'remove', 'erase', 'clear', 'drop', 'cancel',
            'undo', 'eliminate', 'delete', 'erase'
        ]
        
        self.view_keywords = [
            'show', 'view', 'display', 'list', 'get', 'see', 'find',
            'what', 'how', 'where', 'when', 'who', 'which',
            'check', 'review', 'look up', 'search', 'query',
            'total', 'sum', 'calculate', 'compute', 'amount of'
        ]
        
        # Patterns that indicate spending/income (CREATE intent)
        self.spending_patterns = [
            r'(spent|paid|cost|bought)\s+\$?\d+',
            r'\$?\d+\s+(on|for)\s+\w+',
            r'(i|I)\s+(spent|paid|bought|cost)\s+\$?\d+',
            r'\$?\d+\s+(dollars|bucks)\s+(on|for)'
        ]
        
        self.income_patterns = [
            r'(earned|made|received|got)\s+\$?\d+',
            r'\$?\d+\s+(from)\s+\w+',
            r'(i|I)\s+(earned|made|received|got)\s+\$?\d+'
        ]

    def classify_intent(self, user_query: str, user_id: int) -> Dict[str, Any]:
        """
        Classify user intent and route to appropriate handler
        """
        try:
            # First, check for strong spending/income patterns that indicate CREATE
            if self._is_spending_or_income_query(user_query):
                logger.info(f"Detected spending/income pattern in query: '{user_query}'")
                # Route directly to CREATE handler
                handler_result = self.data_handler.process_natural_language_create(
                    enhanced_query=user_query,
                    original_user_query=user_query,
                    user_id=user_id
                )
                
                return {
                    "intent": "CREATE",
                    "handler": "data_handler",
                    "result": handler_result,
                    "confidence": 0.9,
                    "original_query": user_query
                }
            
            # Step 1: Use LLM for primary intent classification
            intent_result = self._llm_classify_intent(user_query)
            
            # Step 2: Use keyword matching as fallback/verification
            keyword_intent = self._keyword_classify_intent(user_query)
            
            # Step 3: Resolve conflicts and get final intent
            final_intent = self._resolve_intent_conflict(intent_result, keyword_intent)
            
            # Step 4: Route to appropriate handler
            handler_result = self._route_to_handler(user_query, user_id, final_intent)
            
            return {
                "intent": final_intent,
                "handler": "data_handler" if final_intent in ['CREATE', 'UPDATE', 'DELETE'] else "query_runner",
                "result": handler_result,
                "confidence": intent_result.get("confidence", 0.7),
                "original_query": user_query
            }
            
        except Exception as e:
            logger.error(f"Intent classification failed: {e}")
            # Default to view intent on error
            return self._fallback_response(user_query, user_id)
    
    def _is_spending_or_income_query(self, user_query: str) -> bool:
        """Check if query indicates spending or income (CREATE intent)"""
        query_lower = user_query.lower()
        
        # Check for spending patterns
        for pattern in self.spending_patterns:
            if re.search(pattern, query_lower):
                return True
        
        # Check for income patterns
        for pattern in self.income_patterns:
            if re.search(pattern, query_lower):
                return True
        
        # Check for dollar amounts with spending context
        if re.search(r'\$?\d+(\.\d{2})?\s+(on|for)', query_lower):
            return True
        
        # Check for "I spent/bought/paid" pattern
        if re.search(r'^i\s+(spent|bought|paid|cost)\s+', query_lower):
            return True
        
        return False

    def _llm_classify_intent(self, user_query: str) -> Dict[str, Any]:
        """Use LLM to classify intent with better prompt and error handling"""
        prompt = f"""
        Analyze this user query and classify its intent for a financial database system.
        
        USER QUERY: "{user_query}"
        
        INTENT CATEGORIES:
        1. VIEW - User wants to see, check, or retrieve existing information
           Examples: "how much did I spend", "show my expenses", "what is my balance"
        
        2. CREATE - User wants to add new records (expenses, income, goals, budgets)
           Examples: "I spent $60 on shoes", "add $75 dinner expense", "record $200 income"
                
        4. DELETE - User wants to remove existing records
           Examples: "delete my last transaction", "remove the expense from yesterday"
        
        IMPORTANT: Queries about spending money or receiving income are ALWAYS CREATE intent.
        Examples: "I spent $60", "paid $30 for lunch", "got $500" are CREATE.
        
        Respond in JSON format with:
        {{
            "intent": "VIEW|CREATE|UPDATE|DELETE",
            "confidence": 0.0 to 1.0,
            "reason": "Brief explanation"
        }}
        
        Return ONLY valid JSON, nothing else.
        
        Response:
        """
        
        try:
            response = self.llm.invoke(prompt).strip()
            logger.debug(f"LLM raw response: {response}")
            
            # Clean and parse JSON
            response = response.replace('json', '').replace('', '').strip()
            
            # Try to extract JSON if there's extra text
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = response[json_start:json_end]
                result = json.loads(json_str)
            else:
                # Try to parse the whole response
                result = json.loads(response)
            
            # Validate intent
            valid_intents = ['VIEW', 'CREATE', 'UPDATE', 'DELETE']
            if result.get("intent") not in valid_intents:
                # Default to VIEW but with low confidence
                return {"intent": "VIEW", "confidence": 0.3, "reason": "Invalid intent from LLM"}
            
            # Ensure confidence is float
            confidence = result.get("confidence", 0.5)
            if isinstance(confidence, str):
                try:
                    confidence = float(confidence)
                except ValueError:
                    confidence = 0.5
            
            # Cap confidence between 0 and 1
            confidence = max(0.0, min(1.0, confidence))
            
            logger.info(f"LLM classified intent: {result['intent']} (confidence: {confidence})")
            return {
                "intent": result["intent"],
                "confidence": confidence,
                "reason": result.get("reason", "")
            }
            
        except (json.JSONDecodeError, KeyError) as e:
            logger.warning(f"LLM classification JSON parse failed: {e}")
            # Return default with low confidence
            return {"intent": "VIEW", "confidence": 0.3, "reason": f"JSON parse error: {str(e)}"}
        except Exception as e:
            logger.warning(f"LLM classification failed: {e}")
            return {"intent": "VIEW", "confidence": 0.3, "reason": f"LLM error: {str(e)}"}

    def _keyword_classify_intent(self, user_query: str) -> str:
        """Classify intent using enhanced keyword matching"""
        query_lower = user_query.lower()
        
        # First, check for strong spending/income indicators
        if self._is_spending_or_income_query(user_query):
            return "CREATE"
        
        # Check for action keywords
        if any(keyword in query_lower for keyword in self.delete_keywords):
            return "DELETE"
        
        if any(keyword in query_lower for keyword in self.update_keywords):
            # But not "set up" which might be CREATE
            if 'set up' in query_lower or 'setup' in query_lower:
                return "CREATE"
            return "UPDATE"
        
        if any(keyword in query_lower for keyword in self.insert_keywords):
            # Check if it's actually a view request with "add up" or similar
            if 'add up' in query_lower or 'total' in query_lower or 'sum' in query_lower:
                return "VIEW"
            return "CREATE"
        
        if any(keyword in query_lower for keyword in self.view_keywords):
            return "VIEW"
        
        # Check for dollar amounts - these are usually CREATE
        if re.search(r'\$?\d+(\.\d{2})?', query_lower):
            # But check if it's a question about amounts
            if any(word in query_lower for word in ['how much', 'what is', 'what was']):
                return "VIEW"
            # Default to CREATE for statements with dollar amounts
            return "CREATE"
        
        # Default to VIEW for questions
        if any(query_lower.startswith(word) for word in ['what', 'how', 'where', 'when', 'who', 'which']):
            return "VIEW"
        
        # Check if it's a statement (likely CREATE) vs question (likely VIEW)
        if query_lower.endswith('?') or 'can you' in query_lower or 'could you' in query_lower:
            return "VIEW"
        
        # Statements are more likely to be CREATE
        if '.' in query_lower or query_lower.endswith('.') or len(query_lower.split()) <= 10:
            return "CREATE"
        
        return "VIEW"  # Default fallback

    def _resolve_intent_conflict(self, llm_result: Dict[str, Any], keyword_intent: str) -> str:
        """Resolve conflicts between LLM and keyword classification"""
        llm_intent = llm_result["intent"]
        llm_confidence = llm_result["confidence"]
        
        # Very low confidence LLM result - trust keyword matching
        if llm_confidence < 0.4:
            return keyword_intent
        
        # High confidence LLM result takes precedence
        if llm_confidence >= 0.8:
            return llm_intent
        
        # If intents match, use that
        if llm_intent == keyword_intent:
            return llm_intent
        
        # For medium confidence conflicts, check specific cases
        if llm_intent == "VIEW" and keyword_intent == "CREATE":
            # Special handling for spending/income queries
            # If keyword says CREATE and LLM says VIEW, check if it has dollar amounts
            if re.search(r'\$?\d+(\.\d{2})?', keyword_intent.lower()):
                return "CREATE"
        
        # Default to keyword intent for medium confidence conflicts
        return keyword_intent

    def _route_to_handler(self, user_query: str, user_id: int, intent: str) -> Dict[str, Any]:
        """Route the query to appropriate handler with improved CREATE handling"""
        
        # Enhanced query for better understanding
        enhanced_query = self._enhance_for_handler(user_query, intent)
        
        if intent == "CREATE":
            # For CREATE, check if it needs to be rephrased for the data handler
            create_query = self._prepare_create_query(user_query)
            return self.data_handler.process_natural_language_create(
                enhanced_query=enhanced_query,
                original_user_query=create_query,  # Use prepared query
                user_id=user_id
            )
        
        elif intent == "UPDATE":
            return self.data_handler.process_natural_language_update(
                enhanced_query=enhanced_query,
                original_user_query=user_query,
                user_id=user_id
            )
        
        elif intent == "DELETE":
            return self._handle_delete_intent(user_query, user_id)
        
        else:  # VIEW or any other - default to query runner
            answer, sql = self.query_runner.process_natural_language_query(
                user_query=user_query,
                user_id=user_id
            )
            
            return {
                "status": "COMPLETE",
                "answer": answer,
                "sql": sql,
                "message": "Query executed successfully"
            }
    
    def _prepare_create_query(self, user_query: str) -> str:
        """Prepare CREATE queries to ensure they work with data handler"""
        query_lower = user_query.lower()
        
        # Check if query already has create keywords
        if any(word in query_lower for word in ['add', 'log', 'record', 'enter', 'save']):
            return user_query
        
        # Check what type of CREATE it is
        if any(word in query_lower for word in ['spent', 'paid', 'bought', 'cost']):
            return f"log {user_query}"
        elif any(word in query_lower for word in ['earned', 'made', 'received', 'got', 'income']):
            return f"record {user_query}"
        else:
            # Default to "add"
            return f"add {user_query}"
    
    def _enhance_for_handler(self, user_query: str, intent: str) -> str:
        """Enhance the query for specific handler processing"""
        if intent == "CREATE":
            # Ensure CREATE queries include action word if missing
            query_lower = user_query.lower()
            if not any(word in query_lower for word in ['add', 'log', 'record', 'create']):
                return f"log {user_query}"
        
        elif intent == "UPDATE":
            # Ensure UPDATE queries include change context
            query_lower = user_query.lower()
            if not any(word in query_lower for word in ['change', 'update', 'modify']):
                return f"change {user_query}"
        
        return user_query

    def _handle_delete_intent(self, user_query: str, user_id: int) -> Dict[str, Any]:
        """Handle DELETE intent"""
        try:
            return self.data_handler.process_natural_language_delete(
                enhanced_query=user_query,
                original_user_query=user_query,
                user_id=user_id
            )
        except AttributeError:
            # DataHandler might not have delete method yet
            logger.warning(f"DELETE intent not yet implemented: {user_query}")
            return {
                "status": "ERROR",
                "sql": None,
                "message": "Delete functionality is not yet implemented. Please use the web interface for deletion."
            }

    def _fallback_response(self, user_query: str, user_id: int) -> Dict[str, Any]:
        """Provide fallback response when classification fails"""
        try:
            # Check if it looks like a CREATE query first
            if self._is_spending_or_income_query(user_query):
                create_query = self._prepare_create_query(user_query)
                result = self.data_handler.process_natural_language_create(
                    enhanced_query=user_query,
                    original_user_query=create_query,
                    user_id=user_id
                )
                
                return {
                    "intent": "CREATE",
                    "handler": "data_handler",
                    "result": result,
                    "confidence": 0.7,
                    "original_query": user_query
                }
            
            # Otherwise try as VIEW intent
            answer, sql = self.query_runner.process_natural_language_query(
                user_query=user_query,
                user_id=user_id
            )
            
            return {
                "intent": "VIEW",
                "handler": "query_runner",
                "result": {
                    "status": "COMPLETE",
                    "answer": answer,
                    "sql": sql,
                    "message": "Query executed successfully"
                },
                "confidence": 0.5,
                "original_query": user_query
            }
            
        except Exception as e:
            logger.error(f"Fallback also failed: {e}")
            
            return {
                "intent": "UNKNOWN",
                "handler": "none",
                "result": {
                    "status": "ERROR",
                    "answer": None,
                    "sql": None,
                    "message": "I couldn't process your request. Please try rephrasing."
                },
                "confidence": 0.0,
                "original_query": user_query
            }

    def classify_and_respond(self, user_query: str, user_id: int) -> str:
        """
        Simplified method for direct response generation
        """
        classification = self.classify_intent(user_query, user_id)
        result = classification["result"]
        
        if classification["intent"] in ['CREATE', 'UPDATE']:
            if result["status"] == "COMPLETE":
                return f"Success: {result['message']}"
            elif result["status"] == "CONFIRM_REQUIRED":
                return f"Confirmation required: {result['message']}"
            else:
                return f"Error: {result['message']}"
        
        elif classification["intent"] == "VIEW":
            if result["status"] == "COMPLETE":
                return result["answer"]
            else:
                return f"Error: {result.get('message', 'Unknown error')}"
        
        elif classification["intent"] == "DELETE":
            return result["message"]
        
        else:
            return "I'm not sure how to handle that request. Please try rephrasing."


# Helper function for easy integration
def get_intent_classifier() -> IntentClassifier:
    """Get a singleton instance of IntentClassifier"""
    return IntentClassifier()