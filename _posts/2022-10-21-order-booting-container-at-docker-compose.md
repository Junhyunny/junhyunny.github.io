---
title: "Order Booting Container at Docker Compose"
search: false
category:
  - docker
last_modified_at: 2022-10-21T23:55:00
---

<br>

## 1. 문제 현상

도커 컴포즈(compose)를 사용하여 데이터베이스와 서버 컨테이너를 동시에 실행할 때 문제가 발생했습니다. 
`depends_on` 설정으로 `backend` 컨테이너는 `mysql` 컨테이너에 의존하고 있음을 표시했지만, 컴포즈 업(up) 실행 중 에러가 발생하였습니다. 

##### 문제 발생 - docker-compose.yml 파일 

* `depends_on` 설정으로 `mysql` 컨테이너에 의존하고 있음을 표시합니다.

```yml
version: '3.8'
services:
  mysql:
    image: mysql
    container_name: database-host
    ports:
      - '3306:3306'
    environment:
      - MYSQL_ROOT_PASSWORD=123
  backend:
    build: .
    ports:
      - '8080:8080'
    environment:
      - JASYPT_SECRETE_KEY=HelloWorld
    depends_on:
      - mysql
```

##### 문제 로그

`mysql` 컨테이너는 `database-host`, `backend` 컨테이너는 `action-in-blog-backend-1`라는 이름을 가집니다. 

* `mysql` 컨테이너가 먼저 실행됩니다.
* `mysql` 컨테이너가 준비를 완료하기 전에 `backend` 컨테이너가 실행됩니다.
* `backend` 컨테이너가 데이터베이스에 연결하지 못하고 종료됩니다.
* `mysql` 컨테이너는 준비를 마칩니다. 

```
$ docker-compose up  
[+] Running 3/3
 ⠿ Network action-in-blog_default      Created                                                       0.0s
 ⠿ Container database-host             Created                                                       0.0s
 ⠿ Container action-in-blog-backend-1  Created                                                       0.0s
Attaching to action-in-blog-backend-1, database-host
database-host             | 2022-10-21 14:47:49+00:00 [Note] [Entrypoint]: Entrypoint script for MySQL Server 8.0.31-1.el8 started.
database-host             | 2022-10-21 14:47:50+00:00 [Note] [Entrypoint]: Switching to dedicated user 'mysql'
database-host             | 2022-10-21 14:47:50+00:00 [Note] [Entrypoint]: Entrypoint script for MySQL Server 8.0.31-1.el8 started.
database-host             | 2022-10-21 14:47:50+00:00 [Note] [Entrypoint]: Initializing database files
database-host             | 2022-10-21T14:47:50.259838Z 0 [Warning] [MY-011068] [Server] The syntax '--skip-host-cache' is deprecated and will be removed in a future release. Please use SET GLOBAL host_cache_size=0 instead.
database-host             | 2022-10-21T14:47:50.259929Z 0 [System] [MY-013169] [Server] /usr/sbin/mysqld (mysqld 8.0.31) initializing of server in progress as process 80
database-host             | 2022-10-21T14:47:50.265608Z 1 [System] [MY-013576] [InnoDB] InnoDB initialization has started.
database-host             | 2022-10-21T14:47:50.549045Z 1 [System] [MY-013577] [InnoDB] InnoDB initialization has ended.
action-in-blog-backend-1  | 
action-in-blog-backend-1  |   .   ____          _            __ _ _
action-in-blog-backend-1  |  /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
action-in-blog-backend-1  | ( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
action-in-blog-backend-1  |  \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
action-in-blog-backend-1  |   '  |____| .__|_| |_|_| |_\__, | / / / /
action-in-blog-backend-1  |  =========|_|==============|___/=/_/_/_/
action-in-blog-backend-1  |  :: Spring Boot ::                (v2.7.4)
action-in-blog-backend-1  | 
action-in-blog-backend-1  | 2022-10-21 14:47:51.081  INFO 1 --- [           main] action.in.blog.ActionInBlogApplication   : Starting ActionInBlogApplication v0.0.1-SNAPSHOT using Java 11.0.16 on 257e662b4746 with PID 1 (/app/app.jar started by root in /app)
action-in-blog-backend-1  | 2022-10-21 14:47:51.096  INFO 1 --- [           main] action.in.blog.ActionInBlogApplication   : No active profile set, falling back to 1 default profile: "default"
database-host             | 2022-10-21T14:47:51.578390Z 6 [Warning] [MY-010453] [Server] root@localhost is created with an empty password ! Please consider switching off the --initialize-insecure option.
action-in-blog-backend-1  | 2022-10-21 14:47:51.682  INFO 1 --- [           main] .s.d.r.c.RepositoryConfigurationDelegate : Bootstrapping Spring Data JPA repositories in DEFAULT mode.
action-in-blog-backend-1  | 2022-10-21 14:47:51.697  INFO 1 --- [           main] .s.d.r.c.RepositoryConfigurationDelegate : Finished Spring Data repository scanning in 5 ms. Found 0 JPA repository interfaces.
action-in-blog-backend-1  | 2022-10-21 14:47:51.953  INFO 1 --- [           main] ptablePropertiesBeanFactoryPostProcessor : Post-processing PropertySource instances
action-in-blog-backend-1  | 2022-10-21 14:47:51.954  INFO 1 --- [           main] c.u.j.EncryptablePropertySourceConverter : Skipping PropertySource configurationProperties [class org.springframework.boot.context.properties.source.ConfigurationPropertySourcesPropertySource
action-in-blog-backend-1  | 2022-10-21 14:47:51.956  INFO 1 --- [           main] c.u.j.EncryptablePropertySourceConverter : Skipping PropertySource servletConfigInitParams [class org.springframework.core.env.PropertySource$StubPropertySource
action-in-blog-backend-1  | 2022-10-21 14:47:51.956  INFO 1 --- [           main] c.u.j.EncryptablePropertySourceConverter : Skipping PropertySource servletContextInitParams [class org.springframework.core.env.PropertySource$StubPropertySource
action-in-blog-backend-1  | 2022-10-21 14:47:51.957  INFO 1 --- [           main] c.u.j.EncryptablePropertySourceConverter : Converting PropertySource systemProperties [org.springframework.core.env.PropertiesPropertySource] to EncryptableMapPropertySourceWrapper
action-in-blog-backend-1  | 2022-10-21 14:47:51.957  INFO 1 --- [           main] c.u.j.EncryptablePropertySourceConverter : Converting PropertySource systemEnvironment [org.springframework.boot.env.SystemEnvironmentPropertySourceEnvironmentPostProcessor$OriginAwareSystemEnvironmentPropertySource] to EncryptableSystemEnvironmentPropertySourceWrapper
action-in-blog-backend-1  | 2022-10-21 14:47:51.957  INFO 1 --- [           main] c.u.j.EncryptablePropertySourceConverter : Converting PropertySource random [org.springframework.boot.env.RandomValuePropertySource] to EncryptablePropertySourceWrapper
action-in-blog-backend-1  | 2022-10-21 14:47:51.957  INFO 1 --- [           main] c.u.j.EncryptablePropertySourceConverter : Converting PropertySource Config resource 'class path resource [application.yml]' via location 'optional:classpath:/' [org.springframework.boot.env.OriginTrackedMapPropertySource] to EncryptableMapPropertySourceWrapper
action-in-blog-backend-1  | 2022-10-21 14:47:52.278  INFO 1 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port(s): 8080 (http)
action-in-blog-backend-1  | 2022-10-21 14:47:52.289  INFO 1 --- [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
action-in-blog-backend-1  | 2022-10-21 14:47:52.289  INFO 1 --- [           main] org.apache.catalina.core.StandardEngine  : Starting Servlet engine: [Apache Tomcat/9.0.65]
action-in-blog-backend-1  | 2022-10-21 14:47:52.361  INFO 1 --- [           main] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring embedded WebApplicationContext
action-in-blog-backend-1  | 2022-10-21 14:47:52.361  INFO 1 --- [           main] w.s.c.ServletWebServerApplicationContext : Root WebApplicationContext: initialization completed in 1216 ms
action-in-blog-backend-1  | 2022-10-21 14:47:52.430  INFO 1 --- [           main] c.u.j.filter.DefaultLazyPropertyFilter   : Property Filter custom Bean not found with name 'encryptablePropertyFilter'. Initializing Default Property Filter
action-in-blog-backend-1  | 2022-10-21 14:47:52.440  INFO 1 --- [           main] c.u.j.r.DefaultLazyPropertyResolver      : Property Resolver custom Bean not found with name 'encryptablePropertyResolver'. Initializing Default Property Resolver
action-in-blog-backend-1  | 2022-10-21 14:47:52.443  INFO 1 --- [           main] c.u.j.d.DefaultLazyPropertyDetector      : Property Detector custom Bean not found with name 'encryptablePropertyDetector'. Initializing Default Property Detector
action-in-blog-backend-1  | 2022-10-21 14:47:52.470  INFO 1 --- [           main] c.u.j.encryptor.DefaultLazyEncryptor     : Found Custom Encryptor Bean org.jasypt.encryption.pbe.PooledPBEStringEncryptor@10ded6a9 with name: jasyptStringEncryptor
action-in-blog-backend-1  | 2022-10-21 14:47:52.705  INFO 1 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Starting...
action-in-blog-backend-1  | 2022-10-21 14:47:53.803 ERROR 1 --- [           main] com.zaxxer.hikari.pool.HikariPool        : HikariPool-1 - Exception during pool initialization.
action-in-blog-backend-1  | 
action-in-blog-backend-1  | com.mysql.cj.jdbc.exceptions.CommunicationsException: Communications link failure
action-in-blog-backend-1  | 
action-in-blog-backend-1  | The last packet sent successfully to the server was 0 milliseconds ago. The driver has not received any packets from the server.
action-in-blog-backend-1  |     at com.mysql.cj.jdbc.exceptions.SQLError.createCommunicationsException(SQLError.java:174) ~[mysql-connector-java-8.0.30.jar!/:8.0.30]
action-in-blog-backend-1  |     at com.mysql.cj.jdbc.exceptions.SQLExceptionsMapping.translateException(SQLExceptionsMapping.java:64) ~[mysql-connector-java-8.0.30.jar!/:8.0.30]
action-in-blog-backend-1  |     ...

action-in-blog-backend-1  | 2022-10-21 14:47:53.841  INFO 1 --- [           main] o.hibernate.jpa.internal.util.LogHelper  : HHH000204: Processing PersistenceUnitInfo [name: default]
action-in-blog-backend-1  | 2022-10-21 14:47:53.896  INFO 1 --- [           main] org.hibernate.Version                    : HHH000412: Hibernate ORM core version 5.6.11.Final
action-in-blog-backend-1  | 2022-10-21 14:47:54.076  INFO 1 --- [           main] o.hibernate.annotations.common.Version   : HCANN000001: Hibernate Commons Annotations {5.1.2.Final}
action-in-blog-backend-1  | 2022-10-21 14:47:54.156  INFO 1 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Starting...
database-host             | 2022-10-21 14:47:54+00:00 [Note] [Entrypoint]: Database files initialized
database-host             | 2022-10-21 14:47:54+00:00 [Note] [Entrypoint]: Starting temporary server
database-host             | 2022-10-21T14:47:54.882141Z 0 [Warning] [MY-011068] [Server] The syntax '--skip-host-cache' is deprecated and will be removed in a future release. Please use SET GLOBAL host_cache_size=0 instead.
database-host             | 2022-10-21T14:47:54.883405Z 0 [System] [MY-010116] [Server] /usr/sbin/mysqld (mysqld 8.0.31) starting as process 131
database-host             | 2022-10-21T14:47:54.902321Z 1 [System] [MY-013576] [InnoDB] InnoDB initialization has started.
database-host             | 2022-10-21T14:47:55.005004Z 1 [System] [MY-013577] [InnoDB] InnoDB initialization has ended.
action-in-blog-backend-1  | 2022-10-21 14:47:55.158 ERROR 1 --- [           main] com.zaxxer.hikari.pool.HikariPool        : HikariPool-1 - Exception during pool initialization.
action-in-blog-backend-1  | 
action-in-blog-backend-1  | com.mysql.cj.jdbc.exceptions.CommunicationsException: Communications link failure
action-in-blog-backend-1  | 
action-in-blog-backend-1  | The last packet sent successfully to the server was 0 milliseconds ago. The driver has not received any packets from the server.
action-in-blog-backend-1  |     at com.mysql.cj.jdbc.exceptions.SQLError.createCommunicationsException(SQLError.java:174) ~[mysql-connector-java-8.0.30.jar!/:8.0.30]
action-in-blog-backend-1  |     at com.mysql.cj.jdbc.exceptions.SQLExceptionsMapping.translateException(SQLExceptionsMapping.java:64) ~[mysql-connector-java-8.0.30.jar!/:8.0.30]
action-in-blog-backend-1  |     ...
action-in-blog-backend-1  |     at org.hibernate.service.internal.AbstractServiceRegistryImpl.createService(AbstractServiceRegistryImpl.java:263) ~[hibernate-core-5.6.11.Final.jar!/:5.6.11.Final]
action-in-blog-backend-1  |     ... 41 common frames omitted
action-in-blog-backend-1  | 
database-host             | 2022-10-21 14:47:55+00:00 [Note] [Entrypoint]: Temporary server started.
database-host             | '/var/lib/mysql/mysql.sock' -> '/var/run/mysqld/mysqld.sock'
action-in-blog-backend-1 exited with code 1
database-host             | Warning: Unable to load '/usr/share/zoneinfo/iso3166.tab' as time zone. Skipping it.
database-host             | Warning: Unable to load '/usr/share/zoneinfo/leapseconds' as time zone. Skipping it.
database-host             | Warning: Unable to load '/usr/share/zoneinfo/tzdata.zi' as time zone. Skipping it.
database-host             | Warning: Unable to load '/usr/share/zoneinfo/zone.tab' as time zone. Skipping it.
database-host             | Warning: Unable to load '/usr/share/zoneinfo/zone1970.tab' as time zone. Skipping it.
database-host             | 
database-host             | 2022-10-21 14:47:57+00:00 [Note] [Entrypoint]: Stopping temporary server
database-host             | 2022-10-21T14:47:57.565807Z 10 [System] [MY-013172] [Server] Received SHUTDOWN from user root. Shutting down mysqld (Version: 8.0.31).
database-host             | 2022-10-21T14:47:58.794659Z 0 [System] [MY-010910] [Server] /usr/sbin/mysqld: Shutdown complete (mysqld 8.0.31)  MySQL Community Server - GPL.
database-host             | 2022-10-21 14:47:59+00:00 [Note] [Entrypoint]: Temporary server stopped
database-host             | 
database-host             | 2022-10-21 14:47:59+00:00 [Note] [Entrypoint]: MySQL init process done. Ready for start up.
database-host             | 
database-host             | 2022-10-21T14:47:59.798262Z 0 [Warning] [MY-011068] [Server] The syntax '--skip-host-cache' is deprecated and will be removed in a future release. Please use SET GLOBAL host_cache_size=0 instead.
database-host             | 2022-10-21T14:47:59.799634Z 0 [System] [MY-010116] [Server] /usr/sbin/mysqld (mysqld 8.0.31) starting as process 1
database-host             | 2022-10-21T14:47:59.805444Z 1 [System] [MY-013576] [InnoDB] InnoDB initialization has started.
database-host             | 2022-10-21T14:47:59.902776Z 1 [System] [MY-013577] [InnoDB] InnoDB initialization has ended.
database-host             | 2022-10-21T14:48:00.031164Z 0 [Warning] [MY-010068] [Server] CA certificate ca.pem is self signed.
database-host             | 2022-10-21T14:48:00.031217Z 0 [System] [MY-013602] [Server] Channel mysql_main configured to support TLS. Encrypted connections are now supported for this channel.
database-host             | 2022-10-21T14:48:00.032430Z 0 [Warning] [MY-011810] [Server] Insecure configuration for --pid-file: Location '/var/run/mysqld' in the path is accessible to all OS users. Consider choosing a different directory.
database-host             | 2022-10-21T14:48:00.048893Z 0 [System] [MY-011323] [Server] X Plugin ready for connections. Bind-address: '::' port: 33060, socket: /var/run/mysqld/mysqlx.sock
database-host             | 2022-10-21T14:48:00.048952Z 0 [System] [MY-010931] [Server] /usr/sbin/mysqld: ready for connections. Version: '8.0.31'  socket: '/var/run/mysqld/mysqld.sock'  port: 3306  MySQL Community Server - GPL.
```

## 2. 문제 원인

로그를 보면 문제 원인이 확실합니다. 
`mysql` 컨테이너가 완전히 준비되기 전에 `backend` 컨테이너가 데이터베이스에 접근하려다 에러가 발생하고 종료된 것 입니다. 
`depends_on` 설정을 통해 컨테이너 사이의 의존성을 표시했는데 어째서 `backend` 컨테이너가 시작했는지 찾아봤습니다. 

> [Docker Docs](https://docs.docker.com/compose/compose-file/compose-file-v3/#depends_on)
> There are several things to be aware of when using depends_on:<br/>
> depends_on does not wait for db and redis to be “ready” before starting web - only until they have been started. 
> If you need to wait for a service to be ready, see Controlling startup order for more on this problem and strategies for solving it. 

`depends_on`을 통해 설정된 의존 컨테이너들이 완전히 준비되기를 기다리지 않아서 문제가 발생한 것 입니다. 
도커 컴포즈는 `depends_on` 설정에 따라 컨테이너를 실행하고 종료하지만, 의존 컨테이너가 완벽히 준비되길 기다리진 않습니다. 
시작 순서를 제어하여 의존 컨테이너가 준비되길 기다리도록 만들어야 합니다. 

## 3. 문제 해결

이런 문제를 해결하기 위한 다양한 전략들이 있습니다.

* [wait-for-it](https://github.com/vishnubob/wait-for-it)
* [dockerize](https://github.com/powerman/dockerize)
* [Wait4X](https://github.com/atkrad/wait4x)
* <https://docs.docker.com/compose/startup-order/>

이번 포스트에선 위의 3가지 방법 외에 다른 방법을 정리하였습니다.

##### 문제 해결 - docker-compose.yml 파일

* `backend` 컨테이너는 `mysql` 컨테이너에 의존하고, 컨테이너 조건 상태가 `service_healthy`이 되기를 기다립니다. 
    * backend.depends_on.mysql.condition=service_healthy
* `backend` 컨테이너는 실패하더라도 자동으로 재실행되도록 설정에 `backend.depends_on.restart=on-failure` 값을 추가힙니다. 
* `mysql` 컨테이너는 자신이 정상적인지 확인하는 방법을 `healthcheck` 설정을 통해 결정합니다.
* <https://docs.docker.com/compose/compose-file/compose-file-v3/#healthcheck>

```yml
version: '3.8'
services:
  mysql:
    image: mysql
    container_name: database-host
    ports:
      - '3306:3306'
    environment:
      - MYSQL_ROOT_PASSWORD=123
    healthcheck:
      test: ["CMD", "mysqladmin" ,"ping", "-h", "localhost"]
      timeout: 6s
      retries: 10
  backend:
    build: .
    ports:
      - '8080:8080'
    environment:
      - JASYPT_SECRETE_KEY=HelloWorld
    depends_on:
      mysql:
        condition: service_healthy
    restart: on-failure
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-10-15-module-import-error-on-jest>

#### REFERENCE

* <https://docs.docker.com/compose/compose-file/compose-file-v3/#depends_on>
* <https://docs.docker.com/compose/startup-order/>
* <https://github.com/vishnubob/wait-for-it>


<!-- 
* <https://porter.codes/2021/04/28/Docker-Compose-conditions.html>
* <https://news.ycombinator.com/item?id=25327342>
* <https://velog.io/@kyy00n/docker-compose.yml-%EC%9E%91%EC%84%B1>
* <https://docs.docker.com/compose/compose-file/compose-file-v3/>
* <https://stackoverflow.com/questions/31746182/docker-compose-wait-for-container-x-before-starting-y>
* <https://jupiny.com/2016/11/13/conrtrol-container-startup-order-in-compose/>
* <https://docs.docker.com/compose/startup-order/>
* <https://stackoverflow.com/questions/42567475/docker-compose-check-if-mysql-connection-is-ready>
* <https://millo-l.github.io/docker-compose-nodejs-mysql-%EC%8B%A4%ED%96%89-%EC%88%9C%EC%84%9C-%EB%8F%99%EA%B8%B0%ED%99%94/>
* <http://daplus.net/mysql-docker-compose-mysql-%EC%97%B0%EA%B2%B0%EC%9D%B4-%EC%A4%80%EB%B9%84%EB%90%98%EC%97%88%EB%8A%94%EC%A7%80-%ED%99%95%EC%9D%B8/> -->
