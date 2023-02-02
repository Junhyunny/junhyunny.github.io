---
title: "[BeanCreationException] Error creating bean with name 'configurationPropertiesBeans'"
search: false
category:
  - spring-boot
  - spring-cloud
  - exception
last_modified_at: 2021-08-22T20:30:00
---

<br/>

## 0. 들어가면서

[Spring Cloud Openfeign][openfeign-blog-link] 포스트를 작성하던 중에 발생한 에러입니다. 
간단한 테스트 코드를 작성한 후에 maven install 골(goal)을 실행했더니 테스트 단계(test phase)에서 발생되지 않던 Exception이 발생하였습니다. 

## 1. 에러 현상과 회피 과정

### 1.1. 발생한 에러와 테스트 코드 실패 관련 로그

<p align="left"><img src="/images/error-creating-bean-configurationPropertiesBeans-1.JPG"></p>

<p align="left"><img src="/images/error-creating-bean-configurationPropertiesBeans-2.JPG"></p>

### 1.2. maven install 테스트 skip 옵션 사용
**`귀찮으니 일단 테스트는 치우고 글부터 쓸까?`** 라는 생각으로 처음엔 테스트를 건너뛰었습니다. 

```shell
mvn clean install -Dmaven.test.skip=true
```

<p align="left"><img src="/images/error-creating-bean-configurationPropertiesBeans-3.JPG"></p>

## 2. 에러 해결 과정
글을 작성하다보니 에러를 해결하지 못한 것이 마음에 걸려 이를 먼저 해결하기로 하였습니다. 
한 두어시간 허비했지만 일단 해결했으니 관련된 내용을 정리해서 올려보도록 하겠습니다. 

### 2.1. 에러 로그

> Error creating bean with name 'configurationPropertiesBeans' defined in class path resource <br/>
> [org/springframework/cloud/autoconfigure/ConfigurationPropertiesRebinderAutoConfiguration.class]

에러를 꼼꼼히 살펴보니 모두 같은 에러였습니다. **`'configurationPropertiesBeans을 생성하지 못합니다.'`** 
원래 발생하던 것이 아니니 이번에 새로 추가된 dependency에 문제가 있다고 생각했습니다. 

### 2.2. 추가한 spring-cloud-starter-openfeign dependency
```xml
    ...
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-openfeign</artifactId>
        <version>2.2.7.RELEASE</version>
    </dependency>
    ...
```

### 2.3. ConfigurationPropertiesBeans class 정보
클래스에 힌트가 있을까 열어봤지만 별다른 힌트는 없었습니다. 
구글링이 필요한 시간입니다. 

```java
package org.springframework.cloud.context.properties;

...

/**
 * Collects references to <code>@ConfigurationProperties</code> beans in the context and
 * its parent.
 *
 * @author Dave Syer
 */
@Component
public class ConfigurationPropertiesBeans implements BeanPostProcessor, ApplicationContextAware {
    ...
}
```

### 2.4. 결론
해당 에러와 관련된 내용을 검색 중 [PS PSAwesome님의 포스트][reference-link]에서 해결법을 찾았습니다. 
**결론부터 말씀드리자면 문제는 spring-boot-starter-parent 버전과 spring-cloud-starter-openfeign 버전이 맞지 않아서 발생했던 것입니다.** 

##### spring-boot-starter-parent 버전 변경(2.2.7.RELEASE)
```xml
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.2.7.RELEASE</version>
        <relativePath /> <!-- lookup parent from repository -->
    </parent>
```

##### spring-boot-starter-parent 버전 변경 후 maven install
<p align="left"><img src="/images/error-creating-bean-configurationPropertiesBeans-4.JPG"></p>

#### REFERENCE
- <https://woowabros.github.io/experience/2019/05/29/feign.html>

[reference-link]: https://woowabros.github.io/experience/2019/05/29/feign.html
[openfeign-blog-link]: https://junhyunny.github.io/spring-boot/spring-cloud/spring-cloud-openfeign/