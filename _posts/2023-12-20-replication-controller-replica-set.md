---
title: "ReplicationController / ReplicaSet in Kubernetes"
search: false
category:
  - container
  - kubernetes
last_modified_at: 2023-12-20T23:55:00
---

<br/>

## 0. 들어가면서

ReplicationController, ReplicaSet 오브젝트에 대해 정리한다. 

## 1. Usage Purpose

두 오브젝트의 사용 목적은 동일하다. 파드(pod) 수를 원하는 상태로 유지하는 것이다. 단일 파드로 서비스를 한다고 가정해보면 단순하다. 파드에 문제가 생기면 서비스가 중단된다. 서비스에 대한 신뢰도가 떨어진다. 쿠버네티스의 레플리케이션 컨트롤러(replication controller)는 이런 문제점을 해결한다.

<p align="center">
  <img src="/images/replication-controller-replica-set-01.png" width="80%" class="image__border">
</p>

### 1.1. High Availability

고가용성(high availability)이란 시스템이 오랜 기간 동안 지속적으로 정상 운영이 가능한 성질을 의미한다. 이를 가능하게 만드는 가장 쉬운 방법은 백업(backup)을 두는 것이다. 둘 중 하나에 문제가 생기더라도 나머지가 지속적인 서비스를 가능하게 해준다. 레플리케이션 컨트롤러는 여러 개의 파드를 그룹지어 관리하기 떄문에 시스템의 고가용성을 보장한다.

더 나아가 레플리케이션 컨트롤러는 가용한 파드 수를 원하는 상태(desired status)로 계속 유지하려는 성질이 있다. 레플리케이션 컨트롤러를 만들 때 원하는 파드 수를 지정하면 그 개수를 유지하기 위해 일한다. 원하는 파드 수가 2개인 레플리케이션 컨트롤러가 있다고 가정한다. 파드 하나가 문제가 생겨 죽더라도 다른 파드가 서비스를 지속하는 동안 레플리케이션 컨트롤러는 새로운 파드를 만들어 가용한 파드가 2개인 상태를 유지한다. 장애 복구가 자동적으로 이뤄진다. 

파드 하나만 사용하더라도 레플리케이션 컨트롤러를 사용하는 것이 좋다. 파드에 문제가 생기더라도 자동화 된 복구 메커니즘은 시스템 운영자를 덜 피곤하게 만든다. 

<p align="center">
  <img src="/images/replication-controller-replica-set-02.png" width="80%" class="image__border">
</p>

### 1.2. Load balancing

사용자 수가 늘어나면 노드(node) 리소스가 부족할 수 있다. 레플리케이션 컨트롤러를 사용하면 클러스터(cluster)를 구성하는 다른 노드에 쉽게 파드를 스케일 아웃(scale out)할 수 있다. 레플리케이션 컨트롤러 오브젝트만 사용하는 경우 시스템 운영자의 수작업이 필요하지만, 다른 오브젝트를 사용하면 스케일 아웃도 자동화할 수 있다.

<p align="center">
  <img src="/images/replication-controller-replica-set-03.png" width="80%" class="image__border">
</p>

### 1.3. Rolling Update

레플리케이션 컨트롤러는 롤링 업데이트(rolling update)가 가능하다. 중단 없이 시스템 업데이트가 할 수 있다. 파드가 하나씩 교체되는 동안 다른 파드들이 서비스를 지속해준다. 

<p align="center">
  <img src="/images/replication-controller-replica-set-04.png" width="80%" class="image__border">
</p>

## 2. ReplicationController and ReplicaSet

레플리케이션 컨트롤러의 역할은 잘 알았다. 그렇다면 레플리카 세트(replica set)는 무슨 역할일까? 같은 목적을 위해 만들어졌으며 용도 또한 똑같다. 차이점이 있다면 레플리카 세트는 오브젝트를 만들 때 선택자(selector)가 강제된다. 공식 홈페이지를 보면 다음과 같은 설명을 볼 수 있다.

> ReplicaSet is the next-generation ReplicationController that supports the new set-based label selector. It's mainly used by Deployment as a mechanism to orchestrate pod creation, deletion and updates. Note that we recommend using Deployments instead of directly using Replica Sets, unless you require custom update orchestration or don't require updates at all.

레플리카 세트는 레플리케이션 컨트롤러보다 이후에 나왔으며 세트-기반 라벨 선택자(set-based label selector)를 사용한다. 상위 오브젝트인 디플로이먼트(deployment)에서 주로 사용된다. 

오브젝트를 정의할 때 다음과 같은 차이점을 가진다. 먼저 레플리케이션 컨트롤러의 yml 파일을 살펴보자.

- apiVersion 값이 `v1`을 가진다.
- kind 값이 `ReplicationController`이다.
- 선택자를 선언할 때 라벨 정보를 단순히 입력한다.
- 선택자를 선언하지 않아도 오브젝트가 생성된다.

```yml
apiVersion: v1
kind: ReplicationController
metadata:
  name: myapp-rc
  labels:
    app: myapp
    type: front-end
spec: 
  template:
    metadata:
      name: myapp-pod
      labels:
        app: myapp
        type: front-end
    spec:
      containers:
        - name: nginx-container
          image: nginx
  replicas: 3
  # selector:
  #   type: front-end
```

레플리카 세트의 yml 파일은 다음과 같다.

- apiVersion 값이 `apps/v1`을 가진다.
- kind 값이 `ReplicaSet`이다.
- 선택자의 종류를 지정한다.
  - `matchLabels`를 사용한다.
- 선택자를 선언하지 않으면 오브젝트 생성시 에러가 발생한다.

```yml
apiVersion: apps/v1
kind: ReplicaSet
metadata: 
  name: myapp-replicaset
  labels:
    app: myapp
    type: front-end
spec:
  template:
    metadata:
      name: myapp-pod
      labels: 
        app: myapp
        type: front-end
    spec:
      containers:
        - name: nginx-container
          image: nginx
  replicas: 3
  selector:
    matchLabels:
      type: front-end
```

## 3. Practice

matchLabels 선택자 외에도 다른 선택자를 사용할 수 있다. 선택자를 강제하고, 다양한 선택자를 통해 기능이 강력해진 것을 제외하면 같은 오브젝트이다. 레플리카 세트에서 선택자를 강요함으로써 얻는 이점은 레플리카 세트를 생성할 때 이미 실행되는 중인 파드 리소스를 재활용할 수 있다는 점인 것 같다.

`type=front-end`이라는 라벨을 가진 파드가 이미 존재한다. 

```yml
apiVersion: v1
kind: Pod
metadata: 
  name: myapp-pod
  labels: 
    app: myapp
    type: front-end
spec:
  containers:
    - name: nginx-container
      image: nginx
```

다음과 같은 상태이다. 

```
$ kubectl get pods
NAME        READY   STATUS    RESTARTS   AGE
myapp-pod   1/1     Running   0          8s
```

다음과 같은 레플리카 세트를 생성한다. 

```yml
apiVersion: apps/v1
kind: ReplicaSet
metadata: 
  name: myapp-replicaset
  labels:
    app: myapp
    type: front-end
spec:
  template:
    metadata:
      name: myapp-pod
      labels: 
        app: myapp
        type: front-end
    spec:
      containers:
        - name: nginx-container
          image: nginx
  replicas: 3
  selector:
    matchLabels:
      type: front-end
```

레플리카 세트를 생성하고 파드 상태를 보면 기존 리소스를 재활용하는 것을 볼 수 있다.

```
$ kubectl create -f replicaset-definition.yml 
replicaset.apps/myapp-replicaset created

$ kubectl get replicaset
NAME               DESIRED   CURRENT   READY   AGE
myapp-replicaset   3         3         3       91s

$ kubectl get pods
NAME                     READY   STATUS    RESTARTS   AGE
myapp-pod                1/1     Running   0          4m39s
myapp-replicaset-js96p   1/1     Running   0          2m18s
myapp-replicaset-l67pd   1/1     Running   0          2m18s
```

myapp-pod 파드를 죽이면 레플리카 세트는 원하는 개수인 3개를 유지하기 위해 새로운 파드를 다시 생성한다. 

```
$ kubectl delete pod myapp-pod
pod "myapp-pod" deleted

$ kubectl get replicaset
NAME               DESIRED   CURRENT   READY   AGE
myapp-replicaset   3         3         2       3m32s

$ kubectl get pods
NAME                     READY   STATUS              RESTARTS   AGE
myapp-replicaset-js96p   1/1     Running             0          3m32s
myapp-replicaset-l67pd   1/1     Running             0          3m32s
myapp-replicaset-z87dv   0/1     ContainerCreating   0          1s
```

스케일 아웃을 하는 방법은 여러가지 있지만, 이번엔 scale 옵션을 사용한다. 

```
$ kubectl scale --replicas=6 replicaset myapp-replicaset
replicaset.apps/myapp-replicaset scaled

$ kubectl get pods
NAME                     READY   STATUS    RESTARTS   AGE
myapp-replicaset-2vqkg   1/1     Running   0          9s
myapp-replicaset-977tb   1/1     Running   0          9s
myapp-replicaset-js96p   1/1     Running   0          7m1s
myapp-replicaset-kcd2r   1/1     Running   0          9s
myapp-replicaset-l67pd   1/1     Running   0          7m1s
myapp-replicaset-z87dv   1/1     Running   0          3m30s
```

이전엔 kubectl 명령어를 통해 롤링 업데이트를 수행할 수 있었던 것 같지만, 현재는 사라졌다. 관련된 이슈, 논의, 커밋 이력은 링크로 첨부한다.

- <https://github.com/kubernetes/kubernetes/pull/61285>
- <https://github.com/kubernetes/kubernetes/issues/23276>
- <https://github.com/kubernetes/kubectl/commit/d3af7e08624bfa7c2f52714b47cfe96a52d15fc0>
- <https://stackoverflow.com/questions/65303683/why-kubectl-removed-command-rolling-update>

#### REFERENCE

- <https://kubernetes.io/docs/concepts/workloads/controllers/replicationcontroller>
- <https://kubernetes.io/docs/concepts/workloads/controllers/replicationcontroller/#replicaset>
- <https://kubernetes.io/docs/concepts/workloads/controllers/replicationcontroller/#rolling-updates>
- <https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/#set-based-requirement>
- <https://docs.openshift.com/container-platform/3.11/architecture/core_concepts/deployments.html>
- <https://arisu1000.tistory.com/27830>
- <https://stackoverflow.com/questions/65303683/why-kubectl-removed-command-rolling-update>