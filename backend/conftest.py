"""
Pytest configuration for backend tests
"""

import sys
from pathlib import Path

# Add backend directory to Python path to allow importing app module
backend_dir = Path(__file__).parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
