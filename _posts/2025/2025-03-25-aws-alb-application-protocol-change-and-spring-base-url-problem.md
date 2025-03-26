---
title: "AWS 로드밸런서-애플리케이션 구간 프로토콜 변환과 스프링 baseUrl 문제"
search: false
category:
  - aws
  - spring-security
last_modified_at: 2025-03-25T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Forward/Reverse Proxy][forward-reverse-proxy-link]

## 0. 들어가면서

AWS ALB(application load balancer) 뒤에 위치한 EC2 컨테이너에 스프링 서버 애플리케이션을 배포했을 때 OAuth2 인증시 리다이렉트 URL의 프로토콜이 변경되는 문제에 대해 정리했다.

## 1. Problem context

우선 문제가 발생한 컨텍스트를 살펴보자. 

- AWS ALB 뒤에 위치한 서버 애플리케이션
- spring-boot-starter-oauth2-client 의존성을 사용한 구글 로그인 구현

스프링 서버 애플리케이션에서 사용한 `application.yml` 설정은 다음과 같다.

- OAuth2 인가 과정에서 필요한 리다이렉트 URL의 도메인 이름으로 `{baseUrl}`을 사용한다. 
  - `{baseUrl}`을 사용하면 요청에 포함된 서버의 도메인 주소가 주입된다.
  - 예를 들어, `http://localhost:8080/home` 경로로 요청을 보내는 경우 HTTP 요청에 포함된 정보를 통해 `http://localhost:8080/`이 주입된다.

```yml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}
            redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"
            scope:
              - profile
              - email
            client-name: Google
        provider:
          google:
            authorization-uri: https://accounts.google.com/o/oauth2/auth
            token-uri: https://oauth2.googleapis.com/token
            user-info-uri: https://www.googleapis.com/oauth2/v3/userinfo
```

위 상황에서 구글 로그인을 실행하면 다음과 같은 에러가 발생한다.

- 400 오류: redirect_uri_mismatch

<div align="center">
  <img src="/images/posts/2025/aws-alb-application-protocol-change-and-spring-base-url-problem-01.png" width="80%" class="image__border">
</div>

<br/>

브라우저의 개발자 모드를 통해 네트워크 탭으로 OAuth2 인가 코드 리다이렉트 요청을 살펴보면 리다이렉트 URL의 프로토콜이 `https`가 아닌 `http`인 것을 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2025/aws-alb-application-protocol-change-and-spring-base-url-problem-02.png" width="80%" class="image__border">
</div>

## 2. Cause of the problem

문제의 원인은 쉽게 유추할 수 있다. 먼저 각 통신 구간의 프로토콜을 살펴보자.

- 사용자와 ALB 구간
  - HTTPS 통신을 수행한다. 인증서 검증은 ALB에서 처리된다.
- ALB와 EC2 컨테이너 구간
  - HTTP 통신을 수행한다. ALB 리스너(listener)를 통해 트래픽이 EC2 컨테이너 8080 포트로 포워딩된다. 

<div align="center">
  <img src="/images/posts/2025/aws-alb-application-protocol-change-and-spring-base-url-problem-03.png" width="100%" class="image__border">
</div>

<br/>

위에서 확인할 수 있듯이 각 구간이 다른 통신 프로토콜로 통신하기 때문에 문제가 발생한다. ALB-서버 통신 구간은 HTTP 통신을 하기 때문에 baseUrl에 http://domain.com 값이 주입된다.

## 3. Resolve the problem

문제를 해결할 수 있는 방법은 3가지 있다. 

- application.yml 파일에 `server.forward-headers-strategy=framework` 설정을 추가한다.
- application.yml 파일의 OAuth2 리다이렉트 URL을 환경 변수 처리하여 로컬 환경에서는 `http://localhost:8080`, 클라우드 환경에서는 `https://domain.com`을 주입한다.
- 구글 OAuth2 개발자 사이트에 등록한 클라이언트 애플리케이션의 관리 페이지에서 `http://domain.com`을 리다이렉트 URL로 추가 등록한다.

구체적으로 2번 해결 방법은 다음과 같다.

- 리다이렉트 URL 값을 `APP_BASE_URL` 환경 변수로 대체한다.

```yml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}
            redirect-uri: ${APP_BASE_URL}
            scope:
              - profile
              - email
            client-name: Google
        provider:
          google:
            authorization-uri: https://accounts.google.com/o/oauth2/auth
            token-uri: https://oauth2.googleapis.com/token
            user-info-uri: https://www.googleapis.com/oauth2/v3/userinfo
```

3번 방법은 http 스킴(scheme)을 허용하지 않는 인증 제공자가 있기 때문에 모든 상황에 적합하지 않다. 예를 들어 애플(apple)은 오직 https 스킴만 등록할 수 있고, AWS Cognito 서비스는 로컬 호스트만 http 스킴을 허용한다. 

나는 항상 2번 방식으로 문제를 해결했었는데, 최근 새로운 해결 방법을 발견했다. 이번 글을 작성하게 된 계기다. 1번 방법인 `server.forward-headers-strategy=framework` 설정을 사용하면 이 문제를 해결할 수 있다. 이 해결 방법을 정확히 이해하려면 먼저 알아야 할 개념들이 있다. 

프록시 서버를 경유하는 경우 HTTP 요청에 대해 원본 클라이언트 정보를 전달하는 방법이 있다. `X-Forwarded-` 같은 형태의 비표준 헤더를 사용하거나 [RFC7239(Forwarded HTTP Extension)](https://datatracker.ietf.org/doc/html/rfc7239) 명세에 정의된 `Forwarded` 표준 헤더를 사용한다. 주로 사용되는 `X-Forwarded-` 비표준 헤더에는 다음과 같은 것들이 있다.

- X-Forwarded-For - 원본 클라이언트 IP 주소, 여러 개의 프록시를 거치면 각 프록시가 자신을 추가하여 `,`로 구분
- X-Forwarded-Host - 원본 요청의 호스트 이름
- X-Forwarded-Port - 원본 요청의 포트
- X-Forwarded-Proto - 원본 요청의 프로토콜
- X-Forwarded-Ssl - 원본 요청의 SSL/TLS 사용 여부
- X-Forwarded-Prefix - 원본 요청의 URL 경로 접두어(prefix)

AWS ALB는 서버 애플리케이션 기준으로 프록시 서버 역할을 수행한다. 비표준이긴 하지만, 원본 요청에 대한 정보를 전달하기 위해 `X-Forwarded-` 헤더를 사용한다. [AWS ALB 공식 문서](https://docs.aws.amazon.com/elasticloadbalancing/latest/classic/x-forwarded-headers.html)를 보면 다음과 같은 3개의 헤더를 제공한다.

- X-Forwarded-For
- X-Forwarded-Proto
- X-Forwarded-Port

<div align="center">
  <img src="/images/posts/2025/aws-alb-application-protocol-change-and-spring-base-url-problem-04.png" width="100%" class="image__border">
</div>

<br/>

AWS ALB를 통과할 때 `X-Forwarded-` 헤더가 추가되어 이를 통해 원본 요청의 프로토콜과 포트를 확인할 수 있다는 사실을 알았다. 이제 `server.forward-headers-strategy` 설정이 무엇인지 살펴보자. 해당 설정은 다음과 같은 옵션들이 있다.

- FRAMEWORK - Use Spring's support for handling forwarded headers.
- NATIVE - Use the underlying container's native support for forwarded headers.
- NONE - Ignore X-Forwarded-* headers.

`FRAMEWORK`, `NATIVE` 옵션을 선택하면 포워드 헤더를 사용한다. FRAMEWORK 옵션은 스프링 프레임워크가 제공하는 ForwardedHeaderFilter 컴포넌트를 통해 HTTP 헤더에 포함된 `X-Forwarded-` 값을 사용한다. NATIVE 옵션을 사용하면 톰캣(tomcat)인 경우 RemoteIpValve, 제티(jetty)인 경우 ForwardedRequestCustomizer가 이를 처리한다. 나는 FRAMEWORK 옵션을 사용했다.

- ForwardedHeaderFilter가 필터 체인 중간에 포함된다.
- `X-Forwarded-` 헤더 값을 사용할 수 있도록 HttpServletRequest 객체를 ForwardedHeaderExtractingRequest 객체로 랩핑(wrapping)하여 다음 체인으로 전달한다.
- ForwardedHeaderFilter의 다음 필터부터는 요청 객체의 헤더, 프로토콜을 원본 요청의 것을 사용한다.

<div align="center">
  <img src="/images/posts/2025/aws-alb-application-protocol-change-and-spring-base-url-problem-05.png" width="100%" class="image__border">
</div>

<br/>

application.yml 파일에 다음 설정을 추가한다.

```yml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}
            redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"
            scope:
              - profile
              - email
            client-name: Google
        provider:
          google:
            authorization-uri: https://accounts.google.com/o/oauth2/auth
            token-uri: https://oauth2.googleapis.com/token
            user-info-uri: https://www.googleapis.com/oauth2/v3/userinfo

server:
  forward-headers-strategy: framework # this
```

FRAMEWORK 설정 후 서비스를 배포하면 정상적으로 리다이렉트 URL이 설정되는 것을 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2025/aws-alb-application-protocol-change-and-spring-base-url-problem-06.png" width="80%" class="image__border">
</div>

## CLOSING

이전엔 `server.use-forward-headers=true` 옵션을 사용했던 것 같지만, 현재는 사용되지 않는다.(deprecated) 이 글에서 제공하는 예제 코드를 사용하면 테라폼을 사용해서 인프라를 구축해서 테스트 할 수 있다. 다만, 구글 OAuth2 클라이언트 인증 정보, HTTPS 인증서, 도메인은 별도로 준비해야 한다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2025-03-25-aws-alb-application-protocol-change-and-spring-base-url-problem>

#### REFERENCE

- <https://mrzhubin.wordpress.com/2020/12/03/spring-boot-spring-oauth2-client-aws-elb-http-https-redirect-issue/>
- <https://stackoverflow.com/questions/33812471/spring-oauth-redirect-uri-not-using-https>
- <https://datatracker.ietf.org/doc/html/rfc7239>
- <https://docs.aws.amazon.com/elasticloadbalancing/latest/classic/x-forwarded-headers.html>
- <https://docs.spring.io/spring-framework/reference/web/webmvc/filters.html#filters-forwarded-headers>

[forward-reverse-proxy-link]: https://junhyunny.github.io/information/forward-reverse-proxy/