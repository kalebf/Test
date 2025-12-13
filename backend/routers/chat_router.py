from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import logging
import sys
import os

from database.connection import SessionLocal
from models.user import User
from models.llmlogs import LLMLog
from routers.auth_router import verify_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])

def setup_agents_import():
    import inspect

    # Directory where chat_router.py lives
    current_dir = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
    
    # backend/
    backend_dir = os.path.dirname(current_dir)

    # project root
    project_root = os.path.dirname(backend_dir)

    # agents folder
    agents_path = os.path.join(project_root, "agents")

    print("\n=== AGENT PATH DEBUG ===")
    print("Current File:", current_dir)
    print("Backend Dir:", backend_dir)
    print("Project Root:", project_root)
    print("Agents Path:", agents_path)
    print("========================\n")

    # froce add to sys.path
    if project_root not in sys.path:
        sys.path.insert(0, project_root)

    if agents_path not in sys.path:
        sys.path.insert(0, agents_path)

    # must return absolute paths
    return agents_path, backend_dir

setup_result = setup_agents_import()
agents_path = setup_result[0] if setup_result else None
backend_path = setup_result[1] if setup_result else None


INTENT_CLASSIFIER_AVAILABLE = False
IntentClassifier = None
DataHandler = None
QueryRunner = None

if agents_path:
    try:
        logger.info("Attempting to import agents...")
        
        class MockSettings:
            LLM_MODEL = "llama3"
            DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://clarifi_db_user:Fwe1upxTMYXo1xR8PMkoDaTGr8Xe35g3@dpg-d44kca8dl3ps73bdcn90-a.oregon-postgres.render.com:5432/clarifi_db")
        
        import types
        mock_config = types.ModuleType('backend.core.config')
        mock_config.settings = MockSettings()
        sys.modules['backend.core.config'] = mock_config
        
        mock_core = types.ModuleType('backend.core')
        sys.modules['backend.core'] = mock_core
        
        mock_backend = types.ModuleType('backend')
        mock_backend.database = types.ModuleType('backend.database')
        
        from database.connection import SessionLocal
        def get_db_for_agents():
            db = SessionLocal()
            try:
                yield db
            finally:
                db.close()
        
        mock_backend.database.get_db = get_db_for_agents
        sys.modules['backend'] = mock_backend
        sys.modules['backend.database'] = mock_backend.database
        
        sys.path.insert(0, agents_path)
        
        from agents import prompt_enhancer
        logger.info("✓ Loaded prompt_enhancer")
        
        from  agents import query_runner
        logger.info("✓ Loaded query_runner")
        
        from  agents import data_handler
        logger.info("✓ Loaded data_handler")
        
        from agents import intent_classifier
        logger.info("✓ Loaded intent_classifier")
        
        IntentClassifier = intent_classifier.IntentClassifier
        DataHandler = data_handler.DataHandler
        QueryRunner = query_runner.QueryRunner
        
        INTENT_CLASSIFIER_AVAILABLE = True
        logger.info("✓ Successfully imported all agents!")
        
    except Exception as e:
        logger.error(f"✗ Failed to import agents: {e}", exc_info=True)
        IntentClassifier = None
        DataHandler = None
        QueryRunner = None

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class MessageRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class MessageResponse(BaseModel):
    response: str
    session_id: Optional[str] = None
    intent: Optional[str] = None
    status: Optional[str] = None
    confidence: Optional[float] = None

class ChatHistoryItem(BaseModel):
    id: str
    role: str  # 'user' or 'agent'
    content: str
    timestamp: str

class DeleteConfirmRequest(BaseModel):
    confirmation_id: str
    confirm: bool = True

def get_chat_processor():
    """Get or create chat processor with agents"""
    if not INTENT_CLASSIFIER_AVAILABLE or IntentClassifier is None:
        error_detail = {
            "error": "Chatbot service unavailable",
            "message": "The LLM agents could not be loaded.",
            "agents_path": str(agents_path) if agents_path else "NOT FOUND",
            "suggestion": "Check that all agent files exist and dependencies are installed"
        }
        logger.error(f"Chat processor not available: {error_detail}")
        raise HTTPException(status_code=503, detail=error_detail)
    
    try:
        classifier = IntentClassifier()
        logger.info("✓ IntentClassifier initialized")
        return classifier
    except Exception as e:
        logger.error(f"✗ Failed to initialize chat processor: {e}", exc_info=True)
        raise HTTPException(
            status_code=503,
            detail=f"Failed to initialize LLM agents: {str(e)}"
        )


def extract_agent_response(response_data: Dict[str, Any]) -> str:
    """
    Extract the final response text from agent result
    Handles different response structures from different agents
    """
    result = response_data.get('result', {})
    
    # Try different possible response fields in order of preference
    response_text = (
        result.get('answer') or          # From QueryRunner (VIEW intent)
        result.get('message') or         # From DataHandler (CREATE/UPDATE/DELETE)
        result.get('response') or        # Generic response field
        result.get('sql') or             # Fallback to SQL if no other response
        "I couldn't process that request."  # Ultimate fallback
    )
    
    return str(response_text)


@router.post("/message", response_model=MessageResponse)
def handle_chatbot_message(
    request: MessageRequest,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Main endpoint: Receives user message → Routes to agents → Returns response
    
    Flow:
    1. Get user message from frontend
    2. Pass to IntentClassifier (which routes to correct agent)
    3. Agent processes and generates response
    4. Save to llmlogs table (user_id enforced)
    5. Return response to frontend
    """
    try:
        logger.info(f"Processing message from user {user.id}: '{request.message}'")
        
        #Get IntentClassifier
        classifier = get_chat_processor()
        
        # Route to appropriate agent and get response    
        response_data = classifier.classify_intent(
            user_query=request.message,
            user_id=user.id
        
        logger.info(f"Agent response data: {response_data}")
        
        # Extract actual response text from agent result
        final_response = extract_agent_response(response_data)
        
        #Save interaction to database (llmlogs table)
        log_entry = LLMLog(
            user_id=user.id,
            session_id=request.session_id,
            prompt=request.message,
            response=final_response,
            timestamp=datetime.utcnow()
        )
        db.add(log_entry)
        db.commit()
        
        logger.info(f"Saved log entry {log_entry.id} for user {user.id}")
        
        #Return response to frontend
        return MessageResponse(
            response=final_response,
            session_id=request.session_id,
            intent=response_data.get('intent'),
            status=response_data.get('result', {}).get('status'),
            confidence=response_data.get('confidence')
        )
    
    except HTTPException as e:
        # Re-raise HTTP exceptions
        raise e
    
    except Exception as e:
        # Log error and return message
        logger.error(f"Error processing message for user {user.id}: {e}", exc_info=True)
        
        # Try to save error to logs
        try:
            error_log = LLMLog(
                user_id=user.id,
                session_id=request.session_id,
                prompt=request.message,
                response=f"Error: {str(e)}",
                timestamp=datetime.utcnow()
            )
            db.add(error_log)
            db.commit()
        except:
            pass  # If logging fails, don't crash the endpoint
        
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to process your message",
                "message": "An unexpected error occurred. Please try again."
            }
        )


@router.get("/history", response_model=List[ChatHistoryItem])
def get_chat_history(
    limit: int = 50,
    session_id: Optional[str] = None,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Get chat history for CURRENT USER ONLY
    
    Returns conversation history in format expected by frontend:
    [
        {id: "user_1", role: "user", content: "hello", timestamp: "..."},
        {id: "agent_1", role: "agent", content: "hi there", timestamp: "..."}
    ]
    
    Security: Only returns logs where user_id matches authenticated user
    """
    try:
        logger.info(f"Fetching chat history for user {user.id}")
        
        # Build query with user_id filter
        query = db.query(LLMLog).filter(LLMLog.user_id == user.id)
        
        #Filter by session_id if provided
        if session_id:
            query = query.filter(LLMLog.session_id == session_id)
        
        # Order by timestamp and limit results
        logs = query.order_by(LLMLog.timestamp.asc()).limit(limit).all()
        
        logger.info(f"Found {len(logs)} log entries for user {user.id}")
        
        # Format response for frontend
        history = []
        for log in logs:
            # User message
            history.append(ChatHistoryItem(
                id=f"user_{log.id}",
                role="user",
                content=log.prompt,
                timestamp=log.timestamp.isoformat() if log.timestamp else ""
            ))
            
            # Agent response
            history.append(ChatHistoryItem(
                id=f"agent_{log.id}",
                role="agent",
                content=log.response,
                timestamp=log.timestamp.isoformat() if log.timestamp else ""
            ))
        
        return history
    
    except Exception as e:
        logger.error(f"Failed to fetch chat history for user {user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch chat history: {str(e)}"
        )

@router.delete("/history")
def clear_chat_history(
    session_id: Optional[str] = None,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Clear chat history for CURRENT USER ONLY
    
    Security: Only deletes logs where user_id matches authenticated user
    """
    try:
        logger.info(f"Clearing chat history for user {user.id}")
        
        # Build delete query with user_id filter
        query = db.query(LLMLog).filter(LLMLog.user_id == user.id)
        
        #Only clear specific session
        if session_id:
            query = query.filter(LLMLog.session_id == session_id)
        
        # Execute delete
        deleted_count = query.delete()
        db.commit()
        
        logger.info(f"Deleted {deleted_count} chat messages for user {user.id}")
        
        return {
            "success": True,
            "message": f"Cleared {deleted_count} chat messages",
            "deleted_count": deleted_count
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to clear chat history for user {user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear chat history: {str(e)}"
        )


@router.post("/confirm-delete")
def confirm_delete_operation(
    request: DeleteConfirmRequest,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Confirm or cancel a pending delete operation
    Used when agent needs user confirmation before deleting data
    """
    try:
        logger.info(f"Processing delete confirmation for user {user.id}: {request.confirmation_id}")
        
        classifier = get_chat_processor()
        
        # Get DataHandler from classifier
        if hasattr(classifier, 'data_handler'):
            data_handler = classifier.data_handler
        else:
            if not DataHandler:
                raise HTTPException(status_code=503, detail="DataHandler not available")
            data_handler = DataHandler()
        
        # Process confirmation
        result = data_handler.confirm_delete(
            user_id=user.id,
            confirmation_id=request.confirmation_id,
            confirm=request.confirm
        )
        
        # Log the confirmation/cancellation to llmlogs
        log_entry = LLMLog(
            user_id=user.id,
            prompt=f"{'CONFIRMED' if request.confirm else 'CANCELLED'} delete: {request.confirmation_id}",
            response=result.get("message", "Delete confirmation processed"),
            timestamp=datetime.utcnow()
        )
        db.add(log_entry)
        db.commit()
        
        return {
            "success": result.get("status") in ["COMPLETE", "CANCELLED"],
            "status": result.get("status"),
            "message": result.get("message"),
            "rows_deleted": result.get("rows_deleted", 0),
            "confirmation_id": request.confirmation_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete confirmation failed for user {user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process delete confirmation: {str(e)}"
        )

@router.get("/pending-deletes")
def get_pending_deletes(
    user: User = Depends(verify_token)
):
    """
    Get list of pending delete operations for CURRENT USER ONLY
    """
    try:
        logger.info(f"Fetching pending deletes for user {user.id}")
        
        classifier = get_chat_processor()
        
        if hasattr(classifier, 'data_handler'):
            data_handler = classifier.data_handler
        else:
            if not DataHandler:
                return {
                    "status": "UNAVAILABLE",
                    "message": "DataHandler not loaded",
                    "pending_count": 0
                }
            data_handler = DataHandler()
        
        # Get pending deletes
        result = data_handler.list_pending_deletes(user_id=user.id)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch pending deletes for user {user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch pending deletes: {str(e)}"
        )

@router.get("/health")
def chatbot_health_check():
    """Check if chatbot service is running"""
    if not INTENT_CLASSIFIER_AVAILABLE:
        return {
            "status": "unhealthy",
            "agents_available": False,
            "message": "LLM agents not loaded",
            "agents_path": str(agents_path) if agents_path else "NOT FOUND"
        }
    
    try:
        processor = get_chat_processor()
        
        return {
            "status": "healthy",
            "agents_available": True,
            "message": "LLM chatbot service is running",
            "agents_path": str(agents_path) if agents_path else "NOT FOUND",
            "ollama_model": "llama3"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "agents_available": False,
            "message": f"Chatbot service error: {str(e)}",
            "agents_path": str(agents_path) if agents_path else "NOT FOUND"
        }

@router.get("/status")
def chatbot_status():
    """Check chatbot availability and configuration"""
    return {
        "status": "operational" if INTENT_CLASSIFIER_AVAILABLE else "unavailable",
        "agents_path": str(agents_path) if agents_path else "NOT FOUND",
        "intent_classifier_available": INTENT_CLASSIFIER_AVAILABLE,
        "mode": "llm_agents" if INTENT_CLASSIFIER_AVAILABLE else "unavailable",
        "message": "LLM agents are ready" if INTENT_CLASSIFIER_AVAILABLE else "LLM agents not loaded"
    }