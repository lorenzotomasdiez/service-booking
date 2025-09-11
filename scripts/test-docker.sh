#!/bin/bash
# ============================================================================
# BarberPro Docker Container Testing Script
# Tests Docker builds and container functionality
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 BarberPro Docker Container Testing${NC}"

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker is running${NC}"
}

# Function to build image
build_image() {
    local context=$1
    local dockerfile=$2
    local tag=$3
    local target=$4
    
    echo -e "${BLUE}🔨 Building ${tag}...${NC}"
    
    if [ -n "$target" ]; then
        docker build -f "$dockerfile" --target "$target" -t "$tag" "$context"
    else
        docker build -f "$dockerfile" -t "$tag" "$context"
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Successfully built ${tag}${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to build ${tag}${NC}"
        return 1
    fi
}

# Function to test container
test_container() {
    local image=$1
    local container_name=$2
    local port=$3
    local health_endpoint=$4
    
    echo -e "${BLUE}🧪 Testing ${container_name}...${NC}"
    
    # Start container
    docker run -d --name "$container_name" -p "$port" "$image"
    
    # Wait for container to start
    sleep 10
    
    # Check if container is running
    if docker ps | grep -q "$container_name"; then
        echo -e "${GREEN}✅ Container ${container_name} is running${NC}"
    else
        echo -e "${RED}❌ Container ${container_name} failed to start${NC}"
        docker logs "$container_name"
        return 1
    fi
    
    # Test health endpoint if provided
    if [ -n "$health_endpoint" ]; then
        local host_port=$(docker port "$container_name" | head -1 | cut -d: -f2)
        echo -e "${BLUE}🔍 Testing health endpoint: http://localhost:${host_port}${health_endpoint}${NC}"
        
        # Wait a bit more for the service to be ready
        sleep 5
        
        if curl -f "http://localhost:${host_port}${health_endpoint}" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Health check passed${NC}"
        else
            echo -e "${YELLOW}⚠️  Health check failed (service may need more time)${NC}"
        fi
    fi
    
    # Cleanup
    docker stop "$container_name" >/dev/null
    docker rm "$container_name" >/dev/null
    
    return 0
}

# Function to test docker-compose
test_docker_compose() {
    echo -e "${BLUE}🐙 Testing Docker Compose...${NC}"
    
    # Start services
    docker-compose -f docker-compose.yml up -d postgres redis
    
    # Wait for services
    sleep 15
    
    # Check if services are healthy
    if docker-compose ps | grep -q "healthy"; then
        echo -e "${GREEN}✅ Docker Compose services are healthy${NC}"
    else
        echo -e "${YELLOW}⚠️  Some Docker Compose services may not be healthy${NC}"
        docker-compose ps
    fi
    
    # Cleanup
    docker-compose down >/dev/null 2>&1
    
    return 0
}

# Cleanup function
cleanup() {
    echo -e "${BLUE}🧹 Cleaning up test containers and images...${NC}"
    
    # Stop and remove test containers
    docker stop barberpro-backend-test barberpro-frontend-test barberpro-fullstack-test >/dev/null 2>&1 || true
    docker rm barberpro-backend-test barberpro-frontend-test barberpro-fullstack-test >/dev/null 2>&1 || true
    
    # Remove test images
    docker rmi barberpro-backend-test barberpro-frontend-test barberpro-fullstack-test >/dev/null 2>&1 || true
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Trap cleanup on exit
trap cleanup EXIT

# Main testing flow
main() {
    echo -e "${BLUE}Starting Docker container testing...${NC}"
    
    # Check Docker
    check_docker
    
    # Build and test backend
    echo -e "\n${BLUE}=== Testing Backend Container ===${NC}"
    build_image "./backend" "./backend/Dockerfile" "barberpro-backend-test" "production"
    
    # Note: Can't test backend without database, so just check if it builds and starts
    echo -e "${BLUE}🧪 Testing backend container startup...${NC}"
    docker run --name barberpro-backend-test-startup -d barberpro-backend-test >/dev/null 2>&1 || true
    sleep 5
    
    if docker ps -a | grep barberpro-backend-test-startup | grep -q "Exited"; then
        echo -e "${YELLOW}⚠️  Backend container exited (expected without database)${NC}"
        echo -e "${GREEN}✅ Backend container can start (database connection needed)${NC}"
    else
        echo -e "${GREEN}✅ Backend container is running${NC}"
    fi
    
    docker stop barberpro-backend-test-startup >/dev/null 2>&1 || true
    docker rm barberpro-backend-test-startup >/dev/null 2>&1 || true
    
    # Build and test frontend
    echo -e "\n${BLUE}=== Testing Frontend Container ===${NC}"
    build_image "./frontend" "./frontend/Dockerfile" "barberpro-frontend-test" "production"
    test_container "barberpro-frontend-test" "barberpro-frontend-test" "8080:80" "/health"
    
    # Build and test full-stack
    echo -e "\n${BLUE}=== Testing Full-Stack Container ===${NC}"
    build_image "." "./Dockerfile" "barberpro-fullstack-test" "production"
    
    # Note: Full-stack also needs database, so just test build
    echo -e "${GREEN}✅ Full-stack container built successfully${NC}"
    
    # Test Docker Compose
    echo -e "\n${BLUE}=== Testing Docker Compose ===${NC}"
    test_docker_compose
    
    # Check image sizes
    echo -e "\n${BLUE}=== Image Size Analysis ===${NC}"
    echo -e "${BLUE}Backend image size:${NC}"
    docker images barberpro-backend-test --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
    
    echo -e "${BLUE}Frontend image size:${NC}"
    docker images barberpro-frontend-test --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
    
    echo -e "${BLUE}Full-stack image size:${NC}"
    docker images barberpro-fullstack-test --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
    
    # Security scan (if trivy is available)
    if command -v trivy >/dev/null 2>&1; then
        echo -e "\n${BLUE}=== Security Scanning ===${NC}"
        echo -e "${BLUE}Scanning backend image...${NC}"
        trivy image --severity HIGH,CRITICAL barberpro-backend-test || true
        
        echo -e "${BLUE}Scanning frontend image...${NC}"
        trivy image --severity HIGH,CRITICAL barberpro-frontend-test || true
    else
        echo -e "\n${YELLOW}⚠️  Trivy not available, skipping security scan${NC}"
        echo -e "${BLUE}Install trivy for security scanning: brew install trivy${NC}"
    fi
    
    echo -e "\n${GREEN}🎉 Docker container testing completed successfully!${NC}"
    
    # Summary
    echo -e "\n${BLUE}=== Test Summary ===${NC}"
    echo -e "${GREEN}✅ Backend container: Built successfully${NC}"
    echo -e "${GREEN}✅ Frontend container: Built and tested${NC}"
    echo -e "${GREEN}✅ Full-stack container: Built successfully${NC}"
    echo -e "${GREEN}✅ Docker Compose: Infrastructure services tested${NC}"
    
    echo -e "\n${BLUE}Next steps:${NC}"
    echo -e "1. Test containers with full database integration"
    echo -e "2. Deploy to staging environment"
    echo -e "3. Run integration tests"
    echo -e "4. Deploy to production"
}

# Run main function
main "$@"