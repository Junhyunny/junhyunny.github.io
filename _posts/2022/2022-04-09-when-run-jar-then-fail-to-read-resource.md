---
title: "Reading resources error when running jar file applicaiton"
search: false
category:
  - java
  - spring-boot
last_modified_at: 2022-04-09T23:55:00
---

<br/>

## 1. Problem context

IDE(Integrated Development Environment) 환경에서 애플리케이션을 실행하면 리소스(resource) 파일을 정상적으로 읽을 수 있다. 빌드 결과물인 `jar` 패키징 파일을 실행하면 리소스 파일에 접근할 수 없는 현상이 있었다. jar 패키지 파일을 압축 해제 후 내부를 열어보면 필요한 리소스 파일을 정상적으로 찾을 수 있다.

- 클래스패스(classpath)에서 pokemons.json 파일을 찾을 수 있다.

```
~/Desktop/action-in-blog-0.0.1-SNAPSHOT % tree BOOT-INF
BOOT-INF
├── classes
│   ├── action
│   │   └── in
│   │       └── blog
│   │           ├── ActionInBlogApplication.class
│   │           ├── controller
│   │           │   └── PokeomonController.class
│   │           ├── domain
│   │           │   ├── PokemonResponse$Pokemon.class
│   │           │   └── PokemonResponse.class
│   │           └── proxy
│   │               ├── DefaultPokemonProxy.class
│   │               ├── LocalPokemonProxy.class
│   │               └── PokemonProxy.class
│   ├── application.yml
│   └── pokemons.json
├── classpath.idx
├── layers.idx
└── lib
    ├── jackson-annotations-2.13.2.jar
    ├── jackson-core-2.13.2.jar
    ├── jackson-databind-2.13.2.jar
    ├── jackson-datatype-jdk8-2.13.2.jar
    ├── jackson-datatype-jsr310-2.13.2.jar
    ├── jackson-module-parameter-names-2.13.2.jar
    ├── jakarta.annotation-api-1.3.5.jar
    ├── jul-to-slf4j-1.7.36.jar
    ├── log4j-api-2.17.2.jar
    ├── log4j-to-slf4j-2.17.2.jar
    ├── logback-classic-1.2.11.jar
    ├── logback-core-1.2.11.jar
    ├── lombok-1.18.22.jar
    ├── slf4j-api-1.7.36.jar
    ├── snakeyaml-1.29.jar
    ├── spring-aop-5.3.17.jar
    ├── spring-beans-5.3.17.jar
    ├── spring-boot-2.6.5.jar
    ├── spring-boot-autoconfigure-2.6.5.jar
    ├── spring-boot-jarmode-layertools-2.6.5.jar
    ├── spring-context-5.3.17.jar
    ├── spring-core-5.3.17.jar
    ├── spring-expression-5.3.17.jar
    ├── spring-jcl-5.3.17.jar
    ├── spring-web-5.3.17.jar
    ├── spring-webmvc-5.3.17.jar
    ├── tomcat-embed-core-9.0.60.jar
    ├── tomcat-embed-el-9.0.60.jar
    └── tomcat-embed-websocket-9.0.60.jar

8 directories, 40 files
```

리소스 파일을 읽을 때 코드는 다음과 같다.

1. 클래스로더(classloader)로 해당 리소스 파일의 경로를 조회한다.
2. 해당 경로의 파일을 FileReader 객체를 사용해 오픈(open)한다.
3. BufferedReader 객체로부터 리소스 파일의 문자열을 읽어 PokemonResponse 객체로 변환 후 반환한다.

```java
@RestController
public class PokeomonController {

    private final static ClassLoader classLoader = PokeomonController.class.getClassLoader();
    private final static ObjectMapper objectMapper = new ObjectMapper();

    private PokemonResponse getPokemonResponse(BufferedReader reader) throws IOException {
        StringBuilder buffer = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            buffer.append(line);
        }
        return objectMapper.readValue(
                buffer.toString(),
                PokemonResponse.class
        );
    }

    @GetMapping("/pokemons-fail")
    public PokemonResponse getPokemonsFail() {
        String filePath = Objects.requireNonNull(classLoader.getResource("pokemons.json")).getFile(); // 1
        try (
                FileReader fileReader = new FileReader(filePath); // 2
                BufferedReader reader = new BufferedReader(fileReader)
        ) {
            return getPokemonResponse(reader); // 3
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
```

## 2. Cause of the problem

jar 패키지 파일을 실행 후 pokemons.json 파일을 읽을 때 다음과 같은 에러가 발생한다.

- pokemons.json 파일 경로를 `jar` 패키지 내부에서 정상적으로 찾는다.
  - /action-in-blog/target/action-in-blog-0.0.1-SNAPSHOT.jar!/BOOT-INF/classes!/pokemons.json
- pokemons.json 파일을 `FileReader` 객체로 읽을 때 에러가 발생한다.
  - PokeomonController.getPokemonsFail(PokeomonController.java:33)

```
java.io.FileNotFoundException: file:/Users/junhyunkang/Desktop/workspace/blog/blog-in-action/2022-04-09-when-run-jar-then-fail-to-read-resource/action-in-blog/target/action-in-blog-0.0.1-SNAPSHOT.jar!/BOOT-INF/classes!/pokemons.json (No such file or directory)] with root cause

java.io.FileNotFoundException: file:/Users/junhyunkang/Desktop/workspace/blog/blog-in-action/2022-04-09-when-run-jar-then-fail-to-read-resource/action-in-blog/target/action-in-blog-0.0.1-SNAPSHOT.jar!/BOOT-INF/classes!/pokemons.json (No such file or directory)
        at java.base/java.io.FileInputStream.open0(Native Method) ~[na:na]
        at java.base/java.io.FileInputStream.open(FileInputStream.java:216) ~[na:na]
        at java.base/java.io.FileInputStream.<init>(FileInputStream.java:157) ~[na:na]
        at java.base/java.io.FileInputStream.<init>(FileInputStream.java:111) ~[na:na]
        at java.base/java.io.FileReader.<init>(FileReader.java:60) ~[na:na]
        at action.in.blog.controller.PokeomonController.getPokemonsFail(PokeomonController.java:33) ~[classes!/:0.0.1-SNAPSHOT]
        at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method) ~[na:na]
        at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77) ~[na:na]
...
```

잘 생각해보면 문제 원인이 명백하다. FileNotFoundException 예외가 발생한 이유는 파일이 없기 때문이다. pokemon.json 파일은 jar 패키지 파일 내부에 이진 데이터로 존재한다. 애플리케이션이 리소스를 읽을 때 경로가 jar 패키지 파일 내부의 클래스패스로 결정되기 때문에 이진 데이터를 파일로써 읽을 수 없는 것이 문제다.

## 3. Solve the problem

문제를 해결하려면 getResource 메소드가 아닌 `getResourceAsStream` 메소드를 사용해야 한다. getResourceAsStream 메소드는 리소스 파일을 읽을 수 있는 InputStream 객체를 반환한다. InputStream 객체를 사용해 패키지 내부 데이터를 읽는다.

1. 클래스로더(classloader)로 해당 리소스 파일을 읽을 수 있는 InputStream 객체를 생성한다.
2. InputStream 객체를 BufferedReader 객체에 주입한다.
3. BufferedReader 객체로부터 리소스 파일의 문자열을 읽어 PokemonResponse 객체로 변환 후 반환한다.

```java
@RestController
public class PokeomonController {

    private final static ClassLoader classLoader = PokeomonController.class.getClassLoader();
    private final static ObjectMapper objectMapper = new ObjectMapper();

    private PokemonResponse getPokemonResponse(BufferedReader reader) throws IOException {
        StringBuilder buffer = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            buffer.append(line);
        }
        return objectMapper.readValue(
                buffer.toString(),
                PokemonResponse.class
        );
    }

    ...

    @GetMapping("/pokemons-success")
    public PokemonResponse getPokemonsSuccess() {
        try (
                InputStream inputStream = classLoader.getResourceAsStream("pokemons.json"); // 1
                BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream)) // 2
        ) {
            return getPokemonResponse(reader); // 3
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
```

jar 패키지 파일로 애플리케이션을 실행 후 테스트 해보면 getResourceAsStream 메소드를 사용했을 때 정상적으로 응답하는 것을 확인할 수 있다.

- /pokemons-fail 경로
  - getResource 메소드를 사용해 얻은 경로를 파일로 오픈한다.
  - 에러가 발생한다.
- /pokemons-success 경로
  - getResourceAsStream 메소드를 사용해 얻은 InputStream 객체를 사용한다.
  - 정상적으로 응답한다.

<div align="center">
  <img src="/images/posts/2022/when-run-jar-then-fail-to-read-resource-01.gif" width="100%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-04-09-when-run-jar-then-fail-to-read-resource>

#### RECOMMEND NEXT POSTS

- [Problem to find images in spring boot application][cannot-find-static-resource-link]

[cannot-find-static-resource-link]: https://junhyunny.github.io/spring-boot/cannot-find-static-resource/