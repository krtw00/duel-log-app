#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Get the directory of the script
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
cd "$SCRIPT_DIR"

# Function to print section headers
print_section_header() {
  echo -e "\033[0;36m==================================================\033[0m"
  echo -e "\033[0;36m$1\033[0m"
  echo -e "\033[0;36m--------------------------------------------------\033[0m"
  echo -e ""
}

# Function to deactivate virtual environment
deactivate_venv() {
  if command -v deactivate &> /dev/null; then
    echo ""
    echo -e "\033[0;33mDeactivating virtual environment...\033[0m"
    deactivate
    echo -e "\033[0;32m✅ Virtual environment deactivated.\033[0m"
  fi
}

# Trap to ensure venv is deactivated and script exits with error code on failure
trap 'deactivate_venv; echo -e "\033[0;31m❌ CI script failed!\033[0m"; exit 1' ERR

print_section_header "[1/4] Checking environment..."

# Python check
PYTHON_CMD=""
if command -v python3.12 &> /dev/null; then
  PYTHON_CMD="python3.12"
elif command -v python3 &> /dev/null; then
  PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
  PYTHON_CMD="python"
fi

if [ -n "$PYTHON_CMD" ]; then
  PYTHON_VERSION=$("$PYTHON_CMD" --version 2>&1)
  echo -e "\\033[0;32m✅ Python found: $PYTHON_VERSION (using $PYTHON_CMD)\\033[0m"
else
  echo -e "\\033[0;31m❌ Python 3.11 or higher not found or not in PATH. Please install it.\\033[0m"
  exit 1
fi

# Node.js check
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  echo -e "\033[0;32m✅ Node.js found: $NODE_VERSION\033[0m"
else
  echo -e "\033[0;31m❌ Node.js not found or not in PATH. Please install Node.js 20 or higher.\033[0m"
  exit 1
fi
echo ""

# --- Backend Setup and Test ---
print_section_header "[2/4] Running backend setup and tests..."

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
  echo -e "\033[0;33mPython virtual environment not found. Creating...\033[0m"
  "$PYTHON_CMD" -m venv venv
  if [ ! -f "venv/bin/activate" ]; then
    echo -e "\033[0;31m❌ Failed to create Python virtual environment. Please run 'python -m venv venv' manually to check for issues.\033[0m"
    exit 1
  fi
  echo -e "\033[0;32m✅ Virtual environment created.\033[0m"
fi

# Activate virtual environment
source venv/bin/activate
echo -e "\033[0;32m✅ Virtual environment activated.\033[0m"

# Install backend dependencies
echo -e "\033[0;33mInstalling backend dependencies...\033[0m"
  "$PYTHON_CMD" -m pip install --upgrade pip -q
pip install --no-cache-dir -r backend/requirements.txt -q
echo -e "\033[0;32m✅ Backend dependencies are up to date.\033[0m"

# Run backend tests
echo -e "\033[0;33mRunning backend tests...\033[0m"
pushd backend > /dev/null
export PYTHONPATH="."
export DATABASE_URL="sqlite:///./ci_test.db"
export SECRET_KEY="a_very_secure_and_long_32_char_test_secret_key"
export DEBUG="true"
export RESEND_API_KEY="testing"
export PYTEST_ADDOPTS="-o cache_dir=.pytest_cache_ci"
rm -f ci_test.db
pytest --tb=short --quiet
popd > /dev/null
echo -e "\033[0;32m✅ Backend tests passed!\033[0m"
echo ""

# --- Frontend Setup and Test ---
print_section_header "[3/4] Running frontend setup and tests..."

pushd frontend > /dev/null
# Force clean install of frontend dependencies
echo -e "\033[0;33mCleaning and installing frontend dependencies... (This may take a moment)\033[0m"
rm -rf node_modules
npm install
echo -e "\033[0;32m✅ Frontend dependencies installed.\033[0m"

# Run frontend tests
echo -e "\033[0;33mRunning frontend tests...\033[0m"
npm run test:unit
popd > /dev/null
echo -e "\033[0;32m✅ Frontend tests passed!\033[0m"
echo ""

# --- Completion ---
print_section_header "[4/4] All checks completed!"

echo -e "\033[0;32m🎉 All tests passed! 🎉\033[0m"
echo -e ""
echo -e "\033[0;33mNext steps:\033[0m"
echo -e "  1. git add ."
echo -e "  2. git commit -m "your message""
echo -e "  3. git push origin main"
echo -e ""
echo -e "\033[0;32mIt's safe to push to GitHub!\033[0m"

# Deactivate virtual environment on successful exit
deactivate_venv

exit 0
