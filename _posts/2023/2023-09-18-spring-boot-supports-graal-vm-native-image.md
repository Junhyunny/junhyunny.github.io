---
title: "Spring Boot Supports GraalVM Native Image"
search: false
category:
  - java
  - spring-boot
last_modified_at: 2023-09-18T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [GraalVM][graal-vm-link]
* [Dynamic Proxy in Java][dynamic-proxy-in-java-link]

## 0. 들어가면서

스프링 부트(spring boot) 3.X 버전에 관련된 내용들을 보면 GraalVM 지원에 대한 이야기가 있습니다 .
이전 포스트에서 [GraalVM][graal-vm-link]에 대한 내용을 정리하였고, 이번엔 간단한 네이티브 이미지를 만들어보겠습니다. 
이번 글에서 사용하는 AOT(Ahead of Time) 컴파일러에 대한 내용은 이전 포스트를 참조하시길 바랍니다.

## 1. Dynamic Features Limitation of Native Image 

GraalVM은 AOT 컴파일러를 사용해 네이티브 이미지를 빌드합니다. 
이 과정에서 AOT 컴파일러는 정적 코드 분석과 최적화를 통해 바이트 코드를 운영체제에 맞는 머신 코드로 컴파일합니다. 
정적 코드 분석을 통해 머신 코드를 만들기 때문에 다음과 같은 동적 기능들을 사용하는데 제약이 생깁니다. 

* Accessing Resources
* Certificate Management
* Dynamic Proxy
* Java Native Interface (JNI)
* JCA Security Services
* Reflection
* URL Protocols

## 2. Understanding Spring Ahead-of-Time Processing

스프링 프레임워크는 런타임에 내부적으로 동적 프록시(dynamic proxy), 리플렉션(reflection) 기능을 사용합니다. 
그렇기 때문에 스프링의 일부 동적 기능들에 대한 사용이 제한됩니다. 
GraalVM에 의해 만들어지는 네이티브 이미지를 닫힌 세계(closed-world)라고 표현하는데 다음과 같은 동적 기능들이 제한됩니다.

* 클래스 경로(classpath)는 빌드 시에 고정되고, 완전히 정의되어집니다.
* 어플리케이션에 정의된 빈(bean)들은 런타임에 변경될 수 없습니다.
    * @Profile 애너테이션과 프로파일 정의에 따른 선택적 설정에 제한이 있습니다.
    * @ConditionalOnProperty 애너테이션이나 `.enable` 속성들처럼 빈 생성 시 변경되는 기능은 지원되지 않습니다.

위 제한 사항들 때문에 스프링 프레임워크는 빌드 타임에 GraalVM이 사용할 수 있는 추가적인 애셋(asset)들을 생성합니다. 

* Java 소스 코드
* 동적 프록시를 위한 바이트 코드(bytecode)
* GraalVM JSON 힌트 파일들
    * resource-config.json - 리소스 힌트
    * reflect-config.json - 리플렉션 힌트
    * serialization-config.json - 직렬화 힌트
    * proxy-config.json - 프록시 힌트
    * jni-config.json - JNI(Java Native Interface) 힌트

프로젝트를 빌드하면 다음과 같은 결과물들이 만들어집니다. 

<p align="left">
    <img src="/images/spring-boot-supports-graal-vm-native-image-1.JPG" width="40%" class="image__border">
</p>

## 3. Prerequisites

네이티브 이미지를 생성하려면 GraalVM JDK(Java Devleopment Kit)가 필요합니다. 
GraalVM 공식 홈페이지에서 제공하는 JDK를 사용하면 에러가 발생하기 때문에 스프링 공식 문서에 명시된 JDK를 사용합니다. 
필자의 개발 환경은 다음과 같습니다.

* MacBook Pro
* 2.4 GHz 8코어 Intel Core i9
* IntelliJ

### 3.1. Install SDKMAN 

공식 문서를 보면 `SDKMAN`을 사용할 것을 느낌표를 붙혀가면서 강력하게 추천합니다. 

> To build a native image using the Native Build Tools, you’ll need a GraalVM distribution on your machine. You can either download it manually on the Liberica Native Image Kit page, or you can use a download manager like SDKMAN!. 

> To install the native image compiler on macOS or Linux, we recommend using SDKMAN!. Get SDKMAN! from sdkman.io and install the Liberica GraalVM distribution by using the following commands:

[sdkman.io](https://sdkman.io/) 사이트의 설치 방법을 따라 SDKMAN 설치합니다.

```
$ curl -s "https://get.sdkman.io" | bash
```

### 3.2. Install GraalVM JDK

* JDK를 설치합니다.

```
$ sdk install java 23.r17-nik

Downloading: java 23.r17-nik

In progress...

################################################################################################################ 100.0%

Repackaging Java 23.r17-nik...

Done repackaging...
Cleaning up residual files...

Installing: java 23.r17-nik
Done installing!


Setting java 23.r17-nik as default.
```

* 기본 JDK를 변경합니다.

```
$ sdk use java 23.r17-nik              

Using java version 23.r17-nik in this shell.
```

* Java 버전을 확인합니다.

```
$ java -version

openjdk version "17.0.7" 2023-04-18 LTS
OpenJDK Runtime Environment Liberica-NIK-23.0.0-1 (build 17.0.7+7-LTS)
OpenJDK 64-Bit Server VM Liberica-NIK-23.0.0-1 (build 17.0.7+7-LTS, mixed mode, sharing)
```

## 4. Project Setup

이번 예제에선 코드를 자세히 살펴보지 않습니다. 
다음과 같은 간단한 어플리케이션 서비스를 네이티브 이미지로 만들고 실행시킵니다. 

* 포켓몬 정보를 반환하는 API 서비스입니다.
* 프로파일 설정에 따라 다른 방식으로 동작합니다.
    * local 프로파일인 경우 메모리에 있는 포켓몬 정보를 반환합니다.
    * dev 프로파일인 경우 외부 서비스에 있는 포켓몬 정보를 반환합니다.
    * 프로파일을 바꿔가면서 빌드하고 테스트합니다.

<p align="center">
    <img src="/images/spring-boot-supports-graal-vm-native-image-2.JPG" width="100%" class="image__border">
</p>

### 4.1. Setup JDK for Module

프로젝트를 생성한 후 모듈 설정에서 SDK를 이전 단계에서 설치한 JDK로 변경합니다.

* 모듈 설정`(COMMAND + ;)`으로 진입합니다.
* 이전 단계에서 다운로드 받은 liberica-17 JDK를 설정합니다.

<p align="center">
    <img src="/images/spring-boot-supports-graal-vm-native-image-3.JPG" width="80%" class="image__border">
</p>

### 4.2. build.gradle

그레이들(gradle) 프로젝트입니다.

* 네이티브 이미지를 생성할 수 있는 작업(task)들을 사용하기 위해 `org.graalvm.buildtools.native` 플러그인을 추가합니다.

```gradle
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.1.3'
    id 'io.spring.dependency-management' version '1.1.3'
    id 'org.graalvm.buildtools.native' version '0.9.24'
}

group = 'action.in.blog'
version = '0.0.1-SNAPSHOT'

java {
    sourceCompatibility = '17'
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    compileOnly 'org.projectlombok:lombok:1.18.28'
    annotationProcessor 'org.projectlombok:lombok:1.18.28'
    testCompileOnly 'org.projectlombok:lombok:1.18.28'
    testAnnotationProcessor 'org.projectlombok:lombok:1.18.28'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

### 4.3. application.yml

설정 파일을 통해 어플리케이션 프로파일을 변경하면서 테스트합니다.

```yml
spring:
  profiles:
    active: local
```

### 4.4. Proxies

다음과 같은 구현체 클래스들이 존재합니다. 
설정 파일을 통해 활성화 된 프로파일에 해당하는 빈을 주입하여 사용합니다.

#### 4.4.1. LocalPokemonProxy Class

* 로컬 혹은 테스트에서 사용합니다.

```java
package action.in.blog.proxy.impl;

import action.in.blog.domain.Pokemon;
import action.in.blog.domain.PokemonResponse;
import action.in.blog.proxy.PokemonProxy;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.List;

@Profile(value = {"local", "test"})
@Service
public class LocalPokemonProxy implements PokemonProxy {

    @Override
    public PokemonResponse getPokemons() {
        return PokemonResponse.builder()
                .count(3)
                .next("https://pokeapi.co/api/v2/pokemon?offset=10&limit=10")
                .results(
                        List.of(
                                new Pokemon("bulbasaur", "https://pokeapi.co/api/v2/pokemon/1/"),
                                new Pokemon("ivysaur", "https://pokeapi.co/api/v2/pokemon/2/"),
                                new Pokemon("venusaur", "https://pokeapi.co/api/v2/pokemon/3/")
                        )
                )
                .build();
    }
}
```

#### 4.4.2. DefaultPokemonProxy Class

* 로컬, 테스트 환경이 아닌 경우 사용합니다.

```java
package action.in.blog.proxy.impl;

import action.in.blog.domain.PokemonResponse;
import action.in.blog.proxy.PokemonProxy;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Profile("!local & !test")
@Service
public class DefaultPokemonProxy implements PokemonProxy {

    private final RestTemplate restTemplate;

    public DefaultPokemonProxy() {
        this.restTemplate = new RestTemplate();
    }

    @Override
    public PokemonResponse getPokemons() {
        return restTemplate.getForObject("https://pokeapi.co/api/v2/pokemon", PokemonResponse.class);
    }
}
```

## 5. Practice

네이티브 이미지를 실행하는 방법은 두가지입니다. 

* 로컬 머신에 적합한 네이티브 이미지를 생성하고 실행합니다.
    * `jar` 패키지 파일이 아니라 실행 파일이 생성됩니다.
* 빌드팩(buildpack) 기반으로 컨테이너 이미지를 생성하고 이를 실행합니다.
    * 도커(docker) 같은 컨테이너 런타임이 필요합니다.

### 5.1. Run Application

어플리케이션 실행 속도 차이를 확인하기 위해 IDE를 사용해 어플리케이션을 실행합니다. 
빌드한 `jar` 패키지 파일을 실행해도 좋습니다. 

* 어플리케이션 실행까지 1.221초 소요됩니다.

```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.1.3)

2023-09-18T10:57:01.010+09:00  INFO 20936 --- [           main] action.in.blog.ActionInBlogApplication   : Starting ActionInBlogApplication using Java 17.0.8 with PID 20936 (/Users/junhyunk/Desktop/action-in-blog/build/classes/java/main started by junhyunk in /Users/junhyunk/Desktop/action-in-blog)
2023-09-18T10:57:01.012+09:00  INFO 20936 --- [           main] action.in.blog.ActionInBlogApplication   : The following 1 profile is active: "dev"
2023-09-18T10:57:01.596+09:00  INFO 20936 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port(s): 8080 (http)
2023-09-18T10:57:01.602+09:00  INFO 20936 --- [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
2023-09-18T10:57:01.602+09:00  INFO 20936 --- [           main] o.apache.catalina.core.StandardEngine    : Starting Servlet engine: [Apache Tomcat/10.1.12]
2023-09-18T10:57:01.661+09:00  INFO 20936 --- [           main] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring embedded WebApplicationContext
2023-09-18T10:57:01.662+09:00  INFO 20936 --- [           main] w.s.c.ServletWebServerApplicationContext : Root WebApplicationContext: initialization completed in 611 ms
2023-09-18T10:57:01.912+09:00  INFO 20936 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8080 (http) with context path ''
2023-09-18T10:57:01.919+09:00  INFO 20936 --- [           main] action.in.blog.ActionInBlogApplication   : Started ActionInBlogApplication in 1.221 seconds (process running for 1.684)
```

### 5.2. Native Run

그레이들 명령어로 네이티브 이미지를 생성합니다.

* `./gradlew nativeCompile` 명령어를 사용합니다. 
* 컴파일 과정에서 정적 코드 분석을 수행합니다.
* 빌드 시간이 약 3분 정도 소요됩니다.
    * 정적 코드 분석, 메모리 최적화, 힌트 생성 등으로 일반적인 빌드 시간보다 더 오래걸립니다. 

```
$ ./gradlew nativeCompile

> Task :processAot

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.1.3)

2023-09-18T11:02:29.603+09:00  INFO 21251 --- [           main] action.in.blog.ActionInBlogApplication   : Starting ActionInBlogApplication using Java 17.0.7 with PID 21251 (/Users/junhyunk/Desktop/action-in-blog/build/classes/java/main started by junhyunk in /Users/junhyunk/Desktop/action-in-blog)
2023-09-18T11:02:29.606+09:00  INFO 21251 --- [           main] action.in.blog.ActionInBlogApplication   : The following 1 profile is active: "dev"

> Task :compileAotJava
Note: /Users/junhyunk/Desktop/action-in-blog/build/generated/aotSources/org/springframework/boot/autoconfigure/web/servlet/WebMvcAutoConfiguration__BeanDefinitions.java uses or overrides a deprecated API.
Note: Recompile with -Xlint:deprecation for details.

> Task :generateResourcesConfigFile
[native-image-plugin] Resources configuration written into /Users/junhyunk/Desktop/action-in-blog/build/native/generated/generateResourcesConfigFile/resource-config.json

> Task :nativeCompile
[native-image-plugin] GraalVM Toolchain detection is disabled
[native-image-plugin] GraalVM location read from environment variable: JAVA_HOME
[native-image-plugin] Native Image executable path: /Users/junhyunk/.sdkman/candidates/java/23.r17-nik/lib/svm/bin/native-image
========================================================================================================================
GraalVM Native Image: Generating 'action-in-blog' (executable)...
========================================================================================================================
[1/8] Initializing...                                                                                   (12.8s @ 0.24GB)
 Java version: 17.0.7+7-LTS, vendor version: Liberica-NIK-23.0.0-1
 Graal compiler: optimization level: 2, target machine: x86-64-v3
 C compiler: cc (apple, x86_64, 14.0.3)
 Garbage collector: Serial GC (max heap size: 80% of RAM)
 1 user-specific feature(s)
 - org.springframework.aot.nativex.feature.PreComputeFieldFeature
Field org.apache.commons.logging.LogAdapter#log4jSpiPresent set to true at build time
Field org.apache.commons.logging.LogAdapter#log4jSlf4jProviderPresent set to true at build time
Field org.apache.commons.logging.LogAdapter#slf4jSpiPresent set to true at build time
Field org.apache.commons.logging.LogAdapter#slf4jApiPresent set to true at build time
Field org.springframework.core.KotlinDetector#kotlinPresent set to false at build time

...

Field org.springframework.web.servlet.support.RequestContext#jstlPresent set to false at build time
[2/8] Performing analysis...  [*******]                                                                 (37.1s @ 1.43GB)
  15,225 (90.49%) of 16,825 types reachable
  25,073 (67.63%) of 37,076 fields reachable
  74,203 (63.53%) of 116,805 methods reachable
   4,756 types,   266 fields, and 4,976 methods registered for reflection
      64 types,    71 fields, and    55 methods registered for JNI access
       5 native libraries: -framework CoreServices, -framework Foundation, dl, pthread, z
[3/8] Building universe...                                                                               (5.0s @ 1.39GB)
[4/8] Parsing methods...      [**]                                                                       (3.6s @ 1.37GB)
[5/8] Inlining methods...     [****]                                                                     (2.6s @ 1.83GB)
[6/8] Compiling methods...    [*****]                                                                   (28.6s @ 4.62GB)
[7/8] Layouting methods...    [***]                                                                      (6.7s @ 2.61GB)
[8/8] Creating image...       [***]                                                                      (6.6s @ 3.68GB)
  37.09MB (52.79%) for code area:    48,372 compilation units
  32.82MB (46.72%) for image heap:  381,342 objects and 117 resources
 350.30kB ( 0.49%) for other data
  70.25MB in total
------------------------------------------------------------------------------------------------------------------------
Top 10 origins of code area:                                Top 10 object types in image heap:
  13.24MB java.base                                            8.14MB byte[] for code metadata
   4.51MB tomcat-embed-core-10.1.12.jar                        3.63MB java.lang.Class
   2.93MB java.xml                                             3.59MB java.lang.String
   2.03MB jackson-databind-2.15.2.jar                          3.14MB byte[] for general heap data
   1.57MB spring-core-6.0.11.jar                               3.06MB byte[] for java.lang.String
   1.31MB spring-boot-3.1.3.jar                                1.28MB com.oracle.svm.core.hub.DynamicHubCompanion
   1.30MB svm.jar (Native Image)                             922.18kB byte[] for reflection metadata
   1.00MB spring-web-6.0.11.jar                              778.69kB byte[] for embedded resources
 920.21kB spring-beans-6.0.11.jar                            695.70kB java.lang.String[]
 862.74kB spring-webmvc-6.0.11.jar                           663.14kB java.util.HashMap$Node
   7.11MB for 70 more packages                                 6.11MB for 3165 more object types
------------------------------------------------------------------------------------------------------------------------
Recommendations:
 HEAP: Set max heap for improved and more predictable memory usage.
 CPU:  Enable more CPU features with '-march=native' for improved performance.
------------------------------------------------------------------------------------------------------------------------
                        6.0s (5.7% of total time) in 66 GCs | Peak RSS: 6.30GB | CPU load: 9.54
------------------------------------------------------------------------------------------------------------------------
Produced artifacts:
 /Users/junhyunk/Desktop/action-in-blog/build/native/nativeCompile/action-in-blog (executable)
========================================================================================================================
Finished generating 'action-in-blog' in 1m 44s.
[native-image-plugin] Native Image written to: /Users/junhyunk/Desktop/action-in-blog/build/native/nativeCompile

Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.

You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come from your own scripts or plugins.

For more on this, please refer to https://docs.gradle.org/8.2.1/userguide/command_line_interface.html#sec:command_line_warnings in the Gradle documentation.

BUILD SUCCESSFUL in 1m 54s
9 actionable tasks: 9 executed
```

그레이들 명령어로 네이티브 이미지를 실행합니다.

* `./gradlew nativeRun` 명령어를 사용합니다. 
* 어플리케이션 실행까지 0.06초 소요됩니다.
    * 일반 실행보다 약 20배 이상 빠릅니다.

```
$  ./gradlew nativeRun

> Task :nativeRun

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.1.3)

2023-09-18T11:09:25.040+09:00  INFO 21882 --- [           main] action.in.blog.ActionInBlogApplication   : Starting AOT-processed ActionInBlogApplication using Java 17.0.7 with PID 21882 (/Users/junhyunk/Desktop/action-in-blog/build/native/nativeCompile/action-in-blog started by junhyunk in /Users/junhyunk/Desktop/action-in-blog)
2023-09-18T11:09:25.040+09:00  INFO 21882 --- [           main] action.in.blog.ActionInBlogApplication   : The following 1 profile is active: "dev"
2023-09-18T11:09:25.057+09:00  INFO 21882 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port(s): 8080 (http)
2023-09-18T11:09:25.058+09:00  INFO 21882 --- [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
2023-09-18T11:09:25.058+09:00  INFO 21882 --- [           main] o.apache.catalina.core.StandardEngine    : Starting Servlet engine: [Apache Tomcat/10.1.12]
2023-09-18T11:09:25.066+09:00  INFO 21882 --- [           main] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring embedded WebApplicationContext
2023-09-18T11:09:25.066+09:00  INFO 21882 --- [           main] w.s.c.ServletWebServerApplicationContext : Root WebApplicationContext: initialization completed in 26 ms
2023-09-18T11:09:25.087+09:00  INFO 21882 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8080 (http) with context path ''
2023-09-18T11:09:25.087+09:00  INFO 21882 --- [           main] action.in.blog.ActionInBlogApplication   : Started ActionInBlogApplication in 0.06 seconds (process running for 0.072)
```

빌드 경로에 생성된 파일을 직접 실행하는 것도 가능합니다.

* `./build/native/nativeCompile/action-in-blog` 파일을 실행합니다. 
* 실행 결과는 그레이들 태스크와 동일합니다.

```
$ ./build/native/nativeCompile/action-in-blog 

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.1.3)

2023-09-18T11:11:44.279+09:00  INFO 22152 --- [           main] action.in.blog.ActionInBlogApplication   : Starting AOT-processed ActionInBlogApplication using Java 17.0.7 with PID 22152 (/Users/junhyunk/Desktop/action-in-blog/build/native/nativeCompile/action-in-blog started by junhyunk in /Users/junhyunk/Desktop/action-in-blog)
2023-09-18T11:11:44.280+09:00  INFO 22152 --- [           main] action.in.blog.ActionInBlogApplication   : The following 1 profile is active: "dev"
2023-09-18T11:11:44.297+09:00  INFO 22152 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port(s): 8080 (http)
2023-09-18T11:11:44.298+09:00  INFO 22152 --- [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
2023-09-18T11:11:44.298+09:00  INFO 22152 --- [           main] o.apache.catalina.core.StandardEngine    : Starting Servlet engine: [Apache Tomcat/10.1.12]
2023-09-18T11:11:44.307+09:00  INFO 22152 --- [           main] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring embedded WebApplicationContext
2023-09-18T11:11:44.307+09:00  INFO 22152 --- [           main] w.s.c.ServletWebServerApplicationContext : Root WebApplicationContext: initialization completed in 27 ms
2023-09-18T11:11:44.327+09:00  INFO 22152 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8080 (http) with context path ''
2023-09-18T11:11:44.327+09:00  INFO 22152 --- [           main] action.in.blog.ActionInBlogApplication   : Started ActionInBlogApplication in 0.06 seconds (process running for 0.072)
```

### 5.3. Native Image with Container

컨테이너 환경에서 동작할 수 있는 네이티브 이미지를 빌드합니다. 
해당 작업을 수행할 땐 도커 같은 컨테이너 런타임이 필요합니다.

* `./gradlew bootBuildImage` 명령어를 사용합니다.
* 컨테이너 이미지 빌드에 시간이 약 4분 소요됩니다.
    * 빌드팩 기반으로 컨테이너 이미지를 생성합니다.
    * 정적 코드 분석, 메모리 최적화, 힌트 생성 등으로 일반적인 빌드 시간보다 더 오래걸립니다. 
* 생성된 이미지 이름은 `docker.io/library/action-in-blog:0.0.1-SNAPSHOT` 입니다.

```
$ ./gradlew bootBuildImage                   

> Task :bootBuildImage
Building image 'docker.io/library/action-in-blog:0.0.1-SNAPSHOT'

 > Pulling builder image 'docker.io/paketobuildpacks/builder:tiny' ..................................................
 > Pulled builder image 'paketobuildpacks/builder@sha256:1a59354925fcb7ba54744b8017630c97c2b035e1a9e19309330557b9c66bfc2c'
 > Pulling run image 'docker.io/paketobuildpacks/run:tiny-cnb' ..................................................
 > Pulled run image 'paketobuildpacks/run@sha256:adf913cf28031f2090aeaedac65edb36f2987d81a23a8dffab5ea18ca216c94c'
 > Executing lifecycle version v0.16.5
 > Using build cache volume 'pack-cache-29e09935f167.build'

 > Running creator
    [creator]     ===> ANALYZING
    [creator]     Restoring data for SBOM from previous image
    [creator]     ===> DETECTING
    [creator]     6 of 15 buildpacks participating
    [creator]     paketo-buildpacks/ca-certificates   3.6.3
    [creator]     paketo-buildpacks/bellsoft-liberica 10.2.6
    [creator]     paketo-buildpacks/syft              1.32.1
    [creator]     paketo-buildpacks/executable-jar    6.7.4
    [creator]     paketo-buildpacks/spring-boot       5.26.1
    [creator]     paketo-buildpacks/native-image      5.12.1
    [creator]     ===> RESTORING
    [creator]     Restoring metadata for "paketo-buildpacks/ca-certificates:helper" from app image
    [creator]     Restoring metadata for "paketo-buildpacks/bellsoft-liberica:native-image-svm" from cache
    [creator]     Restoring metadata for "paketo-buildpacks/syft:syft" from cache
    [creator]     Restoring metadata for "paketo-buildpacks/native-image:native-image" from cache
    [creator]     Restoring data for "paketo-buildpacks/bellsoft-liberica:native-image-svm" from cache
    [creator]     Restoring data for "paketo-buildpacks/syft:syft" from cache
    [creator]     Restoring data for "paketo-buildpacks/native-image:native-image" from cache
    [creator]     Restoring data for SBOM from cache
    [creator]     ===> BUILDING
    [creator]     
    [creator]     Paketo Buildpack for CA Certificates 3.6.3
    [creator]       https://github.com/paketo-buildpacks/ca-certificates
    [creator]       Launch Helper: Reusing cached layer
    [creator]     
    [creator]     Paketo Buildpack for BellSoft Liberica 10.2.6
    [creator]       https://github.com/paketo-buildpacks/bellsoft-liberica
    [creator]       Build Configuration:
    [creator]         $BP_JVM_JLINK_ARGS           --no-man-pages --no-header-files --strip-debug --compress=1  configure custom link arguments (--output must be omitted)
    [creator]         $BP_JVM_JLINK_ENABLED        false                                                        enables running jlink tool to generate custom JRE
    [creator]         $BP_JVM_TYPE                 JRE                                                          the JVM type - JDK or JRE
    [creator]         $BP_JVM_VERSION              17                                                           the Java version
    [creator]       Launch Configuration:
    [creator]         $BPL_DEBUG_ENABLED           false                                                        enables Java remote debugging support
    [creator]         $BPL_DEBUG_PORT              8000                                                         configure the remote debugging port
    [creator]         $BPL_DEBUG_SUSPEND           false                                                        configure whether to suspend execution until a debugger has attached
    [creator]         $BPL_HEAP_DUMP_PATH                                                                       write heap dumps on error to this path
    [creator]         $BPL_JAVA_NMT_ENABLED        true                                                         enables Java Native Memory Tracking (NMT)
    [creator]         $BPL_JAVA_NMT_LEVEL          summary                                                      configure level of NMT, summary or detail
    [creator]         $BPL_JFR_ARGS                                                                             configure custom Java Flight Recording (JFR) arguments
    [creator]         $BPL_JFR_ENABLED             false                                                        enables Java Flight Recording (JFR)
    [creator]         $BPL_JMX_ENABLED             false                                                        enables Java Management Extensions (JMX)
    [creator]         $BPL_JMX_PORT                5000                                                         configure the JMX port
    [creator]         $BPL_JVM_HEAD_ROOM           0                                                            the headroom in memory calculation
    [creator]         $BPL_JVM_LOADED_CLASS_COUNT  35% of classes                                               the number of loaded classes in memory calculation
    [creator]         $BPL_JVM_THREAD_COUNT        250                                                          the number of threads in memory calculation
    [creator]         $JAVA_TOOL_OPTIONS                                                                        the JVM launch flags
    [creator]         Using Java version 17 extracted from MANIFEST.MF
    [creator]       BellSoft Liberica NIK 17.0.7: Reusing cached layer
    [creator]     
    [creator]     Paketo Buildpack for Syft 1.32.1
    [creator]       https://github.com/paketo-buildpacks/syft
    [creator]         Downloading from https://github.com/anchore/syft/releases/download/v0.84.0/syft_0.84.0_linux_amd64.tar.gz
    [creator]         Verifying checksum
    [creator]         Writing env.build/SYFT_CHECK_FOR_APP_UPDATE.default
    [creator]     
    [creator]     Paketo Buildpack for Executable JAR 6.7.4
    [creator]       https://github.com/paketo-buildpacks/executable-jar
    [creator]       Class Path: Contributing to layer
    [creator]         Writing env/CLASSPATH.delim
    [creator]         Writing env/CLASSPATH.prepend
    [creator]       Process types:
    [creator]         executable-jar: java org.springframework.boot.loader.JarLauncher (direct)
    [creator]         task:           java org.springframework.boot.loader.JarLauncher (direct)
    [creator]         web:            java org.springframework.boot.loader.JarLauncher (direct)
    [creator]     
    [creator]     Paketo Buildpack for Spring Boot 5.26.1
    [creator]       https://github.com/paketo-buildpacks/spring-boot
    [creator]       Build Configuration:
    [creator]         $BP_SPRING_CLOUD_BINDINGS_DISABLED   false  whether to contribute Spring Boot cloud bindings support
    [creator]       Launch Configuration:
    [creator]         $BPL_SPRING_CLOUD_BINDINGS_DISABLED  false  whether to auto-configure Spring Boot environment properties from bindings
    [creator]         $BPL_SPRING_CLOUD_BINDINGS_ENABLED   true   Deprecated - whether to auto-configure Spring Boot environment properties from bindings
    [creator]       Class Path: Contributing to layer
    [creator]         Writing env.build/CLASSPATH.append
    [creator]         Writing env.build/CLASSPATH.delim
    [creator]       Image labels:
    [creator]         org.opencontainers.image.title
    [creator]         org.opencontainers.image.version
    [creator]         org.springframework.boot.version
    [creator]     Warning: BOM table is deprecated in this buildpack api version, though it remains supported for backwards compatibility. Buildpack authors should write BOM information to <layer>.sbom.<ext>, launch.sbom.<ext>, or build.sbom.<ext>.
    [creator]     
    [creator]     Paketo Buildpack for Native Image 5.12.1
    [creator]       https://github.com/paketo-buildpacks/native-image
    [creator]       Build Configuration:
    [creator]         $BP_BINARY_COMPRESSION_METHOD                Compression mechanism used to reduce binary size. Options: `none` (default), `upx` or `gzexe`
    [creator]         $BP_NATIVE_IMAGE                       true  enable native image build
    [creator]         $BP_NATIVE_IMAGE_BUILD_ARGUMENTS             arguments to pass to the native-image command
    [creator]         $BP_NATIVE_IMAGE_BUILD_ARGUMENTS_FILE        a file with arguments to pass to the native-image command
    [creator]         $BP_NATIVE_IMAGE_BUILT_ARTIFACT              the built application artifact explicitly, required if building from a JAR
    [creator]       Native Image: Contributing to layer
    [creator]         Executing native-image --no-fallback -H:+StaticExecutableWithDynamicLibC -H:Name=/layers/paketo-buildpacks_native-image/native-image/action.in.blog.ActionInBlogApplication -cp /workspace:/workspace/BOOT-INF/classes:/workspace/BOOT-INF/lib/spring-webmvc-6.0.11.jar:/workspace/BOOT-INF/lib/spring-web-6.0.11.jar:/workspace/BOOT-INF/lib/spring-boot-autoconfigure-3.1.3.jar:/workspace/BOOT-INF/lib/spring-boot-3.1.3.jar:/workspace/BOOT-INF/lib/jakarta.annotation-api-2.1.1.jar:/workspace/BOOT-INF/lib/spring-context-6.0.11.jar:/workspace/BOOT-INF/lib/spring-aop-6.0.11.jar:/workspace/BOOT-INF/lib/spring-beans-6.0.11.jar:/workspace/BOOT-INF/lib/spring-expression-6.0.11.jar:/workspace/BOOT-INF/lib/spring-core-6.0.11.jar:/workspace/BOOT-INF/lib/snakeyaml-1.33.jar:/workspace/BOOT-INF/lib/jackson-datatype-jsr310-2.15.2.jar:/workspace/BOOT-INF/lib/jackson-module-parameter-names-2.15.2.jar:/workspace/BOOT-INF/lib/jackson-annotations-2.15.2.jar:/workspace/BOOT-INF/lib/jackson-core-2.15.2.jar:/workspace/BOOT-INF/lib/jackson-datatype-jdk8-2.15.2.jar:/workspace/BOOT-INF/lib/jackson-databind-2.15.2.jar:/workspace/BOOT-INF/lib/tomcat-embed-websocket-10.1.12.jar:/workspace/BOOT-INF/lib/tomcat-embed-core-10.1.12.jar:/workspace/BOOT-INF/lib/tomcat-embed-el-10.1.12.jar:/workspace/BOOT-INF/lib/micrometer-observation-1.11.3.jar:/workspace/BOOT-INF/lib/logback-classic-1.4.11.jar:/workspace/BOOT-INF/lib/log4j-to-slf4j-2.20.0.jar:/workspace/BOOT-INF/lib/jul-to-slf4j-2.0.7.jar:/workspace/BOOT-INF/lib/spring-jcl-6.0.11.jar:/workspace/BOOT-INF/lib/micrometer-commons-1.11.3.jar:/workspace/BOOT-INF/lib/logback-core-1.4.11.jar:/workspace/BOOT-INF/lib/slf4j-api-2.0.7.jar:/workspace/BOOT-INF/lib/log4j-api-2.20.0.jar action.in.blog.ActionInBlogApplication
    [creator]     Warning: The USE_NATIVE_IMAGE_JAVA_PLATFORM_MODULE_SYSTEM environment variable is deprecated and might be removed in a future release. Please refer to the GraalVM release notes.
    [creator]     ================================================================================
    [creator]     GraalVM Native Image: Generating 'action.in.blog.ActionInBlogApplication' (static executable)...
    [creator]     ================================================================================
    [creator]     [1/8] Initializing...                                            (6.3s @ 0.18GB)
    [creator]      Java version: 17.0.7+7-LTS, vendor version: Liberica-NIK-23.0.0-1
    [creator]      Graal compiler: optimization level: 2, target machine: x86-64-v3
    [creator]      C compiler: gcc (linux, x86_64, 7.5.0)
    [creator]      Garbage collector: Serial GC (max heap size: 80% of RAM)
    [creator]      1 user-specific feature(s)
    [creator]      - org.springframework.aot.nativex.feature.PreComputeFieldFeature
    [creator]     Field org.apache.commons.logging.LogAdapter#log4jSpiPresent set to true at build time
    [creator]     Field org.apache.commons.logging.LogAdapter#log4jSlf4jProviderPresent set to true at build time
    [creator]     Field org.apache.commons.logging.LogAdapter#slf4jSpiPresent set to true at build time
    
    ... 
    
    [creator]     Field org.springframework.boot.autoconfigure.web.format.WebConversionService#JSR_354_PRESENT set to false at build time
    [creator]     Field org.springframework.web.servlet.support.RequestContext#jstlPresent set to false at build time
    [creator]     [2/8] Performing analysis...  [*******]                         (43.4s @ 1.68GB)
    [creator]       15,242 (90.54%) of 16,835 types reachable
    [creator]       25,081 (67.60%) of 37,103 fields reachable
    [creator]       74,287 (63.48%) of 117,020 methods reachable
    [creator]        4,762 types,   264 fields, and 4,976 methods registered for reflection
    [creator]           64 types,    70 fields, and    55 methods registered for JNI access
    [creator]            4 native libraries: dl, pthread, rt, z
    [creator]     [3/8] Building universe...                                       (6.1s @ 1.77GB)
    [creator]     [4/8] Parsing methods...      [**]                               (4.1s @ 2.12GB)
    [creator]     [5/8] Inlining methods...     [***]                              (2.5s @ 2.83GB)
    [creator]     [6/8] Compiling methods...    [******]                          (36.6s @ 3.10GB)
    [creator]     [7/8] Layouting methods...    [***]                              (6.8s @ 4.50GB)
    [creator]     [8/8] Creating image...       [***]                              (8.3s @ 1.75GB)
    [creator]       37.09MB (51.76%) for code area:    48,426 compilation units
    [creator]       31.82MB (44.41%) for image heap:  373,987 objects and 117 resources
    [creator]        2.75MB ( 3.83%) for other data
    [creator]       71.65MB in total
    [creator]     --------------------------------------------------------------------------------
    [creator]     Top 10 origins of code area:            Top 10 object types in image heap:
    [creator]       13.22MB java.base                        8.14MB byte[] for code metadata
    [creator]        4.51MB tomcat-embed-core-10.1.12.jar    3.63MB java.lang.Class
    [creator]        2.93MB java.xml                         3.54MB java.lang.String
    [creator]        2.03MB jackson-databind-2.15.2.jar      3.10MB byte[] for general heap data
    [creator]        1.57MB spring-core-6.0.11.jar           2.98MB byte[] for java.lang.String
    [creator]        1.34MB svm.jar                          1.28MB c.o.s.c.h.DynamicHubCompanion
    [creator]        1.31MB spring-boot-3.1.3.jar          922.50kB byte[] for reflection metadata
    [creator]        1.00MB spring-web-6.0.11.jar          778.79kB byte[] for embedded resources
    [creator]      920.14kB spring-beans-6.0.11.jar        695.89kB java.lang.String[]
    [creator]      862.61kB spring-webmvc-6.0.11.jar       586.31kB java.util.HashMap$Node
    [creator]        7.09MB for 70 more packages             5.87MB for 3166 more object types
    [creator]     --------------------------------------------------------------------------------
    [creator]     Recommendations:
    [creator]      HEAP: Set max heap for improved and more predictable memory usage.
    [creator]      CPU:  Enable more CPU features with '-march=native' for improved performance.
    [creator]     --------------------------------------------------------------------------------
    [creator]         9.3s (8.0% of total time) in 85 GCs | Peak RSS: 6.05GB | CPU load: 6.33
    [creator]     --------------------------------------------------------------------------------
    [creator]     Produced artifacts:
    [creator]      /layers/paketo-buildpacks_native-image/native-image/action.in.blog.ActionInBlogApplication (executable)
    [creator]     ================================================================================
    [creator]     Finished generating 'action.in.blog.ActionInBlogApplication' in 1m 55s.
    [creator]       Removing bytecode
    [creator]       Process types:
    [creator]         native-image: ./action.in.blog.ActionInBlogApplication (direct)
    [creator]         task:         ./action.in.blog.ActionInBlogApplication (direct)
    [creator]         web:          ./action.in.blog.ActionInBlogApplication (direct)
    [creator]     ===> EXPORTING
    [creator]     Reusing layer 'paketo-buildpacks/ca-certificates:helper'
    [creator]     Reusing layer 'paketo-buildpacks/executable-jar:classpath'
    [creator]     Reusing layer 'buildpacksio/lifecycle:launch.sbom'
    [creator]     Adding 1/1 app layer(s)
    [creator]     Reusing layer 'buildpacksio/lifecycle:launcher'
    [creator]     Reusing layer 'buildpacksio/lifecycle:config'
    [creator]     Reusing layer 'buildpacksio/lifecycle:process-types'
    [creator]     Adding label 'io.buildpacks.lifecycle.metadata'
    [creator]     Adding label 'io.buildpacks.build.metadata'
    [creator]     Adding label 'io.buildpacks.project.metadata'
    [creator]     Adding label 'org.opencontainers.image.title'
    [creator]     Adding label 'org.opencontainers.image.version'
    [creator]     Adding label 'org.springframework.boot.version'
    [creator]     Setting default process type 'web'
    [creator]     Saving docker.io/library/action-in-blog:0.0.1-SNAPSHOT...
    [creator]     *** Images (ce848b153d90):
    [creator]           docker.io/library/action-in-blog:0.0.1-SNAPSHOT
    [creator]     Reusing cache layer 'paketo-buildpacks/bellsoft-liberica:native-image-svm'
    [creator]     Reusing cache layer 'paketo-buildpacks/syft:syft'
    [creator]     Adding cache layer 'paketo-buildpacks/native-image:native-image'
    [creator]     Reusing cache layer 'buildpacksio/lifecycle:cache.sbom'

Successfully built image 'docker.io/library/action-in-blog:0.0.1-SNAPSHOT'


Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.

You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come from your own scripts or plugins.

For more on this, please refer to https://docs.gradle.org/8.2.1/userguide/command_line_interface.html#sec:command_line_warnings in the Gradle documentation.

BUILD SUCCESSFUL in 2m 23s
9 actionable tasks: 1 executed, 8 up-to-date
```

도커 명령어로 컨테이너를 실행합니다. 

* 어플리케이션 컨테이너를 실행하는데 0.142초 소요됩니다. 
    * 일반 실행보다 약 8배 이상 빠릅니다.

```
$ docker run -p 8080:8080 docker.io/library/action-in-blog:0.0.1-SNAPSHOT

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.1.3)

2023-09-18T02:21:40.457Z  INFO 1 --- [           main] action.in.blog.ActionInBlogApplication   : Starting AOT-processed ActionInBlogApplication using Java 17.0.7 with PID 1 (/workspace/action.in.blog.ActionInBlogApplication started by cnb in /workspace)
2023-09-18T02:21:40.458Z  INFO 1 --- [           main] action.in.blog.ActionInBlogApplication   : The following 1 profile is active: "dev"
2023-09-18T02:21:40.490Z  INFO 1 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port(s): 8080 (http)
2023-09-18T02:21:40.494Z  INFO 1 --- [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
2023-09-18T02:21:40.494Z  INFO 1 --- [           main] o.apache.catalina.core.StandardEngine    : Starting Servlet engine: [Apache Tomcat/10.1.12]
2023-09-18T02:21:40.508Z  INFO 1 --- [           main] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring embedded WebApplicationContext
2023-09-18T02:21:40.508Z  INFO 1 --- [           main] w.s.c.ServletWebServerApplicationContext : Root WebApplicationContext: initialization completed in 50 ms
2023-09-18T02:21:40.557Z  INFO 1 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8080 (http) with context path ''
2023-09-18T02:21:40.558Z  INFO 1 --- [           main] action.in.blog.ActionInBlogApplication   : Started ActionInBlogApplication in 0.142 seconds (process running for 0.197)
```

## 5. Conclusion

예제를 만들어보면서 GraalVM에 대해 얻은 느낌과 인사이트(insight)는 다음과 같습니다. 

* 네이티브 이미지로 빌드된 파일의 실행 속도는 확실히 빠릅니다.
* 빌드하는데 시간이 오래 소요되기 때문에 로컬 개발 환경이나 프로젝트 어플리케이션이 자주 변경되는 프로젝트 초반일 경우 불편할 것 같습니다.
* @Profile 애너테이션을 사용한 선택적인 빈 주입은 정상적으로 수행됩니다.
    * 공식 문서에서 제약 사항이 있다는 것을 보면 완벽하게 지원하진 않지만, 예제 수준의 간단한 프로파일 사용은 가능할 것으로 보입니다.
* GraalVM JDK를 사용하면 필요에 따라 컴파일 방법을 선택할 수 있습니다.
    * OpenJDK 컴파일러와 Graal JIT 컴파일러를 jar 패키징 빌드
    * AOT 컴파일러를 사용한 네이티브 이미지 빌드

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-09-18-spring-boot-supports-graal-vm-native-image>

#### REFERENCE

* <https://docs.spring.io/spring-boot/docs/current/reference/html/native-image.html>
* <https://docs.spring.io/spring-boot/docs/current/reference/html/howto.html#howto.aot.conditions>
* <https://www.graalvm.org/latest/docs/getting-started/macos/>
* <https://velog.io/@akfls221/Spring-GraalVM-Native-Image>

[graal-vm-link]: https://junhyunny.github.io/information/java/graal-vm/
[dynamic-proxy-in-java-link]: https://junhyunny.github.io/java/dynamic-proxy-in-java/