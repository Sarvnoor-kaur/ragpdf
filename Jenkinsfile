pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = 'dockerhub'
        DOCKERHUB_USERNAME = 'sarvnoorkaur'
        BACKEND_IMAGE = "${DOCKERHUB_USERNAME}/ragpdf-backend:latest"
        FRONTEND_IMAGE = "${DOCKERHUB_USERNAME}/ragpdf-frontend:latest"
        // Tool paths for Syft and Grype (absolute paths for Windows service account)
        SYFT_PATH = 'C:\\Users\\sarvn\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Anchore.Syft_Microsoft.Winget.Source_8wekyb3d8bbwe\\syft.exe'
        GRYPE_PATH = 'C:\\Users\\sarvn\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Anchore.Grype_Microsoft.Winget.Source_8wekyb3d8bbwe\\grype.exe'
        // Absolute path to Gitleaks executable (installed via WinGet)
        GITLEAKS_PATH = 'C:\\Users\\sarvn\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gitleaks.Gitleaks_Microsoft.Winget.Source_8wekyb3d8bbwe\\gitleaks.exe'
        EC2_PUBLIC_IP = '13.205.64.224'
        SSH_CREDENTIALS_ID = 'ec2-ssh'
        SSH_USER = 'ubuntu'

        // Git for Windows SSH
        GIT_SSH = 'C:\\Program Files\\Git\\usr\\bin\\ssh.exe'
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out code from GitHub...'
                checkout scm
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                echo 'Installing backend dependencies...'
                bat 'cd company-policy-ai\\backend && npm install'
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                echo 'Installing frontend dependencies...'
                bat 'cd company-policy-ai\\frontend && npm install'
            }
        }

        stage('Run Backend Tests') {
            steps {
                script {
                    echo '========================================='
                    echo 'Running backend tests with coverage...'
                    echo '========================================='
                    
                    def testResult = bat(
                        script: 'cd company-policy-ai\\backend && npm test',
                        returnStatus: true
                    )
                    
                    if (testResult == 0) {
                        echo '[TEST STATUS] ✅ Backend tests: PASSED'
                        env.BACKEND_TEST_STATUS = 'PASSED'
                    } else {
                        echo '[TEST STATUS] ❌ Backend tests: FAILED (Exit Code: ' + testResult + ')'
                        echo 'Continuing pipeline despite test failure...'
                        env.BACKEND_TEST_STATUS = 'FAILED'
                        currentBuild.result = 'UNSTABLE'
                    }
                    
                    // Check if coverage report was generated
                    if (fileExists('company-policy-ai/backend/coverage/lcov.info')) {
                        echo '[COVERAGE] Backend coverage report: AVAILABLE'
                        env.BACKEND_COVERAGE_AVAILABLE = 'YES'
                    } else {
                        echo '[COVERAGE] Backend coverage report: NOT FOUND'
                        env.BACKEND_COVERAGE_AVAILABLE = 'NO'
                    }
                }
            }
        }

        stage('Run Frontend Tests') {
            steps {
                script {
                    echo '========================================='
                    echo 'Running frontend tests with coverage...'
                    echo '========================================='
                    
                    def testResult = bat(
                        script: 'cd company-policy-ai\\frontend && npm test',
                        returnStatus: true
                    )
                    
                    if (testResult == 0) {
                        echo '[TEST STATUS] ✅ Frontend tests: PASSED'
                        env.FRONTEND_TEST_STATUS = 'PASSED'
                    } else {
                        echo '[TEST STATUS] ❌ Frontend tests: FAILED (Exit Code: ' + testResult + ')'
                        echo 'Continuing pipeline despite test failure...'
                        env.FRONTEND_TEST_STATUS = 'FAILED'
                        currentBuild.result = 'UNSTABLE'
                    }
                    
                    // Check if coverage report was generated
                    if (fileExists('company-policy-ai/frontend/coverage/lcov.info')) {
                        echo '[COVERAGE] Frontend coverage report: AVAILABLE'
                        env.FRONTEND_COVERAGE_AVAILABLE = 'YES'
                    } else {
                        echo '[COVERAGE] Frontend coverage report: NOT FOUND'
                        env.FRONTEND_COVERAGE_AVAILABLE = 'NO'
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    echo '========================================='
                    echo 'Running SonarQube Analysis...'
                    echo '========================================='
                    
                    // Check coverage reports
                    def backendCoverage = fileExists('company-policy-ai/backend/coverage/lcov.info')
                    def frontendCoverage = fileExists('company-policy-ai/frontend/coverage/lcov.info')
                    
                    echo "[SONAR] Backend coverage exists: ${backendCoverage}"
                    echo "[SONAR] Frontend coverage exists: ${frontendCoverage}"
                    
                    // Run SonarScanner - non-blocking
                    def scanResult = 0
                    try {
                        withSonarQubeEnv('SonarQubeServer') {
                            def scannerHome = tool 'SonarScanner'
                            scanResult = bat(
                                script: "${scannerHome}\\bin\\sonar-scanner.bat",
                                returnStatus: true
                            )
                        }
                        
                        if (scanResult == 0) {
                            echo '[SONAR STATUS] ✅ SonarScanner execution: SUCCESS'
                            env.SONAR_SCAN_STATUS = 'SUCCESS'
                        } else {
                            echo "[SONAR STATUS] ⚠️ SonarScanner execution: FAILED (Exit Code: ${scanResult})"
                            echo 'Continuing pipeline despite scanner failure...'
                            env.SONAR_SCAN_STATUS = 'FAILED'
                            currentBuild.result = 'UNSTABLE'
                        }
                    } catch (Exception e) {
                        echo "[SONAR STATUS] ❌ SonarScanner exception: ${e.message}"
                        echo 'Continuing pipeline despite scanner exception...'
                        env.SONAR_SCAN_STATUS = 'ERROR'
                        currentBuild.result = 'UNSTABLE'
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                script {
                    echo '========================================='
                    echo 'Checking SonarQube Quality Gate...'
                    echo '========================================='
                    
                    // Only check Quality Gate if scanner succeeded
                    if (env.SONAR_SCAN_STATUS == 'SUCCESS') {
                        try {
                            timeout(time: 10, unit: 'MINUTES') {
                                def qg = waitForQualityGate()
                                
                                if (qg.status == 'OK') {
                                    echo '[QUALITY GATE] ✅ Quality Gate: PASSED'
                                    env.QUALITY_GATE_STATUS = 'PASSED'
                                } else {
                                    echo "[QUALITY GATE] ❌ Quality Gate: FAILED (Status: ${qg.status})"
                                    echo '========================================='
                                    echo 'Quality Gate Failure Details:'
                                    echo '========================================='
                                    
                                    // Display failed conditions if available
                                    if (qg.conditions) {
                                        qg.conditions.each { condition ->
                                            echo "- ${condition.metricKey}: ${condition.status} (Actual: ${condition.actualValue}, Threshold: ${condition.errorThreshold})"
                                        }
                                    }
                                    
                                    echo '========================================='
                                    echo 'View full report: http://localhost:9000/dashboard?id=ragpdf-mono'
                                    echo 'Continuing pipeline despite Quality Gate failure...'
                                    echo '========================================='
                                    
                                    env.QUALITY_GATE_STATUS = 'FAILED'
                                    currentBuild.result = 'UNSTABLE'
                                }
                            }
                        } catch (Exception e) {
                            echo "[QUALITY GATE] ⚠️ Quality Gate check exception: ${e.message}"
                            echo 'Continuing pipeline despite Quality Gate exception...'
                            env.QUALITY_GATE_STATUS = 'ERROR'
                            currentBuild.result = 'UNSTABLE'
                        }
                    } else {
                        echo '[QUALITY GATE] ⏭️ Skipped (SonarScanner did not complete successfully)'
                        env.QUALITY_GATE_STATUS = 'SKIPPED'
                    }
                }
            }
        }

        stage('Gitleaks Secret Scan') {
            steps {
                script {
                    echo 'Running Gitleaks secret scan on source...'
                    catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                        bat "\"${GITLEAKS_PATH}\" detect --source . --redact --report-format json --report-path gitleaks-report.json --exit-code 0"
                    }
                    if (fileExists('gitleaks-report.json')) {
                        echo 'Gitleaks source scan completed. Report: gitleaks-report.json'
                    } else {
                        echo 'Warning: Gitleaks source report not generated.'
                    }

                    echo 'Running Gitleaks secret scan on Git history...'
                    catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                        bat "\"${GITLEAKS_PATH}\" detect --source . --redact --report-format json --report-path gitleaks-history-report.json --exit-code 0 --log-opts=\"--all\""
                    }
                    if (fileExists('gitleaks-history-report.json')) {
                        echo 'Gitleaks history scan completed. Report: gitleaks-history-report.json'
                    } else {
                        echo 'Warning: Gitleaks history report not generated.'
                    }
                }
            }
        }

        stage('Build Backend Image') {
            steps {
                echo 'Building backend Docker image...'
                bat "docker build -t ${BACKEND_IMAGE} ./company-policy-ai/backend"
            }
        }

        stage('Build Frontend Image') {
            steps {
                echo 'Building frontend Docker image with VITE_API_URL=/api...'
                bat "docker build --build-arg VITE_API_URL=/api -t ${FRONTEND_IMAGE} ./company-policy-ai/frontend"
            }
        }

        stage('Generate SBOM - Syft') {
            steps {
                echo 'Generating CycloneDX SBOMs with Syft...'
                bat "${SYFT_PATH} packages docker:${BACKEND_IMAGE} -o cyclonedx-json=sbom-backend.cdx.json"
                bat "${SYFT_PATH} packages docker:${FRONTEND_IMAGE} -o cyclonedx-json=sbom-frontend.cdx.json"
            }
        }

        stage('Grype Vulnerability Scan') {
            steps {
                script {
                    echo 'Scanning backend SBOM with Grype...'
                    // Ensure backend SBOM exists
                    if (!fileExists('sbom-backend.cdx.json')) {
                        echo 'Backend SBOM not found. Generating via Syft...'
                        bat "${SYFT_PATH} packages docker:${BACKEND_IMAGE} -o cyclonedx-json=sbom-backend.cdx.json"
                    }
                    // Run Grype scan (non-blocking)
                    catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                        bat "${GRYPE_PATH} sbom:sbom-backend.cdx.json -o json=grype-backend.json -o table=grype-backend.txt"
                    }
                    echo 'Backend vulnerability summary:'
                    bat "type grype-backend.txt"

                    echo 'Scanning frontend SBOM with Grype...'
                    // Ensure frontend SBOM exists
                    if (!fileExists('sbom-frontend.cdx.json')) {
                        echo 'Frontend SBOM not found. Generating via Syft...'
                        bat "${SYFT_PATH} packages docker:${FRONTEND_IMAGE} -o cyclonedx-json=sbom-frontend.cdx.json"
                    }
                    // Run Grype scan (non-blocking)
                    catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                        bat "${GRYPE_PATH} sbom:sbom-frontend.cdx.json -o json=grype-frontend.json -o table=grype-frontend.txt"
                    }
                    echo 'Frontend vulnerability summary:'
                    bat "type grype-frontend.txt"
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                echo 'Logging into Docker Hub...'

                withCredentials([
                    usernamePassword(
                        credentialsId: env.DOCKERHUB_CREDENTIALS,
                        passwordVariable: 'DOCKERHUB_PASS',
                        usernameVariable: 'DOCKERHUB_USER'
                    )
                ]) {

                    bat "echo %DOCKERHUB_PASS% | docker login -u %DOCKERHUB_USER% --password-stdin"

                    echo 'Pushing Backend Image...'
                    bat "docker push ${BACKEND_IMAGE}"

                    echo 'Pushing Frontend Image...'
                    bat "docker push ${FRONTEND_IMAGE}"
                }
            }
        }

        stage('Test EC2 SSH') {
            steps {
                echo 'Testing Jenkins SSH connection to EC2...'

                sshagent([env.SSH_CREDENTIALS_ID]) {
                    bat """
                        "${GIT_SSH}" -o StrictHostKeyChecking=no ${SSH_USER}@${EC2_PUBLIC_IP} "whoami"
                    """
                }
            }
        }

        stage('Deploy to EC2 K3s') {
            steps {
                echo 'SSH into EC2 and triggering Kubernetes rolling update...'

                sshagent([env.SSH_CREDENTIALS_ID]) {

                    bat """
                        "${GIT_SSH}" -o StrictHostKeyChecking=no ${SSH_USER}@${EC2_PUBLIC_IP} "sudo kubectl rollout restart deployment ragpdf-backend -n ragpdf"
                    """

                    bat """
                        "${GIT_SSH}" -o StrictHostKeyChecking=no ${SSH_USER}@${EC2_PUBLIC_IP} "sudo kubectl rollout restart deployment ragpdf-frontend -n ragpdf"
                    """
                }
            }
        }

        stage('Verify Deployments') {
            steps {
                echo 'Verifying Pods and Deployments...'

                sshagent([env.SSH_CREDENTIALS_ID]) {

                    bat """
                        "${GIT_SSH}" -o StrictHostKeyChecking=no ${SSH_USER}@${EC2_PUBLIC_IP} "sudo kubectl get deployments -n ragpdf"
                    """

                    bat """
                        "${GIT_SSH}" -o StrictHostKeyChecking=no ${SSH_USER}@${EC2_PUBLIC_IP} "sudo kubectl get pods -n ragpdf"
                    """
                }
            }
        }

        stage('Pipeline Summary') {
            steps {
                script {
                    echo ''
                    echo '═══════════════════════════════════════════════════════════════'
                    echo '                    PIPELINE EXECUTION SUMMARY                  '
                    echo '═══════════════════════════════════════════════════════════════'
                    echo ''
                    echo '📋 Test Results:'
                    echo "   Backend Tests:        ${env.BACKEND_TEST_STATUS ?: 'NOT RUN'}"
                    echo "   Frontend Tests:       ${env.FRONTEND_TEST_STATUS ?: 'NOT RUN'}"
                    echo ''
                    echo '📊 Coverage Reports:'
                    echo "   Backend Coverage:     ${env.BACKEND_COVERAGE_AVAILABLE ?: 'UNKNOWN'}"
                    echo "   Frontend Coverage:    ${env.FRONTEND_COVERAGE_AVAILABLE ?: 'UNKNOWN'}"
                    echo ''
                    echo '🔍 Code Quality:'
                    echo "   SonarScanner:         ${env.SONAR_SCAN_STATUS ?: 'NOT RUN'}"
                    echo "   Quality Gate:         ${env.QUALITY_GATE_STATUS ?: 'NOT CHECKED'}"
                    echo ''
                    echo '🐳 Docker & Deployment:'
                    echo '   Docker Build:         SUCCESS'
                    echo '   Docker Push:          SUCCESS'
                    echo '   K8s Deployment:       SUCCESS'
                    echo ''
                    
                    // Determine overall status message
                    def hasFailures = (env.BACKEND_TEST_STATUS == 'FAILED' || 
                                      env.FRONTEND_TEST_STATUS == 'FAILED' || 
                                      env.QUALITY_GATE_STATUS == 'FAILED')
                    
                    if (hasFailures) {
                        echo '⚠️  PIPELINE STATUS: UNSTABLE'
                        echo '   Non-blocking checks failed but deployment completed successfully'
                        echo '   Review test results and quality gate for details'
                    } else {
                        echo '✅ PIPELINE STATUS: SUCCESS'
                        echo '   All checks passed and deployment completed successfully'
                    }
                    
                    echo ''
                    echo '📎 Useful Links:'
                    echo '   SonarQube:    http://localhost:9000/dashboard?id=ragpdf-mono'
                    echo '   Jenkins:      http://localhost:8084'
                    echo ''
                    echo '═══════════════════════════════════════════════════════════════'
                    echo ''
                }
            }
        }
    }

    post {

        always {
            script {
                echo ''
                echo '═══════════════════════════════════════════════════════════════'
                echo '                  PIPELINE CLEANUP & ARCHIVING                  '
                echo '═══════════════════════════════════════════════════════════════'
                echo ''
            }
            
            echo 'Archiving test coverage reports...'

            // Archive test results and coverage reports
            script {
                if (fileExists('company-policy-ai/backend/coverage')) {
                    archiveArtifacts artifacts: 'company-policy-ai/backend/coverage/**/*', fingerprint: true, allowEmptyArchive: true
                    echo '✅ Backend coverage archived'
                } else {
                    echo '⚠️  Backend coverage not found'
                }
                
                if (fileExists('company-policy-ai/frontend/coverage')) {
                    archiveArtifacts artifacts: 'company-policy-ai/frontend/coverage/**/*', fingerprint: true, allowEmptyArchive: true
                    echo '✅ Frontend coverage archived'
                } else {
                    echo '⚠️  Frontend coverage not found'
                }
            }

            echo 'Archiving security scan reports...'
            // Archive SBOM and Grype reports regardless of success or failure
            archiveArtifacts artifacts: 'sbom-*.cdx.json, grype-*.json, grype-*.txt, gitleaks*.json', fingerprint: true, allowEmptyArchive: true
            
            echo 'Cleaning up Docker credentials...'
            bat "docker logout"

            echo 'Cleaning workspace...'
            cleanWs()
            
            echo ''
            echo '═══════════════════════════════════════════════════════════════'
            echo ''
        }

        success {
            script {
                echo ''
                echo '╔═══════════════════════════════════════════════════════════════╗'
                echo '║                  ✅ DEPLOYMENT SUCCESSFUL                     ║'
                echo '╚═══════════════════════════════════════════════════════════════╝'
                echo ''
                echo 'The RAGPDF application has been updated successfully!'
                echo ''
                
                // Show any warnings if tests/quality gate failed
                if (env.BACKEND_TEST_STATUS == 'FAILED' || 
                    env.FRONTEND_TEST_STATUS == 'FAILED' || 
                    env.QUALITY_GATE_STATUS == 'FAILED') {
                    echo '⚠️  Note: Some non-blocking checks failed.'
                    echo '   Review the Pipeline Summary for details.'
                    echo ''
                }
            }
        }

        failure {
            script {
                echo ''
                echo '╔═══════════════════════════════════════════════════════════════╗'
                echo '║                    ❌ PIPELINE FAILED                         ║'
                echo '╚═══════════════════════════════════════════════════════════════╝'
                echo ''
                echo '❌ Critical pipeline failure occurred!'
                echo ''
                echo 'This indicates a blocking failure in:'
                echo '  - Dependency installation'
                echo '  - Docker build/push'
                echo '  - Kubernetes deployment'
                echo '  - Infrastructure issues'
                echo ''
                echo 'Check the Jenkins console output above for error details.'
                echo ''
            }
        }

        unstable {
            script {
                echo ''
                echo '╔═══════════════════════════════════════════════════════════════╗'
                echo '║              ⚠️  PIPELINE COMPLETED WITH WARNINGS             ║'
                echo '╚═══════════════════════════════════════════════════════════════╝'
                echo ''
                echo '⚠️  Pipeline completed but with non-blocking failures:'
                echo ''
                
                if (env.BACKEND_TEST_STATUS == 'FAILED') {
                    echo '  ❌ Backend tests failed'
                }
                if (env.FRONTEND_TEST_STATUS == 'FAILED') {
                    echo '  ❌ Frontend tests failed'
                }
                if (env.SONAR_SCAN_STATUS == 'FAILED' || env.SONAR_SCAN_STATUS == 'ERROR') {
                    echo '  ❌ SonarScanner execution failed'
                }
                if (env.QUALITY_GATE_STATUS == 'FAILED') {
                    echo '  ❌ SonarQube Quality Gate failed'
                }
                
                echo ''
                echo '✅ Deployment completed successfully despite warnings'
                echo ''
                echo '📋 Action Required:'
                echo '  - Review test failures and fix failing tests'
                echo '  - Check SonarQube dashboard for code quality issues'
                echo '  - Address Quality Gate failures before next release'
                echo ''
                echo '🔗 SonarQube Dashboard:'
                echo '   http://localhost:9000/dashboard?id=ragpdf-mono'
                echo ''
            }
        }
    }
}





// previous jenkins file


// pipeline {
//     agent any
    
//     environment {
//         DOCKERHUB_CREDENTIALS = 'dockerhub'
//         DOCKERHUB_USERNAME = 'sarvnoorkaur'
//         BACKEND_IMAGE = "${DOCKERHUB_USERNAME}/ragpdf-backend:latest"
//         FRONTEND_IMAGE = "${DOCKERHUB_USERNAME}/ragpdf-frontend:latest"
        
//         // Ensure you define this parameter in your Jenkins job or replace it with actual IP
//         EC2_PUBLIC_IP = '13.233.203.127' 
//         SSH_CREDENTIALS_ID = 'ec2-ssh'
//         SSH_USER = 'ubuntu'
//     }

//     stages {
//         stage('Checkout') {
//             steps {
//                 echo 'Checking out code from GitHub...'
//                 checkout scm
//             }
//         }

//         stage('Build Backend Image') {
//             steps {
//                 echo 'Building backend Docker image...'
//                 bat "docker build -t ${BACKEND_IMAGE} ./company-policy-ai/backend"
//             }
//         }

//         stage('Build Frontend Image') {
//             steps {
//                 echo 'Building frontend Docker image with VITE_API_URL=/api...'
//                 bat "docker build --build-arg VITE_API_URL=/api -t ${FRONTEND_IMAGE} ./company-policy-ai/frontend"
//             }
//         }

//         stage('Push to Docker Hub') {
//             steps {
//                 echo 'Logging into Docker Hub...'
//                 withCredentials([usernamePassword(credentialsId: env.DOCKERHUB_CREDENTIALS, passwordVariable: 'DOCKERHUB_PASS', usernameVariable: 'DOCKERHUB_USER')]) {
//                     bat "echo %DOCKERHUB_PASS% | docker login -u %DOCKERHUB_USER% --password-stdin"
                    
//                     echo 'Pushing Backend Image...'
//                     bat "docker push ${BACKEND_IMAGE}"
                    
//                     echo 'Pushing Frontend Image...'
//                     bat "docker push ${FRONTEND_IMAGE}"
//                 }
//             }
//         }

//         stage('Deploy to EC2 K3s') {
//             steps {
//                 echo 'SSH into EC2 and triggering Kubernetes rolling update...'
//                 sshagent([env.SSH_CREDENTIALS_ID]) {
//                     // Force Kubernetes to pull the latest image by doing a rollout restart
//                     bat """
//                         ssh -o StrictHostKeyChecking=no ${SSH_USER}@${EC2_PUBLIC_IP} "sudo kubectl rollout restart deployment ragpdf-backend -n ragpdf"
//                     """
//                     bat """
//                         ssh -o StrictHostKeyChecking=no ${SSH_USER}@${EC2_PUBLIC_IP} "sudo kubectl rollout restart deployment ragpdf-frontend -n ragpdf"
//                     """
//                 }
//             }
//         }

//         stage('Verify Deployments') {
//             steps {
//                 echo 'Verifying Pods and Deployments...'
//                 sshagent([env.SSH_CREDENTIALS_ID]) {
//                     bat """
//                         ssh -o StrictHostKeyChecking=no ${SSH_USER}@${EC2_PUBLIC_IP} "sudo kubectl get deployments -n ragpdf"
//                     """
//                     bat """
//                         ssh -o StrictHostKeyChecking=no ${SSH_USER}@${EC2_PUBLIC_IP} "sudo kubectl get pods -n ragpdf"
//                     """
//                 }
//             }
//         }
//     }

//     post {
//         always {
//             echo 'Pipeline finished. Cleaning up workspace and docker credentials...'
//             // Logout of Docker to ensure credentials are not left on the runner
//             bat "docker logout"
//             cleanWs()
//         }
//         success {
//             echo 'Deployment successful! The MERN application has been updated.'
//         }
//         failure {
//             echo 'Deployment failed! Check the Jenkins console output for errors.'
//         }
//     }
// }
