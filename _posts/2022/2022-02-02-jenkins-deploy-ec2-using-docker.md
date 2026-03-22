---
title: "젠킨스(Jenkins) 파이프라인 서비스 배포 on EC2 인스턴스" 
search: false
category:
  - information
  - jenkins
last_modified_at: 2022-02-02T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [CI/CD란 무엇인가?][what-is-ci-cd-link]
- [Install Jenkins][jenkins-install-link]
- [젠킨스(Jenkins) GitHub Webhooks 연동][jenkins-github-webhook-link]
- [도커 레지스트리(Docker registry) 설치 on EC2 인스턴스][install-docker-registry-on-ec2-link]
- [비공개 도커 레지스트리(Private docker registry) 만들기][make-private-docker-registry-on-ec2-link]

👉 이어서 읽기를 추천합니다.
- [젠킨스(Jenkins) 슬랙(Slack) 알림 메시지 전송][jenkins-slack-notification-link]

## 0. 들어가면서

GitHub 웹훅(webhook)으로 코드 변경 사항을 감지했다면, 이를 파이프라인을 통해 빌드, 테스트하고 서비스로 배포해야합니다. 
개발 이터레이션(iteration)마다 생기는 변경 사항들을 자동화 된 파이프라인을 통해 수시로 배포하여 모든 팀원들이 프로젝트의 변화되는 모습을 쉽게 확인할 수 있어야 합니다. 

이번 포스트에선 프로젝트의 변경된 코드를 파이프라인을 통해 빌드하고 서비스로 배포하는 과정을 정리하였습니다. 
아마존 웹 서비스(AWS, Amazon Web Service)의 여러 제품을 사용하면 쉽게 배포 환경을 만들 수 있지만, 
무료 티어(tier)를 사용하기 때문에 과금을 피하고자 컨테이너 종류와 개수를 최소화하였습니다. 
회사 제품인 PCF(Pivotal Cloud Foundry) 지원을 받았다면 더 쉽고, 부담없이 파이프라인을 구축할 수 있었을텐데 아쉽습니다. 
현재 구조라면 프로젝트 중간에 회사 지원을 받게 되어 클라우드 플랫폼을 변경하더라도 파이프라인엔 크게 영향이 없을 것으로 보입니다. 

터미널 명령어들이 섞여서 나오기 때문에 헷갈릴 수 있어서 별도로 표시하였습니다. 
- `on EC2 인스턴스` 접미사가 붙은 것은 AWS EC2 인스턴스에서 작업한 내용입니다. 
- `on Macbook` 접미사가 붙은 것은 맥북에서 작업한 내용입니다. 

##### AWS EC2 서비스 배포 작업 영역 

<p align="center">
    <img src="{{ site.image_url_2022 }}/jenkins-deploy-ec2-using-docker-01.png" width="85%" class="image__border">
</p>

##### 세부적인 작업 내용
- EC2 인스턴스에 이미 비공개 도커 레지스트리가 구축되어 있다고 가정합니다. 
    - [도커 레지스트리(Docker registry) 설치 on EC2 인스턴스][install-docker-registry-on-ec2-link]
    - [비공개 도커 레지스트리(Private docker registry) 만들기][make-private-docker-registry-on-ec2-link]
- 간단한 예시를 위해 빌드와 배포 과정은 최대한 단순화시켰습니다.
- 파이프라인은 `checkout > build > deploy`로 구성하였습니다. 
- `checkout` 스테이지
    - GitHub 개인 레포지토리에 변경된 코드 사항들을 최신화합니다.
- `build` 스테이지
    - 프론트엔드 서비스를 빌드합니다.
    - `Dockerfile`을 이용해 이미지를 생성합니다.
- `deploy` 스테이지
    - ssh 명령어로 EC2 인스턴스에게 이전에 실행 중인 `front-end` 컨테이너 정지와 삭제를 지시합니다.
    - 비공개 레지스트리에 이미지를 push / pull 하기 위해 도커 로그인을 수행합니다.
    - 비공개 레지스트리에 이미지를 push 합니다.
    - ssh 명령어로 EC2 인스턴스에게 새로운 이미지 pull을 지시합니다.
    - ssh 명령어로 EC2 인스턴스에게 새로 받은 이미지 실행을 지시합니다.

<p align="center">
    <img src="{{ site.image_url_2022 }}/jenkins-deploy-ec2-using-docker-02.png" width="85%" class="image__border">
</p>

## 1. 프론트엔드 서비스 만들기

파이프라인에 배포할 프론트엔드 서비스를 하나 만들어보겠습니다. 
[젠킨스(Jenkins) GitHub Webhooks 연동][jenkins-github-webhook-link] 포스트에서 사용했던 레포지토리에 리액트 프로젝트를 하나 만들겠습니다. 

##### CRA, Create React App on Macbook

```
jenkins-github-webhook % npx create-react-app@5.0.0 front-end

...

We suggest that you begin by typing:

  cd front-end
  npm start

Happy hacking!
```

##### Dockerfile 파일 생성 on Macbook
- 도커 이미지를 만들때 필요한 `Dockerfile`을 `front-end` 프로젝트에 생성합니다.

```dockerfile
FROM nginx

RUN mkdir /app

WORKDIR /app

RUN mkdir ./build

ADD ./build ./build

RUN rm /etc/nginx/conf.d/default.conf

COPY ./nginx.conf /etc/nginx/conf.d

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

##### nginx.conf 파일 생성 on Macbook
- `nginx`를 실행할 때 필요한 설정 파일을 `front-end` 프로젝트에 생성합니다.

```
server {
    listen 80;
    location / {
        root     /app/build;
        index    index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

##### 프로젝트 디렉토리 구조
- `front-end` 폴더에 `Dockerfile`과 `nginx.conf` 파일이 존재합니다.
- 개인 레포지토리 루트 경로에 AWS EC2 인스턴스에 접속할 때 사용하는 `private-key.pem` 파일을 위치시켰습니다.

```
./
├── README.md
├── front-end
│   ├── Dockerfile
│   ├── README.md
│   ├── nginx.conf
│   ├── package-lock.json
│   ├── package.json
│   ├── public
│   │   ├── favicon.ico
│   │   ├── index.html
│   │   ├── logo192.png
│   │   ├── logo512.png
│   │   ├── manifest.json
│   │   └── robots.txt
│   └── src
│       ├── App.css
│       ├── App.js
│       ├── App.test.js
│       ├── index.css
│       ├── index.js
│       ├── logo.svg
│       ├── reportWebVitals.js
│       └── setupTests.js
└── private-key.pem
```

## 2. EC2 인스턴스 접근 허용 포트 추가

파이프라인이 정상적으로 동작하여 서비스가 배포되었다면 이를 사용자가 확인할 수 있어야 합니다. 
테스트를 위해 EC2 인스턴스의 포트 3000번에 대한 외부 접근을 허용하도록 하겠습니다. 
[도커 레지스트리(Docker registry) 설치 on EC2 인스턴스][install-docker-registry-on-ec2-link] 포스트에서 비공개 레지스트리 접근을 위해 포트 5000번을 허용한 것과 같은 방법입니다.

##### Security Groups 설정 화면 이동
- EC2 인스턴스 정보를 확인할 수 있는 대시보드에서 해당 인스턴스를 선택합니다.
    - `EC2 > Instances > {container id}` 화면
- 선택한 EC2 인스턴스 상세 정보 화면 하단에 `Security` 탭에서 `security groups`를 선택합니다.

<p align="center">
    <img src="{{ site.image_url_2022 }}/jenkins-deploy-ec2-using-docker-03.png" width="80%" class="image__border">
</p>

##### Inbound rule 설정 화면
- `Edit inbound rules` 버튼을 눌러 인바운드(inbound) 규칙 설정 화면으로 이동합니다.

<p align="center">
    <img src="{{ site.image_url_2022 }}/jenkins-deploy-ec2-using-docker-04.png" width="80%" class="image__border">
</p>

##### Inbound rule 추가
- `Custom TCP`를 선택하여 포트 3000번을 허용합니다.
- 소스(source)는 `0.0.0.0/0`으로 지정하여 모든 IP에서 접근을 허용합니다.

<p align="center">
    <img src="{{ site.image_url_2022 }}/jenkins-deploy-ec2-using-docker-05.png" width="100%" class="image__border">
</p>

## 3. 젠킨스 파이프라인 변경

[젠킨스(Jenkins) GitHub Webhooks 연동][jenkins-github-webhook-link] 포스트에서 진행했던 파이프라인 잡(job)을 사용하였습니다.

### 3.1. 젠킨스 PATH 환경변수 변경

처음 스크립트를 작성하고 빌드를 수행했을 때 많은 에러들을 만났습니다. 
계속 만나는 에러들을 해결해나가면서 시간을 허비했는데, 젠킨스에서 사용하는 환경 변수가 젠킨스를 호스트하는 OS(맥북)의 환경 변수와 다르다는 것을 나중에 알았습니다. 
결국 문제의 원인은 `"젠킨스 환경 변수 $PATH가 맥북에서 사용하는 $PATH와 달랐다."` 였습니다. 
맥북에서 직접 명령어를 수행했을 때 성공하고, 젠킨스 파이프라인에선 실패했다면 젠킨스의 환경 변수 `PATH`를 의심해보시길 바랍니다. 

##### 젠킨스 환경 변수 추가
- `Manage Jenkins > Configure System` 화면으로 이동합니다.
- `Global properties` 항목을 찾습니다.
- `Environment varaibles` 체크 박스를 선택합니다.
- 맥북에서 사용하는 `$PATH` 변수와 동일한 값을 `Value` 항목에 넣습니다.
- `Add` 버튼을 눌러 환경 변수를 추가합니다.

<p align="center">
    <img src="{{ site.image_url_2022 }}/jenkins-deploy-ec2-using-docker-06.png" width="80%" class="image__border">
</p>

### 3.2. 젠킨스 Credential 추가

젠킨스 파이프라인에서 EC2 인스턴스 비공개 레지스트리에 접근할 아이디와 비밀번호를 젠킨스 `credential`로 추가합니다.  

##### EC2 인스턴스 비공개 레지스트리 로그인 정보 등록
- [젠킨스(Jenkins) GitHub Webhooks 연동][jenkins-github-webhook-link] 포스트와 같은 방법으로 `credential` 정보를 추가합니다. 
- `Manage Jenkins > Manage Credentials` 화면으로 이동합니다.
- `Stores scoped to Jenkins` 표에 보이는 `(global)` 링크를 클릭합니다.
- `Add Credentials` 버튼을 선택합니다. 
- [비공개 도커 레지스트리(Private docker registry) 만들기][make-private-docker-registry-on-ec2-link] 포스트에서 설정했던 비공개 레지스트리 로그인 아이디와 비밀번호를 입력합니다.
    - 글쓴이는 아이디 `cicduser`, 비밀번호 `0000`을 사용하였습니다.

<p align="center">
    <img src="{{ site.image_url_2022 }}/jenkins-deploy-ec2-using-docker-07.png" width="100%" class="image__border">
</p>

### 3.2. 젠킨스 Declarative 파이프라인 스크립트
- `jenkins-github-webhook 프로젝트 > configure` 화면으로 이동합니다.
- `Pipelin` 항목의 `Script` 영역에 입력합니다.
- `{ec2-instance-public-ip}`는 EC2 인스턴스 공개 IP입니다.
- `private_registry_credential`은 이전 단계에서 등록한 비공개 레지스트리 `credential` 아이디를 사용합니다.

```s
pipeline {
    agent any
    environment {
        AWS_PUBLIC_IP = '{ec2-instance-public-ip}'
        SSH_CMD = 'ssh -i private-key.pem ec2-user@{ec2-instance-public-ip}'
        DOCKER = 'sudo docker'
    }
    stages {
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
                sh 'docker push $AWS_PUBLIC_IP:5000/front-end:latest'
                sh '$SSH_CMD $DOCKER pull localhost:5000/front-end:latest'
                sh '$SSH_CMD $DOCKER run -d --name front-end -p 3000:80 localhost:5000/front-end:latest'
                }
            }
        }
    }
}
```

## 4. CI/CD 파이프라인 동작 테스트

Github에서 커밋(commit)을 만들고, 젠킨스 파이프라인이 정상적으로 동작하는지 확인합니다. 
파이프라인이 배포까지 모두 성공하였을 때 변경된 서비스가 반영되었는지 살펴보겠습니다. 
테스트를 위해 화면에 `Learn React`라는 문구를 `Hello React World`라는 문구로 변경하였습니다. 

<p align="center">
    <img src="{{ site.image_url_2022 }}/jenkins-deploy-ec2-using-docker-08.gif" width="100%" class="image__border">
</p>

#### REFERENCE
- <https://stackoverflow.com/questions/43026637/how-to-get-username-password-stored-in-jenkins-credentials-separately-in-jenkins>
- <https://www.baeldung.com/ops/jenkins-environment-variables>
- <https://jojoldu.tistory.com/409>

[what-is-ci-cd-link]: https://junhyunny.github.io/information/what-is-ci-cd/
[jenkins-install-link]: https://junhyunny.github.io/information/jenkins/jenkins-install/
[jenkins-github-webhook-link]: https://junhyunny.github.io/information/jenkins/github/jenkins-github-webhook/
[install-docker-registry-on-ec2-link]: https://junhyunny.github.io/information/docker/install-docker-registry-on-ec2/
[make-private-docker-registry-on-ec2-link]: https://junhyunny.github.io/information/docker/make-private-docker-registry-on-ec2/

[jenkins-slack-notification-link]: https://junhyunny.github.io/information/jenkins/jenkins-slack-notification/