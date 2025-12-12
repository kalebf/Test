import os
import sys

# Add the parent directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
# Add this after your existing sys.path.insert line

from agents.query_runner import QueryRunner
from backend.database.connection import SessionLocal # Using SessionLocal from your original test code
from sqlalchemy import text

def test_querry_runner():
    # Test 1: Database connection (leave as is)
    print("\n1. Testing database connection...")
    try:
        db = SessionLocal()
        # Use text() to wrap the raw SQL for clarity with SQLAlchemy 2.0 practices
        result = db.execute(text("SELECT COUNT(*) FROM users"))
        row = result.fetchone()
        count = row[0] if row is not None else 0  # Safely handle None
        print(f"Database connected, found {count} users")
        db.close()
    except Exception as e:
        print(f"Database test failed: {e}")
        return
        
    # Test 2: Natural language query processing loop (leave header as is)
    print("\n=== Query Runner Test ===")
    print("This test will process natural language queries and return SQL results.")
    print("The system will automatically enhance your queries using the database schema.")
    print("Type 'quit' or 'exit' to end the test.\n")
    
    # Initialize the query runner (leave as is)
    try:
        query_runner = QueryRunner()
        print("QueryRunner initialized successfully!")
    except Exception as e:
        print(f"Failed to initialize QueryRunner: {e}")
        return
    
    # Get user_id for testing - FIXED VERSION
    print("\n--- User Authentication ---")
    try:
        db = SessionLocal()
        # Show available users to help with testing - CORRECTED JOIN
        users_result = db.execute(text("""
            SELECT u.id, u.email, p.display_name, r.role_name
            FROM users u 
            LEFT JOIN profiles p ON u.id = p.user_id 
            LEFT JOIN roles r ON u.role_id = r.id
            LIMIT 10
        """))
        available_users = users_result.fetchall()
        db.close()
        
        if available_users:
            print("Available users in database:")
            for user in available_users:
                user_id, email, display_name, role_name = user
                display_name = display_name or "No display name"
                print(f"  ID: {user_id}, Email: {email}, Name: {display_name}, Role: {role_name}")
        else:
            print("No users found in database.")
    except Exception as e:
        print(f"Could not fetch user list: {e}")
    
    user_id = None
    while True:
        user_id_input = input("\nEnter your user ID (or 'quit' to exit): ").strip()
        
        if user_id_input.lower() in ['quit', 'exit', 'q']:
            print("Goodbye!")
            break
        
        if not user_id_input:
            print("Please enter a user ID.")
            continue
        
        try:
            user_id = int(user_id_input)
            
            # Verify the user exists - CORRECTED QUERY
            db = SessionLocal()
            user_check = db.execute(text("""
                SELECT u.id, r.role_name 
                FROM users u 
                JOIN roles r ON u.role_id = r.id 
                WHERE u.id = :user_id
            """), {"user_id": user_id})
            user_exists = user_check.fetchone()
            db.close()
            
            if not user_exists:
                print(f"Error: User ID {user_id} not found in database.")
                continue
            
            user_id_found, role_name = user_exists
            print(f"User found: ID {user_id_found}, Role: {role_name}")
            
            # Check if user has LLM access
            if role_name == "business_subuser":
                print("Warning: Business subusers do not have LLM access. You may receive access denied messages.")
                
            break  # Valid user ID found, exit the user ID loop
            
        except ValueError:
            print("Please enter a valid numeric user ID.")
    
    if user_id_input.lower() in ['quit', 'exit', 'q']:
        return
    
    print(f"\nUsing user ID: {user_id}")
    print("You can now enter natural language queries. Type 'back' to change user, or 'quit' to exit.")

    
    while True:
        # Get user input (leave as is)
        user_input = input("\nEnter your natural language query: ").strip()
        
        # Check for exit conditions (leave as is)
        if user_input.lower() in ['quit', 'exit', 'q']:
            print("Goodbye!")
            break
        
        # Add 'back' option to change user
        if user_input.lower() in ['back', 'change user', 'switch user']:
            print("Returning to user selection...")
            break
        
        if not user_input:
            print("Please enter a query.")
            continue
        
        # Process the query - FIXED: using the actual user_id variable
        print(f"\nProcessing: '{user_input}'")
        print("-" * 50)
        
        try:
            # Capture both the result string and the generated SQL string
            result_string, sql_query = query_runner.process_natural_language_query(user_input, user_id=user_id) # type: ignore
            
            # # Print the generated SQL query first
            # print("--- Generated SQL Query ---")
            # print(sql_query if sql_query else "No SQL query was generated due to an error.")
            # print("---------------------------\n")

            # # Then print the final result string
            # print("--- Query Result ---")
            print(result_string)
            
        except Exception as e:
            print(f"An unexpected error occurred during processing: {e}")
        
        print("-" * 50)
        
        # If user entered 'back', break the inner loop to go back to user selection
        if user_input.lower() in ['back', 'change user', 'switch user']:
            break


if __name__ == "__main__":
    test_querry_runner()