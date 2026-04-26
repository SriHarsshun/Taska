pipeline {
    agent any

    environment {
        DOCKER_HUB_USER  = 'sriharsshun'
        IMAGE_NAME       = 'taska'
        IMAGE_TAG        = "${env.BUILD_NUMBER}"
        FULL_IMAGE       = "${DOCKER_HUB_USER}/${IMAGE_NAME}"
        KUBE_NAMESPACE   = 'taska'
    }

    stages {

        stage('Checkout') {
            steps {
                echo '📥 Checking out source code...'
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                echo '🐳 Building Docker image...'
                script {
                    dockerImage = docker.build("${FULL_IMAGE}:${IMAGE_TAG}")
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                echo '📤 Pushing image to Docker Hub...'
                script {
                    docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-credentials') {
                        dockerImage.push("${IMAGE_TAG}")
                        dockerImage.push('latest')
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo '🚀 Deploying to Kubernetes...'
                script {
                    // Update the image in the deployment
                    sh """
                        kubectl set image deployment/taska-deployment \
                            taska=${FULL_IMAGE}:${IMAGE_TAG} \
                            -n ${KUBE_NAMESPACE}
                        kubectl rollout status deployment/taska-deployment \
                            -n ${KUBE_NAMESPACE} --timeout=120s
                    """
                }
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed. Check the logs above.'
        }
        always {
            echo '🧹 Cleaning up...'
            sh "docker rmi ${FULL_IMAGE}:${IMAGE_TAG} || true"
        }
    }
}
