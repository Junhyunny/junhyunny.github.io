---
title: "Spring Boot 프로젝트 WAR 패키징 및 배포"
search: false
category:
  - spring-boot
  - server
last_modified_at: 2022-05-29T23:55:00
---

<br/>

## 0. 들어가면서

예전 레거시 시스템의 기술 스택을 변경하는 프로젝트에서 배포 환경까지 함께 바꾸진 못 했습니다. 
기술 스택이 `JSP`, `Spring`에서 `Vue.js`, `Spring-Boot`으로 변경되면서, WAR 파일로 패키징하여 WAS(tomcat)에 배포하는 방식을 그대로 사용하지 못하는 점이 큰 문제였습니다. 
다행히도 배포할 수 있는 방법을 찾았는데, 이번 포스트에선 백엔드 서비스인 `Spring-Boot` 프로젝트를 WAR 파일로 패키징하여 톰캣에 배포하는 방법을 정리하였습니다.    

## 1. pom.xml 파일 수정

### 1.1. 의존성 추가

`Spring-Boot` 프로젝트는 기본적으로 톰캣이 내장되어 있습니다. 
내장 톰캣과 관련된 의존성 사용 시점을 변경할 필요가 있는데, 이를 위해 아래와 같은 의존성을 `pom.xml` 파일에 추가합니다.
- `spring-boot-starter-tomcat` - 내장 톰캣 의존성을 추가합니다.
- `provided` - 스코프를 `provided` 값으로 지정하여 컴파일 시에는 제공하고, 런타임 시점엔 JDK 혹은 컨테이너가 제공합니다.

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-tomcat</artifactId>
    <scope>provided</scope>
</dependency>
```

### 1.2. 패키징 방법 변경

패키징 방법은 기본적으로 `JAR`이므로 이를 `WAR`로 변경합니다. 
- `<packaging>war</packaging>`을 추가합니다.

```xml
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.7.0</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>

    <groupId>action.in.blog</groupId>
    <artifactId>action-in-blog</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>action-in-blog</name>
    <packaging>war</packaging>
    <description>action-in-blog</description>
```

## 2. SpringBootServletInitializer 클래스 상속

- 예전에는 `configure` 메소드를 오버라이드가 필요했던 것으로 보이지만, 현재 버전은 해당 메소드를 오버라이드하지 않아도 동작합니다. 

```java
package action.in.blog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

@SpringBootApplication
public class ActionInBlogApplication extends SpringBootServletInitializer {

    public static void main(String[] args) {
        SpringApplication.run(ActionInBlogApplication.class, args);
    }

    // 배포 시 동작하지 않는 경우 해당 주석을 풀고 다시 빌드
    // @Override
    // protected SpringApplicationBuilder configure(SpringApplicationBuilder builder) {
    //     return builder.sources(ActionInBlogApplication.class);
    // }
}
```

## 3. 프로젝트 패키징 및 배포

### 3.1. 프로젝트 패키징

- `mvn package` 명령어를 통해 WAR 패키지 파일을 생성합니다.

```
$ mvn package
[INFO] Scanning for projects...
[INFO] 
[INFO] -------------------< action.in.blog:action-in-blog >--------------------
[INFO] Building action-in-blog 0.0.1-SNAPSHOT
[INFO] --------------------------------[ war ]---------------------------------
[INFO] 
[INFO] --- maven-resources-plugin:3.2.0:resources (default-resources) @ action-in-blog ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Using 'UTF-8' encoding to copy filtered properties files.
[INFO] Copying 1 resource
[INFO] Copying 0 resource
[INFO] 
[INFO] --- maven-compiler-plugin:3.10.1:compile (default-compile) @ action-in-blog ---
[INFO] Nothing to compile - all classes are up to date
[INFO] 
[INFO] --- maven-resources-plugin:3.2.0:testResources (default-testResources) @ action-in-blog ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Using 'UTF-8' encoding to copy filtered properties files.
[INFO] skip non existing resourceDirectory /Users/junhyunk/Desktop/workspace/blog-in-action/2022-05-30-deploy-spring-boot-project-as-war/action-in-blog/src/test/resources
[INFO] 
[INFO] --- maven-compiler-plugin:3.10.1:testCompile (default-testCompile) @ action-in-blog ---
[INFO] Nothing to compile - all classes are up to date
[INFO] 
[INFO] --- maven-surefire-plugin:2.22.2:test (default-test) @ action-in-blog ---
[INFO] 
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running action.in.blog.ActionInBlogApplicationTests
03:52:22.448 [main] DEBUG org.springframework.test.context.BootstrapUtils - Instantiating CacheAwareContextLoaderDelegate from class [org.springframework.test.context.cache.DefaultCacheAwareContextLoaderDelegate]
03:52:22.456 [main] DEBUG org.springframework.test.context.BootstrapUtils - Instantiating BootstrapContext using constructor [public org.springframework.test.context.support.DefaultBootstrapContext(java.lang.Class,org.springframework.test.context.CacheAwareContextLoaderDelegate)]
03:52:22.484 [main] DEBUG org.springframework.test.context.BootstrapUtils - Instantiating TestContextBootstrapper for test class [action.in.blog.ActionInBlogApplicationTests] from class [org.springframework.boot.test.context.SpringBootTestContextBootstrapper]
03:52:22.493 [main] INFO org.springframework.boot.test.context.SpringBootTestContextBootstrapper - Neither @ContextConfiguration nor @ContextHierarchy found for test class [action.in.blog.ActionInBlogApplicationTests], using SpringBootContextLoader
03:52:22.496 [main] DEBUG org.springframework.test.context.support.AbstractContextLoader - Did not detect default resource location for test class [action.in.blog.ActionInBlogApplicationTests]: class path resource [action/in/blog/ActionInBlogApplicationTests-context.xml] does not exist
03:52:22.496 [main] DEBUG org.springframework.test.context.support.AbstractContextLoader - Did not detect default resource location for test class [action.in.blog.ActionInBlogApplicationTests]: class path resource [action/in/blog/ActionInBlogApplicationTestsContext.groovy] does not exist
03:52:22.496 [main] INFO org.springframework.test.context.support.AbstractContextLoader - Could not detect default resource locations for test class [action.in.blog.ActionInBlogApplicationTests]: no resource found for suffixes {-context.xml, Context.groovy}.
03:52:22.497 [main] INFO org.springframework.test.context.support.AnnotationConfigContextLoaderUtils - Could not detect default configuration classes for test class [action.in.blog.ActionInBlogApplicationTests]: ActionInBlogApplicationTests does not declare any static, non-private, non-final, nested classes annotated with @Configuration.
03:52:22.532 [main] DEBUG org.springframework.test.context.support.ActiveProfilesUtils - Could not find an 'annotation declaring class' for annotation type [org.springframework.test.context.ActiveProfiles] and class [action.in.blog.ActionInBlogApplicationTests]
03:52:22.573 [main] DEBUG org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider - Identified candidate component class: file [/Users/junhyunk/Desktop/workspace/blog-in-action/2022-05-30-deploy-spring-boot-project-as-war/action-in-blog/target/classes/action/in/blog/ActionInBlogApplication.class]
03:52:22.574 [main] INFO org.springframework.boot.test.context.SpringBootTestContextBootstrapper - Found @SpringBootConfiguration action.in.blog.ActionInBlogApplication for test class action.in.blog.ActionInBlogApplicationTests
03:52:22.641 [main] DEBUG org.springframework.boot.test.context.SpringBootTestContextBootstrapper - @TestExecutionListeners is not present for class [action.in.blog.ActionInBlogApplicationTests]: using defaults.
03:52:22.642 [main] INFO org.springframework.boot.test.context.SpringBootTestContextBootstrapper - Loaded default TestExecutionListener class names from location [META-INF/spring.factories]: [org.springframework.boot.test.mock.mockito.MockitoTestExecutionListener, org.springframework.boot.test.mock.mockito.ResetMocksTestExecutionListener, org.springframework.boot.test.autoconfigure.restdocs.RestDocsTestExecutionListener, org.springframework.boot.test.autoconfigure.web.client.MockRestServiceServerResetTestExecutionListener, org.springframework.boot.test.autoconfigure.web.servlet.MockMvcPrintOnlyOnFailureTestExecutionListener, org.springframework.boot.test.autoconfigure.web.servlet.WebDriverTestExecutionListener, org.springframework.boot.test.autoconfigure.webservices.client.MockWebServiceServerTestExecutionListener, org.springframework.test.context.web.ServletTestExecutionListener, org.springframework.test.context.support.DirtiesContextBeforeModesTestExecutionListener, org.springframework.test.context.event.ApplicationEventsTestExecutionListener, org.springframework.test.context.support.DependencyInjectionTestExecutionListener, org.springframework.test.context.support.DirtiesContextTestExecutionListener, org.springframework.test.context.transaction.TransactionalTestExecutionListener, org.springframework.test.context.jdbc.SqlScriptsTestExecutionListener, org.springframework.test.context.event.EventPublishingTestExecutionListener]
03:52:22.651 [main] DEBUG org.springframework.boot.test.context.SpringBootTestContextBootstrapper - Skipping candidate TestExecutionListener [org.springframework.test.context.transaction.TransactionalTestExecutionListener] due to a missing dependency. Specify custom listener classes or make the default listener classes and their required dependencies available. Offending class: [org/springframework/transaction/interceptor/TransactionAttributeSource]
03:52:22.651 [main] DEBUG org.springframework.boot.test.context.SpringBootTestContextBootstrapper - Skipping candidate TestExecutionListener [org.springframework.test.context.jdbc.SqlScriptsTestExecutionListener] due to a missing dependency. Specify custom listener classes or make the default listener classes and their required dependencies available. Offending class: [org/springframework/transaction/interceptor/TransactionAttribute]
03:52:22.651 [main] INFO org.springframework.boot.test.context.SpringBootTestContextBootstrapper - Using TestExecutionListeners: [org.springframework.test.context.web.ServletTestExecutionListener@1c852c0f, org.springframework.test.context.support.DirtiesContextBeforeModesTestExecutionListener@a37aefe, org.springframework.test.context.event.ApplicationEventsTestExecutionListener@5d99c6b5, org.springframework.boot.test.mock.mockito.MockitoTestExecutionListener@266374ef, org.springframework.boot.test.autoconfigure.SpringBootDependencyInjectionTestExecutionListener@13b3d178, org.springframework.test.context.support.DirtiesContextTestExecutionListener@24c4ddae, org.springframework.test.context.event.EventPublishingTestExecutionListener@37fb0bed, org.springframework.boot.test.mock.mockito.ResetMocksTestExecutionListener@a82c5f1, org.springframework.boot.test.autoconfigure.restdocs.RestDocsTestExecutionListener@7b7fdc8, org.springframework.boot.test.autoconfigure.web.client.MockRestServiceServerResetTestExecutionListener@51c693d, org.springframework.boot.test.autoconfigure.web.servlet.MockMvcPrintOnlyOnFailureTestExecutionListener@6a57ae10, org.springframework.boot.test.autoconfigure.web.servlet.WebDriverTestExecutionListener@766653e6, org.springframework.boot.test.autoconfigure.webservices.client.MockWebServiceServerTestExecutionListener@4e07b95f]
03:52:22.654 [main] DEBUG org.springframework.test.context.support.AbstractDirtiesContextTestExecutionListener - Before test class: context [DefaultTestContext@6f6745d6 testClass = ActionInBlogApplicationTests, testInstance = [null], testMethod = [null], testException = [null], mergedContextConfiguration = [WebMergedContextConfiguration@27508c5d testClass = ActionInBlogApplicationTests, locations = '{}', classes = '{class action.in.blog.ActionInBlogApplication}', contextInitializerClasses = '[]', activeProfiles = '{}', propertySourceLocations = '{}', propertySourceProperties = '{org.springframework.boot.test.context.SpringBootTestContextBootstrapper=true}', contextCustomizers = set[org.springframework.boot.test.context.filter.ExcludeFilterContextCustomizer@8c3b9d, org.springframework.boot.test.json.DuplicateJsonObjectContextCustomizerFactory$DuplicateJsonObjectContextCustomizer@1e178745, org.springframework.boot.test.mock.mockito.MockitoContextCustomizer@0, org.springframework.boot.test.web.client.TestRestTemplateContextCustomizer@38e79ae3, org.springframework.boot.test.autoconfigure.actuate.metrics.MetricsExportContextCustomizerFactory$DisableMetricExportContextCustomizer@5f8edcc5, org.springframework.boot.test.autoconfigure.properties.PropertyMappingContextCustomizer@0, org.springframework.boot.test.autoconfigure.web.servlet.WebDriverContextCustomizerFactory$Customizer@3e96bacf, org.springframework.boot.test.context.SpringBootTestArgs@1, org.springframework.boot.test.context.SpringBootTestWebEnvironment@3f49dace], resourceBasePath = 'src/main/webapp', contextLoader = 'org.springframework.boot.test.context.SpringBootContextLoader', parent = [null]], attributes = map['org.springframework.test.context.web.ServletTestExecutionListener.activateListener' -> true]], class annotated with @DirtiesContext [false] with mode [null].

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v2.7.0)

2022-05-30 03:52:22.960  INFO 67971 --- [           main] a.in.blog.ActionInBlogApplicationTests   : Starting ActionInBlogApplicationTests using Java 17.0.1 on junhyunk-a01.vmware.com with PID 67971 (started by junhyunk in /Users/junhyunk/Desktop/workspace/blog-in-action/2022-05-30-deploy-spring-boot-project-as-war/action-in-blog)
2022-05-30 03:52:22.961  INFO 67971 --- [           main] a.in.blog.ActionInBlogApplicationTests   : No active profile set, falling back to 1 default profile: "default"
2022-05-30 03:52:23.903  INFO 67971 --- [           main] a.in.blog.ActionInBlogApplicationTests   : Started ActionInBlogApplicationTests in 1.223 seconds (JVM running for 1.973)
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.829 s - in action.in.blog.ActionInBlogApplicationTests
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] 
[INFO] --- maven-war-plugin:3.3.2:war (default-war) @ action-in-blog ---
[INFO] Packaging webapp
[INFO] Assembling webapp [action-in-blog] in [/Users/junhyunk/Desktop/workspace/blog-in-action/2022-05-30-deploy-spring-boot-project-as-war/action-in-blog/target/action-in-blog-0.0.1-SNAPSHOT]
[INFO] Processing war project
[INFO] Building war: /Users/junhyunk/Desktop/workspace/blog-in-action/2022-05-30-deploy-spring-boot-project-as-war/action-in-blog/target/action-in-blog-0.0.1-SNAPSHOT.war
[INFO] 
[INFO] --- spring-boot-maven-plugin:2.7.0:repackage (repackage) @ action-in-blog ---
[INFO] Replacing main artifact with repackaged archive
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  4.625 s
[INFO] Finished at: 2022-05-30T03:52:25+09:00
[INFO] ------------------------------------------------------------------------
```

### 3.2. 톰캣 실행 및 패키지 업로드

##### 톰캣 실행

- `/{TOMCAT_HOME}/bin` 경로에 위치한 `startup.sh` 파일을 실행합니다.

```
$ sh ~/apache-tomcat-8.5.79/bin/startup.sh
Using CATALINA_BASE:   /Users/junhyunk/apache-tomcat-8.5.79
Using CATALINA_HOME:   /Users/junhyunk/apache-tomcat-8.5.79
Using CATALINA_TMPDIR: /Users/junhyunk/apache-tomcat-8.5.79/temp
Using JRE_HOME:        /Library/Java/JavaVirtualMachines/jdk-11.0.13.jdk/Contents/Home
Using CLASSPATH:       /Users/junhyunk/apache-tomcat-8.5.79/bin/bootstrap.jar:/Users/junhyunk/apache-tomcat-8.5.79/bin/tomcat-juli.jar
Using CATALINA_OPTS:
Tomcat started.
```

##### WAR 패키지 업로드

- `rm` 명령어를 통해 이전 배포 내용을 삭제합니다.
- `Spring-Boot` 프로젝트 `/target` 경로에 위치한 WAR 파일을 `/{TOMCAT_HOME}/webapp` 경로로 이동합니다.

```
$ rm -rf ~/apache-tomcat-8.5.79/webapps/ROOT

$ mv target/action-in-blog-0.0.1-SNAPSHOT.war ~/apache-tomcat-8.5.79/webapps/ROOT.war
```

### 톰캣 로그 확인

- `tail` 명령어를 통해 로그를 확인합니다.

```
$ tail -f -n 100 ~/apache-tomcat-8.5.79/logs/catalina.out
NOTE: Picked up JDK_JAVA_OPTIONS:  --add-opens=java.base/java.lang=ALL-UNNAMED --add-opens=java.base/java.io=ALL-UNNAMED --add-opens=java.base/java.util=ALL-UNNAMED --add-opens=java.base/java.util.concurrent=ALL-UNNAMED --add-opens=java.rmi/sun.rmi.transport=ALL-UNNAMED
30-May-2022 04:10:14.180 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log 서버 버전 이름:    Apache Tomcat/8.5.79
30-May-2022 04:10:14.183 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log Server 빌드 시각:  May 16 2022 15:36:23 UTC
30-May-2022 04:10:14.184 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log Server 버전 번호:  8.5.79.0
30-May-2022 04:10:14.184 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log 운영체제 이름:     Mac OS X
30-May-2022 04:10:14.184 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log 운영체제 버전:     11.3
30-May-2022 04:10:14.185 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log 아키텍처:          x86_64
30-May-2022 04:10:14.185 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log 자바 홈:           /Library/Java/JavaVirtualMachines/jdk-11.0.13.jdk/Contents/Home
30-May-2022 04:10:14.185 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log JVM 버전:          11.0.13+10-LTS-370
30-May-2022 04:10:14.185 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log JVM 벤더:          Oracle Corporation
30-May-2022 04:10:14.185 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log CATALINA_BASE:     /Users/junhyunk/apache-tomcat-8.5.79
30-May-2022 04:10:14.185 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log CATALINA_HOME:     /Users/junhyunk/apache-tomcat-8.5.79
30-May-2022 04:10:14.187 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log 명령 행 아규먼트:  --add-opens=java.base/java.lang=ALL-UNNAMED
30-May-2022 04:10:14.187 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log 명령 행 아규먼트:  --add-opens=java.base/java.io=ALL-UNNAMED
30-May-2022 04:10:14.187 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log 명령 행 아규먼트:  --add-opens=java.base/java.util=ALL-UNNAMED
30-May-2022 04:10:14.187 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log 명령 행 아규먼트:  --add-opens=java.base/java.util.concurrent=ALL-UNNAMED
30-May-2022 04:10:14.188 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log 명령 행 아규먼트:  --add-opens=java.rmi/sun.rmi.transport=ALL-UNNAMED
30-May-2022 04:10:14.188 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log 명령 행 아규먼트:  -Djava.util.logging.config.file=/Users/junhyunk/apache-tomcat-8.5.79/conf/logging.properties
30-May-2022 04:10:14.188 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log 명령 행 아규먼트:  -Djava.util.logging.manager=org.apache.juli.ClassLoaderLogManager
30-May-2022 04:10:14.188 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log 명령 행 아규먼트:  -Djdk.tls.ephemeralDHKeySize=2048
30-May-2022 04:10:14.188 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log 명령 행 아규먼트:  -Djava.protocol.handler.pkgs=org.apache.catalina.webresources
30-May-2022 04:10:14.188 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log 명령 행 아규먼트:  -Dorg.apache.catalina.security.SecurityListener.UMASK=0027
30-May-2022 04:10:14.188 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log 명령 행 아규먼트:  -Dignore.endorsed.dirs=
30-May-2022 04:10:14.188 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log 명령 행 아규먼트:  -Dcatalina.base=/Users/junhyunk/apache-tomcat-8.5.79
30-May-2022 04:10:14.189 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log 명령 행 아규먼트:  -Dcatalina.home=/Users/junhyunk/apache-tomcat-8.5.79
30-May-2022 04:10:14.189 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log 명령 행 아규먼트:  -Djava.io.tmpdir=/Users/junhyunk/apache-tomcat-8.5.79/temp
30-May-2022 04:10:14.189 INFO [main] org.apache.catalina.core.AprLifecycleListener.lifecycleEvent 프로덕션 환경들에서 최적의 성능을 제공하는, APR 기반 Apache Tomcat Native 라이브러리가, 다음 java.library.path에서 발견되지 않습니다: [/Users/junhyunk/Library/Java/Extensions:/Library/Java/Extensions:/Network/Library/Java/Extensions:/System/Library/Java/Extensions:/usr/lib/java:.]
30-May-2022 04:10:14.226 INFO [main] org.apache.coyote.AbstractProtocol.init 프로토콜 핸들러 ["http-nio-8080"]을(를) 초기화합니다.
30-May-2022 04:10:14.253 INFO [main] org.apache.catalina.startup.Catalina.load Initialization processed in 467 ms
30-May-2022 04:10:14.297 INFO [main] org.apache.catalina.core.StandardService.startInternal 서비스 [Catalina]을(를) 시작합니다.
30-May-2022 04:10:14.297 INFO [main] org.apache.catalina.core.StandardEngine.startInternal 서버 엔진을 시작합니다: [Apache Tomcat/8.5.79]
30-May-2022 04:10:14.316 INFO [localhost-startStop-1] org.apache.catalina.startup.HostConfig.deployWAR 웹 애플리케이션 아카이브 [/Users/junhyunk/apache-tomcat-8.5.79/webapps/ROOT.war]을(를) 배치합니다.
30-May-2022 04:10:15.486 INFO [localhost-startStop-1] org.apache.jasper.servlet.TldScanner.scanJars 적어도 하나의 JAR가 TLD들을 찾기 위해 스캔되었으나 아무 것도 찾지 못했습니다. 스캔했으나 TLD가 없는 JAR들의 전체 목록을 보시려면, 로그 레벨을 디버그 레벨로 설정하십시오. 스캔 과정에서 불필요한 JAR들을 건너뛰면, 시스템 시작 시간과 JSP 컴파일 시간을 단축시킬 수 있습니다.

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v2.7.0)

2022-05-30 04:10:16.080  INFO 75699 --- [ost-startStop-1] action.in.blog.ActionInBlogApplication   : Starting ActionInBlogApplication v0.0.1-SNAPSHOT using Java 11.0.13 on junhyunk-a01.vmware.com with PID 75699 (/Users/junhyunk/apache-tomcat-8.5.79/webapps/ROOT/WEB-INF/classes started by junhyunk in /Users/junhyunk)
2022-05-30 04:10:16.083  INFO 75699 --- [ost-startStop-1] action.in.blog.ActionInBlogApplication   : No active profile set, falling back to 1 default profile: "default"
2022-05-30 04:10:16.686  INFO 75699 --- [ost-startStop-1] w.s.c.ServletWebServerApplicationContext : Root WebApplicationContext: initialization completed in 577 ms
2022-05-30 04:10:17.149  INFO 75699 --- [ost-startStop-1] action.in.blog.ActionInBlogApplication   : Started ActionInBlogApplication in 1.474 seconds (JVM running for 3.61)
30-May-2022 04:10:17.179 INFO [localhost-startStop-1] org.apache.catalina.startup.HostConfig.deployWAR 웹 애플리케이션 아카이브 [/Users/junhyunk/apache-tomcat-8.5.79/webapps/ROOT.war]의 배치가 [2,863] 밀리초에 완료되었습니다.
30-May-2022 04:10:17.180 INFO [localhost-startStop-1] org.apache.catalina.startup.HostConfig.deployDirectory 웹 애플리케이션 디렉토리 [/Users/junhyunk/apache-tomcat-8.5.79/webapps/docs]을(를) 배치합니다.
30-May-2022 04:10:17.194 INFO [localhost-startStop-1] org.apache.catalina.startup.HostConfig.deployDirectory 웹 애플리케이션 디렉토리 [/Users/junhyunk/apache-tomcat-8.5.79/webapps/docs]에 대한 배치가 [14] 밀리초에 완료되었습니다.
30-May-2022 04:10:17.194 INFO [localhost-startStop-1] org.apache.catalina.startup.HostConfig.deployDirectory 웹 애플리케이션 디렉토리 [/Users/junhyunk/apache-tomcat-8.5.79/webapps/manager]을(를) 배치합니다.
30-May-2022 04:10:17.219 INFO [localhost-startStop-1] org.apache.catalina.startup.HostConfig.deployDirectory 웹 애플리케이션 디렉토리 [/Users/junhyunk/apache-tomcat-8.5.79/webapps/manager]에 대한 배치가 [24] 밀리초에 완료되었습니다.
30-May-2022 04:10:17.219 INFO [localhost-startStop-1] org.apache.catalina.startup.HostConfig.deployDirectory 웹 애플리케이션 디렉토리 [/Users/junhyunk/apache-tomcat-8.5.79/webapps/examples]을(를) 배치합니다.
30-May-2022 04:10:17.360 INFO [localhost-startStop-1] org.apache.catalina.startup.HostConfig.deployDirectory 웹 애플리케이션 디렉토리 [/Users/junhyunk/apache-tomcat-8.5.79/webapps/examples]에 대한 배치가 [141] 밀리초에 완료되었습니다.
30-May-2022 04:10:17.360 INFO [localhost-startStop-1] org.apache.catalina.startup.HostConfig.deployDirectory 웹 애플리케이션 디렉토리 [/Users/junhyunk/apache-tomcat-8.5.79/webapps/host-manager]을(를) 배치합니다.
30-May-2022 04:10:17.375 INFO [localhost-startStop-1] org.apache.catalina.startup.HostConfig.deployDirectory 웹 애플리케이션 디렉토리 [/Users/junhyunk/apache-tomcat-8.5.79/webapps/host-manager]에 대한 배치가 [14] 밀리초에 완료되었습니다.
30-May-2022 04:10:17.379 INFO [main] org.apache.coyote.AbstractProtocol.start 프로토콜 핸들러 ["http-nio-8080"]을(를) 시작합니다.
30-May-2022 04:10:17.388 INFO [main] org.apache.catalina.startup.Catalina.start Server startup in 3134 ms
2022-05-30 04:10:20.415  INFO 75699 --- [nio-8080-exec-1] o.s.web.servlet.DispatcherServlet        : Initializing Servlet 'dispatcherServlet'
2022-05-30 04:10:20.416  INFO 75699 --- [nio-8080-exec-1] o.s.web.servlet.DispatcherServlet        : Completed initialization in 1 ms
```

##### 배포 결과 확인

<p align="left">
    <img src="/images/deploy-spring-boot-project-as-war-1.gif" width="100%" class="image__border">
</p>

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-05-30-deploy-spring-boot-project-as-war>

#### REFERENCE

- <https://oingdaddy.tistory.com/344>
- <https://oingdaddy.tistory.com/346>
- <https://recordsoflife.tistory.com/392>