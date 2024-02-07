---
title: "Timezone Problem of JVM Application"
search: false
category:
  - java
  - timezone
last_modified_at: 2024-02-07T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [GMT and UTC][gmt-and-utc-link]
- [Handling Timezone on JavaScript][handling-timezone-on-javascript-link]

## 0. 들어가면서

이전 프로젝트에서 타임존(timezone) 관련 도메인을 다뤄본 경험 덕분인지 이번에 발생한 타임존 문제를 한 눈에 파악했다. 당시에 리서치하면서 읽었던 글 내용이 생각나 해결 방법도 금새 찾아냈다. 이번 글은 JVM 애플리케이션에서 발생한 타임존 문제를 해결한 내용을 다뤘다. 비즈니스 로직에서 발생한 문제를 단순하게 각색한 내용을 바탕으로 설명하였다. 타임존 도메인에 관련된 내용이 생소하다면 이전 추천 글들을 참고하길 바란다. 

## 1. Problem

현재 개발 중인 애플리케이션은 현재 시각을 기준으로 예측 시간을 시뮬레이션하는 기능이 많다. 현재 시간을 기준으로 계산되는 식이 여러 개 생겼다. 간단하게 다음과 같은 비즈니스 요건 사항이 있다고 가정해보자.

- 데이터가 생성된 시점이 현재 기준으로 얼마나 흘렀는지 알고 싶다.

해당 요건 사항을 처리하기 위해 다음과 같은 비즈니스 로직이 추가되었다. 

- elapsedMessage 메소드
  - 현재 시각 타임스탬프(timestamp) 값에서 데이터가 생성된 시각 타임스탬프 값을 뺀다. 
  - 타임스탬프 값 차이를 분(minute)으로 환산해 시간이 얼마나 경과했는지 보여주는 메시지를 만든다.
- of 메소드
  - 엔티티(entity) 객체를 DTO(data transfer object) 객체로 변경한다.

```kotlin
package blog.`in`.action.domain

import org.slf4j.LoggerFactory
import java.sql.Timestamp
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.*

data class Todo(
    val id: Long = 0,
    val title: String = "",
    val content: String = "",
    val elapsedMessage: String = ""
) {
    companion object {
        private val logger = LoggerFactory.getLogger(Todo::class.java)

        private fun elapsedMessage(localDateTime: LocalDateTime): String {
            val second = 1000
            val currentTimestamp = System.currentTimeMillis()
            val createdAtTimestamp = Timestamp.valueOf(localDateTime).time
            val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")
            val message = "(${(currentTimestamp - createdAtTimestamp) / 60 / second}분 경과)"
            return "${formatter.format(localDateTime)}$message"
        }

        fun of(entity: TodoEntity): Todo {
            logger.info("Timezone - {}", TimeZone.getDefault())
            logger.info("Data created time - {}", entity.createdAt)
            logger.info("JVM application current time - {}", LocalDateTime.now())
            return Todo(
                entity.id,
                entity.title,
                entity.content,
                elapsedMessage(entity.createdAt)
            )
        }
    }
}
```

현재 데이터베이스엔 다음과 같은 데이터가 존재한다.

```sql
insert into tb_todo (title, content, created_at)
values ('hello world', 'this is first todo', '2024-02-07 22:00:00');
```

### 1.1. In Local Environment 

IDE(Integrate Development Environment) 도구에서 애플리케이션을 실행 후 해당 API 경로로 요청을 보내면 다음과 같은 응답을 받는다. 

- 정상적으로 44분이 경과되었다는 메시지를 볼 수 있다.

```
$ curl localhost:8080/todos

[{"id":1,"title":"hello world","content":"this is first todo","elapsedMessage":"2024-02-07 22:00(44분 경과)"}]
```

애플리케이션 로그를 살펴보면 다음과 같은 내용을 확인할 수 있다.

- 애플리케이션 타임존은 `Asia/Seoul`이다.
- 데이터 생성 시각은 24년 2월 6일 6시 정각이다.
- 현재 시간은 24년 2월 5일 6시 48분이다.

```
2024-02-07T22:44:36.359+09:00  INFO 36788 --- [nio-8080-exec-1] blog.in.action.domain.Todo               : Timezone - sun.util.calendar.ZoneInfo[id="Asia/Seoul",offset=32400000,dstSavings=0,useDaylight=false,transitions=30,lastRule=null]
2024-02-07T22:44:36.359+09:00  INFO 36788 --- [nio-8080-exec-1] blog.in.action.domain.Todo               : Data created time - 2024-02-07T22:00
2024-02-07T22:44:36.359+09:00  INFO 36788 --- [nio-8080-exec-1] blog.in.action.domain.Todo               : JVM application current time - 2024-02-07T22:44:36.359278
```

### 1.2. In Docker Environment

현재 개발 중인 애플리케이션은 컨테이너(container)에 감싸져 AWS 클라우드 환경에 배포된다. 배포 환경과 동일하게 해당 애플리케이션을 컨테이너 환경에서 실행시킨 후 API 요청을 보내보자. 컨테이너 이미지는 이미 만드는 작업은 생략한다. 예제 코드 레포지토리를 보면 이미지를 만들기 위한 도커 파일(Dockerfile)이 존재하므로 이를 참고하길 바란다. 

애플리케이션 컨테이너로 요청을 보내면 다음과 같은 응답을 받는다. 

- 비정상적으로 -480분이 경과되었다는 메시지를 볼 수 있다.

```
$ curl localhost:8080/todos

[{"id":1,"title":"hello world","content":"this is first todo","elapsedMessage":"2024-02-07 22:00(-490분 경과)"}]
```

애플리케이션 로그를 살펴보면 다음과 같은 내용을 확인할 수 있다.

- 애플리케이션 타임존은 `Etc/UTC`이다.
- 데이터 생성 시각은 24년 2월 6일 6시 정각이다.
- 현재 시간은 24년 2월 5일 21시 59분이다.

```
2024-02-07T13:49:05.731Z  INFO 7 --- [nio-8080-exec-1] blog.in.action.domain.Todo               : Timezone - sun.util.calendar.ZoneInfo[id="Etc/UTC",offset=0,dstSavings=0,useDaylight=false,transitions=0,lastRule=null]
2024-02-07T13:49:05.732Z  INFO 7 --- [nio-8080-exec-1] blog.in.action.domain.Todo               : Data created time - 2024-02-07T22:00
2024-02-07T13:49:05.732Z  INFO 7 --- [nio-8080-exec-1] blog.in.action.domain.Todo               : JVM application current time - 2024-02-07T13:49:05.732482702
```

## 2. Solve the problem

JVM 애플리케이션은 기본적으로 호스트 PC의 타임존을 사용한다. 운영 체제마다 다르겠지만, 리눅스 환경에서 JVM 애플리케이션이 타임존 정보를 사용하는 과정은 다음과 같다.

1. TZ 환경 변수에 값이 설정되어 있다면 시스템 기본 타임존 정보를 오버라이드한다.
2. -Duser.timezone JVM 옵션 설정이 되어있다면 TZ 환경 변수 값을 오버라이드한다.
3. Timezone 클래스의 setDefault 메소드를 통해 -Duser.timezone 설정 값을 오버라이드한다.

다시 정리하면 JVM 타임존 우선 순위는 다음과 같다.

> Timezone 클래스 > -Duser.timezone 설정 > TZ 환경 변수 > 시스템 기본 타임존 정보

타임존이 `Asia/Seoul` 값으로 지정되어 있는 필자의 컴퓨터 IDE에서 애플리케이션을 실행하면 정상적으로 동작하고, 격리된 환경을 제공하는 컨테이너 환경에서 실행했을 때 이상하게 동작한 이유는 시스템 기본 타임존 정보가 다르기 때문이다. 몇 가지 해결 방법들을 알아보자. 

### 3.1. Setup Timezone in Code

온-프레미스(on-premise)에서 서버에 직접 애플리케이션을 배포한다면 가장 쉽게 애플리케이션 타임존을 변경할 수 있는 방법이다. 필자는 격리된 네트워크 환경을 가진 온-프레미스 서버에 애플리케이션을 배포하는 상황이었기 때문에 이 방법을 사용했다. 다음과 같이 코드를 수정하고 도커 컨테이너를 다시 빌드 후 실행하면 정상적으로 동작한다.

- 스프링 부트 애플리케이션을 실행할 때 System 클래스를 통해 user.timezone 속성 값을 지정한다.

```kotlin
package blog.`in`.action

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class ActionInBlogApplication

fun main(args: Array<String>) {
    System.setProperty("user.timezone", "Asia/Seoul")
    runApplication<ActionInBlogApplication>(*args)
}
```

### 3.2. Setup Timezone at Container Runtime

도커 파일 이미지를 만들 때 환경 변수를 생성해 -Duser.timezone 설정을 바꾸는 것도 좋은 방법이지만, 사실 이미지를 다시 만들 필요가 없다. 격리된 환경을 제공하는 컨테이너의 TZ 환경 변수를 변경하는 것만으로 애플리케이션은 정상적으로 동작한다. 애플리케이션 입장에선 호스트 PC의 TZ 환경 변수처럼 느껴질 것이다. 컨테이너를 실행할 때 다음과 같은 환경 변수를 추가한다.

- `-e` 옵션으로 TZ 환경 변수 값을 `Asia/Seoul`로 변경한다.

```
$ docker run --name backend-timezone -p 8080:8080 -e TZ=Asia/Seoul backend 
```

## CLOSING

코드나 환경 변수를 바꿨을 때 정상적인 동작 결과는 위의 내용과 크게 다르지 않으므로 별도로 첨부하지 않는다. 

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-02-07-timezone-problem-of-jvm-application>

#### REFERENCE

- <https://studynote.oopy.io/trouble-shooting/timezone>
- <https://howtodoinjava.com/java/date-time/setting-jvm-timezone/>

[gmt-and-utc-link]: https://junhyunny.github.io/information/gmt-and-utc/
[handling-timezone-on-javascript-link]: https://junhyunny.github.io/javascript/handling-timezone-on-javascript/
