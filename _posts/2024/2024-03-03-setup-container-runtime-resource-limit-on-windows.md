---
title: "Setup Container Runtime Resource Limit on Windows"
search: false
category:
  - docker
  - podman
  - windows
last_modified_at: 2024-03-03T23:55:00
---

<br/>

## 1. Problem Context

윈도우 운영체제에서 컨테이너는 WSL(Windows Subsystem for Linux)에서 동작한다. WSL도 일종의 가상 머신이기 때문에 별도로 리소스를 관리한다. WSL 시스템이 사용 중인 리소스 사이즈는 `vmmem`이라는 가상 머신의 리소스 사용량을 알려주는 프로세스를 통해 확인할 수 있다. 

문제는 서버를 실행하고 시간이 지날수록 차지하는 `vmmem` 프로세스 메모리 사이즈가 점점 커지더니 서버가 다운되는 현상이 발생했다. 매우 작은 서비스이기 때문에 메모리가 크지 않았고 애플리케이션 코드에 메모리 누수가 될만한 상황도 없었다. 관련된 문제를 찾아봤다. 

`vmmem` 프로세스가 사용 중인 CPU, 메모리는 윈도우 작업 관리자에서 확인할 수 있다. 

<p align="center">
  <img src="/images/posts/2024/setup-container-runtime-resource-limit-on-windows-01.png" width="80%" class="image__border">
</p>

## 2. Solve the problem

마이크로소프트 공식 문서를 보면 다음과 같은 글을 확인할 수 있다. 

> Main WSL settings - memory size(default)<br/>
> 50% of total memory on Windows or 8GB, whichever is less; on builds before 20175: 80% of your total memory on Windows

WSL 시스템의 메모리는 기본적으로 윈도우 운영체제의 50%나 8GB 중 작은 것을 사용한다. 20175 이전 빌드를 사용하는 경우 80% 메모리를 사용한다고 한다. 간단한 서비스 컨테이너 두 개를 실행하기엔 너무 과도하게 리소스를 사용했다. 리소스 제한이 필요했다. 

### 2.1. GUI Tools

도커 데스크탑이나 파드맨 데스크탑 같은 GUI 도구를 통해 리소스를 제한을 시도했다. 라이센스 문제로 중간에 컨테이너 런타임을 변경했기 때문에 두가지 도구를 모두 확인할 수 있었다. 캡처한 이미지는 필자의 개인 PC이기 때문에 리소스 정보는 실제 서버와 전혀 무관하다.

- 서비스를 릴리즈하기 전 사용한 도커 데스크탑의 리소스 설정 화면이다.
- 직접 설정할 수 없고 `.wslconfig` 파일을 사용하라는 설명을 볼 수 있다.

<p align="center">
  <img src="/images/posts/2024/setup-container-runtime-resource-limit-on-windows-02.png" width="80%" class="image__border">
</p>

- 서비스를 릴리즈한 후 사용한 파드맨 데스크탑의 리소스 설정 화면이다.
- 할당된 리소스가 CPU 12개, 디스크 1TB, 메모리 16GB임을 확인할 수 있다.
- 직접 리소스 제한을 설정할 수 있는 방법은 없다.

<p align="center">
  <img src="/images/posts/2024/setup-container-runtime-resource-limit-on-windows-03.png" width="80%" class="image__border">
</p>

### 2.2. Setup .wslconfig file

도커 데스크탑 리소스 설정 화면에서 알려주듯 윈도우 운영체제에서 컨테이너 런타임 리소스를 제한하라면 `.wslconfig` 파일을 통해 WSL 리소스를 직접 제한해야한다. `.wslconfig`은 해당 운영체제에 설치된 모든 WSL 시스템들에 대해 전역 설정을 할 수 있는 파일이다. `C:\Users\<UserName>` 경로에 `.wslconfig` 파일을 만든다.

```
> ls .wslconfig


    디렉터리: C:\Users\KANGJUNHYUN


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----      2024-03-03   오후 2:10              0 .wslconfig
```

파일에 다음과 같은 설정 값을 작성한다.

- CPU 프로세서를 2개 사용한다.
- 메모리를 2GB로 제한한다.

```
[wsl2]
processors=2
memory=2GB
```

### 2.3. Re-run WSL 

설정을 변경했다면 적용을 위해 WSL 시스템을 재실행한다. WSL 시스템을 종료하는 것은 컨테이너들을 호스팅하는 가상 머신을 종료하는 것과 동일하기 때문에 실제 운영 환경이라면 주의하길 바란다. 특정 배포판 WSL만 종료하려면 `wsl --terminate <distroName>` 명령어를 사용한다.

```
> wsl --shutdown
```

WSL 시스템 리스트를 확인하면 모든 시스템들이 멈춘 것을 볼 수 있다. 

```
> wsl -l -v
  NAME                      STATE           VERSION
* podman-machine-default    Stopped         2
  docker-desktop            Stopped         2
  docker-desktop-data       Stopped         2
```

파드맨 머신을 재실행한다.

```
> podman machine start
Starting machine "podman-machine-default"
API forwarding listening on: npipe:////./pipe/docker_engine

Docker API clients default to this address. You do not need to set DOCKER_HOST.
Machine "podman-machine-default" started successfully
```

파드맨 데스크탑 리소스 설정을 보면 메모리가 최대 2GB로 제한된 것을 확인할 수 있다.

<p align="center">
  <img src="/images/posts/2024/setup-container-runtime-resource-limit-on-windows-04.png" width="80%" class="image__border">
</p>

#### REFERENCE

- <https://learn.microsoft.com/en-us/windows/wsl/wsl-config>
- <https://www.minitool.com/news/vmmem-high-memory.html>
- <https://ralpioxxcs.github.io/post/wslconfig/>