---
title: "Use mixin to save instance into redis session in Spring Security"
search: false
category:
  - spring-boot
  - spring-security
  - redis
  - session
last_modified_at: 2025-02-03T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Problem to serialize instance with class info in Kotlin ObjectMapper][object-mapper-active-default-type-error-link]

## 0. 들어가면서

스프링 시큐리티(spring security)과 스프링 레디스 세션(spring redis session)을 사용할 때 발생한 문제에 대해 정리한다.

## 1. Problem context

로그인 한 사용자 정보가 담긴 SecurityContext 객체를 세션에 저장 후 역직렬화(deserialize) 할 때 아래와 같은 에러가 발생했다.

```
org.springframework.data.redis.serializer.SerializationException: Could not read JSON:The class with java.util.UUID and name of java.util.UUID is not in the allowlist. If you believe this class is safe to deserialize, please provide an explicit mapping using Jackson annotations or by providing a Mixin. If the serialization is only done by a trusted source, you can also enable default typing. See https://github.com/spring-projects/spring-security/issues/4370 for details (through reference chain: action.in.blog.controller.CustomAuthenticatedUser["userInfo"]->org.springframework.security.oauth2.core.oidc.OidcUserInfo["claims"]) 
	at org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer.deserialize(GenericJackson2JsonRedisSerializer.java:312) ~[spring-data-redis-3.4.2.jar:3.4.2]
	at org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer.deserialize(GenericJackson2JsonRedisSerializer.java:282) ~[spring-data-redis-3.4.2.jar:3.4.2]
	at org.springframework.data.redis.core.AbstractOperations.deserializeHashValue(AbstractOperations.java:400) ~[spring-data-redis-3.4.2.jar:3.4.2]
  ...
```

에러의 요지는 UUID 타입은 역직렬화 허가 리스트에 포함되지 않으니 역직렬화 해도 괜찮은 안전한 클래스라면 `Jackson 애너테이션`이나 `Mixin`을 만들어 명시적인 매핑을 제공해야 한다는 말이다. 직렬화가 신뢰할 수 있는 소스에 의해서만 수행되는 경우 기본 타입을 활성화 해도 된다고 한다. 지금 사용 중인 GenericJackson2JsonRedisSerializer 직렬화 기능은 내부적으로 ObjectMapper 객체를 사용한다. ObjectMapper 기본 타입 활성화에 관련된 내용은 [이 글][object-mapper-active-default-type-error-link]을 참고하면 된다.

문제를 해결하기 전에 세션에 저장되는 객체 구조를 살펴보자.

```kotlin
data class Address(
    val city: String,
    val zipcode: String,
) {
    constructor() : this("", "")
}

class CustomAuthenticatedUser(
    authorities: Collection<GrantedAuthority>,
    idToken: OidcIdToken,
    userInfo: OidcUserInfo,
) : DefaultOidcUser(authorities, idToken, userInfo) {
    constructor() : this(
        emptySet(),
        OidcIdToken(
            "token",
            Instant.now(),
            Instant.now().plusSeconds(1000),
            mapOf("sub" to "sub")
        ),
        OidcUserInfo(
            mapOf(
                "id" to UUID.randomUUID(),
                "addressDetails" to Address("Seoul", "000000")
            )
        ),
    )
}
```



## 2. Solve the problem

나는 기본 타입 직렬화를 활성화 하지 않고, 믹스인을 만들어 처리했다.


## CLOSING

#### TEST CODE REPOSITORY

#### RECOMMEND NEXT POSTS

#### REFERENCE

- <https://github.com/spring-projects/spring-security/issues/4370>

[object-mapper-active-default-type-error-link]: https://junhyunny.github.io/spring-boot/redis/session/object-mapper-active-default-type-error/