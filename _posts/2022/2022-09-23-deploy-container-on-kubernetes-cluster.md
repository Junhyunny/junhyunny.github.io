---
title: "Deploy Simple Container on Kubernetes Cluster"
search: false
category:
  - kubernetes
last_modified_at: 2022-09-23T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Kubernetes Architecture][kubernetes-architecture-link]

## 0. 들어가면서

이번 포스트에서는 간단한 애플리케이션 컨테이너를 쿠버네티스 클러스터(kubernetes cluster)에 배포해보겠습니다. 
배포를 위해 다음과 같은 도구들을 설치합니다. 

* kubectl - 쿠버네티스 클러스터에 명령을 보낼 수 있는 CLI(command line interface) 도구
* minikube - 로컬 컴퓨터(개발자 PC)에 간단한 쿠버네티스 클러스터를 구축할 수 있는 도구

테스트 환경은 다음과 같습니다.

* macOS Monterey
* MacBook pro 
* Intel Core i9

## 1. kubectl 설치

사용자가 쿠버네티스 클러스터에 명령을 보낼 수 있는 CLI 도구입니다. 
CLI 명령어를 통해 애플리케이션 배포, 클러스터 리소스 모니터링과 제어를 수행할 수 있습니다. 

`MacOS`를 사용하는 경우 `Homebrew`를 통해 쉽게 설치할 수 있습니다. 
추후 포스트가 업데이트 되지 않아 설치에 문제가 발생하시는 분들은 [공식 홈페이지][kubectl-cli-install-link]를 참조하시기 바랍니다. 

```
$ brew install kubectl

==> Downloading https://ghcr.io/v2/homebrew/core/kubernetes-cli/manifests/1.25.2
######################################################################## 100.0%
==> Downloading https://ghcr.io/v2/homebrew/core/kubernetes-cli/blobs/sha256:70524523af67dd97038f4faf03459e52b508036efe
==> Downloading from https://pkg-containers.githubusercontent.com/ghcr1/blobs/sha256:70524523af67dd97038f4faf03459e52b5
######################################################################## 100.0%
==> Pouring kubernetes-cli--1.25.2.monterey.bottle.tar.gz
==> Caveats
zsh completions have been installed to:
  /usr/local/share/zsh/site-functions
==> Summary
🍺  /usr/local/Cellar/kubernetes-cli/1.25.2: 228 files, 54.2MB
==> Running `brew cleanup kubernetes-cli`...
Disable this behaviour by setting HOMEBREW_NO_INSTALL_CLEANUP.
Hide these hints with HOMEBREW_NO_ENV_HINTS (see `man brew`).
Removing: /Users/junhyunk/Library/Caches/Homebrew/kubernetes-cli--1.24.2... (15.9MB)
==> `brew cleanup` has not been run in the last 30 days, running now...
Disable this behaviour by setting HOMEBREW_NO_INSTALL_CLEANUP.
Hide these hints with HOMEBREW_NO_ENV_HINTS (see `man brew`).
Removing: /Users/junhyunk/Library/Caches/Homebrew/autojump--22.5.3_3... (46.3KB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/ca-certificates--2022-02-01... (120.8KB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/gdbm--1.23... (270.6KB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/icu4c--70.1... (27.8MB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/libnghttp2--1.47.0... (200.8KB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/libuv--1.43.0... (1.3MB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/mongodb-community--5.0.7.tgz... (64.8MB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/mongodb-database-tools--100.5.3.zip... (60.3MB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/mongosh--1.2.2... (7.7MB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/mpdecimal--2.5.1... (545.2KB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/ncurses--6.3... (2.3MB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/node@14--14.19.0_1... (14.1MB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/openssl@1.1--1.1.1m... (5.2MB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/pcre--8.45... (1.8MB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/python@3.10--3.10.2... (14.4MB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/readline--8.1.2... (534.7KB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/sqlite--3.38.0... (2MB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/xz--5.2.5... (415.3KB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/zsh--5.8.1... (3.6MB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/zsh-autosuggestions--0.7.0... (14.0KB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/python@3.10_bottle_manifest--3.10.2... (18.7KB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/gdbm_bottle_manifest--1.23... (6.1KB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/xz_bottle_manifest--5.2.5... (7.4KB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/zsh-autosuggestions_bottle_manifest--0.7.0-1... (1.8KB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/ca-certificates_bottle_manifest--2022-02-01... (1.8KB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/pcre_bottle_manifest--8.45... (8.6KB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/zsh_bottle_manifest--5.8.1... (9.7KB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/openssl@1.1_bottle_manifest--1.1.1m... (7.6KB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/sqlite_bottle_manifest--3.38.0... (6.9KB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/autojump_bottle_manifest--22.5.3_3... (12.1KB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/mpdecimal_bottle_manifest--2.5.1... (6.9KB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/ncurses_bottle_manifest--6.3... (9KB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/readline_bottle_manifest--8.1.2... (6.6KB)
Removing: /Users/junhyunk/Library/Caches/Homebrew/Cask/iterm2--3.4.15.zip... (23MB)
Removing: /Users/junhyunk/Library/Logs/Homebrew/macos-term-size... (64B)
Removing: /Users/junhyunk/Library/Logs/Homebrew/mongodb-community... (126B)
Removing: /Users/junhyunk/Library/Logs/Homebrew/mongodb-database-tools... (131B)
Removing: /Users/junhyunk/Library/Logs/Homebrew/libuv... (64B)
Removing: /Users/junhyunk/Library/Logs/Homebrew/brotli... (64B)
Removing: /Users/junhyunk/Library/Logs/Homebrew/icu4c... (64B)
Removing: /Users/junhyunk/Library/Logs/Homebrew/mongosh... (64B)
Removing: /Users/junhyunk/Library/Logs/Homebrew/c-ares... (64B)
Removing: /Users/junhyunk/Library/Logs/Homebrew/libnghttp2... (64B)
Removing: /Users/junhyunk/Library/Logs/Homebrew/kubernetes-cli... (64B)
Removing: /Users/junhyunk/Library/Logs/Homebrew/node@14... (64B)

$ kubectl version --client

WARNING: This version information is deprecated and will be replaced with the output from kubectl version --short.  Use --output=yaml|json to get the full version.
Client Version: version.Info{Major:"1", Minor:"25", GitVersion:"v1.25.2", GitCommit:"5835544ca568b757a8ecae5c153f317e5736700e", GitTreeState:"clean", BuildDate:"2022-09-21T14:25:45Z", GoVersion:"go1.19.1", Compiler:"gc", Platform:"darwin/amd64"}
Kustomize Version: v4.5.7
```

## 2. minikube 설치

컨테이너를 배포할 수 있는 쿠버네티스 클러스터를 구축해야합니다. 
`minikube`는 쉽게 쿠버네티스를 학습할 수 있도록 로컬 컴퓨터에 간단한 쿠버네티스 클러스터를 구축할 수 있는 도구입니다. 

다음과 같은 사양이 필요합니다. 

* 2 CPUs or more
* 2GB of free memory
* 20GB of free disk space
* Internet connection
* Container or virtual machine manager, such as: 
    * Docker 
    * Hyperkit
    * Hyper-V
    * KVM
    * Parallels
    * Podman
    * VirtualBox or VMware Fusion/Workstation

마찬가지로 `Homebrew`를 통해 쉽게 설치할 수 있습니다. 
추후 포스트가 업데이트 되지 않아 설치에 문제가 발생하시는 분들은 [공식 홈페이지][minikube-install-link]를 참조하시기 바랍니다. 

```
$ brew install minikube

==> Downloading https://ghcr.io/v2/homebrew/core/minikube/manifests/1.27.0
######################################################################## 100.0%
==> Downloading https://ghcr.io/v2/homebrew/core/minikube/blobs/sha256:1b4e3421d99cb00955a109590998580dcc2997efedd87291
==> Downloading from https://pkg-containers.githubusercontent.com/ghcr1/blobs/sha256:1b4e3421d99cb00955a109590998580dcc
######################################################################## 100.0%
==> Pouring minikube--1.27.0.monterey.bottle.tar.gz
==> Caveats
zsh completions have been installed to:
  /usr/local/share/zsh/site-functions
==> Summary
🍺  /usr/local/Cellar/minikube/1.27.0: 9 files, 73.9MB
==> Running `brew cleanup minikube`...
Disable this behaviour by setting HOMEBREW_NO_INSTALL_CLEANUP.
Hide these hints with HOMEBREW_NO_ENV_HINTS (see `man brew`).
```

## 3. minikube Drivers

`minikube`를 배포하기 위한 환경이 필요합니다. 
드라이버 설정을 통해 `minikube`를 배포할 가상 머신(virtual machine)을 지정할 수 있습니다. 

`MacOS`의 `minikube`는 다음과 같은 드라이버들을 지원합니다. 

* Docker - VM + Container (preferred)
* Hyperkit - VM
* VirtualBox - VM
* Parallels - VM
* VMware Fusion - VM
* QEMU - VM (experimental)
* SSH - remote ssh

이미 설치된 도커를 사용하여 `minikube`를 실행하였습니다. 
아래와 같은 명령어를 통해 `minikube` 실행이 이뤄집니다. 

* `minikube start --driver=docker` 
    * `minikube` 클러스터를 실행할 때 드라이버는 도커로 설정합니다.
* `minikube config set driver docker`
    * 기본 드라이버를 도커로 설정합니다.
* `kubectl get nodes -A`
    * 해당 명령어를 통해 `minikube` 클러스터가 잘 실행되었는지 확인합니다. 

```
$ minikube start --driver=docker

😄  Darwin 12.6 의 minikube v1.27.0
❗  Kubernetes 1.25.0 has a known issue with resolv.conf. minikube is using a workaround that should work for most use cases.
❗  For more information, see: https://github.com/kubernetes/kubernetes/issues/112135
✨  유저 환경 설정 정보에 기반하여 docker 드라이버를 사용하는 중
📌  Using Docker Desktop driver with root privileges
👍  minikube 클러스터의 minikube 컨트롤 플레인 노드를 시작하는 중
🚜  베이스 이미지를 다운받는 중 ...
💾  쿠버네티스 v1.25.0 을 다운로드 중 ...
    > preloaded-images-k8s-v18-v1...:  385.37 MiB / 385.37 MiB  100.00% 22.95 M
    > gcr.io/k8s-minikube/kicbase:  386.76 MiB / 386.76 MiB  100.00% 9.47 MiB p
    > gcr.io/k8s-minikube/kicbase:  0 B [________________________] ?% ? p/s 28s
🔥  Creating docker container (CPUs=2, Memory=7911MB) ...
🐳  쿠버네티스 v1.25.0 을 Docker 20.10.17 런타임으로 설치하는 중
    ▪ 인증서 및 키를 생성하는 중 ...
    ▪ 컨트롤 플레인이 부팅...
    ▪ RBAC 규칙을 구성하는 중 ...
🔎  Kubernetes 구성 요소를 확인...
    ▪ Using image gcr.io/k8s-minikube/storage-provisioner:v5
🌟  애드온 활성화 : storage-provisioner, default-storageclass
🏄  끝났습니다! kubectl이 "minikube" 클러스터와 "default" 네임스페이스를 기본적으로 사용하도록 구성되었습니다.

$ minikube config set driver docker

❗  These changes will take effect upon a minikube delete and then a minikube start

$ kubectl get nodes -A

NAME       STATUS   ROLES           AGE     VERSION
minikube   Ready    control-plane   2m32s   v1.25.0
```

## 4. Deploy Application Container

환경 구축은 완료되었습니다. 
지금부터 간단한 리액트 애플리케이션을 클러스터에 배포하겠습니다. 
코드는 중요하지 않으므로 배포하는 과정에서 사용하는 커맨드만 확인해보겠습니다.  

다음과 같은 과정을 통해 배포가 이뤄집니다. 

1. 애플리케이션 이미지를 빌드합니다.
1. 빌드한 이미지를 도커 허브(docker hub) 같은 원격 이미지 저장소(registry)에 업로드합니다. 
1. 쿠버네티스 설정 파일을 사용해 파드를 클러스터에 배포합니다.
    * 외부에 서비스를 노출할 수 있는 서비스(service) 오브젝트를 배포합니다.
    * 리액트 애플리케이션 컨테이너를 담은 파드(pod) 오브젝트를 배포합니다.
1. 사용자는 브라우저를 이용해 외부에 노출된 서비스 오브젝트에게 리액트 애플리케이션 화면을 요청합니다. 
    * 서비스 오브젝트는 자신이 노출하고 있는 리액트 애플리케이션 파드의 화면을 응답으로 전달합니다.

<p align="center">
    <img src="{{ site.image_url_2022 }}/deploy-container-on-kubernetes-cluster-01.png" width="100%" class="image__border">
</p>

### 4.1. Image Build

도커 이미지를 빌드합니다. 

```
docker build -t opop3966/react-application .
[+] Building 36.5s (17/17) FINISHED
 => [internal] load build definition from Dockerfile                                                                                   0.0s
 => => transferring dockerfile: 337B                                                                                                   0.0s
 => [internal] load .dockerignore                                                                                                      0.0s
 => => transferring context: 2B                                                                                                        0.0s
 => [internal] load metadata for docker.io/library/nginx:latest                                                                       17.6s
 => [internal] load metadata for docker.io/library/node:16-buster-slim                                                                17.7s
 => [auth] library/nginx:pull token for registry-1.docker.io                                                                           0.0s
 => [auth] library/node:pull token for registry-1.docker.io                                                                            0.0s
 => [stage-1 1/3] FROM docker.io/library/nginx@sha256:0b970013351304af46f322da1263516b188318682b2ab1091862497591189ff1                 0.0s
 => [internal] load build context                                                                                                      2.6s
 => => transferring context: 6.30MB                                                                                                    2.6s
 => [builder 1/6] FROM docker.io/library/node:16-buster-slim@sha256:bd728768518439b05d355f58518a01b31a15f58381592e3ffa78e7939889f4f1   0.0s
 => CACHED [stage-1 2/3] COPY conf/nginx.conf /etc/nginx/conf.d/default.conf                                                           0.0s
 => CACHED [builder 2/6] WORKDIR /app                                                                                                  0.0s
 => CACHED [builder 3/6] COPY package.json .                                                                                           0.0s
 => CACHED [builder 4/6] RUN npm install --silent                                                                                      0.0s
 => [builder 5/6] COPY . .                                                                                                             6.6s
 => [builder 6/6] RUN npm run build                                                                                                    8.8s
 => [stage-1 3/3] COPY --from=builder /app/build /usr/share/nginx/html                                                                 0.0s 
 => exporting to image                                                                                                                 0.0s 
 => => exporting layers                                                                                                                0.0s 
 => => writing image sha256:e938240a971fd8b2d4dc5d7a20cba5f5ba2290f8296b24b7f6efed1928be32f4                                           0.0s 
 => => naming to docker.io/opop3966/react-application 
```

### 4.2. Push Image to Docker Hub

빌드한 도커 이미지를 원격 이미지 저장소에 저장합니다. 

```
$ docker push opop3966/react-application

Using default tag: latest
The push refers to repository [docker.io/opop3966/react-application]
91fcd27654d2: Pushed 
eb87189a22be: Pushed 
36665e416ec8: Mounted from library/nginx 
31192a8593ec: Mounted from library/nginx 
7ee9bf58503c: Mounted from library/nginx 
a064c1703bfd: Mounted from library/nginx 
9388548487b1: Mounted from library/nginx 
b45078e74ec9: Mounted from library/nginx 
latest: digest: sha256:abd34dacf27f7d9de5f833aac95bc3d952157aee8156b9511130dc6dc95b62ee size: 1987
```

### 4.3. Deploy Objects

커맨드를 사용해 배포할 수도 있고, yml 파일로 각 오브젝트의 원하는 상태를 정의한 후 이를 이용해 배포하기도 합니다. 
이번 포스트에서는 yml 파일을 사용하여 배포하였습니다. 

#### 4.3.1. Service Object

애플리케이션 컨테이너를 감싼 파드는 `Internal IP`만 가지며 클러스터 내부에서만 접근 가능합니다. 
이번 포스트에서 `minikube`로 구축한 쿠버네티스 클러스터는 도커가 제공하는 VM 환경에서 동작합니다. 
개발자 로컬 컴퓨터는 쿠버네티스 클러스터 입장에선 외부 컴퓨터입니다. 
쿠버네티스의 파드를 배포하고 로컬 컴퓨터의 브라우저로 확인하려면 서비스(service) 오브젝트를 통해 외부와 연결시켜야 합니다. 

##### service.yml

* 가독성을 위해 주석으로 설명을 추가하였습니다.

```yml
apiVersion: v1
kind: Service # 오브젝트 종류
metadata:
  name: external-connection-service # 해당 오브젝트의 이름
spec:
  selector:
    app-type: frontend # 지정된 라벨 키-값이 "app-type: frontend" 파드만 노출
  ports:
    - protocol: 'TCP' 
      port: 80 # 서비스가 사용할 포트
      targetPort: 80 # 대상 파드들의 포트
  type: LoadBalancer # external IP를 사용하여 해당 오브젝트를 외부로 노출하는 서비스 타입
```

##### Kubernetes CLI

* `kubectl apply -f service.yml` 명령어를 통해 서비스를 배포합니다.
* `kubectl get svc` 명령어를 통해 생성된 서비스를 확인합니다.

```
$  kubectl apply -f service.yml

service/external-connection-service configured

$ kubectl get svc 

NAME                          TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
external-connection-service   LoadBalancer   10.104.59.226   <pending>     80:31177/TCP   89m
kubernetes                    ClusterIP      10.96.0.1       <none>        443/TCP        9h
```

#### 4.3.2. Deployment Object

개발한 애플리케이션 컨테이너를 배포합니다. 
단순한 파드가 아니라 지정한 레플리케이션 개수만큼 파드 개수를 유지해주는 디플로이먼트(deployment) 오브젝트를 배포하였습니다. 

##### deployment.yml

* 가독성을 위해 주석으로 설명을 추가하였습니다.

```yml
apiVersion: apps/v1
kind: Deployment # 오브젝트 종류
metadata:
  name: react-app-deployment # 해당 오브젝트의 이름
spec:
  replicas: 3 # 유지할 파드 개수
  selector:
    matchLabels:
      app-type: frontend # 지정된 라벨 키-값이 "app-type: frontend" 파드만 관리 
  template: 
    metadata:
      labels:
        app-type: frontend # 파드에 지정하는 라벨 키-값
    spec:
      containers:
        - name: react-application # 컨테이너 이름
          image: opop3966/react-application:latest # 컨테이너를 만들 때 필요한 이미지
```

##### Kubernetes CLI

* `kubectl apply -f deployment.yml` 명령어를 통해 디플로이먼트를 배포합니다.
* `kubectl get deployment` 명령어를 통해 배포된 디플로이먼트를 확인합니다.
* `kubectl get replicaset` 명령어를 통해 배포된 레플리카셋을 확인합니다.
* `kubectl get pod` 명령어를 통해 배포한 파드들을 확인합니다.
    * 3개의 파드가 배포되었음을 알 수 있습니다.

```
$ kubectl apply -f deployment.yml 

deployment.apps/react-app-deployment created

$ kubectl get deployment 

NAME                   READY   UP-TO-DATE   AVAILABLE   AGE
react-app-deployment   3/3     3            3           24s

$ kubectl get replicaset

NAME                              DESIRED   CURRENT   READY   AGE
react-app-deployment-5fb9b4754d   3         3         3       33s

$ kubectl get pod

NAME                                    READY   STATUS    RESTARTS   AGE
react-app-deployment-5fb9b4754d-s45qs   1/1     Running   0          43s
react-app-deployment-5fb9b4754d-tpztz   1/1     Running   0          43s
react-app-deployment-5fb9b4754d-wrsxr   1/1     Running   0          43s
```

## 5. Expose Service

필요한 오브젝트들은 모두 배포했지만, 로컬 컴퓨터에서 서비스에 직접 붙지 못합니다. 
배포한 서비스 오브젝트의 정보를 다시 살펴보고, 터널링을 통해 외부로 노출시키겠습니다. 

* `external-connection-service` 서비스의 `EXTERNAL-IP` 값이 `pending` 상태입니다. 
* `EXTERNAL-IP`은 클라우드 프로바이더(cloud provider)에 의해 제공됩니다. 
* `minikube` 환경에선 별도로 노출된 IP가 없으므로 `minikube service ${service_name}` 명령어를 통해 터널링(tunneling)을 수행합니다.

```
$ kubectl get svc 

NAME                          TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
external-connection-service   LoadBalancer   10.104.59.226   <pending>     80:31177/TCP   89m
kubernetes                    ClusterIP      10.96.0.1       <none>        443/TCP        9h

$ minikube service external-connection-service

|-----------|-----------------------------|-------------|---------------------------|
| NAMESPACE |            NAME             | TARGET PORT |            URL            |
|-----------|-----------------------------|-------------|---------------------------|
| default   | external-connection-service |          80 | http://192.168.49.2:31177 |
|-----------|-----------------------------|-------------|---------------------------|
🏃  external-connection-service 서비스의 터널을 시작하는 중
|-----------|-----------------------------|-------------|------------------------|
| NAMESPACE |            NAME             | TARGET PORT |          URL           |
|-----------|-----------------------------|-------------|------------------------|
| default   | external-connection-service |             | http://127.0.0.1:53623 |
|-----------|-----------------------------|-------------|------------------------|
🎉  Opening service default/external-connection-service in default browser...
❗  Because you are using a Docker driver on darwin, the terminal needs to be open to run it.
```

##### 서비스 터널링 수행 후 브라우저 접근

<p align="center">
    <img src="{{ site.image_url_2022 }}/deploy-container-on-kubernetes-cluster-02.png" width="100%" class="image__border">
</p>

## CLOSING

`minikube tunnel` 명령어를 통해 터널링을 수행할 수 있습니다. 

* 한 터미널에서 터널링을 수행합니다. 
* 다른 터미널에서 서비스의 `EXTERNAL-IP` 확인하면 `<pending>`에서 IP 값으로 바뀐 것을 확인할 수 있습니다.
* `127.0.0.1:80` 주소를 통해 서비스에 접근 가능합니다. 

```
$  minikube tunnel

✅  Tunnel successfully started

📌  NOTE: Please do not close this terminal as this process must stay alive for the tunnel to be accessible ...

❗  The service/ingress external-connection-service requires privileged ports to be exposed: [80]
🔑  sudo permission will be asked for it.
🏃  external-connection-service 서비스의 터널을 시작하는 중
```

```
$ kubectl get svc

NAME                          TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
external-connection-service   LoadBalancer   10.104.59.226   127.0.0.1     80:31177/TCP   10h
kubernetes                    ClusterIP      10.96.0.1       <none>        443/TCP        18h
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-09-23-deploy-container-on-kubernetes-cluster>

#### REFERENCE

* [Docker & Kubernetes: The Practical Guide [2022 Edition]][docker-kube-lecture-link]
* <https://kubernetes.io/docs/tasks/tools/>
* <https://minikube.sigs.k8s.io/docs/drivers/>
* <https://minikube.sigs.k8s.io/docs/handbook/accessing/>

[kubernetes-architecture-link]: https://junhyunny.github.io/kubernetes/kubernetes-architecture/
[kubectl-cli-install-link]: https://kubernetes.io/docs/tasks/tools/install-kubectl-macos/
[minikube-install-link]: https://minikube.sigs.k8s.io/docs/start/

[docker-kube-lecture-link]: https://www.udemy.com/course/docker-kubernetes-the-practical-guide/
