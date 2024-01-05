---
title: "Kubernetes Architecture"
search: false
category:
  - kubernetes
last_modified_at: 2022-09-21T23:55:00
---

<br/>

## 1. Kubernetes

쿠버네티스(kubernetes)는 컨테이너(container)화 된 어플리케이션의 배포, 스케일링 및 관리를 간편하게 해주는 도구입니다. 
적은 개수의 컨테이너들을 관리하는 것은 사람이 가능하지만, 엔터프라이즈 급의 시스템을 구성하는 수백, 수천 개의 컨테이너들을 사람이 직접 제어, 관리하는 것은 불가능합니다. 
오픈 소스 기반의 컨테이너 오케스트레이션(container orchestration)인 쿠버네티스는 운영자가 선언한 원하는 상태(desired state)를 맞추기 위해 현재 상태(current state)를 계속 변경합니다. 
현재 상태를 지속적으로 확인하다가 원하는 상태와 불일치가 발생하면 이를 다시 원하는 상태로 되돌립니다. 

<p align="center">
    <img src="/images/kubernetes-architecture-1.JPG" width="80%" class="image__border">
</p>
<center>https://www.leverege.com/iot-ebook/kubernetes-object-management-model</center>

### 1.1. Kubernetes Benefits

비슷한 역할을 수행하는 도커 스웜(docker swarm), 아파치 메소스(apache mesos), 노마드(nomad) 같은 도구들이 있지만, 사실상 업계 표준으로 사용되는 쿠버네티스는 다음과 같은 장점들을 가지고 있습니다. 

* 많은 앱 컨테이너들을 배포, 관리하기 쉽다.
* 배포할 앱 컨테이너가 요구하는 리소스 등을 고려하여 배포될 노드를 자동으로 선택한다. 
* 컨테이너에 문제가 발생하거나 노드에 장애가 발생하는 경우 자동적으로 문제가 없는 다른 노드로 스케줄링한다. 
* 특정 앱 컨테이너의 부하가 급격하게 발생하는 경우 이를 모니터링하고 있다가 자동으로 스케일 아웃(scale out)한다. 

## 1. Cluster

쿠버네티스가 어떤 아키텍처 구조를 통해 다수의 컨테이너들을 다루는지 살펴보겠습니다. 
쿠버네티스는 클러스터(cluster) 단위로 자원들을 관리합니다. 
클러스터는 논리적으론 노드(node)들의 집합이고, 실제로는 물리 혹은 가상 머신들의 집합입니다. 

<p align="center">
    <img src="/images/kubernetes-architecture-2.JPG" width="80%" class="image__border">
</p>
<center>[Kubernetes] 쿠버네티스 설치 및 클러스터 설정</center>

## 2. Node

클러스터에 속한 물리 혹은 가상 머신들입니다. 
정해진 역할에 따라 마스터 노드(master node)와 워커 노드(worker node)로 구분됩니다. 

마스터 노드는 컨트롤 플레인(control plane)으로 불리기도 하며, 쿠버네티스 클러스터에 포함된 워커 노드들을 관리, 제어하는 역할을 수행합니다. 
워커 노드들의 가용 리소스 현황을 고려하여 대규모 컨테이너들을 운영합니다. 
각 컨테이너에 대한 효율적인 관리를 위해 지속적으로 추적합니다. 
규모에 따라 다르지만 작으면 VM 1대, 고가용성(high availability) 필요한 경우 여러 대의 VM으로 마스터 노드들을 구축합니다. 

워커 노드는 실제 어플리케이션 컨테이너들이 배포되는 영역으로 개발된 어플리케이션들은 파드(pod)라는 오브젝트에 묶여 실행, 배포됩니다. 
실제 일을 수행하는 노드이므로 서비스 규모에 따라 여러 대의 VM을 사용합니다. 

##### Master Node And Worker Nodes

* 노드 종류에 따라 구성 요소(component)들이 다르며, 각 노드를 구성하는 요소들과 역할들을 알아보겠습니다. 

<p align="center">
    <img src="/images/kubernetes-architecture-3.JPG" width="80%" class="image__border">
</p>
<center>Kubernetes in Action</center>

### 2.1. Master Node Components

클러스터의 마스터 노드가 수행하는 기능들은 아래 컴포넌트들을 통해 이뤄집니다. 
클러스터의 노드를 살펴보면 `kube-system` 이름 영역(namespace)에 파드 형태로 동작하고 있습니다. 
미니 큐브(minikube) 클러스터 환경에서 아래 `kubectl get pods -A` 커맨드로 조회하면 `kube-system` 이름 영역에 다음과 같은 파드들을 살펴볼 수 있습니다. 

* etcd-minikube - etcd 컴포넌트
* kube-apiserver-minikube - API Server 컴포넌트
* kube-controller-manager-minikube - Controller Manager 컴포넌트
* kube-scheduler-minikube - Scheduler 컴포넌트

```
$ kubectl get pods -A

NAMESPACE              NAME                                         READY   STATUS    RESTARTS      AGE
default                auth-deployment-77d859dccc-js2bm             1/1     Running   1 (8h ago)    70d
default                frontend-service-bf44d559-n62vr              1/1     Running   3 (8h ago)    70d
default                tasks-deployment-78b85cddc6-jvmqv            1/1     Running   1 (8h ago)    70d
default                users-deployment-7fdb868bb8-6bdp5            1/1     Running   1 (8h ago)    70d
kube-system            coredns-6d4b75cb6d-lvt9q                     1/1     Running   6 (8h ago)    76d
kube-system            etcd-minikube                                1/1     Running   7 (8h ago)    76d
kube-system            kube-apiserver-minikube                      1/1     Running   7 (8h ago)    76d
kube-system            kube-controller-manager-minikube             1/1     Running   8 (8h ago)    76d
kube-system            kube-proxy-n7xcg                             1/1     Running   7 (8h ago)    76d
kube-system            kube-scheduler-minikube                      1/1     Running   7 (8h ago)    76d
kube-system            storage-provisioner                          1/1     Running   10 (8h ago)   76d
kubernetes-dashboard   dashboard-metrics-scraper-78dbd9dbf5-nrlml   1/1     Running   4 (8h ago)    76d
kubernetes-dashboard   kubernetes-dashboard-5fd5574d9f-6mzvg        1/1     Running   8 (8h ago)    76d
```

#### 2.1.1. etcd 

클러스터 안에 각 구성 요소들에 대한 정보를 키-값(key-value) 형태로 저장하고 있는 데이터베이스입니다. 
`etcd` 컴포넌트는 API 서버를 통해서만 통신 가능하며 다음과 같은 정보들이 저장됩니다. 

* 클러스터에 노드가 몇 개인지
* 각 파드들이 어떤 컨테이너를 들고 있는지
* 각 파드들이 어떤 노드에서 어떻게 동작하고 있는지

운영자가 마스터 노드와 통신하기 위한 쿠버네티스 CLI(command line interface)인 `kubectl`이 조회 가능한 모든 정보는 `etcd`에 저장됩니다. 
제어 명령을 통해 클러스터에 변화가 발생해도 `etcd`에 업데이트가 발생합니다. 
`etcd`에 저장된 데이터가 유실되면 클러스터에 속한 모든 구성 요소들을 잃어버리므로 클러스터 구축 시 고가용성 확보를 고민해야 합니다. 

* [etcd 고가용성 구축 가이드](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/ha-topology/)

#### 2.1.2. Scheduler

어플리케이션 컨테이너가 담긴 파드를 클러스터 내 워커 노드에 최적의 배포를 수행하는 컴포넌트입니다. 
파드를 어느 노드에 배치할지 결정만 수행합니다. 
실제로 해당 노드에 파드를 배치하는 작업은 워커 노드의 컴포넌트인 `kubelet`이 수행합니다. 

스케줄러가 파드를 할당할 때 노드에 우선 순위를 부여하는 방법은 다음과 같습니다.

1. 파드가 요구하는 컴퓨팅 자원(CPU, 메모리)를 기준으로 필터를 수행합니다.
1. 파드가 배치된 후 해당 노드에 남는 잔여 컴퓨팅 자원의 양을 기준으로 삼습니다. 

#### 2.1.3. Controller Manager

클러스터 안에서 구동 중인 다양한 리소스들을 모니터링합니다. 
다음과 같은 리소스들을 관리합니다. 

* 레플리카셋(replicaset) - 지정된 수의 파드 레플리카가 항상 실행되도록 보장하는 오브젝트
* 디플로이먼트(deployment) - 파드와 레플리카셋을 관리하는 오브젝트
* 스테이트풀셋(statefulset) - 어플리케이션의 상태를 저장하고 관리하는 오브젝트
* 데몬셋(daemonset) - 특정 노드 또는 모든 노드에서 항상 실행되어야 하는 특정 파드를 관리하는 오브젝트
* 크론 잡(cron job) - 반복 일정에 따라 잡(job)을 만드는 오브젝트
* 서비스 어카운트(service account) - 파드에서 동작하는 프로세스들의 식별성을 제공하는 오브젝트

다음과 같은 컨트롤러들이 존재합니다. 

* 노드 컨트롤러(Node Controller) - 노드가 다운되었을 때 통지와 대응에 관한 책임을 가집니다.
* 레플리케이션 컨트롤러(Replica Controller) - 시스템의 모든 레플리케이션 컨트롤러 오브젝트에 대해 알맞은 수의 파드들을 유지시켜 주는 책임을 가집니다.
* 엔드포인트 컨트롤러(Endpoint Controller) - 서비스들과 파드들을 연결시킵니다.
* 서비스 어카운트 & 토큰 컨트롤러(Service Account & Token Controller) - 새로운 네임스페이스에 대한 기본 계정과 API 접근 토큰을 생성합니다.

논리적으로 여러 개의 컨트롤러가 존재하지만, 복잡성을 낮추기 위해 하나의 바이너리로 컴파일되고 단일 프로세스 내에서 실행됩니다. 

#### 2.1.4. API Server

클러스터의 모든 컴포넌트들은 컨트롤 플레인에 있는 API 서버를 통해 통신합니다. 
각 컴포넌트들을 모니터링하면서 작업을 수행할 수 있도록 중앙 접근 포인트 역할을 수행합니다. 
스테이트리스(stateless) 특징을 가지지만, 세션을 유지하기 위해 `etcd` 컴포넌트를 사용합니다. 

서버의 API를 노출하고 관리하는 프로세스입니다. 
일반적으로 접근용 포트는 `6443`을 사용합니다. 

<p align="center">
    <img src="/images/kubernetes-architecture-4.JPG" width="80%" class="image__border">
</p>
<center>https://sysdig.com/blog/monitor-kubernetes-api-server/</center>

### 2.2. Worker Node Components

#### 2.2.1. kubelet

클러스터 안에 각 노드에서 동작하는 에이전트입니다. 
API 서버와 노드를 연결하는 역할을 수행합니다. 
파드 안에 컨테이너가 정상적으로 동작하는지 주기적으로 확인하여 API 서버에게 전달합니다. 
쿠버네티스에 의해 만들어진 컨테이너가 아닌 경우 관리하지 않습니다. 
마스터 노드의 스케줄러가 파드를 노드에게 할당하면 `kubelet`이 해당 파드와 컨테이너를 배치합니다. 

#### 2.2.2. kube-proxy

클러스터 안에 각 노드에서 동작하는 네트워크 프록시입니다. 
노드나 파드는 죽을 수 있고, 새로 생성되는 경우 `IP`가 계속 바뀔 수 있습니다. 
이런 유동적인 네트워크 상황에서 파드들 간의 상호 네트워크를 보장하는 컴포넌트입니다. 

내/외부 네트워크 트래픽을 어느 파드로 포워딩할 것인지에 대한 노드의 네트워크 규칙을 유지 관리합니다. 
정의된 네트워크 규칙을 통해 내부 네트워크 세션이나 클러스터 바깥에서 내부 파드로 네트워크 통신을 할 수 있습니다. 
운영체제에 가용한 패킷 필터링 계층이 있는 경우 이를 상요하고, 아니면 트래픽 자체를 포워딩(forwarding)합니다. 

`kube-proxy`의 상세 역할은 1.2 버전 이후로 바뀌었다고 합니다. 

* 1.2 버전 이전에는 user space proxy 역할을 직접 수행
* 1.2 버전 이후에는 `iptables`를 통해 `netfilter`을 조작, 관리하는 역할을 수행

#### 2.2.3. Container Runtime

컨테이너 실행을 담당하는 소프트웨어입니다. 
워커 노드 내부에서 컨테이너 이미지를 가져오고 구동시키는 엔진입니다. 

다음과 같은 컨테이너 런타임들이 사용됩니다. 

* containerd
* CRI-O
* Docker Engine
    * 1.2 버전 이후로 deprecated
    * 1.24 버전부터 완전 중단
* Mirntis Container Runtime

## 3. Addons

각 노드의 주요 컴포넌트 이 외에도 클러스터의 기능을 구현, 확장하기 위한 것들이 존재합니다.

* Cluster DNS
    * DNS 서버 역할을 수행합니다.
    * 쿠버네티스 서비스 오브젝트에게 DNS 레코드를 제공합니다.
    * 클러스터 내 컨테이너들의 도메인 이름을 저장하고, 탐색이 가능하도록 관리합니다.
* Dashboard
    * 쿠버네티스 클러스터 상태를 확인할 수 있는 웹 기반 UI 화면입니다.
    * 사용자들이 클러스터 내부에서 동작하는 어플리케이션들을 관리하고 트러블 슈팅하는데 유용합니다. 
* Container Resource Monitoring
    * 중앙 데이터베이스에 컨테이너의 일반적인 시간열 메트릭을 기록합니다.
    * 해당 데이터를 탐색하기 위한 UI를 제공합니다.
* Cluster-level Logging
    * 컨테이너 로그들을 저장하는 책임을 가집니다.
    * 검색, 찾아보기 인터페이스가 있는 중앙형 로그 적재 기능을 수행합니다.

#### RECOMMEND NEXT POSTS

* [Deploy Simple Container on Kubernetes Cluster][deploy-container-on-kubernetes-cluster-link]

#### REFERENCE

* [Docker & Kubernetes: The Practical Guide [2022 Edition]][docker-kube-lecture-link]
* [Kubernetes in Action][kubernetes-in-action-book-link]
* [쿠버네티스 설치 및 클러스터 설정][kubernetes-installation-link]
* <https://kubernetes.io/ko/docs/concepts/overview/what-is-kubernetes/>
* <https://kubernetes.io/ko/docs/concepts/overview/components/>
* <https://kubernetes.io/ko/docs/concepts/workloads/controllers/>
* <https://seongjin.me/kubernetes-cluster-components/>
* <https://seongjin.me/kubernetes-core-concepts/>
* <https://sysdig.com/blog/monitor-kubernetes-api-server/>
* <https://ooeunz.tistory.com/118>
* <https://www.leafcats.com/305>
* <https://medium.com/devops-mojo/kubernetes-architecture-overview-introduction-to-k8s-architecture-and-understanding-k8s-cluster-components-90e11eb34ccd>

[docker-kube-lecture-link]: https://www.udemy.com/course/docker-kubernetes-the-practical-guide/
[kubernetes-in-action-book-link]: https://www.udemy.com/course/docker-kubernetes-the-practical-guide/
[kubernetes-installation-link]: https://5equal0.tistory.com/entry/Kubernetes-Kubernetes-%EC%84%A4%EC%B9%98-%EB%B0%8F-Cluster-%EC%84%A4%EC%A0%95

[deploy-container-on-kubernetes-cluster-link]: https://junhyunny.github.io/kubernetes/deploy-container-on-kubernetes-cluster/