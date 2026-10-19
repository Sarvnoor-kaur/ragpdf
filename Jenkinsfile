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

        stage('SonarQube Analysis') {
            steps {
                echo 'Running SonarQube Analysis...'
                // Note: Make sure "SonarQubeServer" and "SonarScanner" are configured in Jenkins!
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
                echo 'Waiting for SonarQube Quality Gate to pass...'
                timeout(time: 10, unit: 'MINUTES') {
                    // Fails the pipeline if the code does not pass the Quality Gate
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Gitleaks Secret Scan') {
    steps {
        script {
            echo 'Running Gitleaks secret scan on source...'
            catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                bat "gitleaks detect --source . --redact --report-format json --report-path gitleaks-report.json --exit-code 0"
            }
            if (fileExists('gitleaks-report.json')) {
                echo 'Gitleaks source scan completed. Report: gitleaks-report.json'
            } else {
                echo 'Warning: Gitleaks source report not generated.'
            }

            echo 'Running Gitleaks secret scan on Git history...'
            catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                bat "gitleaks detect --source . --redact --report-format json --report-path gitleaks-history-report.json --exit-code 0 --log-opts=\"--all\""
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
            echo 'Pipeline finished. Cleaning up workspace and docker credentials...'

                // Archive SBOM and Grype reports regardless of success or failure
                archiveArtifacts artifacts: 'sbom-*.cdx.json, grype-*.json, grype-*.txt', fingerprint: true
                bat "docker logout"

            cleanWs()
        }

        success {
            echo 'Deployment successful! The MERN application has been updated.'
        }

        failure {
            echo 'Deployment failed! Check the Jenkins console output for errors.'
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
