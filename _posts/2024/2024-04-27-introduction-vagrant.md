---
title: "Introduction Vagrant"
search: false
category:
  - infrastructure
  - dev-ops
last_modified_at: 2024-04-27T23:55:00
---

<br/>

## 0. 들어가면서

필자는 운영체제(operating system) 중에서도 엔지니어라면 친숙해야하는 리눅스(linux) 공부를 시작했다. 어떤 운영체제에서 실습을 하던 가상 머신(virtual machine)을 사용하는 것이 안전할 것이다. 실습 환경을 구성하는 것도 상당히 귀찮은 일인데 하시코프(HashiCorp)에서 코드를 통해 동일한 가상 머신 환경을 프로비저닝(provisioning) 해주는 베이그란트(vagrant)라는 애플리케이션을 제공한다는 사실을 알았다. 이번 글은 베이그란트(Vagrant)를 소개하고 간단하게 환경을 구성하는 방법을 정리했다.

## 1. Vagrant 

프로비저닝이라는 단어가 익숙하지 않는 사람들을 위해서 간단하게 개념을 정리해보자.

> 프로비저닝은 IT 인프라를 생성하고 설정하는 프로세스

베이그란트는 프로비저닝의 여러 종류 중 서버 프로비저닝을 지원한다. 서버 프로비저닝은 물리적 혹은 가상화 된 하드웨어를 세팅하고, 운영체제나 애플리케이션 등을 설치하는 작업을 의미한다. 

베이그란트는 가상 머신 환경을 구축하고 관리하는 도구이다. 가상 머신 환경 구축을 자동화하여 개발 환경 설정 시간을 줄여준다. VirtualBox, VMWare 같은 가상 머신 제공자들(providers) 위에서 프로비저닝을 수행한다. 소프트웨어 업계 표준으로 사용되는 

개발자들은 다른 의존성들로부터 격리되고 일관성 있지만, 쉽게 사용하고 처분할 수 있는 환경을 쉽게 구성할 수 있다. DevOps 엔지니어인 경우 인프라를 관리할 수 있는 스크립트를 만들 수 있고, 일관된 일회성 테스트 환경을 구성할 수 있다. 

베이그란트는 다음과 같은 아키텍처를 갖는다.

1. 사용자는 필요한 환경에 대해 정의된 베이그란트 파일(vagrant file)을 만든다.
2. `vagrant up` 명령어를 통해 가상 머신을 실행한다.
3. VirtualBox, VMWare 같은 가상 머신 제공자에 의해 가상 머신이 준비된다. 
  - 가상 머신 이미지 정보는 베이그란트 파일에 명시되어 있다.
  - 가상 머신 구축을 위해 필요한 이미지가 호스트 머신에 없다면 베이그란트 클라우드에서 다운로드 받는다.
4. 베이그란트 파일에 명시된 프로비저닝을 실행한다.
  - 프로비저닝은 쉘 스크립트, 앤서블, 도커 등 어떤 프로비저를 사용해도 상관 없다.
  - 준비된 가상 머신에 필요한 애플리케이션을 설치한다.
5. 프로비저닝까지 완료되면 `vagrant ssh` 명령어를 사용해 가상 머신에 접속한다.

<p align="center">
  <img src="/images/posts/2024/introduction-vagrant-01.png" width="80%" class="image__border">
</p>
<center>https://quintagroup.com/blog/what-is-vagrant-and-when-should-one-turn-to-it</center>

## 2. Single Virtual Machine

간단하게 가상 머신을 프로비저닝 해보자. 베이그란트와 VirtualBox 설치 방법은 별도로 정리하지 않았다. 공식 홈페이지에서 쉽게 다운로드 받아 설치할 수 있다. 프로비저닝 전에 용어를 먼저 정리한다. 

- 박스(box)
  - 사용자가 원하는 가상 머신 이미지를 의미한다.
- 프로젝트(project)
  - 사용자가 작성한 베이그란트 파일이 저장된 폴더를 의미한다.

### 2.1. Make Vagrant Project

먼저 프로젝트를 하나 만든다. 

1. single-vm 디렉토리를 만든다.
2. single-vm 디렉토리로 이동한다.
3. 베이그란트 프로젝트를 초기화한다.

```
$ mkdir single-vm

$ cd single-vm

$ vagrant init
A `Vagrantfile` has been placed in this directory. You are now
ready to `vagrant up` your first virtual environment! Please read
the comments in the Vagrantfile as well as documentation on
`vagrantup.com` for more information on using Vagrant.
```

### 2.2. Make Vagrant File

프로젝트를 초기화가 완료되면 베이그란트 파일이 생성된다. 

```
$ ls

Vagrantfile
```

파일을 열어보면 설정 방법과 설명이 주석으로 작성되어 있다. 이번 예시에서 불필요한 내용들은 정리하고 살펴보자. 각 설정에 대한 설명은 가독성을 위해 주석으로 작성했다.

```vagrantfile
Vagrant.configure("2") do |config|

  # 우분투 이미지를 사용한다.
  config.vm.box = "ubuntu/trusty64"

  # 프라이빗 네트워크를 구성한다. 호스트 머신만 해당 IP 주소로 접근할 수 있다.
  config.vm.network "private_network", ip: "192.168.33.10"

  # 가상 머신 제공자를 정의한다.
  # 이번 예시에선 VirtualBox를 사용한다.
  config.vm.provider "virtualbox" do |vb|
    # GUI 환경에서 실행할 것인지 정의한다.
    vb.gui = false
    # 가상 머신 메모리를 정의한다.
    vb.memory = "1024"
  end

  # 프로비저너를 설정한다. 
  # 위에서 설명했듯 쉘 스크립트(shell script), 앤서블(ansible), 도커(docker), 퍼팻(puppet) 어떤 것을 사용해도 무관하다.
  # 이번 예시에선 쉘 스크립트를 사용해 apache2 애플리케이션을 미리 준비한다.
  config.vm.provision "shell", inline: <<-SHELL
    apt-get update
    apt-get install -y apache2
  SHELL
end
```

### 2.3. Provisioning Virtual Machine

다음과 같은 베이그란트 명령어를 실행한다.

- 가상 머신을 실행한다.
- 가상 머신 실행이 완료되면 쉘 스크립트 프로비저닝을 실행한다.

```
$ vagrant up

Bringing machine 'default' up with 'virtualbox' provider...
==> default: Importing base box 'ubuntu/trusty64'...
==> default: Matching MAC address for NAT networking...
==> default: Checking if box 'ubuntu/trusty64' version '20190514.0.0' is up to date...
==> default: Setting the name of the VM: single-vm_default_1714232088814_8252
==> default: Clearing any previously set forwarded ports...
==> default: Clearing any previously set network interfaces...
==> default: Preparing network interfaces based on configuration...
    default: Adapter 1: nat
    default: Adapter 2: hostonly
==> default: Forwarding ports...
    default: 22 (guest) => 2222 (host) (adapter 1)
==> default: Running 'pre-boot' VM customizations...
==> default: Booting VM...
==> default: Waiting for machine to boot. This may take a few minutes...
    default: SSH address: 127.0.0.1:2222
    default: SSH username: vagrant
    default: SSH auth method: private key

    ....

    default: /vagrant => C:/Users/KANGJUNHYUN/Desktop/workspace/blog/blog-in-action/2024-04-27-introduction-vagrant/single-vm
==> default: Running provisioner: shell...
    default: Running: inline script
    default: Ign http://archive.ubuntu.com trusty InRelease
    default: Get:1 http://archive.ubuntu.com trusty-updates InRelease [56.4 kB]
    default: Get:2 http://security.ubuntu.com trusty-security InRelease [56.4 kB]

    ... 

    default:  * Starting web server apache2
    default: AH00558: apache2: Could not reliably determine the server's fully qualified domain name, using 10.0.2.15. Set the 'ServerName' directive globally to suppress this message
    default:  *
    default: Setting up ssl-cert (1.0.33) ...
    default: Processing triggers for libc-bin (2.19-0ubuntu6.15) ...
    default: Processing triggers for ufw (0.34~rc-0ubuntu2) ...
    default: Processing triggers for ureadahead (0.100.0-16) ...
```

가상 머신 프로비저닝이 완료되면 VirtualBox 윈도우에서 가상 머신이 실행되고 있는 것을 확인할 수 있다.

<p align="center">
  <img src="/images/posts/2024/introduction-vagrant-02.png" width="80%" class="image__border">
</p>

### 2.4. Connect via SSH

설치한 가상 머신으로 접속해보자. 베이그란트 명령어를 사용하면 설치한 가상 머신의 사용자 이름이나 비밀번호를 모르더라도 SSH 접근이 가능하다. 베이그란트는 가상 머신을 프로비저닝할 때 준비한 SSH 인증(authentication) 키를 사용한다.

- `vagrant ssh` 명령어를 실행한다.
- 가상 머신에 접속되면 프로비저닝 한 apache2 애플리케이션이 설치 됐는지 확인한다.

```
$ vagrant ssh

Welcome to Ubuntu 14.04.6 LTS (GNU/Linux 3.13.0-170-generic x86_64)

 * Documentation:  https://help.ubuntu.com/

  System information as of Sat Apr 27 15:40:47 UTC 2024

  System load:  0.0               Processes:           78
  Usage of /:   3.7% of 39.34GB   Users logged in:     0
  Memory usage: 14%               IP address for eth0: 10.0.2.15
  Swap usage:   0%                IP address for eth1: 192.168.33.10

  Graph this data and manage this system at:
    https://landscape.canonical.com/

New release '16.04.7 LTS' available.
Run 'do-release-upgrade' to upgrade to it.


Last login: Sat Apr 27 15:40:47 2024 from 10.0.2.2
vagrant@vagrant-ubuntu-trusty-64:~$ which apache2
/usr/sbin/apache2
```

## CLOSE

베이그란트 파일 하나로 여러 개의 가상 머신을 프로비저닝할 수 있다. 동시에 여러 개를 컨트롤 할 수도 있지만, 명령어 뒤에 가상 머신 이름을 명시하면 각 가상 머신 별로 컨트롤이 가능하다. 다중 가상 머신을 프로비저닝할 일이 생긴다면 그때 정리할 생각이다.

가상 머신을 준비하고 실행하는 `vagrant up` 명령어 외에도 다음과 같은 명령어들이 존재한다.  

```
$ vagrant halt [VM] # 가상 머신을 종료한다.

$ vagrant up [VM] # 가상 머신을 실행한다.

$ vagrant suspend [VM] # 가상 머신을 일시 정지한다.

$ vagrant resume [VM] # 일시 정지한 가상 머신을 다시 실행한다.

$ vagrant destroy [VM] # 가상 머신을 삭제한다.
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-04-27-introduction-vagrant>

#### RECOMMEND NEXT POSTS

- [Introduction Terraform][introduction-terraform-link]

#### REFERENCE

- <https://developer.hashicorp.com/vagrant/intro>
- <https://developer.hashicorp.com/vagrant/docs/installation#windows-virtualbox-and-hyper-v>
- <https://quintagroup.com/blog/what-is-vagrant-and-when-should-one-turn-to-it>

[introduction-terraform-link]: https://junhyunny.github.io/information/infrastructure/dev-ops/introduction-terraform/