---
title: "Reading resources error when running jar file applicaiton"
search: false
category:
  - java
  - spring-boot
last_modified_at: 2022-04-09T23:55:00
---

<br/>

## 1. 문제 현상

IDE(Integrated Development Environment)에서 실행 시 리소스(resource) 파일이 정상적으로 읽히는데, 
`jar` 패키지 파일을 실행하면 리소스 파일에 접근이 안되는 현상이 있었습니다. 

##### action-in-blog-0.0.1-SNAPSHOT.jar 패키지 내부 BOOT-INF 경로
- 문제가 되는 `jar` 패키지 파일의 압축을 풀어보면 사용하고 싶은 해당 리소스 파일은 존재합니다. 
- 사용하고 싶은 `pokemons.json` 파일은 함께 패키징되어 있습니다. 

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

## 2. 문제 원인

우선 문제가 되는 코드와 에러 로그를 살펴보겠습니다. 

##### 문제 코드
- 클래스 로더(class loader)로부터 리소스 경로를 획득합니다.
- 획득한 파일 경로를 이용하여 파일을 읽어들일 수 있는 `FileReader` 객체를 만듭니다.
- `FileReader` 객체를 `BufferedReader` 객체에 전달합니다.
- 읽은 리소스 파일을 문자열로 변경한 후 반환하려는 `PokemonResponse` 객체로 변경합니다.

```java
    private final ObjectMapper objectMapper = new ObjectMapper();

    private PokemonResponse getPokemonResponse(BufferedReader reader) throws IOException {
        StringBuffer buffer = new StringBuffer();
        String line;
        while ((line = reader.readLine()) != null) {
            buffer.append(line);
        }
        return objectMapper.readValue(buffer.toString(), PokemonResponse.class);
    }

    @GetMapping("/pokemons-fail")
    public PokemonResponse getPokemonsFail() {
        String filePath = this.getClass().getClassLoader().getResource("pokemons.json").getFile();
        try (
                FileReader fileReader = new FileReader(filePath);
                BufferedReader reader = new BufferedReader(fileReader)
        ) {
            return getPokemonResponse(reader);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
```

##### 에러 로그
- 원하는 리소스 파일의 경로는 `jar` 패키지 내부에서 정상적으로 찾습니다.
    - `file:/Users/junhyunk/Desktop/action-in-blog-0.0.1-SNAPSHOT.jar!/BOOT-INF/classes!/pokemons.json`
- 리소스 파일을 `FileReader` 객체로 읽으려는 코드에서 에러가 발생합니다.
    - `FileInputStream.open(FileInputStream.java:219)`

```
2022-04-09 11:44:03.761 ERROR 71726 --- [nio-8080-exec-1] o.a.c.c.C.[.[.[/].[dispatcherServlet]    : Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Request processing failed; nested exception is java.lang.RuntimeException: java.io.FileNotFoundException: file:/Users/junhyunk/Desktop/action-in-blog-0.0.1-SNAPSHOT.jar!/BOOT-INF/classes!/pokemons.json (No such file or directory)] with root cause

java.io.FileNotFoundException: file:/Users/junhyunk/Desktop/action-in-blog-0.0.1-SNAPSHOT.jar!/BOOT-INF/classes!/pokemons.json (No such file or directory)
    at java.base/java.io.FileInputStream.open0(Native Method) ~[na:na]
    at java.base/java.io.FileInputStream.open(FileInputStream.java:219) ~[na:na]
    at java.base/java.io.FileInputStream.<init>(FileInputStream.java:157) ~[na:na]
    at java.base/java.io.FileInputStream.<init>(FileInputStream.java:112) ~[na:na]
    at java.base/java.io.FileReader.<init>(FileReader.java:60) ~[na:na]
    at action.in.blog.controller.PokeomonController.getPokemonsFail(PokeomonController.java:29) ~[classes!/:0.0.1-SNAPSHOT]
    at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method) ~[na:na]
    at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62) ~[na:na]
    at java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43) ~[na:na]
        ...
```

## 3. 문제 해결하기

> `FileNotFoundException` - 파일이 없습니다.

잘 생각해보면 문제 원인은 명확합니다. 
IDE로 어플리케이션을 실행하면 `pokemon.json` 리소스 파일이 프로젝트 패키지 경로에 존재하기 때문에 정상적으로 읽을 수 있습니다. 

`jar` 패키지 파일로 어플리케이션을 실행하면 해당 어플리케이션이 사용할 `pokemon.json` 리소스 파일은 실제로 존재하지 않습니다. 
어플리케이션이 리소스를 읽는 경로가 `jar` 패키지 내부로 잡히고, 
`pokemon.json` 리소스 파일은 `jar` 패키지 내부에 압축된 이진 데이터로 존재하기 때문입니다. 

이를 해결하기 위해 `getResource` 메소드가 아닌 `getResourceAsStream` 메소드를 사용합니다. 

##### 해결 코드
- `getResourceAsStream` 메소드를 이용해 패키지 내부 리소스 파일을 읽기 위한 `InputStream` 객체를 획득합니다. 
    - 파일 경로를 획득하여 파일을 여는 방식이 아닙니다.
    - 패키지 내부에 저장된 리소스를 읽을 수 있는 `InputStream` 객체를 획득하여 리소스 데이터를 읽습니다.

```java
    private final ObjectMapper objectMapper = new ObjectMapper();

    private PokemonResponse getPokemonResponse(BufferedReader reader) throws IOException {
        StringBuffer buffer = new StringBuffer();
        String line;
        while ((line = reader.readLine()) != null) {
            buffer.append(line);
        }
        return objectMapper.readValue(buffer.toString(), PokemonResponse.class);
    }

    @GetMapping("/pokemons-success")
    public PokemonResponse getPokemonsSuccess() {
        try (
                InputStream inputStream = this.getClass().getClassLoader().getResourceAsStream("pokemons.json");
                BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))
        ) {
            return getPokemonResponse(reader);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
```

##### 실행 로그 확인

<p align="center">
    <img src="/images/when-run-jar-then-fail-to-read-resource-1.gif" width="100%" class="image__border">
</p>


#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-04-09-when-run-jar-then-fail-to-read-resource>