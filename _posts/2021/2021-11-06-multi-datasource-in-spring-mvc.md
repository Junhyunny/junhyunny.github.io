---
title: "Using multi datasource in Spring MVC"
search: false
category:
  - spring-mvc
last_modified_at: 2021-11-06T23:55:00
---

<br/>

## 0. 들어가면서
타 시스템과의 데이터 공유를 하기 가장 쉬운 방식은 아무래도 API 요청인 것 같습니다. 
필요한 데이터를 요청하고 응답을 받으면 됩니다. 
하지만, 경우에 따라 API 요청만으로 문제를 해결하기 어려울 수 있습니다. 
- 대용량의 데이터 요청으로 인해 타 서비스에 부하를 유발할 수 있는 경우
- 잦은 데이터 요청으로 타 서비스, 시스템 네트워크에 부하를 유발할 수 있는 경우

이런 경우엔 타 시스템 데이터베이스에 직접 연결이 필요할 수 있습니다. 
어플리케이션 서버에서 별개의 데이터소스(datasource)를 만들어 타 시스템 데이터베이스 연결에 사용해야합니다. 
스프링 프레임워크에서 다중 데이터소스를 만들어 두 개의 데이터베이스에 연결해보도록 하겠습니다. 

##### 다중 데이터베이스 연결 모습
- 기존에 사용하고 있는 데이터베이스가 MySQL이라고 가정합니다.
- 신규로 연결할 데이터베이스가 PostgreSQL 이라고 가정합니다.

<p align="center"><img src="/images/multi-datasource-in-spring-mvc-1.JPG" width="40%"></p>

## 1. 테스트 환경
시스템 구성시 버전으로 인한 이슈가 발생할 수 있습니다. 
제가 테스트에서 사용한 버전과 원하시는 버전을 확인하시고 변경하여 사용하시길 바랍니다. 
테스트를 위해선 MariaDB 데이터베이스와 PostgreSQL 데이터베이스가 로컬(local) PC에 설치되어 있어야 합니다. 

- MariaDB 10.5.9
- PostgreSQL 14.0, compiled by Visual C++ build 1914, 64-bit
- Spring Framework 5.2.3.RELEASE

## 2. Spring MVC Framework
현재 진행하는 프로젝트 기술 스택인 Spring MVC(Spring Legacy) 프레임워크에서 다중 데이터소스를 연결해보겠습니다. 
Spring MVC 프레임워크에서 주로 사용하는 영속(persistence) 프레임워크인 MyBatis를 사용하였습니다.
시간이나 기회가 된다면 Spring Boot 프레임워크를 이용한 구현 예제도 포스트할 예정입니다. 

### 2.1. 패키지(package) 구조
- 기존 운영 중인 시스템 자원은 `mysql` 하위 패키지에 위치한다고 가정합니다.
- 신규 데이터베이스에 접근할 수 있는 자원은 `postgresql` 하위 패키지에 위치한다고 가정합니다.
- 신규 데이터베이스에 연결할 자원은 별도 패키지로 구분하는 것이 바람직하다고 생각합니다.

```
$ tree -I 'idea|lib|out|test|target' ./
./
|-- pom.xml
`-- src
    `-- main
        |-- java
        |   `-- blog
        |       `-- in
        |           `-- action
        |               |-- mysql
        |               |   |-- controller
        |               |   |   `-- MySqlController.java
        |               |   |-- dao
        |               |   |   `-- MySqlDao.java
        |               |   `-- service
        |               |       |-- MySqlService.java
        |               |       `-- impl
        |               |           `-- MySqlServiceImpl.java
        |               `-- postgresql
        |                   |-- controller
        |                   |   `-- PostgreSqlController.java
        |                   |-- dao
        |                   |   `-- PostgreSqlDao.java
        |                   `-- service
        |                       |-- PostgreSqlService.java
        |                       `-- impl
        |                           `-- PostgreSqlServiceImpl.java
        |-- resources
        |   `-- sql
        |       |-- mysql
        |       |   `-- mysql.xml
        |       `-- postgresql
        |           `-- postgresql.xml
        `-- webapp
            `-- WEB-INF
                |-- applicationContext.xml
                |-- dispatcher-servlet.xml
                `-- web.xml
```

### 2.2. pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>blog.in.action</groupId>
    <artifactId>action-in-blog</artifactId>
    <version>1.0-SNAPSHOT</version>
    <packaging>war</packaging>

    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <org.springframework-version>5.2.3.RELEASE</org.springframework-version>
        <org.aspectj-version>1.6.10</org.aspectj-version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-context</artifactId>
            <version>${org.springframework-version}</version>
            <exclusions>
                <exclusion>
                    <groupId>commons-logging</groupId>
                    <artifactId>commons-logging</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-webmvc</artifactId>
            <version>${org.springframework-version}</version>
        </dependency>
        <dependency>
            <groupId>org.aspectj</groupId>
            <artifactId>aspectjweaver</artifactId>
            <version>${org.aspectj-version}</version>
        </dependency>
        <dependency>
            <groupId>javax.servlet</groupId>
            <artifactId>javax.servlet-api</artifactId>
            <version>3.1.0</version>
        </dependency>
        <dependency>
            <groupId>javax.servlet.jsp</groupId>
            <artifactId>jsp-api</artifactId>
            <version>2.1</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>javax.servlet</groupId>
            <artifactId>jstl</artifactId>
            <version>1.2</version>
        </dependency>
        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
            <version>4.12</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-test</artifactId>
            <version>${org.springframework-version}</version>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>1.18.0</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>5.1.31</version>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <version>42.3.1</version>
        </dependency>
        <dependency>
            <groupId>org.mybatis</groupId>
            <artifactId>mybatis</artifactId>
            <version>3.5.6</version>
        </dependency>
        <dependency>
            <groupId>org.mybatis</groupId>
            <artifactId>mybatis-spring</artifactId>
            <version>2.0.5</version>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-jdbc</artifactId>
            <version>4.3.25.RELEASE</version>
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-core</artifactId>
            <version>2.9.4</version>
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
            <version>2.9.4</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>2.5.1</version>
                <configuration>
                    <source>1.8</source>
                    <target>1.8</target>
                    <compilerArgument>-Xlint:all</compilerArgument>
                    <showWarnings>true</showWarnings>
                    <showDeprecation>true</showDeprecation>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

### 2.3. applicationContext.xml
스프링 컨텍스트에 필요한 정보들을 정의하는 `applicationContext.xml` 파일입니다. 
별도의 데이터소스 객체를 갖기 위해 비슷한 설정을 이름만 바꿔 두 개로 나눴습니다. 

#### 2.3.1. MySql 데이터베이스 접근 설정
- 빈(bean) 객체 이름에 접미사로 `4MySql`을 붙혔습니다.
- `dataSource4MySql` - MySQL 데이터베이스 접근시 사용하는 데이터소스 객체
- `sqlSession4MySql`- 질의(query)를 수행할 MyBatis의 SqlSession 객체를 만드는 팩토리(factory) 객체
- `sqlSessionTemplate4MySql` - 질의 등을 쉽게 사용할 수 있는 템플릿(template) 객체
- `txManager4MySql` - 트랜잭션 처리를 위한 트랜잭션 매니저 객체
- `txAdvice4MySql` - 어떤 이름 규칙을 가진 메소드 수행시 트랜잭션 처리를 수행할지 지정합니다.
- `requiredTx4MySql` - 어떤 클래스의 메소드의 시점을 빼앗아 트랜잭션을 처리할지 정의합니다.
- `mapper:scan base-package="blog.in.action.mysql.dao"` - 비즈니스 로직에서 데이터베이스에게 질의를 수행할 DAO(Data Access Object) 객체들의 위치를 지정합니다.
    - `blog.in.action.mysql.dao` 하위 패키지의 DAO 객체에서 사용하는 SqlSession 객체는 `sqlSession4MySql` 팩토리 객체를 통해 생성됩니다.

```xml
   <bean id="dataSource4MySql" class="org.springframework.jdbc.datasource.SimpleDriverDataSource">
        <property name="driverClass" value="com.mysql.jdbc.Driver"/>
        <property name="connectionProperties">
            <value>zeroDateTimeBehavior=convertToNull</value>
        </property>
        <property name="url" value="jdbc:mysql://localhost:3306/test"/>
        <property name="username" value="root"/>
        <property name="password" value="1234"/>
    </bean>

    <bean id="sqlSession4MySql" class="org.mybatis.spring.SqlSessionFactoryBean">
        <property name="dataSource" ref="dataSource4MySql"/>
        <property name="mapperLocations">
            <list>
                <value>classpath:/sql/mysql/*.xml</value>
            </list>
        </property>
    </bean>

    <bean id="sqlSessionTemplate4MySql" class="org.mybatis.spring.SqlSessionTemplate" destroy-method="clearCache">
        <constructor-arg index="0" ref="sqlSession4MySql"/>
    </bean>

    <bean id="txManager4MySql" class="org.springframework.jdbc.datasource.DataSourceTransactionManager">
        <property name="dataSource" ref="dataSource4MySql"/>
    </bean>

    <tx:advice id="txAdvice4MySql" transaction-manager="txManager4MySql">
        <tx:attributes>
            <tx:method name="*" rollback-for="Exception"/>
        </tx:attributes>
    </tx:advice>

    <aop:config>
        <aop:pointcut id="requiredTx4MySql" expression="execution(* blog.in.action.mysql.service.impl.*Impl.*(..))"/>
        <aop:advisor advice-ref="txAdvice4MySql" pointcut-ref="requiredTx4MySql"/>
    </aop:config>

    <mapper:scan base-package="blog.in.action.mysql.dao" factory-ref="sqlSession4MySql"/>
```

#### 2.3.2. PostgreSql 데이터베이스 접근 설정
- 빈(bean) 객체 이름에 접미사로 `4PostgreSql`을 붙혔습니다.
- `dataSource4PostgreSql` - MySQL 데이터베이스 접근시 사용하는 데이터소스 객체
- `sqlSession4PostgreSql`- 질의(query)를 수행할 MyBatis의 SqlSession 객체를 만드는 팩토리(factory) 객체
- `sqlSessionTemplate4PostgreSql` - 질의 등을 쉽게 사용할 수 있는 템플릿(template) 객체
- `txManager4PostgreSql` - 트랜잭션 처리를 위한 트랜잭션 매니저 객체
- `txAdvice4PostgreSql` - 어떤 이름 규칙을 가진 메소드 수행시 트랜잭션 처리를 수행할지 지정합니다.
- `requiredTx4PostgreSql` - 어떤 클래스의 메소드의 시점을 빼앗아 트랜잭션을 처리할지 정의합니다.
- `mapper:scan base-package="blog.in.action.postgresql.dao"` - 비즈니스 로직에서 데이터베이스에게 질의를 수행할 DAO(Data Access Object) 객체들의 위치를 지정합니다.
    - `blog.in.action.postgresql.dao` 하위 패키지의 DAO 객체에서 사용하는 SqlSession 객체는 `sqlSession4PostgreSql` 팩토리 객체를 통해 생성됩니다.

```xml
    <bean id="dataSource4PostgreSql" class="org.springframework.jdbc.datasource.SimpleDriverDataSource">
        <property name="driverClass" value="org.postgresql.Driver"/>
        <property name="connectionProperties">
            <value>zeroDateTimeBehavior=convertToNull</value>
        </property>
        <property name="url" value="jdbc:postgresql://localhost:5432/postgres"/>
        <property name="username" value="postgres"/>
        <property name="password" value="1234"/>
    </bean>

    <bean id="sqlSession4PostgreSql" class="org.mybatis.spring.SqlSessionFactoryBean">
        <property name="dataSource" ref="dataSource4PostgreSql"/>
        <property name="mapperLocations">
            <list>
                <value>classpath:/sql/postgresql/*.xml</value>
            </list>
        </property>
    </bean>

    <bean id="sqlSessionTemplate4PostgreSql" class="org.mybatis.spring.SqlSessionTemplate" destroy-method="clearCache">
        <constructor-arg index="0" ref="sqlSession4PostgreSql"/>
    </bean>

    <bean id="txManager4PostgreSql" class="org.springframework.jdbc.datasource.DataSourceTransactionManager">
        <property name="dataSource" ref="dataSource4PostgreSql"/>
    </bean>

    <tx:advice id="txAdvice4PostgreSql" transaction-manager="txManager4PostgreSql">
        <tx:attributes>
            <tx:method name="*" rollback-for="Exception"/>
        </tx:attributes>
    </tx:advice>

    <aop:config>
        <aop:pointcut id="requiredTx4PostgreSql" expression="execution(* blog.in.action.postgresql.service.impl.*Impl.*(..))"/>
        <aop:advisor advice-ref="txAdvice4PostgreSql" pointcut-ref="requiredTx4PostgreSql"/>
    </aop:config>

    <mapper:scan base-package="blog.in.action.postgresql.dao" factory-ref="sqlSession4PostgreSql"/>
```

#### 2.3.3. NoUniqueBeanDefinitionException: No qualifying bean of type 'org.apache.ibatis.session.SqlSessionFactory' available
`contextApplication.xml` 설정을 잘못하면 다음과 같은 에러를 만날 수 있습니다. 

##### 에러 로그
```
...
Unsatisfied dependency expressed through bean property 'sqlSessionFactory'; 
nested exception is org.springframework.beans.factory.NoUniqueBeanDefinitionException: No qualifying bean of type 'org.apache.ibatis.session.SqlSessionFactory' 
available: expected single matching bean but found 2: sqlSession4MySql,sqlSession4PostgreSql
06-Nov-2021 16:56:22.643 SEVERE [RMI TCP Connection(3)-127.0.0.1] org.springframework.web.context.ContextLoader.initWebApplicationContext Context initialization failed
...
```

해당 에러는 사용할 `SqlSessionFactory` 객체가 두 개 이상 발견되기 때문에 발생됩니다. 
`mapper:scan` 행위를 할 때 필요한 `SqlSessionFactory` 객체를 찾으면 `sqlSession4MySql`, `sqlSession4PostgreSql` 두 개가 발견되기 때문입니다. 
각 DAO 객체 생성시 사용할 팩토리 빈(bean) 객체를 지정하면 에러가 발생하지 않습니다. 

##### 에러가 발생하는 설정

```xml
    ... 
    <mapper:scan base-package="blog.in.action.mysql.dao"/>
    ...
    <mapper:scan base-package="blog.in.action.postgresql.dao"/>
```

##### 에러가 발생하지 않는 설정

```xml 
    ...
    <mapper:scan base-package="blog.in.action.mysql.dao" factory-ref="sqlSession4MySql"/>
    ...
    <mapper:scan base-package="blog.in.action.postgresql.dao" factory-ref="sqlSession4PostgreSql"/>
```

### 2.4. Controller 클래스
클래스 이름과 요청 path만 다르기 때문에 MySQL 데이터베이스에 접근할 수 있는 컨트롤러 클래스만 소개하겠습니다. 

```java
package blog.in.action.mysql.controller;

import blog.in.action.mysql.service.MySqlService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MySqlController {

    private final MySqlService service;

    public MySqlController(MySqlService service) {
        this.service = service;
    }

    @RequestMapping("/")
    public String index() {
        return "Hello. This is Junhyunny's blog";
    }

    @RequestMapping("/mysql")
    public @ResponseBody
    List<Map<String, Object>> selectTest() {
        return service.selectTest();
    }
}
```

### 2.5. ServiceImpl 클래스
클래스 이름만 다르기 때문에 MySQL 데이터베이스에 접근할 수 있는 서비스 구현 클래스만 소개하겠습니다. 

```java
package blog.in.action.mysql.service.impl;

import blog.in.action.mysql.dao.MySqlDao;
import blog.in.action.mysql.service.MySqlService;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class MySqlServiceImpl implements MySqlService {

    private final MySqlDao mySqlDao;

    public MySqlServiceImpl(MySqlDao mySqlDao) {
        this.mySqlDao = mySqlDao;
    }

    @Override
    public List<Map<String, Object>> selectTest() {
        return mySqlDao.selectTest();
    }
}
```

### 2.6. DAO 인터페이스
인터페이스 이름만 다르기 때문에 MySQL 데이터베이스에 접근할 수 있는 DAO 인터페이스만 소개하겠습니다.

```java
package blog.in.action.mysql.dao;

import java.util.List;
import java.util.Map;

public interface MySqlDao {

    List<Map<String, Object>> selectTest();
}
```

### 2.7. Mapper XML 파일
XML 파일 이름과 위치만 다르므로 MySQL 데이터베이스에 접근할 수 있는 XML 파일만 소개하겠습니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="blog.in.action.mysql.dao.MySqlDao">

    <select id="selectTest" resultType="java.util.Map">
        select *
        from TB_TEST
    </select>

</mapper>
```

## 3. 테스트 수행
두 데이터소스로부터 데이터를 조회하는 API 요청 테스트 코드를 작성하였습니다. 
`localhost:8080/mysql` API 요청을 통해 MySQL 데이터베이스에 저장된 데이터를 확인할 수 있습니다. 
`localhost:8080/postgresql` API 요청을 통해 PostgreSQL 데이터베이스에 저장된 데이터를 확인할 수 있습니다. 

### 3.1. MySQL 데이터베이스 접근

##### MySQL 데이터베이스 TB_TEST 테이블 데이터

<p align="left"><img src="/images/multi-datasource-in-spring-mvc-2.JPG"></p>

##### curl 명령어 수행

```
$ curl localhost:8080/mysql
[{"DATABASE_NAME":"MYSQL","ID":"01012341234"}]
```

### 3.2. PostgreSQL 데이터베이스 접근

##### PostgreSQL 데이터베이스 TB_TEST 테이블 데이터

<p align="left"><img src="/images/multi-datasource-in-spring-mvc-3.JPG"></p>

##### curl 명령어 수행

```
$ curl localhost:8080/postgresql
[{"database_name":"POSTGRE_SQL","id":"01012341234"}]
```

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-11-06-multi-datasource-in-spring-mvc>

#### REFERENCE
- <https://okky.kr/article/291644>
- <https://osc131.tistory.com/48>