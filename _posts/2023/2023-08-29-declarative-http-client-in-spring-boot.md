---
title: "Declarative HTTP Client in Spring Boot"
search: false
category:
  - spring-boot
last_modified_at: 2023-08-29T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [스프링 클라우드(spring cloud) OpenFeign][spring-cloud-openfeign-link]

## 0. 들어가면서

스프링(spring) 팀과 같은 회사라 스프링 프레임워크(spring framework)에 관련된 소식을 다소 빠르게 접합니다. 
올해 8월 조쉬 롱(Josh Long)이 일본 도요타(toyota) 오피스에서 진행한 스프링 6과 스프링 부트 3 세션에서 참여했을 때 HTTP 클라이언트에 대한 내용이 가장 눈에 띄었습니다. 
언뜻 스프링 클라우드 `Openfeign`과 상당히 유사한 기능을 제공하는 것처럼 보였기 때문에 이를 즐겨 사용하던 저는 앞으로 스프링 팀에서 클라우드 컴포넌트들을 하나씩 내재화하려는 계획인지 궁금했습니다. 

이에 대해 질문을 했더니 다음과 같은 답변을 들었습니다. 

* 스프링 클라우드 기능들을 모두 커버할 생각은 없다.
* `Openfeign`은 통신이 블록(block)되기 때문에 스프링 팀에서 비동기 통신을 지원하기 위해 HTTP 클라이언트를 만들었다.
* 현재 사용하기에 조금 불편하지만, 편하게 사용할 수 있도록 기능을 발전시키고 있다. 

이번 포스트는 HTTP 클라이언트 관련된 내용에 대해 정리하면서 해당 기능을 탐구해보겠습니다. 

## 1. Declarative HTTP Client

> The Spring Framework lets you define an HTTP service as a Java interface with annotated methods for HTTP exchanges.

인터페이스 선언만으로 HTTP 통신을 수행할 수 있습니다. 
Openfeign에서 제공하는 기능과 상당히 유사하지만, 애너테이션만으로 빈(bean)을 생성하지 못 한다는 차이점이 있습니다. 
아래와 같은 클라이언트 빈 생성 과정이 필요합니다. 
WebClient 객체를 생성하고 어댑터(adapter)를 통해 내부적으로 연결합니다.

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

HTTP 클라이언트에 선언된 메소드는 다음과 같은 파라미터들을 지원합니다.

* URI
    * 동적으로 요청 URL을 변경할 수 있습니다.
    * 애너테이션에 적용된 URL 정보를 재정의(override)합니다.
* HttpMethod
    * 동적으로 요청 HTTP 메소드를 변경합니다.
    * 애너테이션에 적용된 HTTP 메소드를 재정의합니다.
* @RequestHeader
    * `Map<String, ?>`, `MultiValueMap<String, ?>`를 사용해 요청 헤더를 정의합니다.
* @PathVariable
    * 요청 URL에 정의된 플레이스홀더(placeholder) 변수에 값을 삽입합니다.
* @RequestBody
    * 요청 바디(body) 메시지로 사용할 데이터 객체를 직렬화합니다.
* @RequestParam
    * `Map<String, ?>`, `MultiValueMap<String, ?>`을 사용해 요청 파라미터를 정의합니다.
    * 컨텐츠 타입(content-type)이 `application/x-www-form-urlencoded`인 경우 요청 바디 메시지로 사용합니다.
* @RequestPart
    * 컨텐츠 타입이 `multipart/form-data`인 케이스에 필요한 데이터를 정의합니다. 
* @CookieValue
    * 요청에 사용할 쿠키를 추가합니다.

### 1.2. Return Values

HTTP 클라이언트에 선언된 메소드는 다음과 같은 응답들을 반환할 수 있습니다. 
블록킹 혹은 리액티브(reactive) 응답을 모두 지원합니다.

* `void`, `Mono<Void>`
* `HttpHeaders`, `Mono<HttpHeaders>`
* `<T>`, `Mono<T>`
* `<T>`, `Flux<T>`
* `ResponseEntity<Void>`, `Mono<ResponseEntity<Void>>`
* `ResponseEntity<T>`, `Mono<ResponseEntity<T>>`
* `Mono<ResponseEntity<Flux<T>>`

### 1.3 HTTP Method Support

HTTP 메소드를 다음과 같은 애너테이션들을 통해 지원합니다.

* @HttpExchange 
    * 루트 애너테이션으로 인터페이스 위에 선언합니다.
    * 기본(base) URL, 메소드, 컨텐츠 타입 등을 정의할 수 있습니다.
* @GetExchange 
    * HTTP GET 메소드를 지원하며 메소드 위에 선언합니다.
* @PostExchange 
    * HTTP POST 메소드를 지원하며 메소드 위에 선언합니다.
* @PutExchange 
    * HTTP PUT 메소드를 지원하며 메소드 위에 선언합니다.
* @PatchExchange 
    * HTTP PATCH 메소드를 지원하며 메소드 위에 선언합니다.
* @DelectExchange 
    * HTTP DELETE 메소드를 지원하며 메소드 위에 선언합니다.

## 2. Project Setup

간단한 예제 코드를 통해 사용 방법을 살펴보겠습니다. 
오픈 API 서버를 사용합니다.

* 개발한 로컬 서비스를 먼저 실행합니다.
* 터미널에서 cURL 커맨드로 로컬 서버에 API 요청을 수행합니다.
    * http://localhost:8080/sync/todos?page=0&limit=5
    * http://localhost:8080/async/todos?page=0&limit=5
    * http://localhost:8080/sync/pokemon?offset=0&limit=5
    * http://localhost:8080/async/pokemon?offset=0&limit=5
* 각 요청에 맞는 클라이언트를 사용해 각 API 서버로 요청을 재전달합니다. 
    * `JsonPlaceholderClient`는 Json Placeholder API 서버로 요청을 전달합니다.
    * `PokemonClient`는 Pokemon API 서버로 요청을 전달합니다.

<p align="center">
    <img src="/images/declarative-http-client-in-spring-boot-1.JPG" width="100%" class="image__border">
</p>

### 2.1. Packages

다음과 같은 프로젝트 구조를 가집니다. 

```
./
├── HELP.md
├── build.gradle
├── gradle
│   └── wrapper
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── gradlew
├── gradlew.bat
├── settings.gradle
└── src
    ├── main
    │   ├── java
    │   │   └── action
    │   │       └── in
    │   │           └── blog
    │   │               ├── ActionInBlogApplication.java
    │   │               ├── client
    │   │               │   ├── JsonPlaceholderClient.java
    │   │               │   └── PokemonClient.java
    │   │               ├── config
    │   │               │   ├── ExternalUrlConfig.java
    │   │               │   └── HttpClientConfig.java
    │   │               ├── controller
    │   │               │   └── DeclarativeController.java
    │   │               └── domain
    │   │                   ├── Pokemon.java
    │   │                   ├── PokemonPage.java
    │   │                   └── Todo.java
    │   └── resources
    │       ├── application.yml
    │       ├── static
    │       └── templates
    └── test
        └── java
            └── action
                └── in
                    └── blog
                        └── ActionInBlogApplicationTests.java
```

### 2.1. build.gradle

* spring-boot-starter-webflux 의존성이 필요합니다.
    * `WebClient`를 사용하기 때문에 리액티브 관련 의존성을 추가합니다.

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

### 2.2. application.yml

* 외부 API 서버 주소를 설정으로 관리합니다.

```yml
external-service:
  json-placeholder-url: https://jsonplaceholder.typicode.com
  pokemon-url: https://pokeapi.co
```

### 2.3. ExternalUrlConfig Class

* 설정으로 관리하는 외부 API 서버 주소 정보를 객체로 바인딩(binding)합니다.

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

### 2.4. HttpClientConfig Class

* `ExternalUrlConfig` 빈을 사용해 각 클라이언트에서 필요한 URL을 설정합니다.
    * PokemonClient - https://pokeapi.co
    * JsonPlaceholderClient - https://jsonplaceholder.typicode.com

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

`spring-boot-starter-web` 의존성을 함께 사용하면 동기, 비동기 관련 기능을 모두 테스트할 수 있습니다. 

### 3.1. JsonPlaceholderClient Interface

* List 반환 타입은 동기 처리를 수행합니다.
* Flux 반환 타입은 비동기 처리를 수행합니다. 

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

### 3.2. PokemonClient Interface

* PokemonPage 반환 타입은 동기 처리를 수행합니다.
* Mono 반환 타입은 비동기 처리를 수행합니다. 

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

### 3.3. DeclarativeController Class

* 각 요청 별로 적합한 클라이언트의 메소드에게 API 처리를 위임합니다.

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

### 3.4. Test cURL

cURL 명령어를 통해 API 요청을 수행합니다.

* JsonPlaceholder API 서버 동기식 요청

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
  {
    "userId": 1,
    "id": 2,
    "title": "quis ut nam facilis et officia qui",
    "completed": false
  },
  {
    "userId": 1,
    "id": 3,
    "title": "fugiat veniam minus",
    "completed": false
  },
  {
    "userId": 1,
    "id": 4,
    "title": "et porro tempora",
    "completed": true
  },
  {
    "userId": 1,
    "id": 5,
    "title": "laboriosam mollitia et enim quasi adipisci quia provident illum",
    "completed": false
  }
]
```

* JsonPlaceholder API 서버 비동기식 요청

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
  {
    "userId": 1,
    "id": 2,
    "title": "quis ut nam facilis et officia qui",
    "completed": false
  },
  {
    "userId": 1,
    "id": 3,
    "title": "fugiat veniam minus",
    "completed": false
  },
  {
    "userId": 1,
    "id": 4,
    "title": "et porro tempora",
    "completed": true
  },
  {
    "userId": 1,
    "id": 5,
    "title": "laboriosam mollitia et enim quasi adipisci quia provident illum",
    "completed": false
  }
]
```

* Pokemon API 서버 동기식 요청

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
    {
      "name": "ivysaur",
      "url": "https://pokeapi.co/api/v2/pokemon/2/"
    },
    {
      "name": "venusaur",
      "url": "https://pokeapi.co/api/v2/pokemon/3/"
    },
    {
      "name": "charmander",
      "url": "https://pokeapi.co/api/v2/pokemon/4/"
    },
    {
      "name": "charmeleon",
      "url": "https://pokeapi.co/api/v2/pokemon/5/"
    }
  ]
}
```

* Pokemon API 서버 비동기식 요청

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
    {
      "name": "ivysaur",
      "url": "https://pokeapi.co/api/v2/pokemon/2/"
    },
    {
      "name": "venusaur",
      "url": "https://pokeapi.co/api/v2/pokemon/3/"
    },
    {
      "name": "charmander",
      "url": "https://pokeapi.co/api/v2/pokemon/4/"
    },
    {
      "name": "charmeleon",
      "url": "https://pokeapi.co/api/v2/pokemon/5/"
    }
  ]
}
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-08-29-declarative-http-client-in-spring-boot>

#### REFERENCE

* <https://www.youtube.com/watch?v=FvDSL3pSKNQ>
* <https://docs.spring.io/spring-framework/reference/integration/rest-clients.html#rest-http-interface>
* <https://howtodoinjava.com/java/whats-new-spring-6-spring-boot-3/>
* <https://howtodoinjava.com/spring-webflux/http-declarative-http-client-httpexchange/>
* <https://www.baeldung.com/spring-6-http-interface>

[spring-cloud-openfeign-link]: https://junhyunny.github.io/spring-boot/spring-cloud/spring-cloud-openfeign/