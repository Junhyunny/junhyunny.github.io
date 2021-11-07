---
title: "Quartz in Spring MVC"
search: false
category:
  - spring-mvc
last_modified_at: 2021-11-07T23:55:00
---

<br>

## 0. 들어가면서
시스템을 구성하다보면 실시간 요청에 따라 서비스를 제공하는 것뿐만 아니라 특정 시간마다 혹은 일정 시간 간격마다 동작하여 필요한 데이터를 처리하는 기능이 필요합니다. 
이런 경우 스케줄러(scheduler)를 이용하여 업무(job)을 수행하도록 구현합니다. 
Spring 프레임워크는 Job 스케줄링을 쉽게 구현할 수 있는 기능들을 제공합니다. 
대표적으로 `Spring Scheduler`와 `Spring Quartz`가 있습니다. 
간단하게 `Spring Scheduler`를 사용할 수도 있지만, 이번 포스트에서는 몇 가지 특장점이 있는 `Spring Quartz`에 대해 정리해보려 합니다.

## 1. Spring Quartz 소개

공식 홈페이지에선 아래와 같이 소개하고 있습니다. 

> Quartz is a richly featured, open source job scheduling library that can be integrated within virtually any Java application
>  - from the smallest stand-alone application to the largest e-commerce system.
> Quartz can be used to create simple or complex schedules for executing tens, hundreds, or even tens-of-thousands of jobs; 
> jobs whose tasks are defined as standard Java components that may execute virtually anything you may program them to do. 

Job 스케줄링을 구현할 수 있는 오픈 소스 라이브러리이며 Java 어플리케이션에서 사용, 통합이 가능합니다. 
간단하거나 복잡한 스케줄들을 수십 개에서 수만 개까지 구현 가능합니다. 
스케줄의 종료 시점부터 다음 실행 시점까지 시간 간격을 두는 인터벌(interval) 형식의 스케줄링이 가능합니다. 
혹은 크론 표현식(cron expression) 방식을 이용한 복잡한 스케줄링도 지원합니다. 
크론 표현식은 잠시 뒤에 다시 정리하겠습니다.

##### Quartz 구조도
Quatz 구조도와 함께 관련된 용어들을 정리하였습니다. 
- Job 인터페이스 - execute 메소드를 정의하고 있으며, 실제 수행할 작업은 해당 메소드 구현을 통해 정의합니다.
- JobDetail 인터페이스 - Job 인스턴스를 실행시키기 위한 정보를 담고 있는 구현체의 기능들을 정의합니다.
- JobDataMap 클래스 - Job 인스턴스가 실행할 때 필요한 정보를 담을 수 있는 클래스입니다. JobDetail 인스턴스 생성시 전달합니다.
- Trigger 인터페이스 - Job을 실행시킬 스케줄링 조건을 정의합니다. Scheduler는 이 정보를 기준으로 Job을 수행시킵니다.
- SchedulerFactory 인터페이스 - Scheduler를 생성하는데 필요한 기능들을 정의합니다. 
- Scheduler 인터페이스 - 등록된 Job과 Trigger를 관리합니다. Trigger에 따라 연관된 Job을 실행시킵니다. 
- Misfire Instructions - 스레드 부족 등의 이유로 Job이 실행되지 못한 경우 정책을 지원합니다. 
    - MISFIREINSTRUCTIONFIRE_NOW - 바로 실행
    - MISFIREINSTRUCTIONDO_NOTHING - 아무것도 하지 않음
- JobListener 인터페이스 - Job 실행 전, 후의 이벤트를 받을 수 있는 기능들을 정의합니다.
- JobStore 인터페이스 - Job, Trigger 정보를 저장하는 기능들을 정의합니다. 저장공간으로 메모리 혹은 데이터베이스를 이용합니다. 

<p align="center"><img src="/images/quartz-in-spring-mvc-1.JPG" width="80%"></p>
<center>이미지 출처, https://blog.advenoh.pe.kr/spring/Quartz-Job-Scheduler%EB%9E%80/</center>

### 1.1. Quartz와 Batch는 어떻게 다른가?
저는 `Quartz`에 대해 공부해보기 전인 최근까지도 배치(batch)라는 용어와 혼동하여 사용하였습니다. 
공부하기 전까지는 `Quartz`가 제공하는 기능이 `Batch Job`이라고 생각었는데, 실제 `Quartz`가 제공하는 기능은 `Job Scheduling`입니다. 
둘은 다른 개념이므로 포스트를 이어가기 전에 짚고 넘어가겠습니다. 

##### Job Scheduling
- 특정한 시간에 등록한 작업(job)을 자동으로 실행시키는 일을 의미합니다. 

##### Batch Job
- 일괄처리. 여러 개의 작업(job)을 중단 없이 연속적으로 처리하는 일을 의미합니다. 
- 사용자와의 상호 작용 없이 여러 작업(job)들을 미리 정해진 순서에 따라 일괄적으로 처리합니다. 
- 정기적인 수행을 위해 Job Scheduling 기능을 이용해야 합니다.

### 1.2. Quartz 특장점
- 데이터베이스를 기반으로 클러스터링(clustering) 기능을 제공합니다.
- 시스템의 `failover`와 라운드-로빈(round-robbin) 방식의 분산 처리를 지원합니다.
- 기본적으로 여러가지 플러그인(plug-in)을 제공합니다.
    - ShutdownHookingPlugin - JVM 종료 이벤트를 확인하고 스케줄러에게 종료를 알립니다.
    - LoggingJobHistoryPlugin - Job 실행에 대한 로그를 남깁니다. 

### 1.3. Quratz 단점
- 클러스터링 기능을 제공하지만, 단순한 랜덤(random) 방식이라 완벽한 분산 처리는 안 됩니다. 
- ADMIN UI를 제공하지 않습니다.
- 스케줄링 실행에 대한 이력을 보관하지 않습니다.

## 2. Quartz 구현하기
현재 진행하는 프로젝트의 기술 스택인 Spring MVC(Spring Legacy) 프레임워크를 이용하여 구현하였습니다. 
시간이나 기회가 된다면 Spring Boot 프레임워크를 이용한 구현 예제도 포스트할 예정입니다. 

### 2.1. Cron Expression

> 크론(cron)- 유닉스(Unix) 계열의 Job Scheduler

크론 표현식(cron expression)은 크론 스케줄러에서 사용하는 정규 표현식입니다. 
이 표현식을 이용해 Quartz 스케줄러의 트리거 시간을 지정할 수 있습니다. 

##### Cron Expression Field Set
- 7개의 필드로 구성되어 있습니다.

| 필드명 | 위치 | 값의 허용 범위 | 허용된 특수문자 |
|:---:|:---:|:---:|:---|
| 초(seconds) | 1번 | 0 ~ 59 | , - * / | 
| 분(minutes) | 2번 | 0 ~ 59 | , - * / | 
| 시(hours) | 3번 | 0 ~ 23 | , - * / | 
| 일(day) | 4번 | 1 ~ 31 | , - * ? / L W | 
| 월(month) | 5번 | 1 ~ 12 or JAN ~ DEC | , - * / | 
| 요일(week) | 6번 | 0 ~ 6 or SUN ~ SAT | , - * ? / L # | 
| 연도(year) | 7번 | empty or 1970 ~ 2099 | , - * / | 

##### 특수문자 의미
- `*` - 모든 값을 의미합니다.
- `?` - 특정한 값이 없음을 의미합니다.
- `-` - 범위를 의미합니다. 월요일에서 수요일은 `MON-WED`으로 표현합니다.
- `,` - 특별한 값일 때만 동작합니다. 월,수,금 실행은 `MON,WED,FRI`으로 표현합니다.
- `/` - 시작시간/단위를 나눠 표현합니다. `0/5` 표현은 0초부터 5초간격으로 실행을 의미합니다.
- `L` - 일 위치에서 사용하면 마지막 일, 요일 위치에서 사용하면 마지막 요일(토요일)입니다.
- `W` - 가장 가까운 평일을 찾습니다. `15W` 표현은 15일에서 가장 가까운 평일을 찾습니다.
- `#` - 몇 째주의 무슨 요일인지 표현합니다. `3#2` 표현은 2번째 주 수요일을 찾습니다. 

##### Cron Expression Example
- 간단한 예시를 통해 이해도를 높혀보겠습니다.

| 표현식 | 빈도 |
|:---|:---|
| 0/5 * * * * ? | 5초마다 실행 |
| 0 0/5 * * * ? | 5분마다 실행 |
| 0 15 10 ? * * | 매일 오전 10시 15분에 실행 |
| 0 15 10 * * ? 2014 | 2014년 동안 매일 오전 10시 15분에 실행 |
| 0 * 14 * * ? | 매일 오후 2시에 시작해서 매 분마다 실행하고 오후 2시 59분에 마지막 실행 |
| 0 0/5 14 * * ? | 매일 오후 2시에 시작해서 5분마다 실행하고 오후 2시 55분에 마지막 실행 |
| 0 0/5 14,18 * * ? | 매일 오후 2시, 6시에 시작해서 5분마다 실행하고 오후 2시 55분, 6시 55분에 마지막 실행 |

### 2.2. pom.xml
전체 XML 파일 내용은 테스트 코드 Github 링크에서 확인할 수 있습니다.
- 다음과 같은 라이브러리가 필요합니다.
- quartz 라이브러리 - Quartz 기능을 사용할 때 필요한 라이브러리

```xml
<project>
    <dependencies>
        ...
        <dependency>
            <groupId>org.quartz-scheduler</groupId>
            <artifactId>quartz</artifactId>
            <version>2.3.0</version>
        </dependency>
    </dependencies>
</project>
```

- spring-context-support - Quartz 지원 스프링 라이브러리

```xml
<project>
    <dependencies>
        ...
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-context-support</artifactId>
            <version>${org.springframework-version}</version>
        </dependency>
    </dependencies>
</project>
```

### 2.2. applicaitonContext.xml
Quartz와 관련된 빈(bean) 설정을 하나씩 살펴보도록 하겠습니다. 
전체 XML 파일 내용은 테스트 코드 Github 링크에서 확인할 수 있습니다.

#### 2.2.1. JobDetailFactoryBean 설정
- `JobDetail` 객체를 만드는 `JobDetailFactoryBean` 객체를 정의합니다.
- `jobClass` - Job 역할을 수행할 클래스를 지정합니다.
- `jobDataAsMap` - Job 역할을 수행항 클래스에게 전달할 파라미터를 정의합니다. `setter` 메소드를 통해 전달받습니다. 

```xml
    <bean name="blogJob" class="org.springframework.scheduling.quartz.JobDetailFactoryBean">
        <property name="jobClass" value="blog.in.action.job.BlogJob"/>
        <property name="jobDataAsMap">
            <map>
                <entry key="blogService" value-ref="blobService"/>
            </map>
        </property>
        <property name="durability" value="true"/>
    </bean>
```

#### 2.2.2. CronTriggerFactoryBean 설정
- 작업을 수행할 조건을 정의하고 있는 `Trigger` 객체에 대한 설정입니다. 
- Cron Expression을 사용하는 `CronTriggerFactoryBean` 객체에 대해 정의합니다.
- `jobDetail` - 수행시키는 `jobDetail` 객체를 지정합니다.
- `cronExpression` - 작업을 수행할 조건을 Cron Expression으로 정의합니다.
    - 매 5초마다 동작

```xml
    <bean id="cronTrigger" class="org.springframework.scheduling.quartz.CronTriggerFactoryBean">
        <property name="jobDetail" ref="blogJob"/>
        <property name="cronExpression" value="0/5 * * * * ?"/>
    </bean>
```

#### 2.2.3. SchedulerFactoryBean 설정
- 스케줄러(scheduler)를 생성하는 `SchedulerFactoryBean` 객체에 대해 정의합니다.
- `triggers` - 사용할 트리거들을 지정합니다.

```xml
    <bean class="org.springframework.scheduling.quartz.SchedulerFactoryBean">
        <property name="triggers">
            <list>
                <ref bean="cronTrigger"/>
            </list>
        </property>
    </bean>
```

### 2.3. BlogJob 클래스
- QuartzJobBean 클래스를 구현합니다.
- `executeInternal` 메소드 내부에 수행시킬 기능을 구현합니다.
- `setter` 메소드를 이용해 `blogService` 빈(bean) 객체를 주입받습니다. 

```java
package blog.in.action.job;

import blog.in.action.service.BlogService;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.scheduling.quartz.QuartzJobBean;

public class BlogJob extends QuartzJobBean {

    private BlogService blogService;

    public void setBlogService(BlogService blogService) {
        this.blogService = blogService;
    }

    @Override
    protected void executeInternal(JobExecutionContext jobExecutionContext) throws JobExecutionException {
        try {
            blogService.updateTest();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### 2.4. BlogServiceImpl 클래스
- 빈(bean) 이름을 `blobService`으로 지정합니다. 
- 이름을 지정하지 않는 경우 `jobDataAsMap` 설정시 찾을 수 없다는 에러가 발생합니다.
- 트랜잭션 정상 처리 여부를 확인하기 위해 임의로 예외(exception)을 발생시킵니다.

```java
package blog.in.action.service.impl;

import blog.in.action.dao.BlogDao;
import blog.in.action.service.BlogService;
import java.util.List;
import java.util.Map;
import java.util.Random;
import org.springframework.stereotype.Service;

@Service("blobService")
public class BlogServiceImpl implements BlogService {

    private final BlogDao blogDao;

    public BlogServiceImpl(BlogDao blogDao) {
        this.blogDao = blogDao;
    }

    @Override
    public void updateTest() {
        List<Map<String, Object>> itemList = blogDao.selectTest();
        for (Map<String, Object> item : itemList) {
            blogDao.updateTest(item);
            if (new Random().nextBoolean()) {
                throw new RuntimeException("throw exception");
            }
        }
    }
}
```

### 2.5. BlogDao 인터페이스
- selectTest 메소드 - TB_TEST 테이블 데이터를 조회합니다.
- updateTest 메소드 - TB_TEST 테이블 데이터를 업데이트합니다.

```java
package blog.in.action.dao;

import java.util.List;
import java.util.Map;

public interface BlogDao {

    List<Map<String, Object>> selectTest();

    void updateTest(Map<String, Object> test);
}
```

### 2.6. sql.xml
- updateTest 질의 - 특정 ID를 가지는 데이터의 변경 시점을 업데이트합니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="blog.in.action.dao.BlogDao">

    <select id="selectTest" resultType="java.util.Map">
        select *
        from TB_TEST
    </select>

    <update id="updateTest" parameterType="java.util.Map">
        update TB_TEST
        set CHANGED_AT = sysdate()
        where id = #{ID}
    </update>

</mapper>
```

## 3. Quartz Scheduler 테스트
- 서버를 동작시킵니다.
- TB_TEST 테이블의 `CHANGED_AT` 항목이 5초마다 갱신되는지 확인합니다.
- 예외(exception)가 발생한 경우에는 `CHANGED_AT` 항목이 갱신되지 않음을 확인합니다.

<p align="center"><img src="/images/quartz-in-spring-mvc-2.gif"></p>

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-11-07-quartz-in-spring-mvc>

#### REFERENCE
- <https://www.quartz-scheduler.org/overview/>
- <https://sabarada.tistory.com/113>
- [Spring Boot - 스프링 부트 Quartz!][spring-boot-quartz-link]
- [[Quartz-1] Quartz Job Scheduler란?][what-is-quartz-job-link]
- <https://zamezzz.tistory.com/197>
- <https://offbyone.tistory.com/256>
- <http://websystique.com/spring/spring-4-quartz-scheduler-integration-example/>

[spring-boot-quartz-link]: https://kouzie.github.io/spring/Spring-Boot-%EC%8A%A4%ED%94%84%EB%A7%81-%EB%B6%80%ED%8A%B8-Quartz/#%EA%B5%AC%EC%A1%B0
[what-is-quartz-job-link]: <https://blog.advenoh.pe.kr/spring/Quartz-Job-Scheduler%EB%9E%80/>