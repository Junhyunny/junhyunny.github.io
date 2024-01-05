---
title: "Spring Cloud Netflix Ribbon"
search: false
category:
  - spring-boot
  - spring-cloud
  - msa
last_modified_at: 2021-08-25T01:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Spring Cloud Openfeign][spring-cloud-openfeign-link]
* [Spring Cloud Netflix Eureka][spring-cloud-netflix-eureka-link]
* [FeignClient with Eureka][feign-with-eureka-link]

## 1. Netflix Ribbon

> Client Side Load Balancer

리본(ribbon)은 TCP/HTTP 클라이언트 동작을 제어하는 클라이언트 사이드 로드 밸런서(client side load balancer)입니다. 
클라이언트 사이드 로드 밸런서는 요청을 보내는 클라이언트 측에서 서버의 부하 분산을 위해 직접 나눠 호출하는 행위입니다. 
서버 사이드 로드 밸런서(server side load balancer)와 구분하여 알아보겠습니다. 

### 1.1. Server Side Load Balancer

서버 사이드 로드 밸런서는 다음과 같은 특징을 가집니다. 

* 보통 하드웨어(hardware) 기반으로 처리합니다.
    * 하드웨어 기반은 상대적으로 비용이 많이 들어갑니다.
* 클라이언트는 서버 사이드 로드 밸런서에게 요청을 보냅니다.
* 서버 사이드 로드 밸런서는 해당 요청을 처리하는 서버들에 대한 정보를 알고 있습니다.
    * 많은 요청을 처리하기 위해 비즈니스적으로 같은 기능을 수행하는 서버가 여러 개 존재합니다.
* 요청을 서버들에게 나눠 전달합니다.
* 해당 방법은 클라우드 환경에서 유연성이 떨어집니다.
    * 수시로 컨테이너가 죽고, 살아나는 과정에서 IP가 변경되기 때문에 서버 사이드 로드 밸런싱은 어렵습니다.

<p align="center">
    <img src="/images/spring-cloud-netflix-ribbon-1.JPG" width="80%" class="image__border">
</p>
<center>https://sabarada.tistory.com/54</center>


### 1.2. Client Side Load Balancer

클라이언트 사이드 로드 밸런서는 다음과 같은 특징을 가집니다. 

* 소프트웨어적인 방법으로 처리합니다.
* 클라이언트는 동일한 비즈니스를 처리하는 서버들에게 요청을 나눠 보냅니다.
    * 클라이언트는 요청 분산을 위해 라운드 로빈(round robin) 같은 부하 분산 전략을 사용합니다.
* 중앙 집중형 로드 밸런서로 인해 발생하는 문제가 없습니다.
    * 로드 밸런서 다운으로 인한 장애가 발생하지 않습니다.
    * 로드 밸런서에 집중되는 부하가 없으므로 병목 현상이 완화됩니다. 

<p align="center">
    <img src="/images/spring-cloud-netflix-ribbon-2.JPG" width="80%" class="image__border">
</p>
<center>https://sabarada.tistory.com/54</center>

## 2. Functionality of Ribbon

`FeignClient`를 사용하면 자동으로 리본이 적용됩니다. 
이번 포스트에선 예제 코드 없이 리본이 해주는 일에 대해서만 정리하였습니다. 
간단한 로드 밸런싱 기능을 확인하려면 [FeignClient with Eureka][feign-with-eureka-link] 포스트를 참조바랍니다.

### 2.1. Rule

> 로드 밸런싱 전략을 지정합니다. 

`IRule` 인터페이스를 통해 전략을 정의합니다. 
`IRule` 인터페이스를 구현한 클래스들 중 하나를 선택하여 로드 밸런싱 방식을 결정합니다. 
개발자가 직접 구현한 클래스를 만들어 사용해도 됩니다. 
application.yml 파일에 특정 설정을 통해 로드 밸런싱 전략 클래스를 지정합니다. 
다음과 같은 클래스들이 존재합니다.

* com.netflix.loadbalancer.RoundRobinRule 
    * 서비스를 돌아가면서 연결하는 방식입니다.
    * 기본 방식입니다.
* com.netflix.loadbalancer.AvailabilityFilteringRule
    * 가용성이 높은것부터 연결하는 방식입니다.
    * 리본에 내장된 별도의 회로 차단기(circuit breaker) 모듈을 이용합니다.
* com.netflix.loadbalancer.WeightedResponseTimeRule 
    * 응답 시간이 빠른 서비스 인스턴스부터 연결하는 방식입니다.

##### application.yml

* `{clientName}.ribbon.NFLoadBalancerRuleClassName` 설정을 사용합니다.
* 추가적으로 .properties(혹은 .yml) 파일에 아래 설정을 추가하면 개발자가 커스터마이징한 기능들을 사용할 수 있습니다.
    * `{clientName}.ribbon.NFLoadBalancerClassName`
        * Should implement ILoadBalancer
    * `{clientName}.ribbon.NFLoadBalancerRuleClassName`
        * Should implement IRule
    * `{clientName}.ribbon.NFLoadBalancerPingClassName`
        * Should implement IPing
    * `{clientName}.ribbon.NIWSServerListClassName`
        * Should implement ServerList
    * `{clientName}.ribbon.NIWSServerListFilterClassName`
        * Should implement ServerListFilter

```yml
users:
  ribbon:
    NIWSServerListClassName: com.netflix.loadbalancer.ConfigurationBasedServerList
    NFLoadBalancerRuleClassName: com.netflix.loadbalancer.WeightedResponseTimeRule
```

##### IRule Interface

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

### 2.2. Ping

> 서버가 살아있는지 감시하는 역할을 수행합니다. 

`IPing` 인터페이스를 구현한 클래스를 통해 요청할 서버들이 살아있는지 검사합니다. 
만약, 서버가 죽었다면 로드 밸런싱을 위한 서비스 목록에서 제거합니다. 
개발자가 직접 구현한 클래스를 만들어 사용해도 됩니다. 
다음과 같은 클래스들이 존재합니다.

* com.netflix.loadbalancer.DummyPing
    * 기본 방식입니다.
* com.netflix.niws.loadbalancer.NIWSDiscoveryPing 
    * 각 서버들이 유레카에 여전히 등록되어 있는지 주기적으로 확인합니다.

##### IPing Interface

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

### 2.3. ServerList

> 서버 목록을 제공합니다. 

`ServerList` 인터페이스는 대상 서버 목록을 제공합니다. 
서버 목록은 함께 연계되는 컴포넌트 유무에 따라 동적이거나 정적입니다. 
동적인 경우 백그라운드 스레드에 의해 일정간 시간 간격으로 목록이 갱신됩니다.
다음은 `ServerList` 인터페이스를 구현한 클래스들입니다.

* com.netflix.loadbalancer.ConfigurationBasedServerList 
    * 서버 목록을 .properties(혹은 .yml)을 통해 획득합니다.
* com.netflix.niws.loadbalancer.DiscoveryEnabledNIWSServerList 
    * 유레카 서버로부터 얻은 서버 목록을 획득합니다.

##### ServerList Interface

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

#### REFERENCE

* <https://sabarada.tistory.com/54>
* <https://gunju-ko.github.io/spring-cloud/netflixoss/2018/12/14/Ribbon.html>
* <https://cloud.spring.io/spring-cloud-netflix/multi/multi_spring-cloud-ribbon.html>
* <https://junhyunny.github.io/spring-boot/spring-cloud/msa/spring-cloud-netflix-eureka/>
* <https://junhyunny.github.io/spring-boot/spring-cloud/msa/junit/feignclient-with-eureka/>
* <https://www.linkedin.com/pulse/microservices-client-side-load-balancing-amit-kumar-sharma>

[spring-cloud-openfeign-link]: https://junhyunny.github.io/spring-boot/spring-cloud/spring-cloud-openfeign/
[spring-cloud-netflix-eureka-link]: https://junhyunny.github.io/spring-boot/spring-cloud/msa/spring-cloud-netflix-eureka/
[feign-with-eureka-link]: https://junhyunny.github.io/spring-boot/spring-cloud/msa/junit/feignclient-with-eureka/