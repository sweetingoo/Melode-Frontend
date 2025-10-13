#!/bin/bash
# Environment Switcher Script for Melode Frontend
# Usage: ./switch-env.sh [development|staging|production]

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
JS_DIR="$SCRIPT_DIR/js"

# Function to display usage
usage() {
    echo -e "${BLUE}🌍 Melode Frontend - Environment Switcher${NC}"
    echo ""
    echo "Usage: ./switch-env.sh [environment]"
    echo ""
    echo "Available environments:"
    echo "  development  - Local development (http://127.0.0.1:8000)"
    echo "  staging      - Staging server (https://melode-api-staging.onrender.com)"
    echo "  production   - Production server (https://api.melode.com)"
    echo ""
    echo "Example: ./switch-env.sh staging"
    exit 1
}

# Function to switch environment
switch_environment() {
    local env=$1
    local source_file="$JS_DIR/config.$env.js"
    local target_file="$JS_DIR/config.js"

    if [ ! -f "$source_file" ]; then
        echo -e "${RED}❌ Error: Configuration file not found: $source_file${NC}"
        exit 1
    fi

    # Backup current config if it exists
    if [ -f "$target_file" ]; then
        cp "$target_file" "$target_file.backup"
        echo -e "${YELLOW}📦 Backed up current config to config.js.backup${NC}"
    fi

    # Copy the new config
    cp "$source_file" "$target_file"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Successfully switched to $env environment!${NC}"
        echo ""
        
        # Display the API URL
        case $env in
            development)
                echo -e "${BLUE}📍 API URL: http://127.0.0.1:8000/api/v1${NC}"
                ;;
            staging)
                echo -e "${BLUE}📍 API URL: https://melode-api-staging.onrender.com/api/v1${NC}"
                ;;
            production)
                echo -e "${BLUE}📍 API URL: https://api.melode.com/api/v1${NC}"
                ;;
        esac
        
        echo ""
        echo -e "${YELLOW}💡 Tip: Clear your browser cache (Ctrl+Shift+R) to apply changes${NC}"
    else
        echo -e "${RED}❌ Failed to switch environment${NC}"
        exit 1
    fi
}

# Main script logic
if [ $# -eq 0 ]; then
    usage
fi

ENV=$1

case $ENV in
    development|dev)
        switch_environment "development"
        ;;
    staging|stage)
        switch_environment "staging"
        ;;
    production|prod)
        switch_environment "production"
        ;;
    *)
        echo -e "${RED}❌ Error: Unknown environment '$ENV'${NC}"
        echo ""
        usage
        ;;
esac

