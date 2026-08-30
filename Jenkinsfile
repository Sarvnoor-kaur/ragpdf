pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = 'dockerhub'
        DOCKERHUB_USERNAME = 'sarvnoorkaur'
        BACKEND_IMAGE = "${DOCKERHUB_USERNAME}/ragpdf-backend:latest"
        FRONTEND_IMAGE = "${DOCKERHUB_USERNAME}/ragpdf-frontend:latest"

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
