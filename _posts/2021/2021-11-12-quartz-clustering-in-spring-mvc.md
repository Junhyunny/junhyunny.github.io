---
title: "Quartz Clustering in Spring MVC"
search: false
category:
  - spring-mvc
last_modified_at: 2021-11-12T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [Quartz in Spring MVC][quartz-in-spring-mvc-link]

## 0. 들어가면서

`Quartz` 스케줄러를 처음 접했을 때 이런 의문점이 있었습니다. 
`"동일한 소스 코드를 다중 서버 환경으로 배포한다면 같은 시간에 같은 기능이 여러 곳에서 실행되니 위험하고, 불합리하지 않은가?"` 
당시에는 스케줄러 어플리케이션을 별도로 한 개의 서버로 구현한다고 생각했었는데, 정답이 아니었습니다. 

##### 다중 서버 환경에서 Quartz 동작

<p align="center"><img src="/images/quartz-clustering-in-spring-mvc-1.gif" width="55%"></p><br/>

[Quartz in Spring MVC][quartz-in-spring-mvc-link] 포스트에서 `Quartz` 스케줄러에 대한 장점 중에 클러스터링(clustering)을 언급했었습니다. 

> Quartz 특장점<br/> 
> 데이터베이스를 기반으로 클러스터링(clustering) 기능을 제공합니다. 

`Quartz Clustering`을 이용하면 제가 고민했던 문제를 해결할 수 있습니다. 
이번 포스트에선 클러스터링 사용시 얻는 이점에 대해 정리하고, 간단한 구현 예제를 소개하도록 하겠습니다. 

##### 다중 서버 환경에서 Quartz 클러스터링 동작

<p align="center"><img src="/images/quartz-clustering-in-spring-mvc-2.gif" width="55%"></p>

## 1. Spring Quartz Clustering
`Quartz` 구조를 살펴보면 `JobStore` 기능이 존재합니다. 
해야될 일인 `Job`과 이를 실행시킬 조건인 `Trigger`에 대한 정보를 어떤 방식으로 저장하는지를 정의한 기능입니다. 
정보를 저장하는 방법으로 `메모리` 방식과 `데이터베이스` 방식이 사용됩니다. 
다중 서버 환경에서 `데이터베이스` 방식을 사용하면 서버들간의 `Job`, `Trigger` 정보를 공유할 수 있으므로 클러스터링이 가능합니다. 

<p align="center"><img src="/images/quartz-clustering-in-spring-mvc-3.JPG" width="35%"></p>

## 2. Spring Quartz Clustering 이점

### 2.1. 고가용성(High Availability)
- 서버 중 하나가 다운(down)되더라도 다른 서버에 의해 `Job`이 실행됩니다.
- Quartz Job 실행에 대한 다운-타임(down-time)이 없습니다.

<p align="center"><img src="/images/quartz-clustering-in-spring-mvc-4.gif" width="35%"></p>

### 2.2. 확장성(Scalability)
- Quartz 설정이 된 서버를 구동하면 자동으로 데이터베이스에 스케줄 서버로 등록됩니다.
- 스케일-아웃(scale-out)으로 인해 서버가 늘어나더라도 함께 클러스터로 관리됩니다.

<p align="center"><img src="/images/quartz-clustering-in-spring-mvc-5.gif" width="35%"></p>

### 2.3. 부하 분산(Loading Balancing)
- 클러스터 구성으로 `Job`이 여러 서버에 분산되어 실행됩니다.
- Quartz에서는 랜덤 알고리즘(random algorithm)만 구현되어 있습니다.

<p align="center"><img src="/images/quartz-clustering-in-spring-mvc-6.gif" width="35%"></p>

## 2. Spring Quartz 클러스터 구현

### 2.1. pom.xml
- `Quartz` 관련된 의존성을 추가합니다.

```xml
    ...
    <dependencies>
        ...
        <dependency>
            <groupId>org.quartz-scheduler</groupId>
            <artifactId>quartz</artifactId>
            <version>2.3.0</version>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-context-support</artifactId>
            <version>${org.springframework-version}</version>
        </dependency>
    </dependencies>
```

### 2.2. 테이블 생성
- `Quartz` 관련 의존성 추가하면 `tables_mysql_innodb.sql` 파일이 검색됩니다.
- `tables_mysql_innodb.sql` 파일에 있는 쿼리를 수행합니다.

```sql
CREATE TABLE QRTZ_JOB_DETAILS(
SCHED_NAME VARCHAR(120) NOT NULL,
JOB_NAME VARCHAR(190) NOT NULL,
JOB_GROUP VARCHAR(190) NOT NULL,
DESCRIPTION VARCHAR(250) NULL,
JOB_CLASS_NAME VARCHAR(250) NOT NULL,
IS_DURABLE VARCHAR(1) NOT NULL,
IS_NONCONCURRENT VARCHAR(1) NOT NULL,
IS_UPDATE_DATA VARCHAR(1) NOT NULL,
REQUESTS_RECOVERY VARCHAR(1) NOT NULL,
JOB_DATA BLOB NULL,
PRIMARY KEY (SCHED_NAME,JOB_NAME,JOB_GROUP))
ENGINE=InnoDB;
...
CREATE TABLE QRTZ_CRON_TRIGGERS (
SCHED_NAME VARCHAR(120) NOT NULL,
TRIGGER_NAME VARCHAR(190) NOT NULL,
TRIGGER_GROUP VARCHAR(190) NOT NULL,
CRON_EXPRESSION VARCHAR(120) NOT NULL,
TIME_ZONE_ID VARCHAR(80),
PRIMARY KEY (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP),
FOREIGN KEY (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP)
REFERENCES QRTZ_TRIGGERS(SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP))
ENGINE=InnoDB;
...
```

##### 생성된 테이블 리스트

<p align="left"><img src="/images/quartz-clustering-in-spring-mvc-7.JPG"></p>

### 2.3. applicationContext.xml
- `JobDetailFactoryBean` 생성
    - `Job Class`를 지정합니다.
    - `BLOG_GROUP` 이름으로 그룹을 지정합니다.
- `CronTriggerFactoryBean` 생성
    - `Job Detail`은 위에서 생성한 `blogJob` 빈(bean)으로 지정합니다.
    - `cronExpression`을 지정합니다. 1초동안 지속적으로 실행합니다.
- `SchedulerFactoryBean` 생성
    - `trigger`는 위에서 생성한 `cronTrigger`를 사용합니다.
    - `dataSource`는 위에서 생성한 `dataSource`를 사용합니다.
    - `applicationContextSchedulerContextKey`로 스케줄러에서 `applicationContext`를 꺼낼 수 있는 키로 지정합니다.
    - `autoStartup` 설정은 스케줄러 초기화 후 자동으로 실행 여부를 지정합니다.
    - `overwriteExistingJobs` 설정은 존재하는 Job 정의들을 덮어씁니다.
    - `waitForJobsToCompleteOnShutdown` 설정은 서버 셧다운(shutdown) 시 실행 중인 Job 종료를 기다릴지 여부를 결정합니다.
    - `quartzProperties` 설정을 추가적으로 지정합니다.

##### quartzProperties 속성 설명
- `org.quartz.jobStore.class` - `JobStore` 클래스를 지정합니다. 
- `org.quartz.jobStore.driverDelegateClass` - 데이터베이스 별로 다른 SQL을 이해할 수 있는 클래스를 지정합니다.
- `org.quartz.jobStore.dataSource` - `JobStore`가 사용할 데이터소스를 지정합니다.
- `org.quartz.jobStore.tablePrefix` - 데이터베이스에 생성된 `Quartz` 테이블에 주어진 접두사를 지정합니다. 
- `org.quartz.jobStore.isClustered` - 클러스터링 기능을 사용하려면 true로 설정합니다.
- `org.quartz.jobStore.clusterCheckinInterval`
    - 클러스터의 다른 인스턴스에 체크인 하는 빈도를 설정합니다. 
    - 실패한 인스턴스를 감지하는 속도에 영향을 줍니다. (ms 단위)
- `org.quartz.jobStore.misfireThreshold`
    - 스케줄러가 실패한 것으로 간주되기 전에 다음 실행 시간을 전달하는 트리거를 허용하는 시간입니다. (ms 단위)
- `org.quartz.scheduler.instanceId`
    - 모든 스케줄러들 중 유일해야합니다. 
    - `AUTO`인 경우 인스턴스 ID를 임의로 생성합니다. 
    - `SYS_PROP`인 경우 시스템 속성에서 사용합니다.

```xml
    <bean name="blogJob" class="org.springframework.scheduling.quartz.JobDetailFactoryBean">
        <property name="jobClass" value="blog.in.action.job.BlogJob"/>
        <property name="durability" value="true"/>
        <property name="group" value="BLOG_GROUP"/>
    </bean>

    <bean id="cronTrigger" class="org.springframework.scheduling.quartz.CronTriggerFactoryBean">
        <property name="jobDetail" ref="blogJob"/>
        <property name="cronExpression" value="0/1 * * * * ?"/>
    </bean>

    <bean class="org.springframework.scheduling.quartz.SchedulerFactoryBean">
        <property name="triggers">
            <list>
                <ref bean="cronTrigger"/>
            </list>
        </property>
        <property name="dataSource" ref="dataSource"/>
        <property name="applicationContextSchedulerContextKey" value="applicationContext"/>
        <property name="autoStartup" value="true"/>
        <property name="overwriteExistingJobs" value="true"/>
        <property name="waitForJobsToCompleteOnShutdown" value="true"/>
        <property name="quartzProperties">
            <props>
                <prop key="org.quartz.jobStore.class">org.quartz.impl.jdbcjobstore.JobStoreTX</prop>
                <prop key="org.quartz.jobStore.driverDelegateClass">org.quartz.impl.jdbcjobstore.StdJDBCDelegate</prop>
                <prop key="org.quartz.jobStore.dataSource">dataSource</prop>
                <prop key="org.quartz.jobStore.tablePrefix">QRTZ_</prop>
                <prop key="org.quartz.jobStore.isClustered">true</prop>
                <prop key="org.quartz.jobStore.clusterCheckinInterval">1000</prop>
                <prop key="org.quartz.jobStore.misfireThreshold">1000</prop>
                <prop key="org.quartz.scheduler.instanceId">AUTO</prop>
            </props>
        </property>
    </bean>
```

### 2.4. BlogJob 클래스
- `jobExecutionContext`의 스케줄러에서 `applicationContext`를 이용해 BlogService 빈(bean)을찾습니다.

```java
package blog.in.action.job;

import blog.in.action.service.BlogService;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.quartz.QuartzJobBean;

public class BlogJob extends QuartzJobBean {

    private BlogService blogService;

    @Override
    protected void executeInternal(JobExecutionContext jobExecutionContext) throws JobExecutionException {
        try {
            blogService = ((ApplicationContext) jobExecutionContext.getScheduler().getContext().get("applicationContext")).getBean(BlogService.class);
            blogService.updateTest();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### 2.5. BlogServiceImpl 클래스
- "update test table" 로그를 출력합니다.

```java
package blog.in.action.service.impl;

import blog.in.action.dao.BlogDao;
import blog.in.action.service.BlogService;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;
import org.springframework.stereotype.Service;

@Service("blobService")
public class BlogServiceImpl implements BlogService {

    private Logger logger = Logger.getLogger(BlogServiceImpl.class.getName());

    private final BlogDao blogDao;

    public BlogServiceImpl(BlogDao blogDao) {
        this.blogDao = blogDao;
    }

    @Override
    public void updateTest() {
        logger.info("update test table");
        List<Map<String, Object>> itemList = blogDao.selectTest();
        for (Map<String, Object> item : itemList) {
            blogDao.updateTest(item);
        }
    }
}
```

## 3. 테스트 결과 확인
고가용성(HA, High Availability) 테스트를 수행합니다. 
테스트 `Quartz` 수행 주기는 1초 간격이므로 1초마다 로그가 출력됩니다. 

- 8080, 8081 포트(port)를 가진 두 개의 Tomcat 서버가 동작합니다. 
- 8081 포트 서버에서 Quartz Job이 실행되고 있습니다.
- 8081 포트 서버를 다운시키면 8080 포트 서버의 Quartz Job이 실행됩니다.
- 8081 포트 서버를 다시 시작시킵니다.
- 8080 포트 서버를 다운시키면 8081 포트 서버의 Quartz Job이 실행됩니다.

<p align="center"><img src="/images/quartz-clustering-in-spring-mvc-8.gif" width="100%"></p>

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-11-12-quartz-clustering-in-spring-mvc>

#### REFERENCE
- <https://junhyunny.github.io/spring-mvc/quartz-in-spring-mvc/>
- <https://www.baeldung.com/spring-quartz-schedule>
- <https://advenoh.tistory.com/56>
- <https://uchupura.tistory.com/113>
- <https://developyo.tistory.com/251>
- <https://webprogrammer.tistory.com/2362>
- [[Quartz-3] Multi WAS 환경을 위한 Cluster 환경의 Quartz Job Scheduler 구현][quartz-clustering-in-spring-mvc-link]
- <https://github.com/quartz-scheduler/quartz/blob/master/docs/configuration.adoc>
- <https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/scheduling/quartz/SchedulerFactoryBean.html>

[quartz-in-spring-mvc-link]: https://junhyunny.github.io/spring-mvc/quartz-in-spring-mvc/
[quartz-clustering-in-spring-mvc-link]: https://blog.advenoh.pe.kr/spring/Multi-WAS-%ED%99%98%EA%B2%BD%EC%9D%84-%EC%9C%84%ED%95%9C-Cluster-%ED%99%98%EA%B2%BD%EC%9D%98-Quartz-Job-Scheduler-%EA%B5%AC%ED%98%84/