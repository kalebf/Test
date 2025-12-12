# clarifi_agent/agents/__init__.py
import sys
import os

# Add backend to path before importing any agents
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Now import the agents
from .data_handler import DataHandler
from .query_runner import QueryRunner
from .intent_classifier import IntentClassifier
from .prompt_enhancer import PromptEnhancer


__all__ = [
    'DataHandler',
    'QueryRunner', 
    'IntentClassifier',
    'PromptEnhancer',
]