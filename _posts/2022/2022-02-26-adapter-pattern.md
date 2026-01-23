---
title: "어댑터 패턴 (Adapter Pattern)"
search: false
category:
  - information
  - design-pattern
last_modified_at: 2026-01-23T14:48:00
---

<br/>

## 0. 들어가면서

스프링 프레임워크를 사용하다 보면 `Adapter`라는 단어로 끝나는 클래스들을 많이 볼 수 있다. 어렴풋이 어댑터 패턴(Adapter Pattern)이 적용되었을 것이라 생각했지만, 어째서 어댑터 패턴을 사용하는지 깊게 고민해 본 적은 없었다. 최근에 스프링 내부를 들여다보면서 다양한 어댑터들을 발견했다. 디자인 패턴의 구체적인 용도를 알고 코드를 분석하면 더 많은 인사이트(Insight)를 얻을 수 있을 것 같아 글로 정리했다.

## 1. Adapter Pattern

> Design Patterns: Elements of Reusable Object Oriented Software<br/>
> 클래스의 인터페이스를 사용자가 기대하는 인터페이스 형태로 적응(변환)시킵니다. 
> 서로 일치하지 않는 인터페이스를 갖는 클래스들을 함께 동작시킵니다. 

`GoF 디자인 패턴` 책을 읽다 보면 위 설명처럼 이해하기 난해한 문장이 많다. 다른 사람들은 이해했을지 모르겠지만, 나에겐 다소 어려운 느낌이다. GoF 디자인 패턴과 다른 레퍼런스(Reference)들을 읽고, 스스로 이해할 수 있도록 다시 정리했다.

- 어댑터 패턴은 인터페이스를 통한 다형성(Polymorphism)을 이용한 패턴이다.
- 기존 클래스를 대신할 새로운 기능의 클래스를 사용하기 위한 디자인 패턴이다.
- 어댑터 패턴은 두 가지 방법을 통해 운영 중인 코드를 최소한의 부담으로 변경할 수 있도록 도움을 준다.
  - 새로운 기능을 제공하는 클래스를 상속하여 인터페이스 구현 메서드 내부에서 부모의 메서드 호출
  - 새로운 기능을 제공하는 인스턴스에게 일을 위임하여 인터페이스 구현 메서드 내부에서 인스턴스 메서드 호출

클래스 다이어그램을 통해 어댑터 패턴의 참여자들을 살펴보자. 이 패턴을 이루는 몇 가지 요소들에 대해 이해할 필요가 있다.

- 클라이언트(Client)
  - 대상 인터페이스를 사용하는 클래스다.
  - 클라이언트 클래스 입장에선 인터페이스라는 껍데기만 사용하기 때문에 코드에 변경이 없다.
- 대상 인터페이스(Target Interface)
  - 클라이언트가 사용할 기능을 명세하고 있는 인터페이스이다.
  - 레거시 클래스는 인터페이스를 구현하고 있다.(Implement)
- 어댑터(Adapter)
  - 기능 확장을 위해 대상 인터페이스를 구현한 클래스다.
  - 오버라이드(Override) 한 메서드 내부를 신규 기능을 제공하는 코드로 대체한다.
- 어댑티(Adaptee)
  - 새로운 기능을 제공하는 클래스다.
  - 어댑터는 어댑티를 상속(Inheritance)받거나, 어댑티에게 기능을 위임(Delegating)한다.

<div align="center">
  <img src="/images/posts/2022/adapter-pattern-01.png" width="80%" class="image__border">
</div>
<center>https://yaboong.github.io/design-pattern/2018/10/15/adapter-pattern/</center>

## 2. Use adapter pattern

패턴에 대한 이해도를 높이고자 간단한 예시 코드를 작성했다. 어댑터 패턴을 적용하기 위한 시나리오는 다음과 같다.

- 현재 사용자 세션 정보를 데이터베이스에 저장하고 있다.
- 속도 개선을 위해 레디스(Redis) 같은 캐시 서비스를 사용하고 싶다.
- 운영하는 세션 관리 코드를 큰 변경 없이 새로운 기능으로 대체하고 싶다.

다음과 같은 클래스들을 구현한다.

- SessionHandler 클래스
  - 어댑터 패턴에서 클라이언트 클래스 역할을 수행한다.
  - 애플리케이션은 SessionHandler 객체를 통해 사용자 세션 정보를 저장, 획득, 삭제한다.
- SessionRegistry 인터페이스
  - 어댑터 패턴에서 대상 인터페이스 역할을 수행한다.
  - SessionHandler 객체는 SessionRegistry 인스턴스를 통해 세션 정보를 저장, 획득, 삭제한다.
- JdbcSessionRegistry 클래스
  - 어댑터 패턴에서 레거시 기능을 제공하는 클래스다.
  - SessionRegistry 인터페이스를 구현하며, 데이터베이스에 세션 정보를 저장, 획득, 삭제한다.

<div align="center">
  <img src="/images/posts/2022/adapter-pattern-02.png" width="80%" class="image__border">
</div>

### 2.1. Legacy codes

기존 레거시 코드를 살펴보자. 먼저 어댑터 패턴에서 클라이언트 역할을 수행하는 SessionHandler 클래스를 살펴본다.

- getSession 메서드 
  - SessionRegistry 구현체를 이용하여 세션 아이디(sessionId)에 해당하는 세션 정보를 가져온다.
  - 세션 정보가 없다면 예외를 발생시킨다.
- putSession 메서드
  - SessionRegistry 구현체를 이용하여 세션 아이디에 매칭되는 세션 정보를 입력한다.
  - 처리 시 예외가 발생하면 이를 감싸서 위로 던진다.
- deleteSession 메서드
  - SessionRegistry 구현체를 이용하여 세션 아이디에 해당하는 세션 정보를 삭제한다.
  - 처리 시 예외가 발생하면 이를 감싸서 위로 던진다.
     
```java
package action.in.blog;

public class SessionHandler {

    private final SessionRegistry sessionRegistry;

    public SessionHandler(SessionRegistry sessionRegistry) {
        this.sessionRegistry = sessionRegistry;
    }

    public Object getSession(String sessionId) {
        Object session = sessionRegistry.getSession(sessionId);
        if (session == null) {
            throw new RuntimeException("session does not exist");
        }
        return session;
    }

    public void putSession(String sessionId, Object session) {
        try {
            sessionRegistry.putSession(sessionId, session);
        } catch (RuntimeException re) {
            new RuntimeException("error when putting session", re);
        }
    }

    public void deleteSession(String sessionId) {
        try {
            sessionRegistry.deleteSession(sessionId);
        } catch (RuntimeException re) {
            new RuntimeException("error when deleting session", re);
        }
    }
}
```

다음으로 어댑터 패턴에서 대상 인터페이스 역할을 수행하는 SessionRegistry 인터페이스 코드를 확인해보자. 세션 레지스트리로서 세션을 저장, 삭제, 조회하는 기능을 제공한다.

```java
package action.in.blog;

public interface SessionRegistry {

    Object getSession(String sessionId);

    void putSession(String sessionId, Object session);

    void deleteSession(String sessionId);
}
```

지금부터 구현체를 SessionRegistry 인터페이스의 구현체 클래스를 살펴본다. 먼저 JDBC를 사용하는 JdbcSessionRegistry 클래스부터 살펴본다. 실제 쿼리를 수행하지 않고 로그로 기능을 표현했다. 기존에 사용하는 레거시 코드로 SessionRegistry 인터페이스의 기능을 구현하고 있다.

```java
package action.in.blog;

public class JdbcSessionRegistry implements SessionRegistry {

    @Override
    public Object getSession(String sessionId) {
        System.out.println("select s from tb_session s where session_id = " + sessionId);
        return new Object();
    }

    @Override
    public void putSession(String sessionId, Object session) {
        System.out.println(
                " insert into tb_session " +
                "   (session_id, session) " +
                " values " +
                "   (" + sessionId + ", " + session + " )" +
                " on duplicate key update " +
                "   session=" + session
        );
    }

    @Override
    public void deleteSession(String sessionId) {
        System.out.println("delete from tb_session s where session_id = " + sessionId);
    }
}
```

다음은 레디스(redis)를 사용하는 RedisSessionClient 클래스다. 어댑터 패턴에서 어댑티(Adaptee) 역할이다. 레디스를 이용한 세션 관리 기능을 제공한다. 마찬가지로 실제 기능 대신 로그로 기능을 표현했다. 타 부서에서 클래스 같은 라이브러리 형태로 제공받은 기능이라고 생각하면 이해하는 데 도움이 된다. 클래스로 받았으므로 개발자가 직접 수정이 불가능하다.

```java
package action.in.blog;

public class RedisSessionClient {

    public Object get(String sessionId) {
        System.out.println("find session by session_id(" + sessionId + ") from redis");
        return new Object();
    }

    public void post(String sessionId, Object session) {
        System.out.println("post session info(" +
                session +
                ") with session_id(" +
                sessionId +
                ") into redis");
    }

    public void delete(String sessionId) {
        System.out.println("delete session by session_id(" + sessionId + ") from redis");
    }
}
```

### 2.2. Make adapter class

기존 레지스트리를 사용하는 코드를 레디스 클라이언트를 사용할 수 있도록 확장한다. 중간 어댑터 클래스가 우리가 일상 생활에 사용하는 콘센트 어댑터처럼 중간 변환 작업을 수행해 준다. 세션 핸들러 쪽에선 여전히 세션 레지스트리를 사용하는 것처럼 보이지만, 실제 내부에선 기존과 전혀 다른 메커니즘으로 세션 관리가 수행된다. 

#### 2.2.1. Adapter pattern through class inheritance

클래스 상속을 통해 어댑터 패턴을 구현한다.

- 어댑티 클래스를 부모 클래스로 상속받는다.
- 대상 인터페이스를 구현한다.
- 대상 인터페이스 내부 기능을 부모 클래스의 기능으로 대체한다. 

```java
package action.in.blog.inheritance;

import action.in.blog.RedisSessionClient;
import action.in.blog.SessionRegistry;

public class ClientRegistryAdapter extends RedisSessionClient implements SessionRegistry {

    @Override
    public Object getSession(String sessionId) {
        return super.get(sessionId);
    }

    @Override
    public void putSession(String sessionId, Object session) {
        super.post(sessionId, session);
    }

    @Override
    public void deleteSession(String sessionId) {
        super.delete(sessionId);
    }
}
```

SessionHandler 클래스를 생성하는 코드만 변경한다. JdbcSessionRegistry 객체 대신에 ClientRegistryAdapter 인스턴스를 주입한다. SessionHandler 클래스, SessionRegistry 인터페이스, JdbcSessionRegistry 클래스 같은 레거시 코드들에 대한 변경은 없다. 

```java
package action.in.blog.inheritance;

import action.in.blog.SessionHandler;

public class InheritanceUsage {

    public static void main(String[] args) {

        // legacy
        // SessionHandler sessionHandler = new SessionHandler(new JdbcSessionRegistry());

        // new
        ClientRegistryAdapter adapter = new ClientRegistryAdapter();
        SessionHandler sessionHandler = new SessionHandler(adapter);

        sessionHandler.getSession("J12345");
    }
}
```

클래스 다이어그램으로 현재 상황을 표현하면 다음과 같다.

<div align="center">
  <img src="/images/posts/2022/adapter-pattern-03.png" width="100%" class="image__border">
</div>

#### 2.2.2. Adapter pattern through instance delegating

객체 위임을 통해 어댑터 패턴을 구현한다.

```java
package action.in.blog.delegate;

import action.in.blog.RedisSessionClient;
import action.in.blog.SessionRegistry;

public class ClientRegistryAdapter implements SessionRegistry {

    private final RedisSessionClient redisSessionClient;

    public ClientRegistryAdapter(RedisSessionClient redisSessionClient) {
        this.redisSessionClient = redisSessionClient;
    }

    @Override
    public Object getSession(String sessionId) {
        return redisSessionClient.get(sessionId);
    }

    @Override
    public void putSession(String sessionId, Object session) {
        redisSessionClient.post(sessionId, session);
    }

    @Override
    public void deleteSession(String sessionId) {
        redisSessionClient.delete(sessionId);
    }
}
```

SessionHandler 클래스를 생성하는 코드만 변경한다. 

- ClientRegistryAdapter에게 RedisSessionClient 인스턴스를 전달한다.
- JdbcSessionRegistry 대신 ClientRegistryAdapter 인스턴스를 전달한다.

상속을 통한 어댑터 패턴과 마찬가지로 SessionHandler 클래스, SessionRegistry 인터페이스, JdbcSessionRegistry 클래스 같은 레거시 코드들에 대한 변경은 없다. 

```java
package action.in.blog.delegate;

import action.in.blog.RedisSessionClient;
import action.in.blog.SessionHandler;

public class DelegateUsage {

    public static void main(String[] args) {

        // legacy
        // SessionHandler sessionHandler = new SessionHandler(new JdbcSessionRegistry());

        // new
        RedisSessionClient adaptee = new RedisSessionClient();
        ClientRegistryAdapter adapter = new ClientRegistryAdapter(adaptee);
        SessionHandler sessionHandler = new SessionHandler(adapter);

        sessionHandler.getSession("J12345");
    }
}
```

클래스 다이어그램으로 현재 상황을 표현하면 다음과 같다.

<div align="center">
  <img src="/images/posts/2022/adapter-pattern-04.png" width="100%" class="image__border">
</div>

## 3. Adapter pattern in Spring

스프링 프레임워크(spring framework)에서 어댑터 패턴이 적용된 케이스를 찾아보았다. 먼저 GsonBuilderUtils 클래스를 살펴보자. 클래스 내부에 Base64TypeAdapter 클래스를 만들고 이 객체를 사용한다.

- 클라이언트는 Gson 클래스다.
  - GsonBuilder 클래스는 Gson 객체를 만들 때 바이트 배열 (역)직렬화를 위한 어댑터를 주입할 것으로 예상된다.
  - Gson 객체는 어댑터 클래스를 이용해 바이트 배열 자료형에 대한 (역)직렬화 처리를 수행한다.
- 대상 인터페이스는 JsonSerializer 인터페이스다.
  - serialize 기능과 deserialize 기능을 새로운 기능으로 변경한다.
- 어댑티 클래스는 Base64Utils 클래스다.
  - 바이트 배열을 인코딩된 문자열로 변경한다.
  - 인코딩된 문자열을 바이트 배열로 변경한다.
- 어댑터 클래스는 Base64TypeAdapter 클래스다.
  - 바이트 배열에 대한 JSON 직렬화, 역직렬화 기능을 새롭게 변경한다. 
  - Base64Utils 클래스에게 직렬화, 역직렬화 일을 위임한다.

```java
package org.springframework.http.converter.json;

// import classes

public abstract class GsonBuilderUtils {

    public GsonBuilderUtils() {
    }

    public static GsonBuilder gsonBuilderWithBase64EncodedByteArrays() {
        GsonBuilder builder = new GsonBuilder();
        builder.registerTypeHierarchyAdapter(byte[].class, new GsonBuilderUtils.Base64TypeAdapter());
        return builder;
    }

    private static class Base64TypeAdapter implements JsonSerializer<byte[]>, Base64TypeAdapter<byte[]> {
        private Base64TypeAdapter() {
        }

        public JsonElement serialize(byte[] src, Type typeOfSrc, JsonSerializationContext context) {
            return new JsonPrimitive(Base64Utils.encodeToString(src));
        }

        public byte[] deserialize(JsonElement json, Type type, JsonDeserializationContext cxt) {
            return Base64Utils.decodeFromString(json.getAsString());
        }
    }
}
```

다음은 RsaKeyConversionServicePostProcessor 클래스를 살펴보자. 내부적으로 두 개의 어댑터가 사용된다.

- ResourceKeyConverterAdapter 클래스
  - 클라이언트는 프레임워크 내부에서 convert 메서드를 호출하는 클래스다.
  - 대상 인터페이스는 Converter 인터페이스이며, convert 기능을 새로운 기능으로 변경한다.
  - 어댑티는 Converter 인스턴스다. 
- ConverterPropertyEditorAdapter 클래스
  - 클라이언트는 프레임워크 내부에서 getAsText, setAsText 메서드를 호출하는 클래스다.
  - 대상은 PropertyEditorSupport 클래스이며, getAsText, setAsText 기능을 새로운 기능으로 변경한다.
  - 어댑티는 ResourceKeyConverterAdapter 인스턴스다.

```java
package org.springframework.security.config.crypto;

// import classes

public class RsaKeyConversionServicePostProcessor implements BeanFactoryPostProcessor {

    private static final String CONVERSION_SERVICE_BEAN_NAME = "conversionService";
    private RsaKeyConversionServicePostProcessor.ResourceKeyConverterAdapter<RSAPublicKey> x509 = new RsaKeyConversionServicePostProcessor.ResourceKeyConverterAdapter(RsaKeyConverters.x509());
    private RsaKeyConversionServicePostProcessor.ResourceKeyConverterAdapter<RSAPrivateKey> pkcs8 = new RsaKeyConversionServicePostProcessor.ResourceKeyConverterAdapter(RsaKeyConverters.pkcs8());

    public RsaKeyConversionServicePostProcessor() {
    }

    public void setResourceLoader(ResourceLoader resourceLoader) {
        Assert.notNull(resourceLoader, "resourceLoader cannot be null");
        this.x509.setResourceLoader(resourceLoader);
        this.pkcs8.setResourceLoader(resourceLoader);
    }

    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
        if (!this.hasUserDefinedConversionService(beanFactory)) {
            ConversionService service = beanFactory.getConversionService();
            if (service instanceof ConverterRegistry) {
                ConverterRegistry registry = (ConverterRegistry)service;
                registry.addConverter(String.class, RSAPrivateKey.class, this.pkcs8);
                registry.addConverter(String.class, RSAPublicKey.class, this.x509);
            } else {
                beanFactory.addPropertyEditorRegistrar((registryx) -> {
                    registryx.registerCustomEditor(RSAPublicKey.class, new RsaKeyConversionServicePostProcessor.ConverterPropertyEditorAdapter(this.x509));
                    registryx.registerCustomEditor(RSAPrivateKey.class, new RsaKeyConversionServicePostProcessor.ConverterPropertyEditorAdapter(this.pkcs8));
                });
            }

        }
    }

    private boolean hasUserDefinedConversionService(ConfigurableListableBeanFactory beanFactory) {
        return beanFactory.containsBean("conversionService") && beanFactory.isTypeMatch("conversionService", ConversionService.class);
    }

    static class ResourceKeyConverterAdapter<T extends Key> implements Converter<String, T> {
        private ResourceLoader resourceLoader = new DefaultResourceLoader();
        private final Converter<String, T> delegate;

        ResourceKeyConverterAdapter(Converter<InputStream, T> delegate) {
            this.delegate = this.pemInputStreamConverter().andThen(this.autoclose(delegate));
        }

        public T convert(String source) {
            return (Key)this.delegate.convert(source);
        }

        void setResourceLoader(ResourceLoader resourceLoader) {
            Assert.notNull(resourceLoader, "resourceLoader cannot be null");
            this.resourceLoader = resourceLoader;
        }

        private Converter<String, InputStream> pemInputStreamConverter() {
            return (source) -> {
                return source.startsWith("-----") ? this.toInputStream(source) : this.toInputStream(this.resourceLoader.getResource(source));
            };
        }

        private InputStream toInputStream(String raw) {
            return new ByteArrayInputStream(raw.getBytes(StandardCharsets.UTF_8));
        }

        private InputStream toInputStream(Resource resource) {
            try {
                return resource.getInputStream();
            } catch (IOException var3) {
                throw new UncheckedIOException(var3);
            }
        }

        private <T> Converter<InputStream, T> autoclose(Converter<InputStream, T> inputStreamKeyConverter) {
            return (inputStream) -> {
                try {
                    InputStream is = inputStream;
                    Object var3;
                    try {
                        var3 = inputStreamKeyConverter.convert(is);
                    } catch (Throwable var6) {
                        if (inputStream != null) {
                            try {
                                is.close();
                            } catch (Throwable var5) {
                                var6.addSuppressed(var5);
                            }
                        }
                        throw var6;
                    }
                    if (inputStream != null) {
                        inputStream.close();
                    }
                    return var3;
                } catch (IOException var7) {
                    throw new UncheckedIOException(var7);
                }
            };
        }
    }

    private static class ConverterPropertyEditorAdapter<T> extends PropertyEditorSupport {
        private final Converter<String, T> converter;

        ConverterPropertyEditorAdapter(Converter<String, T> converter) {
            this.converter = converter;
        }

        public String getAsText() {
            return null;
        }

        public void setAsText(String text) throws IllegalArgumentException {
            if (StringUtils.hasText(text)) {
                this.setValue(this.converter.convert(text));
            } else {
                this.setValue((Object)null);
            }
        }
    }
}
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-02-25-adapter-pattern>

#### REFERENCE

- [Design Patterns: Elements of Reusable Object Oriented Software][design-pattern-book-link]
- <https://stackoverflow.com/questions/1673841/examples-of-gof-design-patterns-in-javas-core-libraries/2707195#2707195>
- <https://zion830.tistory.com/44>
- <https://yaboong.github.io/design-pattern/2018/10/15/adapter-pattern/>

[design-pattern-book-link]: https://www.kyobobook.co.kr/product/detailViewKor.laf?mallGb=KOR&ejkGb=KOR&barcode=9791195444953