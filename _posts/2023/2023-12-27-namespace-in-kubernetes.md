---
title: "Namespace in Kubernetes"
search: false
category:
  - kubernetes
last_modified_at: 2023-12-27T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Kubernetes Architecture][kubernetes-architecture-link]
- [Change URI with Openfeign when Runtime][dynamic-uri-using-openfeign-link]
- [Declarative HTTP Client in Spring Boot][declarative-http-client-in-spring-boot-link]

## 1. Namespace

네임스페이스(namespace)는 단일 클러스터 내에서 리소스 그룹을 격리하는 메커니즘(mechanism)을 제공한다. 파드(pod), 레플리카 세트(replica set), 디플로이먼트(deployment) 같은 오브젝트들은 모두 네임스페이스 내부에 배포된다. 네임스페이스에 오브젝트를 배포할 때 다음과 같은 규칙을 지켜야 한다.

- 하나의 네임스페이스 내에서 리소스 이름은 유일해야 한다.
- 동일한 이름을 가진 리소스가 서로 다른 네임스페이스에 존재하는 것은 가능하다.

네임스페이스는 논리적인 구분일 뿐 네임스페이스 내부 리소스를 완전히 격리한 것은 아니기 때문에 다른 네임스페이스에 위치한 오브젝트들과 통신할 수 있다. 통신하는 방법은 아래 실습을 통해 살펴볼 예정이다. 쿠버네티스 환경을 구축하면 기본적으로 4개의 네임스페이스가 만들진다.

- default
  - 별도로 네임스페이스를 생성하지 않았다면 기본으로 사용되는 네임스페이스다.
- kube-node-lease
  - 각 노드와 연관된 리스(lease) 오브젝트가 존재하는 네임스페이스다.
  - 노드 리스는 kublet이 하트 비트(heart beat)를 보내 컨트롤 플레인이 노드의 장애가 발생한 것을 탐지하는 용도로 사용한다.
- kube-public
  - 인증되지 않은 클라이언트를 포함한 모든 클라이언트가 읽기 권한으로 접근할 수 있는 네임스페이스다.
  - 주로 전체 클러스터 중에 공개적으로 드러나서 읽을 수 있는 리소스를 위해 예약되어 있다.
- kube-system
  - 쿠버네티스 시스템에서 생성한 오브젝트들을 위한 네임스페이스다.

만약 워커 노드 3개에 dev, prod 네임스페이스를 추가했다면 아래와 같은 모습을 가진다. `kube-` 접미사로 시작하는 네임스페이스들은 제외했다. 위에서 설명했듯 각 네임스페이스에서 관리되는 오브젝트들은 각자 이름은 고유해야 한다. 동일한 이름을 가진 리소스가 서로 다른 네임스페이스에 존재하는 것은 가능하다. 

<p align="center">
  <img src="/images/namespace-in-kubernetes-01.png" width="80%" class="image__border">
</p>

### 1.1. Objects in Namespace

모든 리소스가 네임스페이스에 포함되진 않는다. 파드, 서비스, 디플로이먼트, 레플리카 세트, 레플리케이션 컨트롤러(replication controller) 같은 대부분의 리소스들은 네임스페이스에 포함된다. 노드(node)나 퍼시스턴트 볼륨(persistent volume) 같은 저수준 리소스는 어느 네임스페이스에도 속하지 않는다. 필연적으로 네임스페이스에 속하지 않는 리소스들은 네임스페이스 기반 스코핑이 불가능하다. 다음 명령어를 통해 어떤 타입의 오브젝트들이 네임스페이스에 포함되는지 아닌지 판단할 수 있다.

```
# 네임스페이스에 속하는 리소스
kubectl api-resources --namespaced=true

bindings                                 v1                             true         Binding
configmaps                  cm           v1                             true         ConfigMap
endpoints                   ep           v1                             true         Endpoints
events                      ev           v1                             true         Event
limitranges                 limits       v1                             true         LimitRange
persistentvolumeclaims      pvc          v1                             true         PersistentVolumeClaim
pods                        po           v1                             true         Pod
podtemplates                             v1                             true         PodTemplate
...
```

```
# 네임스페이스에 속하지 않는 리소스
kubectl api-resources --namespaced=false

componentstatuses                 cs           v1                                     false        ComponentStatus
namespaces                        ns           v1                                     false        Namespace
nodes                             no           v1                                     false        Node
persistentvolumes                 pv           v1                                     false        PersistentVolume
mutatingwebhookconfigurations                  admissionregistration.k8s.io/v1        false        MutatingWebhookConfiguration
validatingwebhookconfigurations                admissionregistration.k8s.io/v1        false        ValidatingWebhookConfiguration
customresourcedefinitions         crd,crds     apiextensions.k8s.io/v1                false        CustomResourceDefinition
apiservices                                    apiregistration.k8s.io/v1              false        APIService
...
```

### 1.2. Benefits

공식 문서를 보면 여러 개의 네임스페이스를 사용하는 것에 대한 가이드라인을 제시한다.

> 네임스페이스는 여러 개의 팀이나, 프로젝트에 걸쳐서 많은 사용자가 있는 환경에서 사용하도록 만들어졌다. 사용자가 거의 없거나, 수 십명 정도가 되는 경우에는 네임스페이스를 전혀 고려할 필요가 없다. 네임스페이스가 제공하는 기능이 필요할 때 사용하도록 하자.

시스템을 구성할 수 있는 상황이나 환경에 따라 달라지겠지만, 오브젝트 리소스를 확실히 구분할 수 있도록 개발, 스테이지, 운영 같은 서비스 운영 환경 단위로 나눌 필요는 있어 보인다. 네임스페이스의 논리적인 수준 격리를 통해 다음과 같은 이득을 취할 수 있다. 

- 네임스페이스 단위로 RBAC(Role-Based Access Control) 정책을 적용하여 보안 정책을 강화할 수 있다. 
- 네임스페이스마다 할당된 리소스 크기를 다르게 지정하는 등 독립적인 정책 적용이 가능하다.
- 테스트 환경과 지속적인 개발이 이뤄지는 스테이징 환경을 구분할 수 있다.

## 2. Practice

네임스페이스 개념을 확인할 수 있는 실습을 해본다. 필자는 관리자보단 개발자로서 쿠버네티스를 사용하기 때문에 애플리케이션 통신 부분에 초점이 맞춰진 실습이다. 다음과 같은 내용들을 확인한다.

- 네임스페이스를 만들기
- 리소스 쿼터(resource quota)를 통해 네임스페이스 리소스 제한하기
- 네임스페이스에 파드 배포하기
- 같은 네임스페이스 내 파드 통신
- 다른 네임스페이스 간 파드 통신

도커 데스크탑(docker desktop)에서 지원하는 쿠버네티스 클러스터 환경에서 실습한다. 다음과 같은 환경을 구성한다. 

- 두 개의 네임스페이스 생성한다.
  - foo-ns, bar-ns
- foo-ns 네임스페이스는 리소스 쿼터를 통해 자원 제한이 걸려있다. 
- foo-ns 네임스페이스에 배포된 파드와 서비스는 다음과 같다.
  - foo-pod, foo-service
  - qux-pod, qux-service
- bar-ns 네임스페이스에 배포된 파드와 서비스는 다음과 같다.
  - foo-pod, foo-service
- foo-ns 네임스페이스에 배포된 foo-pod 파드를 통해 클러스터 내부 다른 파드들과 통신을 수행한다.

<p align="center">
  <img src="/images/namespace-in-kubernetes-02.png" width="100%" class="image__border">
</p>

### 2.1. Spring Application

먼저 실습을 위한 컨테어너 이미지를 하나 생성한다. 배포될 모든 파드들은 이 단계에서 만들어지는 컨테이너 이미지를 사용한다. 전체 코드 중 중요한 부분만 살펴본다. 전체 코드를 보고 싶다면 글 아래 코드 저장소를 확인하길 바란다. 

#### 2.1.1. application.yml

SERVICE_NAME 환경 변수를 통해 서비스 이름을 주입 받는다. 환경 변수는 파드 스펙이 정의된 yml 파일을 설정된다. 기본 값은 `action-in-blog`이다.

```yml
service:
  name: ${SERVICE_NAME:action-in-blog}
```

#### 2.1.2. CommunicationController Class

API 엔드-포인트(end-point)가 정의된 컨트롤러이다. 다음과 같은 요청을 처리한다.

- [GET] /service-name
  - 자신의 서비스 이름을 반환한다.
- [GET] /external/{serviceName}
  - 경로 변수인 `serviceName`은 쿠버네티스 환경에서 파드 간 통신을 위해 사용하는 서비스 오브젝트 이름을 의미한다.
  - 다른 서비스 오브젝트를 통해 다른 파드로부터 서비스 이름을 응답 받아 반환한다.

```java
package action.in.blog.controller;

import action.in.blog.proxy.ExternalServiceClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.DefaultUriBuilderFactory;

@RestController
public class CommunicationController {

    private final static Logger logger = LoggerFactory.getLogger(CommunicationController.class);

    private final ExternalServiceClient externalServiceClient;

    @Value("${service.name}")
    private String serviceName;

    public CommunicationController(ExternalServiceClient externalServiceClient) {
        this.externalServiceClient = externalServiceClient;
    }

    @GetMapping("/service-name")
    public String serviceName() {
        return serviceName;
    }

    @GetMapping("/external/{serviceName}")
    public String externalServiceName(@PathVariable String serviceName) {
        logger.info("by pass to {}", serviceName);
        return externalServiceClient.getServiceName(new DefaultUriBuilderFactory(serviceName));
    }
}
```

#### 2.1.3. ExternalServiceClient Class

명시적인(declarative) HTTP 클라이언트를 통해 통신한다. 스프링 부트 3.X 버전부터 사용할 수 있다. 상세한 사용법은 [Declarative HTTP Client in Spring Boot][declarative-http-client-in-spring-boot-link] 글을 참조하길 바란다. 

HTTP 클라이언트는 페인 클라이언트(feign client)처럼 동적 URL 할당이 가능하다. 동적 URL 할당에 대한 개념을 알고 싶다면 [Change URI with Openfeign when Runtime][dynamic-uri-using-openfeign-link] 글을 참고하길 바란다. 간단히 설명하면 메소드 첫 번째 파라미터가 URI 객체일 경우 해당 호스트에게 API 요청을 보낸다. 메소드 위에 @GetExchange 애너테이션에 명시된 /service-name 경로로 GET 요청을 수행한다. 

```java
package action.in.blog.proxy;

import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.util.UriBuilderFactory;

public interface ExternalServiceClient {

    @GetExchange("/service-name")
    String getServiceName(UriBuilderFactory uriBuilderFactory);
}
```

#### 2.1.4. Build and Push Docker Image

쿠버네티스가 파드를 만들 때 사용할 수 있도록 도커 이미지를 생성한다. 도커 파일 내용은 다음과 같다.

```dockerfile
# STAGE 1
FROM gradle:jdk17 as builder

WORKDIR /build

COPY build.gradle settings.gradle /build/

RUN gradle build -x test --parallel --continue > /dev/null 2>&1 || true

COPY . /build

RUN gradle build -x test --parallel

# STAGE 2
FROM eclipse-temurin:17-jammy

WORKDIR /app

COPY --from=builder /build/build/libs/*-SNAPSHOT.jar ./app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

opop3966/ns-poc 태그 이름을 가진 도커 이미지를 빌드한다. 

```
$ docker build -t opop3966/ns-poc .
```

빌드가 완료되면 원격 저장소에 배포한다.

```
$ docker push opop3966/ns-poc:latest
```

### 2.2. Create Namespace

아래 yml 파일을 사용해 쿠버네티스 네임스페이스를 생성한다.

- foo-ns
  - 리소스 쿼터를 통해 네임스페이스의 리소스를 제한한다.
  - 파드 개수 최대 5개
  - 요청, 최대 CPU 4
  - 요청, 최대 메모리 4Gi
- bar-ns
  - 별도 리소스 제약이 없다.

```yml
apiVersion: v1
kind: Namespace
metadata:
  name: foo-ns
---
apiVersion: v1
kind: Namespace
metadata:
  name: bar-ns
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota-foo
  namespace: foo-ns
spec:
  hard:
    pods: "5"
    requests.cpu: "4"
    requests.memory: 4Gi
    limits.cpu: "4"
    limits.memory: 4Gi
```

명령어를 통해 네임스페이스를 생성한다.

```
$ kubectl create -f ns-defintion.yml         

namespace/foo-ns created
namespace/bar-ns created
```

생성된 네임스페이스를 확인한다.

```
$ kubectl get ns                    

NAME              STATUS   AGE
bar-ns            Active   32s
default           Active   9d
foo-ns            Active   33s
kube-node-lease   Active   9d
kube-public       Active   9d
kube-system       Active   9d
```

각 네임스페이스 상세 내용을 살펴본다. 먼저 foo-ns 네임스페이스 정보이다. 

- 리소스 쿼터 정보를 확인할 수 있다.

```
$ kubectl describe ns foo-ns

Name:         foo-ns
Labels:       kubernetes.io/metadata.name=foo-ns
Annotations:  <none>
Status:       Active

Resource Quotas
  Name:            compute-quota-foo
  Resource         Used  Hard
  --------         ---   ---
  limits.cpu       0     4
  limits.memory    0     4Gi
  pods             0     5
  requests.cpu     0     4
  requests.memory  0     4Gi

No LimitRange resource.
```

다음 bar-ns 네임스페이스 정보를 살펴본다. 

- 리소스 쿼터 정보를 확인할 수 없다.

```
$ kubectl describe ns bar-ns

Name:         bar-ns
Labels:       kubernetes.io/metadata.name=bar-ns
Annotations:  <none>
Status:       Active

No resource quota.

No LimitRange resource.
```

네임스페이스의 리소스 쿼터 정보를 확인하고 싶으면 다음 명령어를 사용한다.

```
$ kubectl get quota --namespace=foo-ns

NAME                AGE     REQUEST                                                LIMIT
compute-quota-foo   9m36s   pods: 0/5, requests.cpu: 0/4, requests.memory: 0/4Gi   limits.cpu: 0/4, limits.memory: 0/4Gi
```

### 2.3. Deploy Pods and Services

각 네임스페이스에 파드와 서비스를 배포한다. 파드를 배포할 때 사용하는 컨테이너 이미지는 이전 단계에서 생성한 `opop3966/ns-poc`을 사용한다.

#### 2.3.1. Foo Pod in foo-ns Namespace

foo-ns 네임스페이스에 배포할 파드, 서비스 정보는 다음과 같다. 

- 파드 정보
  - 이름 - foo-pod
  - 배포 네임스페이스 - foo-ns
  - 컨테이너 이름 - foo-container
  - 애플리케이션 서비스 이름 - foo-pod-in-foo-ns
- 서비스 정보
  - 이름 - foo-service
  - 배포 네임스페이스 - foo-ns
  - 서비스 포트 - 80
  - 파드 애플리케이션 컨테이너 포트 - 8080
  - 서비스 타입 - NodePort

```yml
apiVersion: v1
kind: Pod
metadata:
  name: foo-pod
  namespace: foo-ns
  labels:
    app: foo-app
spec:
  containers:
    - name: foo-container
      image: opop3966/ns-poc
      env:
        - name: SERVICE_NAME
          value: foo-pod-in-foo-ns
      resources:
        requests:
          memory: 2Gi
          cpu: "2"
        limits:
          memory: 2Gi
          cpu: "2"
---
apiVersion: v1
kind: Service
metadata:
  name: foo-service
  namespace: foo-ns
spec:
  ports:
    - port: 80
      targetPort: 8080
  selector:
    app: foo-app
  type: NodePort
```

foo-pod 파드는 클러스터 외부에서 호출할 수 있어야 하므로 NodePort 타입으로 지정한다. 

파드 스펙에 리소스 제약이 정의된 것을 볼 수 있다. foo-ns 네임스페이스는 리소스 제한이 설정되어 있기 때문에 내부에 배포될 파드들도 리소스 요청 정보가 필요하다. 리소스 요청 정보가 없는 경우 다음과 같은 에러 메시지를 볼 수 있다. 

```
Error from server (Forbidden): error when creating "pod-foo-definition.yml": pods "foo-pod" is forbidden: failed quota: compute-quota-foo: must specify limits.cpu for: foo-pod; limits.memory for: foo-pod; requests.cpu for: foo-pod; requests.memory for: foo-pod
```

명령어를 통해 파드와 서비스를 배포한다. 

```
$ kubectl create -f pod-foo-definition.yml

pod/foo-pod created
service/foo-service created
```

명령어를 통해 생성된 파드와 서비스 정보를 확인한다.

```
$ kubectl get pods --namespace=foo-ns

NAME      READY   STATUS    RESTARTS   AGE
foo-pod   1/1     Running   0          54s
```

```
$ kubectl get svc --namespace=foo-ns

NAME          TYPE       CLUSTER-IP     EXTERNAL-IP   PORT(S)          AGE
foo-service   NodePort   10.106.98.76   <none>        8080:30496/TCP   61s
```

배포가 정상적으로 완료됐는지 cURL 명령어를 통해 확인한다.

- [GET] /service-name 요청
  - 파드 정의 파일에 설정한 환경 변수 값을 응답으로 받는다.

```
$ curl localhost:30496/service-name

foo-pod-in-foo-ns                                                                                                  
```

#### 2.3.2. Qux Pod in foo-ns Namespace

환경 변수 값과 서비스 타입이 다른 것을 제외하면 foo-pod 파드, foo-service 서비스와 큰 차이는 없다. yml 파일은 다음과 같다.

- 파드 정보
  - 이름 - qux-pod
  - 배포 네임스페이스 - foo-ns
  - 컨테이너 이름 - qux-container
  - 애플리케이션 서비스 이름 - qux-pod-in-foo-ns
- 서비스 정보
  - 이름 - qux-service
  - 배포 네임스페이스 - foo-ns
  - 서비스 포트 - 80
  - 파드 애플리케이션 컨테이너 포트 - 8080
  - 서비스 타입 - ClusterIP

```yml 
apiVersion: v1
kind: Pod
metadata:
  name: qux-pod
  namespace: foo-ns
  labels:
    app: qux-app
spec:
  containers:
    - name: qux-container
      image: opop3966/ns-poc
      env:
        - name: SERVICE_NAME
          value: qux-pod-in-foo-ns
      resources:
        requests:
          memory: 2Gi
          cpu: "2"
        limits:
          memory: 2Gi
          cpu: "2"
---
apiVersion: v1
kind: Service
metadata:
  name: qux-service
  namespace: foo-ns
spec:
  ports:
    - port: 80
      targetPort: 8080
  selector:
    app: qux-app
```

qux-pod 파드에 /service-name 경로로 GET 요청을 보내면 `qux-pod-in-foo-ns` 값을 응답 받을 것이다. 서비스는 클러스터 외부와 통신할 필요가 없기 때문에 클러스터IP(ClusterIP) 타입을 사용한다. 

아래 명령어를 통해 파드와 서비스를 배포한다. 

```
$ kubectl create -f pod-qux-definition.yml 

pod/qux-pod created
service/qux-service created
```

아래 명령어를 통해 생성된 파드와 서비스 정보를 확인할 수 있다.

```
$ kubectl get pods --namespace=foo-ns

NAME      READY   STATUS    RESTARTS   AGE
foo-pod   1/1     Running   0          10m
qux-pod   1/1     Running   0          17s
```

```
$ kubectl get svc --namespace=foo-ns

NAME          TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE
foo-service   NodePort    10.106.98.76     <none>        8080:30496/TCP   10m
qux-service   ClusterIP   10.109.107.240   <none>        80/TCP           21s
```

foo-pod, qux-pod 파드 사이의 통신 테스트는 bar-ns 네임스페이스에 남은 파드를 마저 배포한 이후 진행한다.

#### 2.3.3. Foo Pod in bar-ns Namespace

bar-ns 네임스페이스에 foo-pod 파드를 배포한다. 동일한 네임스페이스가 아니므로 동일한 이름을 가진 파드를 배포할 수 있다. bar-ns 네임스페이스는 리소스 제약이 없으므로 파드를 정의할 때 리소스 요청 정보를 작성할 필요가 없다. 환경 변수와 네임스페이스가 바뀐 것을 제외하면 크게 다르지 않다. 서비스도 외부와 직접 통신하지 않기 때문에 클러스터IP 타입을 사용한다. 파드, 서비스 정보는 다음과 같다.

- 파드 정보
  - 이름 - foo-pod
  - 배포 네임스페이스 - bar-ns
  - 컨테이너 이름 - foo-container
  - 애플리케이션 서비스 이름 - foo-pod-in-bar-ns
- 서비스 정보
  - 이름 - foo-service
  - 배포 네임스페이스 - bar-ns
  - 서비스 포트 - 80
  - 파드 애플리케이션 컨테이너 포트 - 8080
  - 서비스 타입 - ClusterIP

```yml
apiVersion: v1
kind: Pod
metadata:
  name: foo-pod
  namespace: bar-ns
  labels:
    app: foo-app
spec:
  containers:
    - name: foo-container
      image: opop3966/ns-poc
      env:
        - name: SERVICE_NAME
          value: foo-pod-in-bar-ns
---
apiVersion: v1
kind: Service
metadata:
  name: foo-service
  namespace: bar-ns
spec:
  ports:
    - port: 80
      targetPort: 8080
  selector:
    app: foo-app
```

마찬가지로 명령어를 통해 배포한다.

```
$ kubectl create -f pod-foobar-definition.yml 

pod/foo-pod created
service/foo-service created
```

명령어를 통해 생성된 파드와 서비스 정보를 확인할 수 있다.

```
$ kubectl get pods --namespace=bar-ns    

NAME      READY   STATUS    RESTARTS   AGE
foo-pod   1/1     Running   0          64s
```

```
$ kubectl get svc --namespace=bar-ns

NAME          TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)   AGE
foo-service   ClusterIP   10.105.15.27   <none>        80/TCP    69s
```

## 3. Practice

foo-ns 네임스페이스에 배포된 foo-pod 파드를 통해 다른 서비스들과 통신해본다. 애플리케이션 코드를 보면 알 수 있듯이 `/external/{serviceName}` 경로로 GET 요청을 보내면 `{serviceName}/server-name` 경로로 요청을 포워딩(forwarding)한다. cURL 명령어를 통해 foo-pod 파드와 동일한 네임스페이스에 배포된 qux-pod 파드 사이의 통신을 테스트한다. 

- qux-pod 파드를 생성할 때 주입한 환경 변수 값을 응답으로 받는다.

```
$ curl localhost:30496/external/qux-service

qux-pod-in-foo-ns
```

다른 네임스페이스에 배포된 foo-pod 파드와 통신한다. 다른 네임스페이스에 위치한 서비스와 통신할 때 주소는 전혀 다르다. 먼저 결과를 확인하고 관련된 내용을 살펴보자.

- foo-pod 파드를 생성할 때 주입한 환경 변수 값을 응답으로 받는다. 

```
$ curl localhost:30496/external/foo-service.bar-ns.svc.cluster.local

foo-pod-in-bar-ns
```

같은 네임스페이스에 배포된 서비스는 이름만으로 통신할 수 있다. 쿠버네티스는 클러스터 내부에서 사용할 수 있는 DNS(domain name system)이 존재하기 때문에 이름만으로 통신이 가능하다. 서비스를 생성하면 해당 DNS 엔트리(entry)가 생성된다. 엔트리는 다음과 같은 형식을 가진다.

```
<서비스-이름>.<네임스페이스-이름>.svc.cluster.local
```

`<서비스-이름>`만으로 통신하는 경우 같은 네임스페이스 내에 국한된 서비스로 연결시킨다. 네임스페이스를 넘어 통신하기 위해선 전체 주소 도메인 이름(Full Qualified Domain Name, FQDN)을 사용해야 한다. foo-ns 네임스페이스의 foo-pod 파드가 bar-ns 네임스페이스의 foo-pod 파드와 통신하기 위해 foo-service 서비스의 이름을 `foo-service.bar-ns.svc.cluster.local`으로 사용한 이유다. 

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-12-27-namespace-in-kubernetes>

#### REFERENCE

- <https://www.udemy.com/course/certified-kubernetes-application-developer/>
- <https://kubernetes.io/ko/docs/concepts/overview/working-with-objects/namespaces/>
- <https://kubernetes.io/ko/docs/tasks/administer-cluster/namespaces/>
- <https://kubernetes.io/ko/docs/concepts/policy/resource-quotas/>
- <https://kubeops.net/blog/the-importance-of-kubernetes-namespace-separation>
- <https://hw-kang.tistory.com/43>
- <https://datatracker.ietf.org/doc/html/rfc1123>

[kubernetes-architecture-link]: https://junhyunny.github.io/kubernetes/kubernetes-architecture/
[dynamic-uri-using-openfeign-link]: https://junhyunny.github.io/spring-boot/spring-cloud/junit/dynamic-uri-using-openfeign/
[declarative-http-client-in-spring-boot-link]: https://junhyunny.github.io/spring-boot/declarative-http-client-in-spring-boot/