---
title: "@ConfigurationProperties Annotation"
search: false
category:
  - spring-boot
last_modified_at: 2023-03-03T23:55:00
---

<br/>

## 0. 들어가면서

`application.yml` 설정에 등록한 값들을 리스트(list)로 사용하는 방법에 대해 정리하였습니다. 

## 1. @Value Anntation

설정 값을 주입 받는 방법 중 가장 흔히 사용됩니다. 
`SpEL(Spring Exression Language)` 규칙을 사용하면 더 다양한 형식으로 설정 값을 받을 수 있습니다. 
이번 포스트에선 단순하게 리스트로만 값을 주입 받았습니다. 

### 1.1. application-value.yml

* 다음과 같이 호스트 정보들이 쉼표로 구분되어 있습니다.

```yml
redis:
  sentinels: http://sentinel-1:8080,http://sentinel-2:8081,http://sentinel-3:8082
```

### 1.2. ValueApplicationTests Class

* `@Value` 애너테이션을 사용해 설정 값들을 주입 받습니다.
* 키(key) 하나에 매칭된 여러 설정 값들을 쉼표(,)로 구분한 경우 배열(array)나 리스트로 주입 받을 수 있습니다.
* `SpEL`을 사용하면 특정한 문자나 정규식 패턴을 통해 설정 값을 분리 후 주입 받을 수 있습니다. 

```java
package action.in.blog;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

@SpringBootTest(properties = {"spring.profiles.active=value"})
class ValueApplicationTests {

    @Value("${redis.sentinels}")
    String[] sentinels;

    @Value("#{'${redis.sentinels}'.split(',')}")
    List<String> sentinelsWithSplitter;

    private String[] getHostAndPort(String sentinel) {
        int lastIndex = sentinel.lastIndexOf(":");
        return new String[]{sentinel.substring(0, lastIndex), sentinel.substring(lastIndex + 1)};
    }

    @Test
    void get_string_array_from_application_yml() {

        assertThat(sentinels.length, equalTo(3));
        String[] firstSentinel = getHostAndPort(sentinels[0]);
        assertThat(firstSentinel[0], equalTo("http://sentinel-1"));
        assertThat(firstSentinel[1], equalTo("8080"));
        String[] secondSentinel = getHostAndPort(sentinels[1]);
        assertThat(secondSentinel[0], equalTo("http://sentinel-2"));
        assertThat(secondSentinel[1], equalTo("8081"));
        String[] thirdSentinel = getHostAndPort(sentinels[2]);
        assertThat(thirdSentinel[0], equalTo("http://sentinel-3"));
        assertThat(thirdSentinel[1], equalTo("8082"));
    }

    @Test
    void get_string_list_from_application_yml() {

        assertThat(sentinelsWithSplitter.size(), equalTo(3));
        String[] firstSentinel = getHostAndPort(sentinelsWithSplitter.get(0));
        assertThat(firstSentinel[0], equalTo("http://sentinel-1"));
        assertThat(firstSentinel[1], equalTo("8080"));
        String[] secondSentinel = getHostAndPort(sentinelsWithSplitter.get(1));
        assertThat(secondSentinel[0], equalTo("http://sentinel-2"));
        assertThat(secondSentinel[1], equalTo("8081"));
        String[] thirdSentinel = getHostAndPort(sentinelsWithSplitter.get(2));
        assertThat(thirdSentinel[0], equalTo("http://sentinel-3"));
        assertThat(thirdSentinel[1], equalTo("8082"));
    }
}
```

### 1.3. Pain Point of @Value Annotation for Multiple Values

`@Value` 애너테이션을 사용한 방법은 다음과 같은 불편함이 있습니다. 

* 값이 긴 경우 항목이 많다면 옆으로 길어지기 때문에 `application.yml`의 가독성이 떨어집니다.
* 문자열을 다시 파싱(parsing)해서 사용해야 합니다.
    * 예상치 못한 버그나 에러가 발생할 수 있습니다.
* 포트 번호처럼 정수인 경우 파싱된 데이터를 다시 형변환해야 합니다. 

## 2. @ConfigurationProperties Annotation

`@ConfigurationProperties` 애너테이션을 사용하면 더 나은 방법으로 값을 주입 받을 수 있습니다. 

### 2.1. application-config.yml

* 다음과 같은 방법으로 여러 개의 호스트 정보들을 구분합니다.

```yml
redis:
  sentinels:
    - host: http://sentinel-1
      port: 8080
    - host: http://sentinel-2
      port: 8081
    - host: http://sentinel-3
      port: 8082
```

### 2.2. SentinelConfiguration Class

`application.yml` 설정 파일에 명시된 키를 클래스 필드와 동일한 이름으로 지정하면 설정 값들을 객체 모습으로 사용할 수 있습니다. 

* 객체 멤버 변수에 값을 주입 받거나 사용하려면 `Getter`, `Setter` 메서드가 필요합니다.
* `@Profile` 애너테이션을 통해 프로파일이 `config`인 경우에만 빈을 생성합니다.
    * 이번 포스트의 테스트를 위한 설정입니다.
* `@Configuration` 애너테이션을 통해 설정 관련된 빈 객체로 지정합니다.
* `@ConfigurationProperties` 애너테이션을 통해 주입 받기 원하는 데이터의 키 값을 접두사(prefix)로 지정합니다.
* `redis` 키 하위에 존재하는 `sentinels` 키와 매칭된 클래스 필드를 작성합니다.
    * `sentinels`이라는 이름을 가진 필드를 생성합니다.
    * `SentinelInstance` 객체를 리스트로 주입 받습니다.
* `sentinels` 키 하위에 존재하는 `host`, `port` 키와 매칭된 클래스 필드를 작성합니다.
    * `SentinelInstance` 클래스에 `host`, `port`라는 이름을 가진 필드들을 생성합니다.
    * `host` 값은 문자열, `port` 값은 정수로 주입 받습니다.

```java
package action.in.blog.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.util.List;

@Profile("config")
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "redis")
public class SentinelConfiguration {

    private List<SentinelInstance> sentinels;

    @Getter
    @Setter
    public static class SentinelInstance {

        private String host;
        private int port;
    }
}
```

### 2.3. ConfigurationPropertiesApplicationTests Class

* 주입 받은 객체의 센티널 정보 리스트 사이즈를 확인합니다.
* 각 센티널 정보가 정상적으로 주입되었는지 확인합니다.

```java
package action.in.blog;

import action.in.blog.config.SentinelConfiguration;
import action.in.blog.config.SentinelConfiguration.SentinelInstance;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

@SpringBootTest(properties = {"spring.profiles.active=config"})
class ConfigurationPropertiesApplicationTests {

    @Autowired
    SentinelConfiguration sentinelConfiguration;

    @Test
    void get_sentinel_from_yml_using_bean() {

        List<SentinelInstance> sentinelInstances = sentinelConfiguration.getSentinels();


        assertThat(sentinelInstances.size(), equalTo(3));
        SentinelInstance firstInstance = sentinelInstances.get(0);
        assertThat(firstInstance.getHost(), equalTo("http://sentinel-1"));
        assertThat(firstInstance.getPort(), equalTo(8080));
        SentinelInstance secondInstance = sentinelInstances.get(1);
        assertThat(secondInstance.getHost(), equalTo("http://sentinel-2"));
        assertThat(secondInstance.getPort(), equalTo(8081));
        SentinelInstance thirdInstance = sentinelInstances.get(2);
        assertThat(thirdInstance.getHost(), equalTo("http://sentinel-3"));
        assertThat(thirdInstance.getPort(), equalTo(8082));
    }

}
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-03-03-configuration-properties-annotation>

#### REFERENCE

* <https://www.baeldung.com/spring-value-annotation>
* <https://www.baeldung.com/configuration-properties-in-spring-boot>

[spring-cloud-openfeign-link]: https://junhyunny.github.io/spring-boot/spring-cloud/spring-cloud-openfeign/