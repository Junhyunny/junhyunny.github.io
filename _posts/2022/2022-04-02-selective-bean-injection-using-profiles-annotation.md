---
title: "@Profile 애너테이션을 사용한 선택적 빈(bean) 주입"
search: false
category:
  - spring-boot
last_modified_at: 2022-04-02T23:55:00
---

<br/>

## 0. 들어가면서

서비스를 개발하다보면 서비스가 배포될 환경에 맞는 적절한 설정 주입이 필요합니다. 
스프링 프레임워크에선 `spring.profiles.active` 설정 값으로 환경 별로 설정을 나눌 수 있습니다. 
빈(bean)도 배포 환경에 맞게 선택적으로 주입받아 사용할 수 있습니다. 
이번 포스트에서는 환경을 나누고 이에 맞는 적절한 빈을 주입받는 방법을 정리해보았습니다. 

## 1. 적용 시나리오 예시

다음과 같은 상황이라고 가정해보겠습니다. 
- 개발자 A는 현재 B 서비스의 API를 호출하는 기능을 개발하는 중 입니다. 
- B 서비스 개발 팀에 문의해보니 아직 API 기능 개발이 완료되지 않았다고 합니다. 
- 개발자 A는 B 서비스로부터 필요한 데이터를 조회한 후 다른 기능을 개발해야 합니다. 
- B 서비스 API 기능 개발이 끝나길 기다릴 수 없으니 응답 메시지 샘플 파일을 먼저 받았습니다. 
- 개발자 A는 로컬에선 API 응답 메시지 샘플 파일을 사용하고, 다른 실행 환경에선 실제 API 요청을 수행하고 싶습니다. 

## 2. PokeMonProxy 인터페이스 만들기

비즈니스 로직에서 사용할 프록시 인터페이스를 생성합니다. 
B 서비스에서 포켓몬 정보를 조회하는 기능입니다.

```java
package action.in.blog.proxy;

import action.in.blog.domain.PokemonResponse;

public interface PokemonProxy {

    PokemonResponse getPokemons();
}
```

## 3. PokeMonProxy 구현체 만들기

실행 환경 별로 사용할 구현체를 만듭니다. 

### 3.1. LocalPokeMonProxy 클래스
- `@Profile` 애너테이션으로 `local` 환경일 때 사용하는 빈으로 설정합니다.
- 응답 메시지 json 파일을 사용합니다.

```java
package action.in.blog.proxy;

import action.in.blog.domain.PokemonResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

@Profile("local")
@Component
public class LocalPokemonProxy implements PokemonProxy {

    private ObjectMapper objectMapper = new ObjectMapper();

    private PokemonResponse getFromJson(String fileName) {
        try (
                InputStream inputStream = this.getClass().getClassLoader().getResourceAsStream(fileName);
                BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))
        ) {
            StringBuffer buffer = new StringBuffer();
            String line;
            while ((line = reader.readLine()) != null) {
                buffer.append(line);
            }
            return objectMapper.readValue(buffer.toString(), PokemonResponse.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public PokemonResponse getPokemons() {
        return getFromJson("pokemons.json");
    }
}
```

### 3.2. DefaultPokeMonProxy 클래스
- `@Profile` 애너테이션으로 `local` 환경이 아닐 때 사용하는 빈으로 설정합니다.
- 실제 API 요청을 수행합니다.

```java
package action.in.blog.proxy;

import action.in.blog.domain.PokemonResponse;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Profile("!local")
@Component
public class DefaultPokemonProxy implements PokemonProxy {

    private RestTemplate restTemplate = new RestTemplate();

    @Override
    public PokemonResponse getPokemons() {
        return restTemplate.getForObject("https://pokeapi.co/api/v2/pokemon", PokemonResponse.class);
    }
}
```

## 4. application.yml 설정 환경 분할

- 스프링 `application.yml` 설정 파일로 실행 환경을 `local`으로 지정합니다.
- 필요에 따라서 `dev`, `prod` 등을 사용할 수 있습니다.
- 지정한 실행 환경이 `local`이므로 `LocalPokemonProxy` 구현체가 빈으로 사용됩니다.
- 지정한 실행 환경이 `local`이 아닌 경우 `DefaultPokemonProxy` 구현체가 빈으로 사용됩니다.

```yml
spring:
  profiles:
    active: local
```

## 5. 테스트 코드

환경 별로 적절한 빈이 주입되었는지 확인합니다. 

### 5.1. LocalActionInBlogApplicationIT 클래스

- `@ActiveProfiles` 애너테이션을 사용하여 `local` 실행 환경 설정을 활성화시킵니다.
- 주입된 `Proxy` 빈이 `LocalPokemonProxy` 인스턴스인지 확인합니다.

```java
package action.in.blog;

import action.in.blog.proxy.LocalPokemonProxy;
import action.in.blog.proxy.PokemonProxy;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.core.IsInstanceOf.instanceOf;

@ActiveProfiles("local")
@SpringBootTest
class LocalActionInBlogApplicationIT {

    @Autowired
    PokemonProxy pokemonProxy;

    @Test
    void contextLoads() {
        assertThat(pokemonProxy, instanceOf(LocalPokemonProxy.class));
    }

}
```

### 5.2. DefaultActionInBlogApplicationIT 클래스

- `@ActiveProfiles` 애너테이션을 사용하여 `dev` 실행 환경 설정을 활성화시킵니다.
- 주입된 `Proxy` 빈이 `DefaultPokemonProxy` 인스턴스인지 확인합니다.

```java
package action.in.blog;

import action.in.blog.proxy.DefaultPokemonProxy;
import action.in.blog.proxy.PokemonProxy;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.core.IsInstanceOf.instanceOf;

@ActiveProfiles(profiles = {"dev"})
@SpringBootTest
class DefaultActionInBlogApplicationIT {

    @Autowired
    PokemonProxy pokemonProxy;

    @Test
    void contextLoads() {
        assertThat(pokemonProxy, instanceOf(DefaultPokemonProxy.class));
    }

}
```

## CLOSING

`application.yml` 파일의 `spring.profiles.active` 설정을 `local`, `dev` 값으로 변경하여 실행하면 실제 호출할 수 있습니다. 
설정 값에 따라 실제 일을 수행하는 객체는 다르지만 클라이언트에게 주는 응답 값은 같습니다.

##### PokeomonController 클래스

```java
package action.in.blog.controller;

import action.in.blog.proxy.PokemonProxy;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static action.in.blog.domain.PokemonResponse.Pokemon;

@RestController
public class PokeomonController {

    private final PokemonProxy pokemonProxy;

    public PokeomonController(PokemonProxy pokemonProxy) {
        this.pokemonProxy = pokemonProxy;
    }

    @GetMapping("/pokemons")
    public List<Pokemon> getPokemons() {
        return pokemonProxy.getPokemons().getResults();
    }
}
```

##### cURL 호출 테스트

```
 curl localhost:8080/pokemons | jq .  
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  1313    0  1313    0     0  94924      0 --:--:-- --:--:-- --:--:--  427k
[
  {
    "name": "bulbasaur",
    "url": "https://pokeapi.co/api/v2/pokemon/1/"
  },
  {
    "name": "ivysaur",
    "url": "https://pokeapi.co/api/v2/pokemon/2/"
  },
  {
    "name": "venusaur",
    "url": "https://pokeapi.co/api/v2/pokemon/3/"
  },

  ...
  
  {
    "name": "rattata",
    "url": "https://pokeapi.co/api/v2/pokemon/19/"
  },
  {
    "name": "raticate",
    "url": "https://pokeapi.co/api/v2/pokemon/20/"
  }
]
```

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-04-02-selective-bean-injection-using-profiles-annotation>

#### REFERENCE
- <https://pokeapi.co/api/v2/pokemon>