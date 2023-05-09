---
title: "Virtual Host in Tomcat"
search: false
category:
  - spring-boot
  - tomcat
last_modified_at: 2023-05-08T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Deploy War Package for Spring Boot Project][deploy-spring-boot-project-as-war-link]

## 0. 들어가면서

최근 톰캣(tomcat)의 `sever.xml` 파일 안에 `Host` 태그에 관련된 질문을 받았습니다. 
한번도 사용해본적 없는 기능이라 공부해보고 알려준다는 답변만 남겼습니다. 
이후 배운 내용을 공유하기 위해 포스트 글로 정리하였습니다. 

## 1. Virtual Host

`Host` 태그는 톰캣의 가상 호스트(virtual host)라는 기능에 사용됩니다. 
물리 서버가 1대인 온-프레미스(on-premiss) 운영 환경에서 여러 개의 도메인(domain)을 운영하는 경우 유용하게 사용됩니다. 
사용 트래픽이 적은 경우처럼 물리 서버를 굳이 하나 더 늘릴 필요가 없다면 가상 호스트 기능을 통해 여러 서비스를 호스팅할 수 있습니다. 

<p align="center">
    <img src="/images/virtual-host-in-tomcat-1.JPG" width="100%" class="image__border">
</p>

### 1.1. server.xml in Tomcat

톰캣 폴더에 `conf/server.xml` 파일을 열면 다음과 같은 정보를 볼 수 있습니다. 
이번 포스트에서 사용한 톰캣은 9 버전입니다.

* 호스트 이름이 `localhost`인 경우 `webapps` 경로를 루트(root) 폴더로 설정합니다.
    * `Context` 정보를 별도로 명시하지 않았으므로 `webapps/ROOT` 경로를 웹 어플리케이션의 컨텍스트 폴더를 설정합니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Server port="8005" shutdown="SHUTDOWN">
  <Service name="Catalina">
    <Connector port="8080" protocol="HTTP/1.1"
               connectionTimeout="20000"
               redirectPort="8443"
               maxParameterCount="1000"
               />
    <Engine name="Catalina" defaultHost="localhost">
      
      <Realm className="org.apache.catalina.realm.LockOutRealm">
        <Realm className="org.apache.catalina.realm.UserDatabaseRealm" resourceName="UserDatabase"/>
      </Realm>

      <Host name="localhost"  appBase="webapps" unpackWARs="true" autoDeploy="true">
        <Valve className="org.apache.catalina.valves.AccessLogValve" directory="logs"
               prefix="localhost_access_log" suffix=".txt"
               pattern="%h %l %u %t &quot;%r&quot; %s %b" />
      </Host>

    </Engine>
  </Service>
</Server>
```

## 2. Practice

다음과 같은 시나리오로 실습을 진행하였습니다.

* 스프링 부트(spring-boot) 프로젝트를 두 개 준비합니다.
* 각 프로젝트를 `war` 패키지 파일로 빌드합니다.
* 톰캣에 배포하고 가상 호스트를 통해 다른 도메인 주소로 서비스합니다.
    * /pc 폴더 - `pc-service.com` 서비스 호스팅
    * /mobile 폴더 - `mobile-service.com` 서비스 호스팅

### 2.1. Build Projects

HTML 페이지의 내용만 다르고 같은 구조의 프로젝트를 배포하기 때문에 하나만 확인하겠습니다. 
프로젝트 코드는 별다른 내용이 없으므로 자세한 설명 없이 글을 이어가겠습니다. 
프로젝트의 모든 내용을 확인하고 싶은 분들은 포스트 맨 하단의 예제 코드 링크를 참고바랍니다.

다음과 같은 환경을 가진 프로젝트를 빌드하였습니다. 

* Spring Boot
    * spring-boot-starter-parent - 2.7.11
* Maven
* Thymleaf

스프링 부트는 내장 톰캣(embedded tomcat)을 사용하기 때문에 기본 패키지 방식이 `jar`입니다.

* 일반 톰캣 서버에 배포하기 위해 `war` 형식의 패키징이 필요합니다.
* 패키지 환경을 구성하는 자세한 방법은 아래 포스트를 참고바랍니다.
* [Deploy War Package for Spring Boot Project][deploy-spring-boot-project-as-war-link]

다음 명령어를 통해 빌드하고, 패키징 된 파일을 톰캣에 이동합니다.

* 빌드가 주된 목적이므로 테스트는 스킵합니다.

```
$ mvn package -Dmaven.test.skip=true

[INFO] Scanning for projects...
[INFO] 
[INFO] ---------------< action.in.mobile:action-in-blog-mobile >---------------
[INFO] Building action-in-blog-mobile 0.0.1-SNAPSHOT
[INFO] --------------------------------[ war ]---------------------------------
[INFO] 
[INFO] --- maven-resources-plugin:3.2.0:resources (default-resources) @ action-in-blog-mobile ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Using 'UTF-8' encoding to copy filtered properties files.
[INFO] Copying 1 resource
[INFO] Copying 1 resource
[INFO] 
[INFO] --- maven-compiler-plugin:3.10.1:compile (default-compile) @ action-in-blog-mobile ---
[INFO] Nothing to compile - all classes are up to date
[INFO] 
[INFO] --- maven-resources-plugin:3.2.0:testResources (default-testResources) @ action-in-blog-mobile ---
[INFO] Not copying test resources
[INFO] 
[INFO] --- maven-compiler-plugin:3.10.1:testCompile (default-testCompile) @ action-in-blog-mobile ---
[INFO] Not compiling test sources
[INFO] 
[INFO] --- maven-surefire-plugin:2.22.2:test (default-test) @ action-in-blog-mobile ---
[INFO] Tests are skipped.
[INFO] 
[INFO] --- maven-war-plugin:3.3.2:war (default-war) @ action-in-blog-mobile ---
[INFO] Packaging webapp
[INFO] Assembling webapp [action-in-blog-mobile] in [/Users/junhyunk/Desktop/action-in-blog-mobile/target/action-in-blog-mobile-0.0.1-SNAPSHOT]
[INFO] Processing war project
[INFO] Building war: /Users/junhyunk/Desktop/action-in-blog-mobile/target/action-in-blog-mobile-0.0.1-SNAPSHOT.war
[INFO] 
[INFO] --- spring-boot-maven-plugin:2.7.11:repackage (repackage) @ action-in-blog-mobile ---
[INFO] Replacing main artifact with repackaged archive
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  2.204 s
[INFO] Finished at: 2023-05-08T17:06:36+09:00
[INFO] ------------------------------------------------------------------------
```

### 2.2. Setup Tomcat Config

`conf/server.xml` 파일을 다음과 같이 수정합니다.

* `pc-service.com` 도메인 주소
    * 루트 폴더를 `pc`로 설정합니다.
    * 웹 어플리케이션 컨텍스트 폴더를 `pc/ROOT`으로 지정합니다.
* `mobile-service.com` 도메인 주소
    * 루트 폴더를 `mobile`로 설정합니다.
    * 웹 어플리케이션 컨텍스트 폴더를 `mobile/ROOT`으로 지정합니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Server port="8005" shutdown="SHUTDOWN">
  
  <!-- ... -->
  
  <Service name="Catalina">
    <Connector port="8080" protocol="HTTP/1.1"
               connectionTimeout="20000"
               redirectPort="8443"
               maxParameterCount="1000"
               />

    <Engine name="Catalina" defaultHost="localhost">
      
      <!-- ... -->

      <Host name="pc-service.com" appBase="pc" unpackWARs="true" autoDeploy="true">
           <Context path="/" docBase="ROOT" reloadable="true"/>
      </Host>

      <Host name="mobile-service.com" appBase="mobile" unpackWARs="true" autoDeploy="true">
           <Context path="/" docBase="ROOT" reloadable="true"/>
      </Host>
      
      <Host name="localhost" appBase="webapps" unpackWARs="true" autoDeploy="true">
        <Valve className="org.apache.catalina.valves.AccessLogValve" directory="logs"
               prefix="localhost_access_log" suffix=".txt"
               pattern="%h %l %u %t &quot;%r&quot; %s %b" />

      </Host>
    </Engine>
  </Service>
</Server>
```

### 2.3. Run Tomcat and Deploy

빌드된 패키지 파일들을 톰캣 경로로 이동시킵니다. 

* 기본 루트인 `webapps` 폴더와 동일한 디렉토리 레벨에 두 개의 폴더를 만듭니다.
    * `pc` 폴더
    * `mobile` 폴더
* 빌드된 각각의 패키지 파일들을 `ROOT.war` 이름으로 변경하여 이동시킵니다.

```
$ mkdir apache-tomcat-9.0.74/pc                                                
$ mkdir apache-tomcat-9.0.74/mobile

$ mv action-in-blog-pc/target/action-in-blog-pc-0.0.1-SNAPSHOT.war apache-tomcat-9.0.74/pc/ROOT.war
$ mv action-in-blog-mobile/target/action-in-blog-mobile-0.0.1-SNAPSHOT.war apache-tomcat-9.0.74/mobile/ROOT.war
```

톰캣 서버를 시작하고 실행 로그를 확인합니다.

* 루트 경로 폴더 내부에 `war` 패키지 파일이 있는 경우 톰캣에 의해 자동으로 압축이 풀리면서 서비스가 배포됩니다.
* `tail` 명령어를 통해 톰캣 실행 로그를 확인합니다.

```
$ sh apache-tomcat-9.0.74/bin/startup.sh

$ tail -f -n 100 apache-tomcat-9.0.74/logs/catalina.out
```

<p align="center">
    <img src="/images/virtual-host-in-tomcat-2.gif" width="100%" class="image__border">
</p>

### 2.4. Add Hosts at Local Machine

가상 호스트가 정상적으로 기능하는지 확인하기 위해선 도메인 주소가 필요합니다. 
로컬 호스트에 필요한 호스트를 등록한 후 브라우저를 통해 접근합니다.

```
$ sudo vi /etc/hosts

# hosts 파일 하단에 아래 주소와 도메인을 추가합니다.
127.0.0.1       pc-service.com
127.0.0.1       mobile-service.com
```

##### Result of Practice

* 브라우저를 통해 각 도메인 주소에 접근합니다.
* 서로 다른 화면이 보이는 것을 확인할 수 있습니다.

<p align="center">
    <img src="/images/virtual-host-in-tomcat-3.gif" width="100%" class="image__border">
</p>

## CLOSING

스프링 부트 프레임워크에서 사용하는 내장 톰캣은 가상 호스트 기능을 활용하기 어렵다고 합니다. 
nginx 같은 리버스 프록시(reverse proxy)를 사용하면 동일한 구조를 쉽게 구성할 수 있습니다. 
관련된 내용은 다음 포스트를 통해 알아보겠습니다.

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-05-08-virtual-host-in-tomcat>

#### RECOMMEND NEXT POSTS

[Forward/Reverse Proxy][forward-reverse-proxy-link]

#### REFERENCE

* <https://tomcat.apache.org/tomcat-9.0-doc/virtual-hosting-howto.html>
* [Embedded Tomcat과 Tomcat의 차이](https://thxwelchs.github.io/EmbeddedTomcat%EA%B3%BCTomcat%EC%9D%98%EC%B0%A8%EC%9D%B4/)

[deploy-spring-boot-project-as-war-link]: https://junhyunny.github.io/spring-boot/server/deploy-spring-boot-project-as-war/
[forward-reverse-proxy-link]: https://junhyunny.github.io/information/forward-reverse-proxy/