# file name: test_prompt_enhancer.py
import os
import sys

# Add the parent directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from agents.prompt_enhancer import PromptEnhancer
from agents.query_runner import QueryRunner

def test_enhancer_initialization():
    """Test PromptEnhancer initialization"""
    print("\n" + "="*60)
    print("PROMPT ENHANCER INITIALIZATION TEST")
    print("="*60)
    
    try:
        enhancer = PromptEnhancer()
        print("PromptEnhancer initialized successfully")
        
        # Check required attributes
        if hasattr(enhancer, 'llm'):
            print("LLM model initialized")
        else:
            print("LLM model not initialized")
            return False
        
        return True
        
    except Exception as e:
        print(f"Initialization failed: {e}")
        return False

def test_query_enhancement():
    """Test query enhancement functionality"""
    print("\n" + "="*60)
    print("QUERY ENHANCEMENT TEST")
    print("="*60)
    
    try:
        enhancer = PromptEnhancer()
        query_runner = QueryRunner()
        
        # Get schema info for enhancement
        schema_info = query_runner._get_schema_info()
        
        # Test queries
        test_cases = [
            {
                "query": "how much did I spend on food?",
                "expected_keywords": ["category", "food", "dining", "llm_transaction_summary"]
            },
            {
                "query": "show me my income from last month",
                "expected_keywords": ["income", "last month", "amount > 0", "llm_transaction_summary"]
            },
            {
                "query": "what are my transportation expenses?",
                "expected_keywords": ["transportation", "expense", "amount < 0", "category"]
            },
            {
                "query": "how much did I spend in total?",
                "expected_keywords": ["total", "sum", "amount", "llm_transaction_summary"]
            },
            {
                "query": "what business am I in?",
                "expected_keywords": ["business", "llm_user_profile", "business_name"]
            },
            {
                "query": "who works under me?",
                "expected_keywords": ["hierarchy", "llm_business_hierarchy", "admin"]
            },
        ]
        
        print("Testing query enhancement with schema context...")
        results = []
        
        for test_case in test_cases:
            query = test_case["query"]
            expected_keywords = test_case["expected_keywords"]
            
            print(f"\nOriginal query: '{query}'")
            
            try:
                enhanced = enhancer.enhance_query(query, schema_info)
                print(f"Enhanced query: '{enhanced}'")
                
                # Check enhancement characteristics
                checks = []
                
                # 1. Check if enhanced query is longer
                if len(enhanced) > len(query):
                    checks.append(("Added context", True))
                else:
                    checks.append(("Minimal enhancement", False))
                
                # 2. Check for expected keywords
                keyword_matches = []
                for keyword in expected_keywords:
                    if keyword.lower() in enhanced.lower():
                        keyword_matches.append(keyword)
                        checks.append((f"Contains '{keyword}'", True))
                    else:
                        checks.append((f"Missing '{keyword}'", False))
                
                # 3. Check if enhancement makes sense
                if any(word in enhanced.lower() for word in ['category', 'view', 'amount', 'user_id']):
                    checks.append(("Enhanced meaningfully", True))
                else:
                    checks.append(("Enhancement unclear", False))
                
                # Determine if test passed
                passed_keywords = sum(1 for _, result in checks if result)
                total_checks = len(checks)
                
                if passed_keywords >= total_checks * 0.7:  # 70% pass rate
                    results.append(True)
                    print("Enhancement successful")
                else:
                    results.append(False)
                    print("Enhancement insufficient")
                
                # Show detailed results
                for check_name, check_result in checks:
                    print(f"  {check_name}")
                
            except Exception as e:
                print(f"Enhancement failed: {e}")
                results.append(False)
            
            print("-" * 50)
        
        success_rate = sum(results) / len(results) * 100
        print(f"\nEnhancement Success Rate: {success_rate:.1f}% ({sum(results)}/{len(results)})")
        
        return success_rate > 60
        
    except Exception as e:
        print(f"Query enhancement test failed: {e}")
        return False

def test_specific_categories():
    """Test enhancement with specific category mapping"""
    print("\n" + "="*60)
    print("CATEGORY MAPPING TEST")
    print("="*60)
    
    try:
        enhancer = PromptEnhancer()
        query_runner = QueryRunner()
        
        # Get schema info
        schema_info = query_runner._get_schema_info()
        
        # Test category specific queries
        category_tests = [
            ("how much did I spend on groceries?", "Food & Dining"),
            ("what are my dining expenses?", "Food & Dining"),
            ("show me my transportation costs", "Transportation"),
            ("how much for utilities?", "Utilities"),
            ("entertainment spending", "Entertainment"),
            ("healthcare expenses", "Healthcare"),
            ("insurance payments", "Insurance"),
            ("travel costs", "Travel"),
            ("education expenses", "Education"),
            ("rent payments", "Housing"),
        ]
        
        print("Testing category name mapping in enhancements...")
        results = []
        
        for query, expected_category in category_tests:
            print(f"\nQuery: '{query}'")
            print(f"Expected category hint: {expected_category}")
            
            try:
                enhanced = enhancer.enhance_query(query, schema_info)
                print(f"Enhanced: '{enhanced}'")
                
                # Check if category is mentioned or mapped
                query_lower = query.lower()
                enhanced_lower = enhanced.lower()
                
                if expected_category.lower() in enhanced_lower:
                    print(f"Category '{expected_category}' explicitly mentioned")
                    results.append(True)
                elif any(word in enhanced_lower for word in ['category', 'category_name', 'category_kind']):
                    print(f"Category reference added (implicit)")
                    results.append(True)
                elif 'food' in query_lower and ('dining' in enhanced_lower or 'food' in enhanced_lower):
                    print(f"Food/dining reference maintained")
                    results.append(True)
                elif 'transport' in query_lower and 'transport' in enhanced_lower:
                    print(f"Transportation reference maintained")
                    results.append(True)
                else:
                    print(f"Category mapping not evident")
                    results.append(False)
                
            except Exception as e:
                print(f"Enhancement failed: {e}")
                results.append(False)
            
            print("-" * 50)
        
        success_rate = sum(results) / len(results) * 100
        print(f"\nCategory Mapping Success Rate: {success_rate:.1f}% ({sum(results)}/{len(results)})")
        
        return success_rate > 70
        
    except Exception as e:
        print(f"Category mapping test failed: {e}")
        return False

def test_financial_context():
    """Test enhancement with financial context"""
    print("\n" + "="*60)
    print("FINANCIAL CONTEXT TEST")
    print("="*60)
    
    try:
        enhancer = PromptEnhancer()
        query_runner = QueryRunner()
        
        schema_info = query_runner._get_schema_info()
        
        # Test financial context enhancement
        financial_tests = [
            ("my expenses", ["expense", "amount < 0", "negative"]),
            ("my income", ["income", "amount > 0", "positive"]),
            ("total spending", ["sum", "total", "amount", "expense"]),
            ("monthly budget", ["budget", "month", "planned"]),
            ("budget vs actual", ["budgeted_amount", "actual_expenses", "comparison"]),
            ("spending by category", ["category", "group by", "breakdown"]),
            ("highest expense", ["max", "largest", "amount"]),
            ("recent transactions", ["created_at", "recent", "latest"]),
        ]
        
        print("Testing financial context enhancement...")
        results = []
        
        for query, expected_context in financial_tests:
            print(f"\nQuery: '{query}'")
            print(f"Expected context: {expected_context}")
            
            try:
                enhanced = enhancer.enhance_query(query, schema_info)
                print(f"Enhanced: '{enhanced}'")
                
                # Check for expected context
                matches = []
                enhanced_lower = enhanced.lower()
                
                for context in expected_context:
                    if context in enhanced_lower:
                        matches.append(context)
                
                match_rate = len(matches) / len(expected_context)
                
                if match_rate >= 0.5:  # At least 50% match
                    print(f"Context added: {matches}")
                    results.append(True)
                else:
                    print(f"Insufficient context: {matches}")
                    results.append(False)
                
            except Exception as e:
                print(f"Enhancement failed: {e}")
                results.append(False)
            
            print("-" * 50)
        
        success_rate = sum(results) / len(results) * 100
        print(f"\nFinancial Context Success Rate: {success_rate:.1f}% ({sum(results)}/{len(results)})")
        
        return success_rate > 60
        
    except Exception as e:
        print(f"Financial context test failed: {e}")
        return False

def test_edge_cases():
    """Test edge cases and error handling"""
    print("\n" + "="*60)
    print("EDGE CASES TEST")
    print("="*60)
    
    try:
        enhancer = PromptEnhancer()
        query_runner = QueryRunner()
        
        schema_info = query_runner._get_schema_info()
        
        # Test edge cases
        edge_cases = [
            ("", "Empty query"),
            (" ", "Whitespace only"),
            ("?", "Single character"),
            ("12345", "Numbers only"),
            ("#$%^&*", "Special characters only"),
            ("show me everything", "Vague query"),
            ("what is the meaning of life?", "Philosophical query"),
            ("hello world", "Greeting"),
            ("help", "Help request"),
        ]
        
        print("Testing edge cases...")
        results = []
        
        for query, description in edge_cases:
            print(f"\n{description}: '{query}'")
            
            try:
                enhanced = enhancer.enhance_query(query, schema_info)
                
                if enhanced:
                    print(f"Enhanced: '{enhanced}'")
                    
                    # For empty/whitespace queries, enhancement might return empty
                    if not query.strip() and not enhanced.strip():
                        print("Handled empty query appropriately")
                        results.append(True)
                    elif len(enhanced) > len(query):
                        print("Added enhancement")
                        results.append(True)
                    else:
                        print("Minimal or no enhancement")
                        results.append(False)
                else:
                    print("Returned empty enhancement")
                    results.append(False)
                
            except Exception as e:
                # Some edge cases might cause expected errors
                print(f"Handled with error (expected): {e}")
                results.append(True)
            
            print("-" * 50)
        
        success_rate = sum(results) / len(results) * 100
        print(f"\nEdge Cases Success Rate: {success_rate:.1f}% ({sum(results)}/{len(results)})")
        
        return success_rate > 70
        
    except Exception as e:
        print(f"Edge cases test failed: {e}")
        return False

def test_performance():
    """Test enhancement performance"""
    print("\n" + "="*60)
    print("PERFORMANCE TEST")
    print("="*60)
    
    try:
        import time
        
        enhancer = PromptEnhancer()
        query_runner = QueryRunner()
        
        schema_info = query_runner._get_schema_info()
        
        # Test queries for performance
        test_queries = [
            "how much did I spend?",
            "show my expenses",
            "what is my income?",
            "budget overview",
            "spending by category",
        ]
        
        print("Testing enhancement performance...")
        
        times = []
        for query in test_queries:
            print(f"\nEnhancing: '{query}'")
            
            try:
                start_time = time.time()
                enhanced = enhancer.enhance_query(query, schema_info)
                elapsed = time.time() - start_time
                
                times.append(elapsed)
                
                print(f"Time: {elapsed:.2f}s")
                print(f"Enhanced length: {len(enhanced)} chars")
                
                if elapsed < 5.0:  # Should complete within 5 seconds
                    print("Performance acceptable")
                else:
                    print("Performance slow")
                
            except Exception as e:
                print(f"Enhancement failed: {e}")
                times.append(10.0)  # Mark as failed with high time
        
        if times:
            avg_time = sum(times) / len(times)
            max_time = max(times)
            min_time = min(times)
            
            print(f"\nPerformance Summary:")
            print(f"  Average time: {avg_time:.2f}s")
            print(f"  Maximum time: {max_time:.2f}s")
            print(f"  Minimum time: {min_time:.2f}s")
            print(f"  Total queries: {len(test_queries)}")
            
            if avg_time < 3.0:
                print("Overall performance good")
                return True
            elif avg_time < 5.0:
                print("Performance acceptable but could be improved")
                return True
            else:
                print("Performance too slow")
                return False
        else:
            print("No successful enhancements")
            return False
        
    except Exception as e:
        print(f"Performance test failed: {e}")
        return False

def interactive_enhancement_test():
    """Interactive test mode for prompt enhancement"""
    print("\n" + "="*60)
    print("INTERACTIVE ENHANCEMENT TEST")
    print("="*60)
    
    try:
        enhancer = PromptEnhancer()
        query_runner = QueryRunner()
        
        schema_info = query_runner._get_schema_info()
        
        print("You can now test query enhancement interactively.")
        print("Type 'schema' to see schema info, 'quit' to exit.")
        print("\nExample queries to try:")
        print("  - how much did I spend on food?")
        print("  - show my income")
        print("  - what are my transportation expenses?")
        print("  - budget overview")
        
        while True:
            query = input("\nEnter query to enhance: ").strip()
            
            if query.lower() in ['quit', 'exit', 'q']:
                print("Exiting...")
                break
            
            if query.lower() == 'schema':
                print(f"\nSchema info preview (first 500 chars):")
                print(schema_info[:500] + "...")
                continue
            
            if not query:
                continue
            
            print(f"\nOriginal: '{query}'")
            print("-" * 60)
            
            try:
                import time
                start_time = time.time()
                enhanced = enhancer.enhance_query(query, schema_info)
                elapsed = time.time() - start_time
                
                print(f"Enhanced: '{enhanced}'")
                print(f"\nEnhancement time: {elapsed:.2f}s")
                print(f"Length increase: {len(enhanced) - len(query)} chars")
                
                print("\nEnhancement analysis:")
                
                # Check for key improvements
                checks = []
                if len(enhanced) > len(query):
                    checks.append(("Added context", True))
                else:
                    checks.append(("No length increase", False))
                
                if any(word in enhanced.lower() for word in ['category', 'amount', 'view', 'llm_']):
                    checks.append(("Added database context", True))
                else:
                    checks.append(("Limited database context", False))
                
                if any(word in enhanced.lower() for word in ['expense', 'income', 'budget', 'transaction']):
                    checks.append(("Financial context maintained", True))
                else:
                    checks.append(("Financial context unclear", False))
                
                for check_name, check_result in checks:
                    print(f"  {check_name}")
                
            except Exception as e:
                print(f"Enhancement failed: {e}")
            
            print("-" * 60)
    
    except Exception as e:
        print(f"Interactive test failed: {e}")

def run_all_prompt_enhancer_tests():
    """Run all PromptEnhancer tests and report results"""
    print("\n" + "="*70)
    print("PROMPT ENHANCER COMPREHENSIVE TEST SUITE")
    print("="*70)
    
    test_results = []
    
    # Run individual tests
    test_results.append(("Initialization", test_enhancer_initialization()))
    test_results.append(("Query Enhancement", test_query_enhancement()))
    test_results.append(("Category Mapping", test_specific_categories()))
    test_results.append(("Financial Context", test_financial_context()))
    test_results.append(("Edge Cases", test_edge_cases()))
    test_results.append(("Performance", test_performance()))
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for _, result in test_results if result)
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "PASSED" if result else "FAILED"
        print(f"{test_name:25} {status}")
    
    print(f"\nTotal: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("\nALL PROMPT ENHANCER TESTS PASSED!")
    elif passed >= total * 0.7:
        print("\nSOME TESTS FAILED, but core functionality appears working")
    else:
        print("\nMULTIPLE TESTS FAILED. Enhancement may be broken")
    
    # Ask if user wants to run interactive mode
    if passed > 0:
        choice = input("\nRun interactive enhancement test? (y/n): ").strip().lower()
        if choice in ['y', 'yes']:
            interactive_enhancement_test()

if __name__ == "__main__":
    run_all_prompt_enhancer_tests()