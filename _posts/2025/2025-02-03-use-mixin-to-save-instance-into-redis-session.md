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

Caused by: java.lang.IllegalArgumentException: The class with java.util.UUID and name of java.util.UUID is not in the allowlist. If you believe this class is safe to deserialize, please provide an explicit mapping using Jackson annotations or by providing a Mixin. If the serialization is only done by a trusted source, you can also enable default typing. See https://github.com/spring-projects/spring-security/issues/4370 for details
    at org.springframework.security.jackson2.SecurityJackson2Modules$AllowlistTypeIdResolver.typeFromId(SecurityJackson2Modules.java:292) ~[spring-security-core-6.4.2.jar:6.4.2]
    at com.fasterxml.jackson.databind.jsontype.impl.TypeDeserializerBase._findDeserializer(TypeDeserializerBase.java:159) ~[jackson-databind-2.18.2.jar:2.18.2]
    at com.fasterxml.jackson.databind.jsontype.impl.AsArrayTypeDeserializer._deserialize(AsArrayTypeDeserializer.java:100) ~[jackson-databind-2.18.2.jar:2.18.2]
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

CustomAuthenticatedUser 클래스는 DefaultOidcUser 클래스를 상속한다. 스프링 시큐리티는 OIDC 인증과 인가 프로세스가 끝나고 만들어지는 OIDC 사용자 정보를 세션에 저장한다. 이 때 애플리케이션 비즈니스 로직에서 필요한 데이터를 함께 저장하고 비즈니스 로직에서 사용할 메소드를 추가하기 위해 커스텀 구현체 클래스를 만들었다. 위 코드는 예제에 불필요한 코드를 제외한 간소화 된 클래스다. 

<div align="center">
  <img src="/images/posts/2025/use-mixin-to-save-instance-into-redis-session-01.png" width="80%" class="image__border">
</div>

<br/>

코드를 봐서 알 수 있듯이 OidcUserInfo 객체 내부에 저장되는 UUID 타입 때문에 역직렬화 할 때 문제가 발생한다. 로그엔 UUID 타입에 대한 에러만 볼 수 있지만, UUID 문제를 해결하더라도 Address 클래스에 관련된 문제가 동일하게 발생한다. 두 타입으로 인해 발생하는 문제를 동시에 해결해줘야 한다.

```
org.springframework.data.redis.serializer.SerializationException: Could not read JSON:The class with action.in.blog.controller.Address and name of action.in.blog.controller.Address is not in the allowlist. If you believe this class is safe to deserialize, please provide an explicit mapping using Jackson annotations or by providing a Mixin. If the serialization is only done by a trusted source, you can also enable default typing. See https://github.com/spring-projects/spring-security/issues/4370 for details (through reference chain: action.in.blog.controller.CustomAuthenticatedUser["userInfo"]->org.springframework.security.oauth2.core.oidc.OidcUserInfo["claims"]) 
    at org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer.deserialize(GenericJackson2JsonRedisSerializer.java:312) ~[spring-data-redis-3.4.2.jar:3.4.2]
    at org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer.deserialize(GenericJackson2JsonRedisSerializer.java:282) ~[spring-data-redis-3.4.2.jar:3.4.2]
    at org.springframework.data.redis.core.AbstractOperations.deserializeHashValue(AbstractOperations.java:400) ~[spring-data-redis-3.4.2.jar:3.4.2]
    at org.springframework.data.redis.core.AbstractOperations.deserializeHashMap(AbstractOperations.java:344) ~[spring-data-redis-3.4.2.jar:3.4.2]
    ...

Caused by: java.lang.IllegalArgumentException: The class with action.in.blog.controller.Address and name of action.in.blog.controller.Address is not in the allowlist. If you believe this class is safe to deserialize, please provide an explicit mapping using Jackson annotations or by providing a Mixin. If the serialization is only done by a trusted source, you can also enable default typing. See https://github.com/spring-projects/spring-security/issues/4370 for details
    at org.springframework.security.jackson2.SecurityJackson2Modules$AllowlistTypeIdResolver.typeFromId(SecurityJackson2Modules.java:292) ~[spring-security-core-6.4.2.jar:6.4.2]
    at com.fasterxml.jackson.databind.jsontype.impl.TypeDeserializerBase._findDeserializer(TypeDeserializerBase.java:159) ~[jackson-databind-2.18.2.jar:2.18.2]
    at com.fasterxml.jackson.databind.jsontype.impl.AsPropertyTypeDeserializer._deserializeTypedForId(AsPropertyTypeDeserializer.java:151) ~[jackson-databind-2.18.2.jar:2.18.2]
    at com.fasterxml.jackson.databind.jsontype.impl.AsPropertyTypeDeserializer.deserializeTypedFromObject(AsPropertyTypeDeserializer.java:136) ~[jackson-databind-2.18.2.jar:2.18.2]
    ...
```

## 2. Solve the problem

에러 로그에서 볼 수 있듯이 ObjectMapper 객체의 기본 타입 직렬화 여부를 활성화하거나 믹스인(mixin)을 만들면 해결할 수 있다. 나는 믹스인을 만들어 이 문제를 해결했다. Jackson 믹스인은 기존 클래스 코드를 수정하지 않고도 Jackson 직렬화/역직렬화 방식을 제어할 수 있는 방식이다. 주로 외부 라이브러리 클래스나 수정할 수 없는 클래스에 커스텀 JSON 직렬화 로직을 적용할 때 사용한다. 아래 코드를 보면 직관적으로 믹스인의 기능을 이해할 수 있다.

```kotlin
package action.`in`.blog.config

import action.`in`.blog.controller.Address
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.databind.ObjectMapper

@JsonTypeInfo(use = JsonTypeInfo.Id.CLASS, include = JsonTypeInfo.As.PROPERTY)
class CustomMixin

fun main() {
    
    println(
        ObjectMapper()
            .writeValueAsString(
                Address("Seoul", "000001")
            )
    ) // {"city":"Seoul","zipcode":"000001"}

    println(
        ObjectMapper()
            .addMixIn(Address::class.java, CustomMixin::class.java)
            .writeValueAsString(
            Address("Seoul", "000001")
        )
    ) // {"@class":"action.in.blog.controller.Address","city":"Seoul","zipcode":"000001"}
}
```

우선 커스텀 믹스인을 만들기 전에 기존 코드를 살펴보자. 기존 코드는 세션에 객체를 저장할 때 필요한 직렬화, 역직렬화를 수행하는 GenericJackson2JsonRedisSerializer 객체를 만들어 사용하고 있다.

1. GenericJackson2JsonRedisSerializer 객체는 클래스 정보까지 함께 직렬화하기 때문에 객체를 역직렬화 할 때 캐스팅(casting) 등의 문제가 발생하지 않는다. 하지만 GenericJackson2JsonRedisSerializer 객체 내부에서 사용할 ObjectMapper 객체를 외부에서 설정하는 경우 클래스 정보가 함께 직렬화되지 않기 때문에 별도 설정이 필요하다.
2. SecurityJackson2Modules 클래스는 스프링 시큐리티에서 사용하는 클래스들 중 JSON 객체로 직렬화가 필요한 클래스들만 대상으로 믹스인이 설정된 Jackson 모듈을 제공한다.

```kotlin
package action.`in`.blog.config

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer
import org.springframework.data.redis.serializer.RedisSerializer
import org.springframework.security.jackson2.SecurityJackson2Modules

@Configuration
class RedisSessionConfig {
    @Bean
    fun springSessionDefaultRedisSerializer(): RedisSerializer<Any> = GenericJackson2JsonRedisSerializer(objectMapper()) // 1

    fun objectMapper(): ObjectMapper {
        val objectMapper = ObjectMapper()
        val modules = SecurityJackson2Modules.getModules(javaClass.classLoader) // 2
        objectMapper.registerModules(modules)
        return objectMapper
    }
}
```

이 코드에 UUID, Address 객체 타입의 역직렬화 처리를 위한 믹스인을 만들어 설정한다. 세션에 저장된 데이터를 보면 이미 UUID, Address 타입 정보를 함께 직렬화하고 있기 때문에 별도의 Json 타입 관련된 애너테이션은 필요 없다. 단순히 역직렬화 허용 타입으로 인식되도록 믹스인만 설정하면 된다.

1. 믹스인 클래스를 정의한다.
2. 각 타입 클래스와 믹스인 클래스를 매칭하여 등록한다.

```kotlin
package action.`in`.blog.config

import action.`in`.blog.controller.Address
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer
import org.springframework.data.redis.serializer.RedisSerializer
import org.springframework.security.jackson2.SecurityJackson2Modules
import java.util.*

class CustomAppMixin // 1

@Configuration
class RedisSessionConfig {
    @Bean
    fun springSessionDefaultRedisSerializer(): RedisSerializer<Any> = GenericJackson2JsonRedisSerializer(objectMapper())

    fun objectMapper(): ObjectMapper {
        val objectMapper = ObjectMapper()
        val modules = SecurityJackson2Modules.getModules(javaClass.classLoader)
        objectMapper.registerModules(modules)
        objectMapper.addMixIn(UUID::class.java, CustomAppMixin::class.java) // 2
        objectMapper.addMixIn(Address::class.java, CustomAppMixin::class.java)
        return objectMapper
    }
}
```

간단한 엔드포인트를 만들어 직렬화를 통해 세션에 데이터를 정상적으로 저장하고, 역직렬화를 통해 데이터를 꺼낼 수 있는지 확인해보자.

```kotlin
@RestController
class SessionController {

    @GetMapping("/foo")
    fun foo(request: HttpServletRequest) {
        request.session.setAttribute(
            "USER",
            CustomAuthenticatedUser(
                setOf(SimpleGrantedAuthority("ROLE_ADMIN")),
                OidcIdToken(
                    "access-token",
                    Instant.now(),
                    Instant.now().plusSeconds(36000),
                    mapOf(
                        "sub" to "a1ca1319-01f2-49d4-b5e8-899c64d49f63",
                    ),
                ),
                OidcUserInfo(
                    mapOf(
                        "id" to UUID.fromString("a1ca1319-01f2-49d4-b5e8-899c64d49f63"),
                        "addressDetails" to Address("Seoul", "010101")
                    ),
                )
            )
        )
    }

    @GetMapping("/bar")
    fun bar(request: HttpServletRequest): CustomAuthenticatedUser {
        return request.session.getAttribute(
            "USER"
        ) as CustomAuthenticatedUser
    }
}
```

세션에 데이터를 저장하는 cURL 커맨드는 다음과 같다.

```
$ curl -v localhost:8080/foo

* Host localhost:8080 was resolved.
* IPv6: ::1
* IPv4: 127.0.0.1
*   Trying [::1]:8080...
* Connected to localhost (::1) port 8080
> GET /foo HTTP/1.1
> Host: localhost:8080
> User-Agent: curl/8.7.1
> Accept: */*
> 
* Request completely sent off
< HTTP/1.1 200 
< X-Content-Type-Options: nosniff
< X-XSS-Protection: 0
< Cache-Control: no-cache, no-store, max-age=0, must-revalidate
< Pragma: no-cache
< Expires: 0
< X-Frame-Options: DENY
< Set-Cookie: SESSION=ZjE2YzY3OTItNjk1NS00ZjZiLWJlN2UtYzRkMzAxYTMyODE5; Path=/; HttpOnly; SameSite=Lax
< Content-Length: 0
< Date: Mon, 03 Feb 2025 12:50:45 GMT
```

세션에 데이터를 꺼내는 cURL 커맨드는 다음과 같다.

```
$ curl -v -H 'Cookie: SESSION=ZjE2YzY3OTItNjk1NS00ZjZiLWJlN2UtYzRkMzAxYTMyODE5;' localhost:8080/bar       

* Host localhost:8080 was resolved.
* IPv6: ::1
* IPv4: 127.0.0.1
*   Trying [::1]:8080...
* Connected to localhost (::1) port 8080
> GET /bar HTTP/1.1
> Host: localhost:8080
> User-Agent: curl/8.7.1
> Accept: */*
> Cookie: SESSION=ZjE2YzY3OTItNjk1NS00ZjZiLWJlN2UtYzRkMzAxYTMyODE5;
> 
* Request completely sent off
< HTTP/1.1 200 
< X-Content-Type-Options: nosniff
< X-XSS-Protection: 0
< Cache-Control: no-cache, no-store, max-age=0, must-revalidate
< Pragma: no-cache
< Expires: 0
< X-Frame-Options: DENY
< Content-Type: application/json
< Transfer-Encoding: chunked
< Date: Mon, 03 Feb 2025 12:51:26 GMT
< 
* Connection #0 to host localhost left intact

{"authorities":[{"authority":"ROLE_ADMIN"}],"idToken":{"tokenValue":"access-token","issuedAt":"2025-02-03T12:50:45.490540Z","expiresAt":"2025-02-03T22:50:45.490541Z","claims":{"sub":"a1ca1319-01f2-49d4-b5e8-899c64d49f63"},"subject":"a1ca1319-01f2-49d4-b5e8-899c64d49f63","authenticationContextClass":null,"authenticationMethods":null,"authorizationCodeHash":null,"issuer":null,"audience":null,"nonce":null,"authenticatedAt":null,"authorizedParty":null,"accessTokenHash":null,"address":{"formatted":null,"streetAddress":null,"locality":null,"region":null,"postalCode":null,"country":null},"locale":null,"zoneInfo":null,"fullName":null,"givenName":null,"familyName":null,"middleName":null,"nickName":null,"picture":null,"website":null,"email":null,"gender":null,"birthdate":null,"phoneNumber":null,"updatedAt":null,"profile":null,"preferredUsername":null,"emailVerified":null,"phoneNumberVerified":null},"userInfo":{"claims":{"id":"a1ca1319-01f2-49d4-b5e8-899c64d49f63","addressDetails":{"city":"Seoul","zipcode":"010101"}},"subject":null,"address":{"formatted":null,"streetAddress":null,"locality":null,"region":null,"postalCode":null,"country":null},"locale":null,"zoneInfo":null,"fullName":null,"givenName":null,"familyName":null,"middleName":null,"nickName":null,"picture":null,"website":null,"email":null,"gender":null,"birthdate":null,"phoneNumber":null,"updatedAt":null,"profile":null,"preferredUsername":null,"emailVerified":null,"phoneNumberVerified":null},"attributes":{"sub":"sub","addressDetails":{"city":"Seoul","zipcode":"000000"},"id":"1e1a10d8-3b75-4ba7-83ff-330ca994f748"},"claims":{"sub":"sub","addressDetails":{"city":"Seoul","zipcode":"000000"},"id":"1e1a10d8-3b75-4ba7-83ff-330ca994f748"},"name":"sub","subject":"sub","authenticationContextClass":null,"authenticationMethods":null,"authorizationCodeHash":null,"issuer":null,"audience":null,"issuedAt":null,"expiresAt":null,"nonce":null,"authenticatedAt":null,"authorizedParty":null,"accessTokenHash":null,"address":{"formatted":null,"streetAddress":null,"locality":null,"region":null,"postalCode":null,"country":null},"locale":null,"zoneInfo":null,"fullName":null,"givenName":null,"familyName":null,"middleName":null,"nickName":null,"picture":null,"website":null,"email":null,"gender":null,"birthdate":null,"phoneNumber":null,"updatedAt":null,"profile":null,"preferredUsername":null,"emailVerified":null,"phoneNumberVerified":null}%   
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2025-02-03-use-mixin-to-save-instance-into-redis-session>

#### REFERENCE

- <https://github.com/spring-projects/spring-security/issues/4370>

[object-mapper-active-default-type-error-link]: https://junhyunny.github.io/spring-boot/redis/session/object-mapper-active-default-type-error/