---
title: "Linux alien command to change package extension"
search: false
category:
  - information
  - linux
last_modified_at: 2021-08-29T11:50:00
---

<br/>

## 0. 들어가면서

 change (feat. 확장자 변환 .rpm > .deb)
최근 우분투에서 `.rpm` 확장자 파일을 다운받아 `.deb` 확장자 파일로 변환하여 특정 소프트웨어를 설치하였습니다. 
저는 주로 우분투를 사용하였기에 `.rpm` 확장자를 가지는 파일은 처음 보았습니다. 
관련된 내용을 정리해둬야겠습니다. 

## 1. Package extension

`.rpm` 파일은 레드햇(redhat) 계열 리눅스에서 사용하는 패키지 확장자다. rpm 명령어에 의해 설치, 업데이트, 삭제가 이뤄진다. 레드햇 계열 리눅스는 다음과 같다.

- Red Hat Linux
- Fedora
- CentOS

`.deb` 파일은 데비안(debian) 계열 리눅스에서 사용하는 패키지 확장자다. dpkg 명령어에 의해 설치, 업데이트, 삭제가 이뤄진다. 데비안 계열 리눅스는 다음과 같다.

- Debian
- Ubuntu
- Linux Mint

## 2. alien command

필자는 우분투를 사용하는 중이다. 필요한 패키지가 있었는 데 .rpm 형식만 찾을 수 있었다. 우분투에서 .rpm 파일을 직접 사용할 수 없기 때문에 alien 명령어를 통해 .rpm 파일을 .deb 파일로 변환했다. 다음 명령어로 설치한다.

```
$ sudo apt-get update

$ sudo apt-get upgrade

$ sudo apt install alien
```

alien 명령어의 옵션을 살펴보자. 

```
$ alien -h
Usage: alien [options] file [...]
  file [...]                Package file or files to convert.
  -d, --to-deb              Generate a Debian deb package (default).
     Enables these options:
       --patch=<patch>      Specify patch file to use instead of automatically
                            looking for patch in /var/lib/alien.
       --nopatch            Do not use patches.
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
  -V, --version             Display alien's version number.
```

.rpm 패키지 파일이 위치한 디렉토리에서 작업을 수행한다. 

- .rpm 형식을 .deb 형식으로 변경할 땐 `-d` 옵션을 사용한다.
- 패키지 내 스크립트를 함께 포함시키기 위해 `--scripts` 옵션을 사용한다.

```
$ ls
galera-4-26.4.9-1.el8.x86_64.rpm

$ sudo alien --scripts -d galera-4-26.4.9-1.el8.x86_64.rpm 
warning: galera-4-26.4.9-1.el8.x86_64.rpm: Header V4 DSA/SHA1 Signature, key ID 1bb943db: NOKEY
warning: galera-4-26.4.9-1.el8.x86_64.rpm: Header V4 DSA/SHA1 Signature, key ID 1bb943db: NOKEY

...

galera-4_26.4.9-2_amd64.deb generated

$ ls
galera-4-26.4.9-1.el8.x86_64.rpm  galera-4_26.4.9-2_amd64.deb
```

#### REFERENCE

- <https://ko.wikipedia.org/wiki/Dpkg>
- <https://en.wikipedia.org/wiki/RPM_Package_Manager>
- <https://seulcode.tistory.com/548>