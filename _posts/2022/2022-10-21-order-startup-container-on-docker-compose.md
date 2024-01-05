---
title: "Order Startup Container on Docker Compose"
search: false
category:
  - docker
last_modified_at: 2022-10-21T23:55:00
---

<br/>

## 1. 문제 현상

도커 컴포즈(compose)를 사용하여 데이터베이스와 서버 컨테이너를 동시에 실행할 때 문제가 발생했습니다. 
`depends_on` 설정으로 `backend` 컨테이너는 `mysql` 컨테이너에 의존하고 있음을 표시했지만, 컴포즈 업(up) 실행 중 에러가 발생하였습니다. 

##### 문제 발생 - docker-compose.yml 파일 

* `depends_on` 설정으로 `backend` 컨테이너가 `mysql` 컨테이너에 의존하고 있음을 표시합니다.

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

로그를 통해 문제 원인을 짐작할 수 있습니다. 
`mysql` 컨테이너가 완전히 준비되기 전에 `backend` 컨테이너가 데이터베이스에 접근하려다 에러가 발생한 것 입니다. 
`depends_on` 설정을 통해 컨테이너 사이의 의존성을 표시했는데 어째서 `backend` 컨테이너가 시작했는지 찾아봤습니다. 

> There are several things to be aware of when using depends_on:<br/>
> * depends_on does not wait for db and redis to be “ready” before starting web - only until they have been started. 
> * If you need to wait for a service to be ready, see Controlling startup order for more on this problem and strategies for solving it. 

`depends_on`에 정의된 의존 컨테이너들이 완벽히 준비되길 기다리지 않았기 때문에 문제가 발생하였습니다. 
도커 컴포즈는 `depends_on` 설정을 따라 컨테이너 실행, 종료 순서를 결정하지만, 의존하는 컨테이너들이 완벽히 준비되길 기다리진 않습니다. 

## 3. 문제 해결

시작 순서를 제어하여 `depends_on`에 정의된 컨테이너들이 준비되길 기다리도록 만들어야 합니다. 
이 문제를 해결하기 위해 다음과 같은 다양한 전략들이 있습니다.

* [wait-for-it](https://github.com/vishnubob/wait-for-it)
* [dockerize](https://github.com/powerman/dockerize)
* [Wait4X](https://github.com/atkrad/wait4x)

##### 문제 해결 - docker-compose.yml 파일

이번 포스트에선 위의 3가지 방법 외에 다른 방법을 정리하였습니다. 
`backend` 컨테이너는 `mysql` 컨테이너의 상태를 확인하면서 완벽히 준비될 때까지 기다립니다.

* `backend.depends_on` 설정
    * `mysql` 컨테이너에 의존적임을 표시합니다.
    * `mysql` 상태가 `service_healthy`일 때까지 대기합니다.
* `backend.restart` 설정
    * 컨테이너가 실행에 실패하는 경우 재시도합니다.
* `mysql.healthcheck` 설정
    * test - 문자열 혹은 리스트 형태이며 컨테이너 상태를 확인하는 명령어, 옵션 등을 정의합니다. 
    * timeout - 타임아웃 시간을 정의합니다.
    * retries - 반복 횟수를 정의합니다.

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

##### 도커 컴포즈 실행 로그

* 순서에 맞게 동기적으로 컨테이너들이 실행됩니다.

```
$ docker-compose up

[+] Running 3/2
 ⠿ Network action-in-blog_default      Created                                                                                                                                                        0.0s
 ⠿ Container database-host             Created                                                                                                                                                        0.0s
 ⠿ Container action-in-blog-backend-1  Created                                                                                                                                                        0.0s
Attaching to action-in-blog-backend-1, database-host
database-host             | 2022-10-22 06:36:09+00:00 [Note] [Entrypoint]: Entrypoint script for MySQL Server 8.0.31-1.el8 started.
database-host             | 2022-10-22 06:36:09+00:00 [Note] [Entrypoint]: Switching to dedicated user 'mysql'
database-host             | 2022-10-22 06:36:09+00:00 [Note] [Entrypoint]: Entrypoint script for MySQL Server 8.0.31-1.el8 started.
database-host             | 2022-10-22 06:36:09+00:00 [Note] [Entrypoint]: Initializing database files
database-host             | 2022-10-22T06:36:09.715616Z 0 [Warning] [MY-011068] [Server] The syntax '--skip-host-cache' is deprecated and will be removed in a future release. Please use SET GLOBAL host_cache_size=0 instead.
database-host             | 2022-10-22T06:36:09.715705Z 0 [System] [MY-013169] [Server] /usr/sbin/mysqld (mysqld 8.0.31) initializing of server in progress as process 80
database-host             | 2022-10-22T06:36:09.721511Z 1 [System] [MY-013576] [InnoDB] InnoDB initialization has started.
database-host             | 2022-10-22T06:36:09.989201Z 1 [System] [MY-013577] [InnoDB] InnoDB initialization has ended.
database-host             | 2022-10-22T06:36:10.975247Z 6 [Warning] [MY-010453] [Server] root@localhost is created with an empty password ! Please consider switching off the --initialize-insecure option.
database-host             | 2022-10-22 06:36:13+00:00 [Note] [Entrypoint]: Database files initialized
database-host             | 2022-10-22 06:36:13+00:00 [Note] [Entrypoint]: Starting temporary server
database-host             | 2022-10-22T06:36:13.307968Z 0 [Warning] [MY-011068] [Server] The syntax '--skip-host-cache' is deprecated and will be removed in a future release. Please use SET GLOBAL host_cache_size=0 instead.
database-host             | 2022-10-22T06:36:13.309067Z 0 [System] [MY-010116] [Server] /usr/sbin/mysqld (mysqld 8.0.31) starting as process 131
database-host             | 2022-10-22T06:36:13.325622Z 1 [System] [MY-013576] [InnoDB] InnoDB initialization has started.
database-host             | 2022-10-22T06:36:13.430247Z 1 [System] [MY-013577] [InnoDB] InnoDB initialization has ended.
database-host             | 2022-10-22T06:36:13.654926Z 0 [Warning] [MY-010068] [Server] CA certificate ca.pem is self signed.
database-host             | 2022-10-22T06:36:13.655027Z 0 [System] [MY-013602] [Server] Channel mysql_main configured to support TLS. Encrypted connections are now supported for this channel.
database-host             | 2022-10-22T06:36:13.656390Z 0 [Warning] [MY-011810] [Server] Insecure configuration for --pid-file: Location '/var/run/mysqld' in the path is accessible to all OS users. Consider choosing a different directory.
database-host             | 2022-10-22T06:36:13.671701Z 0 [System] [MY-011323] [Server] X Plugin ready for connections. Socket: /var/run/mysqld/mysqlx.sock
database-host             | 2022-10-22T06:36:13.671890Z 0 [System] [MY-010931] [Server] /usr/sbin/mysqld: ready for connections. Version: '8.0.31'  socket: '/var/run/mysqld/mysqld.sock'  port: 0  MySQL Community Server - GPL.
database-host             | 2022-10-22 06:36:13+00:00 [Note] [Entrypoint]: Temporary server started.
database-host             | '/var/lib/mysql/mysql.sock' -> '/var/run/mysqld/mysqld.sock'
database-host             | Warning: Unable to load '/usr/share/zoneinfo/iso3166.tab' as time zone. Skipping it.
database-host             | Warning: Unable to load '/usr/share/zoneinfo/leapseconds' as time zone. Skipping it.
database-host             | Warning: Unable to load '/usr/share/zoneinfo/tzdata.zi' as time zone. Skipping it.
database-host             | Warning: Unable to load '/usr/share/zoneinfo/zone.tab' as time zone. Skipping it.
database-host             | Warning: Unable to load '/usr/share/zoneinfo/zone1970.tab' as time zone. Skipping it.
database-host             | 
database-host             | 2022-10-22 06:36:15+00:00 [Note] [Entrypoint]: Stopping temporary server
database-host             | 2022-10-22T06:36:15.965099Z 10 [System] [MY-013172] [Server] Received SHUTDOWN from user root. Shutting down mysqld (Version: 8.0.31).
database-host             | 2022-10-22T06:36:17.221901Z 0 [System] [MY-010910] [Server] /usr/sbin/mysqld: Shutdown complete (mysqld 8.0.31)  MySQL Community Server - GPL.
database-host             | 2022-10-22 06:36:17+00:00 [Note] [Entrypoint]: Temporary server stopped
database-host             | 
database-host             | 2022-10-22 06:36:17+00:00 [Note] [Entrypoint]: MySQL init process done. Ready for start up.
database-host             | 
database-host             | 2022-10-22T06:36:18.190801Z 0 [Warning] [MY-011068] [Server] The syntax '--skip-host-cache' is deprecated and will be removed in a future release. Please use SET GLOBAL host_cache_size=0 instead.
database-host             | 2022-10-22T06:36:18.191884Z 0 [System] [MY-010116] [Server] /usr/sbin/mysqld (mysqld 8.0.31) starting as process 1
database-host             | 2022-10-22T06:36:18.197711Z 1 [System] [MY-013576] [InnoDB] InnoDB initialization has started.
database-host             | 2022-10-22T06:36:18.290293Z 1 [System] [MY-013577] [InnoDB] InnoDB initialization has ended.
database-host             | 2022-10-22T06:36:18.490957Z 0 [Warning] [MY-010068] [Server] CA certificate ca.pem is self signed.
database-host             | 2022-10-22T06:36:18.491002Z 0 [System] [MY-013602] [Server] Channel mysql_main configured to support TLS. Encrypted connections are now supported for this channel.
database-host             | 2022-10-22T06:36:18.492688Z 0 [Warning] [MY-011810] [Server] Insecure configuration for --pid-file: Location '/var/run/mysqld' in the path is accessible to all OS users. Consider choosing a different directory.
database-host             | 2022-10-22T06:36:18.513356Z 0 [System] [MY-011323] [Server] X Plugin ready for connections. Bind-address: '::' port: 33060, socket: /var/run/mysqld/mysqlx.sock
database-host             | 2022-10-22T06:36:18.513404Z 0 [System] [MY-010931] [Server] /usr/sbin/mysqld: ready for connections. Version: '8.0.31'  socket: '/var/run/mysqld/mysqld.sock'  port: 3306  MySQL Community Server - GPL.
action-in-blog-backend-1  | 
action-in-blog-backend-1  |   .   ____          _            __ _ _
action-in-blog-backend-1  |  /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
action-in-blog-backend-1  | ( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
action-in-blog-backend-1  |  \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
action-in-blog-backend-1  |   '  |____| .__|_| |_|_| |_\__, | / / / /
action-in-blog-backend-1  |  =========|_|==============|___/=/_/_/_/
action-in-blog-backend-1  |  :: Spring Boot ::                (v2.7.4)
action-in-blog-backend-1  | 
action-in-blog-backend-1  | 2022-10-22 06:36:40.976  INFO 1 --- [           main] action.in.blog.ActionInBlogApplication   : Starting ActionInBlogApplication v0.0.1-SNAPSHOT using Java 11.0.16 on 49fb92f22daf with PID 1 (/app/app.jar started by root in /app)
action-in-blog-backend-1  | 2022-10-22 06:36:40.979  INFO 1 --- [           main] action.in.blog.ActionInBlogApplication   : No active profile set, falling back to 1 default profile: "default"
action-in-blog-backend-1  | 2022-10-22 06:36:41.583  INFO 1 --- [           main] .s.d.r.c.RepositoryConfigurationDelegate : Bootstrapping Spring Data JPA repositories in DEFAULT mode.
action-in-blog-backend-1  | 2022-10-22 06:36:41.596  INFO 1 --- [           main] .s.d.r.c.RepositoryConfigurationDelegate : Finished Spring Data repository scanning in 5 ms. Found 0 JPA repository interfaces.
action-in-blog-backend-1  | 2022-10-22 06:36:41.810  INFO 1 --- [           main] ptablePropertiesBeanFactoryPostProcessor : Post-processing PropertySource instances
action-in-blog-backend-1  | 2022-10-22 06:36:41.811  INFO 1 --- [           main] c.u.j.EncryptablePropertySourceConverter : Skipping PropertySource configurationProperties [class org.springframework.boot.context.properties.source.ConfigurationPropertySourcesPropertySource
action-in-blog-backend-1  | 2022-10-22 06:36:41.812  INFO 1 --- [           main] c.u.j.EncryptablePropertySourceConverter : Skipping PropertySource servletConfigInitParams [class org.springframework.core.env.PropertySource$StubPropertySource
action-in-blog-backend-1  | 2022-10-22 06:36:41.812  INFO 1 --- [           main] c.u.j.EncryptablePropertySourceConverter : Skipping PropertySource servletContextInitParams [class org.springframework.core.env.PropertySource$StubPropertySource
action-in-blog-backend-1  | 2022-10-22 06:36:41.813  INFO 1 --- [           main] c.u.j.EncryptablePropertySourceConverter : Converting PropertySource systemProperties [org.springframework.core.env.PropertiesPropertySource] to EncryptableMapPropertySourceWrapper
action-in-blog-backend-1  | 2022-10-22 06:36:41.813  INFO 1 --- [           main] c.u.j.EncryptablePropertySourceConverter : Converting PropertySource systemEnvironment [org.springframework.boot.env.SystemEnvironmentPropertySourceEnvironmentPostProcessor$OriginAwareSystemEnvironmentPropertySource] to EncryptableSystemEnvironmentPropertySourceWrapper
action-in-blog-backend-1  | 2022-10-22 06:36:41.814  INFO 1 --- [           main] c.u.j.EncryptablePropertySourceConverter : Converting PropertySource random [org.springframework.boot.env.RandomValuePropertySource] to EncryptablePropertySourceWrapper
action-in-blog-backend-1  | 2022-10-22 06:36:41.814  INFO 1 --- [           main] c.u.j.EncryptablePropertySourceConverter : Converting PropertySource Config resource 'class path resource [application.yml]' via location 'optional:classpath:/' [org.springframework.boot.env.OriginTrackedMapPropertySource] to EncryptableMapPropertySourceWrapper
action-in-blog-backend-1  | 2022-10-22 06:36:42.111  INFO 1 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port(s): 8080 (http)
action-in-blog-backend-1  | 2022-10-22 06:36:42.122  INFO 1 --- [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
action-in-blog-backend-1  | 2022-10-22 06:36:42.123  INFO 1 --- [           main] org.apache.catalina.core.StandardEngine  : Starting Servlet engine: [Apache Tomcat/9.0.65]
action-in-blog-backend-1  | 2022-10-22 06:36:42.198  INFO 1 --- [           main] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring embedded WebApplicationContext
action-in-blog-backend-1  | 2022-10-22 06:36:42.198  INFO 1 --- [           main] w.s.c.ServletWebServerApplicationContext : Root WebApplicationContext: initialization completed in 1175 ms
action-in-blog-backend-1  | 2022-10-22 06:36:42.252  INFO 1 --- [           main] c.u.j.filter.DefaultLazyPropertyFilter   : Property Filter custom Bean not found with name 'encryptablePropertyFilter'. Initializing Default Property Filter
action-in-blog-backend-1  | 2022-10-22 06:36:42.261  INFO 1 --- [           main] c.u.j.r.DefaultLazyPropertyResolver      : Property Resolver custom Bean not found with name 'encryptablePropertyResolver'. Initializing Default Property Resolver
action-in-blog-backend-1  | 2022-10-22 06:36:42.264  INFO 1 --- [           main] c.u.j.d.DefaultLazyPropertyDetector      : Property Detector custom Bean not found with name 'encryptablePropertyDetector'. Initializing Default Property Detector
action-in-blog-backend-1  | 2022-10-22 06:36:42.289  INFO 1 --- [           main] c.u.j.encryptor.DefaultLazyEncryptor     : Found Custom Encryptor Bean org.jasypt.encryption.pbe.PooledPBEStringEncryptor@c5dc4a2 with name: jasyptStringEncryptor
action-in-blog-backend-1  | 2022-10-22 06:36:42.400  INFO 1 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Starting...
action-in-blog-backend-1  | 2022-10-22 06:36:42.745  INFO 1 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Start completed.
action-in-blog-backend-1  | 2022-10-22 06:36:42.786  INFO 1 --- [           main] o.hibernate.jpa.internal.util.LogHelper  : HHH000204: Processing PersistenceUnitInfo [name: default]
action-in-blog-backend-1  | 2022-10-22 06:36:42.826  INFO 1 --- [           main] org.hibernate.Version                    : HHH000412: Hibernate ORM core version 5.6.11.Final
action-in-blog-backend-1  | 2022-10-22 06:36:42.969  INFO 1 --- [           main] o.hibernate.annotations.common.Version   : HCANN000001: Hibernate Commons Annotations {5.1.2.Final}
action-in-blog-backend-1  | 2022-10-22 06:36:43.087  INFO 1 --- [           main] org.hibernate.dialect.Dialect            : HHH000400: Using dialect: org.hibernate.dialect.MySQL8Dialect
action-in-blog-backend-1  | 2022-10-22 06:36:43.268  INFO 1 --- [           main] o.h.e.t.j.p.i.JtaPlatformInitiator       : HHH000490: Using JtaPlatform implementation: [org.hibernate.engine.transaction.jta.platform.internal.NoJtaPlatform]
action-in-blog-backend-1  | 2022-10-22 06:36:43.279  INFO 1 --- [           main] j.LocalContainerEntityManagerFactoryBean : Initialized JPA EntityManagerFactory for persistence unit 'default'
action-in-blog-backend-1  | 2022-10-22 06:36:43.317  WARN 1 --- [           main] JpaBaseConfiguration$JpaWebConfiguration : spring.jpa.open-in-view is enabled by default. Therefore, database queries may be performed during view rendering. Explicitly configure spring.jpa.open-in-view to disable this warning
action-in-blog-backend-1  | 2022-10-22 06:36:43.648  INFO 1 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8080 (http) with context path ''
action-in-blog-backend-1  | 2022-10-22 06:36:43.649  INFO 1 --- [           main] u.j.c.RefreshScopeRefreshedEventListener : Refreshing cached encryptable property sources on ServletWebServerInitializedEvent
action-in-blog-backend-1  | 2022-10-22 06:36:43.650  INFO 1 --- [           main] CachingDelegateEncryptablePropertySource : Property Source systemProperties refreshed
action-in-blog-backend-1  | 2022-10-22 06:36:43.650  INFO 1 --- [           main] CachingDelegateEncryptablePropertySource : Property Source systemEnvironment refreshed
action-in-blog-backend-1  | 2022-10-22 06:36:43.650  INFO 1 --- [           main] CachingDelegateEncryptablePropertySource : Property Source random refreshed
action-in-blog-backend-1  | 2022-10-22 06:36:43.650  INFO 1 --- [           main] CachingDelegateEncryptablePropertySource : Property Source Config resource 'class path resource [application.yml]' via location 'optional:classpath:/' refreshed
action-in-blog-backend-1  | 2022-10-22 06:36:43.650  INFO 1 --- [           main] c.u.j.EncryptablePropertySourceConverter : Converting PropertySource server.ports [org.springframework.core.env.MapPropertySource] to EncryptableMapPropertySourceWrapper
action-in-blog-backend-1  | 2022-10-22 06:36:43.650  INFO 1 --- [           main] c.u.j.EncryptablePropertySourceConverter : Skipping PropertySource configurationProperties [class org.springframework.boot.context.properties.source.ConfigurationPropertySourcesPropertySource
action-in-blog-backend-1  | 2022-10-22 06:36:43.650  INFO 1 --- [           main] c.u.j.EncryptablePropertySourceConverter : Skipping PropertySource servletConfigInitParams [class org.springframework.core.env.PropertySource$StubPropertySource
action-in-blog-backend-1  | 2022-10-22 06:36:43.651  INFO 1 --- [           main] c.u.j.EncryptablePropertySourceConverter : Converting PropertySource servletContextInitParams [org.springframework.web.context.support.ServletContextPropertySource] to EncryptableEnumerablePropertySourceWrapper
action-in-blog-backend-1  | 2022-10-22 06:36:43.659  INFO 1 --- [           main] action.in.blog.ActionInBlogApplication   : Started ActionInBlogApplication in 3.123 seconds (JVM running for 3.485)
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-10-16-jasypt>

#### REFERENCE

* <https://docs.docker.com/compose/compose-file/compose-file-v3/#depends_on>
* <https://docs.docker.com/compose/compose-file/compose-file-v3/#healthcheck>
* <https://docs.docker.com/compose/startup-order/>
* <https://stackoverflow.com/questions/42567475/docker-compose-check-if-mysql-connection-is-ready>
