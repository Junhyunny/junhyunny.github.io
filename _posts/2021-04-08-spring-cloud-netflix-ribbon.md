---
title: "Spring Cloud Netflix Ribbon"
search: false
category:
  - spring-boot
  - spring-cloud
  - msa
last_modified_at: 2021-04-08T00:00:00
---

<br>

## Netflix Ribbon
MSA를 성공적으로 구축한 대표적인 기업인 Netflix는 쉬운 MSA 구축을 돕는 다양한 기술들과 이슈에 대한 해결책들을 Netflix OSS(open source software)를 통해 제공합니다. 
Ribbon도 Eureka, Hystrix와 마찬가지로 Netflix가 제공하는 컴포넌트 중 하나입니다. 
Ribbon은 HTTP 및 TCP 클라이언트의 동작에 대한 제어를 제공하는 **클라이언트 사이드 로드 밸런서(client-side load balancer)**입니다. 
Feign은 이미 Ribbon을 사용하고 있으므로 @FeignClient를 사용하면 함께 적용됩니다.

### Spring Cloud Netflix Components
- Eureka - Service Discovery & Registry
- Hystrix - Fault Tolerance Library(Circuit Breaker) 
- Zuul- API Gateway  
- Ribbon - Client Side Loadbalancer

## 클라이언트 사이드 로드 밸런서(client-side load balancer)
클라이언트 사이드 로드 밸런서(client-side load balancer)이 정확히 어떤 개념인지 알고 넘어가도록 하겠습니다. 
우선 반대되는 개념인 서버 사이드 로브 밸런서(server-side load balancer)에 대해 이야기해보겠습니다. 
서버 사이드 로드 밸런서는 L4 스위치 같은 H/W를 이용하는 방식입니다. 

##### 서버 사이드 로드 밸런서(server-side load balancer)
<p align="center"><img src="/images/spring-cloud-netflix-ribbon-1.JPG" width="50%"></p>
<center>이미지 출처, https://sabarada.tistory.com/54</center><br>

서버 사이드 로드 밸런서를 사용하는 경우 다음과 같은 한계가 존재합니다. 
- H/W 기반이므로 상대적으로 비용이 많이 소모됩니다.
- H/W 스위치가 서버 목록에 대한 정보를 알고 있어야 로드 밸런싱이 가능합니다.
- H/W 스위치의 서버 목록은 수동으로 추가해야하므로 클라우드 환경에서 유연성이 떨어집니다.

<br> 

[Spring Cloud Netflix Eureka][eureka-blogLink] 포스트에서 설명했듯이 
클라우드 환경에선 인스턴스들의 IP, PORT 정보에 대한 변경이 잦아 서버 사이드 로드 밸런서는 크게 유용하지 못합니다. 
**이를 S/W 적인 방식으로 보완한 방법이 클라이언트 사이드 로드 밸런서입니다.**
마이크로 서비스 아키텍처는 서비스들끼리 협업하는 세상입니다. 
그렇기 때문에 서비스는 클라이언트의 요청을 받아주는 서버가 될 수도 있고 다른 서비스에게 도움을 요청하는 클라이언트가 될 수도 있습니다. 

##### 클라이언트 사이드 로드 밸런서(server-side load balancer)
<p align="center"><img src="/images/spring-cloud-netflix-ribbon-2.JPG" width="50%"></p>
<center>이미지 출처, https://sabarada.tistory.com/54</center><br>

클라이언트 사이드 로드 밸런서는 클라우드 환경에서 다음과 같은 이점을 얻을 수 있습니다.
- 어플리케이션에서 서버 리스트를 관리하므로 Scale Out 등으로 인해 서버 리스트가 변경되어도 유연한 대응이 가능합니다.
- S/W 기능이므로 H/W 증설과 같은 추가적인 비용이 발생하지 않습니다.
- 로드 밸런서 서버의 다운으로 인해 장애가 서비스 전체로 전파되는 것을 막을 수 있습니다.
- 서버 사이드 로드 밸런서처럼 병목 지점이 발생되지 않습니다.

## Ribbon 주요 기능
### RULE
IRule 인터페이스는 로드 밸런스 방식을 지정하기 위해 사용합니다. 
IRule 인터페이스 구현체들은 로드 밸런스를 수행하기 위한 기준을 제공합니다. 
application.yml 파일에 **`{clientName}.ribbon.NFLoadBalancerRuleClassName`** 설정을 통해 기준을 제공하는 클래스를 지정할 수 있습니다. 
개발자가 직접 IRule 인터페이스를 구현한 클래스를 만들어 로드 밸런스 기준을 커스터마이징 할 수 있습니다.

IRule 인터페이스를 구현한 클래스들입니다.
- com.netflix.loadbalancer.RoundRobinRule 
  - 서비스를 돌아가면서 연결하는 방식(default)
- com.netflix.loadbalancer.AvailabilityFilteringRule
  - 가용성이 높은것부터 연결하는 방식, Ribbon에 내장된 별도의 Circuit Breaker 모듈을 이용
- com.netflix.loadbalancer.WeightedResponseTimeRule 
  - 응답 시간이 빠른 서비스 인스턴스부터 연결하는 방식

##### application.yml 설정 예시
```yml
users:
  ribbon:
    NIWSServerListClassName: com.netflix.loadbalancer.ConfigurationBasedServerList
    NFLoadBalancerRuleClassName: com.netflix.loadbalancer.WeightedResponseTimeRule
```

##### IRule 인터페이스
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

### PING
IPing 인터페이스는 각 서버가 살아있는지 검사하는 역할을 수행합니다. 
더 이상 살아있지 않는 서버는 로드 밸런스를 위한 서비스 목록에서 제거합니다. 
개발자가 직접 IPing 인터페이스를 구현한 클래스를 만들어 PING 기능을 커스터마이징 할 수 있습니다.

IPing 인터페이스를 구현한 클래스들입니다.
- com.netflix.loadbalancer.DummyPing(default)
- com.netflix.niws.loadbalancer.NIWSDiscoveryPing 
  - 각 서버들이 유레카에 여전히 등록되어 있는지 주기적으로 확인

##### IPing 인터페이스
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

### SERVER LIST
ServerList 인터페이스는 대상 서버 목록을 제공합니다. 
서버 목록은 동적이거나 정적일 수 있습니다. 
동적인 경우에 백그라운드 스레드에 의해 일정한 간격으로 서버 목록이 업데이트됩니다. 

ServerList 인터페이스를 구현한 클래스들입니다.
- com.netflix.loadbalancer.ConfigurationBasedServerList 
  - 서버 목록을 property(혹은 yml)을 통해 획득
- com.netflix.niws.loadbalancer.DiscoveryEnabledNIWSServerList 
  - 유레카 서버로부터 얻은 서버 리스트를 획득

##### ServerList 인터페이스
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

## OPINION
이번 포스트는 테스트 코드 없이 설명 위주로 작성하였습니다. 
Ribbon은 Eureka, FeignClient를 사용하면 함께 적용되기 때문에 @RibbonClient 애너테이션을 이용한 테스트 코드는 별도로 작성하지 않았습니다. 
이전 [FeignClient with Eureka][feign-with-eureka-blogLink] 포스트에서 
FeignClient, Eureka 컴포넌트를 함께 사용할 때 로드 밸런스가 동작하는 되는 테스트 코드를 확인하실 수 있습니다. 

추가적으로 property(혹은 yml) 파일에 아래 설정을 추가하여 개발자가 커스터마이징한 기능들을 사용할 수 있습니다.
- **`{clientName}.ribbon.NFLoadBalancerClassName`**: Should implement ILoadBalancer
- **`{clientName}.ribbon.NFLoadBalancerRuleClassName`**: Should implement IRule
- **`{clientName}.ribbon.NFLoadBalancerPingClassName`**: Should implement IPing
- **`{clientName}.ribbon.NIWSServerListClassName`**: Should implement ServerList
- **`{clientName}.ribbon.NIWSServerListFilterClassName`**: Should implement ServerListFilter

#### REFERENCE
- <https://sabarada.tistory.com/54>
- <https://gunju-ko.github.io/spring-cloud/netflixoss/2018/12/14/Ribbon.html>
- <https://cloud.spring.io/spring-cloud-netflix/multi/multi_spring-cloud-ribbon.html>
- <https://junhyunny.github.io/spring-boot/spring-cloud/msa/spring-cloud-netflix-eureka/>
- <https://junhyunny.github.io/spring-boot/spring-cloud/msa/junit/feignclient-with-eureka/>
- <https://www.linkedin.com/pulse/microservices-client-side-load-balancing-amit-kumar-sharma>

[eureka-blogLink]: https://junhyunny.github.io/spring-boot/spring-cloud/msa/spring-cloud-netflix-eureka/
[feign-with-eureka-blogLink]: https://junhyunny.github.io/spring-boot/spring-cloud/msa/junit/feignclient-with-eureka/