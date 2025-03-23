---
title: "AWS Elasticache 서버리스(serverless) Valkey 스프링 세션 연결"
search: false
category:
  - aws
  - spring-security
  - spring-session
last_modified_at: 2025-03-22T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Spring Session with Redis][spring-session-with-redis-link]
- [Replication in Redis][replication-in-redis-link]
- [Failover Using Sentinel for Redis][failover-using-sentinel-for-redis-link]

## 0. 들어가면서

나는 많은 프로젝트에서 스프링 서버 애플리케이션을 구현할 때 세션을 위해 레디스(redis)를 사용했었다. 최근 새로운 서비스의 세션을 구축하기 위해 AWS 엘라스틱캐시(elasticache)에서 레디스 서버를 배포하려고 했더니 다음과 같은 AWS 추천 메시지를 만났다. 

<div align="center">
  <img src="/images/posts/2025/aws-elasticache-valkey-and-spring-01.png" width="80%" class="image__border">
</div>

<br/>

가격도 33% 저렴하고 레디스와 완벽하게 호환된다고 하니 선택하지 않을 이유가 없다고 생각했다. 이번 글은 밸키(Valkey) 서버리스(serverless)를 구축하면서 만났던 에러들에 대해 정리했다.

## 1. What is Valkey?

우선 밸키가 무엇인지 알아봤다. 밸키는 레디스 프로젝트로부터 포크(fork)한 프로젝트이다. 리눅스 재단(foundation)의 지원을 받고 있다. [이 기사](https://www.cio.com/article/3526115/%EC%B9%BC%EB%9F%BC-%EB%A0%88%EB%94%94%EC%8A%A4-%EB%AC%B4%EC%9E%84%EC%8A%B9%EC%B0%A8%C2%B7%C2%B7%C2%B7-aws%EC%9D%98-%EB%8B%B9%ED%98%B9%EC%8A%A4%EB%9F%AC%EC%9A%B4-%EB%B2%A8.html)에 따르면 레디스의 오픈소스 라이선스가 변경되면서 AWS에서 레디스 프로젝트를 포크한 것 같다. 라이선스 변경에 관련된 내용을 자세히 들여다보진 않았지만, 레디스를 사용해 막대한 이익을 거두고 있는 AWS 같은 클라우드 기업에겐 불리한 변경이었던 것 같다. 레디스는 여전히 일반 개발자들에겐 오픈소스라고 한다.

AWS 공식 홈페이지에서 설명하는 엘라스틱캐시 밸키의 장점은 다음과 같다.

- 저렴한 가격
  - 33% 할인된 가격과 월 6달러부터 시작하는 100MB의 최소 데이터 스토리지 제공
  - 90% 더 낮은 Valkey용 ElastiCache Serverless의 비용
- 운영 우수성
  - Valkey용 ElastiCache는 AWS의 보안, 운영 우수성, 99.99% 가용성 및 안정성을 활용하면서 오픈 소스 기술을 기반으로 구축된 완전 관리형 환경을 제공
- 성능
  - 마이크로초 단위의 읽기 및 쓰기 대기 시간을 제공할 수 있으며 단일 자체 설계(노드 기반) 클러스터에서 초당 5억개의 요청(RPS)까지 확장 가능
- API 호환성
  - Valkey용 ElastiCache는 Redis OSS API 및 데이터 형식과 호환되며 고객은 코드를 다시 작성하거나 아키텍처를 변경할 필요 없이 애플리케이션을 마이그레이션 가능
- 무중단 마이그레이션
  - Redis OSS용 ElastiCache의 기존 사용자는 가동 중지 시간 없이 Valkey용 ElastiCache로 빠르게 업그레이드 가능
- 지속적인 혁신
  - AWS의 지속적인 Valkey를 지원과 기여

## 2. Dependencies

이 글에서 사용한 의존성은 다음과 같다. 중요한 의존성은 `spring-boot-starter-data-redis`과 `spring-session-data-redis`이다. 밸키는 레디스와 호환되기 때문에 레디스 의존성을 사용해도 문제가 없다.

```gradle
plugins {
	id 'org.jetbrains.kotlin.jvm' version '1.9.25'
	id 'org.jetbrains.kotlin.plugin.spring' version '1.9.25'
	id 'org.springframework.boot' version '3.4.4'
	id 'io.spring.dependency-management' version '1.1.7'
}

...

dependencies {
	implementation 'org.springframework.boot:spring-boot-starter-data-redis' // redis
	implementation 'org.springframework.session:spring-session-data-redis' // session redis
	implementation 'org.springframework.boot:spring-boot-starter-web'
	implementation 'com.fasterxml.jackson.module:jackson-module-kotlin'
	implementation 'org.jetbrains.kotlin:kotlin-reflect'
	testImplementation 'org.springframework.boot:spring-boot-starter-test'
	testImplementation 'org.jetbrains.kotlin:kotlin-test-junit5'
	testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
}
```

## 3. SessionController class

세션 연결 여부를 확인하기 위해 간단한 정보를 저장하고 조회하는 간단한 예제 컨트롤러를 만든다. 

- 세션에 저장된 Todo 객체를 찾는다.
  - 세션에 저장된 Todo 객체가 있으면 이를 반환한다.
  - 세션에 저장된 Todo 객체가 없으면 새로운 Todo 객체를 생성 후 세션에 저장하고, 반환한다.

```kotlin
package action.`in`.blog.controller

import jakarta.servlet.http.HttpServletRequest
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

data class Todo(
    val title: String,
    val description: String
) {
    constructor(): this("", "")
}

@RestController
class TodoController {

    @GetMapping("/todos")
    fun todos(servletRequest: HttpServletRequest): Todo {
        val session = servletRequest.session
        val todo = session.getAttribute("TODO") as Todo?
        if (todo != null) {
            return todo
        }
        val result = Todo("Hello World", "This is session test")
        session.setAttribute("TODO", result)
        return result
    }
}
```

## 4. application YAML

스프링 세션을 통해 레디스와 연결하기 위해선 `application.yml` 파일에 설정이 필요하다. 여기서 로컬 개발 환경과 클라우드 환경의 분리가 필요하다. 로컬 환경은 단순하게 단일 밸키 컨테이너와 연결하면 되지만, AWS 엘라스틱캐시의 서버리스 밸키는 고가용성을 위해 클러스터로 구축되어 있다. 다음과 같이 정리할 수 있다. 

- 로컬 환경에선 서버 애플리케이션과 밸키 컨테이너를 연결하면 한다.
- 클라우드 환경에선 서버 애플리케이션과 밸키 클러스터와 연결해야 한다.

스프링 세션을 사용하는 서버 애플리케이션에서 단일 레디스와 레디스 클러스터에 연결할 때 서로 다른 설정이 필요하다. 프로파일(profile)을 구분하여 세션 연결 설정을 분리한다. 먼저 로컬 환경 설정을 위한 `application-local.yml` 파일을 살펴보자. 

- 싱글 밸키 인스턴스와 연결하기 떄문에 호스트 정보를 입력한다.

```yml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      password:
```

클라우드 환경은 어떨까? 클라우드 환경에서 서버리스 밸키와 연결할 때 두 가지 설정이 필요하다. 

- 클러스터 연결
- TLS(Transport Layer Security) 연결

우선 클러스터 연결에 관련된 내용을 살펴보자. AWS 서버리스 밸키는 클러스터로 구성되어 있기 때문에 클러스터 연결을 위한 설정이 필요하다. 위 로컬 설정을 사용하면 클라우드 환경에서 `CROSSSLOT Keys in request don't hash to the same slot` 에러를 만난다. 

```
2025-03-20T02:16:16.657Z ERROR 1 --- [tracker] [nio-8080-exec-5] [|]:o.a.c.c.C.[.[.[/].[dispatcherServlet] : Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception
org.springframework.data.redis.RedisSystemException: Error in execution
    at org.springframework.data.redis.connection.lettuce.LettuceExceptionConverter.convert(LettuceExceptionConverter.java:52) ~[spring-data-redis-3.3.6.jar:3.3.6]
    at org.springframework.data.redis.connection.lettuce.LettuceExceptionConverter.convert(LettuceExceptionConverter.java:50) ~[spring-data-redis-3.3.6.jar:3.3.6]
    ...
Caused by: io.lettuce.core.RedisCommandExecutionException: CROSSSLOT Keys in request don't hash to the same slot
    at io.lettuce.core.internal.ExceptionFactory.createExecutionException(ExceptionFactory.java:147) ~[lettuce-core-6.3.2.RELEASE.jar:6.3.2.RELEASE/8941aea]
    at io.lettuce.core.internal.ExceptionFactory.createExecutionException(ExceptionFactory.java:116) ~[lettuce-core-6.3.2.RELEASE.jar:6.3.2.RELEASE/8941aea]
    at io.lettuce.core.protocol.AsyncCommand.completeResult(AsyncCommand.java:120) ~[lettuce-core-6.3.2.RELEASE.jar:6.3.2.RELEASE/8941aea]
    ...
```

`CROSSSLOT Keys in request don't hash to the same slot` 에러는 밸키(혹은 레디스) 클러스터 환경에서 클라이언트가 멀티 키 연산을 수행할 때 다른 키가 다른 슬롯으로 들어가야 하기 때문에 문제가 발생한다. 자세한 내용은 [이 글](https://sangboaklee.medium.com/redis-%ED%81%B4%EB%9F%AC%EC%8A%A4%ED%84%B0-%EA%B5%AC%EC%84%B1%EC%97%90%EC%84%9C-%EB%B3%B5%EC%88%98%EC%9D%98-%ED%82%A4-%EC%82%AD%EC%A0%9C-597b7bf07a07)을 참고하길 바란다.

다음은 TLS 연결 설정이 필요하다. 서버리스 밸키와 연결하기 위해선 TLS 옵션이 필요하다. 

<div align="center">
  <img src="/images/posts/2025/aws-elasticache-valkey-and-spring-02.png" class="image__border">
</div>

<br/>

AWS 시큐리티 그룹(security group)에 6379 포트에 대한 인바운드 규칙이 설정되어 있음에도 타임아웃이 발생한다면 TLS 연결 옵션 활성화 여부를 확인해보길 바란다.

```
2025-03-20T01:55:44.898Z ERROR 1 --- [tracker] [io-8080-exec-10] [67db7564c8857ba6adbee213795cdef8|2649be0908cf8ef8]:OAuth2AuthorizationRequestRedirectFilter : Authorization Request failed: org.springframework.data.redis.RedisConnectionFailureException: Unable to connect to Redis
org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestRedirectFilter$OAuth2AuthorizationRequestException: Unable to connect to Redis
    at org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestRedirectFilter.doFilterInternal(OAuth2AuthorizationRequestRedirectFilter.java:193) ~[spring-security-oauth2-client-6.3.5.jar:6.3.5]
    at org.springframework.web.filter.OncePerRequestFilter.doFilter(OncePerRequestFilter.java:116) ~[spring-web-6.1.15.jar:6.1.15]
    ...
Caused by: org.springframework.data.redis.RedisConnectionFailureException: Unable to connect to Redis
    at org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory$ExceptionTranslatingConnectionProvider.translateException(LettuceConnectionFactory.java:1849) ~[spring-data-redis-3.3.6.jar:3.3.6]
    at org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory$ExceptionTranslatingConnectionProvider.getConnection(LettuceConnectionFactory.java:1780) ~[spring-data-redis-3.3.6.jar:3.3.6]
    at org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory$SharedConnection.getNativeConnection(LettuceConnectionFactory.java:1582) ~[spring-data-redis-3.3.6.jar:3.3.6]
    ...
Caused by: io.lettuce.core.RedisConnectionException: Unable to connect to tracker-dev-valkey-serverless-z8ntis.serverless.apne1.cache.amazonaws.com/<unresolved>:6379
    at io.lettuce.core.RedisConnectionException.create(RedisConnectionException.java:78) ~[lettuce-core-6.3.2.RELEASE.jar:6.3.2.RELEASE/8941aea]
    at io.lettuce.core.RedisConnectionException.create(RedisConnectionException.java:56) ~[lettuce-core-6.3.2.RELEASE.jar:6.3.2.RELEASE/8941aea]
    ...
Caused by: io.lettuce.core.RedisCommandTimeoutException: Connection initialization timed out after 1 minute(s)
    at io.lettuce.core.protocol.RedisHandshakeHandler.lambda$channelRegistered$0(RedisHandshakeHandler.java:67) ~[lettuce-core-6.3.2.RELEASE.jar:6.3.2.RELEASE/8941aea]
    at io.netty.util.concurrent.PromiseTask.runTask(PromiseTask.java:98) ~[netty-common-4.1.115.Final.jar:4.1.115.Final]
    ...
```

[이 글](https://stackoverflow.com/a/68843387)에 따르면 레디스 TLS 연결은 `spring.redis.ssl=true` 설정을 통해 지정할 수 있다. 참고한 글은 GCP(google cloud platform)에 대한 내용이지만, 나의 경우도 잘 동작했다. 현재 사용하는 스프링 버전에서 `spring.redis.ssl=true` 설정은 더 이상 사용되지 않는 설정(deprecated)이 되었다. `spring.data.redis.ssl.enabled=true` 설정을 사용한다. 최종적으로 클라우드 환경을 위한 `application-cloud.yml` 설정은 다음과 같다.

- TLS 연결을 활성화한다.
- 환경 변수를 통해 클러스터 노드 연결 정보를 설정한다.

```yml
  spring:
    data:
      redis:
        ssl:
          enabled: true
        cluster:
          nodes: ${SESSION_HOST}
          max-redirects: 3
```

`SESSION_HOST` 환경 변수로 등록할 클러스터 노드 연결 정보는 밸키 서버리스 대시보드 화면에서 확인할 수 있다. 엔드포인트 정보를 포트까지 포함하여 그대로 사용한다. 

<div align="center">
  <img src="/images/posts/2025/aws-elasticache-valkey-and-spring-03.png" width="100%" class="image__border">
</div>

## 5. Setting AWS security group

서버리스 밸키를 위한 시큐리티 그룹을 설정할 때 두 개의 포트를 노출해야 한다. 

- 기본 포트 6379
- 읽기 전용(readonly) 포트 6380

[AWS 엘라스틱캐시 가이드](https://docs.aws.amazon.com/ko_kr/AmazonElastiCache/latest/dg/redis-ug.pdf)를 보면 다음 설명을 볼 수 있다.

> 서버리스 캐시는 동일한 호스트 이름이 있는 포트 2개로 제시됩니다. 기본 포트에서는 쓰기 및 읽기가 가능한 반면, 읽기 포트는 READONLY 명령을 사용하여 짧은 지연 시간으로 최종 읽기 일관성을 지원합니다.

6380 포트를 시큐리티 그룹에서 허용하지 않으면 다음과 같은 에러 메시지를 만난다.

```
2025-03-20T03:31:14.788Z  WARN 1 --- [tracker] [ioEventLoop-4-2] [|]:i.l.c.c.t.DefaultClusterTopologyRefresh  : Unable to connect to [tracker-dev-valkey-serverless-z8ntis.serverless.apne1.cache.amazonaws.com/<unresolved>:6380]: connection timed out after 10000 ms: tracker-dev-valkey-serverless-z8ntis.serverless.apne1.cache.amazonaws.com/10.0.2.129:6380
```

다음과 같이 두 개의 포트를 인바운드 규칙으로 지정한다.

<div align="center">
  <img src="/images/posts/2025/aws-elasticache-valkey-and-spring-04.png" width="100%" class="image__border">
</div>

## 6. Verification

다음과 같은 인프라 환경에서 스프링 서버 애플리케이션과 서버리스 밸키 세션이 연결되는지 확인한다. 

- EC2 컨테이너에서 AWS 엘라스틱캐시 서버리스 밸키 클러스터를 세션으로 사용한다.

<div align="center">
  <img src="/images/posts/2025/aws-elasticache-valkey-and-spring-05.png" width="100%" class="image__border">
</div>

<br/>

테라폼을 사용해 인프라를 구축한다. 코드에 대한 설명은 별도로 없다. [예제 프로젝트](https://github.com/Junhyunny/blog-in-action/tree/master/2025-03-22-aws-elasticache-valkey-and-spring)의 `/infra` 디렉토리를 참조하길 바란다. AWS 인프라 작업을 위한 자격 증명을 터미널 세션에 준비한다.

```
$ export AWS_ACCESS_KEY_ID=ABCDEFGHIJKLEMNOPQRSTUVWXYZ
$ export AWS_SECRET_ACCESS_KEY=ABCDEFGHIJKLEMNOPQRSTUVWXYZ/1234567890/BCDE
$ export AWS_SESSION_TOKEN=ABCDEFG ... 1234567890
```

테라폼 프로젝트 경로로 이동한다.

```
$ cd infra
```

테라폼 프로젝트를 초기화한다.

```
$ terraform init

Initializing the backend...
Initializing provider plugins...

...

Apply complete! Resources: 17 added, 0 changed, 0 destroyed.

Outputs:

server_endpoint = "18.183.170.112"
valkey_endpoint = tolist([
  {
    "address" = "valkey-cluster-z8ntis.serverless.apne1.cache.amazonaws.com"
    "port" = 6379
  },
])
```

인프라 배포가 완료되더라도 EC2 컨테이너에서 애플리케이션을 준비하는 시간이 약간 소요된다. 잠시 후 서버 엔드포인트로 접근하면 다음과 같은 화면을 볼 수 있다.

<div align="center">
  <img src="/images/posts/2025/aws-elasticache-valkey-and-spring-06.png" width="100%" class="image__border">
</div>

<br/>

엘라스틱캐시 밸키 클러스터 모니터링 화면에서 세션 정보가 저장되었는지 캐시가 히트했는지 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2025/aws-elasticache-valkey-and-spring-07.png" width="100%" class="image__border">
</div>

## CLOSING

위에서 봤듯이 [예제 레포지토리](https://github.com/Junhyunny/blog-in-action/tree/master/2025-03-22-aws-elasticache-valkey-and-spring)에는 AWS 서버리스 밸키를 구성하는 테라폼 코드가 함께 포함되어 있다. 이 외에도 로컬 환경에서 밸키 컨테이너를 구성하는 도커 컴포즈 파일이 있으니 로컬 환경 연결도 확인해볼 수 있다. 다음 글은 CROSSSLOT 문제나 CDK(혹은 테라폼)으로 엘라스틱캐시 서버리스 밸키를 구성하는 방법에 대해 정리할 생각이다. 

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2025-03-22-aws-elasticache-valkey-and-spring>

#### REFERENCE

- <https://www.kedos.co.uk/p/news/valkey-vs-redis-aws>
- <https://news.hada.io/topic?id=14436>
- <https://news.hada.io/topic?id=14058>
- <https://stackoverflow.com/a/68843387>
- [‘레디스 무임승차’··· AWS의 당혹스러운 ‘벨키 포크’](https://www.cio.com/article/3526115/%EC%B9%BC%EB%9F%BC-%EB%A0%88%EB%94%94%EC%8A%A4-%EB%AC%B4%EC%9E%84%EC%8A%B9%EC%B0%A8%C2%B7%C2%B7%C2%B7-aws%EC%9D%98-%EB%8B%B9%ED%98%B9%EC%8A%A4%EB%9F%AC%EC%9A%B4-%EB%B2%A8.html)
- [[Redis] 클러스터 구성에서 복수의 키 삭제](https://sangboaklee.medium.com/redis-%ED%81%B4%EB%9F%AC%EC%8A%A4%ED%84%B0-%EA%B5%AC%EC%84%B1%EC%97%90%EC%84%9C-%EB%B3%B5%EC%88%98%EC%9D%98-%ED%82%A4-%EC%82%AD%EC%A0%9C-597b7bf07a07)
- <https://docs.aws.amazon.com/ko_kr/AmazonElastiCache/latest/dg/redis-ug.pdf>
- <https://docs.aws.amazon.com/ko_kr/AmazonElastiCache/latest/dg/wwe-troubleshooting.html>

[replication-in-redis-link]: https://junhyunny.github.io/spring-boot/redis/replication-in-redis/
[failover-using-sentinel-for-redis-link]: https://junhyunny.github.io/spring-boot/redis/failover-using-sentinel-for-redis/
[spring-session-with-redis-link]: https://junhyunny.github.io/information/spring-boot/redis/spring-session-with-redis/