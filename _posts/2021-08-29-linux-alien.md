---
title: "[Linux] alien 명령어 (feat. 확장자 변환 .rpm > .deb)"
search: false
category:
  - information
  - linux
last_modified_at: 2021-08-29T11:50:00
---

<br>

최근 우분투에서 `.rpm` 확장자 파일을 다운받아 `.deb` 확장자 파일로 변환하여 특정 소프트웨어를 설치하였습니다. 
저는 주로 우분투를 사용하였기에 `.rpm` 확장자를 가지는 파일은 처음 보았습니다. 
관련된 내용을 정리해둬야겠습니다. 

## 1. .rpm 파일 

> 레드햇 패키지 매니저(Redhat Package Manager) 프로그램이 관리하는 파일 형식

`.rpm` 확장자는 레드햇(Redhat) 계열 리눅스의 패키지 매니저가 관리하는 파일 형식을 의미하는 것 입니다. 
리눅스는 새로운 프로그램(혹은 소프트웨어) 설치, 업데이트, 삭제 작업에서 패키지를 사용합니다.
레드햇 계열의 리눅스는 RPM(Redhat Packaage Manager)에 의해 패키지가 관리되며, `.rpm` 파일은 RPM이 사용하는 패키지 포맷의 확장자를 의미합니다. 

##### 레드햇(Redhat) 계열 리눅스
- Red Hat Linux
- Fedora
- CentOS

## 2. .deb 파일

> 데비안 계열 리눅스의 소프트웨어 패키지 포맷의 확장자

`.deb` 확장자는 데비안 계열 리눅스 의 패키지 매니저가 사용하는 파일 형식을 의미합니다. 
데비안 패키지 관리 시스템의 기초 소프트웨어 중 `dpkg`에 의해 설치, 삭제, 정보 제공되어지는 파일의 확장자입니다. 

##### 데비안(Debian) 계열 리눅스
- Debian
- Ubuntu
- Linux Mint

## 3. alien 명령어
우분투에서 `.rpm` 파일을 받아 설치하려니 당연히 변환 작업이 필요한 것이었습니다. 
alien 명령어 설치 방법부터 사용 예시까지 정리해보겠습니다.  

### 3.1. 설치

#### 3.1.1. 패키지 최신화
```
$ sudo apt-get update
$ sudo apt-get upgrade
```

#### 3.1.2. alien 설치
```
$ sudo apt install alien
```

### 3.2. 명령어 살펴보기

```
$ alien -h
Usage: alien [options] file [...]
  file [...]                Package file or files to convert.
  -d, --to-deb              Generate a Debian deb package (default).
     Enables these options:
       --patch=<patch>      Specify patch file to use instead of automatically
                            looking for patch in /var/lib/alien.
       --nopatch	        Do not use patches.
       --anypatch           Use even old version os patches.
       -s, --single         Like --generate, but do not create .orig
                            directory.
       --fixperms           Munge/fix permissions and owners.
       --test               Test generated packages with lintian.
  -r, --to-rpm              Generate a Red Hat rpm package.
      --to-slp              Generate a Stampede slp package.
  -l, --to-lsb              Generate a LSB package.
  -t, --to-tgz              Generate a Slackware tgz package.
     Enables these options:
       --description=<desc> Specify package description.
       --version=<version>  Specify package version.
  -p, --to-pkg              Generate a Solaris pkg package.
  -i, --install             Install generated package.
  -g, --generate            Generate build tree, but do not build package.
  -c, --scripts             Include scripts in package.
      --target=<arch>       Set architecture of the generated package.
  -v, --verbose             Display each command alien runs.
      --veryverbose         Be verbose, and also display output of run commands.
  -k, --keep-version        Do not change version of generated package.
      --bump=number         Increment package version by this number.
  -h, --help                Display this help message.
  -V, --version		        Display alien's version number.
```

### 3.3. 명령어 사용

#### 3.3.1. 변경 전 디렉토리
```
~/Downloads$ ls
galera-4-26.4.9-1.el8.x86_64.rpm
```

#### 3.3.2. 명령어 수행
- `.rpm` 파일을 `.deb` 파일로 변경하는 `-d` 옵션을 사용합니다.
- `--scripts` 옵션으로 패키지 내 스크립트도 함께 포함시킵니다.
- `warning`의 원인과 해결 방법에 대해서 확인 중 입니다.

```
~/Downloads$ sudo alien --scripts -d galera-4-26.4.9-1.el8.x86_64.rpm 
warning: galera-4-26.4.9-1.el8.x86_64.rpm: Header V4 DSA/SHA1 Signature, key ID 1bb943db: NOKEY
warning: galera-4-26.4.9-1.el8.x86_64.rpm: Header V4 DSA/SHA1 Signature, key ID 1bb943db: NOKEY
...
galera-4_26.4.9-2_amd64.deb generated
```

#### 3.3.3. 변경 전 디렉토리
```
~/Downloads$ ls
galera-4-26.4.9-1.el8.x86_64.rpm  galera-4_26.4.9-2_amd64.deb
```

## OPINION
개발을 진행하다보면 리눅스 명령어를 자주 사용하게 되는데 관련 명령어를 정리한 적이 없습니다. 
매번 인터넷에서 찾다보니 예전에 참고했던 내용을 다시 못 찾는 경우도 허다합니다. 
오늘부터라도 블로그에 기록해두고 찾아서 사용해야겠습니다. 

#### REFERENCE
- <https://ko.wikipedia.org/wiki/Dpkg>
- <https://en.wikipedia.org/wiki/RPM_Package_Manager>
- <https://seulcode.tistory.com/548>