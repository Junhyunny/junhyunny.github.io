---
title: "M4(ARM64) MacBook에 Metasploitable2 설치하기"
search: false
category:
  - security
  - hacking
  - white-hacking
  - penetration-test
  - pentest
  - scanning
  - macbook-pro
  - m4-chip
  - arm64
last_modified_at: 2025-08-23T23:55:00
---

<br/>

## 1. Metasploitable2

침투 테스트(penetation test)에선 스캐닝(scanning) 단계가 있다. 스캐닝은 대상 시스템의 네트워크, 서비스 버전, 운영체제, 포트, 엔드포인트 등을 식별하고 분석하는 작업을 의미한다. 하지만 스캐닝을 시도하는 것은 불법이다. 단순히 포트를 열어보거나 서비스 배너를 수집하는 작업이 아니라 법적으로 시스템에 접근을 시도하는 행위로 해석될 수 있기 때문이다. 일부 국가는 이런 행위를 무단 친입 시도 또는 통신망 침해로 규정하고 있다. 무분별한 포트 스캐닝이나 대량의 패킷 전송은 서비스 장애를 유발할 가능성도 있다. 허락 없이 무단 접근하면 의도가 어찌됐든 공격 준비 행위로 해석된다.

그렇다면 펜테스트 연습은 어떻게 할 수 있을까? 가상 머신을 사용하면 된다. 보안이 취약한 서버 이미지를 가상 머신으로 실행하고, 이를 대상으로 펜테스트를 수행하면 된다. 대표적인 서버 이미지로 `Metasploitable`가 있다. Metasploitable는 보안 연구, 모의해킹(penetration testing), 보안 교육을 목적으로 만들어진 의도적으로 취약한(Vulnerable by design) 리눅스 가상 머신 이미지다. 

Metasploitable는 Ubuntu 기반의 VMware/VirtualBox 가상 머신 이미지다. 보안 전문가나 학생이 취약점을 학습하고 Metasploit Framework 등 공격 도구를 연습할 수 있도록 설계되었다. 다양한 취약한 소프트웨어와 설정이 기본 설치되어 있으므로 실제 해킹 시나리오 실습 가능하다. [소스포지(sourceforge) 사이트](https://sourceforge.net/projects/metasploitable/)에서 다운로드 받을 수 있다. 

## 2. Install

M4 맥북에서 Metasploitable를 VirtualBox로 실행할 수 없다. VirtualBox에서 실행하면 다음과 같은 UEFI Shell 화면이 보인다. 

<div align="center">
  <img src="/images/posts/2025/install-metasploitable-01.png" width="80%" class="image__border">
</div>

<br/>

Metasploitable2가 설치된 디스크로 부팅하지 못하고, 펌웨어(UEFI) 내부의 셸 환경으로 진입한 것이다. 이 상황은 보통 부팅 순서 문제 또는 디스크/OS 부팅 파티션 인식 실패 때문에 발생한다. VirtualBox에서 ARM 아키텍처 VM은 x86 운영체제를 직접 실행할 수 없기 때문에, 아무리 EFI를 꺼도 부팅이 되지 않고 UEFI Shell로 빠진다. 

이번 글에선 `QEMU(quick emulator)` 기반의 GUI 도구인 `UTM`을 사용해 Metasploitable2 가상 머신을 실행한다. QEMU는 오픈소스 기반의 하이퍼바이저(hypervisior)이자 에뮬레이터로 컴퓨터 위에서 다른 컴퓨터의 하드웨어나 운영체제를 가상으로 실행할 수 있게 해주는 소프트웨어다. 에뮬레이터이기 때문에 실제 CPU 아키텍처와 다른 아키텍처를 흉내낼 수 있다.

먼저, 다음 명령어를 통해 QEMU를 설치한다.

```
$ brew install qemu
```

UTM을 다운로드 받아서 설치한다. [이 사이트](https://mac.getutm.app/)에서 다운로드 받을 수 있다. UTM 다운로드가 완료되면 실행한다. 해당 화면에서 `새로운 가상 머신 생성` 버튼을 누른다.

<div align="center">
  <img src="/images/posts/2025/install-metasploitable-02.png" width="80%" class="image__border">
</div>

<br/>

`에뮬레이션`을 선택한다.

<div align="center">
  <img src="/images/posts/2025/install-metasploitable-03.png" width="80%" class="image__border">
</div>

<br/>

`기타`을 선택한다.

<div align="center">
  <img src="/images/posts/2025/install-metasploitable-04.png" width="80%" class="image__border">
</div>

<br/>

부팅 장치 `없음`을 선택한다. 레거시 하드웨어는 선택하지 않는다.

<div align="center">
  <img src="/images/posts/2025/install-metasploitable-05.png" width="80%" class="image__border">
</div>

<br/>

아키텍처는 `x86_64`를 선택한다. 메모리는 `512MiB`로 설정한다. `계속`을 눌러 진행한다. 

<div align="center">
  <img src="/images/posts/2025/install-metasploitable-06.png" width="80%" class="image__border">
</div>

<br/>

드라이브 크기는 `2GiB`로 설정한다. `계속`을 눌러 진행한다. 

<div align="center">
  <img src="/images/posts/2025/install-metasploitable-07.png" width="80%" class="image__border">
</div>

<br/>

공유 디렉터리는 별도 설정 없이 `계속`을 눌러 진행한다. 부팅 디스크 설정이 필요하므로 `가상 머신 설정 열기` 체크 박스를 선택 후 `저장`을 누른다. 가상 머신 이름은 원하는 이름을 사용한다.

<div align="center">
  <img src="/images/posts/2025/install-metasploitable-08.png" width="80%" class="image__border">
</div>

<br/>

가상 머신 설정 화면에서 몇 가지 설정이 필요하다. 우선 QEMU 탭에서 `UEFI 부팅을 비활성화`한다.

<div align="center">
  <img src="/images/posts/2025/install-metasploitable-09.png" width="80%" class="image__border">
</div>

<br/>

펜테스트를 하기 위해선 호스트 머신의 브릿지를 통해 네트워크를 공유해야 한다. 가상 머신으로 실행한 칼리 리눅스로 펜테스트를 수행하기 때문에 칼리 리눅스, Metasploitable2 두 머신 모두 호스트의 네트워크 브릿지를 사용한다.

<div align="center">
  <img src="/images/posts/2025/install-metasploitable-10.png" width="80%" class="image__border">
</div>

<br/>

부팅 디스크를 설정한다. 우선 기본으로 설정된 드라이브를 제거한다. 기존 드라이브를 오른쪽 클릭 후 `제거` 버튼을 클릭한다.

<div align="center">
  <img src="/images/posts/2025/install-metasploitable-11.png" width="80%" class="image__border">
</div> 

<br/>

드라이브 `새로 만들기`를 선택 후 `가져오기`를 클릭한다. 

<div align="center">
  <img src="/images/posts/2025/install-metasploitable-12.png" width="80%" class="image__border">
</div> 

<br/>

사전에 다운로드 받아놓은 `Metasploitable.vmdk` 파일을 선택한다.

<div align="center">
  <img src="/images/posts/2025/install-metasploitable-13.png" width="80%" class="image__border">
</div> 

<br/>

설치한 드라이브를 선택 후 `저장` 버튼을 클릭하면 `vmdk` 파일이 `qcow2` 파일로 자동으로 변경된다. 

<div align="center">
  <img src="/images/posts/2025/install-metasploitable-14.png" width="80%" class="image__border">
</div> 

<br/>

설치가 완료 후 가상 머신을 실행하면 다음과 같은 터미널 화면을 볼 수 있다. 아이디와 비밀번호는 모두 `msfadmin`이다.

<div align="center">
  <img src="/images/posts/2025/install-metasploitable-15.png" width="80%" class="image__border">
</div> 

<br/>

네트워크가 잘 연결되었느지 `ifconig` 명령어를 실행해본다. 호스트 머신의 IP 주소와 동일한 주소로 시작한다면 정상적으로 연결된 것이다.

<div align="center">
  <img src="/images/posts/2025/install-metasploitable-16.png" width="80%" class="image__border">
</div> 

<br/>

호스트 머신에서 `ping` 명령어로 Metasploitable2 가상 머신의 연결 여부를 확인할 수 있다.

```
$ ping 192.168.0.78

PING 192.168.0.78 (192.168.0.78): 56 data bytes
64 bytes from 192.168.0.78: icmp_seq=0 ttl=64 time=11.931 ms
64 bytes from 192.168.0.78: icmp_seq=1 ttl=64 time=1.442 ms

--- 192.168.0.78 ping statistics ---
2 packets transmitted, 2 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 1.442/6.686/11.931/5.244 ms
```

혹은 `cURL` 명령어를 실행하여 연결 여부를 확인할 수도 있다.

```
$ curl 192.168.0.78

<html><head><title>Metasploitable2 - Linux</title></head><body>
<pre>

                _                  _       _ _        _     _      ____
 _ __ ___   ___| |_ __ _ ___ _ __ | | ___ (_) |_ __ _| |__ | | ___|___ \
| '_ ` _ \ / _ \ __/ _` / __| '_ \| |/ _ \| | __/ _` | '_ \| |/ _ \ __) |
| | | | | |  __/ || (_| \__ \ |_) | | (_) | | || (_| | |_) | |  __// __/
|_| |_| |_|\___|\__\__,_|___/ .__/|_|\___/|_|\__\__,_|_.__/|_|\___|_____|
                            |_|


Warning: Never expose this VM to an untrusted network!

Contact: msfdev[at]metasploit.com

Login with msfadmin/msfadmin to get started


</pre>
<ul>
<li><a href="/twiki/">TWiki</a></li>
<li><a href="/phpMyAdmin/">phpMyAdmin</a></li>
<li><a href="/mutillidae/">Mutillidae</a></li>
<li><a href="/dvwa/">DVWA</a></li>
<li><a href="/dav/">WebDAV</a></li>
</ul>
</body>
</html>
```

#### REFERENCE

- <https://sourceforge.net/projects/metasploitable/>
- <https://tomhoon.tistory.com/754>