---
title: "Adapter Pattern"
search: false
category:
  - information
  - design-pattern
last_modified_at: 2022-02-26T23:55:00
---

<br>

## 0. 들어가면서

스프링 프레임워크를 사용하다보면 `Adapter`라는 단어로 끝나는 단어들이 많이 보입니다. 
어렴풋이 어댑터 패턴(adapter pattern)이 적용되었을 것이라 생각했지만, 왜 어댑터 패턴을 사용하는지 깊게 고민해보진 않았습니다. 
최근 포스트를 작성하기 위해 스프링 내부를 들여다보면서 다양한 어댑터들을 발견했습니다. 
디자인 패턴의 구체적인 용도를 알고 코드를 분석하면 더 많은 인사이트(insight)를 얻을 수 있을 것이라는 생각이 들어서 포스트로 정리하였습니다. 

## 1. 어댑터 패턴(Adapter Pattern)

> Design Patterns: Elements of Reusable Object Oriented Software<br>
> 클래스의 인터페이스를 사용자가 기대하는 인터페이스 형태로 적응(변환)시킵니다. 
> 서로 일치하지 않는 인터페이스를 갖는 클래스들을 함께 동작시킵니다. 

`GoF 디자인 패턴` 책을 읽다보면 위에 설명처럼 이해하기 난해한 문장이 많습니다. 
다른 분들은 이해하셨을지 모르겠지만, 저에겐 다소 어려운 느낌입니다. 
`GoF 디자인 패턴` 책과 다른 레퍼런스(reference)들을 읽어 보고 얻은 인사이트로 제가 이해할 수 있도록 리워딩(rewording)해보았습니다. 
- 기존 클래스를 대신하는 다른 기능의 클래스로 변경하는 디자인 패턴입니다. 
- 어댑터 패턴은 인터페이스를 통한 다형성(polymorphism)을 이용한 패턴입니다.
- 어댑터 패턴은 두 가지 방법을 통해 운영 중인 코드를 최소한의 부담으로 변경할 수 있도록 도움을 줍니다.
    - 새로운 기능을 제공하는 클래스를 상속하여 인터페이스 구현 메소드 내부에서 부모의 메소드 호출
    - 새로운 기능을 제공하는 인스턴스에게 일을 위임하여 인터페이스 구현 메소드 내부에서 인스턴스 메소드 호출

##### 어댑터 패턴 클래스 다이어그램
- 어댑터 패턴을 이해하기 위해선 패턴을 이루는 몇 가지 요소들에 대해 이해할 필요가 있습니다. 
- 클라이언트(Client) 
    - 어댑터를 사용하는 주체입니다. 
    - 대상 인터페이스를 사용하고 있습니다.
    - 클라이언트 입장에선 인터페이스라는 껍데기만 바라보고 사용하기 때문에 코드에 변경이 없습니다.
- 대상 인터페이스(Target Interface) 
    - 변경될 기능을 명세하고 있는 인터페이스입니다.
    - 클라이언트는 대상 인터페이
- 어댑터(Adapter)
    - 대상 인터페이스를 구현하는 클래스입니다.
    - 오버라이드(override) 한 메소드 내부를 신규 기능을 제공하는 코드로 대체합니다.
- 어댑티(Adaptee)
    - 새로운 기능을 제공하는 클래스입니다.
    - 어댑터는 어댑티를 상속받거나, 어댑티에게 기능을 위임합니다.

<p align="center">
    <img src="/images/adapter-pattern-01.JPG" width="80%" class="image__border">
</p>
<center>https://yaboong.github.io/design-pattern/2018/10/15/adapter-pattern/</center>

### 1.1. Client 클래스
- `TargetInterface` 인터페이스를 사용하는 클래스입니다.
- 인터페이스를 통해 `doThing` 기능을 제공 받습니다.
- `doThing` 메소드 내부가 어떻게 바뀌는지 클라이언트는 관심이 없습니다.

```java
public class Client {

    private final TargetInterface targetInterface;

    public Client(TargetInterface targetInterface) {
        this.targetInterface = targetInterface;
    }

    public void requestSomething() {
        targetInterface.doThing();
    }
}
```

### 1.2. TargetInterface 인터페이스
- `Client` 인스턴스에게 `doThing` 기능을 제공합니다.

```java
public interface TargetInterface {

    void doThing();
}
```

### 1.3. Adaptee 클래스
- 신규 기능을 제공하는 클래스입니다.
- 서드 파티(third party) 라이브러리의 클래스이거나 신규 비즈니스를 위해 만든 클래스일 수 있습니다.

```java
public class Adaptee {

    public void doNewThing() {
        System.out.println("do new thing");
    }
}
```

### 1.4. OldTargetImplementation 클래스
- 현재 운영 중인 코드에서 사용 중인 클래스입니다.
- 이 클래스가 제공하는 기능을 `Adaptee` 클래스가 제공하는 신규 기능으로 대체합니다.

```java
public class OldTargetImplementation implements TargetInterface {

    @Override
    public void doThing() {
        System.out.println("do old thing");
    }
}
```

### 1.5. 클래스 상속 어댑터 패턴

상속을 통해 문제를 해결합니다. 

#### 1.5.1. Adapter 클래스
- `TargetInterface` 인터페이스를 구현합니다.
- `Adaptee` 클래스를 상속합니다.
- `TargetInterface` 인터페이스에서 오버라이드 한 기능을 부모 클래스의 기능으로 변경합니다.

```java
public class Adapter extends Adaptee implements TargetInterface {

    @Override
    public void doThing() {
        // do new thing by using method from super class
        super.doNewThing();
    }
}
```

#### 1.5.2. 사용 방법
- 클라이언트 인스턴스에 이전 클래스 대신 새로운 어댑터 인스턴스를 전달합니다. 

```java
public class InheritanceUsage {

    public static void main(String[] args) {
        // Client client = new Client(new OldTargetImplementation());
        Client client = new Client(new Adapter());
        client.requestSomething();
    }
}
```

##### 클래스 상속 어댑터 패턴 클래스 다이어그램

<p align="center">
    <img src="/images/adapter-pattern-02.JPG" width="80%" class="image__border">
</p>

### 1.6. 인스턴스 어댑터 패턴

위임(delegating)을 통해 문제를 해결합니다. 

#### 1.5.1. Adapter 클래스
- `TargetInterface` 인터페이스를 구현합니다.
- `Adaptee` 클래스를 전달받습니다.
- 오버라이드 한 메소드 내부에서 `Adaptee` 인스턴스에게 일을 위임합니다.

```java
public class Adapter implements TargetInterface {

    private final Adaptee adaptee;

    public Adapter(Adaptee adaptee) {
        this.adaptee = adaptee;
    }

    @Override
    public void doThing() {
        // delegate doing new thing to adaptee
        adaptee.doNewThing();
    }
}
```

#### 1.5.2. 사용 방법
- 어댑터 인스턴스에게 어댑티 인스턴스를 전달합니다.
- 클라이언트 인스턴스에 이전 클래스 대신 새로운 어댑터 인스턴스를 전달합니다. 

```java
public class DelegateUsage {

    public static void main(String[] args) {
        // Client client = new Client(new OldTargetImplementation());
        Adapter adapter = new Adapter(new Adaptee());
        Client client = new Client(adapter);
        client.requestSomething();
    }
}
```

##### 인스턴스 어댑터 패턴 클래스 다이어그램

<p align="center">
    <img src="/images/adapter-pattern-03.JPG" width="80%" class="image__border">
</p>

## 2. Adapter pattern in Spring

`Spring` 프레임워크에서 어댑터 패턴이 적용된 케이스를 찾아보았습니다. 

### 2.1. GsonBuilderUtils 클래스
- 클래스 내부에 `Base64TypeAdapter`가 존재합니다.
- 클라이언트는 `GsonBuilder` 클래스입니다.
    - `GsonBuilder` 클래스는 `Gson` 객체를 만들 때 바이트 배열 (역)직렬화를 위한 어댑터를 주입할 것으로 예상됩니다.
    - `Gson` 객체는 어댑터 클래스를 이용해 특정 자료형에 대한 직렬화, 역직렬화 기능을 처리합니다.
- 대상 인터페이스는 `JsonSerializer` 입니다.
    - `serialize` 기능과 `deserialize` 기능을 새로운 기능으로 변경합니다.
- 어댑티 클래스는 `Base64Utils` 입니다.
    - 바이트 배열을 인코딩 된 문자열로 변경합니다.
    - 인코딩 된 문자열을 바이트 배열로 변경합니다.
- 어댑터 클래스는 `Base64TypeAdapter` 클래스입니다.
    - 바이트 배열에 대한 `Json` 직렬화, 역직렬화 기능을 새롭게 변경합니다. 
    - `Base64Utils` 클래스에게 직렬화, 역질렬화 일을 위임합니다.

```java
package org.springframework.http.converter.json;

import com.google.gson.GsonBuilder;
import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonPrimitive;
import com.google.gson.JsonSerializationContext;
import com.google.gson.JsonSerializer;
import java.lang.reflect.Type;
import org.springframework.util.Base64Utils;

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

### 2.2. RsaKeyConversionServicePostProcessor 클래스
- 내부적으로 두 개의 어댑터가 사용됩니다.
- `ResourceKeyConverterAdapter` 클래스
    - 클라이언트는 `ConverterRegistry` 클래스이며, 이 곳에 등록되어 프레임워크 내부에서 사용될 것으로 예상됩니다.
    - 대상 인터페이스는 `Converter`이며, `convert` 기능을 새로운 기능으로 변경합니다.
    - 어댑티는 `this.pemInputStreamConverter().andThen(this.autoclose(delegate));` 메소드 호출을 통해 만들어진 `Converter` 인스턴스입니다.
- `ConverterPropertyEditorAdapter` 클래스
    - 클라이언트는 `PropertyEditorRegistrar` 클래스이며, 이 곳에 등록되어 프레임워크 내부에서 사용될 것으로 예상됩니다.
    - 대상은 `PropertyEditorSupport` 클래스이며, `getAsText`과 `setAsText` 기능을 새로운 기능으로 변경합니다.
    - 어댑티는 `ResourceKeyConverterAdapter` 어댑터 인스턴스입니다.

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
- <https://zion830.tistory.com/44>
- <https://yaboong.github.io/design-pattern/2018/10/15/adapter-pattern/>

[design-pattern-book-link]: https://www.kyobobook.co.kr/product/detailViewKor.laf?mallGb=KOR&ejkGb=KOR&barcode=9791195444953