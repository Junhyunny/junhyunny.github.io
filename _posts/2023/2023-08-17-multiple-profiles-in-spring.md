---
title: "Multiple Profiles in Spring"
search: false
category:
  - spring-boot
last_modified_at: 2023-08-17T23:55:00
---

<br/>

## 1. Use Active Profile

스프링 프레임워크(spring framework)는 실행 환경에 맞는 설정을 주입할 수 있는 강력한 기능을 제공합니다. 
`spring.profiles.active`라는 설정을 통해 어플리케이션이 어느 실행 환경에서 동작 중인지 결정할 수 있습니다. 
application.yml 설정이나 스프링 어플리케이션을 실행하는 커맨드를 통해서 주입할 수 있습니다. 

##### application.yml

```yml
spring:
  profiles:
    active: dev
```

##### Run command

* 실행할 때 적용된 프로파일(profile)이 `dev`인 것을 로그로 확인할 수 있습니다.
    * The following 1 profile is active: "dev"

```
$ java -jar -Dspring.profiles.active=dev action-in-blog-0.0.1-SNAPSHOT.jar 

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.1.2)

2023-08-17T01:09:07.433+09:00  INFO 38499 --- [           main] action.in.blog.ActionInBlogApplication   : Starting ActionInBlogApplication v0.0.1-SNAPSHOT using Java 20.0.2 with PID 38499 (/Users/junhyunk/Desktop/action-in-blog/build/libs/action-in-blog-0.0.1-SNAPSHOT.jar started by junhyunk in /Users/junhyunk/Desktop/action-in-blog/build/libs)
2023-08-17T01:09:07.435+09:00  INFO 38499 --- [           main] action.in.blog.ActionInBlogApplication   : The following 1 profile is active: "dev"
2023-08-17T01:09:07.890+09:00  INFO 38499 --- [           main] action.in.blog.ActionInBlogApplication   : Started ActionInBlogApplication in 0.798 seconds (process running for 1.311)
```

## 2. Use Multiple Profiles

어플리케이션을 개발하면 상황에 맞게 여러 프로파일을 조합해서 사용하는 경우가 있습니다. 

* 환경 별로 로깅 전략을 프로파일을 통해 제어하는 경우
* 특정 테스트에서만 필요한 빈(bean)을 프로파일을 통해 제어하는 경우

프로파일을 조합하는 방법이 스프링 부트(spring boot) 2.4.X 버전 이후로 변경되었습니다. 
이번 포스트에선 현재 최신 3.1.2 버전을 기준으로 다중 프로파일을 사용하는 방법에 대해 정리하였습니다. 

### 2.1. application.yml

* spring.profiles.group 설정을 사용합니다.
* 그룹에 사용 중인 프로파일을 정의합니다.
    * 각 프로파일 별로 함께 사용될 프로파일들을 추가합니다.
* local 프로파일 활성화
    * etc-1, etc-2 프로파일도 함께 사용됩니다.
* dev 프로파일 활성화
    * etc-1, etc-3 프로파일도 함께 사용됩니다.

```yml
spring:
  profiles:
    active: local
    group:
      local:
        - etc-1
        - etc-2
      dev:
        - etc-1
        - etc-3
```

### 2.2. Test

각 환경 별로 어플리케이션을 실행했을 때 함께 적용되는 프로파일들을 살펴보겠습니다.

* local 환경
    * The following 3 profiles are active: "dev", "etc-1", "etc-3"

```
$ java -jar -Dspring.profiles.active=local action-in-blog-0.0.1-SNAPSHOT.jar

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.1.2)

2023-08-17T11:15:58.081+09:00  INFO 71164 --- [           main] action.in.blog.ActionInBlogApplication   : Starting ActionInBlogApplication v0.0.1-SNAPSHOT using Java 20.0.2 with PID 71164 (/Users/junhyunk/Desktop/action-in-blog/build/libs/action-in-blog-0.0.1-SNAPSHOT.jar started by junhyunk in /Users/junhyunk/Desktop/action-in-blog/build/libs)
2023-08-17T11:15:58.083+09:00  INFO 71164 --- [           main] action.in.blog.ActionInBlogApplication   : The following 3 profiles are active: "local", "etc-1", "etc-2"
2023-08-17T11:15:58.474+09:00  INFO 71164 --- [           main] action.in.blog.ActionInBlogApplication   : Started ActionInBlogApplication in 0.741 seconds (process running for 1.064)
```

* dev 환경
    * The following 3 profiles are active: "dev", "etc-1", "etc-3"

```
$ java -jar -Dspring.profiles.active=dev action-in-blog-0.0.1-SNAPSHOT.jar

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.1.2)

2023-08-17T11:14:45.644+09:00  INFO 70919 --- [           main] action.in.blog.ActionInBlogApplication   : Starting ActionInBlogApplication v0.0.1-SNAPSHOT using Java 20.0.2 with PID 70919 (/Users/junhyunk/Desktop/action-in-blog/build/libs/action-in-blog-0.0.1-SNAPSHOT.jar started by junhyunk in /Users/junhyunk/Desktop/action-in-blog/build/libs)
2023-08-17T11:14:45.646+09:00  INFO 70919 --- [           main] action.in.blog.ActionInBlogApplication   : The following 3 profiles are active: "dev", "etc-1", "etc-3"
2023-08-17T11:14:46.069+09:00  INFO 70919 --- [           main] action.in.blog.ActionInBlogApplication   : Started ActionInBlogApplication in 0.777 seconds (process running for 1.264)
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-08-17-multiple-profiles-in-spring>

#### REFERENCE

* <https://stackoverflow.com/questions/47368086/spring-spring-profiles-include-overrides>
* <https://wonyong-jang.github.io/spring/2022/08/11/Spring-Profile.html>
* <https://gaemi606.tistory.com/entry/Spring-Boot-profile%EC%84%A4%EC%A0%95>
* <https://meetup.nhncloud.com/posts/149>
* <https://multifrontgarden.tistory.com/277>