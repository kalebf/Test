'''
query_runner.py
'''
import logging
from typing import Tuple, Dict, Any, Optional
from langchain_ollama import OllamaLLM
from sqlalchemy import text
from backend.database.connection import SessionLocal
from backend.core.config import settings
from agents.prompt_enhancer import PromptEnhancer

logger = logging.getLogger(__name__)

class QueryRunner:
    def __init__(self):
        self.llm = OllamaLLM(model=settings.LLM_MODEL)
        self.enhancer = PromptEnhancer()
        self.conversation_context = {}  # Store extracted values for future use

    def execute_query(self, query: str) -> Dict[str, Any]:
        """Execute SQL query and return results"""
        db = SessionLocal()

        try:
            # Wrap raw SQL with text()
            result = db.execute(text(query))
            
            # COMMIT THE TRANSACTION for non-SELECT queries
            if not query.strip().upper().startswith('SELECT'):
                db.commit()
                logger.info(f"Executed and committed non-SELECT query")
            
            if query.strip().upper().startswith('SELECT'):
                # Get column names and data for SELECT queries
                columns = list(result.keys())
                data = result.fetchall()
                return {
                    "columns": columns,
                    "data": data,
                    "rowcount": len(data)
                }
            else:
                #return rowcount and a message for non-SELECT queries
                affected_rows = getattr(result, "rowcount", None)
                if affected_rows is None:
                    # Fallback if rowcount is not available
                    affected_rows = 0
                return {
                    "columns": [],
                    "data": [],
                    "rowcount": affected_rows, 
                    "message": f"Query executed successfully. {affected_rows} rows affected."
                }
        except Exception as e:
            # Rollback on error
            db.rollback()
            logger.error(f"Query execution failed: {e}")
            raise
        finally:
            db.close()

    def _get_schema_info(self) -> str:
        '''Get database schema information focused on LLM-friendly views'''
        db = SessionLocal()
        try:
            # Get detailed view information
            views_query = text("""
            SELECT table_name, column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name LIKE 'llm_%'
            ORDER BY table_name, ordinal_position;
            """)
            
            views_result = db.execute(views_query)
            
            schema_info = "LLM-OPTIMIZED VIEWS (USE THESE INSTEAD OF BASE TABLES):\n\n"
            
            current_view = None
            for table_name, column_name, data_type, is_nullable in views_result.fetchall():
                if table_name != current_view:
                    if current_view:
                        schema_info += "\n"
                    current_view = table_name
                    schema_info += f"VIEW: {table_name}\n"
                    schema_info += "Columns:\n"
                
                nullable = " (nullable)" if is_nullable == 'YES' else ""
                schema_info += f"  - {column_name} ({data_type}){nullable}\n"            
            schema_info += """
    VIEW PURPOSES AND EXACT USAGE:

    llm_user_profile - User personal and business information:
    • business_name → Use for: "what company do I work for", "am I in a business", "my business name"
    • role_name → Use for: "what is my role", "am I an admin"
    • display_name → Use for: "what is my name", "who am I"

    llm_business_hierarchy - Business user relationships:
    • admin_display_name, admin_user_email → Use for: "who is my admin", "who do I report to"
    • display_name, email → Use for: "who works under me", "my team members"

    CRITICAL FINANCIAL VIEWS - MUST USE THESE:

    llm_transaction_summary - MOST IMPORTANT FOR SPENDING QUESTIONS:
    • amount → Use for spending calculations (negative = expense, positive = income)
    • absolute_amount → Always positive amount
    • category_name → Category of transaction
    • category_kind → 'expense' or 'income'
    • created_at → Transaction date (use for filtering by month)
    • month, year → Alternative date fields
    • user_id → Filter by specific user
    • transaction_id → Unique identifier
    • USE THIS VIEW FOR: "how much did I spend", "what are my expenses", "show my transactions"

    llm_financial_overview - Financial summary data:
    • amount → Same as above
    • absolute_amount → Always positive amount
    • budgeted_amount, actual_income, actual_expenses → For budget comparisons
    • category_name, category_kind → Category information
    • month → Month for summary
    • USE THIS VIEW FOR: "how am I doing vs budget", "budget performance"

    llm_budget_overview - Budget planning:
    • budgeted_amount → Planned amount
    • actual_expenses, actual_income → Actual amounts
    • category_name, category_kind → Category information
    • month → Month for budget
    • USE THIS VIEW FOR: "what's my budget", "am I over budget"

    IMPORTANT COLUMN NOTES:
    1. 'amount' column: Negative values = expenses, Positive values = income
    2. 'absolute_amount' column: Always positive (use when you need positive values only)
    3. 'created_at' in llm_transaction_summary = actual transaction date
    4. 'month' in other views = summary month

    QUERY FILTERING EXAMPLES:
    - Current month expenses: WHERE amount < 0 AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
    - All expenses: WHERE amount < 0
    - Specific month: WHERE EXTRACT(MONTH FROM created_at) = 3 AND EXTRACT(YEAR FROM created_at) = 2024
    - By category: WHERE category_name = 'Food & Dining'

    CRITICAL RESPONSE RULES:
    1. NEVER mention table names, column names, or SQL in final responses
    2. NEVER make assumptions if data is not found - just say what the data shows
    3. NEVER generate fake data - only use what's in the query results
    4. Keep responses concise and direct - no explanations unless necessary
    5. If no data found, simply say "No [requested information] found in your records"

    BUSINESS SPECIFIC COLUMNS:
    - business_name (in llm_user_profile) → company affiliation
    - role_name → user type (business_admin, business_subuser, personal_user)
    - admin_email → for finding hierarchical relationships
    """
            return schema_info
            
        finally:
            db.close()
    
    def process_natural_language_query(self, user_query: str, user_id: int) -> Tuple[str, str]:
        """Process natural language query with two-stage approach"""
        
        # check if user has LLM access based on role
        access_check = self._check_user_llm_access(user_id)
        if not access_check["has_access"]:
            return access_check["message"], "ACCESS_DENIED"
        
        #1. Generate SQL to get comprehensive data from views
        schema_info = self._get_schema_info()
        enhanced_query = self.enhancer.enhance_query(user_query, schema_info)
        
        sql_query = self._generate_sql_query(enhanced_query, schema_info, user_id)
        sql_query = self._clean_sql_response(sql_query)

        
        #print what we're about to execute
        print(f"DEBUG: Generated SQL: {sql_query}")
        
        try:
            raw_data = self.execute_query(sql_query)
            
            #show resulets
            print(f"DEBUG: Raw data columns: {raw_data.get('columns', [])}")
            print(f"DEBUG: Raw data row count: {raw_data.get('rowcount', 0)}")
            if raw_data.get('data'):
                print(f"DEBUG: First few rows: {raw_data['data'][:3]}")
            
            # 2. Extract specific answer and generate natural response
            final_answer = self._extract_and_format_answer(
                user_query, enhanced_query, raw_data, sql_query
            )
            
            # Store extracted values for future context
            self._store_extracted_values(final_answer, raw_data)
            
            return final_answer, sql_query
            
        except Exception as e:
            logger.error(f"Query processing failed: {e}")
            error_message = f"I encountered an error while processing your query: {str(e)}"
            return error_message, sql_query if sql_query else "SQL generation failed"
    
    def _check_user_llm_access(self, user_id: int) -> Dict[str, Any]:
        """Check if user has permission to use LLM based on role"""
        db = SessionLocal()
        try:
            # Check user role and LLM access
            role_check = db.execute(text("""
                SELECT r.role_name, r.permission_level 
                FROM users u 
                JOIN roles r ON u.role_id = r.id 
                WHERE u.id = :user_id
            """), {"user_id": user_id})
            
            user_role = role_check.fetchone()
            
            if not user_role:
                return {"has_access": False, "message": "User not found."}
            
            role_name, permission_level = user_role
            
            # Business subusers don't get LLM access
            if role_name == "business_subuser":
                return {
                    "has_access": False, 
                    "message": "LLM access is not available for sub-users. Please contact your business administrator."
                }
            
            # All other roles have access
            return {"has_access": True, "message": "Access granted"}
            
        except Exception as e:
            logger.error(f"Role check failed: {e}")
            return {"has_access": False, "message": "Error checking user permissions."}
        finally:
            db.close()
    
    def _generate_sql_query(self, enhanced_query: str, schema_info: str, user_id: int) -> str:
        """Generate SQL with strict rules to prevent over-explaining"""
        
        prompt = f"""
        You are a SQL query generator for PostgreSQL using LLM-optimized views.
        You only speak in SQL code without extra characters or explanations.

        Database Schema:
        {schema_info}

        USER CONTEXT:
        - Current User ID: {user_id}
        - Views automatically filter to show only relevant data

        CRITICAL RULES FOR FINANCIAL QUERIES:
        1. For "spent", "spend", "expenses", "cost" questions → USE llm_transaction_summary
        2. For "income", "earned", "revenue" questions → USE llm_transaction_summary
        3. For "budget" questions → USE llm_budget_overview or llm_financial_overview
        4. Filter by user_id: WHERE user_id = {user_id}
        5. For expenses: WHERE amount < 0
        6. For income: WHERE amount > 0
        7. For "this month": WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
        8. Return ONLY the SQL query, no explanations

        SPECIFIC QUERY PATTERNS FOR YOUR SCHEMA:
        - "how much did I spend" → SELECT SUM(amount) as total_spent FROM llm_transaction_summary WHERE user_id = {user_id} AND amount < 0
        - "how much did I spend this month" → SELECT SUM(amount) as total_spent FROM llm_transaction_summary WHERE user_id = {user_id} AND amount < 0 AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
        - "show my expenses" → SELECT amount, category_name, created_at FROM llm_transaction_summary WHERE user_id = {user_id} AND amount < 0 ORDER BY created_at DESC
        - "what is my income" → SELECT SUM(amount) as total_income FROM llm_transaction_summary WHERE user_id = {user_id} AND amount > 0
        - "what business am I in" → SELECT business_name FROM llm_user_profile WHERE user_id = {user_id}
        - "who works under me" → SELECT display_name, role_name FROM llm_business_hierarchy WHERE admin_user_email = (SELECT email FROM users WHERE id = {user_id})

        USER QUESTION: "{enhanced_query}"

        Generate a clean, efficient SQL query using llm_transaction_summary for spending questions.
        SQL Query:
        """
        
        sql_query = self.llm.invoke(prompt).strip()
        
        # Log the generated SQL for debugging
        logger.info(f"Generated SQL query for '{enhanced_query}': {sql_query}")
        print(f"DEBUG: Generated SQL: {sql_query}")
        
        return sql_query

    
    def _extract_and_format_answer(self, original_query: str, enhanced_query: str, raw_data: Dict[str, Any], sql_query: str) -> str:
        """Extract answer with strict rules to prevent template hallucinations"""
        data_summary = self._format_data_for_extraction(raw_data)
        
        prompt = f"""
        ORIGINAL USER QUESTION: "{original_query}"
        
        EXACT DATA RETRIEVED FROM DATABASE:
        {data_summary}

        CRITICAL RULES - MUST FOLLOW:
        1. USE EXACT VALUES FROM DATA ABOVE - never use placeholders like $[amount] or [name]
        2. If no dollar amounts in data, don't mention dollar amounts
        3. If data shows "NO VALUES FOUND" or "NO DATA FOUND", say nothing was found
        4. Use the CALCULATED TOTALS exactly as shown
        5. Never invent numbers or names that aren't in the data above

        RESPONSE FORMAT EXAMPLES:
        - CORRECT: "Your total expenses were $1,234.56"
        - CORRECT: "No transactions found for last month"  
        - CORRECT: "Your business name is ABC Corporation"
        - WRONG: "Your total expenses were $[insert amount here]"
        - WRONG: "Your total expenses were $1,234.56 (from the amount column)"
        - WRONG: "You spent approximately $[amount] based on the data"

        SPECIFIC VALUE HANDLING:
        - Money amounts: Always use exact format from data (e.g., $1,234.56)
        - Names: Use exactly as shown in data
        - Dates: Use exactly as shown in data
        - If data is empty: Simply say nothing was found

        FINAL RESPONSE (be direct and use exact values):
        """
        
        try:
            response = self.llm.invoke(prompt).strip()
            
            # fix any template remnants that slipped through
            response = self._clean_template_artifacts(response)
            
            return response
        except Exception as e:
            logger.error(f"Extraction failed: {e}")
            return self._create_direct_response(raw_data, original_query)
    
    def _clean_template_artifacts(self, response: str) -> str:
        """Clean up any template artifacts that the LLM might have left"""
        import re
        
        template_patterns = [
            r'\$\[[^\]]+\]', 
            r'\[[^\]]+\]',    
            r'INSERT_[A-Z_]+', 
        ]
        
        cleaned_response = response
        for pattern in template_patterns:
            cleaned_response = re.sub(pattern, '[data not available]', cleaned_response)
        
        if cleaned_response != response:
            logger.warning("Template artifacts detected and cleaned in response")
            
        return cleaned_response

    def _create_direct_response(self, raw_data: Dict[str, Any], original_query: str) -> str:
        """Create a direct response without LLM when possible"""
        if not raw_data.get("data"):
            return "No information found for your query."
        
        data = raw_data["data"]
        columns = raw_data["columns"]
        
        money_columns = [i for i, col in enumerate(columns) 
                        if any(keyword in col.lower() for keyword in ['amount', 'total', 'sum', 'planned', 'actual'])]
        
        if money_columns:
            col_idx = money_columns[0]
            values = [row[col_idx] for row in data if row[col_idx] is not None]
            if values:
                total = sum(float(val) for val in values)
                formatted_total = f"${total:,.2f}" if abs(total) >= 1000 else f"${total:.2f}"
                
                query_lower = original_query.lower()
                if any(word in query_lower for word in ['spent', 'expense', 'cost']):
                    return f"Total expenses: {formatted_total}"
                elif any(word in query_lower for word in ['income', 'earned', 'revenue']):
                    return f"Total income: {formatted_total}"
                elif any(word in query_lower for word in ['budget', 'planned']):
                    return f"Total budget: {formatted_total}"
                else:
                    return f"Total amount: {formatted_total}"
        
        # Handle name/list responses
        if 'display_name' in columns:
            name_idx = columns.index('display_name')
            names = [str(row[name_idx]) for row in data if row[name_idx] is not None]
            if names:
                return f"Found: {', '.join(names)}"
        
        # Handle business name
        if 'business_name' in columns:
            biz_idx = columns.index('business_name')
            biz_names = [str(row[biz_idx]) for row in data if row[biz_idx] is not None]
            if biz_names:
                return f"Business: {biz_names[0]}"
        
        # Default simple response
        if len(data) == 1 and len(data[0]) == 1:
            value = data[0][0]
            if value is not None:
                if isinstance(value, (int, float)):
                    return f"Amount: ${value:,.2f}" if abs(value) >= 1000 else f"Amount: ${value:.2f}"
                return f"Result: {value}"
        
        return f"Found {len(data)} records matching your query."

    
    def _format_data_for_extraction(self, raw_data: Dict[str, Any]) -> str:
        """Format raw data for LLM consumption"""
        columns = raw_data["columns"]
        data = raw_data["data"]
        
        summary = f"Columns: {', '.join(columns)}\n\nData:\n"
        
        for i, row in enumerate(data[:15]): 
            row_text = " | ".join([str(val) if val is not None else "NULL" for val in row])
            summary += f"Row {i+1}: {row_text}\n"
        
        if len(data) > 15:
            summary += f"\n... and {len(data) - 15} more rows"
        
        if data and len(columns) > 0:
            numeric_cols = [i for i, col in enumerate(columns) 
                          if any(keyword in col.lower() for keyword in ['amount', 'total', 'value', 'number', 'planned', 'actual'])]
            if numeric_cols:
                summary += "\n\nKey Numeric Values Found:"
                for col_idx in numeric_cols:
                    values = [row[col_idx] for row in data if row[col_idx] is not None]
                    if values:
                        try:
                            numeric_vals = [float(v) for v in values]
                            summary += f"\n- {columns[col_idx]}: {len(values)} values, sum: {sum(numeric_vals):.2f}, avg: {sum(numeric_vals)/len(numeric_vals):.2f}"
                        except (ValueError, TypeError):
                            summary += f"\n- {columns[col_idx]}: {len(values)} values"
        
        return summary
    
    def _validate_response_quality(self, original_query: str, response: str) -> bool:
        """Validate that the response actually answers the question"""
        
        validation_prompt = f"""
        Original Question: "{original_query}"
        Proposed Response: "{response}"
        
        Does the response directly and completely answer the original question?
        Check:
        - If question asks for a number, does response include that number?
        - If question asks for a name, does response include that name?
        - Is the response specific and not vague?
        - Does it avoid technical jargon?
        
        Answer with ONLY: YES or NO
        """
        
        try:
            validation = self.llm.invoke(validation_prompt).strip().upper()
            return "YES" in validation
        except:
            query_lower = original_query.lower()
            response_lower = response.lower()
            
            # Basic validation rules
            if "how much" in query_lower and any(word in response_lower for word in ["$", "dollars", "amount"]):
                return True
            if "what is" in query_lower and len(response.split()) > 3:
                return True
            if "who" in query_lower and any(word in response_lower for word in ["name", "called", "identified"]):
                return True
            
            return len(response.split()) > 5
    
    def _retry_answer_extraction(self, original_query: str, enhanced_query: str, data_summary: str) -> str:
        """Retry answer extraction with more specific guidance"""
        
        prompt = f"""
        The previous response didn't properly answer the question. Try again.
        
        QUESTION: "{original_query}"
        ENHANCED: "{enhanced_query}"
        DATA: {data_summary}
        
        Be very specific and direct. Extract the exact number/name/value that answers the question.
        If you see multiple values, choose the most relevant one.
        
        Direct Answer:
        """
        
        return self.llm.invoke(prompt).strip()
    
    def _store_extracted_values(self, response: str, raw_data: Dict[str, Any]):
        """Store extracted numeric values for future context"""
        import re
        
        numbers = re.findall(r'\$?(\d+\.?\d*)', response)
        if numbers:
            self.conversation_context['last_extracted_values'] = numbers
        
        # Store key data points
        if raw_data.get("data"):
            first_row = raw_data["data"][0]
            columns = raw_data["columns"]
            
            # Look for common important fields
            for i, col in enumerate(columns):
                if any(keyword in col.lower() for keyword in ['total', 'amount', 'sum', 'count']):
                    if first_row[i] is not None:
                        self.conversation_context[f'last_{col}'] = first_row[i]
    
    def _fallback_formatting(self, raw_data: Dict[str, Any], original_query: str) -> str:
        """Fallback formatting if LLM extraction fails"""
        if not raw_data.get("data"):
            return "No data found for your query."
        
        data = raw_data["data"]
        columns = raw_data["columns"]
        
        # Simple extraction for common cases
        if len(data) == 1 and len(data[0]) == 1:
            return f"The answer is {data[0][0]}."
        elif "display_name" in columns:
            name_idx = columns.index("display_name")
            if data and data[0][name_idx]:
                return f"Your display name is {data[0][name_idx]}."
        elif "amount" in columns or "absolute_amount" in columns:
            amount_col = "absolute_amount" if "absolute_amount" in columns else "amount"
            amount_idx = columns.index(amount_col)
            total = sum(row[amount_idx] for row in data if row[amount_idx] is not None)
            return f"The total amount is ${total:,.2f}."
        
        return f"I found {len(data)} records matching your query. The most relevant information has been retrieved."
    
    def _clean_sql_response(self, sql_response: str) -> str:
        """Clean up SQL response from LLM to extract only the SQL query"""
        import re
        
        if sql_response.upper().startswith(('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'WITH')):
            return sql_response.strip()
        
        # Remove markdown code blocks
        if '```sql' in sql_response and '```' in sql_response:
            start = sql_response.find('```sql')
            if start != -1:
                start = start + 6
                end = sql_response.find('```', start)
                if end != -1:
                    sql_response = sql_response[start:end].strip()
        elif '```' in sql_response:
            start = sql_response.find('```')
            if start != -1:
                start = start + 3
                end = sql_response.find('```', start)
                if end != -1:
                    sql_response = sql_response[start:end].strip()
        
        # Remove any lines that are purely explanatory
        lines = sql_response.split('\n')
        cleaned_lines = []
        for line in lines:
            line_lower = line.lower().strip()
            # Skip explanatory lines
            if any(text in line_lower for text in [
                'here is', 'generated sql', 'sql query', 'query:', 
                '```', 'the query is', 'sql:', 'answer:'
            ]):
                continue
            # Skip empty lines
            if line.strip() == '':
                continue
            cleaned_lines.append(line.strip())
        
        sql_response = ' '.join(cleaned_lines)
        
        # Remove any remaining prefix text
        match = re.search(r'(SELECT|INSERT|UPDATE|DELETE|WITH).*', sql_response, re.IGNORECASE | re.DOTALL)
        if match:
            sql_response = match.group(0).strip()
        
        return sql_response
    
    def execute_query_with_params(self, query: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute SQL query with parameters to prevent SQL injection"""
        db = SessionLocal()
        try:
            result = db.execute(text(query), params)
            
            # COMMIT for non-SELECT queries
            if not query.strip().upper().startswith('SELECT'):
                db.commit()
            
            if query.strip().upper().startswith('SELECT'):
                columns = list(result.keys())
                data = result.fetchall()
                return {
                    "columns": columns,
                    "data": data,
                    "rowcount": len(data)
                }
            else:
                affected_rows = getattr(result, "rowcount", 0)
                return {
                    "columns": [],
                    "data": [],
                    "rowcount": affected_rows,
                    "message": f"Query executed successfully. {affected_rows} rows affected."
                }
        except Exception as e:
            db.rollback()
            logger.error(f"Parameterized query execution failed: {e}")
            raise
        finally:
            db.close()