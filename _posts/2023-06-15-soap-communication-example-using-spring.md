---
title: "SOAP Communication Example using Spring"
search: false
category:
  - java
  - spring-boot
  - docker
last_modified_at: 2023-06-15T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [SOAP(Simple Object Access Protocol)][soap-link]

## 0. 들어가면서

스프링 부트(spring boot)는 웹 서비스(WS, Web Service) 기술을 지원합니다. 
[SOAP(Simple Object Access Protocol)][soap-link] 포스트에서도 설명했지만, 여기서 말하는 웹 서비스는 통신 기술을 지칭합니다. 
월드 와이드 웹(WWW, Wolrd Wird Web)을 통해 사용자에게 서비스를 제공한다는 의미가 아닙니다. 
일반적으로 웹 서비스는 다음과 같은 구조를 가집니다. 

1. 웹 서비스 제공자(provider)는 자신이 제공하는 API를 WSDL 문서로 만들어 UDDI 서버에 배포합니다.
1. 웹 서비스 소비자(consumer)는 자신이 필요한 WSDL 문서를 UDDI 서버에서 탐색합니다.
1. 소비자는 WSDL 문서를 파싱하여 요청에 필요한 정보를 생성합니다.
1. 소비자는 생성한 정보를 기준으로 `SOAP` 메세지 형식에 맞는 요청 정보를 만듭니다.
1. 소비자는 HTTP를 통해 `SOAP` 메세지를 제공자에게 전달합니다.
1. 제공자는 `SOAP` 메세지 요청을 받고 필요한 처리를 수행합니다.
1. 제공자는 처리가 완료되면 HTTP를 통해 소비자에게 `SOAP` 메세지 응답을 전달합니다. 

<p align="center">
    <img src="/images/soap-communication-example-using-spring-1.JPG" width="80%" class="image__border image__padding">
</p>
<center>https://gruuuuu.github.io/programming/soap/</center>

## 1. Background

웹 서비스의 메세지 프로토콜인 `SOAP`을 사용해 두 개의 서비스가 통신하는 예제를 살펴보겠습니다. 
다음과 같은 백그라운(background)로 인해 실습은 위에서 설명한 웹 서비스와 다른 흐름을 가집니다.

* IBM, Microsoft, SAP에서 제공하는 공용 UDDI 서비스가 2007년에 종료되었습니다.
    * 아파치(apache)에서 UDDI 서버를 구축을 위한 오픈 소스 [JUDDI][juddi-link]를 제공합니다.
* 스프링(spring) 프레임워크는 UDDI 서버 없이 웹 서비스를 제공합니다.
    * 서비스 제공자가 직접 WSDL 파일을 호스팅합니다.
* 웹 서비스 개발 시 `Contract Last` 방식과 `Contract First` 방식이 있습니다.
    * `Contract Last` 방식은 Java 코드를 먼저 작성하고 WSDL 파일을 만드는 방식입니다.
    * `Contract First` 방식은 WSDL 파일을 통한 계약 성립 후 Java 코드를 통해 구현합니다.
    * 스프링 프레임워크는 `Contract First` 방식만 지원합니다.

### 1.1. Development Process

스프링 프레임워크를 사용한 웹 서비스의 제공자(provider)와 소비자(consumer)는 다음과 같은 개발 흐름을 가집니다. 

1. 서비스 제공자의 개발이 먼저 완료됩니다.
1. 제공자는 자신의 API를 정의한 WSDL 파일을 직접 호스팅합니다.
1. 소비자는 제공자의 WSDL 파일을 가져옵니다. 
1. 소비자는 제공자의 WSDL 파일을 기준으로 클래스(class) 파일을 생성합니다.
    * 서비스 제공자가 WSDL 파일을 변경하는 것에 대해 소비자가 크게 영향을 받습니다.
    * 소비자는 서비스 제공자와 강하게 결합되어 있습니다.
1. 소비자는 생성한 클래스를 사용해 필요한 API 호출 기능을 개발합니다.

<p align="center">
    <img src="/images/soap-communication-example-using-spring-2.JPG" width="80%" class="image__border">
</p>

### 1.2. Web Service in Spring

스프링 부트 프레임워크는 `spring-boot-starter-web-services` 의존성을 통해 쉽게 웹 서비스 어플리케이션을 구축할 수 있습니다. 

* 내장 톰캣(embedded tomcat)이 서블릿 컨테이너를 사용합니다.
* 스프링의 웹 서비스 코어 모듈이 사용합니다.
    * 기본적인 스프링의 기능에 웹 서비스를 위한 기능들이 추가됩니다.
* WSDL 문서를 생성하기 위한 모듈을 추가합니다.
    * 해당 의존성은 서비스 제공자만 필요합니다.
* XML 문서를 Java 클래스나 객체(instance)로 변환하는 JAXB 모듈이 추가합니다.
    * XML 문서를 JAVA 클래스나 객체로 변환하는 작업을 OXM(Object XML Mapping)이라고 합니다.
    * 객체와 `SOAP` 메세지 사이의 변환을 처리합니다.
    * 서비스 소비자에서는 WSDL 문서를 기반으로 Java 클래스 파일을 생성합니다.

<p align="center">
    <img src="/images/soap-communication-example-using-spring-3.JPG" width="80%" class="image__border">
</p>

## 2. Scenario

다음과 같은 시나리오를 테스트합니다.

1. 클라이언트는 서비스 소비자에게 책 정보 또는 저자(author) 정보를 요청합니다.
    * REST 통신 구간
1. 서비스 소비자는 해당 요청을 서비스 제공자에게 재요청합니다.
    * SOAP 통신 구간
1. 제공자는 요청 받은 정보를 소비자에게 응답합니다.
    * SOAP 통신 구간
1. 소비자는 제공자로부터 받은 정보를 JSON 형식으로 클라이언트에게 응답합니다.
    * REST 통신 구간

<p align="center">
    <img src="/images/soap-communication-example-using-spring-4.JPG" width="100%" class="image__border">
</p>

## 3. Serivce Provider Application

서비스 제공자부터 개발합니다. 
다음과 같은 프로젝트 구조를 가집니다.

```
./
├── Dockerfile
├── HELP.md
├── build.gradle
├── gradle
│   └── wrapper
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── gradlew
├── gradlew.bat
├── settings.gradle
└── src
    ├── main
    │   ├── java
    │   │   └── action
    │   │       └── in
    │   │           └── blog
    │   │               ├── ProducerApplication.java
    │   │               ├── config
    │   │               │   └── WebServiceConfig.java
    │   │               └── endpoint
    │   │                   ├── AuthorEndPoint.java
    │   │                   └── BookEndPoint.java
    │   ├── jaxb
    │   │   └── action
    │   │       └── in
    │   │           └── blog
    │   │               ├── author
    │   │               │   ├── Author.java
    │   │               │   ├── GetAuthorsRequest.java
    │   │               │   ├── GetAuthorsResponse.java
    │   │               │   ├── ObjectFactory.java
    │   │               │   ├── Sex.java
    │   │               │   └── package-info.java
    │   │               └── book
    │   │                   ├── Book.java
    │   │                   ├── Genre.java
    │   │                   ├── GetBooksRequest.java
    │   │                   ├── GetBooksResponse.java
    │   │                   ├── ObjectFactory.java
    │   │                   └── package-info.java
    │   └── resources
    │       ├── application.yml
    │       └── xsd
    │           ├── author.xsd
    │           └── book.xsd
    └── test
        └── java
            └── action
                └── in
                    └── blog
                        └── ProducerApplicationTests.java
```

### 3.1. build.gradle

다음과 같은 의존성을 가집니다. 
주석으로 필요한 설명을 대체하였습니다.

```gradle
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.1.0'
    id 'io.spring.dependency-management' version '1.1.0'
}

group = 'action.in.blog'
version = '0.0.1-SNAPSHOT'
sourceCompatibility = '17'

configurations {
    jaxb
    compileOnly {
        extendsFrom annotationProcessor
    }
}

sourceSets {
    main {
        java {
            srcDir 'src/main/java'
            srcDir 'src/main/jaxb' // 소스 코드 경로로 src/main/jaxb 추가
        }
    }
}

extensions.findByName("buildScan")?.with {
    setProperty("termsOfServiceUrl", "https://gradle.com/terms-of-service")
    setProperty("termsOfServiceAgree", "yes")
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web-services' // Spring Web Service
    testImplementation 'org.springframework.boot:spring-boot-starter-test'

    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'

    implementation 'com.github.javafaker:javafaker:1.0.2'
    implementation 'wsdl4j:wsdl4j' // WSDL 처리 모듈
    implementation 'jakarta.xml.bind:jakarta.xml.bind-api:4.0.0' // JDK17 관련 에러 보완
    implementation 'org.apache.ws.xmlschema:xmlschema-core:2.2.1' // Apache Web Service URIResolver 관련 에러 보완

    jaxb "org.glassfish.jaxb:jaxb-xjc" // OXM
}

tasks.named('test') {
    useJUnitPlatform()
}

// XSD 파일을 기준으로 Java 클래스를 생성하는 태스크(task)
tasks.register('genJaxb') {
    // XSD 파일을 Java 클래스로 변환하여 jaxb 폴더에 위치시킵니다.
    ext.sourcesDir = "src/main/jaxb"
    ext.schema = "src/main/resources/xsd"

    outputs.dir sourcesDir

    doLast() {
        project.ant {
            taskdef name: "xjc", classname: "com.sun.tools.xjc.XJCTask", classpath: configurations.jaxb.asPath
            mkdir(dir: sourcesDir)
            xjc(destdir: sourcesDir) {
                arg(value: "-wsdl")
                schema(dir: schema, includes: "**/*.xsd")
                produces(dir: sourcesDir, includes: "**/*.java")
            }
        }
    }
}
```

### 3.2. author.xsd

XSD(XML Schema Definition)은 서비스 제공자가 노출하는 API 스키마 정보를 담은 XML 파일입니다. 
`book.xsd` 파일도 있지만, 크게 다르지 않으므로 생략하겠습니다. 
주석으로 필요한 설명을 대체하였습니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- 대상 네임스페이스(namespace)는 http://blog.in.action/author 입니다. -->
<!-- 해당 XML 파일을 클래스로 변환하면 네임스페이스를 기준으로 패키지가 생성됩니다. -->
<!-- e.g. action.in.blog.author -->
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
           xmlns:tns="http://blog.in.action/author"
           targetNamespace="http://blog.in.action/author"
           elementFormDefault="qualified">

    <!-- 요청에 사용되는 데이터 양식입니다. -->
    <xs:element name="getAuthorsRequest">
        <xs:complexType>
            <xs:sequence/>
        </xs:complexType>
    </xs:element>

    <!-- 응답에 사용되는 데이터 양식입니다. -->
    <xs:element name="getAuthorsResponse">
        <xs:complexType>
            <xs:sequence>
                <xs:element name="authors" type="tns:author" minOccurs="0" maxOccurs="unbounded" />
            </xs:sequence>
        </xs:complexType>
    </xs:element>

    <xs:complexType name="author">
        <xs:sequence>
            <xs:element name="id" type="xs:long"/>
            <xs:element name="penName" type="xs:string"/>
            <xs:element name="name" type="xs:string"/>
            <xs:element name="email" type="xs:string"/>
            <xs:element name="contact" type="xs:string"/>
            <xs:element name="sex" type="tns:sex"/>
        </xs:sequence>
    </xs:complexType>

    <xs:simpleType name="sex">
        <xs:restriction base="xs:string">
            <xs:enumeration value="MALE"/>
            <xs:enumeration value="FEMALE"/>
        </xs:restriction>
    </xs:simpleType>

</xs:schema>
```

### 3.3 Build Java Class from Schema

서비스 제공자는 XSD 파일을 기준으로 Java 클래스를 생성합니다. 
아래 명령어를 통해 생성합니다.

```
$ ./gradlew :genJaxb

BUILD SUCCESSFUL in 1s
1 actionable task: 1 executed
```

다음 위치에 클래스들이 생성됩니다.

<p align="left">
    <img src="/images/soap-communication-example-using-spring-5.JPG" width="30%" class="image__border">
</p>

### 3.4. AuthorEndPoint Class

서비스 요청을 받을 수 있는 엔드-포인트(end-point)를 생성합니다. 
BookEndPoint 클래스도 존재하지만, 크게 다르지 않으므로 생략하겠습니다. 
`author.xsd`에 정보를 맞춰 코드를 작성합니다.

* 네임스페이스
* 로컬 파트(localPart)
* 요청에 사용되는 GetAuthorsRequest 객체
* 응답에 사용되는 GetAuthorsResponse, Author 객체

```java
package action.in.blog.endpoint;

import action.in.blog.author.Author;
import action.in.blog.author.GetAuthorsRequest;
import action.in.blog.author.GetAuthorsResponse;
import action.in.blog.author.Sex;
import com.github.javafaker.Faker;
import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;

import java.util.stream.IntStream;

@Endpoint // RestController
public class AuthorEndPoint {

    private static final String NAMESPACE_URI = "http://blog.in.action/author";

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "getAuthorsRequest") // RequestMapping
    @ResponsePayload // ResponseBody
    public GetAuthorsResponse getAuthors(@RequestPayload GetAuthorsRequest request) {
        var faker = new Faker();
        var response = new GetAuthorsResponse();
        response.getAuthors().addAll(
                IntStream.range(1, 10)
                        .mapToObj(number -> {
                            var author = new Author();
                            author.setId(number);
                            author.setPenName(faker.name().username());
                            author.setName(faker.name().fullName());
                            author.setSex(number % 2 == 0 ? Sex.MALE : Sex.FEMALE);
                            author.setEmail(faker.internet().emailAddress());
                            author.setContact(faker.phoneNumber().phoneNumber());
                            return author;
                        }).toList()
        );
        return response;
    }
}
```

### 3.5. WebServiceConfig Class

API 스키마를 정의한 XSD을 기준으로 WSDL 파일을 생성하고 호스팅하기 위한 빈(bean)들을 정의합니다. 
서비스 소비자는 DefaultWsdl11Definition 빈 이름을 기준으로 WSDL 파일을 찾을 수 있습니다.

```java
package action.in.blog.config;

import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.ws.config.annotation.EnableWs;
import org.springframework.ws.config.annotation.WsConfigurerAdapter;
import org.springframework.ws.transport.http.MessageDispatcherServlet;
import org.springframework.ws.wsdl.wsdl11.DefaultWsdl11Definition;
import org.springframework.xml.xsd.XsdSchemaCollection;
import org.springframework.xml.xsd.commons.CommonsXsdSchemaCollection;

@EnableWs
@Configuration
public class WebServiceConfig extends WsConfigurerAdapter {

    @Bean
    public ServletRegistrationBean<MessageDispatcherServlet> messageDispatcherServlet(ApplicationContext applicationContext) {
        MessageDispatcherServlet servlet = new MessageDispatcherServlet();
        servlet.setApplicationContext(applicationContext);
        servlet.setTransformWsdlLocations(true);
        return new ServletRegistrationBean<>(servlet, "/ws/*");
    }

    @Bean
    public XsdSchemaCollection wsdlSchemas() {
        CommonsXsdSchemaCollection schemaCollection = new CommonsXsdSchemaCollection(
                new ClassPathResource("xsd/author.xsd"),
                new ClassPathResource("xsd/book.xsd")
        );
        schemaCollection.setInline(true);
        return schemaCollection;
    }

    @Bean(name = "schemas") // http://localhost:8080/ws/schemas.wsdl
    public DefaultWsdl11Definition defaultWsdl11Definition(XsdSchemaCollection wsdlSchemas) {
        DefaultWsdl11Definition wsdl11Definition = new DefaultWsdl11Definition();
        wsdl11Definition.setPortTypeName("BookStorePort");
        wsdl11Definition.setLocationUri("/ws");
        wsdl11Definition.setTargetNamespace("http://blog.in.action");
        wsdl11Definition.setSchemaCollection(wsdlSchemas);
        return wsdl11Definition;
    }
}
```

### 3.6. WSDL Document

서비스 제공자 어플리케이션을 실행 후 `http://localhost:8080/ws/schemas.wsdl` 경로로 접근하면 다음과 같은 화면을 볼 수 있습니다. 
WSDL 구조에 대한 설명은 [SOAP][soap-link] 포스트를 참조바랍니다. 

<p align="center">
    <img src="/images/soap-communication-example-using-spring-6.JPG" width="100%" class="image__border">
</p>

## 4. Serivce Consumer Application

서비스 소비자를 개발합니다. 
제공자에서 제공하는 WSDL 문서를 기반으로 클래스를 생성해야하므로 제공자 어플리케이션 제작 이후 진행합니다. 
다음과 같은 프로젝트 구조를 가집니다.

```
./
├── Dockerfile
├── HELP.md
├── build.gradle
├── gradle
│   └── wrapper
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── gradlew
├── gradlew.bat
├── settings.gradle
└── src
    ├── main
    │   ├── java
    │   │   └── action
    │   │       └── in
    │   │           └── blog
    │   │               ├── ConsumerApplication.java
    │   │               ├── config
    │   │               │   └── SoapConfig.java
    │   │               ├── controller
    │   │               │   ├── AuthorController.java
    │   │               │   └── BookStoreController.java
    │   │               ├── domain
    │   │               │   ├── Author.java
    │   │               │   └── Book.java
    │   │               └── proxy
    │   │                   ├── BookStoreProxy.java
    │   │                   └── DefaultBookStoreProxy.java
    │   ├── jaxb
    │   │   └── action
    │   │       └── in
    │   │           └── blog
    │   │               └── wsdl
    │   │                   ├── Author.java
    │   │                   ├── Book.java
    │   │                   ├── Genre.java
    │   │                   ├── GetAuthorsRequest.java
    │   │                   ├── GetAuthorsResponse.java
    │   │                   ├── GetBooksRequest.java
    │   │                   ├── GetBooksResponse.java
    │   │                   ├── ObjectFactory.java
    │   │                   ├── Sex.java
    │   │                   └── package-info.java
    │   └── resources
    │       ├── application.yml
    │       ├── static
    │       └── templates
    └── test
        └── java
            └── action
                └── in
                    └── blog
                        └── ConsumerApplicationTests.java
```

### 4.1. build.gradle

다음과 같은 의존성을 가집니다. 
주석으로 필요한 설명을 대체하였습니다.

```gradle
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.1.0'
    id 'io.spring.dependency-management' version '1.1.0'
}

group = 'action.in.blog'
version = '0.0.1-SNAPSHOT'
sourceCompatibility = '17'

configurations {
    jaxb
    compileOnly {
        extendsFrom annotationProcessor
    }
}

sourceSets {
    main {
        java {
            srcDir 'src/main/java'
            srcDir 'src/main/jaxb' // 소스 코드 경로로 src/main/jaxb 추가
        }
    }
}

extensions.findByName("buildScan")?.with {
    setProperty("termsOfServiceUrl", "https://gradle.com/terms-of-service")
    setProperty("termsOfServiceAgree", "yes")
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-web-services' // Spring Web Services
    testImplementation 'org.springframework.boot:spring-boot-starter-test'

    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'

    implementation 'jakarta.xml.bind:jakarta.xml.bind-api:4.0.0' // JDK17 에러 보완

    jaxb "org.glassfish.jaxb:jaxb-xjc" // OXM
}

tasks.named('test') {
    useJUnitPlatform()
}

// 서비스 제공자가 노출한 WSDL 파일을 기준으로 클래스를 생성하는 태스크
tasks.register('genJaxb') {
    // 생성한 소스 코드 경로
    ext.sourcesDir = "src/main/jaxb"
    // 스키마 정보를 받을 수 있는 주소
    ext.schema = "http://localhost:8080/ws/schemas.wsdl"

    outputs.dir sourcesDir

    doLast() {
        project.ant {
            taskdef name: "xjc", classname: "com.sun.tools.xjc.XJCTask", classpath: configurations.jaxb.asPath

            mkdir(dir: sourcesDir)

            xjc(destdir: sourcesDir, schema: schema, package: "action.in.blog.wsdl") {
                arg(value: "-wsdl")
                produces(dir: sourcesDir, includes: "**/*.java")
            }
        }
    }
}
```

### 4.2. Build Java Class from Schema

서비스 제공자의 WSDL 문서를 기반으로 클래스를 생성합니다. 
해당 태스크를 실행하기 전에 서비스 제공자 어플리케이션이 실행 중인지 확인합니다. 

```
$ ./gradlew :genJaxb

> Task :genJaxb
[ant:xjc] [WARNING] WSDL 컴파일을 시도하고 있습니까? WSDL에 대한 지원은 실험 단계입니다. -wsdl 옵션을 통해 사용으로 설정할 수 있습니다.
[ant:xjc] 알 수 없는 위치
[ant:xjc] 

BUILD SUCCESSFUL in 1s
1 actionable task: 1 executed
```

다음과 같은 경로에 클래스들이 생성된 것을 확인할 수 있습니다.

<p align="left">
    <img src="/images/soap-communication-example-using-spring-7.JPG" width="30%" class="image__border">
</p>

### 4.3. SoapConfig Class

`SOAP` 메세지와 Java 객체 사이의 변환을 도와주는 마샬러(marshaller)를 정의합니다. 

* `SOAP` 메세지에 대한 마샬(marshall)과 언마샬(unmarshall) 작업을 수행합니다.

```java
package action.in.blog.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.oxm.jaxb.Jaxb2Marshaller;

@Configuration
public class SoapConfig {

    @Bean
    public Jaxb2Marshaller marshaller() {
        Jaxb2Marshaller marshaller = new Jaxb2Marshaller();
        marshaller.setContextPath("action.in.blog.wsdl");
        return marshaller;
    }
}
```

### 4.4. DefaultBookStoreProxy Class

WebServiceGatewaySupport 클래스를 확장(extends)하여 `SOAP` 통신을 구현합니다. 

* 부모 클래스에서 제공하는 WebServiceTemplate 객체를 사용합니다. 
* 요청, 응답 객체는 WSDL 문서를 기반으로 생성한 클래스를 사용합니다. 
* 서비스 제공자에게 요청을 보냅니다.
    * http://provider-service:8080/ws
* 소비자는 정보의 위치를 제공자가 정의한 WSDL 문서의 네임스페이스와 메세지를 기준으로 정의합니다. 
    * http://blog.in.action/book/getBooksRequest
    * http://blog.in.action/author/getAuthorsRequest

```java
package action.in.blog.proxy;

import action.in.blog.domain.Author;
import action.in.blog.domain.Book;
import action.in.blog.wsdl.GetAuthorsRequest;
import action.in.blog.wsdl.GetAuthorsResponse;
import action.in.blog.wsdl.GetBooksRequest;
import action.in.blog.wsdl.GetBooksResponse;
import org.springframework.oxm.jaxb.Jaxb2Marshaller;
import org.springframework.stereotype.Component;
import org.springframework.ws.client.core.support.WebServiceGatewaySupport;
import org.springframework.ws.soap.client.core.SoapActionCallback;

import java.util.List;

@Component
public class DefaultBookStoreProxy extends WebServiceGatewaySupport implements BookStoreProxy {

    public DefaultBookStoreProxy(Jaxb2Marshaller marshaller) {
        setDefaultUri("http://provider-service:8080/ws");
        setMarshaller(marshaller);
        setUnmarshaller(marshaller);
    }

    @Override
    public List<Book> getBooks() {
        var request = new GetBooksRequest();
        var webServiceTemplate = getWebServiceTemplate();
        GetBooksResponse bookResponse = (GetBooksResponse) webServiceTemplate.marshalSendAndReceive(
                request,
                new SoapActionCallback(
                        "http://blog.in.action/book/getBooksRequest"
                )
        );
        return bookResponse.getBooks()
                .stream()
                .map(Book::of)
                .toList();
    }

    @Override
    public List<Author> getAuthors() {
        var request = new GetAuthorsRequest();
        var webServiceTemplate = getWebServiceTemplate();
        GetAuthorsResponse authorsResponse = (GetAuthorsResponse) webServiceTemplate.marshalSendAndReceive(
                request,
                new SoapActionCallback(
                        "http://blog.in.action/author/getAuthorsRequest"
                )
        );
        return authorsResponse.getAuthors()
                .stream()
                .map(Author::of)
                .toList();
    }
}
```

### 4.5. AuthorController Class

클라이언트로부터 REST 요청을 받을 수 있는 컨트롤러 객체입니다.

```java
package action.in.blog.controller;

import action.in.blog.domain.Author;
import action.in.blog.proxy.BookStoreProxy;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class AuthorController {

    private final BookStoreProxy bookStoreProxy;

    public AuthorController(BookStoreProxy bookStoreProxy) {
        this.bookStoreProxy = bookStoreProxy;
    }

    @GetMapping("/authors")
    public List<Author> getAuthors() {
        return bookStoreProxy.getAuthors();
    }
}
```

## 5. Run Web Services

도커 컴포즈(docker compose)를 통해 두 어플리케이션을 동시에 실행합니다. 

```
$ docker-compose up -d
[+] Building 0.0s (0/2)
[+] Building 1.2s (3/4)
 => [internal] load build definition from Dockerfile                                                                               0.0s
 => [internal] load .dockerignore                                                                                                  0.0s 
 => => transferring context: 2B                                                                                                    0.0s
 => => transferring dockerfile: 343B                                                                                               0.0s
 => [internal] load .dockerignore                                                                                                  0.0s
[+] Building 1.3s (11/15)
 => [internal] load build definition from Dockerfile                                                                               0.0s
 => => transferring dockerfile: 343B                                                                                               0.0s
 => [internal] load .dockerignore                                                                                                  0.0s
 => => transferring context: 2B                                                                                                    0.0s
 => [internal] load metadata for docker.io/library/openjdk:17-alpine                                                               1.1s
 => [internal] load metadata for docker.io/library/gradle:jdk17                                                                    1.2s
 => [build 1/7] FROM docker.io/library/gradle:jdk17@sha256:f7befd3501bae42a8e36ef45ce60a542bc7bbf91cde6195f0b4af98d9dcda0f6        0.0s
[+] Building 1.3s (12/15)
 => [internal] load .dockerignore                                                                                                  0.0s
[+] Building 1.8s (12/15)
[+] Building 5.1s (12/15)
[+] Building 8.6s (12/15)
 => => transferring context: 2B                                                                                                    0.0s 
 => [internal] load build definition from Dockerfile                                                                               0.0s
 => [build 7/7] RUN ./gradlew clean build                                                                                         11.3s 
 => => #  - Added support for Java 19.
 => => #  - Introduced `--rerun` flag for individual task rerun.
 => => #  - Improved dependency block for test suites to be strongly typed.
 => => #  - Added a pluggable system for Java toolchains provisioning.
 => => # For more details see https://docs.gradle.org/7.6.1/release-notes.html
 => => # Starting a Gradle Daemon (subsequent builds will be faster)
[+] Building 79.3s (12/15)
[+] Building 79.5s (13/15)
 => [internal] load .dockerignore                                                                                                  0.0s
 => => transferring context: 2B                                                                                                    0.0s
 => [internal] load metadata for docker.io/library/openjdk:17-alpine                                                               1.1s
[+] Building 79.5s (16/16) FINISHED
[+] Building 80.4s (16/16) FINISHED
 => [internal] load build definition from Dockerfile                                                                               0.0s
 => => transferring dockerfile: 343B                                                                                               0.0s
 => [internal] load .dockerignore                                                                                                  0.0s
 => => transferring context: 2B                                                                                                    0.0s
 => [internal] load metadata for docker.io/library/openjdk:17-alpine                                                               1.1s
 => [internal] load metadata for docker.io/library/gradle:jdk17                                                                    1.2s
 => [build 1/7] FROM docker.io/library/gradle:jdk17@sha256:f7befd3501bae42a8e36ef45ce60a542bc7bbf91cde6195f0b4af98d9dcda0f6        0.0s
 => [stage-1 1/3] FROM docker.io/library/openjdk:17-alpine@sha256:4b6abae565492dbe9e7a894137c966a7485154238902f2f25e9dbd9784383d81 0.0s
 => [internal] load build context                                                                                                  0.0s
 => => transferring context: 5.71kB                                                                                                0.0s
 => CACHED [build 2/7] WORKDIR /app                                                                                                0.0s 
 => CACHED [build 3/7] COPY settings.gradle gradlew ./                                                                             0.0s 
 => CACHED [build 4/7] COPY gradle ./gradle                                                                                        0.0s 
 => [build 5/7] COPY build.gradle ./                                                                                               0.0s 
 => [build 6/7] COPY src ./src                                                                                                     0.0s 
 => [build 7/7] RUN ./gradlew clean build                                                                                         78.5s
 => CACHED [stage-1 2/3] WORKDIR /app                                                                                              0.0s
 => [stage-1 3/3] COPY --from=build /app/build/libs/*.jar ./app.jar                                                                0.1s 
 => exporting to image                                                                                                             0.1s 
 => => exporting layers                                                                                                            0.1s 
 => => writing image sha256:1d4e7a702cadc53ccccf1c1b5566e674b14501973b660701f19b7b33a33a8951                                       0.0s 
 => => naming to docker.io/library/2023-06-15-soap-communication-example-using-spring-provider                                     0.0s
[+] Running 3/3
 ✔ Network 2023-06-15-soap-communication-example-using-spring_default  Created                                                     0.0s 
 ✔ Container consumer-service                                          Started                                                     0.5s 
 ✔ Container provider-service                                          Started
```

##### Result of Practice

* 도커 컴포즈를 통해 두 어플리케이션을 실행합니다.
* cURL 명령어를 통해 소비자에게 정보를 요청 후 응답을 받습니다.

<p align="center">
    <img src="/images/soap-communication-example-using-spring-8.gif" width="100%" class="image__border">
</p>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-06-15-soap-communication-example-using-spring>

#### REFERENCE

* <https://en.wikipedia.org/wiki/Web_service>
* <https://en.wikipedia.org/wiki/Web_services_protocol_stack>
* <https://brewagebear.github.io/soap-and-wsdl/>
* <https://www.baeldung.com/jax-ws>
* <https://www.baeldung.com/spring-boot-soap-web-service>
* <https://spring.io/guides/gs/consuming-web-service/>
* <https://spring.io/guides/gs/producing-web-service/>
* <https://www.nextree.co.kr/p11842/>
* <https://www.nextree.co.kr/p11410/>
* <https://dzone.com/articles/apache-cxf-vs-apache-axis-vs>
* <https://stackoverflow.com/questions/1491926/are-there-any-public-uddi-registries-available>
* <https://medium.com/@innovationchef/web-services-client-in-java-72386ea55ee4>
* <https://docs.spring.io/spring-ws/sites/1.5/reference/html/why-contract-first.html>

[soap-link]: https://junhyunny.github.io/information/soap/
[juddi-link]: https://attic.apache.org/projects/juddi.html