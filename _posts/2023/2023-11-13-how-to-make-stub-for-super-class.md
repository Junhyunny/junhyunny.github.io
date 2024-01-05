---
title: "How to make stub for super class"
search: false
category:
  - java
  - spring-boot
  - test
last_modified_at: 2023-11-13T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Test Double][test-double-link]

## 1. Problem

스프링 시큐리티(spring security) OAuth2 클라이언트 의존성을 사용해 SNS 로그인을 구현할 때 DefaultOAuth2UserService 클래스를 상속받은 클래스를 만들어 확장했습니다. 부모 클래스 기능을 통해 리소스 서버(resource server)로부터 사용자 정보를 조회해야하므로 비즈니스 로직 중간에 부모 클래스의 기능을 호출해야 했습니다. 구현 코드는 정상적으로 동작하지만, 테스트를 작성할 때 다음과 같은 문제가 있었습니다. 

- 부모 클래스는 외부 리소스 서버로 API 요청을 보내 사용자 정보를 조회합니다.
    - 외부 서비스이므로 테스트가 실패할 수 있습니다.
    - 테스트 코드에서 불필요하게 외부 서비스를 호출합니다. 
    - 단위 테스트이므로 피드백이 빨라야합니다.
- API 요청을 보내기 위해 많은 정보들이 필요합니다.
    - 테스트를 위해 준비해야하는 코드가 많아집니다.

이 상황처럼 핸들링할 수 없는 외부 의존성과 연결된 기능을 쉽게 테스트하려면 테스트 더블(test double)을 사용합니다. 이 경우 SUT(system under test) 객체가 내부적으로 호출하는 부모 클래스의 메소드 응답을 스텁(stub)해야하기 때문에 어려웠습니다. 부모 클래스의 기능이지만, SUT 객체 자체 기능 중 일부를 테스트 더블로 만드는 일과 동일합니다. 

- 구현 코드를 보면 코드 중간에 부모 클래스의 loadUser 메소드를 호출합니다. 
- 부모 클래스의 loadUser 메소드에서 외부 서버와 통신합니다. 
- 테스트를 개발자가 제어하려면 부모 클래스의 loadUser 메소드 응답을 스텁으로 대체해야합니다.

```java
package action.in.blog.service;

import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DefaultOAuth2UserServiceDelegator extends DefaultOAuth2UserService {

    private final List<CustomOAuth2UserService> oAuth2UserServices;


    public DefaultOAuth2UserServiceDelegator(List<CustomOAuth2UserService> oAuth2UserServices) {
        this.oAuth2UserServices = oAuth2UserServices;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        for (var oauth2Service : oAuth2UserServices) {
            if (!oauth2Service.supports(userRequest)) {
                continue;
            }
            // 부모 클래스의 loadUser 메소드를 호출
            var oauthUser = super.loadUser(userRequest);
            return oauth2Service.createOrLoadUser(oauthUser);
        }
        throw new RuntimeException("Not found user service");
    }
}
```

위 메소드의 단위 테스트 코드를 실행하면 다음과 같은 에러 메세지를 볼 수 있습니다. 

- 스프링 시큐리티 OAuth2 클라이언트가 리소스 서버로부터 사용자 정보를 조회할 때 필요한 정보들을 읽는 과정에서 에러가 발생합니다.

```
java.lang.NullPointerException: Cannot invoke "org.springframework.security.oauth2.client.registration.ClientRegistration.getProviderDetails()" because the return value of "org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest.getClientRegistration()" is null
	at org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService.loadUser(DefaultOAuth2UserService.java:91)
	at action.in.blog.service.DefaultOAuth2UserServiceDelegator.loadUser(DefaultOAuth2UserServiceDelegator.java:31)
	at action.in.blog.service.DefaultOAuth2UserServiceDelegator.loadUser(DefaultOAuth2UserServiceDelegator.java:27)
	at action.in.blog.service.DefaultOAuth2UserServiceDelegatorTest.loadUser(DefaultOAuth2UserServiceDelegatorTest.java:42)
    ...
```

## 2. Solve the problem 

부모 클래스 메소드를 테스트 더블로 만들 수 있는 PowerMock 같은 의존성이 있지만, Junit4만 지원하는 것 같았습니다. Junit5을 사용하는 스프링 부트 3.1.X 버전에서 잘 동작하지 않았습니다. 잘 동작하지 않는 의존성을 억지로 호환성을 맞추고 싶지 않았습니다. 

스프링 부트 프레임워크가 기본으로 사용하는 모키토(mockito)의 스파이(spy) 기능과 부모 클래스 메소드를 우회하여 호출하는 메소드를 만들어 테스트를 작성하였습니다. 모키토의 스파이는 기본적으로 실제 구현체의 기능을 사용하지만, 필요하다면 테스트 더블로 사용할 수 있습니다. 

### 2.1. DefaultOAuth2UserServiceDelegator Class

- 새로운 메소드를 만들고 부모 클래스의 loadUser 메소드를 호출하는 코드를 메소드 내부로 옮깁니다.

```java
package action.in.blog.service;

import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DefaultOAuth2UserServiceDelegator extends DefaultOAuth2UserService {

    private final List<CustomOAuth2UserService> oAuth2UserServices;


    public DefaultOAuth2UserServiceDelegator(List<CustomOAuth2UserService> oAuth2UserServices) {
        this.oAuth2UserServices = oAuth2UserServices;
    }

    public OAuth2User loadUserFromParent(OAuth2UserRequest userRequest) {
        return super.loadUser(userRequest);
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        for (var oauth2Service : oAuth2UserServices) {
            if (!oauth2Service.supports(userRequest)) {
                continue;
            }
            var oauthUser = loadUserFromParent(userRequest);
            return oauth2Service.createOrLoadUser(oauthUser);
        }
        throw new RuntimeException("Not found user service");
    }
}
```

### 2.2. Test

- SUT 객체를 스파이로 만듭니다.
- `doReturn(expectedValue).when(testDouble).method(params)` 문법을 사용합니다. 
    - 부모 클래스 기능을 내부에서 호출하는 loadUserFromParent 메소드의 결과를 스텁합니다.

```java
package action.in.blog.service;

import action.in.blog.domain.CustomAuthentication;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class DefaultOAuth2UserServiceDelegatorTest {

    CustomOAuth2UserService googleUserService;
    CustomOAuth2UserService facebookUserService;
    DefaultOAuth2UserServiceDelegator sut;

    @BeforeEach
    void setUp() {
        googleUserService = mock(CustomOAuth2UserService.class);
        facebookUserService = mock(CustomOAuth2UserService.class);
        sut = spy(new DefaultOAuth2UserServiceDelegator(
                List.of(googleUserService, facebookUserService)
        ));
    }

    @Test
    void loadUser() {

        var authentication = new CustomAuthentication();
        var oauth2UserRequest = mock(OAuth2UserRequest.class);
        var oauth2User = new DefaultOAuth2User(Collections.emptyList(), Map.of("id", "junhyunny"), "id");
        doReturn(oauth2User).when(sut).loadUserFromParent(oauth2UserRequest);
        when(googleUserService.supports(oauth2UserRequest)).thenReturn(true);
        when(googleUserService.createOrLoadUser(oauth2User)).thenReturn(authentication);


        var result = sut.loadUser(oauth2UserRequest);


        assertEquals(result, authentication);
    }
}
```

## CLOSING

위 기능을 개발하기 위해 단위 테스트를 작성하는데 시간을 꽤 많이 사용했습니다. 자식 클래스가 인스턴스화 되었을 때 부모 클래스의 기능 또한 테스트 대상의 기능이기 때문에 생각보다 테스트가 까다로웠습니다. 스택 오버플로우(stack overflow)에서도 답변을 얻지 못 했지만, 아이디어를 얻을 수 있어서 다행이었습니다. 참고한 스택 오버플로우 질문의 답글들을 보면 이런 식으로 해결한 사람이 없었기 때문에 도움이 되길 바라는 마음으로 답변을 작성했습니다. 

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-11-13-how-to-make-stub-for-super-class>

#### REFERENCE

- <https://stackoverflow.com/questions/3467801/mockito-how-to-mock-only-the-call-of-a-method-of-the-superclass>
- <https://stackoverflow.com/questions/23865555/how-to-mock-super-reference-on-super-class/23884011#23884011>

[test-double-link]: https://junhyunny.github.io/information/test-driven-development/test-double/