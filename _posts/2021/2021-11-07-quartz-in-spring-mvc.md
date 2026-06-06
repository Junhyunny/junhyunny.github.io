---
title: "스프링 MVC Quartz 사용하기"
search: false
category:
  - spring-mvc
last_modified_at: 2026-06-06T09:38:11+09:00
---

<br/>

#### RECOMMEND NEXT POSTS

- [스프링 MVC Quartz 클러스터링(Clustering)][quartz-clustering-link]

## 0. 들어가면서

시스템을 구성하다 보면 실시간 요청에 따라 서비스를 제공하는 것뿐만 아니라 특정 시간마다 혹은 일정 시간 간격마다 동작하여 필요한 데이터를 처리하는 기능이 필요하다. 이런 경우 스케줄러(scheduler)를 이용하여 작업(job)을 수행하도록 구현한다. 스프링 프레임워크는 Job 스케줄링을 쉽게 구현할 수 있는 기능들을 제공한다. 대표적으로 `스프링 스케줄러(Spring Scheduler)`와 `스프링 쿼츠(Spring Quartz)`가 있다. 간단하게 `스프링 스케줄러`를 사용할 수도 있지만, 이번 글은 몇 가지 특장점이 있는 `스프링 쿼츠`에 대해 정리해 보았다.

## 1. Spring Quartz

공식 홈페이지에서는 아래와 같이 소개하고 있다.

> Quartz is a richly featured, open source job scheduling library that can be integrated within virtually any Java application - from the smallest stand-alone application to the largest e-commerce system. Quartz can be used to create simple or complex schedules for executing tens, hundreds, or even tens-of-thousands of jobs; jobs whose tasks are defined as standard Java components that may execute virtually anything you may program them to do.

쿼츠(Quartz)는 Job 스케줄링을 구현할 수 있는 오픈 소스 라이브러리이며 자바(Java) 애플리케이션에서 사용하거나 통합할 수 있다. 간단하거나 복잡한 스케줄을 수십 개에서 수만 개까지 구현할 수 있다. 스케줄의 종료 시점부터 다음 실행 시점까지 시간 간격을 두는 인터벌(interval) 형식의 스케줄링이 가능하다. 혹은 크론 표현식(cron expression) 방식을 이용한 복잡한 스케줄링도 지원한다. 쿼츠 구조도와 주요 인터페이스들의 역할을 정리해 보았다.

- Job 인터페이스
  - 실제 수행되는 execute 메서드를 명시한다.
  - 개발자는 해당 메서드를 구현한다.
- JobDetail 인터페이스
  - Job 구현 객체를 실행시키기 위한 정보를 정의한다.
- Trigger 인터페이스
  - Job 실행 조건을 정의한다.
- Scheduler 인터페이스
  - 등록된 Job과 Trigger를 관리하는 기능들을 정의한다.
- JobListener 인터페이스
  - Job 수행 전, 완료 이벤트와 중단 이벤트를 확인할 수 있는 기능을 정의한다.
- JobStore 인터페이스
  - Job, Trigger 정보를 저장하는 메커니즘을 정의한다. 메모리 혹은 데이터베이스를 사용한다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/quartz-in-spring-mvc-01.png" width="100%" class="image__border">
</div>
<center>https://blog.advenoh.pe.kr/spring/Quartz-Job-Scheduler%EB%9E%80/</center>

<br/>

쿼츠에 대해 공부해 보기 전인 최근까지도 배치(batch)라는 용어와 혼동하여 사용하였다. 공부하기 전까지는 쿼츠가 제공하는 기능이 `배치 잡(Batch Job)`이라고 생각했는데, 실제로 제공하는 기능은 `잡 스케줄링(Job Scheduling)`이다. 둘은 다른 개념이므로 글을 이어가기 전에 정리해 두고 싶다.

- 잡 스케줄링은 특정한 시간에 등록한 작업(job)을 자동으로 실행시키는 일을 의미한다.
- 배치 잡은 일괄 처리, 여러 개의 작업(job)을 중단 없이 연속적으로 처리하는 일을 의미한다. 사용자와의 상호 작용 없이 여러 작업(job)들을 미리 정해진 순서에 따라 일괄적으로 처리한다.

배치 잡을 정기적으로 수행하려면 잡 스케줄링 기능을 이용해야 한다.

글 초반에 말했듯 쿼츠는 몇 가지 특장점이 있다. 어떤 특장점들이 있을까?

- 데이터베이스를 기반으로 클러스터링(clustering) 기능을 제공한다.
- 시스템의 `failover`와 라운드-로빈(round-robin) 방식의 분산 처리를 지원한다.
- 기본적으로 여러 가지 플러그인(plug-in)을 제공한다.
  - ShutdownHookingPlugin - JVM 종료 이벤트를 확인하고 스케줄러에게 종료를 알린다.
  - LoggingJobHistoryPlugin - Job 실행에 대한 로그를 남긴다.

물론 단점도 존재한다.

- 클러스터링 기능을 제공하지만, 단순한 랜덤(random) 방식이므로 완벽한 분산 처리는 안 된다.
- 잡 스케줄링에 관련된 관리자 화면(ADMIN UI)은 별도로 제공하지 않는다.
- 스케줄링 실행에 대한 이력을 보관하지 않는다.

## 2. Implement Quartz

현재 진행하는 프로젝트의 기술 스택인 스프링 MVC(Spring Legacy) 프레임워크로 구현했다. 시간이나 기회가 된다면 스프링 부트 프레임워크를 이용한 구현 예제도 글로 정리할 예정이다. 구현 코드를 살펴보기 전에 크론 표현식(cron expression)에 대한 개념 정리가 필요하다. 크론은 유닉스(Unix) 계열의 잡 스케줄러다. 크론 표현식은 크론 스케줄러에서 사용하는 정규 표현식이다. 이 표현식을 이용해 쿼츠 스케줄러의 트리거 시간을 지정할 수 있다.

크론 표현식을 작성하는 방법을 테이블로 정리했다. 표현식은 7개의 필드로 구성되어 있고, 각각 의미가 있다.

| 필드명 | 위치 | 값의 허용 범위 | 허용된 특수문자 |
|:---:|:---:|:---:|:---:|
| 초(seconds) | 1번 | 0 ~ 59 | , - * / |
| 분(minutes) | 2번 | 0 ~ 59 | , - * / |
| 시(hours) | 3번 | 0 ~ 23 | , - * / |
| 일(day) | 4번 | 1 ~ 31 | , - * ? / L W |
| 월(month) | 5번 | 1 ~ 12 or JAN ~ DEC | , - * / |
| 요일(week) | 6번 | 0 ~ 6 or SUN ~ SAT | , - * ? / L # |
| 연도(year) | 7번 | empty or 1970 ~ 2099 | , - * / |

각 위치에 어떤 값들이 들어갈 수 있을까? 숫자 외에 들어갈 수 있는 특수문자들의 의미는 다음과 같다.

- `*` - 모든 값을 의미한다.
- `?` - 특정한 값이 없음을 의미한다.
- `-` - 범위를 의미한다. 월요일부터 수요일까지는 `MON-WED`로 표현한다.
- `,` - 특별한 값일 때만 동작한다. 월, 수, 금 실행은 `MON,WED,FRI`로 표현한다.
- `/` - 시작 시간/단위를 나눠 표현한다. `0/5` 표현은 0초부터 5초 간격으로 실행을 의미한다.
- `L` - 일 위치에서 사용하면 마지막 일, 요일 위치에서 사용하면 마지막 요일(토요일)이다.
- `W` - 가장 가까운 평일을 찾는다. `15W` 표현은 15일에서 가장 가까운 평일을 찾는다.
- `#` - 몇째 주의 무슨 요일인지 표현한다. `3#2` 표현은 2번째 주 수요일을 찾는다.

크론 표현식에 대한 간단한 예시를 통해 이해도를 높여보자.

| 표현식 | 빈도 |
|:---|:---|
| 0/5 * * * * ? | 5초마다 실행 |
| 0 0/5 * * * ? | 5분마다 실행 |
| 0 15 10 ? * * | 매일 오전 10시 15분에 실행 |
| 0 15 10 * * ? 2014 | 2014년 동안 매일 오전 10시 15분에 실행 |
| 0 * 14 * * ? | 매일 오후 2시에 시작해서 매 분마다 실행하고 오후 2시 59분에 마지막 실행 |
| 0 0/5 14 * * ? | 매일 오후 2시에 시작해서 5분마다 실행하고 오후 2시 55분에 마지막 실행 |
| 0 0/5 14,18 * * ? | 매일 오후 2시, 6시에 시작해서 5분마다 실행하고 오후 2시 55분, 6시 55분에 마지막 실행 |

크론 표현식을 모두 살펴봤으니, pom.xml 파일에 필요한 의존성을 추가한다. 전체 XML 파일 내용은 [GitHub 링크](https://github.com/Junhyunny/blog-in-action/tree/master/2021-11-07-quartz-in-spring-mvc)에서 확인할 수 있다. 쿼츠 기능인 `org.quartz-scheduler.quartz` 의존성을 추가한다.

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

쿼츠를 스프링에서 사용하기 위한 `org.springframework.spring-context-support` 의존성을 추가한다.

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

applicationContext.xml 파일에 쿼츠 실행을 위한 빈(bean) 객체 설정을 하나씩 살펴보겠다. 전체 XML 파일 내용은 테스트 코드 [GitHub 링크](https://github.com/Junhyunny/blog-in-action/tree/master/2021-11-07-quartz-in-spring-mvc)에서 확인할 수 있다. 먼저, `JobDetail` 객체를 만드는 `JobDetailFactoryBean` 객체를 정의한다.

- `jobClass`
  - Job 역할을 수행할 클래스를 지정한다.
- `jobDataAsMap`
  - Job 역할을 수행할 클래스에게 전달할 파라미터를 정의한다. `setter` 메서드를 통해 전달받는다.

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

다음은 작업 수행 조건을 정의하는 `CronTriggerFactoryBean` 객체에 대한 설정이다. 크론 표현식을 사용하는 `CronTriggerFactoryBean` 객체에 대해 정의한다.

- `jobDetail`
  - 수행할 `jobDetail` 객체를 지정한다.
- `cronExpression`
  - 작업을 수행할 조건을 Cron Expression으로 정의한다. 매 5초마다 동작하도록 설정한다.

```xml
    <bean id="cronTrigger" class="org.springframework.scheduling.quartz.CronTriggerFactoryBean">
        <property name="jobDetail" ref="blogJob"/>
        <property name="cronExpression" value="0/5 * * * * ?"/>
    </bean>
```

마지막으로 스케줄러(scheduler)를 생성하는 `SchedulerFactoryBean` 객체에 대해 정의한다.

- `triggers` - 사용할 트리거들을 지정한다.

```xml
    <bean class="org.springframework.scheduling.quartz.SchedulerFactoryBean">
        <property name="triggers">
            <list>
                <ref bean="cronTrigger"/>
            </list>
        </property>
    </bean>
```

지정한 스케줄에 따라 실행되는 BlogJob 클래스를 살펴보자. QuartzJobBean 클래스를 구현한다.

- `executeInternal` 메서드 내부에 수행할 기능을 구현한다.
- `setter` 메서드를 이용해 `blogService` 빈(bean) 객체를 주입받는다.

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

실제 비즈니스 로직을 수행하는 BlogServiceImpl 클래스를 살펴보자.

- 빈(bean) 이름을 `blobService`로 지정한다.
- 이름을 지정하지 않는 경우 `jobDataAsMap` 설정 시 찾을 수 없다는 에러가 발생한다.
- 트랜잭션 정상 처리 여부를 확인하기 위해 임의로 예외(exception)를 발생시킨다.

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

데이터베이스에 접근하는 BlogDao 인터페이스를 살펴보자.

- selectTest 메서드
  - TB_TEST 테이블 데이터를 조회한다.
- updateTest 메서드
  - TB_TEST 테이블 데이터를 업데이트한다.

```java
package blog.in.action.dao;

import java.util.List;
import java.util.Map;

public interface BlogDao {

    List<Map<String, Object>> selectTest();

    void updateTest(Map<String, Object> test);
}
```

BlogDao 인터페이스의 기능을 정의한 sql.xml 파일을 살펴보자.

- selectTest 질의
  - TB_TEST 테이블의 데이터를 조회한다.
- updateTest 질의
  - TB_TEST 테이블의 특정 ID에 해당하는 데이터의 CHANGED_AT 컬럼을 업데이트한다.

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

## 3. 쿼츠 스케줄러 테스트

쿼츠 스케줄러가 정상적으로 동작하는지 살펴보자. 서버를 실행시킨 후 TB_TEST 테이블의 `CHANGED_AT` 항목이 5초마다 갱신되는지 확인한다. 예외(exception)가 발생한 경우에는 `CHANGED_AT` 항목이 갱신되지 않음을 확인한다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/quartz-in-spring-mvc-02.gif" width="100%" class="image__border">
</div>

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
[quartz-clustering-link]: https://junhyunny.github.io/spring-mvc/quartz-clustering-in-spring-mvc/
