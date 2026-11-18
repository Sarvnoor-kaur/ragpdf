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
        EC2_PUBLIC_IP = '13.233.203.127'
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
                echo 'Running backend tests with coverage...'
                catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                    bat 'cd company-policy-ai\\backend && npm test'
                }
            }
        }

        stage('Run Frontend Tests') {
            steps {
                echo 'Running frontend tests with coverage...'
                catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                    bat 'cd company-policy-ai\\frontend && npm test'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                echo 'Running SonarQube Analysis...'
                script {
                    // Ensure coverage reports exist before analysis
                    def backendCoverage = fileExists('company-policy-ai/backend/coverage/lcov.info')
                    def frontendCoverage = fileExists('company-policy-ai/frontend/coverage/lcov.info')
                    
                    echo "Backend coverage exists: ${backendCoverage}"
                    echo "Frontend coverage exists: ${frontendCoverage}"
                }
                
                withSonarQubeEnv('SonarQubeServer') {
                    script {
                        def scannerHome = tool 'SonarScanner'
                        bat "${scannerHome}\\bin\\sonar-scanner.bat"
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                echo 'Waiting for SonarQube Quality Gate...'
                timeout(time: 15, unit: 'MINUTES') {
                    script {
                        // Wait for webhook callback from SonarQube
                        def qg = waitForQualityGate()
                        
                        if (qg.status != 'OK') {
                            echo "Quality Gate Status: ${qg.status}"
                            echo "Quality Gate failed. Check SonarQube dashboard for details."
                            
                            // Don't fail the pipeline, but mark stage as unstable
                            currentBuild.result = 'UNSTABLE'
                            
                            // Only abort if explicitly configured
                            if (env.SONAR_ABORT_ON_FAILURE == 'true') {
                                error "Pipeline aborted due to quality gate failure"
                            }
                        } else {
                            echo "Quality Gate passed successfully!"
                        }
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
    }

    post {

        always {
            echo 'Pipeline finished. Archiving artifacts and cleaning up...'

            // Archive test results and coverage reports
            script {
                if (fileExists('company-policy-ai/backend/coverage')) {
                    archiveArtifacts artifacts: 'company-policy-ai/backend/coverage/**/*', fingerprint: true, allowEmptyArchive: true
                }
                if (fileExists('company-policy-ai/frontend/coverage')) {
                    archiveArtifacts artifacts: 'company-policy-ai/frontend/coverage/**/*', fingerprint: true, allowEmptyArchive: true
                }
            }

            // Archive SBOM and Grype reports regardless of success or failure
            archiveArtifacts artifacts: 'sbom-*.cdx.json, grype-*.json, grype-*.txt, gitleaks*.json', fingerprint: true, allowEmptyArchive: true
            
            bat "docker logout"

            cleanWs()
        }

        success {
            echo 'Deployment successful! The RAGPDF application has been updated.'
        }

        failure {
            echo 'Pipeline failed! Check the Jenkins console output for errors.'
        }

        unstable {
            echo 'Pipeline completed with warnings. Check test results, quality gate, or security scans.'
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
