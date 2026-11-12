---
title: "Docker Privileged 모드"
publishedAt: "2023-05-18"
updatedAt: "2026-11-12T16:19:33+09:00"
canonicalPath: "/docker/privileged-mode-in-docker/"
categories:
  - "docker"
summary: "컨테이너 안에서 도커 데몬을 실행하려고 사용한 privileged 모드의 보안 위험과 필요한 이유를 살펴보고, --cap-add 같은 옵션으로 권한을 최소화하는 방법을 정리했다."
recommendedPosts:
  - title: "Install Docker Daemon into Container Image"
    href: "https://junhyunny.github.io/docker/install-docker-daemon-into-container-image/"
---

## 0. 들어가면서

[Install Docker Daemon into Container Image][install-docker-daemon-into-container-image-link] 글에서 컨테이너 내부의 도커 데몬(docker daemon)을 실행하기 위해 `privileged` 모드를 적용했다. 이 모드를 사용하면 보안 문제가 발생할 수 있다는 내용을 발견해 이번 글에서 일부 정리했다.

## 1. Privileged Mode

일반적인 컨테이너 내부에서 시스템 주요 자원에 접근하려고 하면 권한이 없다는 에러 메시지를 확인할 수 있다. 이는 기본적으로 도커 컨테이너가 모든 권한을 부여하지 않은 상태로 실행되기 때문이다. 공식 문서에는 다음과 같은 설명이 있다.

> By default, Docker containers are "unprivileged" and cannot, for example, run a Docker daemon inside a Docker container. This is because by default a container is not allowed to access any devices, but a "privileged" container is given access to all devices (see the documentation on cgroups devices).

예를 들어 `none`이라는 파일 시스템을 /mnt 경로에 마운트(mount)하면 /mnt 경로에 대한 권한이 없어서 실패한다.

```
$ docker run -t -i --rm ubuntu bash

root@21c50c1449df:/#  mount -t tmpfs none /mnt
mount: /mnt: permission denied.
```

기본적으로 도커는 컨테이너를 실행할 때 커널(kernel) 기능 중 위험한 부분은 모두 제외한다. 컨테이너를 실행할 때 특정 옵션으로 모든 커널 기능에 대한 권한을 부여할 수 있다. `--privileged` 옵션으로 컨테이너를 실행한 뒤 `none`이라는 파일 시스템을 /mnt 경로에 마운트하면 정상적으로 수행된다.

```
$ docker run -t -i --privileged ubuntu bash

root@4a442d097b29:/# mount -t tmpfs none /mnt

root@4a442d097b29:/# df -h
Filesystem      Size  Used Avail Use% Mounted on
overlay          59G   14G   42G  25% /
tmpfs            64M     0   64M   0% /dev
shm              64M     0   64M   0% /dev/shm
/dev/vda1        59G   14G   42G  25% /etc/hosts
none            3.9G     0  3.9G   0% /mnt
```

## 2. Risks of Privileged Mode

`privileged` 모드는 호스트 머신의 모든 장치와 커널의 모든 기능에 대한 접근을 허용한다. `privileged` 모드로 실행된 컨테이너는 루트(root) 사용자와 동일한 수준으로 호스트 시스템에 대한 접근과 제어가 가능하다. 즉, 공격자는 `privileged` 컨테이너를 통해 호스트 머신을 위협할 수 있다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/privileged-mode-in-docker-01.png" width="100%" class="image__border">
</div>

### 2.1. Consideration and Risks

`privileged` 모드를 사용하려면 다음과 같은 보안 취약점을 고려하고 반드시 필요한 상황에만 사용하는 것이 좋다.

- 공격에 대한 노출이 늘어난다. `privileged` 모드로 실행된 컨테이너는 호스트 시스템의 제한된 영역에 대한 접근 제어가 허용되어 있다. 보안이 취약한 `privileged` 컨테이너를 통해 호스트 시스템이 위협당할 가능성이 커진다.
- 커널을 악의적으로 사용할 수 있다. `privileged` 모드로 실행된 컨테이너 내부 애플리케이션은 호스트의 커널 기능에 접근할 수 있다. 커널에 취약점이 있으면 공격자는 이를 이용해 호스트를 제어할 수 있다.
- 컨테이너의 격리성이 훼손된다. 컨테이너의 장점은 컨테이너끼리, 또는 컨테이너와 호스트 시스템 사이에 격리된 환경을 제공한다는 점이다. `privileged` 컨테이너로 호스트를 제어할 수 있다면 컨테이너 사이에 의도하지 않은 상호 작용이나 데이터 접근이 가능하다.

`privileged` 컨테이너에서는 다음과 같은 보안 문제가 발생할 수 있다.

- 컨테이너 브레이크아웃(container breakout): 격리된 컨테이너를 탈출해 호스트 시스템에 접근하는 행위다. 격리된 환경을 깨뜨리는 상황을 컨테이너 브레이크아웃이라고 표현한다.
- 인가(authorized)되지 않은 호스트 디바이스 접근
- 커널 수준의 공격
- 호스트 시스템의 다른 컨테이너에 미치는 영향

## 3. Why do we need privileged mode?

보안 취약점을 만드는 `privileged` 모드를 사용하는 이유는 다음과 같다.

- DinD(Docker in Docker): 컨테이너 내부에서 도커 명령어를 수행하는 경우다. CI/CD 파이프라인을 구축할 때 주로 활용된다.
- 가상화/하이퍼바이저 지원: 도커 컨테이너로 가상화 소프트웨어나 하이퍼바이저를 실행하는 경우다. KVM(kernel-based virtual machine) 같은 플랫폼을 이용하는 경우를 예로 들 수 있다.
- 성능 모니터링 도구 사용: 저수준(low-level) 시스템 메트릭(metrics)이나 커널 이벤트 추적에 의존하는 성능 모니터링 도구를 사용하는 경우다. 모니터링 도구는 `privileged` 모드로 필요한 시스템 자원에 접근하거나 정확한 데이터를 수집할 수 있다.
- 도커 기반 시스템 유틸리티: 일부 시스템 유틸리티나 진단 도구가 시스템 정보를 수집하거나 시스템 구성을 수정하는 경우다.
- 사용자 지정 네트워크 구성: 사용자 지정 네트워크 인터페이스를 만들거나 네트워크 스택 파라미터를 수정하는 경우다. 컨테이너 내부에서 특수한 네트워크 도구를 사용하는 경우를 예로 들 수 있다.

## 4. Better ways to mitigate security risks

보안 취약점을 만들더라도 꼭 사용해야 한다면 `privileged` 모드의 위험성을 낮춰야 한다. 컨테이너를 실행할 때 `privileged` 모드가 정말 필요한지 평가해 `privileged` 컨테이너 사용을 최소화해야 한다. 시스템 자원에 대한 권한이 필요하다면 전체 권한이 아니라 필요한 최소 기능만 제공하는 등의 대안을 사용한다.

### 4.1. Runtime privilege and Linux capabilities

다음과 같은 옵션으로 시스템 권한을 제한적으로 제공할 수 있다.

| Option | Description |
|:---:|:---|
| `--cap-add` | Add Linux capabilities |
| `--cap-drop` | Drop Linux capabilities |
| `--privileged` | Give extended privileges to this container |
| `--device=[]` | Allows you to run devices inside the container without the --privileged flag |

예를 들어 네트워크 관련 다양한 기능을 수행할 수 있는 `NET_ADMIN` 권한을 `--cap-add` 옵션으로 추가하면 컨테이너 안에서 네트워크 설정을 바꿀 수 있다. 별도 옵션 없이 컨테이너를 실행하면 `Operation not permitted` 에러가 발생한다. 기능별 자세한 권한 목록은 [공식 문서](https://docs.docker.com/engine/reference/run/#runtime-privilege-and-linux-capabilities)에서 확인할 수 있다.

```
$ docker run --cap-add=NET_ADMIN -it ubuntu bash

... process of install net-tools

root@c5ecec3d8d89:/# ifconfig
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 65535
        inet 172.17.0.2  netmask 255.255.0.0  broadcast 172.17.255.255
        ether 02:42:ac:11:00:02  txqueuelen 0  (Ethernet)
        RX packets 4071  bytes 25625601 (25.6 MB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 2622  bytes 178570 (178.5 KB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

root@c5ecec3d8d89:/# ifconfig eth0 172.17.0.3

root@c5ecec3d8d89:/# ifconfig
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 65535
        inet 172.17.0.3  netmask 255.255.0.0  broadcast 172.17.255.255
        ether 02:42:ac:11:00:02  txqueuelen 0  (Ethernet)
        RX packets 4071  bytes 25625601 (25.6 MB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 2622  bytes 178570 (178.5 KB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

#### REFERENCE

- <https://docs.docker.com/engine/reference/commandline/run/#privileged>
- <https://docs.docker.com/engine/reference/run/#runtime-privilege-and-linux-capabilities>
- <https://stackoverflow.com/questions/31099473/how-to-access-docker-host-filesystem-from-privileged-container>
- <https://docs.docker.com/engine/security/>

[install-docker-daemon-into-container-image-link]: https://junhyunny.github.io/docker/install-docker-daemon-into-container-image/
