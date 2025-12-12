# file name: test_chatbot.py (updated without emojis)
import os
import sys
import time

# Add the parent directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from agents.intent_classifier import IntentClassifier
from backend.database.connection import SessionLocal
from sqlalchemy import text

def test_chatbot():
    """Simple chatbot test focusing on intent classification"""
    print("\n" + "="*60)
    print("           FINANCIAL CHATBOT TEST")
    print("="*60)
    print("Testing intent classification for natural language queries.")
    print("Type 'quit' to exit.")
    print("="*60 + "\n")
    
    try:
        classifier = IntentClassifier()
        print("IntentClassifier initialized successfully!")
    except Exception as e:
        print(f"Failed to initialize: {e}")
        return
    
    # Get user_id for testing
    user_id = None
    try:
        db = SessionLocal()
        # Get first available user
        user_result = db.execute(text("""
            SELECT u.id, u.email, r.role_name
            FROM users u 
            JOIN roles r ON u.role_id = r.id
            LIMIT 1
        """)).fetchone()
        db.close()
        
        if user_result:
            user_id, email, role_name = user_result
            print(f"Using user ID: {user_id} ({email}, Role: {role_name})")
        else:
            print("No users found in database. Please enter a user ID:")
            while True:
                try:
                    user_input = input("User ID: ").strip()
                    if user_input.lower() in ['quit', 'exit', 'q']:
                        return
                    user_id = int(user_input)
                    break
                except ValueError:
                    print("Please enter a valid numeric user ID.")
    except Exception as e:
        print(f"Could not fetch user: {e}")
        user_id = 1  # Default fallback
        print(f"Using default user ID: {user_id}")
    
    print("\nYou can now enter natural language queries.")
    print("Examples:")
    print("  - 'I spent $60 on shoes' (should be CREATE)")
    print("  - 'how much did I spend this month?' (should be VIEW)")
    print("  - 'delete my last transaction' (should be DELETE)")
    print("  - 'change my budget to $600' (should be UPDATE)")
    print()
    
    while True:
        try:
            # Get user input
            prompt = input(f"Query: ").strip()
            
            if prompt.lower() in ['quit', 'exit', 'q']:
                print("\nGoodbye!")
                break
            
            if not prompt:
                continue
            
            print(f"\nProcessing: '{prompt}'")
            print("-" * 60)
            
            # Classify intent
            classification = classifier.classify_intent(prompt, user_id)
            
            print(f"Intent: {classification['intent']} (confidence: {classification['confidence']:.2f})")
            print(f"Handler: {classification['handler']}")
            
            result = classification["result"]
            
            if classification["intent"] in ['CREATE', 'UPDATE', 'DELETE']:
                status = result.get("status")
                
                if status == "COMPLETE":
                    print(f"Result: {result.get('message', 'Operation completed')}")
                elif status == "CONFIRM_REQUIRED":
                    print(f"Confirmation Required: {result.get('message', '')}")
                elif status == "ERROR":
                    print(f"Error: {result.get('message', 'Unknown error')}")
                else:
                    print(f"Response: {result}")
            
            elif classification["intent"] == "VIEW":
                if result["status"] == "COMPLETE":
                    print(f"Answer: {result.get('answer', 'No answer generated')}")
                else:
                    print(f"Error: {result.get('message', 'Unknown error')}")
            
            else:
                print(f"Unknown intent. Result: {result}")
            
            print("-" * 60)
            print()
            
        except KeyboardInterrupt:
            print("\n\nInterrupted by user.")
            break
        except Exception as e:
            print(f"\nAn error occurred: {e}")

if __name__ == "__main__":
    test_chatbot()