---
title: "스프링 클라우드 넷플릭스 리본(Spring Cloud Netflix Ribbon)"
search: false
category:
  - spring-boot
  - spring-cloud
  - msa
last_modified_at: 2026-03-24T08:03:14+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [스프링 클라우드(spring cloud) OpenFeign][spring-cloud-openfeign-link]
- [스프링 클라우드 넷플릭스 유레카(Spring Cloud Netflix Eureka)][spring-cloud-netflix-eureka-link]
- [유레카(Eureka) 서버/클라이언트와 FeignClient 연동하기][feign-with-eureka-link]

## 1. Netflix Ribbon

리본(ribbon)은 TCP/HTTP 클라이언트 동작을 제어하는 클라이언트 사이드 로드 밸런서(client side load balancer)이다. 클라이언트 사이드 로드 밸런서는 요청을 보내는 클라이언트 측에서 서버의 부하 분산을 위해 직접 나눠 호출하는 행위이다. 서버 사이드 로드 밸런서(server side load balancer)와 구분해서 알아보자. 서버 사이드 로드 밸런서는 다음과 같은 특징을 가진다.

- 보통 하드웨어(hardware) 기반으로 처리한다.
  - 하드웨어 기반은 상대적으로 비용이 많이 들어간다.
- 클라이언트는 서버 사이드 로드 밸런서에게 요청을 보낸다.
- 서버 사이드 로드 밸런서는 해당 요청을 처리하는 서버들에 대한 정보를 알고 있다.
  - 많은 요청을 처리하기 위해 비즈니스적으로 같은 기능을 수행하는 서버가 여러 개 존재한다.
- 요청을 서버들에게 나눠 전달한다.
- 해당 방법은 클라우드 환경에서 유연성이 떨어진다.
  - 수시로 컨테이너가 죽고, 살아나는 과정에서 IP가 변경되기 때문에 서버 사이드 로드 밸런싱은 어렵다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/spring-cloud-netflix-ribbon-01.png" width="80%" class="image__border">
</div>
<center>https://sabarada.tistory.com/54</center>

<br />

클라이언트 사이드 로드 밸런서는 다음과 같은 특징을 가진다.

- 소프트웨어적인 방법으로 처리한다.
- 클라이언트는 동일한 비즈니스를 처리하는 서버들에게 요청을 나눠 보낸다.
  - 클라이언트는 요청 분산을 위해 라운드 로빈(round robin) 같은 부하 분산 전략을 사용한다.
- 중앙 집중형 로드 밸런서로 인해 발생하는 문제가 없다.
  - 로드 밸런서 다운으로 인한 장애가 발생하지 않는다.
  - 로드 밸런서에 집중되는 부하가 없으므로 병목 현상이 완화된다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/spring-cloud-netflix-ribbon-02.png" width="80%" class="image__border">
</div>
<center>https://sabarada.tistory.com/54</center>

## 2. Functionality of Ribbon

`FeignClient`를 사용하면 자동으로 리본이 적용된다. 이번 글은 예제 코드 없이 리본이 해주는 일에 대해서만 정리했다. 간단한 로드 밸런싱 기능을 확인하려면 [유레카(Eureka) 서버/클라이언트와 FeignClient 연동하기 글][feign-with-eureka-link]을 참조바란다.

리본이 잘 동작하기 위해선 다음 세가지 정보가 필요하다.

- Rule - 로드 밸런싱 전략을 지정한다.
- Ping - 서버가 살아있는지 감시하는 역할을 수행한다.
- ServerList - 서버 목록을 제공한다.

먼저 룰(rule)을 살펴보자. `IRule` 인터페이스를 통해 전략을 정의한다. IRule 인스턴스는 다음과 같은 책임을 갖는다.

```java
public interface IRule {
    /*
     * choose one alive server from lb.allServers or
     * lb.upServers according to key
     *
     * @return choosen Server object. NULL is returned if none
     *  server is available
     */

    public Server choose(Object key);

    public void setLoadBalancer(ILoadBalancer lb);

    public ILoadBalancer getLoadBalancer();
}
```

IRule 인터페이스를 구현한 클래스들 중 하나를 선택하여 로드 밸런싱 방식을 결정한다. 개발자가 직접 구현한 클래스를 만들어 사용해도 된다. 기본적으로 리본 라이브러리는 다음과 같은 클래스들을 제공한다.

- com.netflix.loadbalancer.RoundRobinRule
  - 서비스를 돌아가면서 연결하는 방식이다.
  - 기본 방식이다.
- com.netflix.loadbalancer.AvailabilityFilteringRule
  - 가용성이 높은것부터 연결하는 방식이다.
  - 리본에 내장된 별도의 회로 차단기(circuit breaker) 모듈을 이용한다.
- com.netflix.loadbalancer.WeightedResponseTimeRule
  - 응답 시간이 빠른 서비스 인스턴스부터 연결하는 방식이다.

application YAML 파일에 특정 설정을 통해 로드 밸런싱 전략 클래스를 지정할 수 있다. 

- `{clientName}.ribbon.NFLoadBalancerRuleClassName` 설정을 사용한다.
- 추가적으로 .properties(혹은 .yml) 파일에 아래 설정을 추가하면 개발자가 커스터마이징한 기능들을 사용할 수 있다.
  - `{clientName}.ribbon.NFLoadBalancerClassName`
    - Should implement ILoadBalancer
  - `{clientName}.ribbon.NFLoadBalancerRuleClassName`
    - Should implement IRule
  - `{clientName}.ribbon.NFLoadBalancerPingClassName`
    - Should implement IPing
  - `{clientName}.ribbon.NIWSServerListClassName`
    - Should implement ServerList
  - `{clientName}.ribbon.NIWSServerListFilterClassName`
    - Should implement ServerListFilter

```yml
users:
  ribbon:
    NIWSServerListClassName: com.netflix.loadbalancer.ConfigurationBasedServerList
    NFLoadBalancerRuleClassName: com.netflix.loadbalancer.WeightedResponseTimeRule
```

`IPing` 인터페이스를 구현한 클래스를 통해 요청할 서버들이 살아있는지 검사한다. 만약, 서버가 죽었다면 로드 밸런싱을 위한 서비스 목록에서 제거한다. IPing 인스턴스는 다음과 같은 책임을 갖는다.

```java
public interface IPing {

    /**
     * Checks whether the given <code>Server</code> is "alive" i.e. should be
     * considered a candidate while loadbalancing
     *
     */
    public boolean isAlive(Server server);
}
```

개발자가 직접 구현한 클래스를 만들어 사용해도 되지만, 리본은 기본적으로 다음과 같은 클래스들을 제공한다.

- com.netflix.loadbalancer.DummyPing
  - 기본 방식이다.
- com.netflix.niws.loadbalancer.NIWSDiscoveryPing
  - 각 서버들이 유레카에 여전히 등록되어 있는지 주기적으로 확인한다.

`ServerList` 인터페이스는 대상 서버 목록을 제공한다. 서버 목록은 함께 연계되는 컴포넌트 유무에 따라 동적이거나 정적이다. 동적인 경우 백그라운드 스레드에 의해 일정한 시간 간격으로 목록이 갱신된다. ServerList 인스턴스는 다음과 같은 책임을 갖는다.

```java
public interface ServerList<T extends Server> {

    public List<T> getInitialListOfServers();

    /**
     * Return updated list of servers. This is called say every 30 secs
     * (configurable) by the Loadbalancer's Ping cycle
     *
     */
    public List<T> getUpdatedListOfServers();
}
```

리본은 ServerList 인터페이스를 구현한 아래 클래스들을 기본적으로 제공한다. 마찬가지로 직접 구현해서 사용해도 된다.

- com.netflix.loadbalancer.ConfigurationBasedServerList
  - 서버 목록을 .properties(혹은 .yml)을 통해 획득한다.
- com.netflix.niws.loadbalancer.DiscoveryEnabledNIWSServerList
  - 유레카 서버로부터 얻은 서버 목록을 획득한다.

#### REFERENCE

- <https://sabarada.tistory.com/54>
- <https://gunju-ko.github.io/spring-cloud/netflixoss/2018/12/14/Ribbon.html>
- <https://cloud.spring.io/spring-cloud-netflix/multi/multi_spring-cloud-ribbon.html>
- <https://junhyunny.github.io/spring-boot/spring-cloud/msa/spring-cloud-netflix-eureka/>
- <https://junhyunny.github.io/spring-boot/spring-cloud/msa/junit/feignclient-with-eureka/>
- <https://www.linkedin.com/pulse/microservices-client-side-load-balancing-amit-kumar-sharma>

[spring-cloud-openfeign-link]: https://junhyunny.github.io/spring-boot/spring-cloud/spring-cloud-openfeign/
[spring-cloud-netflix-eureka-link]: https://junhyunny.github.io/spring-boot/spring-cloud/msa/spring-cloud-netflix-eureka/
[feign-with-eureka-link]: https://junhyunny.github.io/spring-boot/spring-cloud/msa/junit/feignclient-with-eureka/
