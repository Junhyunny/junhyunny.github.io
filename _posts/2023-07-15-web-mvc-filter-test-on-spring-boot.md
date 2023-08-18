---
title: "Web MVC Filter Test on Spring Boot"
search: false
category:
  - java
  - spring-boot
last_modified_at: 2023-07-15T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

## 0. 들어가면서

스프링(spring) 프레임워크에서 기본적으로 사용하는 톰캣(tomcat)은 필터(filter)라는 강력한 기능을 제공합니다. 
인증이나 인가 같은 공통적인 처리는 필터에 구현하는데 단위 테스트와 결합 테스트를 적절하게 활용하면 필터 기능을 보다 더 확실하게 검증할 수 있습니다. 

## 1. System Under Test

다음과 같은 인증 필터가 테스트 대상입니다. 

* AuthProvider를 의존합니다.
* 인증이 필요하지 않은 요청은 리스트를 통해 관리합니다.
    * 인증이 필요하지 않은 경우 다음 필터를 실행합니다.
* 인증에 실패하면 예외가 발생합니다.
    * 예외가 발생하면 401 코드와 에러 메세지를 전달합니다.
* 인증에 성공하면 다음 필터를 실행합니다.

```java
package action.in.blog.filter;

import action.in.blog.provider.AuthProvider;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class AuthFilter extends OncePerRequestFilter {

    private final List<String> ignorePaths;
    private final AuthProvider authProvider;

    public AuthFilter(
            @Value("${auth.ignore-paths}") List<String> ignorePaths,
            AuthProvider authProvider
    ) {
        this.ignorePaths = ignorePaths;
        this.authProvider = authProvider;
    }

    private boolean isIgnorePath(String path) {
        return ignorePaths.stream().anyMatch(ignorePaths -> ignorePaths.startsWith(path));
    }

    private void sendErrorResponse(HttpServletResponse response, Exception exception) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.getWriter().write(
                exception.getMessage()
        );
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        var requestURI = request.getRequestURI();
        if (isIgnorePath(requestURI)) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            authProvider.authenticate();
        } catch (Exception exception) {
            sendErrorResponse(response, exception);
            return;
        }

        filterChain.doFilter(request, response);
    }
}
```

## 2. Unit Test

단위 테스트를 통해 필터의 기능을 검증합니다.

* AuthProvider 의존성은 테스트 더블(test double)로 사용합니다. 
    * 각 테스트마다 스텁(stub) 혹은 스파이(spy) 역할을 수행합니다.
* 각 비즈니스 케이스에 맞는 동작을 수행하는지 검증합니다.
    * 인증 처리가 필요 없는 경로는 다음 필터를 실행하는지 확인합니다.
    * 인증 실패인 경우 적절한 에러 메세지와 상태 코드를 확인합니다.
    * 인증 성공인 경우 다음 필터를 실행하는지 확인합니다.

```java
package action.in.blog.filter;

import action.in.blog.provider.AuthProvider;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

public class AuthFilterTest {

    @Test
    void request_path_is_ignore_target_then_do_next_filter() throws ServletException, IOException {
        var request = new MockHttpServletRequest();
        var response = new MockHttpServletResponse();
        var filterChain = mock(FilterChain.class);
        var authProvider = mock(AuthProvider.class);
        var sut = new AuthFilter(
                List.of("/bar"),
                authProvider
        );
        request.setRequestURI("/bar");


        sut.doFilterInternal(request, response, filterChain);


        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    void fail_authenticate_then_return_error_message() throws ServletException, IOException {
        var request = new MockHttpServletRequest();
        var response = new MockHttpServletResponse();
        var filterChain = mock(FilterChain.class);
        var authProvider = mock(AuthProvider.class);
        var sut = new AuthFilter(
                Collections.emptyList(),
                authProvider
        );
        doThrow(new RuntimeException("client_id or client_secret is invalid"))
                .when(authProvider).authenticate();


        sut.doFilterInternal(request, response, filterChain);


        assertEquals(401, response.getStatus());
        assertEquals("client_id or client_secret is invalid", response.getContentAsString());
    }

    @Test
    void authenticate_successfully_then_do_next_filter() throws ServletException, IOException {
        var request = new MockHttpServletRequest();
        var response = new MockHttpServletResponse();
        var filterChain = mock(FilterChain.class);
        var authProvider = mock(AuthProvider.class);
        var sut = new AuthFilter(
                Collections.emptyList(),
                authProvider
        );


        sut.doFilterInternal(request, response, filterChain);


        verify(filterChain, times(1)).doFilter(request, response);
    }
}
```

## 3. Unit Test with MockMvc

필터의 동작만 확인하려면 위에 단위 테스트만으로 충분합니다. 
하지만 필터는 단순하게 동작하지 않습니다. 
여러 필터들과 함께 동작하고 필터를 지나면 컨트롤러(controller)까지 요청이 연결되어야 합니다. 
그런 관점에서 단순한 단위 테스트는 다음과 같은 제약사항이 있습니다.

* 필터를 통과해 컨트롤러까지 연결되는 것이 확인되지 않습니다.
* 에러가 발생했을 때 에러 코드와 메세지가 클라이언트에게 전달되는지 확인하기 어렵습니다. 

MockMvc를 사용하면 단위 테스트를 보완할 수 있습니다. 

* MockMvcBuilders 클래스를 통해 생성한 MockMvc 객체를 사용합니다.
* 테스트를 위한 컨트롤러 객체가 필요합니다.
    * 실제 구현체를 사용하거나 테스트 전용 컨트롤러를 만들어 사용합니다.
    * 이번 포스트에서는 테스트를 위한 전용 컨트롤러를 하나 만들었습니다.
* 각 비즈니스 케이스에 맞는 동작을 수행하는지 검증합니다.
    * 요청이 인증 처리가 필요 없는 경우 클라이언트는 정상적인 응답 메세지를 받습니다.
    * 요청이 인증 실패인 경우 클라이언트는 401 에러 코드와 메세지를 받습니다.
    * 요청이 성공인 경우 정상적인 응답 메세지를 받습니다. 

```java
package action.in.blog.filter;

import action.in.blog.provider.AuthProvider;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;
import java.util.List;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class AuthFilterMockMvcTest {

    @Test
    void request_path_is_ignore_target_then_get_response() throws Exception {
        var authProvider = mock(AuthProvider.class);
        var sut = new AuthFilter(
                List.of("/foo"),
                authProvider
        );
        doThrow(new RuntimeException("client_id or client_secret is invalid"))
                .when(authProvider).authenticate();
        var mockMvc = MockMvcBuilders
                .standaloneSetup(new AuthFilterTestController())
                .addFilter(sut)
                .build();


        mockMvc.perform(get("/foo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value("Hello Foo World"))
        ;
    }

    @Test
    void fail_authenticate_then_return_error_message() throws Exception {
        var authProvider = mock(AuthProvider.class);
        var sut = new AuthFilter(
                Collections.emptyList(),
                authProvider
        );
        doThrow(new RuntimeException("client_id or client_secret is invalid"))
                .when(authProvider).authenticate();
        var mockMvc = MockMvcBuilders
                .standaloneSetup(new AuthFilterTestController())
                .addFilter(sut)
                .build();


        mockMvc.perform(get("/foo"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("client_id or client_secret is invalid"))
        ;
    }

    @Test
    void authenticate_successfully_then_get_response() throws Exception {
        var authProvider = mock(AuthProvider.class);
        var sut = new AuthFilter(
                Collections.emptyList(),
                authProvider
        );
        var mockMvc = MockMvcBuilders
                .standaloneSetup(new AuthFilterTestController())
                .addFilter(sut)
                .build();


        mockMvc.perform(get("/foo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value("Hello Foo World"))
        ;
    }
}
```

## 4. Integration Test

API 요청에 대한 필터 기능에 대한 검증은 MockMvc를 사용한 테스트로 커버 가능합니다. 
어플리케이션 실행 시 설정(config) 혹은 빈(bean) 주입까지 정상적으로 수행되는지 확인하려면 결합 테스트를 수행해야 합니다. 
@SpringBootTest 애너테이션을 활용한 결합 테스트는 모든 컨텍스트를 필요로 하기 때문에 실행 속도가 느립니다. 
테스트를 통해 조금이라도 빠른 피드백을 받기 위해 @WebMvcTest 애너테이션을 사용합니다.

* @SpringBootTest 애너테이션을 사용하면 어플리케이션 실행에 필요한 모든 컨텍스트를 띄웁니다.
    * 필터 기능을 점검하기 위해 서비스(service), 레포지토리(repository) 영역의 컨텍스트까지 올리는 것은 비합리적입니다. 
* @WebMvcTest 애너테이션을 사용하면 컨트롤러가 요청과 응답할 때 필요한 컨텍스트만 띄웁니다.
    * 필터, 인터셉터, 컨트롤러 등이 이에 속합니다.
    * 엔드-포인트(end-point) 요청, 응답과 관계 없지만, 반드시 필요한 의존성은 @MockBean 애너테이션을 사용해 주입합니다.

<p align="center">
    <img src="/images/web-mvc-filter-test-on-spring-boot-1.JPG" width="100%" class="image__border">
</p>
<center>https://gowoonsori.com/spring/architecture/</center>

##### Code for Integration Test

* `controllers` 속성을 사용해 특정 컨트롤러만 선택적으로 띄웁니다. 
    * 테스트를 위한 컨트롤러를 만듭니다.
    * 프로파일을 통해 빈 생성 시 다른 컨트롤러와의 충돌 발생을 방지합니다.
* `properties` 속성을 사용해 해당 테스트에서 필요한 설정들을 정의합니다.
    * 프로파일은 auth-filter 입니다.
    * 인증 처리를 하지 않는 경로를 /bar 입니다.

```java
package action.in.blog.filter;

import action.in.blog.provider.AuthProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
        controllers = {AuthFilterTestController.class},
        properties = {"spring.profiles.active=auth-filter", "auth.ignore-paths=/bar"}
)
public class AuthFilterIT {

    @MockBean
    AuthProvider authProvider;
    @Autowired
    MockMvc mockMvc;

    @Test
    void request_path_is_ignore_target_then_get_response() throws Exception {

        doThrow(new RuntimeException("client_id or client_secret is invalid"))
                .when(authProvider).authenticate();


        mockMvc.perform(get("/bar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value("Hello Bar World"))
        ;
    }

    @Test
    void fail_authenticate_then_return_error_message() throws Exception {

        doThrow(new RuntimeException("client_id or client_secret is invalid"))
                .when(authProvider).authenticate();


        mockMvc.perform(get("/foo"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("client_id or client_secret is invalid"))
        ;
    }

    @Test
    void authenticate_successfully_then_get_response() throws Exception {

        mockMvc.perform(get("/foo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value("Hello Foo World"))
        ;
    }
}
```

## CLOSING

필터의 기능 점검을 결합 테스트로 수행했을 때 좋지 않다고 생각되는 점들은 다음과 같습니다. 

* 테스트 대상은 `AuthFilter`이지만, 테스트 코드에서 보이지 않습니다.
* 최소한의 컨텍스트만 사용하더라도 결합 테스트이므로 단위 테스트에 비해 속도가 느립니다.

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-07-15-web-mvc-filter-test-on-spring-boot>