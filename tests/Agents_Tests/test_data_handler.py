#test_data_handler.py
import os
import sys
import time
from datetime import datetime, timedelta

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))
sys.path.insert(0, backend_path)

from agents.data_handler import DataHandler
from core.database import SessionLocal
from sqlalchemy import text

def test_data_handler_initialization():
    """Test DataHandler initialization and basic functionality"""
    print("\n" + "="*60)
    print("DATA HANDLER INITIALIZATION TEST")
    print("="*60)
    
    try:
        handler = DataHandler()
        print("DataHandler initialized successfully")
        
        # Check required attributes
        required_attrs = ['llm', 'query_runner', 'pending_deletes']
        for attr in required_attrs:
            if hasattr(handler, attr):
                print(f"Attribute '{attr}' found")
            else:
                print(f"Missing attribute '{attr}'")
                return False
        
        # Check method availability
        required_methods = [
            'process_natural_language_create',
            'process_natural_language_update',
            'process_natural_language_delete',
            'confirm_delete',
            'log_interaction'
        ]
        
        for method in required_methods:
            if hasattr(handler, method) and callable(getattr(handler, method)):
                print(f"Method '{method}' available")
            else:
                print(f"Missing method '{method}'")
        
        return True
        
    except Exception as e:
        print(f"Initialization failed: {e}")
        return False

def test_create_operations():
    """Test CREATE (INSERT) operations"""
    print("\n" + "="*60)
    print("CREATE OPERATIONS TEST")
    print("="*60)
    
    try:
        handler = DataHandler()
        
        # Get test user
        db = SessionLocal()
        user_result = db.execute(text("SELECT id FROM users LIMIT 1")).fetchone()
        db.close()
        
        if not user_result:
            print("No users found")
            return False
        
        user_id = user_result[0]
        print(f"Using user ID: {user_id}")
        
        # Test CREATE queries
        test_queries = [
            ("I spent $50 on groceries", "Expense with category inference"),
            ("add $75 dinner expense", "Explicit expense addition"),
            ("record $200 income from freelance", "Income recording"),
            ("log $30 transportation cost", "Transportation expense"),
        ]
        
        results = []
        for query, description in test_queries:
            print(f"\n{description}")
            print(f"Query: '{query}'")
            
            try:
                start_time = time.time()
                result = handler.process_natural_language_create(query, query, user_id)
                elapsed = time.time() - start_time
                
                status = result.get("status")
                sql = result.get("sql")
                message = result.get("message")
                
                print(f"Status: {status}")
                print(f"SQL: {sql}")
                print(f"Message: {message}")
                print(f"Time: {elapsed:.2f}s")
                
                if status == "COMPLETE" and sql and "INSERT" in sql.upper():
                    results.append(True)
                    print("CREATE operation successful")
                else:
                    results.append(False)
                    print("CREATE operation failed")
                    
            except Exception as e:
                print(f"Error: {e}")
                results.append(False)
            
            print("-" * 50)
        
        success_rate = sum(results) / len(results) * 100
        print(f"\nCREATE Success Rate: {success_rate:.1f}% ({sum(results)}/{len(results)})")
        
        return success_rate > 50
        
    except Exception as e:
        print(f"CREATE operations test failed: {e}")
        return False

def test_delete_operations():
    """Test DELETE operations with confirmation"""
    print("\n" + "="*60)
    print("DELETE OPERATIONS TEST")
    print("="*60)
    
    try:
        handler = DataHandler()
        
        # Get test user with existing transactions
        db = SessionLocal()
        user_result = db.execute(text("""
            SELECT u.id, COUNT(t.id) as transaction_count
            FROM users u 
            LEFT JOIN transactions t ON u.id = t.user_id
            GROUP BY u.id
            HAVING COUNT(t.id) > 0
            LIMIT 1
        """)).fetchone()
        db.close()
        
        if not user_result:
            print("No users with transactions found")
            return False
        
        user_id, transaction_count = user_result
        print(f"Using user ID: {user_id} (has {transaction_count} transactions)")
        
        # Test DELETE queries
        test_queries = [
            ("delete my last transaction", "Delete most recent transaction"),
            ("remove the dinner expense", "Delete by category"),
            ("delete transaction with highest amount", "Delete by amount"),
        ]
        
        results = []
        for query, description in test_queries:
            print(f"\n{description}")
            print(f"Query: '{query}'")
            
            try:
                start_time = time.time()
                result = handler.process_natural_language_delete(query, query, user_id, "test_session")
                elapsed = time.time() - start_time
                
                status = result.get("status")
                confirmation_id = result.get("confirmation_id")
                preview = result.get("preview", {})
                
                print(f"Status: {status}")
                print(f"Confirmation ID: {confirmation_id}")
                print(f"Preview: {preview.get('message', 'No preview')}")
                print(f"Time: {elapsed:.2f}s")
                
                if status == "CONFIRM_REQUIRED" and confirmation_id:
                    results.append(True)
                    print("✓ DELETE preview generated (confirmation required)")
                    
                    # Test confirmation
                    print(f"\nTesting confirmation for ID: {confirmation_id}")
                    confirm_result = handler.confirm_delete(user_id, confirmation_id, True, "test_session")
                    print(f"Confirm result: {confirm_result.get('status')}")
                    print(f"Message: {confirm_result.get('message')}")
                    
                else:
                    results.append(False)
                    print("DELETE operation failed")
                    
            except Exception as e:
                print(f"Error: {e}")
                results.append(False)
            
            print("-" * 50)
        
        success_rate = sum(results) / len(results) * 100
        print(f"\nDELETE Success Rate: {success_rate:.1f}% ({sum(results)}/{len(results)})")
        
        return success_rate > 50
        
    except Exception as e:
        print(f"DELETE operations test failed: {e}")
        return False

def test_pending_deletes_management():
    """Test pending delete operations management"""
    print("\n" + "="*60)
    print("PENDING DELETES MANAGEMENT TEST")
    print("="*60)
    
    try:
        handler = DataHandler()
        
        #Get test user
        db = SessionLocal()
        user_result = db.execute(text("SELECT id FROM users LIMIT 1")).fetchone()
        db.close()
        
        if not user_result:
            print("No users found")
            return False
        
        user_id = user_result[0]
        print(f"Using user ID: {user_id}")
        
        # Create some pending deletes first
        print("\n1. Creating pending delete operations...")
        test_queries = ["delete my last transaction", "remove expense from yesterday"]
        confirmation_ids = []
        
        for query in test_queries:
            result = handler.process_natural_language_delete(query, query, user_id, "test_session")
            if result.get("status") == "CONFIRM_REQUIRED":
                conf_id = result.get("confirmation_id")
                confirmation_ids.append(conf_id)
                print(f"  Created pending delete: {conf_id}")
        
        if not confirmation_ids:
            print("Could not create pending deletes")
            return False
        
        # Test listing pending deletes
        print("\n2. Testing list_pending_deletes...")
        list_result = handler.list_pending_deletes(user_id)
        status = list_result.get("status")
        pending_count = list_result.get("pending_count", 0)
        
        print(f"Status: {status}")
        print(f"Pending count: {pending_count}")
        
        if status == "HAS_PENDING" and pending_count > 0:
            print("Pending deletes listed successfully")
            pending_listed = True
        else:
            print("Failed to list pending deletes")
            pending_listed = False
        
        # Test cancel all pending deletes
        print("\n3. Testing cancel_all_pending_deletes...")
        cancel_result = handler.cancel_all_pending_deletes(user_id)
        cancel_status = cancel_result.get("status")
        cancelled_count = cancel_result.get("cancelled_count", 0)
        
        print(f"Status: {cancel_status}")
        print(f"Cancelled count: {cancelled_count}")
        
        if cancel_status == "CANCELLED" and cancelled_count > 0:
            print("Pending deletes cancelled successfully")
            pending_cancelled = True
        else:
            print("Failed to cancel pending deletes")
            pending_cancelled = False
        
        return pending_listed and pending_cancelled
        
    except Exception as e:
        print(f"Pending deletes management test failed: {e}")
        return False

def test_logging_functionality():
    """Test interaction logging"""
    print("\n" + "="*60)
    print("LOGGING FUNCTIONALITY TEST")
    print("="*60)
    
    try:
        handler = DataHandler()
        
        # Get test user
        db = SessionLocal()
        user_result = db.execute(text("SELECT id FROM users LIMIT 1")).fetchone()
        db.close()
        
        if not user_result:
            print("No users found")
            return False
        
        user_id = user_result[0]
        print(f"Using user ID: {user_id}")
        
        # Test logging
        test_prompts = [
            "Test log message 1",
            "Test log message 2 with special chars: $100 & <html>",
            "Test log message 3 with 'quotes' and \"double quotes\""
        ]
        
        print("\nTesting log_interaction method...")
        for prompt in test_prompts:
            try:
                handler.log_interaction(user_id, prompt, f"Test response for: {prompt}")
                print(f"Logged: '{prompt[:50]}...'")
            except Exception as e:
                print(f"Failed to log: {e}")
                return False
        
        # Verify logs were created
        db = SessionLocal()
        try:
            log_count = db.execute(text("""
                SELECT COUNT(*) FROM llmlogs WHERE user_id = :user_id
            """), {"user_id": user_id}).scalar()
            
            print(f"\nTotal logs for user {user_id}: {log_count}")
            
            if log_count >= len(test_prompts):
                print("Logs created successfully")
                return True
            else:
                print("Not all logs were created")
                return False
        finally:
            db.close()
        
    except Exception as e:
        print(f"Logging test failed: {e}")
        return False

def test_sql_injection_prevention():
    """Test SQL injection prevention"""
    print("\n" + "="*60)
    print("SQL INJECTION PREVENTION TEST")
    print("="*60)
    
    try:
        handler = DataHandler()
        
        # Get test user
        db = SessionLocal()
        user_result = db.execute(text("SELECT id FROM users LIMIT 1")).fetchone()
        db.close()
        
        if not user_result:
            print("No users found")
            return False
        
        user_id = user_result[0]
        print(f"Using user ID: {user_id}")
        
        # Test potentially malicious queries
        malicious_queries = [
            ("I spent $50'; DROP TABLE users; --", "SQL injection attempt"),
            ("add $100' OR '1'='1", "Always true condition"),
            ("record $0; DELETE FROM transactions", "Multiple statements"),
        ]
        
        print("\nTesting potentially malicious queries...")
        safe_count = 0
        
        for query, description in malicious_queries:
            print(f"\n{description}")
            print(f"Query: '{query}'")
            
            try:
                result = handler.process_natural_language_create(query, query, user_id)
                status = result.get("status")
                sql = result.get("sql", "")
                
                print(f"Status: {status}")
                print(f"Generated SQL: {sql[:100]}..." if sql else "No SQL")
                
                # Check for SQL injection patterns in generated SQL
                dangerous_patterns = ["DROP", "DELETE FROM", ";", "OR '1'='1"]
                
                is_safe = True
                for pattern in dangerous_patterns:
                    if pattern in sql.upper():
                        is_safe = False
                        print(f"WARNING: Pattern '{pattern}' found in SQL!")
                
                if is_safe:
                    safe_count += 1
                    print("Query handled safely")
                else:
                    print("Potential SQL injection risk")
                    
            except Exception as e:
                print(f"Query rejected (expected): {e}")
                safe_count += 1
            
            print("-" * 50)
        
        safety_rate = safe_count / len(malicious_queries) * 100
        print(f"\nSafety Rate: {safety_rate:.1f}% ({safe_count}/{len(malicious_queries)})")
        
        return safety_rate >= 80  # At least 80% safe
        
    except Exception as e:
        print(f"SQL injection test failed: {e}")
        return False

def interactive_data_test_mode():
    """Interactive test mode for DataHandler"""
    print("\n" + "="*60)
    print("INTERACTIVE DATA HANDLER TEST")
    print("="*60)
    
    try:
        handler = DataHandler()
        
        # Get user ID
        db = SessionLocal()
        users = db.execute(text("""
            SELECT u.id, u.email, COUNT(t.id) as transaction_count
            FROM users u 
            LEFT JOIN transactions t ON u.id = t.user_id
            GROUP BY u.id, u.email
            LIMIT 5
        """)).fetchall()
        db.close()
        
        if users:
            print("Available users:")
            for user_id, email, transaction_count in users:
                print(f"  ID: {user_id}, Email: {email}, Transactions: {transaction_count}")
        
        while True:
            try:
                user_id_input = input("\nEnter user ID (or 'quit' to exit): ").strip()
                
                if user_id_input.lower() in ['quit', 'exit', 'q']:
                    print("Exiting interactive mode...")
                    break
                
                if not user_id_input:
                    continue
                
                user_id = int(user_id_input)
                
                print(f"\nUser {user_id} selected.")
                print("Available operations:")
                print("  1. CREATE - Add new records")
                print("  2. DELETE - Remove records (with confirmation)")
                print("  3. VIEW PENDING - List pending delete operations")
                print("  4. CANCEL PENDING - Cancel all pending deletes")
                print("  Type 'back' to change user, 'quit' to exit")
                
                while True:
                    operation = input("\nOperation (1-4 or command): ").strip().lower()
                    
                    if operation in ['quit', 'exit', 'q']:
                        return
                    
                    if operation in ['back', 'change user']:
                        break
                    
                    if operation == '1':
                        # CREATE operation
                        query = input("Enter CREATE query (e.g., 'I spent $50 on groceries'): ").strip()
                        if query:
                            print(f"\nProcessing CREATE: '{query}'")
                            result = handler.process_natural_language_create(query, query, user_id)
                            
                            status = result.get("status")
                            sql = result.get("sql")
                            message = result.get("message")
                            
                            print(f"Status: {status}")
                            print(f"SQL: {sql}")
                            print(f"Message: {message}")
                            
                            if status == "COMPLETE" and sql:
                                confirm = input("\nExecute this SQL? (y/n): ").strip().lower()
                                if confirm in ['y', 'yes']:
                                    try:
                                        execution_result = handler.query_runner.execute_query(sql)
                                        print(f"Execution result: {execution_result.get('message')}")
                                    except Exception as e:
                                        print(f"Execution failed: {e}")
                    
                    elif operation == '2':
                        # DELETE operation
                        query = input("Enter DELETE query (e.g., 'delete my last transaction'): ").strip()
                        if query:
                            print(f"\nProcessing DELETE: '{query}'")
                            result = handler.process_natural_language_delete(query, query, user_id, "interactive_session")
                            
                            status = result.get("status")
                            confirmation_id = result.get("confirmation_id")
                            preview = result.get("preview", {})
                            
                            print(f"Status: {status}")
                            if confirmation_id:
                                print(f"Confirmation ID: {confirmation_id}")
                            print(f"Preview: {preview.get('message', 'No preview')}")
                            
                            if status == "CONFIRM_REQUIRED" and confirmation_id:
                                confirm = input("\nConfirm delete? (y/n): ").strip().lower()
                                if confirm in ['y', 'yes']:
                                    confirm_result = handler.confirm_delete(user_id, confirmation_id, True, "interactive_session")
                                    print(f"Confirm result: {confirm_result.get('status')}")
                                    print(f"Message: {confirm_result.get('message')}")
                    
                    elif operation == '3':
                        # VIEW PENDING
                        print("\nListing pending delete operations...")
                        result = handler.list_pending_deletes(user_id)
                        status = result.get("status")
                        message = result.get("message")
                        
                        print(f"Status: {status}")
                        print(f"Message: {message}")
                        
                        if status == "HAS_PENDING":
                            for op in result.get("pending_operations", []):
                                print(f"\n  ID: {op['confirmation_id']}")
                                print(f"  Query: {op['original_query']}")
                                print(f"  Preview: {op['preview_message']}")
                    
                    elif operation == '4':
                        # CANCEL PENDING
                        print("\nCancelling all pending delete operations...")
                        result = handler.cancel_all_pending_deletes(user_id)
                        
                        status = result.get("status")
                        message = result.get("message")
                        cancelled = result.get("cancelled_count", 0)
                        
                        print(f"Status: {status}")
                        print(f"Message: {message}")
                        print(f"Cancelled: {cancelled} operations")
                    
                    elif operation:
                        print("Invalid operation. Use 1-4 or 'back', 'quit'")
            
            except ValueError:
                print("Please enter a valid numeric user ID")
            except KeyboardInterrupt:
                print("\n\nInterrupted")
                break
            except Exception as e:
                print(f"Error: {e}")
    
    except Exception as e:
        print(f"Interactive test failed: {e}")

def run_all_data_handler_tests():
    """Run all DataHandler tests and report results"""
    print("\n" + "="*70)
    print("DATA HANDLER COMPREHENSIVE TEST SUITE")
    print("="*70)
    
    test_results = []
    
    # Run individual tests
    test_results.append(("Initialization", test_data_handler_initialization()))
    test_results.append(("CREATE Operations", test_create_operations()))
    test_results.append(("DELETE Operations", test_delete_operations()))
    test_results.append(("Pending Deletes Management", test_pending_deletes_management()))
    test_results.append(("Logging Functionality", test_logging_functionality()))
    test_results.append(("SQL Injection Prevention", test_sql_injection_prevention()))
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for _, result in test_results if result)
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "PASSED" if result else "FAILED"
        print(f"{test_name:30} {status}")
    
    print(f"\nTotal: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("\nALL DATA HANDLER TESTS PASSED!")
    elif passed >= total * 0.7:
        print("\nSOME TESTS FAILED, but core functionality appears working")
    else:
        print("\nMULTIPLE TESTS FAILED. Data handling may be broken")
    
    # Ask if user wants to run interactive mode
    if passed > 0:
        choice = input("\nRun interactive data test mode? (y/n): ").strip().lower()
        if choice in ['y', 'yes']:
            interactive_data_test_mode()

if __name__ == "__main__":
    run_all_data_handler_tests()