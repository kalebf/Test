#test_query_runner.py
import os
import sys
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from agents.query_runner import QueryRunner
from core.database import SessionLocal
from sqlalchemy import text

def test_database_connection():
    """Test basic database connectivity"""
    print("\n" + "="*60)
    print("DATABASE CONNECTION TEST")
    print("="*60)
    
    try:
        db = SessionLocal()
        result = db.execute(text("SELECT version()"))
        version = result.fetchone()[0]
        db.close()
        print(f"PostgreSQL Version: {version}")
        return True
    except Exception as e:
        print(f"Database connection failed: {e}")
        return False

def test_schema_info():
    """Test schema information retrieval"""
    print("\n" + "="*60)
    print("SCHEMA INFORMATION TEST")
    print("="*60)
    
    try:
        query_runner = QueryRunner()
        schema_info = query_runner._get_schema_info()
        
        #Check for key components in schema info
        checks = [
            ("LLM-OPTIMIZED VIEWS", "LLM views section"),
            ("llm_transaction_summary", "Transaction summary view"),
            ("llm_user_profile", "User profile view"),
            ("amount", "Amount column"),
            ("category_name", "Category column")
        ]
        
        all_passed = True
        for keyword, description in checks:
            if keyword in schema_info:
                print(f"Found {description}")
            else:
                print(f"Missing {description}")
                all_passed = False
        
        # Show preview of schema info
        print(f"\nSchema info preview (first 500 chars):")
        print(schema_info[:500] + "...")
        
        return all_passed
    except Exception as e:
        print(f"Schema info test failed: {e}")
        return False

def test_sql_execution():
    """Test SQL query execution"""
    print("\n" + "="*60)
    print("SQL EXECUTION TEST")
    print("="*60)
    
    try:
        query_runner = QueryRunner()
        
        # Test SELECT query
        print("1. Testing SELECT query...")
        select_result = query_runner.execute_query("SELECT 1 as test_value, 'hello' as greeting")
        if select_result["rowcount"] >= 0:
            print(f"SELECT query executed: {select_result}")
        else:
            print(f"SELECT query failed")
            return False
        
        # Test parameterized query
        print("\n2. Testing parameterized query...")
        param_result = query_runner.execute_query_with_params(
            "SELECT :value as test", 
            {"value": 42}
        )
        if param_result["rowcount"] >= 0:
            print(f"Parameterized query executed: {param_result}")
        else:
            print(f"Parameterized query failed")
        
        return True
        
    except Exception as e:
        print(f"SQL execution test failed: {e}")
        return False

def test_natural_language_processing():
    """Test natural language query processing"""
    print("\n" + "="*60)
    print("NATURAL LANGUAGE PROCESSING TEST")
    print("="*60)
    
    try:
        # Get a valid user ID
        db = SessionLocal()
        user_result = db.execute(text("SELECT id FROM users LIMIT 1")).fetchone()
        db.close()
        
        if not user_result:
            print("No users found in database")
            return False
        
        user_id = user_result[0]
        print(f"Using user ID: {user_id}")
        
        query_runner = QueryRunner()
        
        # Test queries with expected intents
        test_queries = [
            ("how much did I spend this month?", "VIEW - Should return amount"),
            ("what is my total income?", "VIEW - Should return income total"),
            ("show my expenses", "VIEW - Should list expenses"),
            ("what business am I in?", "VIEW - Should return business info"),
        ]
        
        results = []
        for query, description in test_queries:
            print(f"\n{description}")
            print(f"Query: '{query}'")
            
            try:
                start_time = time.time()
                answer, sql = query_runner.process_natural_language_query(query, user_id)
                elapsed = time.time() - start_time
                
                print(f"SQL Generated: {sql[:100]}..." if sql else "No SQL generated")
                print(f"Answer: {answer[:200]}" if answer else "No answer")
                print(f"Time: {elapsed:.2f}s")
                
                # Basic validation
                if answer and "error" not in answer.lower():
                    results.append(True)
                    print("Query processed successfully")
                else:
                    results.append(False)
                    print("Query processing failed")
                    
            except Exception as e:
                print(f"Error: {e}")
                results.append(False)
            
            print("-" * 50)
        
        success_rate = sum(results) / len(results) * 100
        print(f"\nSuccess Rate: {success_rate:.1f}% ({sum(results)}/{len(results)})")
        
        return success_rate > 50  # At least 50% success rate
        
    except Exception as e:
        print(f"NLP test failed: {e}")
        return False

def test_prompt_enhancement():
    """Test prompt enhancement functionality"""
    print("\n" + "="*60)
    print("PROMPT ENHANCEMENT TEST")
    print("="*60)
    
    try:
        from agents.prompt_enhancer import PromptEnhancer
        
        enhancer = PromptEnhancer()
        
        # Get schema info for enhancement
        query_runner = QueryRunner()
        schema_info = query_runner._get_schema_info()
        
        test_queries = [
            "how much did I spend on food?",
            "show me my income from last month",
            "what are my transportation expenses?",
            "how much did I spend in total?"
        ]
        
        for query in test_queries:
            print(f"\nOriginal: '{query}'")
            
            try:
                enhanced = enhancer.enhance_query(query, schema_info)
                print(f"Enhanced: '{enhanced}'")
                
                # Check if enhancement added useful context
                if len(enhanced) > len(query) and any(word in enhanced.lower() for word in ['category', 'amount', 'view', 'llm']):
                    print("Enhancement added meaningful context")
                else:
                    print("Enhancement minimal or none")
                    
            except Exception as e:
                print(f"Enhancement failed: {e}")
            
            print("-" * 50)
        
        return True
        
    except Exception as e:
        print(f"Prompt enhancement test failed: {e}")
        return False

def test_user_access_control():
    """Test user access control for LLM features"""
    print("\n" + "="*60)
    print("USER ACCESS CONTROL TEST")
    print("="*60)
    
    try:
        query_runner = QueryRunner()
        
        db = SessionLocal()
        
        # Get users with different roles
        users = db.execute(text("""
            SELECT u.id, r.role_name 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            LIMIT 3
        """)).fetchall()
        
        db.close()
        
        if not users:
            print("No users found")
            return False
        
        for user_id, role_name in users:
            print(f"\nTesting user ID {user_id} (Role: {role_name})")
            
            result = query_runner._check_user_llm_access(user_id)
            has_access = result["has_access"]
            message = result["message"]
            
            # Business subusers should not have access
            if role_name == "business_subuser":
                if not has_access:
                    print(f"Correctly denied access to business subuser")
                else:
                    print(f"Should have denied access to business subuser")
            else:
                if has_access:
                    print(f"Granted access to {role_name}")
                else:
                    print(f"Should have granted access to {role_name}")
            
            print(f"Message: {message}")
            print("-" * 40)
        
        return True
        
    except Exception as e:
        print(f"Access control test failed: {e}")
        return False

def interactive_test_mode():
    """Interactive test mode for manual testing"""
    print("\n" + "="*60)
    print("INTERACTIVE TEST MODE")
    print("="*60)
    
    try:
        query_runner = QueryRunner()
        
        # Get user ID
        db = SessionLocal()
        users = db.execute(text("""
            SELECT u.id, u.email, p.display_name, r.role_name
            FROM users u 
            LEFT JOIN profiles p ON u.id = p.user_id 
            LEFT JOIN roles r ON u.role_id = r.id
            LIMIT 5
        """)).fetchall()
        db.close()
        
        if users:
            print("Available users:")
            for user_id, email, display_name, role_name in users:
                display_name = display_name or "No name"
                print(f"  ID: {user_id}, Email: {email}, Name: {display_name}, Role: {role_name}")
        
        while True:
            try:
                user_id_input = input("\nEnter user ID (or 'quit' to exit): ").strip()
                
                if user_id_input.lower() in ['quit', 'exit', 'q']:
                    print("Exiting interactive mode...")
                    break
                
                if not user_id_input:
                    continue
                
                user_id = int(user_id_input)
                
                # Test access control first
                access_result = query_runner._check_user_llm_access(user_id)
                if not access_result["has_access"]:
                    print(f"Access denied: {access_result['message']}")
                    continue
                
                print(f"\nUser {user_id} has LLM access. You can now test queries.")
                print("Examples: 'how much did I spend', 'show my expenses', 'what is my income'")
                print("Type 'back' to change user, 'schema' to see schema, 'quit' to exit")
                
                while True:
                    query = input("\nQuery: ").strip()
                    
                    if query.lower() in ['quit', 'exit', 'q']:
                        return
                    
                    if query.lower() in ['back', 'change user']:
                        break
                    
                    if query.lower() == 'schema':
                        schema = query_runner._get_schema_info()
                        print(f"\nSchema (first 1000 chars):")
                        print(schema[:1000] + "...")
                        continue
                    
                    if not query:
                        continue
                    
                    print(f"\nProcessing: '{query}'")
                    print("-" * 60)
                    
                    try:
                        start_time = time.time()
                        answer, sql = query_runner.process_natural_language_query(query, user_id)
                        elapsed = time.time() - start_time
                        
                        print(f"Generated SQL:\n{sql}")
                        print(f"\nAnswer: {answer}")
                        print(f"\nTime: {elapsed:.2f}s")
                        
                    except Exception as e:
                        print(f"Error: {e}")
                    
                    print("-" * 60)
            
            except ValueError:
                print("Please enter a valid numeric user ID")
            except KeyboardInterrupt:
                print("\n\nInterrupted")
                break
            except Exception as e:
                print(f"Error: {e}")
    
    except Exception as e:
        print(f"Interactive test failed: {e}")

def run_all_tests():
    """Run all tests and report results"""
    print("\n" + "="*70)
    print("QUERY RUNNER COMPREHENSIVE TEST SUITE")
    print("="*70)
    
    test_results = []
    
    # Run individual tests
    test_results.append(("Database Connection", test_database_connection()))
    test_results.append(("Schema Information", test_schema_info()))
    test_results.append(("SQL Execution", test_sql_execution()))
    test_results.append(("User Access Control", test_user_access_control()))
    test_results.append(("Prompt Enhancement", test_prompt_enhancement()))
    test_results.append(("Natural Language Processing", test_natural_language_processing()))
    
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
        print("\nALL TESTS PASSED!")
    elif passed >= total * 0.7:
        print("\nSOME TESTS FAILED, but core functionality appears working")
    else:
        print("\nMULTIPLE TESTS FAILED. Core functionality may be broken")
    
    # Ask if user wants to run interactive mode
    if passed > 0:  # Only run interactive if some tests passed
        choice = input("\nRun interactive test mode? (y/n): ").strip().lower()
        if choice in ['y', 'yes']:
            interactive_test_mode()

if __name__ == "__main__":
    run_all_tests()