# Company Policy AI Assistant

> **RAG-Based Document Intelligence & AI Chatbot**  
> Full-Stack MERN · Selenium E2E · Jenkins CI/CD · Docker · AWS · Kubernetes · SonarQube · Prometheus · Grafana

---

## Project Overview

The **Company Policy AI Assistant** is a production-grade, enterprise-style **Retrieval-Augmented Generation (RAG)** platform that enables authenticated HR and Admin users to upload company policy PDFs. Documents are automatically extracted, chunked, embedded with **Google Gemini**, and stored in **MongoDB Vector Search** to power an AI chatbot that delivers grounded, citation-backed answers.

The project spans the full software delivery lifecycle — from feature development and automated testing through containerization, infrastructure provisioning, CI/CD pipelines, and production monitoring.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Application Features](#application-features)
5. [Testing Strategy](#testing-strategy)
6. [CI/CD Pipeline — Jenkins](#cicd-pipeline--jenkins)
7. [Code Quality — SonarQube](#code-quality--sonarqube)
8. [Containerization — Docker](#containerization--docker)
9. [Infrastructure — Terraform + AWS](#infrastructure--terraform--aws)
10. [Kubernetes Deployment — K3s](#kubernetes-deployment--k3s)
11. [Monitoring — Prometheus & Grafana](#monitoring--prometheus--grafana)
12. [Local Development Setup](#local-development-setup)
13. [Environment Variables](#environment-variables)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Users (Browser)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                    ┌────────▼─────────┐
                    │  Nginx Ingress   │  (K3s / AWS EC2)
                    └──┬──────────┬───┘
                       │          │
              ┌────────▼──┐  ┌────▼───────┐
              │  Frontend │  │  Backend   │
              │  React/   │  │ Node.js /  │
              │  Vite     │  │ Express    │
              └───────────┘  └─────┬──────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │         MongoDB Atlas        │
                    │  Documents · Chunks ·        │
                    │  Vector Embeddings ·         │
                    │  Users · Conversations       │
                    └─────────────────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │     Google Gemini API        │
                    │  Embeddings + Chat (RAG)     │
                    └─────────────────────────────┘
```

**CI/CD Flow:**

```
GitHub Push → Jenkins → SonarQube Analysis → Quality Gate
           → Docker Build → Docker Hub Push
           → SSH → EC2 K3s → kubectl rollout restart
           → Prometheus / Grafana Monitoring
```

---

## Tech Stack

### Application

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, React Router v6, Tailwind CSS, Axios, Lucide Icons |
| **Backend** | Node.js, Express, ES Modules, JWT, bcryptjs, Multer, pdf-parse |
| **Database** | MongoDB Atlas (Vector Search enabled) |
| **AI / Embeddings** | Google Gemini API (`@google/genai`) |
| **Auth** | JWT Bearer tokens, bcrypt password hashing, RBAC (admin / hr / employee) |

### DevOps & Infrastructure

| Domain | Technology |
|--------|-----------|
| **Containerization** | Docker, Docker Hub (`sarvnoorkaur/ragpdf-backend`, `sarvnoorkaur/ragpdf-frontend`) |
| **CI/CD** | Jenkins (declarative pipeline), GitHub SCM |
| **Code Quality** | SonarQube, SonarScanner, Quality Gates |
| **Infrastructure** | Terraform (AWS VPC, subnets, security groups, EC2) |
| **Orchestration** | Kubernetes / K3s on AWS EC2 |
| **Ingress** | Nginx Ingress Controller |
| **Monitoring** | Prometheus, Grafana |

### Testing

| Type | Tool |
|------|------|
| **E2E / UI Automation** | Selenium WebDriver 4, Python, pytest, Page Object Model |
| **REST API Testing** | Postman (manual + collection-based) |
| **Test Reporting** | pytest-html |
| **Test Runner** | pytest with `@pytest.mark.e2e` markers |

---

## Project Structure

```
ragpdf/
│
├── company-policy-ai/
│   ├── backend/
│   │   ├── config/              ← MongoDB connection
│   │   ├── controllers/         ← authController, documentController, chatController
│   │   ├── middleware/          ← authMiddleware (JWT), RBAC
│   │   ├── models/              ← User, Document, Chunk, Conversation
│   │   ├── routes/              ← /api/auth, /api/documents, /api/chat, /api/rag
│   │   ├── services/            ← geminiService, embeddingService
│   │   ├── server.js
│   │   └── Dockerfile
│   │
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── context/         ← AuthContext (global auth state)
│   │   │   ├── pages/
│   │   │   │   ├── LandingPage.jsx
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Register.jsx
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── AdminDocuments.jsx   ← PDF upload & management
│   │   │   │   ├── DocumentDetails.jsx  ← Chunk preview
│   │   │   │   └── Chat.jsx             ← AI chatbot interface
│   │   │   └── services/        ← chatService.js, axios config
│   │   ├── vite.config.js       ← port 5173
│   │   └── Dockerfile
│   │
│   ├── k8s/                     ← Kubernetes manifests
│   │   ├── namespace.yaml
│   │   ├── backend-deployment.yaml
│   │   ├── frontend-deployment.yaml
│   │   └── ingress.yaml
│   │
│   └── docker-compose.yml       ← Local multi-container setup
│
├── selenium-tests/              ← Automated E2E test suite
│   ├── conftest.py              ← WebDriver fixtures, screenshot-on-fail
│   ├── pytest.ini
│   ├── requirements.txt
│   ├── pages/                   ← Page Object Model classes
│   │   ├── login_page.py
│   │   ├── signup_page.py
│   │   ├── dashboard_page.py
│   │   └── chatbot_page.py
│   ├── tests/
│   │   ├── test_homepage.py
│   │   ├── test_signup.py
│   │   ├── test_login.py
│   │   ├── test_dashboard.py
│   │   ├── test_pdf_upload.py
│   │   └── test_chatbot.py
│   ├── test_data/sample.pdf
│   └── README.md
│
├── terraform/                   ← AWS infrastructure as code
│   ├── main.tf
│   ├── vpc.tf
│   ├── internet-gateway.tf
│   ├── security-groups.tf
│   ├── ec2.tf
│   ├── outputs.tf
│   └── terraform.tfvars
│
├── Jenkinsfile                  ← Declarative CI/CD pipeline
├── sonar-project.properties     ← SonarQube scanner config
└── .gitignore
```

---

## Application Features

### Authentication & RBAC
- JWT-based stateless authentication
- Passwords hashed with **bcryptjs**
- Three roles: `admin`, `hr`, `employee`
- Protected routes — only `admin` and `hr` can upload/manage documents

### PDF Upload & Processing Pipeline
1. User uploads a PDF via the Admin Documents page
2. **Multer** handles the multipart form upload
3. **pdf-parse** extracts raw text
4. Text is split into overlapping chunks (sliding window)
5. Each chunk is embedded using **Google Gemini Embeddings API**
6. Chunks + embeddings stored in MongoDB

### RAG Chatbot
1. User sends a question in the chat interface
2. The question is embedded and a **MongoDB Vector Search** query retrieves the most relevant chunks
3. Retrieved chunks are passed as context to **Gemini** with a system prompt
4. The AI generates a grounded answer, citing source documents and page numbers
5. Conversations are persisted per user in MongoDB

---

## Testing Strategy

This project follows a **Shift-Left Testing** approach — automated validation happens before any build or deployment stage.

### Functional & Negative Test Scenarios (Manual/Postman)
- **Authentication:** valid login, invalid credentials, missing fields, duplicate registration
- **Protected Routes:** unauthorized access to `/api/documents`, `/api/chat` without JWT
- **Document Upload:** valid PDF, wrong file type, missing title, size limits
- **Chatbot:** empty question, large question, unauthenticated request
- **Input Validation:** SQL/NoSQL injection attempt responses, malformed JSON

### REST API Testing (Postman)
Endpoint coverage across:
| Endpoint | Methods Tested |
|----------|---------------|
| `POST /api/auth/register` | Valid, duplicate email, missing fields |
| `POST /api/auth/login` | Valid, wrong password, unknown email |
| `GET /api/documents` | Authenticated, unauthenticated |
| `POST /api/documents/upload` | Valid PDF, invalid type, no auth |
| `POST /api/chat/message` | Valid question, empty body, no auth |
| `GET /health` | Uptime check |

### Selenium E2E Tests (Automated)
Implemented with **Python · Selenium 4 · pytest · Page Object Model**:

| Test | Description |
|------|-------------|
| `test_homepage` | Verify landing page hero, Login link, Register link |
| `test_signup` | Register a new user with unique timestamped email |
| `test_valid_login` | Login → Dashboard loads |
| `test_invalid_login` | Wrong credentials → error message, stays on `/login` |
| `test_dashboard_components` | Dashboard renders, Logout navigates away |
| `test_pdf_upload` | Open modal → `send_keys(sample.pdf)` → verify success indicator |
| `test_chatbot_conversation` | Send question → wait for non-empty AI response |

**Key practices:**
- `WebDriverWait` + `expected_conditions` everywhere — zero `time.sleep()` calls
- `data-testid` selectors on all interactive elements
- Screenshot captured automatically on test failure → `selenium-tests/screenshots/`
- Configurable via environment variables (`SELENIUM_BASE_URL`, `SELENIUM_HEADLESS`)

**Run the tests:**
```powershell
# One-time setup
python -m venv venv && venv\Scripts\activate
pip install -r selenium-tests\requirements.txt

# Set credentials
$env:SELENIUM_TEST_EMAIL="admin@company.com"
$env:SELENIUM_TEST_PASSWORD="YourPassword123!"

# Run all tests
cd selenium-tests && pytest -v

# Headless
$env:SELENIUM_HEADLESS="true"; pytest -v
```

---

## CI/CD Pipeline — Jenkins

Declarative pipeline defined in [`Jenkinsfile`](./Jenkinsfile):

```
Checkout SCM
     │
     ▼
SonarQube Analysis
     │
     ▼
Quality Gate (abort if failed)
     │
     ▼
Build Backend Docker Image
     │
     ▼
Build Frontend Docker Image
     │
     ▼
Push to Docker Hub
     │
     ▼
Test SSH Connection to EC2
     │
     ▼
Deploy to EC2 K3s (kubectl rollout restart)
     │
     ▼
Verify Deployments (get pods/deployments)
```

**Key Jenkins credentials configured:**
| Credential ID | Type | Purpose |
|---------------|------|---------|
| `dockerhub` | Username/Password | Docker Hub push access |
| `ec2-ssh` | SSH Private Key | SSH into AWS EC2 for K3s deployment |

**Docker images published:**
- `sarvnoorkaur/ragpdf-backend:latest`
- `sarvnoorkaur/ragpdf-frontend:latest`

---

## Code Quality — SonarQube

Configured via [`sonar-project.properties`](./sonar-project.properties):

```
sonar.projectKey=ragpdf-mono
sonar.sources=company-policy-ai/frontend/src,company-policy-ai/backend
sonar.exclusions=**/node_modules/**,**/dist/**,**/.env*,**/*.pdf,...
```

**What SonarQube checks:**
- Code smells and duplications
- Security vulnerabilities (e.g., hardcoded secrets, injection risks)
- Cognitive complexity
- Test coverage (when configured)
- Quality Gate — pipeline **aborts** if gate fails before any build or deployment

---

## Containerization — Docker

Both services have production Dockerfiles. The frontend uses a multi-stage build:

```bash
# Build locally
docker-compose -f company-policy-ai/docker-compose.yml up --build

# Or individual images
docker build -t ragpdf-backend ./company-policy-ai/backend
docker build --build-arg VITE_API_URL=/api -t ragpdf-frontend ./company-policy-ai/frontend
```

`VITE_API_URL=/api` is set at **build time** so the frontend proxies API calls through the Nginx Ingress rather than directly to the backend port.

---

## Infrastructure — Terraform + AWS

Infrastructure provisioned in [`terraform/`](./terraform/):

| Resource | Description |
|----------|-------------|
| VPC | Isolated network with public subnet |
| Internet Gateway | Outbound internet access |
| Route Tables | Public routing for EC2 subnet |
| Security Groups | Allow HTTP (80), HTTPS (443), SSH (22), NodePort (30000-32767) |
| EC2 Instance | Ubuntu — hosts K3s + all Kubernetes workloads |

**Provision infrastructure:**
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

---

## Kubernetes Deployment — K3s

K3s (lightweight Kubernetes) runs on a single AWS EC2 instance. Manifests in `company-policy-ai/k8s/`:

| Manifest | Purpose |
|----------|---------|
| `namespace.yaml` | `ragpdf` namespace |
| `backend-deployment.yaml` | Backend Deployment + Service |
| `frontend-deployment.yaml` | Frontend Deployment + Service |
| `ingress.yaml` | Nginx Ingress — routes `/api/*` to backend, `/*` to frontend |

**Deploy manually:**
```bash
kubectl apply -f company-policy-ai/k8s/
kubectl get pods -n ragpdf
kubectl get svc -n ragpdf
```

**Rolling updates triggered by Jenkins:**
```bash
kubectl rollout restart deployment ragpdf-backend -n ragpdf
kubectl rollout restart deployment ragpdf-frontend -n ragpdf
```

---

## Monitoring — Prometheus & Grafana

Deployed on the same K3s cluster using the `kube-prometheus-stack` Helm chart:

| Tool | Purpose |
|------|---------|
| **Prometheus** | Scrapes metrics from Node Exporter, kube-state-metrics, cAdvisor |
| **Grafana** | Dashboards for CPU/memory, pod health, resource usage, service availability |

**Key dashboards configured:**
- Kubernetes cluster resource usage (CPU, memory, network I/O)
- Pod status (running / pending / failed)
- Node health and uptime
- Application-level request metrics (via Nginx Ingress metrics)

---

## Local Development Setup

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas connection string)
- Google Gemini API key
- Python ≥ 3.9 (for Selenium tests)
- Google Chrome (latest)

### 1. Backend

```powershell
cd company-policy-ai\backend
cp .env.example .env
# Fill in MONGO_URI, JWT_SECRET, GEMINI_API_KEY, CLIENT_URL
npm install
npm run dev
# → http://localhost:5000
```

### 2. Frontend

```powershell
cd company-policy-ai\frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000
npm install
npm run dev
# → http://localhost:5173
```

### 3. Selenium Tests

```powershell
python -m venv venv && venv\Scripts\activate
pip install -r selenium-tests\requirements.txt

$env:SELENIUM_TEST_EMAIL    = "admin@company.com"
$env:SELENIUM_TEST_PASSWORD = "Password123!"

cd selenium-tests
pytest -v
```

---

## Environment Variables

### Backend (`company-policy-ai/backend/.env`)

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `GEMINI_API_KEY` | Google Gemini API key |
| `PORT` | Backend port (default: `5000`) |
| `CLIENT_URL` | Frontend origin for CORS (default: `http://localhost:5173`) |

### Frontend (`company-policy-ai/frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend base URL (e.g., `http://localhost:5000`) |

### Selenium Tests (environment variables — never committed)

| Variable | Description |
|----------|-------------|
| `SELENIUM_BASE_URL` | Frontend URL (default: `http://localhost:5173`) |
| `SELENIUM_TEST_EMAIL` | Pre-registered test user email |
| `SELENIUM_TEST_PASSWORD` | Test user password |
| `SELENIUM_HEADLESS` | Set `true` for headless Chrome (CI/Docker) |

---

## Key Engineering Decisions

| Decision | Rationale |
|----------|-----------|
| **Page Object Model for Selenium** | Maintainability — locators and actions in one place, not scattered across tests |
| **`data-testid` over XPath** | Stable selectors that survive UI refactors |
| **Selenium Manager (no manual chromedriver)** | Zero driver management overhead — Selenium 4 auto-resolves the driver |
| **`WebDriverWait` over `time.sleep()`** | Tests wait for actual app state, not arbitrary delays |
| **SonarQube before Docker build** | Fail fast on quality issues before expensive build/push/deploy stages |
| **K3s over full K8s** | Single-node lightweight Kubernetes suitable for a single EC2 instance without sacrificing manifest compatibility |
| **Terraform for infra** | Reproducible, version-controlled infrastructure — teardown and rebuild in minutes |

---

*Built end-to-end as a demonstration of full-lifecycle software engineering: from feature development and automated testing through CI/CD, cloud infrastructure, container orchestration, and production observability.*
