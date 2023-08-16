---
title: "JPA Entity Serialize Exception with Redis Session"
search: false
category:
  - kotlin
  - spring-boot
  - jpa
last_modified_at: 2023-08-15T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Spring Session with Redis][spring-session-with-redis-link]
* [TestContainer for Database][test-container-for-database-link]

## 1. Problem Context

레디스(redis)를 위한 스프링 세션(spring session)을 사용하는 중 아래 로그처럼 엔티티(entity)를 직렬화(serialize)할 수 없다는 에러를 만났습니다. 

```
org.springframework.data.redis.serializer.SerializationException: Cannot serialize
	at org.springframework.data.redis.serializer.JdkSerializationRedisSerializer.serialize(JdkSerializationRedisSerializer.java:96) ~[spring-data-redis-3.0.6.jar!/:3.0.6]
	at org.springframework.data.redis.core.AbstractOperations.rawHashValue(AbstractOperations.java:186) ~[spring-data-redis-3.0.6.jar!/:3.0.6]
	at org.springframework.data.redis.core.DefaultHashOperations.putAll(DefaultHashOperations.java:161) ~[spring-data-redis-3.0.6.jar!/:3.0.6]
	at org.springframework.session.data.redis.RedisSessionRepository$RedisSession.saveDelta(RedisSessionRepository.java:298) ~[spring-session-data-redis-3.0.1.jar!/:3.0.1]
	at org.springframework.session.data.redis.RedisSessionRepository$RedisSession.save(RedisSessionRepository.java:276) ~[spring-session-data-redis-3.0.1.jar!/:3.0.1]
  	...
Caused by: org.springframework.core.serializer.support.SerializationFailedException: Failed to serialize object using DefaultSerializer
	at org.springframework.core.serializer.support.SerializingConverter.convert(SerializingConverter.java:64) ~[spring-core-6.0.9.jar!/:6.0.9]
	at org.springframework.core.serializer.support.SerializingConverter.convert(SerializingConverter.java:33) ~[spring-core-6.0.9.jar!/:6.0.9]
	at org.springframework.data.redis.serializer.JdkSerializationRedisSerializer.serialize(JdkSerializationRedisSerializer.java:94) ~[spring-data-redis-3.0.6.jar!/:3.0.6]
	... 37 common frames omitted
Caused by: java.io.NotSerializableException: action.in.blog.domain.entity.UserEntity
	at java.base/java.io.ObjectOutputStream.writeObject0(Unknown Source) ~[na:na]
	at java.base/java.io.ObjectOutputStream.writeObject(Unknown Source) ~[na:na]
  	...
```

위 예외가 왜 발생했는지 알아보고 이를 해결한 방법에 대해 정리해보았습니다. 
프로젝트 개발 환경은 다음과 같습니다. 

* 코틀린 based on JDK 17
* 스프링 부트 3.0.7 버전
* 문제가 발생한 의존성
    * spring-boot-starter-data-jpa
    * spring-boot-starter-data-redis

문제가 발생한 상황은 다음과 같습니다. 

1. 사용자 정보를 데이터베이스에서 조회한다.
1. 사용자 정보 엔티티를 POJO 객체로 변환한 후 세션에 저장한다.
1. 요청에 대한 응답을 커밋하는 시점에 세션에 데이터를 저장하게 되는데 객체를 직렬화하는 과정에서 예외가 발생한다.

<p align="center">
    <img src="/images/jpa-entity-serialize-exception-with-redis-session-1.JPG" width="100%" class="image__border">
</p>

### 1.1. UserController Class

실제 프로덕트 코드를 사용할 수 없으므로 일부 각색하여 작성하였습니다. 
먼저 컨트롤러 클래스를 살펴보겠습니다.

* 사용자 정보가 담긴 User 객체를 세션에 저장합니다.

```kotlin
package action.`in`.blog.controller

import action.`in`.blog.service.UserService
import jakarta.servlet.http.HttpServletRequest
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RestController

@RestController
class UserController(
    private val userService: UserService
) {

    private val sessionKeyUser: String = "SESSION_KEY_USER"

    @GetMapping("/users/{id}")
    fun users(
        servletRequest: HttpServletRequest,
        @PathVariable("id") id: Long
    ) {
        val user = userService.getUser(id)
        val session = servletRequest.getSession(true)
        session.setAttribute(sessionKeyUser, user)
    }
}
```

### 1.2. DefaultUserService Class

* JpaRepository 객체를 사용해 사용자 정보를 조회합니다.
* User 클래스를 사용해 엔티티를 DTO 객체로 변환합니다.

```kotlin
package action.`in`.blog.service

import action.`in`.blog.domain.dto.User
import action.`in`.blog.repository.UserRepository
import org.springframework.stereotype.Service

interface UserService {
    fun getUser(id: Long): User
}

@Service
class DefaultUserService(
    private val userRepository: UserRepository
) : UserService {
    
    override fun getUser(id: Long): User {
        val userEntity = userRepository.findById(id).orElseThrow()
        return User.of(userEntity)
    }
}
```

### 1.3. UserEntity Class

* @ElementCollection, @CollectionTable 애너테이션을 사용합니다.
	* 좋아하는 포스트(post) 아이디들을 컬렉션으로 저장합니다.
* 해당 컬렉션을 저장하기 위한 별도 테이블이 생성됩니다.
	* 테이블 이름은 `tb_favorite_posts` 입니다. 

```kotlin
package action.`in`.blog.domain.entity

import jakarta.persistence.*

@Entity
@Table(name = "tb_user")
class UserEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0L,
    val name: String,
    @ElementCollection
    @CollectionTable(name = "tb_favorite_posts")
    val favoritePosts: MutableList<Long>
)
```

### 1.4. User Class

* 정적 팩토리 메소드 패턴을 사용한 of 메소드를 사용해 User DTO 객체를 생성합니다.
* 엔티티의 프로퍼티 값들을 참조 복사합니다.

```kotlin
package action.`in`.blog.domain.dto

import action.`in`.blog.domain.entity.UserEntity
import java.io.Serializable

data class User(
    val id: Long,
    val name: String,
    val favoritePosts: List<Long>
) : Serializable {

    companion object {

        private const val serialVersionUID: Long = 1L

        fun of(userEntity: UserEntity): User {
            return User(
                id = userEntity.id,
                name = userEntity.name,
                favoritePosts = userEntity.favoritePosts
            )
        }
    }
}
```

### 1.5. Test

문제를 유발하는 코드들은 모두 살펴봤으므로 테스트 코드를 통해 동일한 문제가 발생하는지 살펴보겠습니다.  

* 실제 동작 환경과 최대한 유사하도록 레디스 테스트 컨테이너를 사용합니다.
	* 레디스 컨테이너를 실행한 후 스프링 세션에서 찾을 수 있도록 어플리케이션 프로퍼티를 변경합니다.
* setup 메소드에서 필요한 사용자 데이터를 저장합니다.
* 세션에 데이터를 저장하는 경로로 API 요청을 수행하고 정상 응답을 기대합니다. 

```kotlin
package action.`in`.blog.controller

import action.`in`.blog.domain.entity.UserEntity
import action.`in`.blog.repository.UserRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.testcontainers.containers.GenericContainer
import org.testcontainers.junit.jupiter.Testcontainers

@Testcontainers
@AutoConfigureMockMvc
@SpringBootTest(
    properties = [
        "spring.datasource.url=jdbc:h2:mem:test",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa"
    ]
)
class RestControllerIT {

    private final val redis = GenericContainer("redis:5.0.3-alpine")
        .withExposedPorts(6379)

    init {
        redis.start()
        System.setProperty("spring.data.redis.host", redis.host)
        System.setProperty("spring.data.redis.port", redis.getMappedPort(6379).toString())
    }

    @Autowired
    lateinit var userRepository: UserRepository

    @Autowired
    lateinit var sut: MockMvc

    @BeforeEach
    fun setup() {
        userRepository.save(
            UserEntity(
                name = "Junhyunny",
                favoritePosts = mutableListOf(1L, 2L)
            )
        )
    }

    @Test
    fun saveUserEntityInSession() {

        sut.perform(get("/users/1"))
            .andExpect(status().isOk)
    }
}
```

##### Test Result

테스트 코드를 살행하면 다음과 같은 에러 로그를 확인할 수 있습니다.

* 이전에 확인한 로그와 마찬가지로 엔티티 객체를 직렬화하는 과정에서 에러가 발생합니다.

```
01:24:55.120 [Test worker] INFO  action.in.blog.controller.RestControllerIT - Started RestControllerIT in 3.073 seconds (process running for 5.694)

org.springframework.data.redis.serializer.SerializationException: Cannot serialize
	at org.springframework.data.redis.serializer.JdkSerializationRedisSerializer.serialize(JdkSerializationRedisSerializer.java:96)
	at org.springframework.data.redis.core.AbstractOperations.rawHashValue(AbstractOperations.java:186)
	at org.springframework.data.redis.core.DefaultHashOperations.putAll(DefaultHashOperations.java:161)
	at org.springframework.session.data.redis.RedisSessionRepository$RedisSession.saveDelta(RedisSessionRepository.java:298)
	at org.springframework.session.data.redis.RedisSessionRepository$RedisSession.save(RedisSessionRepository.java:276)
	...
Caused by: org.springframework.core.serializer.support.SerializationFailedException: Failed to serialize object using DefaultSerializer
	at org.springframework.core.serializer.support.SerializingConverter.convert(SerializingConverter.java:64)
	at org.springframework.core.serializer.support.SerializingConverter.convert(SerializingConverter.java:33)
	at org.springframework.data.redis.serializer.JdkSerializationRedisSerializer.serialize(JdkSerializationRedisSerializer.java:94)
	... 101 more
Caused by: java.io.NotSerializableException: action.in.blog.domain.entity.UserEntity
	at java.base/java.io.ObjectOutputStream.writeObject0(ObjectOutputStream.java:1187)
	at java.base/java.io.ObjectOutputStream.defaultWriteFields(ObjectOutputStream.java:1572)
```

## 2. Cause

문제의 원인은 살펴보겠습니다. 
UserEntity 객체를 User 객체로 변환하는 과정에서 객체에 대한 참조 값 복사만 이뤄집니다. 
여기서 favoritePosts 변수가 참조하는 객체가 일반적인 리스트가 아닌 `PersistentBag`이라는 객체이기 때문에 직렬화 문제가 발생합니다. 

```kotlin
    fun of(userEntity: UserEntity): User {
        return User(
            id = userEntity.id, // 값 복사
            name = userEntity.name, // 참조 값 복사
            favoritePosts = userEntity.favoritePosts // 참조 값 복사
        )
    }
```

<p align="center">
    <img src="/images/jpa-entity-serialize-exception-with-redis-session-2.JPG" width="80%" class="image__border image__padding">
</p>

### 2.1. Serialize Target

PersistentBag 객체가 직렬화되면 다음과 같은 현상이 발생합니다. 

* PersistentBag 객체은 owner 객체를 가지고 있습니다. 
	* owner 객체는 UserEntity 객체입니다.
* owner 객체까지 직렬화 대상이 됩니다.
	* UserEntity 객체가 참조하는 다른 객체들도 모두 직렬화 대상입니다. 

<p align="center">
    <img src="/images/jpa-entity-serialize-exception-with-redis-session-3.JPG" width="80%" class="image__border image__padding">
</p>

## 3. Solve the problem

문제를 해결하는 방법은 두 가지 존재합니다. 
두 번째 방법을 사용해 이 문제를 해결하였습니다.

1. UserEntity 클래스가 Serializable 인터페이스를 상속받는다.
    * 첫 번째 방법인 UserEntity 클래스가 Serializable 인터페이스를 구현하는 방법은 임시 방편입니다. 
    * UserEntity 클래스 내부에 다른 엔티티들에 대한 참조 필드가 추가되는 경우 다른 엔티티들도 직렬화 에러를 겪게 됩니다. 
1. User 객체로 변환할 때 favoritePosts 리스트에 대한 참조 값 복사를 값 복사로 변경한다. 
    * ArrayList 생성자를 통해 값을 복사한 새로운 리스트 객체를 할당합니다.

```kotlin
package action.`in`.blog.domain.dto

import action.`in`.blog.domain.entity.UserEntity
import org.hibernate.collection.spi.PersistentBag
import java.io.Serializable

data class User(
    val id: Long,
    val name: String,
    val favoritePosts: List<Long>
) : Serializable {

    companion object {

        private const val serialVersionUID: Long = 1L

        fun of(userEntity: UserEntity): User {
            return User(
                id = userEntity.id,
                name = userEntity.name,
                // favoritePosts = userEntity.favoritePosts // Serializable 에러
                favoritePosts = ArrayList(userEntity.favoritePosts) // 정상
            )
        }
    }
}
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-08-15-jpa-entity-serialize-exception-with-redis-session>

#### REFERENCE

* <https://www.baeldung.com/spring-boot-redis-testcontainers>

[spring-session-with-redis-link]: https://junhyunny.github.io/information/spring-boot/redis/spring-session-with-redis/
[test-container-for-database-link]: https://junhyunny.github.io/post-format/test-container-for-database/