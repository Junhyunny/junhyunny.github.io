---
title: "젠킨스(Jenkins) 슬랙(Slack) 알림 메세지 전송" 
search: false
category:
  - information
  - jenkins
last_modified_at: 2022-02-03T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [CI/CD란 무엇인가?][what-is-ci-cd-link]
- [젠킨스(Jenkins) 설치][jenkins-install-link]
- [젠킨스(Jenkins) GitHub Webhooks 연동][jenkins-github-webhook-link]
- [도커 레지스트리(Docker registry) 설치 on EC2 인스턴스][install-docker-registry-on-ec2-link]
- [비공개 도커 레지스트리(Private docker registry) 만들기][make-private-docker-registry-on-ec2-link]
- [젠킨스(Jenkins) 파이프라인 서비스 배포 on EC2 인스턴스][jenkins-deploy-ec2-using-docker-link]

## 0. 들어가면서

도커 비공개 레지스트리와 젠킨스 CI/CD 파이프라인까지 모두 구축 완료한 후에 조금 아쉬움이 남았습니다. 
파이프라인 수행 성공/실패 여부나 테스트 URL 등을 파이프라인 종료시 자동으로 팀원들에게 알림을 주고 싶었습니다. 
슬랙과 젠킨스를 쉽게 연결하는 방법을 발견하여 이를 이용하였습니다.  

##### 슬랙(Slack) 알림 메세지 전송 작업 영역

<p align="center">
  <img src="/images/jenkins-slack-notification-1.JPG" width="85%" class="image__border">
</p>

## 1. Slack - Jenkins CI 앱 추가

슬랙과 젠킨스를 연동하려면 워크스페이스(workspace)와 채널(channel)이 필요합니다. 
없으신 분께서는 우선 워크스페이스를 생성하시길 바랍니다. 
저는 테스트를 위한 워크스페이스를 별도로 생성하여 진행하였습니다. 

##### Slack 워크스페이스 URL 확인
- Slack 어플리케이션 왼쪽 상단 워크스페이스 이미지를 누르면 워크스페이스 URL 정보를 확인할 수 있습니다.

<p align="left">
  <img src="/images/jenkins-slack-notification-2.JPG" width="45%" class="image__border">
</p>

##### Slack app directory 화면
- 이전 단계에서 확인한 워크스페이스 URL에 `/apps` 경로를 추가하여 접근합니다. 
- 저의 경우 <http://slack-3s15482.slack.com/apps> 링크입니다.
- 해당 화면에서 Jenkins CI 어플리케이션을 검색합니다.

<p align="center">
  <img src="/images/jenkins-slack-notification-3.JPG" width="80%" class="image__border">
</p>

##### Jenkins CI 앱 설치
- Add to Slack 버튼을 눌러 설치 화면으로 이동합니다.
- 채널을 선택 후 앱을 설치합니다.

<p align="center">
  <img src="/images/jenkins-slack-notification-4.JPG" width="80%" class="image__border">
</p>

<p align="center">
  <img src="/images/jenkins-slack-notification-5.JPG" width="80%" class="image__border">
</p>

## 2. Jenkins - Slack Notification 플러그인 설치 및 설정

채널에 `Jenkins CI` 앱을 설치하면 젠킨스에서 설치해야 할 플러그인과 설정 방법을 상세히 알려줍니다. 
일부 달라진 부분이 있어서 해당 부분만 다시 정리하였습니다. 
우선 젠킨스 서버 메인 대시보드에 접속합니다.

##### 젠킨스 Slack Notification 플러그인 설치
- 젠킨스 메인 대시보드에서 `Manage Jenkins > Manage Plugins` 화면으로 이동합니다.
- `Available`에서 `Slack Notification` 플러그인을 검색하고 설치합니다.

<p align="center">
  <img src="/images/jenkins-slack-notification-6.JPG" width="80%" class="image__border">
</p>

##### 젠킨스 플러그인 프로퍼티 설정
- 젠킨스 메인 대시보드에서 `Manage Jenkins > Configure Sytstem` 화면으로 이동합니다.
- `Jenkins CI` 가이드 화면에서 제공하는 `Team Subdomain`과 `Integration Token Credential ID`를 Slack 속성에 입력합니다.
    - 가이드에서 제공하는 이전 화면과 다릅니다.
    - `Team Subdomain` 값을 `Workspace` 항목에 입력합니다.
    - `Integration Token Credential ID` 값은 신규 `credential` 추가시 사용합니다.
- 기본 채널명을 입력합니다.
- `Test Connection` 버튼을 눌러 연결이 정상적인지 확인합니다.

<p align="center">
  <img src="/images/jenkins-slack-notification-7.JPG" width="80%" class="image__border">
</p>

<p align="center">
  <img src="/images/jenkins-slack-notification-8.JPG" width="80%" class="image__border">
</p>

##### Slack Credential 추가 팝업 화면
- 이전 단계에서 `Add` 버튼을 누르면 아래와 같은 창이 열립니다.
- `Credential` 타입은 `Secret text` 종류로 선택합니다.
- 슬랙에서 발급한 `Integration Token Credential ID`를 `Secret` 항목에 입력합니다.
- 젠킨스에서 사용할 ID를 새로 입력합니다.

<p align="center">
  <img src="/images/jenkins-slack-notification-9.JPG" width="80%" class="image__border">
</p>

## 3. Jenkins 파이프라인 스크립트 변경
- `jenkins-github-webhook 프로젝트 > configure` 화면으로 이동합니다.
- `Pipelin` 항목의 `Script` 영역에 입력합니다.
- `{ec2-instance-public-ip}`는 EC2 인스턴스 공개 IP입니다.
- `slackSend` 함수를 사용하여 필요한 메세지를 전달합니다.
    - `channel` - 메세지를 전달할 채널
    - `message` - 슬랙 해당 채널에 전당할 메세지

```s
pipeline {
    agent any
    environment {
        NGROK_DOMAIN = 'http://d8c3-1-228-13-94.ngrok.io'
        AWS_PUBLIC_IP = '{ec2-instance-public-ip}'
        SSH_CMD = 'ssh -i private-key.pem ec2-user@{ec2-instance-public-ip}'
        DOCKER = 'sudo docker'
    }
    stages {
        stage('start') {
            steps {
                slackSend (
                    channel: '#test', 
                    color: '#FFFF00', 
                    message: "STARTED: Job ${env.JOB_NAME} [${env.BUILD_NUMBER}] (${NGROK_DOMAIN})"
                )
            }
        }
        stage('checkout') {
            steps {
                git branch: 'main',
                    credentialsId: 'github_access_token',
                    url: 'https://github.com/Junhyunny/jenkins-github-webhook.git'
                sh 'chmod 400 private-key.pem'
            }
        }
        stage('build') {
            steps {
                dir ('front-end') {
                    sh 'rm -rf build'
                    sh 'npm install'
                    sh 'npm run build'
                    sh 'docker build -t $AWS_PUBLIC_IP:5000/front-end:latest .'
                }
            }
        }
        stage('deploy') {
            steps {
                script {
                    try {
                        sh '$SSH_CMD $DOCKER stop front-end'
                        sh '$SSH_CMD $DOCKER rm front-end'
                    } catch (e) {
                        sh 'echo "fail to stop and remove container"'
                    }
                    withCredentials([usernamePassword(credentialsId: 'private_registry_credential', usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD')]) {
                        sh 'docker login $AWS_PUBLIC_IP:5000 -u $USERNAME -p $PASSWORD'
                        sh '$SSH_CMD $DOCKER login localhost:5000 -u $USERNAME -p $PASSWORD'
                }
                sh '$SSH_CMD $DOCKER rmi localhost:5000/front-end:latest'
                sh 'docker push $AWS_PUBLIC_IP:5000/front-end:latest'
                sh '$SSH_CMD $DOCKER pull localhost:5000/front-end:latest'
                sh '$SSH_CMD $DOCKER run -d --name front-end -p 3000:80 localhost:5000/front-end:latest'
                }
            }
        }
    }
    post {
        success {
            slackSend (
                channel: '#test', 
                color: '#00FF00', 
                message: """
SUCCESS: Job ${env.JOB_NAME} [${env.BUILD_NUMBER}] (${NGROK_DOMAIN}) 
[TEST URL: http://${AWS_PUBLIC_IP}:3000]
"""
            )
        }
        failure {
            slackSend (
                channel: '#test', 
                color: '#FF0000', 
                message: "FAIL: Job ${env.JOB_NAME} [${env.BUILD_NUMBER}] (${NGROK_DOMAIN})"
            )
        }
    }
}
```

## 4. 슬랙 알림 테스트

GitHub 웹훅을 통해 프로젝트 코드의 변경 사항을 감지합니다. 
젠킨스 파이프라인이 동작하면서 빌드 시작 정보를 슬랙 메세지로 전달합니다. 
빌드가 정상적으로 완료된 후 테스트할 수 있는 URL과 빌드 정보를 확인할 수 있는 URL이 담긴 메세지를 슬랙에서 확인할 수 있습니다. 

<p align="center">
  <img src="/images/jenkins-slack-notification-10.gif" width="100%" class="image__border">
</p>

#### REFERENCE
- <https://plugins.jenkins.io/slack/>
- <https://jojoldu.tistory.com/139?category=777282>
- [Jenkins Pipeline과 Slack 연동하여 알림받기][jenkins-pipeline-slack-link]

[what-is-ci-cd-link]: https://junhyunny.github.io/information/what-is-ci-cd/
[jenkins-install-link]: https://junhyunny.github.io/information/jenkins/jenkins-install/
[jenkins-github-webhook-link]: https://junhyunny.github.io/information/jenkins/github/jenkins-github-webhook/
[install-docker-registry-on-ec2-link]: https://junhyunny.github.io/information/docker/install-docker-registry-on-ec2/
[make-private-docker-registry-on-ec2-link]: https://junhyunny.github.io/information/docker/make-private-docker-registry-on-ec2/
[jenkins-deploy-ec2-using-docker-link]: https://junhyunny.github.io/information/jenkins/jenkins-deploy-ec2-using-docker/

[jenkins-pipeline-slack-link]: https://twofootdog.github.io/Jenkins-Jenkins-Pipeline%EA%B3%BC-Slack-%EC%97%B0%EB%8F%99%ED%95%98%EC%97%AC-%EC%95%8C%EB%A6%BC%EB%B0%9B%EA%B8%B0/
