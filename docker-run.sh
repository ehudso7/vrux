#!/bin/bash

# VRUX Docker Runner Script
# This script helps you run VRUX in Docker with proper configuration

set -e

echo "🚀 VRUX Docker Setup"
echo "===================="

# Function to check if .env file exists
check_env_file() {
    if [ ! -f .env ]; then
        echo "⚠️  No .env file found. Creating from template..."
        cp .env.docker .env
        echo "✅ Created .env file from template"
        echo ""
        echo "📝 Please edit .env file and add your API keys:"
        echo "   - OPENAI_API_KEY"
        echo "   - ANTHROPIC_API_KEY"
        echo ""
        echo "💡 Tip: The app will work without API keys using the mock provider"
        echo ""
    fi
}

# Function to build and run production
run_production() {
    echo "🏗️  Building production image..."
    docker-compose build
    
    echo "🚀 Starting VRUX in production mode..."
    docker-compose up -d
    
    echo ""
    echo "✅ VRUX is running!"
    echo "🌐 Open http://localhost:3000 in your browser"
    echo ""
    echo "📊 View logs: docker-compose logs -f"
    echo "🛑 Stop: docker-compose down"
}

# Function to run development
run_development() {
    echo "🏗️  Building development image..."
    docker-compose -f docker-compose.dev.yml build
    
    echo "🚀 Starting VRUX in development mode..."
    docker-compose -f docker-compose.dev.yml up
}

# Function to stop containers
stop_containers() {
    echo "🛑 Stopping VRUX containers..."
    docker-compose down
    docker-compose -f docker-compose.dev.yml down
    echo "✅ All containers stopped"
}

# Function to clean up
cleanup() {
    echo "🧹 Cleaning up Docker resources..."
    docker-compose down -v --rmi all
    docker-compose -f docker-compose.dev.yml down -v --rmi all
    echo "✅ Cleanup complete"
}

# Main menu
echo "Select an option:"
echo "1) Run in production mode"
echo "2) Run in development mode (with hot reload)"
echo "3) Stop all containers"
echo "4) Clean up (remove containers, images, volumes)"
echo "5) Exit"
echo ""
read -p "Enter your choice (1-5): " choice

# Check for .env file
check_env_file

case $choice in
    1)
        run_production
        ;;
    2)
        run_development
        ;;
    3)
        stop_containers
        ;;
    4)
        cleanup
        ;;
    5)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac