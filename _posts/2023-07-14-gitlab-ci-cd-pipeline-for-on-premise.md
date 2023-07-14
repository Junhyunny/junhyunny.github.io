---
title: "GitLab CI/CD Pipeline for On-Premise"
search: false
category:
  - information
  - dev-ops
last_modified_at: 2023-07-14T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [What is CI/CD?][what-is-ci-cd-link]
* [SSH Copy ID for Easy Connection][ssh-copy-id-for-easy-connection-link]

## 0. 들어가면서

최근 시작한 프로젝트는 코드 저장소로 GitLab을 사용했습니다. 
별도의 자원 없이 효율적인 CI/CD 파이프라인을 구축하기 위해 GitLab에서 제공하는 파이프라인 기능을 구축한 내용에 대해 정리하였습니다.

## 1. GitLab CI/CD Pipeline

GitLab CI/CD 파이프라인에서 사용되는 용어들을 정리하였습니다. 

* .gitlab-ci.yml
    * 파이프라인의 흐름을 코드로 정의한 파일입니다.
    * 프로젝트 루트(root) 경로에 위치합니다.
* 작업(Job)
    * 파이프라인에서 수행하는 독립적인 작업을 의미합니다.
    * 변수와 스크립트를 사용하여 필요한 작업을 수행합니다.
* 스테이지(Stage)
    * 파이프라인에서 수행할 실행 흐름의 순서를 정의합니다.
    * 작업마다 스테이지를 정의하여 실행 시기를 결정할 수 있습니다.

## 2. Context of Deployment

파이프라인을 적용한 서비스 배포 환경은 다음과 같습니다.

* 온-프레미스(on-premise) 환경
* 톰캣(tomcat)을 미들웨어 서버로 사용
* 리액트(react) 라이브러리를 사용한 프론트엔드 어플리케이션 개발
    * react 18.2.0
    * webpack
* 스프링 부트(spring boot) 프레임워크를 사용한 백엔드 어플리케이션 개발
    * JDK 17
    * spring-boot-starter-parent 3.1.1

## 3. Practice

다음과 같은 과정을 통해 CI/CD 파이프라인을 구축합니다.

1. 로컬 컴퓨터에서 `ssh-copy-id` 명령어를 사용해 미리 생성해 둔 공개 키를 온-프레미스 서버에 등록합니다.
    * 해당 작업 수행 후 비공개 키를 사용해 ssh(secure shell)로 접근하면 비밀번호 입력이 생략됩니다.
1. ssh 접근 시 사용하는 비공개 키와 known_hosts 파일을 GitLab 변수로 등록합니다.
    * CI/CD 파이프라인에서 두 파일을 변수로 사용할 수 있습니다.
1. 프로젝트 루트 경로에 파이프라인을 위한 스크립트를 작성합니다.
1. 프로젝트 코드에 변경 사항을 만들어 원격 저장소에 올린 후 파이프라인 동작 과정을 확인합니다.

<p align="center">
    <img src="/images/gitlab-ci-cd-pipeline-for-on-premise-1.JPG" width="80%" class="image__border">
</p>

### 3.1. Copy Public Key by SSH

먼저 비공개 키와 공개 키를 생성합니다.

* 공개 키는 demo-project.pub 이름으로 생성됩니다.
* 비공개 키는 demo-project 이름으로 생성됩니다.

```
$ ssh-keygen -f demo-project               

Generating public/private rsa key pair.
Enter passphrase (empty for no passphrase): 
Enter same passphrase again: 
Your identification has been saved in demo-project
Your public key has been saved in demo-project.pub
The key fingerprint is:
SHA256:NF6cRLQl286N/AtXcCy6Xcww76cpMhEa/1fJSWnw5pw junhyunk@junhyunkEMD6T.vmware.com
The key's randomart image is:
+---[RSA 3072]----+
|         o= .    |
|         o B . . |
|        o * . B +|
|       o.o.+ + / |
|        S+ .* O X|
|        . o  + E.|
|           oo +.o|
|          o oo.+.|
|           o o+  |
+----[SHA256]-----+

$ ls -al
total 72
drwx------  10 junhyunk  staff   320 Jul 13 05:09 .
drwxr-xr-x+ 68 junhyunk  staff  2176 Jul 13 05:09 ..
-rw-r--r--@  1 junhyunk  staff   247 Nov 22  2021 config
-rw-------   1 junhyunk  staff  2622 Jul 13 05:08 demo-project
-rw-r--r--   1 junhyunk  staff   587 Jul 13 05:08 demo-project.pub
-rw-------   1 junhyunk  staff  3381 Dec  3  2021 id_rsa
-rw-r--r--   1 junhyunk  staff   744 Dec  3  2021 id_rsa.pub
-rw-------   1 junhyunk  staff  4436 Jul  4 07:00 known_hosts
```

생성한 키를 온-프레미스 서버에 등록합니다. 

* ssh-copy-id 명령어를 사용합니다.
    * -i 옵션으로 위에서 생성한 공개 키를 명시적으로 사용합니다.
    * -p 옵션으로 특정 포트를 지정합니다.
* 1회 비밀번호를 사용합니다.
    * 앞으로 공개 키와 매칭되는 비공개 키를 사용하면 비밀번호를 사용하지 않습니다. 
* 정상적으로 수행되었는지 서버 ~/.ssh 경로에 authorized_keys 파일을 통해 확인할 수 있습니다. 

```
$ ssh-copy-id -i ~/.ssh/demo-project.pub -p 1322 user@{server-ip}

/usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: "/Users/junhyunk/.ssh/demo-project.pub"
The authenticity of host '[39.115.145.222]:1322 ([39.115.145.222]:1322)' can't be established.
ED25519 key fingerprint is SHA256:sbVDELk959APnn5SQ43p5qArUcE1rNbzp6Qbd8R2rxo.
This key is not known by any other names
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
/usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s), to filter out any that are already installed
/usr/bin/ssh-copy-id: INFO: 1 key(s) remain to be installed -- if you are prompted now it is to install the new keys
user@{server-ip}'s password: 
/etc/profile.d/lang.sh: line 19: warning: setlocale: LC_CTYPE: cannot change locale (UTF-8): 그런 파일이나 디렉터리가 없습니다

Number of key(s) added:        1

Now try logging into the machine, with:   "ssh -p '1322' 'user@{server-ip}'"
and check to make sure that only the key(s) you wanted were added.
```

### 3.2. Register Variables on GitLab

GitLab 프로젝트 저장소의 설정 화면을 통해 필요한 변수를 등록합니다. 

* 화면 왼쪽에 `Settings` 카테고리에서 CI/CD 탭을 선택합니다.

<p align="left">
    <img src="/images/gitlab-ci-cd-pipeline-for-on-premise-2.JPG" width="40%" class="image__border">
</p>

* 변수 섹터(sector)를 찾아 변수를 지정합니다.
    * 변수는 값 혹은 파일로 저장할 수 있습니다.
* 프로젝트 폴더에서 직접 관리하면 안 되는 비공개 키를 저장합니다.
    * 이번 프로젝트에서 사용한 비공개 키와 known_hosts는 파일 변수로 등록합니다.
* 스크립트에 직접 작성하지 않는 서버 접속 정보를 저장합니다.
    * IP, PORT, HOST_USER 정보는 문자열 변수로 등록합니다.

<p align="center">
    <img src="/images/gitlab-ci-cd-pipeline-for-on-premise-3.JPG" width="80%" class="image__border">
</p>

### 3.3. Write Script

`.gitlab-ci.yml` 파일을 작성합니다. 
스크립트 설명은 가독성을 위해 주석으로 작성하였습니다. 
각 작업마다 크게 차이가 없으므로 첫번째 작업만 작성하였습니다.

```yml
# 총 4개의 스테이지가 아래 순서로 실행됩니다.
stages:
  - build-backend
  - build-frontend
  - test
  - deploy

# 백엔드 빌드 작업을 수행합니다.
#   - 작업 이름은 build-backend
#   - 사용한 이미지는 openjdk:17-jdk-slim
#   - 스테이지는 build-backend
#   - main 작업 변경 시에만 실행
#   - 캐시(cache)를 사용해 작업 결과물들을 재활용
build-backend:
  image: openjdk:17-jdk-slim
  stage: build-backend
  only:
    - main
  cache:
    paths:
      - /root/.m2
      - ./backend/target
  before_script:
    - cd backend
  script:
    - ./mvnw clean compile

build-frontend:
  image: node:20.3.1
  stage: build-frontend
  only:
    - main
  cache:
    paths:
      - ./frontend/node_modules
      - ./backend/target
  before_script:
    - cd frontend
  script:
    - |
      npm install
      npm run build
      cp -rf ./build ../backend/target/classes/public

test-backend:
  image: openjdk:17-jdk-slim
  stage: test
  only:
    - main
  cache:
    paths:
      - /root/.m2
      - ./backend/target
  before_script:
    - cd backend
  script:
    - ./mvnw test

test-frontend:
  image: node:20.3.1
  stage: test
  only:
    - main
  cache:
    paths:
      - ./frontend/node_modules
      - ./backend/target
  before_script:
    - cd frontend
  script:
    - npm test

deploy:
  image: openjdk:17-jdk-slim
  stage: deploy
  only:
    - main
  cache:
    paths:
      - /root/.m2
      - ./backend/target
  before_script:
    - cd backend
  script:
    - |
      ./mvnw -Dmaven.test.skip=true package
      sh ../run.sh
```

파이프라인 마지막에 수행되는 스크립트는 다음과 같습니다.

* ssh 작업을 위해 이미지 내부에서 `openssh-client` 패키지를 설치합니다.
* GitLab 변수로 등록한 파일을 복사합니다.
    * $SECRET_ACCESS_KEY - 비공개 키
    * $KNOWN_HOST - known_hosts
* ssh 접속을 위해선 각 파일과 폴더의 권한이 올발라야합니다.
* 패키지 파일의 이름을 ROOT.war로 변경합니다.
* ROOT.war 파일을 온-프레미스 서버에 배포합니다.

```sh
APPLICATION="ROOT.war"

# install openssh-client
apt-get update
apt-get -y install openssh-client

# copy ACCESS_KEY
mkdir ~/.ssh
cp $SECRET_ACCESS_KEY ~/.ssh/id_rsa
cp $KNOWN_HOST ~/.ssh/known_hosts
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/known_hosts

# deploy
mv target/*.war target/$APPLICATION
scp -i ~/.ssh/id_rsa -P $HOST_PORT target/$APPLICATION $HOST_USER@$HOST_IP:/home/user/apache-tomcat-10.1.9/webapps/
```

## 4. Push Codes

변경한 코드를 메인 브랜치에 푸시(push)합니다. 
코드 푸시가 완료되면 자동으로 CI/CD 파이프라인이 실행됩니다. 

* 파이프라인 화면

<p align="left">
    <img src="/images/gitlab-ci-cd-pipeline-for-on-premise-4.JPG" width="80%" class="image__border">
</p>

* 파이프라인의 상세한 작업 화면

<p align="center">
    <img src="/images/gitlab-ci-cd-pipeline-for-on-premise-5.JPG" width="80%" class="image__border">
</p>

## CLOSING

실제 개발 중인 프로젝트에 적용된 파이프라인을 기준으로 설명했기 때문에 별도로 테스트 코드 업데이트는 불가능합니다.

#### REFERENCE

* <https://bravenamme.github.io/2020/11/09/gitlab-runner/>
* <https://lovemewithoutall.github.io/it/deploy-example-by-gitlab-ci/>

[what-is-ci-cd-link]: https://junhyunny.github.io/information/what-is-ci-cd/
[ssh-copy-id-for-easy-connection-link]: https://junhyunny.github.io/information/ssh-copy-id-for-easy-connection/