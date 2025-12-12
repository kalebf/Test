'''
prompt_enhancer.py
'''
import logging
from langchain_ollama import OllamaLLM
from backend.core.config import settings

logger = logging.getLogger(__name__)

class PromptEnhancer:
    def __init__(self):
        self.llm = OllamaLLM(model=settings.LLM_MODEL)
    
    def enhance_query(self, user_query: str, schema_info: str) -> str:
        """Enhanced query with emphasis on exact value retrieval"""
        
        category_mapping_info = """
        CATEGORY NAME MAPPING FOR FINANCIAL SYSTEM:
        
        INCOME CATEGORIES (category_kind = 'income'):
        - "salary", "job", "paycheck" → "Salary" 
        - "freelance", "contract", "side job" → "Freelance Income"
        - "investments", "dividends", "stocks" → "Investment Income"
        - "business", "venture" → "Business Income"
        
        EXPENSE CATEGORIES (category_kind = 'expense'):
        - "food", "groceries", "eating out" → "Food & Dining"
        - "rent", "mortgage", "housing" → "Housing"
        - "transport", "car", "gas", "commute" → "Transportation"
        - "utilities", "electricity", "water", "internet" → "Utilities"
        - "entertainment", "fun", "hobbies" → "Entertainment"
        
        CRITICAL: Always use exact category names from the database, not approximations.
        """

        prompt = f"""
        You are enhancing a financial query for SQL generation.

        DATABASE SCHEMA:
        {schema_info}

        {category_mapping_info}

        ENHANCEMENT RULES:
        1. Map vague terms to exact database category names
        2. Specify category_kind filters when relevant  
        3. Reference appropriate LLM views
        4. Make the query precise for accurate data retrieval
        5. DO NOT include response formatting instructions

        USER QUESTION: "{user_query}"

        Enhanced question (focus on data retrieval, not response formatting):
        """
        
        try:
            enhanced_query = self.llm.invoke(prompt).strip()
            logger.info(f"Enhanced query: '{user_query}' -> '{enhanced_query}'")
            return enhanced_query
        except Exception as e:
            logger.error(f"Prompt enhancement failed: {e}")
            return user_query