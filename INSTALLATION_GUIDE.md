# Installation and Verification Guide

## Quick Start

### 1. Install Backend Dependencies and Run Tests

```bash
cd company-policy-ai/backend
npm install
npm test
```

**Expected Output:**
- All tests should pass
- Coverage report generated in `coverage/` directory
- `coverage/lcov.info` file created for SonarQube

### 2. Install Frontend Dependencies and Run Tests

```bash
cd ../frontend
npm install
npm test
```

**Expected Output:**
- All tests should pass
- Coverage report generated in `coverage/` directory
- `coverage/lcov.info` file created for SonarQube

### 3. Configure SonarQube Webhook (Critical for Quality Gate)

**In SonarQube Admin Panel:**
1. Navigate to: Administration → Configuration → Webhooks
2. Click "Create"
3. Fill in:
   - **Name:** `Jenkins`
   - **URL:** `http://your-jenkins-server:8080/sonarqube-webhook/`
   - **Secret:** (optional, but recommended)
4. Save

**Note:** Replace `your-jenkins-server` with your actual Jenkins URL.

### 4. Verify SonarQube Configuration

```bash
# From project root
cat sonar-project.properties
```

Verify these key settings:
- ✓ Coverage paths configured
- ✓ Test exclusions set
- ✓ Quality gate timeout set to 600 seconds

### 5. Run Jenkins Pipeline

**Option A: Through Jenkins UI**
1. Go to your Jenkins job
2. Click "Build Now"
3. Monitor the console output

**Option B: Trigger via CLI** (if configured)
```bash
curl -X POST http://your-jenkins-server:8080/job/your-job-name/build
```

**Expected Pipeline Flow:**
```
1. Checkout ✓
2. Install Backend Dependencies ✓
3. Install Frontend Dependencies ✓
4. Run Backend Tests ✓
5. Run Frontend Tests ✓
6. SonarQube Analysis ✓
7. Quality Gate (Wait for webhook) ✓
8. Gitleaks Scan ✓
9. Docker Build ✓
10. Security Scans ✓
11. Push Images ✓
12. Deploy ✓
```

### 6. Verify Quality Gate Results

**In SonarQube Dashboard:**
1. Go to Projects → RAGPDF
2. Check:
   - ✓ Code coverage percentage
   - ✓ Quality Gate status
   - ✓ Issues resolved
   - ✓ Code smells reduced

**Expected Metrics:**
- Coverage: 70-80%
- Bugs: 0
- Code Smells: Minimal
- Security Hotspots: Reviewed

---

## Troubleshooting

### Issue: "Module not found" errors during tests

**Solution:**
```bash
# Backend
cd company-policy-ai/backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

### Issue: Quality Gate still times out

**Root Causes & Solutions:**

1. **Webhook not configured:**
   - Configure webhook in SonarQube (see step 3 above)
   - Verify Jenkins URL is accessible from SonarQube server

2. **SonarQube Compute Engine stuck:**
   - Check SonarQube logs: `/opt/sonarqube/logs/ce.log`
   - Restart SonarQube: `sudo systemctl restart sonarqube`
   - Check database connections and disk space

3. **Network issues:**
   - Verify Jenkins can reach SonarQube server
   - Check firewall rules
   - Test connection: `curl http://sonarqube-server:9000`

4. **Task actually failing:**
   - Check SonarQube → Administration → Projects → Background Tasks
   - Find the failed task and view error logs
   - Common issues: Out of memory, database connection

**Emergency Fix (Temporary):**
In Jenkinsfile, you can make Quality Gate optional:
```groovy
environment {
    SONAR_ABORT_ON_FAILURE = 'false'  // Set to 'true' to enforce
}
```

### Issue: Tests failing

**Backend Test Failures:**
```bash
cd company-policy-ai/backend
npm test -- --verbose
```

Common issues:
- MongoDB connection (tests should use mocks, not real DB)
- Environment variables missing (use test .env)

**Frontend Test Failures:**
```bash
cd company-policy-ai/frontend
npm test -- --reporter=verbose
```

Common issues:
- jsdom not installed: `npm install jsdom`
- React Testing Library issues: Clear cache `npm test -- --clearCache`

### Issue: Coverage reports not found

**Verify files exist:**
```bash
ls -la company-policy-ai/backend/coverage/lcov.info
ls -la company-policy-ai/frontend/coverage/lcov.info
```

**If missing:**
1. Run tests again with coverage flag
2. Check test configuration (jest.config.js, vitest.config.js)
3. Ensure test scripts have `--coverage` flag

### Issue: SonarQube analysis fails

**Check scanner logs:**
```bash
# In Jenkins console output
grep -A 50 "ERROR"
```

**Common issues:**
- Project key mismatch
- Invalid sonar-project.properties syntax
- Scanner version compatibility
- Token/authentication issues

**Manual test:**
```bash
# From project root
sonar-scanner -X  # -X for debug mode
```

---

## Verification Checklist

Before considering the setup complete, verify:

- [ ] Backend tests pass with >70% coverage
- [ ] Frontend tests pass with >70% coverage
- [ ] SonarQube webhook configured and accessible
- [ ] Jenkins pipeline completes all stages
- [ ] Quality Gate receives webhook response
- [ ] Quality Gate status displayed correctly
- [ ] Coverage reports visible in SonarQube
- [ ] No major code smells reported
- [ ] Application still functions correctly

---

## Performance Notes

### Expected Timings:

| Stage | Duration |
|-------|----------|
| Checkout | 10-30s |
| Install Dependencies (Backend) | 30-60s |
| Install Dependencies (Frontend) | 30-60s |
| Run Backend Tests | 10-30s |
| Run Frontend Tests | 10-30s |
| SonarQube Analysis | 2-5 min |
| Quality Gate Wait | 1-2 min |
| Docker Build | 2-5 min |
| Security Scans | 2-4 min |
| Deploy | 1-2 min |
| **Total** | **10-20 min** |

### If Pipeline Takes Longer:

1. **Dependencies installation slow:**
   - Use npm ci instead of npm install
   - Consider caching node_modules in Jenkins

2. **Tests slow:**
   - Run in parallel: `npm test -- --maxWorkers=4`
   - Skip flaky tests in CI

3. **SonarQube analysis slow:**
   - Large codebase (normal)
   - Compute Engine underpowered (upgrade hardware)
   - Many historical branches (clean up)

4. **Docker build slow:**
   - Enable BuildKit: `DOCKER_BUILDKIT=1`
   - Use multi-stage builds (already implemented)
   - Consider build cache

---

## Additional Commands

### View Test Coverage Locally:

**Backend:**
```bash
cd company-policy-ai/backend
npm test
# Open coverage/index.html in browser
```

**Frontend:**
```bash
cd company-policy-ai/frontend
npm test
# Open coverage/index.html in browser
```

### Run Specific Tests:

**Backend:**
```bash
npm test analyticsController.test.js
npm test ragService.test.js
```

**Frontend:**
```bash
npm test Dashboard.test.jsx
npm test AuthContext.test.jsx
```

### Watch Mode for Development:

**Backend:**
```bash
npm run test:watch
```

**Frontend:**
```bash
npm run test:watch
# Or with UI:
npm run test:ui
```

---

## Next Steps

After successful installation and verification:

1. **Add More Tests:**
   - Document controller tests
   - Chat controller tests
   - More component tests

2. **Improve Coverage:**
   - Target 80%+ coverage
   - Focus on critical paths

3. **Set Up Branch Analysis:**
   - Configure pull request decoration
   - Add quality gates for branches

4. **Monitor Regularly:**
   - Set up SonarQube notifications
   - Review security hotspots
   - Track technical debt

---

## Support and Debugging

### Useful Log Locations:

**Jenkins:**
- Console output in build page
- System log: Jenkins → Manage Jenkins → System Log

**SonarQube:**
- Web logs: `/opt/sonarqube/logs/web.log`
- Compute Engine: `/opt/sonarqube/logs/ce.log`
- Elasticsearch: `/opt/sonarqube/logs/es.log`

**Application:**
- Backend: Check console output or logs directory
- Frontend: Browser console (F12)

### Contact Points:

If issues persist:
1. Check SonarQube community forums
2. Review Jenkins pipeline documentation
3. Check project-specific documentation

---

**Status:** All fixes implemented and ready for testing  
**Last Updated:** November 18, 2026  
**Version:** 1.0.0
