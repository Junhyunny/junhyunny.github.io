---
title: "Setup Keycloak"
search: false
category:
  - security
  - tool
last_modified_at: 2024-10-05T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [SSO(Single Sign On)][single-sign-on-link]
- [OAuth(Open Authorization)][oauth-link]
- [OpenID Connect][open-id-connect-link]

## 1. Keycloak

키클록(keycloak)은 오픈 소스 아이덴티티(identity) 및 접근 관리 솔루션이다. 다음과 같은 특징을 갖는다. 

- 간편한 사용자 인증
  - 사용자 인증 프로세스를 제공한다. 애플리케이션이 별도로 사용자 인증 과정을 구현할 필요가 없도록 돕는다. 
- 통합 인증
  - OAuth2.0, OpenID Connect, SAML 같은 표준 프로토콜을 지원한다.
  - 사용자가 한번 로그인하면 다른 애플리케이션을 이용할 때 로그인이 필요 없는 싱글 사인온(SSO, Single Sign On)을 제공한다.
- 사용자 관리
  - 사용자 등록, 로그인, 비밀번호 재설정 등 사용자를 관리할 수 있는 관리자 기능을 제공한다.
- 소셜 로그인
  - Google, Facebook 같은 외부 인증 제공자와의 통합을 지원한다.
- 세분화 된 권한 부여
  - 역할 기반 접근 제어(RBAC, Role-Based Access Control)을 제공한다. 
  - 애플리케이션의 다양한 리소스에 대한 세밀한 권한 부여가 가능하다.
- 배포 옵션
  - 키클록은 자체 호스팅할 수 있다.
  - 도커와 쿠버네티스 같은 컨테이너 환경에서도 운영 가능하다.

## 2. Install and run Keycloak server 

키클록을 설치해보자. [이 링크](https://www.keycloak.org/downloads)에서 다운로드 할 수 있다. 키클록 서버 중 ZIP 압축 파일을 다운로드 받는다. 

<div align="center">
  <img src="/images/posts/2024/set-up-key-cloak-01.png" width="100%" class="image__border">
</div>
<center>https://www.keycloak.org/downloads</center>

<br/>

다운로드가 완료되면 압축을 푼다. `bin` 디렉토리에 키클록 서버 실행 파일이 존재한다. 

<div align="center">
  <img src="/images/posts/2024/set-up-key-cloak-02.png" width="80%" class="image__border">
</div>

<br/>

프로젝트 경로에서 다음 명령어를 실행한다.

- `start-dev` 옵션
  - 키클록 서버를 개발 모드로 실행할 수 있다. 
  - 빠르게 시작할 수 있으며 개발자들을 위해 편리한 기본 값들을 제공한다.
- `--http-port` 옵션
  - 키클록 서버를 9090 포트로 실행한다.

```
$ sh bin/kc.sh start-dev --http-port 9090

Updating the configuration and installing your custom providers, if any. Please wait.
2024-10-05 00:22:59,685 INFO  [io.qua.dep.QuarkusAugmentor] (main) Quarkus augmentation completed in 2773ms
2024-10-05 00:23:01,666 INFO  [org.keycloak.quarkus.runtime.storage.infinispan.CacheManagerFactory] (main) Starting Infinispan embedded cache manager
2024-10-05 00:23:01,749 INFO  [org.keycloak.quarkus.runtime.storage.infinispan.CacheManagerFactory] (main) Persistent user sessions enabled and no memory limit found in configuration. Setting max entries for sessions to 10000 entries.
2024-10-05 00:23:01,749 INFO  [org.keycloak.quarkus.runtime.storage.infinispan.CacheManagerFactory] (main) Persistent user sessions enabled and no memory limit found in configuration. Setting max entries for clientSessions to 10000 entries.
2024-10-05 00:23:01,749 INFO  [org.keycloak.quarkus.runtime.storage.infinispan.CacheManagerFactory] (main) Persistent user sessions enabled and no memory limit found in configuration. Setting max entries for offlineSessions to 10000 entries.
2024-10-05 00:23:01,749 INFO  [org.keycloak.quarkus.runtime.storage.infinispan.CacheManagerFactory] (main) Persistent user sessions enabled and no memory limit found in configuration. Setting max entries for offlineClientSessions to 10000 entries.
2024-10-05 00:23:01,952 INFO  [org.infinispan.CONTAINER] (ForkJoinPool.commonPool-worker-1) ISPN000556: Starting user marshaller 'org.infinispan.commons.marshall.ImmutableProtoStreamMarshaller'
2024-10-05 00:23:02,786 INFO  [org.keycloak.quarkus.runtime.storage.database.liquibase.QuarkusJpaUpdaterProvider] (main) Initializing database schema. Using changelog META-INF/jpa-changelog-master.xml

UPDATE SUMMARY
Run:                        144
Previously run:               0
Filtered out:                 0
-------------------------------
Total change sets:          144

2024-10-05 00:23:03,934 WARN  [io.agroal.pool] (main) Datasource '<default>': JDBC resources leaked: 1 ResultSet(s) and 0 Statement(s)
2024-10-05 00:23:04,138 INFO  [org.keycloak.connections.infinispan.DefaultInfinispanConnectionProviderFactory] (main) Node name: node_575066, Site name: null
2024-10-05 00:23:04,220 INFO  [org.keycloak.broker.provider.AbstractIdentityProviderMapper] (main) Registering class org.keycloak.broker.provider.mappersync.ConfigSyncEventListener
2024-10-05 00:23:04,248 INFO  [org.keycloak.services] (main) KC-SERVICES0050: Initializing master realm
2024-10-05 00:23:05,395 WARN  [io.agroal.pool] (main) Datasource '<default>': JDBC resources leaked: 1 ResultSet(s) and 0 Statement(s)
2024-10-05 00:23:05,469 INFO  [io.quarkus] (main) Keycloak 26.0.0 on JVM (powered by Quarkus 3.15.1) started in 5.609s. Listening on: http://0.0.0.0:9090
2024-10-05 00:23:05,469 INFO  [io.quarkus] (main) Profile dev activated. 
2024-10-05 00:23:05,470 INFO  [io.quarkus] (main) Installed features: [agroal, cdi, hibernate-orm, jdbc-h2, keycloak, narayana-jta, opentelemetry, reactive-routes, rest, rest-jackson, smallrye-context-propagation, vertx]
2024-10-05 00:23:05,472 WARN  [org.keycloak.quarkus.runtime.KeycloakMain] (main) Running the server in development mode. DO NOT use this configuration in production.
```

실행이 완료되면 마지막에 다음과 같은 로그를 볼 수 있다.

> Running the server in development mode. DO NOT use this configuration in production.

운영 환경에서 사용하지 않도록 주의한다. 필자는 OAuth2 클라이언트 애플리케이션의 기능 구현 및 검증을 위해 사용할 예정이기 때문에 개발 모드도 충분하다. 실행이 완료되면 브라우저에서 http://localhost:9090 에 접속한다. 처음 접속하면 관리자 사용자 등록 화면을 볼 수 있다.

- 사용자 이름은 "admin"으로 지정한다.
- 비밀번호도 "admin"으로 지정한다.

<div align="center">
  <img src="/images/posts/2024/set-up-key-cloak-03.png" width="100%" class="image__border">
</div>

<br/>

사용자 생성이 성공하면 다음과 같은 화면을 볼 수 있다.

<div align="center">
  <img src="/images/posts/2024/set-up-key-cloak-04.png" width="100%" class="image__border">
</div>

<br/>

관리자 계정으로 로그인하면 마스터 렐름 메인 화면을 볼 수 있다.

<div align="center">
  <img src="/images/posts/2024/set-up-key-cloak-05.png" width="100%" class="image__border">
</div>

## 3. Create new raelm and user

새로운 렐름(raelm)과 사용자를 만든다. 렐름은 사용자, 인증, 인가, 권한 등을 관리하는 범위다. 렐름은 두 가지 타입이 있다. 

- 마스터 렐름(master raelm)
  - 키클록을 시작하면 최초에 생성되는 렐름이다.
  - 관리자 계정이 포함된 렐름으로 마스터 렐름만 다른 렐름을 생성 관리할 수 있다.
- 마스터 외 다른 렐름(other raelm)
  - 마스터 렐름의 관리자에 의해 성성된다.
  - 관리자는 이 렐름에서 조직, 애플리케이션들에서 필요한 사용자들을 관리한다.

<div align="center">
  <img src="/images/posts/2024/set-up-key-cloak-06.png" width="100%" class="image__border">
</div>
<center>https://www.keycloak.org/docs/latest/server_admin/</center>

<br/>

각 렐름은 격리돼 관리된다. 위 시큐리티 모델은 우발적인 변경을 방지하는 데 도움이 되며, 사용자 계정이 현재 작업을 성공적으로 수행하는 데 필요한 최소한의 권한에만 접근하도록 허용하는 전통적인 디자인을 따른다. OAuth2 인증을 위한 렐름을 만들어보자. 로그인 화면 왼쪽 상단에 렐름을 셀렉트 박스(select box)를 선택 후 `Create Raelm` 버튼을 누른다.

<div align="center">
  <img src="/images/posts/2024/set-up-key-cloak-07.png" width="100%" class="image__border">
</div>

<br/>

렐름 이름을 작성 후 생성한다.

<div align="center">
  <img src="/images/posts/2024/set-up-key-cloak-08.png" width="100%" class="image__border">
</div>

<br/>

새로운 렐름 대시보드 화면에서 `Users` 탭을 선택한다. `Create new user` 버튼을 눌러 새로운 사용자를 추가한다.

<div align="center">
  <img src="/images/posts/2024/set-up-key-cloak-09.png" width="100%" class="image__border">
</div>

<br/>

사용자 이름(username), 이름과 성을 등록 후 생성한다.

<div align="center">
  <img src="/images/posts/2024/set-up-key-cloak-10.png" width="100%" class="image__border">
</div>

<br/>

생성이 완료되면 사용자 상세 정보 화면으로 이동한다. ID 정보는 자동으로 생성된다.

<div align="center">
  <img src="/images/posts/2024/set-up-key-cloak-11.png" width="100%" class="image__border">
</div>

<br/>

사용자 최초 비밀번호를 생성해준다. 사용자 상세 화면 상단 `Credential` 탭을 누른다. 해당 화면에서 `Set password` 버튼을 누른다.

<div align="center">
  <img src="/images/posts/2024/set-up-key-cloak-12.png" width="100%" class="image__border">
</div>

<br/>

사용자를 위한 최초 비밀번호를 등록한다. 

<div align="center">
  <img src="/images/posts/2024/set-up-key-cloak-13.png" width="100%" class="image__border">
</div>

<br/>

이제 새로 생성한 사용자로 로그인을 해보자. 화면 왼쪽 사이드 `Clients` 탭을 누르면 해당 렐름의 로그인 화면으로 이동할 수 있는 링크가 있다. 해당 링크를 누르면 생성한 렐름으로 로그인 화면으로 이동한다. 

<div align="center">
  <img src="/images/posts/2024/set-up-key-cloak-14.png" width="100%" class="image__border">
</div>

<br/>

URL 주소가 경로 중 `/raelms/{raelmName}`인 것을 확인할 수 있다. 마스터 렐름에 로그인 할 땐 `/raelms/master`이다.

<div align="center">
  <img src="/images/posts/2024/set-up-key-cloak-15.png" width="100%" class="image__border">
</div>

<br/>

위에서 등록한 임시 비밀번호를 사용해 로그인하면 새로운 비밀번호 등록 화면이 보인다. 

<div align="center">
  <img src="/images/posts/2024/set-up-key-cloak-16.png" width="100%" class="image__border">
</div>

<br/>

다음 화면에선 이메일 정보 등록 화면이 보인다. 필수 값이므로 이를 등록한다.

<div align="center">
  <img src="/images/posts/2024/set-up-key-cloak-17.png" width="100%" class="image__border">
</div>

<br/>

모든 설정이 완료되면 위에서 생성한 `Spring Security OAuth2 Example` 렐름 화면과 로그인 한 사용자 정보를 볼 수 있다.

<div align="center">
  <img src="/images/posts/2024/set-up-key-cloak-18.png" width="100%" class="image__border">
</div>

#### REFERENCE

- <https://www.keycloak.org/>
- <https://www.keycloak.org/getting-started/getting-started-zip>
- <https://www.keycloak.org/server/all-config?options-filter=all>
- <https://velog.io/@ashappyasikonw/KEYCLOAK>
- <https://www.keycloak.org/docs/latest/server_admin/>

[single-sign-on-link]: https://junhyunny.github.io/information/security/single-sign-on/
[oauth-link]: https://junhyunny.github.io/information/security/oauth/
[open-id-connect-link]: https://junhyunny.github.io/information/security/open-id-connect/