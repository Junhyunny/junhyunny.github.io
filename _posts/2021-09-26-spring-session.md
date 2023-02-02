---
title: "Spring Session with JDBC"
search: false
category:
  - information
  - spring-boot
last_modified_at: 2021-09-26T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [Cookie and Session][cookie-and-session-link]
- [Session Management in Tomcat][tomcat-session-management-link]

## 0. 들어가면서
[Session Management in Tomcat][tomcat-session-management-link]를 주제로 글을 작성하면서 이전에 작성한 [Cookie and Session][cookie-and-session-link] 포스트를 다시 읽어보았습니다. 
다중 인스턴스인 경우 세션을 처리하는 방법에 대한 내용을 언급했었는데, 이를 쉽게 구현할 수 있게 도와주는 Spring 프레임워크의 기능을 발견했습니다. 
`Spring Session`이라는 이름의 이 기능은 `Redis(Cache Server)`, `JDBC(Database)` 등을 통해 세션 정보를 저장, 관리할 수 있는 서비스를 제공합니다. 
주말에 공부할 겸 간단하게 `Spring Session JDBC`를 이용하여 구현해보았습니다. 

## 1. 테스트 시나리오
가정하는 상황과 테스트 시나리오는 다음과 같습니다.
- 브라우저를 통해 각기 다른 호스트(host)로 페이지를 요청합니다.
    - http://localhost:8081 (a-service)
    - http://localhost:8082 (b-service)
- 동일 브라우저를 사용하여 요청하기 때문에 쿠키에 담긴 `JSESSIONID` 정보는 변경되지 않습니다.
- 동일 `JSESSIONID`를 이용하여 요청하므로 서버에서 관리하는 세션(Session) 정보는 변경되지 않습니다.
- 세션에 저장한 데이터를 페이지 표시하여, 두 인스턴스의 세션 데이터가 공유되는지 확인합니다.

<p align="center"><img src="/images/spring-session-1.JPG" width="80%"></p>

## 2. 세션 관리 테이블 생성
세션과 관련된 정보를 데이터베이스에서 관리하려면 테이블이 필요합니다. 
`Spring Doc`에서 제공하는 예제를 보면 다음과 같은 코드가 보입니다. 

##### Spring Doc 예제 코드

```java
@EnableJdbcHttpSession 
public class Config {

	@Bean
	public EmbeddedDatabase dataSource() {
		return new EmbeddedDatabaseBuilder() 
				.setType(EmbeddedDatabaseType.H2).addScript("org/springframework/session/jdbc/schema-h2.sql").build();
	}

	@Bean
	public PlatformTransactionManager transactionManager(DataSource dataSource) {
		return new DataSourceTransactionManager(dataSource); 
	}
}
```

여기서 테이블을 만들 때 사용되는 스키마(schema)정보는 `schema-h2.sql` 파일에 존재하는 것 같습니다. 
해당 파일은 `pom.xml` 파일에 `spring-session-jdbc` 의존성 주입 시 함께 다운받아지므로 `IntelliJ` 파일 검색에서 검색됩니다. 

##### IntelliJ 'schema-h2.sql' 파일 검색

<p align="left"><img src="/images/spring-session-2.JPG"></p>

##### 테이블 스키마 정보 변경 - MySQL 데이터베이스
H2 데이터베이스를 위한 스키마이므로, MySQL 데이터베이스에서 사용할 수 있도록 변경합니다.

```sql
CREATE TABLE SPRING_SESSION (
	PRIMARY_ID CHAR(36) NOT NULL,
	SESSION_ID CHAR(36) NOT NULL,
	CREATION_TIME BIGINT NOT NULL,
	LAST_ACCESS_TIME BIGINT NOT NULL,
	MAX_INACTIVE_INTERVAL INT NOT NULL,
	EXPIRY_TIME BIGINT NOT NULL,
	PRINCIPAL_NAME VARCHAR(100),
	CONSTRAINT SPRING_SESSION_PK PRIMARY KEY (PRIMARY_ID)
);

CREATE UNIQUE INDEX SPRING_SESSION_IX1 ON SPRING_SESSION (SESSION_ID);
CREATE INDEX SPRING_SESSION_IX2 ON SPRING_SESSION (EXPIRY_TIME);
CREATE INDEX SPRING_SESSION_IX3 ON SPRING_SESSION (PRINCIPAL_NAME);

CREATE TABLE SPRING_SESSION_ATTRIBUTES (
	SESSION_PRIMARY_ID CHAR(36) NOT NULL,
	ATTRIBUTE_NAME VARCHAR(200) NOT NULL,
	ATTRIBUTE_BYTES BLOB  NOT NULL,
	CONSTRAINT SPRING_SESSION_ATTRIBUTES_PK PRIMARY KEY (SESSION_PRIMARY_ID, ATTRIBUTE_NAME),
	CONSTRAINT SPRING_SESSION_ATTRIBUTES_FK FOREIGN KEY (SESSION_PRIMARY_ID) REFERENCES SPRING_SESSION(PRIMARY_ID) ON DELETE CASCADE
);
```

##### SPRING_SESSION 테이블 생성 확인 - SQL

```sql
SELECT * FROM SPRING_SESSION;
```

<p align="left"><img src="/images/spring-session-3.JPG"></p>

##### SPRING_SESSION_ATTRIBUTES 테이블 생성 확인 - SQL

```sql
SELECT * FROM SPRING_SESSION_ATTRIBUTES;
```

<p align="left"><img src="/images/spring-session-4.JPG"></p>

## 3. 서비스 구현
이제부터 서비스를 구현합니다. 
시나리오에 `a-service`, `b-service`가 존재하지만, 실제로 구현은 똑같습니다. 
`a-service` 서비스에 대한 구현 코드를 작성하였으며, `b-service` 구현시 `application.yml` 파일의 포트(port) 정보와 `spring.application.name` 설정 값만 변경하면 됩니다.

### 3.1. 패키지 정보

```
./
|-- pom.xml
`-- src
    `-- main
        |-- java
        |   `-- blog
        |       `-- in
        |           `-- action
        |               |-- AServiceApplication.java
        |               |-- config
        |               |   `-- SessionConfiguration.java
        |               `-- controller
        |                   `-- PageController.java
        |-- resources
        |   `-- application.yml
        `-- webapp
            `-- WEB-INF
                `-- jsp
                    `-- index.jsp
```

### 3.2. pom.xml
- JSP 페이지 반환을 위해 다음과 같은 의존성이 존재합니다.
    - spring-boot-starter-tomcat
    - tomcat-embed-jasper
    - jstl
- 세션 공유를 위한 spring-session-jdbc 의존성을 추가합니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.2.5.RELEASE</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>

    <groupId>blog.in.action</groupId>
    <artifactId>a-service</artifactId>
    <version>1.0-SNAPSHOT</version>

    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-tomcat</artifactId>
            <scope>provided</scope>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
            <exclusions>
                <exclusion>
                    <groupId>org.junit.vintage</groupId>
                    <artifactId>junit-vintage-engine</artifactId>
                </exclusion>
            </exclusions>
        </dependency>

        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <scope>provided</scope>
        </dependency>

        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.session</groupId>
            <artifactId>spring-session-jdbc</artifactId>
        </dependency>

        <dependency>
            <groupId>org.apache.tomcat.embed</groupId>
            <artifactId>tomcat-embed-jasper</artifactId>
            <version>9.0.44</version>
            <scope>provided</scope>
        </dependency>

        <dependency>
            <groupId>javax.servlet</groupId>
            <artifactId>jstl</artifactId>
            <version>1.2</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

### 3.3. application.yml
- `spring.session.store-type=jdbc` - jdbc 타입으로 세션 정보를 저장합니다.
- `spring.session.jdbc.initialize-schema=never` - 스키마 정보 초기화는 하지 않습니다.
- `spring.session.jdbc.table-name=SPRING_SESSION` - 세션 정보를 저장할 테이블 명을 지정합니다.

```yml
server:
  port: 8081
spring:
  application:
    name: a-service
  mvc:
    view:
      prefix: /WEB-INF/jsp/
      suffix: .jsp
  session:
    jdbc:
      initialize-schema: never
      table-name: SPRING_SESSION
    store-type: jdbc
  datasource:
    url: jdbc:mysql://127.0.0.1:3306/test?characterEncoding=UTF-8&serverTimezone=UTC
    username: root
    password: 1234
    driver-class-name: com.mysql.cj.jdbc.Driver
```

### 3.4. SessionConfiguration 클래스
- 해당 어플리케이션이 사용하는 데이터소스(datasource)를 주입합니다.
- H2 데이터베이스를 사용하지 않으므로 관련 설정은 제거하였습니다.

```java
package blog.in.action.config;

import javax.sql.DataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.session.jdbc.config.annotation.web.http.EnableJdbcHttpSession;
import org.springframework.transaction.PlatformTransactionManager;

@EnableJdbcHttpSession
public class SessionConfiguration {

    @Bean
    public PlatformTransactionManager transactionManager(DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }
}
```

### 3.5. PageController 클래스
- 세션에 해당 컨트롤러(controller)에 접근한 횟수를 저장합니다.
- 세션 정보를 `ModelAndView` 객체를 이용해 페이지에 담아서 반환합니다.
- @Value 애너테이션을 통해 얻은 어플리케이션 이름도 함께 페이지에 담아서 반환합니다.

```java
package blog.in.action.controller;

import javax.servlet.ServletRequest;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;

@Controller
public class PageController {

    @Value("${spring.application.name}")
    private String applicationName;

    private final String KEY = "controllerCount";

    @RequestMapping
    public ModelAndView index(ServletRequest request) {
        HttpSession session = ((HttpServletRequest) request).getSession(false);
        if (session != null) {
            Integer count = (Integer) session.getAttribute(KEY);
            if (count == null) {
                count = -1;
            }
            session.setAttribute(KEY, count + 1);
        }
        ModelAndView mav = new ModelAndView("/index");
        mav.addObject("applicationName", applicationName);
        mav.addObject("session", session);
        return mav;
    }
}
```

### 3.6. index.jsp
- 요청 버튼을 눌러 `http://localhost:8081`, `http://localhost:8082` 호스트 중 하나로 랜덤하게 요청을 보냅니다. 
- 응답받은 어플리케이션의 이름을 화면에 출력합니다.
- 세션에 저장된 컨트롤러 접근 횟수를 출력합니다.

```html
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<html>
<head>
    <title>Title</title>
<body>
</head>

<div>
    <h1>메인 화면</h1>
</div>

<div id="timeout"></div>

<div>
    <h5>어플리케이션 이름
        <c:out value="${applicationName}"/>
    </h5>
</div>

<button onclick="onClick()">요청</button>

<c:if test="${session == null}">
    <div>
        <h5>세션이 없습니다.</h5>
    </div>
</c:if>

<c:if test="${session != null}">
    <div>
        <h5>컨트롤러 접근 횟수
            <c:out value="${session.getAttribute('controllerCount')}"/>
        </h5>
    </div>
</c:if>

<script type="text/javascript">

    let time = 0;
    let element = document.getElementById("timeout");
    element.innerHTML = time + " 초";
    setInterval(function () {
        time += 1;
        element.innerHTML = time + " 초";
    }, 1000);

    function onClick() {
        let randomKey = Math.floor(Math.random() * 2);
        let url = 'http://localhost';
        if (randomKey == 0) {
            url += ':8081';
        } else {
            url += ':8082';
        }
        window.location.href = url;
    }
</script>

</body>
</html>
```

## 4. 테스트 수행

### 4.1. 브라우저 화면

<p align="center"><img src="/images/spring-session-5.gif"></p>

### 4.2. 데이터베이스

##### SPRING_SESSION 테이블 확인 - SQL

```sql
SELECT * FROM SPRING_SESSION;
```

<p align="left"><img src="/images/spring-session-6.JPG"></p>

##### SPRING_SESSION_ATTRIBUTES 테이블 확인 - SQL

```sql
SELECT * FROM SPRING_SESSION_ATTRIBUTES;
```

<p align="left"><img src="/images/spring-session-7.JPG"></p>

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-09-26-spring-session>

#### REFERENCE
- <https://docs.spring.io/spring-session/docs/2.3.3.RELEASE/reference/html5/guides/boot-jdbc.html>
- <https://docs.spring.io/spring-session/docs/current/reference/html5/guides/java-jdbc.html>

[cookie-and-session-link]: https://junhyunny.github.io/information/cookie-and-session/
[tomcat-session-management-link]: https://junhyunny.github.io/information/server/tomcat-session-management/