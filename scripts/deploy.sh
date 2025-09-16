#!/bin/bash

# 🚀 Town Deploy Script
# Automatiza el proceso de deploy para desarrollo y producción

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "web" ] || [ ! -d "api" ]; then
    error "Please run this script from the project root directory"
fi

# Parse command line arguments
ENVIRONMENT="development"
SKIP_TESTS=false
SKIP_BUILD=false
DEPLOY_WEB=true
DEPLOY_API=true

while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --web-only)
            DEPLOY_API=false
            shift
            ;;
        --api-only)
            DEPLOY_WEB=false
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -e, --environment ENV    Set environment (development|staging|production)"
            echo "  --skip-tests            Skip running tests"
            echo "  --skip-build            Skip build steps"
            echo "  --web-only              Deploy only web frontend"
            echo "  --api-only              Deploy only API backend"
            echo "  -h, --help              Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --environment production"
            echo "  $0 --web-only --skip-tests"
            echo "  $0 --api-only --environment staging"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

log "Starting Town deploy process..."
log "Environment: $ENVIRONMENT"
log "Deploy Web: $DEPLOY_WEB"
log "Deploy API: $DEPLOY_API"

# Check prerequisites
log "Checking prerequisites..."

# Check Node.js version
if ! command -v node &> /dev/null; then
    error "Node.js is not installed"
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    error "Node.js version 18 or higher is required (found: $(node -v))"
fi

# Check npm
if ! command -v npm &> /dev/null; then
    error "npm is not installed"
fi

# Check git status
if [ -n "$(git status --porcelain)" ]; then
    warning "You have uncommitted changes. Consider committing them first."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Install dependencies
log "Installing dependencies..."
npm install

if [ "$DEPLOY_WEB" = true ]; then
    log "Installing web dependencies..."
    cd web
    npm install
    cd ..
fi

if [ "$DEPLOY_API" = true ]; then
    log "Installing API dependencies..."
    cd api
    npm install
    cd ..
fi

# Run tests
if [ "$SKIP_TESTS" = false ]; then
    log "Running tests..."
    
    if [ "$DEPLOY_WEB" = true ]; then
        log "Running web tests..."
        cd web
        npm run type-check || error "Web type check failed"
        npm run lint || error "Web linting failed"
        cd ..
    fi
    
    if [ "$DEPLOY_API" = true ]; then
        log "Running API tests..."
        cd api
        npm run type-check || error "API type check failed"
        npm run lint || error "API linting failed"
        cd ..
    fi
    
    success "All tests passed!"
fi

# Build projects
if [ "$SKIP_BUILD" = false ]; then
    if [ "$DEPLOY_WEB" = true ]; then
        log "Building web frontend..."
        cd web
        npm run build || error "Web build failed"
        success "Web build completed!"
        cd ..
    fi
    
    if [ "$DEPLOY_API" = true ]; then
        log "Building API backend..."
        cd api
        npm run build || error "API build failed"
        success "API build completed!"
        cd ..
    fi
fi

# Environment-specific deployments
case $ENVIRONMENT in
    "development")
        log "Development deployment - starting local servers..."
        
        if [ "$DEPLOY_API" = true ]; then
            log "Starting API in development mode..."
            cd api
            npm run dev &
            API_PID=$!
            cd ..
            sleep 3
        fi
        
        if [ "$DEPLOY_WEB" = true ]; then
            log "Starting web in development mode..."
            cd web
            npm run dev &
            WEB_PID=$!
            cd ..
        fi
        
        success "Development servers started!"
        log "API: http://localhost:4000"
        log "Web: http://localhost:4321"
        log "Press Ctrl+C to stop servers"
        
        # Wait for user interrupt
        trap 'kill $API_PID $WEB_PID 2>/dev/null; exit' INT
        wait
        ;;
        
    "staging"|"production")
        log "Preparing for $ENVIRONMENT deployment..."
        
        # Check required environment variables
        if [ "$DEPLOY_API" = true ]; then
            cd api
            if [ ! -f ".env.$ENVIRONMENT" ] && [ ! -f ".env" ]; then
                warning "No environment file found for API"
                log "Make sure to set environment variables in your deployment platform"
            fi
            
            # Check database connection
            if command -v railway &> /dev/null; then
                log "Testing database connection..."
                railway run npx prisma db push --accept-data-loss || warning "Database connection test failed"
            fi
            cd ..
        fi
        
        if [ "$DEPLOY_WEB" = true ]; then
            cd web
            if [ ! -f ".env.$ENVIRONMENT" ] && [ ! -f ".env" ]; then
                warning "No environment file found for web"
                log "Make sure PUBLIC_API_BASE_URL is set in Vercel"
            fi
            cd ..
        fi
        
        # Deploy instructions
        log "Manual deployment steps:"
        
        if [ "$DEPLOY_WEB" = true ]; then
            log "Web Frontend (Vercel):"
            log "  1. Push to main branch: git push origin main"
            log "  2. Or deploy manually: cd web && npx vercel --prod"
            log "  3. Verify at: https://town.vercel.app"
        fi
        
        if [ "$DEPLOY_API" = true ]; then
            log "API Backend (Railway/Render):"
            log "  1. Railway: railway up"
            log "  2. Render: git push origin main (auto-deploy)"
            log "  3. Run migrations: npm run deploy:migrate"
            log "  4. Verify at: https://api-town.onrailway.app/health"
        fi
        
        success "Deployment preparation complete!"
        ;;
        
    *)
        error "Unknown environment: $ENVIRONMENT"
        ;;
esac

log "Deploy process completed successfully! 🎉"
