---
title: "Jenkins PATH Environment Variables"
search: false
category:
  - information
  - jenkins
last_modified_at: 2022-10-24T23:55:00
---

<br/>

## 1. 문제 현상

`Mac OS`에 CI/CD 파이프라인(pipeline)을 새롭게 구축하는데 젠킨스(jenkins)가 호스트의 환경 변수를 찾지 못하는 문제가 발생했습니다. 
여러 번 파이프라인을 구축해봤지만, 호스트 바로 위에서 동작하는 젠킨스가 필요한 명령어들을 못 찾는 경우는 처음이었습니다. 
플러그인(plugin) 등을 통해 메이븐(maven), 노드(node) 관련 문제는 해결했지만, 도커를 찾지 못하는 문제에서 다시 막혔습니다. 
이렇게 하나씩 문제를 해결하기보단 젠킨스가 호스트의 PATH 환경 변수를 사용하는 것이 나은 방법으로 보였고, 관련 내용을 이번 포스트에서 정리하였습니다.

##### Jenkins 파이프라인 에러 로그

* `.jenkins` 디렉토리 파이프라인 프로젝트 폴더 안에 위치한 스크립트 실행 시 `mvn` 커맨드를 찾지 못한다는 에러가 발생합니다.

```
+ mvn --version
/Users/junhyunk/.jenkins/workspace/jenkins-test@tmp/durable-1e8ef025/script.sh: line 1: mvn: command not found
```

##### Jenkins 파이프라인 에러 화면

<p align="center">
    <img src="/images/jenkins-path-envrionment-varaible-1.JPG" width="100%" class="image__border">
</p>

## 2. 문제 해결 방법

문제의 원인은 Jenkins 2.374 버전으로 유추되지만, 명백한 원인은 찾지 못하였습니다. 
문제에 대한 정확한 진단은 실패했으므로 해결 방법에 대해서만 정리하였습니다. 

### 2.1. Jenkins System Environment Variable

다음 경로에서 젠킨스 환경 변수 설정을 확인할 수 있습니다. 

* Main Dashboard > Manage Jenkins > System Information > Environment Variables > PATH

##### Main Dashboard Screen

* `Manage Jenkins` 버튼을 클릭합니다.

<p align="center">
    <img src="/images/jenkins-path-envrionment-varaible-2.JPG" width="100%" class="image__border">
</p>

##### Status Information Section

* `Status Information` 버튼을 클릭합니다.

<p align="center">
    <img src="/images/jenkins-path-envrionment-varaible-3.JPG" width="80%" class="image__border">
</p>

##### Environment Variables Section

* `PATH` 항목을 확인합니다.

<p align="center">
    <img src="/images/jenkins-path-envrionment-varaible-4.JPG" width="80%" class="image__border">
</p>

### 2.2. Change PATH Variable 

젠킨스 시스템 설정 파일을 변경합니다. 
시스템 설정 파일은 다음 경로에서 찾을 수 있습니다. 

* `/usr/local/Cellar/jenkins/2.374` 경로
    * `2.374`는 젠킨스 버전이므로 바뀔 수 있습니다.
* `homebrew.mxcl.jenkins.plist` 설정 파일
    * 젠킨스 서버의 포트(port)를 변경할 수 있습니다.
    * 젠킨스 서버의 PATH 값을 지정할 수 있습니다.

```
$ cd /usr/local/Cellar/jenkins/2.374

$ ls

INSTALL_RECEIPT.json        homebrew.jenkins.service    libexec
bin                         homebrew.mxcl.jenkins.plist 
```

해당 파일을 열어 다음과 같은 내용을 파일 아래 추가합니다. 

* `EnvironmentVariables` 키를 사용해 환경 변수를 변경합니다.
* `PATH` 설정에 필요한 경로를 추가합니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    
    <!-- ... other settings -->

    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
</dict>
</plist>
```

### 2.3. Restart Jenkins and Check PATH

젠킨스 서버를 재시작하고 변경된 변수를 확인합니다.

##### 젠킨스 서버 재실행 명령어

```
$ brew services restart jenkins

Stopping `jenkins`... (might take a while)
==> Successfully stopped `jenkins` (label: homebrew.mxcl.jenkins)
==> Successfully started `jenkins` (label: homebrew.mxcl.jenkins)
```
##### 환경 변수 변경 내용 확인

<p align="center">
    <img src="/images/jenkins-path-envrionment-varaible-5.JPG" width="80%" class="image__border">
</p>

### 2.4. 파이프라인 실행 결과 

파이프라인을 재실행하면 정상적으로 `mvn` 명령어가 실행됩니다.

<p align="center">
    <img src="/images/jenkins-path-envrionment-varaible-6.JPG" width="100%" class="image__border">
</p>

#### REFERENCE

* <https://stackoverflow.com/questions/40043004/docker-command-not-found-mac-mini-only-happens-in-jenkins-shell-step-but-wo/58688536#58688536>