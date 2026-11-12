---
title: "스프링 부트 선언적 HTTP 클라이언트"
publishedAt: "2023-08-29"
updatedAt: "2026-11-12T16:15:07+09:00"
canonicalPath: "/spring-boot/declarative-http-client-in-spring-boot/"
categories:
  - "spring-boot"
summary: "스프링 6과 스프링 부트 3의 선언적 HTTP 클라이언트를 설정하고, 동기 반환 타입과 Mono, Flux 같은 비동기 반환 타입으로 외부 API를 호출하는 예제를 정리했다."
recommendedPosts:
  - title: "스프링 클라우드(spring cloud) OpenFeign"
    href: "https://junhyunny.github.io/spring-boot/spring-cloud/spring-cloud-openfeign/"
---

## 0. 들어가면서

스프링(spring) 팀과 같은 회사라 스프링 프레임워크(spring framework)에 관련된 소식을 다소 빠르게 접한다. 올해 8월 조쉬 롱(Josh Long)이 일본 토요타(toyota) 오피스에서 진행한 스프링 6과 스프링 부트 3 세션에 참여했을 때 HTTP 클라이언트에 대한 내용이 가장 눈에 띄었다. 언뜻 스프링 클라우드 `Openfeign`과 상당히 유사한 기능을 제공하는 것처럼 보였기 때문에 이를 즐겨 사용하던 나는 앞으로 스프링 팀에서 클라우드 컴포넌트들을 하나씩 내재화하려는 계획인지 궁금했다.

이에 대해 질문했더니 다음과 같은 답변을 들었다.

- 스프링 클라우드 기능들을 모두 커버할 생각은 없다.
- `Openfeign`은 통신이 블록(block)되기 때문에 스프링 팀에서 비동기 통신을 지원하기 위해 HTTP 클라이언트를 만들었다.
- 현재 사용하기에 조금 불편하지만, 편하게 사용할 수 있도록 기능을 발전시키고 있다.

이 글에서는 HTTP 클라이언트와 관련된 내용을 정리하면서 해당 기능을 탐구했다.

## 1. Declarative HTTP Client

> The Spring Framework lets you define an HTTP service as a Java interface with annotated methods for HTTP exchanges.

인터페이스 선언만으로 HTTP 통신을 수행할 수 있다. Openfeign에서 제공하는 기능과 상당히 유사하지만, 애너테이션만으로 빈(bean)을 생성하지 못한다는 차이점이 있다. 아래와 같은 클라이언트 빈 생성 과정이 필요하다. WebClient 객체를 생성하고 어댑터(adapter)를 통해 내부적으로 연결한다.

```java
    @Bean
    public PokemonClient pokemonClient(WebClient.Builder builder) {
        var client = builder.baseUrl(externalUrlConfig.pokemonUrl())
                .build();
        var factory = HttpServiceProxyFactory
                .builder(WebClientAdapter.forClient(client))
                .build();
        return factory.createClient(PokemonClient.class);
    }
```

### 1.1. Method Parameters

HTTP 클라이언트에 선언된 메서드는 다음과 같은 파라미터를 지원한다.

- URI
  - 동적으로 요청 URL을 변경할 수 있다.
  - 애너테이션에 적용된 URL 정보를 재정의(override)한다.
- HttpMethod
  - 동적으로 요청 HTTP 메서드를 변경한다.
  - 애너테이션에 적용된 HTTP 메서드를 재정의한다.
- @RequestHeader
  - `Map<String, ?>`, `MultiValueMap<String, ?>`를 사용해 요청 헤더를 정의한다.
- @PathVariable
  - 요청 URL에 정의된 플레이스홀더(placeholder) 변수에 값을 삽입한다.
- @RequestBody
  - 요청 바디(body) 메시지로 사용할 데이터 객체를 직렬화한다.
- @RequestParam
  - `Map<String, ?>`, `MultiValueMap<String, ?>`을 사용해 요청 파라미터를 정의한다.
  - 콘텐츠 타입(content-type)이 `application/x-www-form-urlencoded`인 경우 요청 바디 메시지로 사용한다.
- @RequestPart
  - 콘텐츠 타입이 `multipart/form-data`인 경우에 필요한 데이터를 정의한다.
- @CookieValue
  - 요청에 사용할 쿠키를 추가한다.

### 1.2. Return Values

HTTP 클라이언트에 선언된 메서드는 다음과 같은 응답을 반환할 수 있다. 블로킹(blocking)과 리액티브(reactive) 응답을 모두 지원한다.

- `void`, `Mono<Void>`
- `HttpHeaders`, `Mono<HttpHeaders>`
- `<T>`, `Mono<T>`
- `<T>`, `Flux<T>`
- `ResponseEntity<Void>`, `Mono<ResponseEntity<Void>>`
- `ResponseEntity<T>`, `Mono<ResponseEntity<T>>`
- `Mono<ResponseEntity<Flux<T>>`

### 1.3. HTTP Method Support

HTTP 메서드는 다음과 같은 애너테이션으로 지원한다.

- @HttpExchange
  - 루트 애너테이션으로 인터페이스 위에 선언한다.
  - 기본(base) URL, 메서드, 콘텐츠 타입 등을 정의할 수 있다.
- @GetExchange
  - HTTP GET 메서드를 지원하며 메서드 위에 선언한다.
- @PostExchange
  - HTTP POST 메서드를 지원하며 메서드 위에 선언한다.
- @PutExchange
  - HTTP PUT 메서드를 지원하며 메서드 위에 선언한다.
- @PatchExchange
  - HTTP PATCH 메서드를 지원하며 메서드 위에 선언한다.
- @DeleteExchange
  - HTTP DELETE 메서드를 지원하며 메서드 위에 선언한다.

## 2. Project Setup

간단한 예제 코드로 사용 방법을 살펴보자. 예제는 오픈 API 서버를 사용하며, 다음 순서로 동작한다.

1. 개발한 로컬 서비스를 먼저 실행한다.
2. 터미널에서 cURL 커맨드로 로컬 서버에 API 요청을 수행한다.
  - http://localhost:8080/sync/todos?page=0&limit=5
  - http://localhost:8080/async/todos?page=0&limit=5
  - http://localhost:8080/sync/pokemon?offset=0&limit=5
  - http://localhost:8080/async/pokemon?offset=0&limit=5
3. 각 요청에 맞는 클라이언트를 사용해 각 API 서버로 요청을 재전달한다.
  - `JsonPlaceholderClient`는 Json Placeholder API 서버로 요청을 전달한다.
  - `PokemonClient`는 Pokemon API 서버로 요청을 전달한다.

<div class="block-break" align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/declarative-http-client-in-spring-boot-01.png" width="100%" class="image__border">
</div>

프로젝트 구조는 다음과 같다.

```
./
├── HELP.md
├── build.gradle
├── gradle
│   └── wrapper
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── gradlew
├── gradlew.bat
├── settings.gradle
└── src
    ├── main
    │   ├── java
    │   │   └── action
    │   │       └── in
    │   │           └── blog
    │   │               ├── ActionInBlogApplication.java
    │   │               ├── client
    │   │               │   ├── JsonPlaceholderClient.java
    │   │               │   └── PokemonClient.java
    │   │               ├── config
    │   │               │   ├── ExternalUrlConfig.java
    │   │               │   └── HttpClientConfig.java
    │   │               ├── controller
    │   │               │   └── DeclarativeController.java
    │   │               └── domain
    │   │                   ├── Pokemon.java
    │   │                   ├── PokemonPage.java
    │   │                   └── Todo.java
    │   └── resources
    │       ├── application.yml
    │       ├── static
    │       └── templates
    └── test
        └── java
            └── action
                └── in
                    └── blog
                        └── ActionInBlogApplicationTests.java
```

build.gradle 파일에는 spring-boot-starter-webflux 의존성이 필요하다. `WebClient`를 사용하기 때문에 리액티브 관련 의존성을 추가한다.

```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.1.3'
    id 'io.spring.dependency-management' version '1.1.3'
}

group = 'action.in.blog'
version = '0.0.1-SNAPSHOT'

java {
    sourceCompatibility = '17'
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-webflux'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'io.projectreactor:reactor-test'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

외부 API 서버 주소는 application.yml 파일에 설정으로 관리한다.

```yml
external-service:
  json-placeholder-url: https://jsonplaceholder.typicode.com
  pokemon-url: https://pokeapi.co
```

ExternalUrlConfig 클래스는 설정으로 관리하는 외부 API 서버 주소 정보를 객체로 바인딩(binding)한다.

```java
package action.in.blog.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.ConstructorBinding;

@ConfigurationProperties(prefix = "external-service")
public record ExternalUrlConfig(
        String jsonPlaceholderUrl,
        String pokemonUrl
) {
    @ConstructorBinding
    public ExternalUrlConfig {
    }
}
```

HttpClientConfig 클래스는 `ExternalUrlConfig` 빈을 사용해 각 클라이언트에 필요한 URL을 설정한다. PokemonClient는 https://pokeapi.co 주소를, JsonPlaceholderClient는 https://jsonplaceholder.typicode.com 주소를 사용한다.

```java
package action.in.blog.config;

import action.in.blog.client.JsonPlaceholderClient;
import action.in.blog.client.PokemonClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.support.WebClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

@Configuration
public class HttpClientConfig {

    private final ExternalUrlConfig externalUrlConfig;

    public HttpClientConfig(ExternalUrlConfig externalUrlConfig) {
        this.externalUrlConfig = externalUrlConfig;
    }

    @Bean
    public PokemonClient pokemonClient(WebClient.Builder builder) {
        var client = builder.baseUrl(externalUrlConfig.pokemonUrl())
                .build();
        var factory = HttpServiceProxyFactory
                .builder(WebClientAdapter.forClient(client))
                .build();
        return factory.createClient(PokemonClient.class);
    }

    @Bean
    public JsonPlaceholderClient jsonPlaceholderClient(WebClient.Builder builder) {
        var client = builder.baseUrl(externalUrlConfig.jsonPlaceholderUrl())
                .build();
        var factory = HttpServiceProxyFactory
                .builder(WebClientAdapter.forClient(client))
                .build();
        return factory.createClient(JsonPlaceholderClient.class);
    }
}
```

## 3. Practice

`spring-boot-starter-web` 의존성을 함께 사용하면 동기, 비동기 관련 기능을 모두 테스트할 수 있다.

JsonPlaceholderClient 인터페이스에서 List 반환 타입은 동기 처리를, Flux 반환 타입은 비동기 처리를 수행한다.

```java
package action.in.blog.client;

import action.in.blog.domain.Todo;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.service.annotation.GetExchange;
import reactor.core.publisher.Flux;

import java.util.List;

public interface JsonPlaceholderClient {

    @GetExchange("/todos")
    List<Todo> todos(@RequestParam("_page") int page, @RequestParam("_limit") int limit);

    @GetExchange("/todos")
    Flux<Todo> todosAsync(@RequestParam("_page") int page, @RequestParam("_limit") int limit);
}
```

PokemonClient 인터페이스에서 PokemonPage 반환 타입은 동기 처리를, Mono 반환 타입은 비동기 처리를 수행한다.

```java
package action.in.blog.client;

import action.in.blog.domain.PokemonPage;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;
import reactor.core.publisher.Mono;

@HttpExchange(url = "/api/v2")
public interface PokemonClient {

    @GetExchange("/pokemon")
    PokemonPage pokemon(@RequestParam int offset, @RequestParam int limit);

    @GetExchange("/pokemon")
    Mono<PokemonPage> pokemonAsync(@RequestParam int offset, @RequestParam int limit);
}
```

DeclarativeController 클래스는 요청별로 적합한 클라이언트의 메서드에 API 처리를 위임한다.

```java
package action.in.blog.controller;

import action.in.blog.client.JsonPlaceholderClient;
import action.in.blog.client.PokemonClient;
import action.in.blog.domain.PokemonPage;
import action.in.blog.domain.Todo;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
public class DeclarativeController {

    private final JsonPlaceholderClient jsonPlaceholderClient;
    private final PokemonClient pokemonClient;

    public DeclarativeController(
            JsonPlaceholderClient jsonPlaceholderClient,
            PokemonClient pokemonClient
    ) {
        this.jsonPlaceholderClient = jsonPlaceholderClient;
        this.pokemonClient = pokemonClient;
    }

    @GetMapping("/sync/todos")
    public List<Todo> todosSync(@RequestParam int page, @RequestParam int limit) {
        return jsonPlaceholderClient.todos(page, limit);
    }

    @GetMapping("/sync/pokemon")
    public PokemonPage pokemonSync(@RequestParam int offset, @RequestParam int limit) {
        return pokemonClient.pokemon(offset, limit);
    }

    @GetMapping("/async/todos")
    public Flux<Todo> todosAsync(@RequestParam int page, @RequestParam int limit) {
        return jsonPlaceholderClient.todosAsync(page, limit);
    }

    @GetMapping("/async/pokemon")
    public Mono<PokemonPage> pokemonAsync(@RequestParam int offset, @RequestParam int limit) {
        return pokemonClient.pokemonAsync(offset, limit);
    }
}
```

cURL 명령어로 API 요청을 수행해 보자. 먼저 JsonPlaceholder API 서버에 동기식으로 요청한다.

```
$ curl "http://localhost:8080/sync/todos?page=0&limit=5" | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   395    0   395    0     0    287      0 --:--:--  0:00:01 --:--:--   289
[
  {
    "userId": 1,
    "id": 1,
    "title": "delectus aut autem",
    "completed": false
  },
  ...
]
```

JsonPlaceholder API 서버에 비동기식으로 요청한다.

```
$ curl "http://localhost:8080/async/todos?page=0&limit=5" | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   395    0   395    0     0   4321      0 --:--:-- --:--:-- --:--:--  4647
[
  {
    "userId": 1,
    "id": 1,
    "title": "delectus aut autem",
    "completed": false
  },
  ...
]
```

Pokemon API 서버에 동기식으로 요청한다.

```
$ curl "http://localhost:8080/sync/pokemon?offset=0&limit=5" | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   431    0   431    0     0    178      0 --:--:--  0:00:02 --:--:--   178
{
  "count": 1281,
  "next": "https://pokeapi.co/api/v2/pokemon?offset=5&limit=5",
  "previous": null,
  "results": [
    {
      "name": "bulbasaur",
      "url": "https://pokeapi.co/api/v2/pokemon/1/"
    },
    ...
  ]
}
```

Pokemon API 서버에 비동기식으로 요청한다.

```
$ curl "http://localhost:8080/async/pokemon?offset=0&limit=5" | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   431    0   431    0     0   5907      0 --:--:-- --:--:-- --:--:--  6530
{
  "count": 1281,
  "next": "https://pokeapi.co/api/v2/pokemon?offset=5&limit=5",
  "previous": null,
  "results": [
    {
      "name": "bulbasaur",
      "url": "https://pokeapi.co/api/v2/pokemon/1/"
    },
    ...
  ]
}
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-08-29-declarative-http-client-in-spring-boot>

#### REFERENCE

- <https://www.youtube.com/watch?v=FvDSL3pSKNQ>
- <https://docs.spring.io/spring-framework/reference/integration/rest-clients.html#rest-http-interface>
- <https://howtodoinjava.com/java/whats-new-spring-6-spring-boot-3/>
- <https://howtodoinjava.com/spring-webflux/http-declarative-http-client-httpexchange/>
- <https://www.baeldung.com/spring-6-http-interface>
