---
title: "MacBook M4(ARM64)에 VirtualBox 가상머신 게스트 확장 기능 설치"
search: false
category:
  - virtual-box
  - guest-addition
  - macbook-pro
  - m4-chip
  - arm64
last_modified_at: 2025-08-15T23:55:00
---

<br/>

## 0. 들어가면서

가상 머신에서 칼리 리눅스를 설치해서 해킹이나 보안에 관련된 공부를 하고 있다. 아무래도 가상머신과 호스트 머신의 클립보드가 공유되지 않아서 복사와 붙여넣기가 불편했다. 게스트 확장 기능(guest addition)을 설치하면 쉽게 가능하지만, M4 맥북에서 설치가 원활하지 않았다. 설치 과정에서 겪은 문제들과 해결 방법에 관련된 내용을 정리했다. 

## 1. Guest addition on VirtualBox

VirtualBox의 게스트 확장 기능(guest addition)은 가상 머신 속 게스트 OS에 설치하는 드라이버와 유티리티 모음이다. 목적은 게스트 OS와 호스트 OS 간의 통합성을 높이고, 가상 머신을 더 자연스럽게 사용할 수 있도록 하기 위함이다.

게스트 확장 기능의 주요 내용은 다음과 같다.

- 공유 클립보드(Shared Clipboard)
  - 호스트와 게스트 간 복사/붙여넣기 기능 제공(텍스트·파일 드래그 등)한다.
- 드래그 앤 드롭(Drag and Drop)
  - 호스트와 게스트 사이에 파일을 마우스로 끌어다 놓기 가능하다.
- 화면 해상도 자동 조정(Seamless/Auto-resize)
  - VM 창 크기를 조절하면 게스트 OS의 해상도가 자동으로 맞춰진다.
  - 전체 화면 및 무경계 모드(Seamless Mode) 지원한다.
- 마우스 포인터 통합(Mouse Pointer Integration)
  - 마우스를 호스트와 게스트 사이에 매끄럽게 이동(캡처/해제 불필요)한다.
- 게스트 시간 동기화(Time Synchronization)
  - 게스트 OS의 시간이 호스트와 자동으로 맞춰진다.
- 공유 폴더(Shared Folders)
  - 호스트 OS의 특정 폴더를 게스트 OS에서 네트워크 드라이브처럼 접근 가능하다.
- 3D 가속 및 그래픽 성능 향상
  - 가상 머신의 그래픽 드라이버 개선, 3D 가속 사용 가능하다.
- 네트워크 성능 개선
  - 일부 네트워크 어댑터 드라이버 최적화한다.

## 2. Install guest addition

칼리 리눅스에서 게스트 확장 기능을 설치한다. 가상 머신에 설치한 칼리 리눅스 이미지는 `kali-linux-2025.2-installer-arm64.iso`다. OS 설치는 되었다고 가정하고, 게스트 확장 기능 설치에 관련된 내용만 다룬다. 가상 머신을 선택 후 화면 `Device` 메뉴를 선택한다. `Insert Guest Additions CD image...` 항목을 선택한다.

<div align="center">
  <img src="/images/posts/2025/install-guest-addition-of-virtualbox-on-macbook-m4-01.png" width="80%" class="image__border">
</div>

<br/>

해당 버튼을 누르면 바탕화면에 가상 CDROM 폴더가 생성된다.

<div align="center">
  <img src="/images/posts/2025/install-guest-addition-of-virtualbox-on-macbook-m4-02.png" width="100%" class="image__border">
</div>

<br/>

가상 CDROM 폴더로 진입 후 해당 디렉토리에서 터미널을 오픈한다.

<div align="center">
  <img src="/images/posts/2025/install-guest-addition-of-virtualbox-on-macbook-m4-03.png" width="100%" class="image__border">
</div>

<br/>

폴더에 어떤 파일들이 있는지 `ls` 명령어로 살펴보자. 게스트 확장 기능을 여러 타입의 OS에서 실행할 수 있도록 스크립트 혹은 실행 파일들이 있는 것을 확인할 수 있다.

```
$ ls

AUTORUN.INF                        VBoxDarwinAdditionsUninstall.tool
autorun.sh                         VBoxLinuxAdditions-arm64.run
cert                               VBoxLinuxAdditions.run
NT3x                               VBoxSolarisAdditions.pkg
OS2                                VBoxWindowsAdditions-amd64.exe
runasroot.sh                       VBoxWindowsAdditions.exe
TRANS.TBL                          VBoxWindowsAdditions-x86.exe
VBoxDarwinAdditions.pkg            windows11-bypass.reg
```

맥북 프로 M4 칩은 ARM64 아키텍처이므로 `VBoxLinuxAdditions-arm64.run` 스크립트를 실행한다. 

```
$ sudo sh VBoxLinuxAdditions-arm64.run

[sudo] password for junhyunny: 

Verifying archive integrity... 100% MD5 checksums are OK. All good.
Uncompressing VirtualBox 7.1.12 Guest Additions for Linux 100%
VirtualBox Guest Additions installer
VirtualBox Guest Additions: Starting.
VirtualBox Guest Additions: Setting up modules
VirtualBox Guest Additions: Building the VirtualBox Guest Additions kernel modules. This may take a while.
VirtualBox Guest Additions: To build modules for other installed kernels, run
VirtualBox Guest Additions:  /sbin/rcvboxadd quicksetup <version>
VirtualBox Guest Additions: or
VirtualBox Guest Additions:  /sbin/rcvboxadd quicksetup all
VirtualBox Guest Additions: Kernel headers not found for target kernel 6.12.25-arm64. Please install them and execute
 /sbin/rcvboxadd setup
VirtualBox Guest Additions: reloading kernel modules and services
VirtualBox Guest Additions: unable to load vboxguest kernel module, see dmesg
VirtualBox Guest Additions: kernel modules and services were not reloaded
The log file /var/log/vboxadd-setup.log may contain further information.
```

해당 스크립트를 실행하면 로그에서 에러 메시지를 확인할 수 있다. 설치 과정 중 현재 시스템의 커널(6.12.25-arm64)에 맞는 커널 헤더(Kernel headers)를 찾을 수 없어 빌드에 실패했다는 에러가 보인다.

```
Kernel headers not found for target kernel 6.12.25-arm64. Please install them and execute
```

이 때문에 게스트 확장 기능에 필요한 커널 모듈을 로드하지 못하고 설치가 중단된다. 문제 해결을 위해 먼저 커널 헤더를 설치한 후 `/sbin/rcvboxadd setup` 명령어를 다시 실행하라고 안내하고 있다. 헤더를 설치하기 위해 패키지 목록을 최신화한다.

```
$ sudo apt-get update
```

최신화 된 목록을 바탕으로 설치된 패키지들을 업그레이드한다.

```
$ sudo apt-get upgrade
```

이제 필요한 커널 헤더를 설치한다. `linux-headears-` 접두어까지만 작성 후 탭(tab) 키를 누르면 설치할 수 있는 후보 리스트를 볼 수 있다. 

```
$ sudo apt-get install linux-headers-

Completing package
linux-headers-6.12.33-kali-arm64         linux-headers-6.12.33-kali-rt-arm64      linux-headers-arm64-16k
linux-headers-6.12.33-kali-arm64-16k     linux-headers-6.12.34-rpt-common-rpi     linux-headers-cloud-arm64
linux-headers-6.12.33-kali-cloud-arm64   linux-headers-6.12.34-rpt-rpi-2712       linux-headers-rpi-2712
linux-headers-6.12.33-kali-common        linux-headers-6.12.34-rpt-rpi-v8         linux-headers-rpi-v8
linux-headers-6.12.33-kali-common-rt     linux-headers-arm64                      linux-headers-rt-arm64
```

나는 `linux-headers-6.12.33-kali-arm64` 패키지를 설치했다. 

```
$ sudo apt-get install linux-headers-6.12.33-kali-arm64

Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
The following packages were automatically installed and are no longer required:
  python3-packaging-whl python3-pyinstaller-hooks-contrib python3-wheel-whl
Use 'sudo apt autoremove' to remove them.
The following additional packages will be installed:
  linux-headers-6.12.33-kali-common linux-image-6.12.33-kali-arm64 linux-kbuild-6.12.33-kali pahole
Suggested packages:
  linux-doc-6.12 debian-kernel-handbook
The following NEW packages will be installed:
  linux-headers-6.12.33-kali-arm64 linux-headers-6.12.33-kali-common linux-image-6.12.33-kali-arm64 linux-kbuild-6.12.33-kali pahole
The following packages will be upgraded:
  linux-image-arm64
1 upgraded, 5 newly installed, 0 to remove and 4 not upgraded.
Need to get 109 MB of archives.
After this operation, 557 MB of additional disk space will be used.
Do you want to continue? [Y/n] 

...

Processing triggers for kali-menu (2025.3.0) ...
Processing triggers for man-db (2.13.1-1) ...
```

설치가 완료되면 시스템을 재부팅한다. 

```
$ sudo reboot
```

재부팅이 완료되면 위와 동일한 방법으로 가상 CDROM 폴더에서 터미널을 오픈한다. 이후 위에서 실패했던 게스트 확장 기능을 재설치한다. 

```
$ sudo sh VBoxLinuxAdditions-arm64.run

[sudo] password for junhyunny: 

Verifying archive integrity... 100% MD5 checksums are OK. All good.
Uncompressing VirtualBox 7.1.12 Guest Additions for Linux 100%
VirtualBox Guest Additions installer
Removing installed version 7.1.12 of VirtualBox Guest Additions...
update-initramfs: Generating /boot/initrd.img-6.12.33-kali-arm64
VirtualBox Guest Additions: Starting.
VirtualBox Guest Additions: Setting up modules
VirtualBox Guest Additions: Building the VirtualBox Guest Additions kernel modules. This may take a while.
VirtualBox Guest Additions: To build modules for other installed kernels, run
VirtualBox Guest Additions:  /sbin/rcvboxadd quicksetup <version>
VirtualBox Guest Additions: or
VirtualBox Guest Additions:  /sbin/rcvboxadd quicksetup all
VirtualBox Guest Additions: Building the modules for kernel 6.12.33-kali-arm64.
update-initramfs: Generating /boot/initrd.img-6.12.33-kali-arm64
```

설치가 정상적으로 완료되었으면 시스템을 재부팅한다. 

```
$ sudo reboot
```

시스템이 재부팅 된 이후 가상 머신의 클립보드(clipboard)와 드래그-앤-드랍(drag-and-drop) 기능을 양방향으로 활성화한다. 화면 상단 `Devices` 메뉴에서 클립보드, 드래그-앤-드랍 기능을 모두 공유할 수 있다. `Shared Clipbaord`에서 `Bidirectional` 항목을 선택한다.

<div align="center">
  <img src="/images/posts/2025/install-guest-addition-of-virtualbox-on-macbook-m4-04.png" width="80%" class="image__border">
</div>

#### REFERENCE

- <https://unix.stackexchange.com/questions/328655/cant-install-linux-headers-kali-linux>