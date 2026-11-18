# Jenkins Pipeline Quick Reference

## 🚀 Pipeline Stages Overview

| # | Stage | Blocking? | Purpose |
|---|-------|-----------|---------|
| 1 | Checkout | ✅ YES | Get code from Git |
| 2 | Install Backend Dependencies | ✅ YES | npm install backend |
| 3 | Install Frontend Dependencies | ✅ YES | npm install frontend |
| 4 | **Run Backend Tests** | ❌ **NO** | Execute backend tests + coverage |
| 5 | **Run Frontend Tests** | ❌ **NO** | Execute frontend tests + coverage |
| 6 | **SonarQube Analysis** | ❌ **NO** | Run code quality scan |
| 7 | **Quality Gate** | ❌ **NO** | Check SonarQube thresholds |
| 8 | Gitleaks Secret Scan | ❌ NO | Scan for secrets |
| 9 | Build Backend Image | ✅ YES | Docker build backend |
| 10 | Build Frontend Image | ✅ YES | Docker build frontend |
| 11 | Generate SBOM | ❌ NO | Create software bill of materials |
| 12 | Grype Vulnerability Scan | ❌ NO | Scan for vulnerabilities |
| 13 | Push to Docker Hub | ✅ YES | Push images to registry |
| 14 | Test EC2 SSH | ✅ YES | Verify EC2 connection |
| 15 | Deploy to EC2 K3s | ✅ YES | K8s rolling update |
| 16 | Verify Deployments | ✅ YES | Check K8s pods |
| 17 | Pipeline Summary | ⚪ INFO | Display summary report |

---

## 📊 Status Messages

### Test Status
```
✅ Backend tests: PASSED
❌ Backend tests: FAILED (Exit Code: 1)
✅ Frontend tests: PASSED
❌ Frontend tests: FAILED (Exit Code: 1)
```

### Coverage Status
```
[COVERAGE] Backend coverage report: AVAILABLE
[COVERAGE] Frontend coverage report: NOT FOUND
```

### SonarQube Status
```
✅ SonarScanner execution: SUCCESS
⚠️ SonarScanner execution: FAILED (Exit Code: 1)
❌ SonarScanner exception: [error]
```

### Quality Gate Status
```
✅ Quality Gate: PASSED
❌ Quality Gate: FAILED (Status: ERROR)
⏭️ Skipped (SonarScanner did not complete successfully)
```

---

## 🎯 Build Results

### SUCCESS ✅
All quality checks passed + Deployment succeeded

### UNSTABLE ⚠️
Quality checks failed (non-blocking) + Deployment succeeded
- Tests failed, or
- SonarScanner failed, or
- Quality Gate failed

### FAILURE ❌
Critical infrastructure failure
- Docker build failed
- Docker push failed
- K8s deployment failed
- Dependency installation failed

---

## 🔍 Quick Troubleshooting

### "Backend tests FAILED"
```bash
# Check test output in Jenkins console
# Run tests locally:
cd company-policy-ai\backend
npm test
```

### "Quality Gate FAILED"
```
1. Open: http://localhost:9000/dashboard?id=ragpdf-mono
2. Review failed conditions (usually coverage < 80%)
3. Add more tests to improve coverage
4. Re-run pipeline
```

### "SonarScanner execution FAILED"
```
1. Check SonarQube is running: http://localhost:9000
2. Verify coverage reports exist:
   - backend/coverage/lcov.info
   - frontend/coverage/lcov.info
3. Check SonarScanner configuration in Jenkins
```

---

## 📋 Environment Variables

| Variable | Values | Usage |
|----------|--------|-------|
| `BACKEND_TEST_STATUS` | PASSED/FAILED | Track backend test result |
| `FRONTEND_TEST_STATUS` | PASSED/FAILED | Track frontend test result |
| `BACKEND_COVERAGE_AVAILABLE` | YES/NO | Coverage report exists? |
| `FRONTEND_COVERAGE_AVAILABLE` | YES/NO | Coverage report exists? |
| `SONAR_SCAN_STATUS` | SUCCESS/FAILED/ERROR | SonarScanner result |
| `QUALITY_GATE_STATUS` | PASSED/FAILED/SKIPPED | Quality Gate result |

---

## 🔗 Useful Links

- **Jenkins:** http://localhost:8084
- **SonarQube:** http://localhost:9000
- **SonarQube Project:** http://localhost:9000/dashboard?id=ragpdf-mono

---

## 🧪 Test Commands

### Run Tests Locally

**Backend:**
```bash
cd company-policy-ai\backend
npm test
```

**Frontend:**
```bash
cd company-policy-ai\frontend
npm test
```

### Check Coverage Reports
```bash
# Backend
dir company-policy-ai\backend\coverage\lcov.info

# Frontend
dir company-policy-ai\frontend\coverage\lcov.info
```

### Run SonarScanner Manually
```bash
# From project root
C:\sonarqube\sonar-scanner\bin\sonar-scanner.bat
```

---

## ⚙️ Configuration Files

- **Jenkinsfile:** Pipeline definition
- **sonar-project.properties:** SonarQube configuration
- **backend/package.json:** Backend test script
- **frontend/package.json:** Frontend test script

---

## 💡 Tips

1. **Review UNSTABLE builds weekly** - Don't ignore quality issues
2. **Fix tests before merging** - Don't accumulate test debt
3. **Monitor coverage trends** - Aim for steady improvement
4. **Use Quality Gate as guide** - Not as absolute blocker
5. **Deploy hotfixes freely** - Quality checks won't block urgent fixes

---

**Quick Actions:**

```bash
# Trigger Pipeline
git push origin main

# View Latest Build
http://localhost:8084/job/ragpdf/lastBuild/

# View SonarQube
http://localhost:9000/dashboard?id=ragpdf-mono

# Check Logs
http://localhost:8084/job/ragpdf/lastBuild/console
```
