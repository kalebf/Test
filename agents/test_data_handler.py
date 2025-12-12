import os
import sys

# Add the backend directory to Python path (it's a sibling directory to clarifi_agent)
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))
sys.path.insert(0, backend_path)

from data_handler import DataHandler
from backend.database.connection import SessionLocal
from sqlalchemy import text

def test_data_handler():
    print("\n=== Data Handler Test ===")
    print("This test will process natural language data modification requests.")
    print("The system will generate SQL for INSERT, UPDATE, and DELETE operations.")
    print("Type 'quit' or 'exit' to end the test.\n")
    
    try:
        data_handler = DataHandler()
        print("DataHandler initialized successfully!")
    except Exception as e:
        print(f"Failed to initialize: {e}")
        return
    
    # Check which methods are available
    has_delete_methods = hasattr(data_handler, 'process_natural_language_delete')
    has_confirm_method = hasattr(data_handler, 'confirm_delete')
    has_pending_methods = hasattr(data_handler, 'list_pending_deletes')
    
    print(f"Available methods: CREATE DELETE {'✓' if has_delete_methods else '✗'}")
    
    # Get user_id for testing
    print("\n--- User Selection ---")
    user_id = None
    while True:
        user_id_input = input("Enter user ID for testing (or 'quit' to exit): ").strip()
        
        if user_id_input.lower() in ['quit', 'exit', 'q']:
            print("Goodbye!")
            return
        
        if not user_id_input:
            print("Please enter a user ID.")
            continue
        
        try:
            user_id = int(user_id_input)
            print(f"Using user ID: {user_id}")
            
            # Show current transactions for this user
            db = SessionLocal()
            try:
                result = db.execute(text("""
                    SELECT COUNT(*) as count, MAX(id) as max_id 
                    FROM transactions 
                    WHERE user_id = :user_id
                """), {"user_id": user_id})
                row = result.fetchone()
                if row is not None:
                    count, max_id = row
                    print(f"User {user_id} has {count} transactions (max ID: {max_id or 'none'})")
                else:
                    print(f"User {user_id} has 0 transactions (max ID: none)")
            finally:
                db.close()
            
            break
            
        except ValueError:
            print("Please enter a valid numeric user ID.")
    
    print(f"\nYou can now test data modification requests for user {user_id}.")
    print("Examples:")
    print("  - 'Add a $50 expense for groceries'")
    print("  - 'Record $200 income from freelance work'") 
    print("  - 'Log a $75 dinner expense'")
    print("  - 'I got $500 for my birthday'")
    print("  - 'I spent $120 on utilities'")
    print("  - 'I spent $45 on transportation'")
    
    if has_delete_methods:
        print("  - 'Delete my last transaction'")
        print("  - 'Remove the dinner expense from yesterday'")    
    print("\nType 'back' to change user, or 'quit' to exit.")
    
    # Ask user if they want to test CREATE, UPDATE, or DELETE
    print("\n--- Operation Type ---")
    print("Do you want to test (INSERT) or (DELETE) operations?")
    menu_options = ["1. CREATE - Add new records (default), 2. DELETE - Remove existing records"]
    
    if has_delete_methods:
        menu_options.append("2. DELETE - Remove existing records")
        if has_pending_methods:
            menu_options.append("3. PENDING - Show pending delete operations")
            menu_options.append("4. CANCEL - Cancel all pending deletes")

    for option in menu_options:
        print(option)
    
    op_type = input(f"Enter choice (1-{len(menu_options)}): ").strip()
    test_create = (op_type == "" or op_type == "1")
    test_delete = has_delete_methods and (op_type == "2")
    show_pending = has_pending_methods and (op_type == "3")
    cancel_pending = has_pending_methods and (op_type == "4")
    
    # Handle pending operations menu choices first
    if show_pending and has_pending_methods:
        print("\n--- Pending Delete Operations ---")
        result = data_handler.list_pending_deletes(user_id)
        
        status = result.get("status")
        message = result.get("message")
        pending_count = result.get("pending_count", 0)
        
        print(f"\nStatus: {status}")
        print(f"Message: {message}")
        
        if status == "HAS_PENDING":
            pending_ops = result.get("pending_operations", [])
            for op in pending_ops:
                print(f"\nConfirmation ID: {op['confirmation_id']}")
                print(f"Original Query: {op['original_query']}")
                print(f"Records to delete: {op['preview_message']}")
                print(f"Created: {op['created_at']}")
        
        # Return to main menu
        print("\nReturning to operation type selection...")
        op_type = input(f"\nEnter choice (1-{len(menu_options)}): ").strip()
        test_create = (op_type == "" or op_type == "1")
        test_update = (op_type == "2")
        test_delete = has_delete_methods and (op_type == "3")
        show_pending = has_pending_methods and (op_type == "4")
        cancel_pending = has_pending_methods and (op_type == "5")
    
    if cancel_pending and has_pending_methods:
        print("\n--- Cancel All Pending Deletes ---")
        result = data_handler.cancel_all_pending_deletes(user_id)
        
        status = result.get("status")
        message = result.get("message")
        cancelled_count = result.get("cancelled_count", 0)
        
        print(f"\nStatus: {status}")
        print(f"Message: {message}")
        
        # Return to main menu
        print("\nReturning to operation type selection...")
        op_type = input(f"\nEnter choice (1-{len(menu_options)}): ").strip()
        test_create = (op_type == "" or op_type == "1")
        test_update = (op_type == "2")
        test_delete = has_delete_methods and (op_type == "3")
        show_pending = has_pending_methods and (op_type == "4")
        cancel_pending = has_pending_methods and (op_type == "5")

    while True:
        # Get user input
        user_input = input("\nEnter request: ").strip()
        
        if user_input.lower() in ['quit', 'exit', 'q']:
            print("Goodbye!")
            break
        
        if user_input.lower() in ['back', 'change user', 'switch user']:
            print("Returning to user selection...")
            user_id = None
            while True:
                user_id_input = input("\nEnter new user ID (or 'quit'): ").strip()
                
                if user_id_input.lower() in ['quit', 'exit', 'q']:
                    print("Goodbye!")
                    return
                
                if not user_id_input:
                    print("Please enter a user ID.")
                    continue
                
                try:
                    user_id = int(user_id_input)
                    print(f"Now using user ID: {user_id}")
                    break
                except ValueError:
                    print("Please enter a valid numeric user ID.")
            
            # Ask operation type again for new user
            print("\n--- Operation Type ---")
            for option in menu_options:
                print(option)
            
            op_type = input(f"Enter choice (1-{len(menu_options)}): ").strip()
            test_create = (op_type == "" or op_type == "1")
            test_update = (op_type == "2")
            test_delete = has_delete_methods and (op_type == "3")
            show_pending = has_pending_methods and (op_type == "4")
            cancel_pending = has_pending_methods and (op_type == "5")
            continue
        
        # Check if this is a confirmation for a pending delete
        is_confirmation = False
        confirmation_id = None
        confirm_action = None
        
        if has_confirm_method:
            if user_input.lower().startswith('confirm '):
                confirmation_id = user_input[8:].strip()
                confirm_action = True
                is_confirmation = True
            elif user_input.lower().startswith('cancel '):
                confirmation_id = user_input[7:].strip()
                confirm_action = False
                is_confirmation = True
            elif user_input.lower() in ['yes', 'y']:
                # Get the last pending delete confirmation ID if available
                try:
                    if hasattr(data_handler, 'pending_deletes') and user_id in data_handler.pending_deletes and data_handler.pending_deletes[user_id]:
                        confirmation_id = list(data_handler.pending_deletes[user_id].keys())[-1]
                        confirm_action = True
                        is_confirmation = True
                        print(f"Using last pending delete confirmation ID: {confirmation_id}")
                except:
                    pass
            elif user_input.lower() in ['no', 'n']:
                # Get the last pending delete confirmation ID if available
                try:
                    if hasattr(data_handler, 'pending_deletes') and user_id in data_handler.pending_deletes and data_handler.pending_deletes[user_id]:
                        confirmation_id = list(data_handler.pending_deletes[user_id].keys())[-1]
                        confirm_action = False
                        is_confirmation = True
                        print(f"Using last pending delete confirmation ID: {confirmation_id}")
                except:
                    pass
        
        if is_confirmation and has_confirm_method:
            print(f"\nProcessing confirmation for ID: {confirmation_id}")
            print(f"Action: {'CONFIRM' if confirm_action else 'CANCEL'}")
            print("-" * 60)
            
            if confirmation_id is None or not isinstance(confirmation_id, str):
                print("Error: confirmation_id must be a non-empty string.")
                print("-" * 60)
                continue

            result = data_handler.confirm_delete(
                user_id=user_id,
                confirmation_id=confirmation_id,
                confirm=bool(confirm_action),
                session_id="test_session"
            )
            
            status = result.get("status")
            message = result.get("message")
            sql = result.get("sql")
            rows_deleted = result.get("rows_deleted", 0)
            
            print(f"\nStatus: {status}")
            print(f"Message: {message}")
            
            if sql:
                print(f"\nSQL Executed:")
                print(sql)
            
            if rows_deleted > 0:
                print(f"Rows deleted: {rows_deleted}")
            
            print("-" * 60)
            continue
        elif is_confirmation and not has_confirm_method:
            print("DELETE confirmation not available. Please update data_handler.py first.")
            print("-" * 60)
            continue
        
        if not user_input:
            print("Please enter a request.")
            continue
        
        # Process the request
        print(f"\nProcessing: '{user_input}'")
        print("-" * 60)
        
        try:
            if test_delete and has_delete_methods:
                print("Processing as DELETE request...")
                result = data_handler.process_natural_language_delete(user_input, user_input, user_id, "test_session")
            elif test_delete and not has_delete_methods:
                print("DELETE functionality not available. Please update data_handler.py first.")
                print("-" * 60)
                continue
            else:
                print("Processing as CREATE request...")
                result = data_handler.process_natural_language_create(user_input, user_input, user_id)
            
            # Handle the result
            status = result.get("status")
            sql = result.get("sql")
            message = result.get("message")
            natural_response = result.get("natural_response")  # Get the natural response
            
            print(f"\nStatus: {status}")
            
            # Show the natural language response
            if natural_response:
                print(f"\nNatural Language Response:")
                print(f"  {natural_response}")
            
            if sql:
                print(f"\nGenerated SQL:")
                print(sql)
            
            if message:
                print(f"\nTechnical Message: {message}")
            
            # Handle DELETE confirmation required
            if status == "CONFIRM_REQUIRED":
                confirmation_id = result.get("confirmation_id")
                preview = result.get("preview", {})
                
                print(f"\nCONFIRMATION REQUIRED:")
                print(f"Confirmation ID: {confirmation_id}")
                print(f"Preview: {preview.get('message', 'No preview available')}")
                
                if preview.get('sample_records'):
                    print(f"\nSample records to be deleted:")
                    for record in preview.get('sample_records', [])[:3]:  # Show first 3
                        print(f"  • ID: {record.get('id')}, Amount: {record.get('amount')}, Created: {record.get('created_at')}")
                
                print(f"\nTo confirm, type: 'confirm {confirmation_id}' or 'yes'")
                print(f"To cancel, type: 'cancel {confirmation_id}' or 'no'")
            
            elif status == "COMPLETE" and sql and test_create:
                # Only show execution details for CREATE operations
                print(f"\nThis will:")
                print(f"   • Add a record for user {user_id}")
                
                # Extract amount from SQL for display
                import re
                amount_match = re.search(r'VALUES\s*\([^,]+,\s*[^,]+,\s*([^)]+)', sql)
                if amount_match:
                    amount = float(amount_match.group(1))
                    if amount < 0:
                        print(f"   • Record expense: ${abs(amount):.2f}")
                    else:
                        print(f"   • Record income: ${amount:.2f}")
                
                # Ask for confirmation
                confirm = input("\nExecute this SQL? (yes/no): ").strip().lower()
                if confirm in ['yes', 'y']:
                    try:
                        # Check current max ID before execution
                        db = SessionLocal()
                        before_result = db.execute(text("SELECT MAX(id) FROM transactions"))
                        before_row = before_result.fetchone()
                        before_max = before_row[0] if before_row is not None else 0
                        db.close()
                        
                        print(f"\nCurrent max transaction ID: {before_max}")
                        print("Executing query...")
                        
                        # FIX: Check if sql is not None before executing
                        if sql:
                            execution_result = data_handler.query_runner.execute_query(sql)
                            
                            print(f"Query executed successfully!")
                            print(f"Rows affected: {execution_result.get('rowcount', 'unknown')}")
                            
                            # Show what was added
                            db = SessionLocal()
                            try:
                                result = db.execute(text("""
                                    SELECT t.id, t.amount, c.name as category
                                    FROM transactions t
                                    LEFT JOIN categories c ON t.category_id = c.id
                                    WHERE t.user_id = :user_id 
                                    ORDER BY t.created_at DESC 
                                    LIMIT 1
                                """), {"user_id": user_id})
                                latest = result.fetchone()
                                
                                if latest:
                                    trans_id, amount, category = latest
                                    category = category or "Unknown"
                                    print(f"\nNew transaction added:")
                                    print(f"   ID: {trans_id}")
                                    print(f"   Amount: ${amount:+.2f}")
                                    print(f"   Category: {category}")
                                    print(f"   User: {user_id}")
                            finally:
                                db.close()
                            
                            print(f"\nInteraction logged to llmlogs with natural response.")
                        else:
                            print("No SQL to execute!")
                        
                    except Exception as e:
                        print(f"Query execution failed: {e}")
                        
                        # If it's a sequence error, suggest fix
                        if "duplicate key" in str(e) and "transactions_pkey" in str(e):
                            print("\nSequence issue detected!")
                            print("Run this SQL to fix: SELECT setval(pg_get_serial_sequence('transactions', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM transactions;")
                else:
                    print("Query execution cancelled.")
            
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            import traceback
            traceback.print_exc()
        
        print("-" * 60)

if __name__ == "__main__":
    test_data_handler()