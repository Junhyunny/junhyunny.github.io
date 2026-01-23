---
title: "Privileged Mode in Docker"
search: false
category:
  - docker
last_modified_at: 2023-05-18T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Install Docker Daemon into Container Image][install-docker-daemon-into-container-image-link]

## 0. 들어가면서

[Install Docker Daemon into Container Image][install-docker-daemon-into-container-image-link] 포스트에서 컨테이너 내부의 도커 데몬(docker daemon)을 실행하기 위해 적용한 모드입니다. 
해당 모드를 사용하면 보안에 관련된 문제가 발생할 수 있다는 내용들을 발견하여 이번 포스트에서 일부 정리하였습니다. 

## 1. Privileged Mode

일반적인 컨테이너 내부에서 시스템 주요 자원에 접근하려고 시도하면 권한이 없다는 에러 메시지를 확인할 수 있습니다. 
이는 기본적으로 도커 컨테이너가 모든 권한을 부여하지 않은 상태로 실행되기 때문입니다. 
공식 문서를 보면 다음과 같은 설명을 볼 수 있습니다. 

> By default, Docker containers are “unprivileged” and cannot, for example, run a Docker daemon inside a Docker container. This is because by default a container is not allowed to access any devices, but a “privileged” container is given access to all devices (see the documentation on cgroups devices).

예를 들면 다음과 같은 상황이 있습니다.

* `none`이라는 파일 시스템을 /mnt 경로에 마운트(mount)합니다.
    * /mnt 경로에 대한 권한이 없어서 실패합니다.

```
$ docker run -t -i --rm ubuntu bash

root@21c50c1449df:/#  mount -t tmpfs none /mnt
mount: /mnt: permission denied.
```

기본적으로 도커는 컨테이너를 실행할 때 커널(kernel) 기능 중에 위험한 부분들은 모두 제외합니다. 
컨테이너 실행 시 특정 옵션을 통해 모든 커널 기능에 대한 권한을 부여할 수 있습니다. 

* `--privileged` 옵션으로 컨테이너를 실행합니다.
* `none`이라는 파일 시스템을 /mnt 경로에 마운트합니다.
    * 정상적으로 수행됩니다.

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

`privileged` 모드는 호스트 머신의 모든 장치들과 커널의 모든 기능들에 대한 접근을 허용합니다. 
`privileged` 모드로 실행된 컨테이너는 루트(root) 사용자와 동일한 수준으로 호스트 시스템에 대한 접근과 제어가 가능합니다. 
즉, 공격자는 `privileged` 컨테이너를 통해 호스트 머신을 위협할 수 있습니다. 

<p align="center">
    <img src="/images/privileged-mode-in-docker-1.JPG" width="80%" class="image__border">
</p>

### 2.1. Consideration and Risks

`privileged` 모드를 사용하려면 다음과 같은 보안 취약점들을 고려하고 반드시 필요한 상황에만 사용하는 것이 좋습니다. 

* 공격에 대한 노출 증가
    * `privileged` 모드로 실행된 컨테이너는 호스트 시스템의 제한된 영역에 대한 접근 제어가 허용되어 있습니다.
    * 보안이 취약한 `privileged` 컨테이너들을 통해 호스트 시스템이 위협 당할 가능성이 커집니다.
* 악의적인 커널 사용
    * `privileged` 모드로 실행된 컨테이너 내부 애플리케이션은 호스트의 커널 기능에 대한 접근이 허용됩니다.
    * 커널에 취약점이 있는 경우 공격자는 이를 이용해 호스트를 제어할 수 있습니다.
* 컨테이너의 격리성에 미치는 영향
    * 컨테이너의 장점은 각 컨테이너 별 또는 컨테이너와 호스트 시스템 사이에 격리된 환경을 제공한다는 점입니다.
    * `privileged` 컨테이너를 통해 호스트를 제어할 수 있다면, 컨테이너 사이의 의도하지 않은 상호 작용이나 데이터 접근이 가능합니다. 

`privileged` 컨테이너는 다음과 같은 보안 문제들이 발생할 수 있습니다. 

* 컨테이너 브레이크아웃(container breakout)
    * 격리된 컨테이너를 탈출하여 호스트 시스템에 접근하는 행위입니다.
    * 격리된 환경을 깨뜨리는 상황을 컨테이너 브레이크아웃이라고 표현합니다.
* 인가(authorized)되지 않은 호스트 디바이스 접근
* 커널 수준의 공격
* 호스트 시스템의 다른 컨테이너들에게 영향

## 3. Why do we need privileged mode?

보안 취약점을 만드는 `privileged` 모드를 사용하는 이유는 다음과 같습니다. 

* DinD(Docker in Docker)
    * 컨테이너 내부에서 도커 명령어를 수행하는 경우입니다.
    * CI/CD 파이프라인을 구축할 때 주로 활용됩니다.
* 가상화/하이퍼바이저 지원
    * 도커 컨테이너를 통해 가상화 소프트웨어나 하이퍼바이저를 실행하는 경우입니다.
    * KVM(kernel-based virtual machine) 같은 플랫폼을 이용하는 경우를 예로 들수 있습니다. 
* 성능 모니터링 도구 사용
    * 저수준(low-level) 시스템 메트릭(metrics)이나 커널 이벤트 추적에 의존하는 성능 모니터링 도구들을 사용하는 경우입니다. 
    * `privileged` 모드를 통해 모니터링 도구들은 필요한 시스템 자원에 접근하거나 정확한 데이터를 수집할 수 있습니다.
* 도커 기반 시스템 유틸리티
    * 일부 시스템 유틸리티나 진단 도구가 시스템 정보를 수집하거나 시스템 구성을 수정하는 경우입니다. 
* 사용자 지정 네트워크 구성
    * 사용자 지정 네트워크 인터페이스를 만들거나 네트워크 스택 파라미터들을 수정하는 경우입니다.
    * 컨테이너 내부에서 특수한 네트워크 도구를 사용하는 경우를 예로 들수 있습니다.

## 4. Better ways to mitigate security risks

보안 취약점을 만들지만, 필요에 따라 꼭 사용해야한다면 `privileged` 모드의 위험성을 낮출 필요가 있습니다. 
컨테이너를 실행할 때 `privileged` 모드가 필요한지 평가를 하고, 이를 통해 `privileged` 컨테이너 사용을 최소화해야 합니다. 
시스템 자원에 대한 권한이 필요하다면 전체 권한이 아니라 필요한 최소 기능만 제공하는 등의 대체적인 접근 방식을 사용합니다. 

### 4.1. Runtime privilege and Linux capabilities

* 다음과 같은 옵션을 통해 시스템 권한을 제한적으로 제공할 수 있습니다. 

| Option | Description |
|:---:|:---|
| `--cap-add` | Add Linux capabilities | 
| `--cap-drop` | Drop Linux capabilities | 
| `--privileged` | Give extended privileges to this container | 
| `--device=[]` | Allows you to run devices inside the container without the --privileged flag | 

##### Example

* `NET_ADMIN` 기능을 `--cap-add` 옵션을 통해 추가합니다.
    * 네트워크 관련 다양한 기능들을 수행할 수 있는 권한입니다.
* 컨테이너를 별도 옵션 없이 실행하는 경우 `Operation not permitted` 에러가 발생합니다.
* 기능들에 대한 자세한 권한 목록은 아래 공식 홈페이지에서 확인 가능합니다.
    * <https://docs.docker.com/engine/reference/run/#runtime-privilege-and-linux-capabilities>

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

* <https://docs.docker.com/engine/reference/commandline/run/#privileged>
* <https://docs.docker.com/engine/reference/run/#runtime-privilege-and-linux-capabilities>
* <https://stackoverflow.com/questions/31099473/how-to-access-docker-host-filesystem-from-privileged-container>
* <https://docs.docker.com/engine/security/>

[install-docker-daemon-into-container-image-link]: https://junhyunny.github.io/docker/install-docker-daemon-into-container-image/