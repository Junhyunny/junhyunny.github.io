---
title: "스프링 다중 프로파일 사용"
publishedAt: "2023-08-17"
updatedAt: "2026-11-12T16:15:07+09:00"
canonicalPath: "/spring-boot/multiple-profiles-in-spring/"
categories:
  - "spring-boot"
summary: "spring.profiles.active로 실행 환경을 지정하는 방법과 스프링 부트 2.4 이후 바뀐 spring.profiles.group 설정으로 여러 프로파일을 조합해 사용하는 방법을 정리했다."
---

## 1. Use Active Profile

스프링 프레임워크(spring framework)는 실행 환경에 맞는 설정을 주입할 수 있는 강력한 기능을 제공한다. `spring.profiles.active`라는 설정을 통해 애플리케이션이 어느 실행 환경에서 동작 중인지 결정할 수 있다. 이 설정은 application.yml 파일이나 스프링 애플리케이션을 실행하는 커맨드로 주입할 수 있다. application.yml 파일에는 다음과 같이 설정한다.

```yml
spring:
  profiles:
    active: dev
```

실행 커맨드로 주입할 때는 다음과 같이 실행한다. 실행 로그의 `The following 1 profile is active: "dev"` 메시지를 보면 적용된 프로파일(profile)이 `dev`인 것을 확인할 수 있다.

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

애플리케이션을 개발하면 상황에 맞게 여러 프로파일을 조합해서 사용하는 경우가 있다.

- 환경별 로깅 전략을 프로파일로 제어하는 경우
- 특정 테스트에서만 필요한 빈(bean)을 프로파일로 제어하는 경우

프로파일을 조합하는 방법은 스프링 부트(spring boot) 2.4.X 버전 이후로 변경됐다. 이 글에서는 글을 쓴 시점의 최신 버전인 3.1.2 버전을 기준으로 다중 프로파일을 사용하는 방법을 정리했다.

`application.yml` 파일은 다음과 같이 설정한다. spring.profiles.group 설정으로 그룹에 사용 중인 프로파일을 정의하고, 각 프로파일마다 함께 사용할 프로파일을 추가한다. local 프로파일을 활성화하면 etc-1, etc-2 프로파일이, dev 프로파일을 활성화하면 etc-1, etc-3 프로파일이 함께 사용된다.

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

환경별로 애플리케이션을 실행했을 때 함께 적용되는 프로파일을 살펴보자. local 환경에서는 `The following 3 profiles are active: "local", "etc-1", "etc-2"` 로그를 볼 수 있다.

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

dev 환경에서는 `The following 3 profiles are active: "dev", "etc-1", "etc-3"` 로그를 볼 수 있다.

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

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-08-17-multiple-profiles-in-spring>

#### REFERENCE

- <https://stackoverflow.com/questions/47368086/spring-spring-profiles-include-overrides>
- <https://wonyong-jang.github.io/spring/2022/08/11/Spring-Profile.html>
- <https://gaemi606.tistory.com/entry/Spring-Boot-profile%EC%84%A4%EC%A0%95>
- <https://meetup.nhncloud.com/posts/149>
- <https://multifrontgarden.tistory.com/277>
