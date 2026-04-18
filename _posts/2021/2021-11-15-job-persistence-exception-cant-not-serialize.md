---
title: "JobPersistenceException: JobDataMap 직렬화 실패"
search: false
category:
  - spring-mvc
  - exception
last_modified_at: 2026-03-24T08:03:14+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS
- [Quartz in Spring MVC][quartz-in-spring-mvc-link]
- [Quartz Clustering in Spring MVC][quartz-clustering-link]

## 1. 문제 상황

`Quartz Clustering`을 구현하면서 다음과 같은 에러를 만났다.

##### BlogServiceImpl 클래스 직렬화(serialization) 에러
```
    Caused by: java.io.NotSerializableException: Unable to serialize JobDataMap for insertion into database because the value of property 'blogService' is not serializable: blog.in.action.service.impl.BlogServiceImpl
        at org.quartz.impl.jdbcjobstore.StdJDBCDelegate.serializeJobData(StdJDBCDelegate.java:3083)
        at org.quartz.impl.jdbcjobstore.StdJDBCDelegate.updateJobDetail(StdJDBCDelegate.java:647)
        at org.quartz.impl.jdbcjobstore.JobStoreSupport.storeJob(JobStoreSupport.java:1115)
    ...
```

에러 로그를 보면 `BlogServiceImpl` 클래스 정보를 데이터베이스에 저장하기 위한 직렬화 작업이 실패한 것으로 보인다. 문제가 발생하는 클래스에 `Serializable` 인터페이스를 추가하여도 MyBatis의 `SqlSessionTemplate` 클래스를 직렬화할 수 없다는 에러가 발생한다. 결국 같은 문제에 직면하게 된다.

##### SqlSessionTemplate 클래스 직렬화(serialization) 에러
```
    Caused by: java.io.NotSerializableException: Unable to serialize JobDataMap for insertion into database because the value of property 'blogService' is not serializable: org.mybatis.spring.SqlSessionTemplate
        at org.quartz.impl.jdbcjobstore.StdJDBCDelegate.serializeJobData(StdJDBCDelegate.java:3083)
        at org.quartz.impl.jdbcjobstore.StdJDBCDelegate.updateJobDetail(StdJDBCDelegate.java:647)
        at org.quartz.impl.jdbcjobstore.JobStoreSupport.storeJob(JobStoreSupport.java:1115)
    ...
```

문제 상황을 정리해보면 다음과 같았다.
- `QuartzJobBean`을 상속한 클래스에서 `@Autowired` 키워드를 사용한 빈(bean) 주입이 안 된다.
- `Quartz Clustering` 구축 시 `JobDataMap` 파라미터와 `Setter` 메서드를 사용하여 빈(bean) 주입 시 에러가 발생한다.
- 비즈니스 로직에서 데이터베이스 기능을 사용하기 위해선 `ServiceImpl` 빈(bean) 주입이 필요하다.

## 2. 해결 방법

`applicationContext.xml` 설정과 Job 클래스를 다음과 같이 수정하면 문제를 해결할 수 있다.

### 2.1. applicationContext.xml 변경
- `JobDetailFactoryBean` 생성 시 `jobDataAsMap` 속성 관련 설정을 제거한다.
- `SchedulerFactoryBean` 생성 시 `applicationContextSchedulerContextKey` 속성 값을 `applicationContext` 키워드로 지정하는 설정을 추가한다.

```xml
    <bean name="blogJob" class="org.springframework.scheduling.quartz.JobDetailFactoryBean">
        <property name="jobClass" value="blog.in.action.job.BlogJob"/>
        <property name="durability" value="true"/>
        <!-- 제거 -->
        <!-- <property name="jobDataAsMap">
            <map>
                <entry key="blogService" value-ref="blobService"/>
            </map>
        </property> -->
    </bean>
    ...
    <bean class="org.springframework.scheduling.quartz.SchedulerFactoryBean">
        <property name="triggers">
            <list>
                <ref bean="cronTrigger"/>
            </list>
        </property>
        <!-- 추가 -->
        <property name="applicationContextSchedulerContextKey" value="applicationContext"/>
        ...
    </bean>
```

### 2.2. BlogJob 클래스
- `Setter` 메서드는 제거한다.
- `executeInternal` 메서드에 파라미터로 전달받은 `JobExecutionContext` 객체에서 스케줄러를 획득한다.
- 스케줄러에서 `applicationContext` 키워드로 Spring 컨텍스트(context) 정보를 획득한다.
- Spring 컨텍스트에서 `getBean` 메서드를 통해 원하는 빈(bean)을 꺼내어 사용한다.

```java
package blog.in.action.job;

import blog.in.action.service.BlogService;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.quartz.QuartzJobBean;

public class BlogJob extends QuartzJobBean {

    private BlogService blogService;

    // 제거
    // public void setBlogService(BlogService blogService) {
    //     this.blogService = blogService;
    // }

    @Override
    protected void executeInternal(JobExecutionContext jobExecutionContext) throws JobExecutionException {
        try {
            // 추가
            blogService = ((ApplicationContext) jobExecutionContext.getScheduler().getContext().get("applicationContext")).getBean(BlogService.class);
            blogService.updateTest();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

#### REFERENCE
- <https://junhyunny.github.io/spring-mvc/quartz-in-spring-mvc/>
- <https://junhyunny.github.io/spring-mvc/quartz-clustering-in-spring-mvc/>

[quartz-in-spring-mvc-link]: https://junhyunny.github.io/spring-mvc/quartz-in-spring-mvc/
[quartz-clustering-link]: https://junhyunny.github.io/spring-mvc/quartz-clustering-in-spring-mvc/
