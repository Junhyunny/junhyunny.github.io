---
title: "Jenkins PATH Environment Variables"
search: false
category:
  - information
  - jenkins
last_modified_at: 2022-10-24T23:55:00
---

<br/>

## 0. 들어가면서

`맥OS(MacOS)` 운영체제에 젠킨스(jenkins)를 사용해 CI/CD 파이프라인을 새로 구축했다. 여러 프로젝트에서 젠킨스를 사용해봤지만, 호스트 머신의 환경 변수를 찾지 못하는 문제는 처음이었다. 이번 글은 호스트 머신의 환경 변수를 직접 지정하는 방법에 대해 정리했다. 

## 1. Problem Context

CI/CD 파이프라인에서 애플리케이션을 빌드하기 위해 필요한 도구들을 찾지 못하는 문제가 발생했다.

- 메이븐(maven)
- 노드(node)
- 도커(docker)

파이프라인 스크립트를 실행하면 다음과 같은 에러를 만난다.

<div align="center">
  <img src="/images/posts/2022/jenkins-path-envrionment-varaible-01.png" width="100%" class="image__border">
</div>

<br/>

메이븐이나 노드는 플러그인을 사용해 해결했지만, 도커 문제는 쉽게 해결되지 않았다. 호스트 머신에 설치된 도커를 직접 사용하는 것이 더 쉬운 해결 방법이라 생각했다. 젠킨스가 호스트 머신의 `PATH` 환경 변수를 사용할 수 있는 방법을 찾아봤다.

## 2. Solve the problem

Jenkins 2.374 버전에서 문제가 발생하는 것 같다. 정확한 원인을 찾지 못 했다. 해결 방법에 대해서만 정리한다. 

### 2.1. Jenkins System Environment Variable

다음 경로에서 젠킨스 환경 변수 설정을 확인할 수 있다.

- Main Dashboard > Manage Jenkins > System Information > Environment Variables > PATH

해당 페이지까지 이동해보자. 메인 대시보드 화면에서 `Manage Jenkins` 버튼을 클릭한다.

<div align="center">
  <img src="/images/posts/2022/jenkins-path-envrionment-varaible-02.png" width="100%" class="image__border">
</div>

<br/>

`Status Information` 섹션이 보이면 해당 섹션에서 `Status Information` 버튼을 클릭합니다.

<div align="center">
  <img src="/images/posts/2022/jenkins-path-envrionment-varaible-03.png" width="80%" class="image__border">
</div>

<br/>

`Environment Variables` 섹션에서 `PATH` 항목을 확인한다.

<div align="center">
  <img src="/images/posts/2022/jenkins-path-envrionment-varaible-04.png" width="80%" class="image__border">
</div>

### 2.2. Change PATH Variable 

젠킨스 시스템 설정 파일을 변경한다. 시스템 설정 파일은 다음 경로에서 찾을 수 있다. 

- `/usr/local/Cellar/jenkins/2.374` 경로로 이동한다.
  - `2.374`는 젠킨스 버전이므로 바뀔 수 있다.
- `homebrew.mxcl.jenkins.plist` 설정 파일이 존재하는지 확인한다.
  - 해당 파일에서 젠킨스 애플리케이션의 포트(port)나 PATH 정보를 변경할 수 있다.

```
$ cd /usr/local/Cellar/jenkins/2.374

$ ls
INSTALL_RECEIPT.json        homebrew.jenkins.service    libexec
bin                         homebrew.mxcl.jenkins.plist 
```

`homebrew.mxcl.jenkins.plist` 파일을 열고 다음과 같은 내용을 파일 아래 추가한다. 

- `EnvironmentVariables` 키를 사용해 환경 변수를 변경한다.
- `PATH` 설정에 필요한 경로를 추가한다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    
    ...

    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
</dict>
</plist>
```

### 2.3. Restart Jenkins and Check PATH

젠킨스 애플리케이션 서버를 재시작한다. 

```
$ brew services restart jenkins

Stopping `jenkins`... (might take a while)
==> Successfully stopped `jenkins` (label: homebrew.mxcl.jenkins)
==> Successfully started `jenkins` (label: homebrew.mxcl.jenkins)
```

애플리케이션 재실행이 끝나면 위 `Environment Variables` 화면에서 환경 변수가 바뀌었는지 확인한다.

<div align="center">
  <img src="/images/posts/2022/jenkins-path-envrionment-varaible-05.png" width="80%" class="image__border">
</div>

<br/>

이전에 문제가 발생했던 파이프라인을 재실행하면 정상적으로 `mvn` 명령어가 실행된다.

<div align="center">
  <img src="/images/posts/2022/jenkins-path-envrionment-varaible-06.png" width="100%" class="image__border">
</div>

#### REFERENCE

- <https://stackoverflow.com/questions/40043004/docker-command-not-found-mac-mini-only-happens-in-jenkins-shell-step-but-wo/58688536#58688536>