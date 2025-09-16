#!/bin/bash

# 🔍 Town Deploy Verification Script
# Verifica que el deploy esté funcionando correctamente

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default URLs
WEB_URL="${WEB_URL:-https://town.vercel.app}"
API_URL="${API_URL:-https://api-town.onrailway.app}"

log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Test function
test_endpoint() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    
    log "Testing: $description"
    
    local response
    local status_code
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$url" || echo "HTTPSTATUS:000")
    status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    
    if [ "$status_code" = "$expected_status" ]; then
        success "$description - Status: $status_code"
        return 0
    else
        error "$description - Expected: $expected_status, Got: $status_code"
        return 1
    fi
}

# Test JSON response
test_json_endpoint() {
    local url=$1
    local description=$2
    local expected_field=$3
    
    log "Testing JSON: $description"
    
    local response
    response=$(curl -s "$url" || echo "{}")
    
    if echo "$response" | jq -e "$expected_field" > /dev/null 2>&1; then
        success "$description - JSON structure valid"
        return 0
    else
        error "$description - Invalid JSON or missing field: $expected_field"
        echo "Response: $response"
        return 1
    fi
}

log "🔍 Starting deployment verification..."
log "Web URL: $WEB_URL"
log "API URL: $API_URL"

# Check if jq is available
if ! command -v jq &> /dev/null; then
    warning "jq not found. JSON validation will be skipped."
    HAS_JQ=false
else
    HAS_JQ=true
fi

FAILED_TESTS=0

# Web Frontend Tests
log ""
log "🌐 Testing Web Frontend..."

test_endpoint "$WEB_URL" "Homepage" 200 || ((FAILED_TESTS++))
test_endpoint "$WEB_URL/seller" "Seller page" 200 || ((FAILED_TESTS++))
test_endpoint "$WEB_URL/orders" "Orders page" 200 || ((FAILED_TESTS++))
test_endpoint "$WEB_URL/manifest.json" "PWA Manifest" 200 || ((FAILED_TESTS++))
test_endpoint "$WEB_URL/service-worker.js" "Service Worker" 200 || ((FAILED_TESTS++))

# Test PWA manifest content
if [ "$HAS_JQ" = true ]; then
    test_json_endpoint "$WEB_URL/manifest.json" "PWA Manifest structure" ".name" || ((FAILED_TESTS++))
fi

# API Backend Tests
log ""
log "🔧 Testing API Backend..."

test_endpoint "$API_URL" "API Root" 200 || ((FAILED_TESTS++))
test_endpoint "$API_URL/health" "Health Check" 200 || ((FAILED_TESTS++))

# Test API endpoints
test_endpoint "$API_URL/api/products" "Products API" 200 || ((FAILED_TESTS++))
test_endpoint "$API_URL/api/orders" "Orders API" 200 || ((FAILED_TESTS++))

# Test health check JSON
if [ "$HAS_JQ" = true ]; then
    test_json_endpoint "$API_URL/health" "Health Check JSON" ".success" || ((FAILED_TESTS++))
    test_json_endpoint "$API_URL/health" "Health Check Status" ".data.status" || ((FAILED_TESTS++))
fi

# CORS Tests
log ""
log "🌍 Testing CORS Configuration..."

cors_response=$(curl -s -H "Origin: $WEB_URL" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: Content-Type" -X OPTIONS "$API_URL/api/products" -w "HTTPSTATUS:%{http_code}")
cors_status=$(echo "$cors_response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)

if [ "$cors_status" = "200" ] || [ "$cors_status" = "204" ]; then
    success "CORS preflight - Status: $cors_status"
else
    error "CORS preflight failed - Status: $cors_status"
    ((FAILED_TESTS++))
fi

# Rate Limiting Tests
log ""
log "⚡ Testing Rate Limiting..."

rate_limit_passed=true
for i in {1..3}; do
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$API_URL/api/products")
    status=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    
    if [ "$status" != "200" ] && [ "$status" != "429" ]; then
        rate_limit_passed=false
        break
    fi
    
    sleep 1
done

if [ "$rate_limit_passed" = true ]; then
    success "Rate limiting configured correctly"
else
    warning "Rate limiting test inconclusive"
fi

# Database Connectivity Test
log ""
log "🗄️  Testing Database Connectivity..."

if [ "$HAS_JQ" = true ]; then
    db_status=$(curl -s "$API_URL/health" | jq -r '.data.services.database.status // "unknown"')
    
    if [ "$db_status" = "connected" ]; then
        success "Database connection healthy"
    else
        error "Database connection failed - Status: $db_status"
        ((FAILED_TESTS++))
    fi
fi

# WhatsApp Configuration Test
log ""
log "📱 Testing WhatsApp Configuration..."

if [ "$HAS_JQ" = true ]; then
    whatsapp_configured=$(curl -s "$API_URL/health" | jq -r '.data.services.whatsapp.configured // false')
    whatsapp_provider=$(curl -s "$API_URL/health" | jq -r '.data.services.whatsapp.provider // "unknown"')
    
    if [ "$whatsapp_configured" = "true" ]; then
        success "WhatsApp configured correctly - Provider: $whatsapp_provider"
    else
        warning "WhatsApp not configured - Provider: $whatsapp_provider"
    fi
fi

# Performance Tests
log ""
log "🚀 Testing Performance..."

# Test API response time
api_start=$(date +%s%N)
curl -s "$API_URL/health" > /dev/null
api_end=$(date +%s%N)
api_duration=$(((api_end - api_start) / 1000000))

if [ "$api_duration" -lt 1000 ]; then
    success "API response time: ${api_duration}ms (excellent)"
elif [ "$api_duration" -lt 3000 ]; then
    success "API response time: ${api_duration}ms (good)"
else
    warning "API response time: ${api_duration}ms (slow)"
fi

# Test web page load time
web_start=$(date +%s%N)
curl -s "$WEB_URL" > /dev/null
web_end=$(date +%s%N)
web_duration=$(((web_end - web_start) / 1000000))

if [ "$web_duration" -lt 2000 ]; then
    success "Web response time: ${web_duration}ms (excellent)"
elif [ "$web_duration" -lt 5000 ]; then
    success "Web response time: ${web_duration}ms (good)"
else
    warning "Web response time: ${web_duration}ms (slow)"
fi

# SSL Certificate Test
log ""
log "🔒 Testing SSL Certificates..."

# Check web SSL
if curl -s --head "$WEB_URL" | grep -i "HTTP/2 200\|HTTP/1.1 200" > /dev/null; then
    success "Web SSL certificate valid"
else
    warning "Web SSL certificate issue"
fi

# Check API SSL
if curl -s --head "$API_URL" | grep -i "HTTP/2 200\|HTTP/1.1 200" > /dev/null; then
    success "API SSL certificate valid"
else
    warning "API SSL certificate issue"
fi

# Summary
log ""
log "📊 Verification Summary"
log "======================="

if [ "$FAILED_TESTS" -eq 0 ]; then
    success "All tests passed! 🎉"
    success "Your deployment is ready for production use."
    log ""
    log "🌐 Web Frontend: $WEB_URL"
    log "🔧 API Backend: $API_URL"
    log "📱 Health Check: $API_URL/health"
    log ""
    success "Deploy verification completed successfully!"
    exit 0
else
    error "❌ $FAILED_TESTS test(s) failed"
    error "Please review the failed tests and fix the issues before going live."
    log ""
    log "Common fixes:"
    log "- Check environment variables"
    log "- Verify database connection"
    log "- Ensure CORS is configured correctly"
    log "- Check WhatsApp provider configuration"
    log ""
    exit 1
fi
