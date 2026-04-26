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
                sh "docker build -t ${FULL_IMAGE}:${IMAGE_TAG} ."
                sh "docker tag ${FULL_IMAGE}:${IMAGE_TAG} ${FULL_IMAGE}:latest"
            }
        }

        stage('Push to Docker Hub') {
            steps {
                echo '📤 Pushing image to Docker Hub...'
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        docker push ${FULL_IMAGE}:${IMAGE_TAG}
                        docker push ${FULL_IMAGE}:latest
                        docker logout
                    '''
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo '🚀 Deploying to Kubernetes...'
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
