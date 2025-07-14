# ────────────────────────────────────────────────────────────────────────────────
# Project-wide Makefile
# Root = frontend, backend lives in ./backend
# Requires:
#   CR_PAT      GitHub Container Registry token (write:packages)
#   NPM_TOKEN   GitHub Packages npm token (read/write:packages)
#   GH_USER     your GitHub username (default: hoangsonww)
# ────────────────────────────────────────────────────────────────────────────────

# User/config
GH_USER        ?= hoangsonww
BACKEND_DIR    := backend

# derive versions from package.json
FRONTEND_VERSION := $(shell node -p "require('./package.json').version")
BACKEND_VERSION  := $(shell cd $(BACKEND_DIR) && node -p "require('./package.json').version")

# image names
FRONTEND_IMAGE := ghcr.io/$(GH_USER)/ecommerce-fullstack-website-frontend
BACKEND_IMAGE  := ghcr.io/$(GH_USER)/fusion-electronics-backend

# npm package names
FRONTEND_PKG   := @$(GH_USER)/ecommerce-fullstack-website-frontend
BACKEND_PKG    := @$(GH_USER)/fusion-electronics-backend

# ────────────────────────────────────────────────────────────────────────────────
.PHONY: all help install build test \
        docker-build docker-push \
        publish-npm \
        clean

all: help

help:
	@echo "Usage:"
	@echo "  make install          # install both frontend & backend deps"
	@echo "  make build            # build both frontend & backend"
	@echo "  make test             # run tests (if any) for both"
	@echo
	@echo "  make docker-build     # docker build both images"
	@echo "  make docker-push      # push both to ghcr.io (uses CR_PAT)"
	@echo
	@echo "  make publish-npm      # npm publish both to GitHub Packages (uses NPM_TOKEN)"
	@echo
	@echo "  make clean            # cleanup node_modules and builds"
	@echo

# ────────────────────────────────────────────────────────────────────────────────
install: install-frontend install-backend

install-frontend:
	@echo "↪ Installing frontend deps..."
	npm ci

install-backend:
	@echo "↪ Installing backend deps..."
	cd $(BACKEND_DIR) && npm ci

# ────────────────────────────────────────────────────────────────────────────────
build: build-frontend build-backend

build-frontend:
	@echo "↪ Building frontend..."
	npm run build

build-backend:
	@echo "↪ Building backend..."
	cd $(BACKEND_DIR) && npm run build

# ────────────────────────────────────────────────────────────────────────────────
test: test-frontend test-backend

test-frontend:
	@echo "↪ Testing frontend..."
	# insert your frontend test command here, e.g. npm test
	@echo "(no tests configured)"

test-backend:
	@echo "↪ Testing backend..."
	# insert your backend test command here, e.g. cd backend && npm test
	@echo "(no tests configured)"

# ────────────────────────────────────────────────────────────────────────────────
docker-build: docker-build-frontend docker-build-backend

docker-build-frontend:
	@echo "↪ Docker build frontend → $(FRONTEND_IMAGE):$(FRONTEND_VERSION)"
	docker build \
	  -t $(FRONTEND_IMAGE):$(FRONTEND_VERSION) \
	  -t $(FRONTEND_IMAGE):latest \
	  -f Dockerfile \
	  .

docker-build-backend:
	@echo "↪ Docker build backend → $(BACKEND_IMAGE):$(BACKEND_VERSION)"
	docker build \
	  -t $(BACKEND_IMAGE):$(BACKEND_VERSION) \
	  -t $(BACKEND_IMAGE):latest \
	  -f $(BACKEND_DIR)/Dockerfile \
	  $(BACKEND_DIR)

docker-push: ## push both images (requires CR_PAT)
	@echo "↪ Pushing to GitHub Container Registry..."
	@if [ -z "$(CR_PAT)" ]; then \
	  echo "❌ CR_PAT is not set"; exit 1; \
	fi
	echo "$(CR_PAT)" | docker login ghcr.io -u "$(GH_USER)" --password-stdin
	docker push $(FRONTEND_IMAGE):$(FRONTEND_VERSION)
	docker push $(FRONTEND_IMAGE):latest
	docker push $(BACKEND_IMAGE):$(BACKEND_VERSION)
	docker push $(BACKEND_IMAGE):latest

# ────────────────────────────────────────────────────────────────────────────────
publish-npm: publish-frontend-npm publish-backend-npm

publish-frontend-npm:
	@echo "↪ npm publish frontend → $(FRONTEND_PKG)@$(FRONTEND_VERSION)"
	@if [ -z "$(NPM_TOKEN)" ]; then \
	  echo "❌ NPM_TOKEN is not set"; exit 1; \
	fi
	npm config set //npm.pkg.github.com/:_authToken "$(NPM_TOKEN)"
	npm publish --access public

publish-backend-npm:
	@echo "↪ npm publish backend → $(BACKEND_PKG)@$(BACKEND_VERSION)"
	@if [ -z "$(NPM_TOKEN)" ]; then \
	  echo "❌ NPM_TOKEN is not set"; exit 1; \
	fi
	cd $(BACKEND_DIR) && \
	npm config set //npm.pkg.github.com/:_authToken "$(NPM_TOKEN)" && \
	npm publish --access public

# ────────────────────────────────────────────────────────────────────────────────
clean:
	@echo "↪ Cleaning..."
	rm -rf node_modules build
	cd $(BACKEND_DIR) && rm -rf node_modules build
