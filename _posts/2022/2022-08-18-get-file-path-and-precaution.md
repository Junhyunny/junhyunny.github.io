---
title: "Java 파일 경로 획득과 주의사항"
search: false
category:
  - java
last_modified_at: 2022-08-18T23:55:00
---

<br/>

## 0. 들어가면서

다른 업체에서 제공하는 암호화 라이브러리를 사용할 때 서버에서 정상적으로 필요한 설정 파일을 찾지 못하는 현상이 있었습니다. 
원인은 사소한 것으로 밝혀졌는데, 이와 관련하여 몇 가지 추가적인 내용들을 함께 정리하였습니다. 

## 1. 문제 상황 

> "로컬에서는 정상적으로 동작하는데, 서버에서 잘 동작하지 않아요." 

도움을 요청한 친구에게 그럴리가 없다면서 함께 확인했는데, 라이브러리의 설정 파일을 읽어오는 클래스 인스턴스가 정상적으로 생성되지 않는 것을 로그로 확인하였습니다. 현상은 다음과 같았습니다. 

### 1.1. 문제 발생 코드

문제가 된 코드를 일부 각색하였습니다.

* 클래스로부터 파일 경로를 탐색합니다.
* `getLocation` 메서드로부터 클래스의 경로를 추출합니다. 

```java
package action.in.blog.config;

import lombok.extern.log4j.Log4j2;

import java.io.File;

@Log4j2
public class FileConfig {

    private static final String webResourceDir = "/WEB-INF/";
    private static final String configPath = "WEB-INF/config/security.properties";

    private boolean isFile(String filePath) {
        return new File(filePath).isFile();
    }

    public String getConfigPath() {
        String filePath = null;
        String path = getClass().getProtectionDomain().getCodeSource().getLocation().getPath();
        int index = path.indexOf(webResourceDir);
        if (index > -1) {
            filePath = path.substring(0, index) + configPath;
            log.info(filePath);
        }
        if (filePath != null && isFile(filePath)) {
            return filePath;
        }
        return null;
    }
}
```

### 1.2. 실행 jar 만들기

실행 `jar`를 만들어서 코드를 실행해보겠습니다. 

#### 1.2.1. ActionInBlogApplication 클래스

* 프로그램 시작점인 main 메서드에서 `FileConfig` 클래스가 설정 파일 경로를 잘 획득하는지 출력합니다.

```java
package action.in.blog;

import action.in.blog.config.FileConfig;
import lombok.extern.log4j.Log4j2;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@Log4j2
public class ActionInBlogApplication {

    public static void main(String[] args) {
        FileConfig fileConfig = new FileConfig();
        log.info(fileConfig.getConfigPath());
    }
}
```

#### 1.2.2. 실행 jar 빌드

* mvn package 명령어를 실행합니다. 

```
$ mvn package
[INFO] Scanning for projects...
[INFO] 
[INFO] -------------------< action.in.blog:action-in-blog >--------------------
[INFO] Building action-in-blog 0.0.1-SNAPSHOT
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] 
[INFO] --- maven-resources-plugin:3.2.0:resources (default-resources) @ action-in-blog ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Using 'UTF-8' encoding to copy filtered properties files.
[INFO] Copying 1 resource
[INFO] Copying 0 resource
[INFO] 
[INFO] --- maven-compiler-plugin:3.8.1:compile (default-compile) @ action-in-blog ---
[INFO] Nothing to compile - all classes are up to date
[INFO] 
[INFO] --- maven-resources-plugin:3.2.0:testResources (default-testResources) @ action-in-blog ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Using 'UTF-8' encoding to copy filtered properties files.
[INFO] skip non existing resourceDirectory /Users/junhyunk/Desktop/workspace/blog/blog-in-action/2022-08-18-precaution-to-get-file-path/action-in-blog bad/src/test/resources
[INFO] 
[INFO] --- maven-compiler-plugin:3.8.1:testCompile (default-testCompile) @ action-in-blog ---
[INFO] Changes detected - recompiling the module!
[INFO] Compiling 1 source file to /Users/junhyunk/Desktop/workspace/blog/blog-in-action/2022-08-18-precaution-to-get-file-path/action-in-blog bad/target/test-classes
[INFO] 
[INFO] --- maven-surefire-plugin:2.22.2:test (default-test) @ action-in-blog ---
[INFO] 
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 0, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] 
[INFO] --- maven-jar-plugin:3.2.2:jar (default-jar) @ action-in-blog ---
[INFO] 
[INFO] --- spring-boot-maven-plugin:2.6.5:repackage (repackage) @ action-in-blog ---
[INFO] Replacing main artifact with repackaged archive
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  2.682 s
[INFO] Finished at: 2022-08-18T20:16:41+09:00
[INFO] ------------------------------------------------------------------------
```

### 1.3. 출력 로그 확인

* 빌드에 성공한 실행 jar 파일을 프로젝트 `/src/main/webapp/WEB-INF/libs`로 이동시킵니다. 
* 해당 경로로 이동합니다.
* `action-in-blog-0.0.1-SNAPSHOT.jar` 파일을 실행하면 다음과 같은 로그를 확인할 수 있습니다.
    * `FileConfig` 클래스 내부에서 파일 경로를 정확이 찾은 것을 확인할 수 있습니다.
    * `ActionInBlogApplication` 클래스에 반환한 경로는 `null` 입니다.
* `/src/main/webapp/WEB-INF/config` 경로를 확인해보면 `security.properties` 파일이 존재합니다.

```
$ mv target/action-in-blog-0.0.1-SNAPSHOT.jar src/main/webapp/WEB-INF/libs

$ cd src/main/webapp/WEB-INF/libs

$ java -jar action-in-blog-0.0.1-SNAPSHOT.jar
20:24:42.173 [main] INFO action.in.blog.config.FileConfig - file:/Users/junhyunk/Desktop/workspace/blog/blog-in-action/2022-08-18-precaution-to-get-file-path/action-in-blog%20bad/src/main/webapp/WEB-INF/config/security.properties
20:24:42.175 [main] INFO action.in.blog.ActionInBlogApplication - null

$ cd ../config

$ ls
security.properties
```

## 2. 문제 원인

현상을 살펴보았으니 문제 원인을 알아보겠습니다. 
`FileConfig` 클래스에서 출력하는 로그에 파일 경로를 살펴보면 이상한 부분이 있습니다. 

* 파일 경로에 공백이 `%20` 값으로 인코딩되어 출력됩니다.
* 인코딩 된 공백으로 인해 `File` 클래스의 `isFile` 메서드가 정상적인 파일 탐색에 실패합니다.

```
20:24:42.173 [main] INFO action.in.blog.config.FileConfig - file:/Users/junhyunk/Desktop/workspace/blog/blog-in-action/2022-08-18-precaution-to-get-file-path/action-in-blog%20bad/src/main/webapp/WEB-INF/config/security.properties
```

### 2.1. URL 클래스

공백이 `%20` 값으로 출력된 이유는 URL 클래스로부터 경로를 획득했기 때문입니다. 

##### CodeSource 클래스 getLocation 메서드

* `getLocation` 메서드를 살펴보면 URL 객체를 반환합니다.
* URL 객체로부터 경로를 획득할 시 인코딩 된 경로가 반환됩니다. 

```java
    public final URL getLocation() {
        /* since URL is practically immutable, returning itself is not
           a security problem */
        return this.location;
    }
```

## 3. 문제 해결 방법

해당 클래스는 라이브러리 형태로 제공되었고, 코드를 확장할 수 없도록 `private` 키워드가 붙어 있었기 때문에 결국 톰캣 컨테이너 위치를 `C:/Program Files`에서 `C:/`로 옮겼습니다. 
만약 코드를 고칠 수 있었다면 어떤 방법들이 있었을지 찾아서 정리하였습니다. 

### 3.1. FindFilePathTests 클래스

* `Paths` 클래스를 사용합니다.
    * `get` 메서드에 빈 문자열("")을 전달하면 현재 경로를 획득합니다.
    * `toAbsolutePath` 메서드를 통해 절대 경로를 획득합니다.
* `System` 클래스
    * 시스템 속성을 얻을 수 있는 `getProperty` 메서드를 사용합니다.
    * `user.dir` 키 값으로 현대 작업 중인 경로를 얻을 수 있습니다.
* `FileSystems` 클래스 `getDefault` 메서드
    * `getPath` 메서드에 빈 문자열을 전달하면 현재 경로를 획득합니다.
    * `toAbsolutePath` 메서드를 통해 절대 경로를 획득합니다.
* `File` 클래스
    * 빈 문자열을 전달하여 `File` 객체를 생성합니다.
    * `getAbsolutePath` 메서드를 통해 절대 경로를 획득합니다.

```java
package action.in.blog.domain;

import org.junit.jupiter.api.Test;

import java.io.File;
import java.nio.file.FileSystems;
import java.nio.file.Paths;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.core.IsEqual.equalTo;

public class FindFilePathTests {

    String result = "/Users/junhyunk/Desktop/workspace/blog/blog-in-action/2022-08-18-precaution-to-get-file-path/action-in-blog bad";

    @Test
    public void find_path_using_paths_class() {
        String projectPath = Paths.get("").toAbsolutePath().toString();
        assertThat(projectPath, equalTo(result));
    }

    @Test
    public void find_path_using_system_property_method() {
        String projectPath = System.getProperty("user.dir");
        assertThat(projectPath, equalTo(result));
    }

    @Test
    public void find_path_using_file_systems_class() {
        String projectPath = FileSystems.getDefault().getPath("").toAbsolutePath().toString();
        assertThat(projectPath, equalTo(result));
    }
    
    @Test
    public void find_path_using_file_class() {
        String projectPath = new File("").getAbsolutePath();
        assertThat(projectPath, equalTo(result));
    }
}
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-08-18-precaution-to-get-file-path>

#### REFERENCE

* <https://www.educative.io/answers/different-ways-to-get-the-current-working-directory-in-java>
* <https://www.delftstack.com/ko/howto/java/how-to-get-the-current-working-directory-in-java/>