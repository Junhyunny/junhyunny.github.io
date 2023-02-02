---
title: "도커 레지스트리(Docker registry) 설치 on EC2 인스턴스" 
search: false
category:
  - information
  - docker
last_modified_at: 2022-02-01T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [CI/CD란 무엇인가?][what-is-ci-cd-link]
- [젠킨스(Jenkins) 설치][jenkins-install-link]
- [젠킨스(Jenkins) GitHub Webhooks 연동][jenkins-github-webhook-link]

👉 이어서 읽기를 추천합니다.
- [비공개 도커 레지스트리(Private docker registry) 만들기][make-private-docker-registry-on-ec2-link]
- [젠킨스(Jenkins) 파이프라인 서비스 배포 on EC2 인스턴스][jenkins-deploy-ec2-using-docker-link]
- [젠킨스(Jenkins) 슬랙(Slack) 알림 메세지 전송][jenkins-slack-notification-link]

## 0. 들어가면서

이번 포스트에선 도커 개인 이미지 저장소 구축과 관련된 내용을 정리하였습니다. 
도커 허브(hub)는 공개 레포지토리는 무제한이지만, 개인 레포지토리는 1개만 제공합니다. 
개인 레포지토리가 1개 이상 필요할 것으로 예상되어 프로젝트에서 사용할 비공개 저장소를 EC2 인스턴스 위에 하나 만들기로 하였습니다. 
내용이 길어지는 바람에 이번 포스트에선 도커 레지스트리(registry) 설치와 관련된 내용만 다루겠습니다. 
다음 포스트에선 설치한 도커 레지스트리를 비공개로 사용할 수 있도록 암호화하는 과정을 정리해보겠습니다.

아래 설명을 보면 터미널 명령어들이 섞여 나오기 때문에 헷갈릴 수 있으므로 접미사로 표시하였습니다. 
- `on EC2 인스턴스` 접미사가 붙은 것은 AWS EC2 인스턴스에서 작업한 내용입니다. 
- `on Macbook` 접미사가 붙은 것은 맥북에서 작업한 내용입니다. 

##### 도커 레지스트리 설치 작업 영역 
- EC2 인스턴스에 도커 개인 이미지 저장소를 구축하였습니다.

<p align="center"><img src="/images/install-docker-registry-on-ec2-1.JPG" width="85%" class="image__border"></p>

## 1. 도커 설치하기

맥북에는 도커가 설치되어 있고, 무료 티어 AWS EC2 인스턴스도 생성되어 있다는 가정하에 설명을 진행하겠습니다. 

##### EC2 서비스 접속 on Macbook
- EC2 서비스를 만들 때 발급받은 `.pem` 파일로 해당 서비스에 접속합니다.
- 접속 시도 확인시 `yes` 입력합니다.

```
~ % ssh -i private-key.pem ec2-user@{your-own-ec2-service-address}.ap-northeast-1.compute.amazonaws.com
```

##### 도커 설치 on EC2 인스턴스
- 다음 명령어를 통해 도커를 설치합니다. 

```
~ $ sudo yum install docker
```

##### 도커 설치 성공 로그 on EC2 인스턴스

```
Loaded plugins: extras_suggestions, langpacks, priorities, update-motd
Resolving Dependencies
--> Running transaction check
---> Package docker.x86_64 0:20.10.7-5.amzn2 will be installed
--> Processing Dependency: runc >= 1.0.0 for package: docker-20.10.7-5.amzn2.x86_64
--> Processing Dependency: libcgroup >= 0.40.rc1-5.15 for package: docker-20.10.7-5.amzn2.x86_64
--> Processing Dependency: containerd >= 1.3.2 for package: docker-20.10.7-5.amzn2.x86_64
--> Processing Dependency: pigz for package: docker-20.10.7-5.amzn2.x86_64
--> Running transaction check
---> Package containerd.x86_64 0:1.4.6-7.amzn2 will be installed
---> Package libcgroup.x86_64 0:0.41-21.amzn2 will be installed
---> Package pigz.x86_64 0:2.3.4-1.amzn2.0.1 will be installed
---> Package runc.x86_64 0:1.0.0-2.amzn2 will be installed
--> Finished Dependency Resolution

Dependencies Resolved

==============================================================================================================================
 Package                    Arch                   Version                            Repository                         Size
==============================================================================================================================
Installing:
 docker                     x86_64                 20.10.7-5.amzn2                    amzn2extra-docker                  42 M
Installing for dependencies:
 containerd                 x86_64                 1.4.6-7.amzn2                      amzn2extra-docker                  24 M
 libcgroup                  x86_64                 0.41-21.amzn2                      amzn2-core                         66 k
 pigz                       x86_64                 2.3.4-1.amzn2.0.1                  amzn2-core                         81 k
 runc                       x86_64                 1.0.0-2.amzn2                      amzn2extra-docker                 3.3 M

Transaction Summary
==============================================================================================================================
Install  1 Package (+4 Dependent packages)

Total download size: 69 M
Installed size: 285 M
Is this ok [y/d/N]: Y
Downloading packages:
(1/5): libcgroup-0.41-21.amzn2.x86_64.rpm                                                              |  66 kB  00:00:00     
(2/5): pigz-2.3.4-1.amzn2.0.1.x86_64.rpm                                                               |  81 kB  00:00:00     
(3/5): containerd-1.4.6-7.amzn2.x86_64.rpm                                                             |  24 MB  00:00:01     
(4/5): docker-20.10.7-5.amzn2.x86_64.rpm                                                               |  42 MB  00:00:01     
(5/5): runc-1.0.0-2.amzn2.x86_64.rpm                                                                   | 3.3 MB  00:00:00     
------------------------------------------------------------------------------------------------------------------------------
Total                                                                                          41 MB/s |  69 MB  00:00:01

...

Complete!
```

## 2. 도커 레지스트리(registry) 설치

개인 이미지 저장소로 도커 레지스트리를 가장 많이 사용하는 것 같습니다. 
EC2 인스턴스에 설치해보겠습니다. 

> [Docker Registry][docker-registry-link]<br/>
> The Registry is a stateless, highly scalable server side application that stores and lets you distribute Docker images. 
> The Registry is open-source, under the permissive Apache license.

### 2.1. 도커 레지스트리 컨테이너 생성

도커 명령어를 통해 쉽게 생성할 수 있습니다. 

##### 도커 레지스트리 이미지 PULL on EC2 인스턴스

```
~ $ sudo docker pull registry
Using default tag: latest
latest: Pulling from library/registry
79e9f2f55bf5: Pull complete 
0d96da54f60b: Pull complete 
5b27040df4a2: Pull complete 
e2ead8259a04: Pull complete 
3790aef225b9: Pull complete 
Digest: sha256:169211e20e2f2d5d115674681eb79d21a217b296b43374b8e39f97fcf866b375
Status: Downloaded newer image for registry:latest
docker.io/library/registry:latest
```

##### 도커 레지스트리 이미지 확인 on EC2 인스턴스

```
~ $ sudo docker images
REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
registry     latest    b8604a3fe854   2 months ago   26.2MB
```

##### 도커 레지스트리 컨테이너 실행 on EC2 인스턴스

```
~ $ sudo docker run -d --name private-registry -p 5000:5000 registry
fe931afc77b0a65dedf75451c0fd598664fe0d5a077d6f5f8f4dc0d76b65faef
```

### 도커 레지스트리 컨테이너 실행 확인 on EC2 인스턴스
 
```
~ $ sudo docker ps
CONTAINER ID   IMAGE      COMMAND                  CREATED         STATUS         PORTS                                       NAMES
fe931afc77b0   registry   "/entrypoint.sh /etc…"   6 seconds ago   Up 4 seconds   0.0.0.0:5000->5000/tcp, :::5000->5000/tcp   private-registry
```

### 2.2. EC2 인스턴스 포트 허용

외부에서 EC2 인스턴스에 접근할 수 있도록 포트를 열어야 합니다. 
AWS EC2 설정 대시보드에서 포트 접근을 설정할 수 있습니다. 

##### Security Groups 설정 화면 이동
- EC2 인스턴스 정보를 확인할 수 있는 대시보드에서 해당 인스턴스를 선택합니다.
    - `EC2 > Instances > {container id}` 화면
- 선택한 EC2 인스턴스 상세 정보 화면 하단에 `Security` 탭에서 `security groups`를 선택합니다.

<p align="center"><img src="/images/install-docker-registry-on-ec2-2.JPG" width="80%" class="image__border"></p>

##### Inbound rule 설정 화면
- `Edit inbound rules` 버튼을 눌러 인바운드(inbound) 규칙 설정 화면으로 이동합니다.

<p align="center"><img src="/images/install-docker-registry-on-ec2-3.JPG" width="80%" class="image__border"></p>

##### Inbound rule 추가
- `Custom TCP`를 선택하여 포트 5000번을 허용합니다.
- 소스(source)는 `0.0.0.0/0`으로 지정하여 모든 IP에서 접근을 허용합니다.

<p align="center"><img src="/images/install-docker-registry-on-ec2-4.JPG" width="80%" class="image__border"></p>

### 2.3. 도커 이미지 push & pull

이제 맥북에서 이미지를 만들어 `push`, `pull` 해보겠습니다. 
간단한 테스트로 도커 허브에서 nginx 이미지를 다운받아서 EC2 인스턴스에 위치한 개인 저장소에 올리겠습니다.

##### nginx 이미지 pull from 도커 허브 on Macbook

```
~ % docker pull nginx
Using default tag: latest
latest: Pulling from library/nginx
5eb5b503b376: Already exists 
1ae07ab881bd: Already exists 
78091884b7be: Already exists 
091c283c6a66: Already exists 
55de5851019b: Already exists 
b559bad762be: Already exists 
Digest: sha256:2834dc507516af02784808c5f48b7cbe38b8ed5d0f4837f16e78d00deb7e7767
Status: Downloaded newer image for nginx:latest
docker.io/library/nginx:latest
```

##### nginx 이미지 태그 변경 및 확인 on Macbook
- `{ec2-instance-public-ip}`에는 본인의 EC2 인스턴스 공개 IP를 사용하면 됩니다.

```
~ % docker tag nginx {ec2-instance-public-ip}:5000/nginx

~ % docker images
REPOSITORY                TAG       IMAGE ID       CREATED      SIZE
{ec2-instance-public-ip}:5000/nginx   latest    c316d5a335a5   5 days ago   142MB
nginx                     latest    c316d5a335a5   5 days ago   142MB
```

##### 이미지 push on Macbook
- `docker push` 명령어를 통해 쉽게 이미지를 업로드할 수 있습니다.

```
~ % docker push {ec2-instance-public-ip}:5000/nginx
Using default tag: latest
The push refers to repository [{ec2-instance-public-ip}:5000/nginx]
762b147902c0: Pushed 
235e04e3592a: Pushed 
6173b6fa63db: Pushed 
9a94c4a55fe4: Pushed 
9a3a6af98e18: Pushed 
7d0ebbe3f5d2: Pushed 
latest: digest: sha256:bb129a712c2431ecce4af8dde831e980373b26368233ef0f3b2bae9e9ec515ee size: 1570
```

##### "Get "https://{ec2-instance-public-ip}:5000/v2/": http: server gave HTTP response to HTTPS client" 에러
- 도커의 `push`, `pull`은 `https` 기반으로 동작하는데 레지스트리는 `http`로 동작하여 문제가 발생합니다.
- 도커 레지스트리를 이용하는 클라이언트의 `daemon.json` 파일에 `insecure-registries` 설정을 추가하면 해결됩니다.
    - 해당 포스트에서 도커 레지스트리를 이용하는 클라이언트는 맥북입니다.
    - 맥북 `daemon.json` 파일 위치 - `~/.docker/daemon.json`
    - 리눅스 `daemon.json` 파일 위치 - `/etc/docker/daemon.json`
    - 윈도우 `daemon.json` 파일 위치 - `C:\ProgramData\docker\config\daemon.json`

```json
{
  "builder": {
    "gc": {
      "defaultKeepStorage": "20GB",
      "enabled": true
    }
  },
  "experimental": false,
  "features": { 
    "buildkit": true
  },
  "insecure-registries": [
    "{ec2-instance-public-ip}:5000"
  ]
}
```

##### 이미지 push 성공 여부 확인 on Macbook
- `curl` 명령어를 통해 push 된 이미지를 확인할 수 있습니다.

```
~ % curl -X GET http://{ec2-instance-public-ip}:5000/v2/_catalog
{"repositories":["nginx"]}
```

##### 이미지 pull from 레지스트리 on Macbook
- 모든 이미지를 지운 상태로 레지스트리에서 이미지를 pull 받습니다.
- 이미지가 정상적으로 받아졌는지 확인합니다.

```
~ % docker images -a
REPOSITORY   TAG       IMAGE ID   CREATED   SIZE

~ % docker pull {ec2-instance-public-ip}:5000/nginx
Using default tag: latest
latest: Pulling from nginx
5eb5b503b376: Already exists 
1ae07ab881bd: Already exists 
78091884b7be: Already exists 
091c283c6a66: Already exists 
55de5851019b: Already exists 
b559bad762be: Already exists 
Digest: sha256:bb129a712c2431ecce4af8dde831e980373b26368233ef0f3b2bae9e9ec515ee
Status: Downloaded newer image for {ec2-instance-public-ip}:5000/nginx:latest
{ec2-instance-public-ip}:5000/nginx:latest

~ % docker images -a                   
REPOSITORY                TAG       IMAGE ID       CREATED      SIZE
{ec2-instance-public-ip}:5000/nginx   latest    c316d5a335a5   5 days ago   142MB
```

#### REFERENCE
- <https://kdeon.tistory.com/52>
- <https://docs.docker.com/config/daemon/>

[what-is-ci-cd-link]: https://junhyunny.github.io/information/what-is-ci-cd/
[jenkins-install-link]: https://junhyunny.github.io/information/jenkins/jenkins-install/
[jenkins-github-webhook-link]: https://junhyunny.github.io/information/jenkins/github/jenkins-github-webhook/

[make-private-docker-registry-on-ec2-link]: https://junhyunny.github.io/information/docker/make-private-docker-registry-on-ec2/
[jenkins-deploy-ec2-using-docker-link]: https://junhyunny.github.io/information/jenkins/jenkins-deploy-ec2-using-docker/
[jenkins-slack-notification-link]: https://junhyunny.github.io/information/jenkins/jenkins-slack-notification/
