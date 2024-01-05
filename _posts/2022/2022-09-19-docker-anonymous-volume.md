---
title: "Docker Anonymous Volume"
search: false
category:
  - docker
last_modified_at: 2022-09-19T23:55:00
---

<br/>

## 1. 데이터 영속성 문제

도커 컨테이너는 새로운 파일을 만들거나 변경하는 작업을 컨테이너 레이어(container layer)에서 수행합니다. 
컨테이너 레이어는 컨테이너가 실행될 때 매번 초기화되고, 종료될 때 함께 삭제되므로 컨테이너 레이어에서 수행된 작업들은 컨테이너의 라이프 사이클을 따라 함께 생성, 삭제됩니다. 

<p align="center">
    <img src="/images/docker-anonymous-volume-1.JPG" width="70%" class="image__border">
</p>
<center>https://docs.docker.com/storage/storagedriver/</center>

## 2. Docker Volume

도커 볼륨은 컨테이너에서 관리하는 데이터를 안전하게 영속화시키는 방법입니다. 
도커 엔진이 관리하는 영역에 데이터 저장 공간을 마련하여 컨테이너 라이프 사이클과 상관없이 데이터 영속성을 유지합니다. 
도커가 관리하는 영역은 호스트 머신의 파일 시스템 어딘가에 존재합니다. 

* 도커 스토리지(storage)는 다음과 같은 종류가 있습니다.
    * 볼륨(volume) - 호스트 머신의 도커 엔진이 관리 중인 영역에 저장하는 방식
    * bind mount - 호스트 머신의 파일 시스템에 직접 저장하는 방식
    * tmpfs mount - 호스트 머신의 메모리에 저장하는 방식
* 이번 포스트에선 볼륨, 그 중에서도 익명 볼륨(anonymous volume)에 대해서만 다룹니다. 

<p align="center">
    <img src="/images/docker-anonymous-volume-2.JPG" width="60%">
</p>
<center>https://docs.docker.com/storage/volumes/</center>

### 2.1. Docker Volume Advantages

도커 볼륨을 사용하면 다음과 같은 이점들을 얻을 수 있습니다. 

* 쉽게 백업과 이전(migration) 작업을 수행할 수 있습니다.
* Docker CLI 명령어 혹은 Docker API를 통해 볼륨을 관리할 수 있습니다.
* 리눅스와 윈도우 컨테이너에서 모두 사용 가능합니다.
* 여러 컨테이너들 사이에서 안전하게 공유될 수 있습니다. 
    * 쉽게 접근하지 못하는 도커 영역에서 데이터가 저장되므로 직접 변경할 수 있는 호스트 머신의 파일 시스템보다 안전합니다. 
* 볼륨 드라이버(driver)를 사용하면 원격 호스트나 클라우드 제공자들에 쉽게 데이터를 저장할 수 있습니다.
    * 볼륨 컨텐츠를 암호화하거나 다른 기능을 추가할 수 있습니다.

## 3. Example Service for Docker Volume Concept

간단한 서비스를 통해 도커 볼륨의 컨셉에 대해 알아보겠습니다. 

* 간단한 TODO 리스트를 화면을 통해 보여주는 서비스입니다.
* 컨테이너의 파일 시스템에 저장된 TODO 항목들을 보여줍니다. 
* 간단한 입력 창을 통해 새로운 TODO 항목을 등록할 수 있습니다.

<p align="center">
    <img src="/images/docker-anonymous-volume-3.JPG" width="80%" class="image__border">
</p>

### 3.1. Dockerfile

* `TODO_FILE_PATH` 환경 변수를 통해 파일 경로를 지정할 수 있습니다.
* 기본 값은 `/app/volume/todos` 입니다.

```dockerfile
FROM maven:3.8.6-jdk-11 as MAVEN_BUILD

WORKDIR /build

COPY pom.xml .

RUN mvn dependency:go-offline

COPY src ./src

RUN mvn package -Dmaven.test.skip=true

FROM openjdk:11-jdk-slim-buster

WORKDIR /app

ARG JAR_FILE=*.jar

ENV TODO_FILE_PATH /app/volume/todos

COPY --from=MAVEN_BUILD /build/target/${JAR_FILE} ./app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
```

### 3.2. applicaiton.yml

* 도커 환경 변수로 전달받은 `TODO_FILE_PATH` 값을 파일 경로 설정으로 사용합니다.
* 기본 값은 `files/todos` 입니다.

```yml
spring:
  mvc:
    static-path-pattern: /static/**
  thymeleaf:
    prefix: classpath:templates/
    check-template-location: true
    suffix: .html
    mode: HTML5
    cache: false
todo:
  file:
    path: ${TODO_FILE_PATH:files/todos}
```

### 3.3. 주요 클래스

* `TodoController` 클래스
    * 생성자 - 설정된 파일 경로를 전달받아 최초 파일 읽기를 수행합니다.
    * `/` 경로 - TODO 항목들을 보여주는 화면을 보여줍니다.
    * `/todo` 경로 - 새로운 TODO 항목을 파일 시스템에 저장합니다.
* `TodoUtil` 클래스
    * `readTodoList` 메소드 - 파일 읽기를 수행합니다.
    * `writeTodoList` 메소드 - 파일 쓰기를 수행합니다.

```java
package action.in.blog.controller;

import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.io.*;
import java.util.ArrayList;
import java.util.List;

@Log4j2
@Controller
public class TodoController {

    private final String filePath;

    public TodoController(@Value("${todo.file.path}") String filePath) {
        log.info(filePath);
        this.filePath = filePath;
    }

    @GetMapping("/")
    public String index(Model model) {
        synchronized (this) {
            model.addAttribute("todoList", TodoUtil.readTodoList(filePath));
        }
        return "index";
    }

    @PostMapping("/todo")
    public String addTodo(@RequestParam("todo") String todo) {
        synchronized (this) {
            List<String> temp = new ArrayList<>(TodoUtil.readTodoList(filePath));
            temp.add(todo);
            TodoUtil.writeTodoList(filePath, temp);
        }
        return "redirect:/";
    }
}

class TodoUtil {

    public static List<String> readTodoList(String filePath) {
        List<String> result = new ArrayList<>();
        File file = new File(filePath);
        if (!file.exists()) {
            return result;
        }
        try (FileReader fileReader = new FileReader(file);
             BufferedReader bufferedReader = new BufferedReader(fileReader)
        ) {
            String line;
            while ((line = bufferedReader.readLine()) != null) {
                result.add(line);
            }
        } catch (FileNotFoundException e) {
            throw new RuntimeException(e);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return result;
    }

    public static void writeTodoList(String filePath, List<String> todoList) {
        File file = new File(filePath);
        try (FileWriter fileWriter = new FileWriter(file);
             BufferedWriter bufferedWriter = new BufferedWriter(fileWriter)
        ) {
            for (String todo : todoList) {
                bufferedWriter.write(todo);
                bufferedWriter.newLine();
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
```

## 4. Anonymous Volume 사용하기

볼륨을 사용하기 위해 프로젝트 경로에서 이미지를 빌드합니다. 

```
$ docker build -t volume-test .

[+] Building 2.5s (17/17) FINISHED
 => [internal] load build definition from Dockerfile                                                                                          0.0s
 => => transferring dockerfile: 435B                                                                                                          0.0s
 => [internal] load .dockerignore                                                                                                             0.0s
 => => transferring context: 34B                                                                                                              0.0s
 => [internal] load metadata for docker.io/library/openjdk:11-jdk-slim-buster                                                                 2.4s
 => [internal] load metadata for docker.io/library/maven:3.8.6-jdk-11                                                                         2.4s
 => [auth] library/openjdk:pull token for registry-1.docker.io                                                                                0.0s
 => [auth] library/maven:pull token for registry-1.docker.io                                                                                  0.0s
 => [maven_build 1/6] FROM docker.io/library/maven:3.8.6-jdk-11@sha256:805f366910aea2a91ed263654d23df58bd239f218b2f9562ff51305be81fa215       0.0s
 => [stage-1 1/3] FROM docker.io/library/openjdk:11-jdk-slim-buster@sha256:863ce6f3c27a0a50b458227f23beadda1e7178cda0971fa42b50b05d9a5dcf55   0.0s
 => [internal] load build context                                                                                                             0.0s
 => => transferring context: 1.20kB                                                                                                           0.0s
 => CACHED [stage-1 2/3] WORKDIR /app                                                                                                         0.0s
 => CACHED [maven_build 2/6] WORKDIR /build                                                                                                   0.0s
 => CACHED [maven_build 3/6] COPY pom.xml .                                                                                                   0.0s
 => CACHED [maven_build 4/6] RUN mvn dependency:go-offline                                                                                    0.0s
 => CACHED [maven_build 5/6] COPY src ./src                                                                                                   0.0s
 => CACHED [maven_build 6/6] RUN mvn package -Dmaven.test.skip=true                                                                           0.0s
 => CACHED [stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                                0.0s
 => exporting to image                                                                                                                        0.0s
 => => exporting layers                                                                                                                       0.0s
 => => writing image sha256:ee024b70ea56ae720822551849394e6b92bc4800c30320ff2747bba93d0596f7                                                  0.0s
 => => naming to docker.io/library/volume-test  
```

### 4.1. docker run 명령어

다음 명령어를 통해 컨테이너를 실행합니다. 
`-v` 옵션을 통해 볼륨을 지정할 수 있으며 없다면 자동으로 생성합니다. 

* `-v` 옵션으로 컨테이너의 `/app/volume` 경로를 익명 볼륨으로 연결합니다.
* `-e` 옵션으로 파일 경로를 `/app/volume/todos`으로 지정합니다.

```
$ docker run -d -p 8080:8080\
    --name volume-test\
    -e TODO_FILE_PATH=/app/volume/todos\
    -v /app/volume\
    volume-test

42bfca664e0d
```

### 4.2. Anonymous Volume 확인

다음 도커 명령어들을 통해 볼륨을 확인합니다.

##### 볼륨 리스트 확인

* `docker volume ls` 명령어로 볼륨 리스트를 확인합니다.
* 도커 엔진에 의해 임의의 이름을 가진 볼륨이 생성되었음을 확인할 수 있습니다.

```
$ docker volume ls

DRIVER    VOLUME NAME
local     7d8491d610d9ec9cba6bfd65ca49472aa328409accd8f728966ed363b5834da2
```

##### 볼륨 상세 정보 확인

* `docker volume inspect ${volume_name}` 명령어로 볼륨 상세 정보를 확인합니다.
* 마운트 위치는 `/var/lib/docker/volumes/${volume_name}/_data` 경로로 지정됩니다.
* 해당 위치는 로컬 머신에 실제로 존재하지 않고, 도커 엔진에 의해 가상으로 관리되는 경로입니다.

```
$ docker volume inspect 7d8491d610d9ec9cba6bfd65ca49472aa328409accd8f728966ed363b5834da2

[
    {
        "CreatedAt": "2022-09-19T06:34:08Z",
        "Driver": "local",
        "Labels": null,
        "Mountpoint": "/var/lib/docker/volumes/7d8491d610d9ec9cba6bfd65ca49472aa328409accd8f728966ed363b5834da2/_data",
        "Name": "7d8491d610d9ec9cba6bfd65ca49472aa328409accd8f728966ed363b5834da2",
        "Options": null,
        "Scope": "local"
    }
]
```

### 4.3. 데이터 영속 여부 확인 

다음과 같은 순서로 테스트를 진행합니다. 

1. 컨테이너를 실행합니다.
1. 화면에서 새로운 TODO 항목을 추가합니다.
1. 컨테이너를 정지 및 제거합니다.
1. 생성된 익명 볼륨을 확인합니다.
1. 익명 볼륨을 지정하여 컨테이너를 재실행합니다.
1. 화면에서 이전 컨테이너 화면에서 입력한 데이터를 확인할 수 있습니다. 

<p align="center">
    <img src="/images/docker-anonymous-volume-4.gif" width="100%" class="image__border">
</p>

##### 테스트에서 사용한 명령어 

```
$ docker run -d -p 8080:8080\
    --name volume-test\
    -e TODO_FILE_PATH=/app/volume/todos\
    -v /app/volume\
    volume-test

83687ebb1f87b56e8077a4c4b52b2bce60a292056d5c81dabf8b0617db40207f

$ docker stop $(docker ps -aq) && docker rm $(docker ps -aq)

83687ebb1f87
83687ebb1f87

$ docker volume ls

DRIVER    VOLUME NAME
local     34869e4a551c6dbed7e0bcec4ed7d9fbc97befcf8cf002779a11baac1fa6ecac

$ docker run -d -p 8080:8080\
    --name volume-test\
    -e TODO_FILE_PATH=/app/volume/todos\
    -v 34869e4a551c6dbed7e0bcec4ed7d9fbc97befcf8cf002779a11baac1fa6ecac:/app/volume\
    volume-test

5e548f08c4182fce15fb8503219726823c7290efd82d6b4a5cbd1a852978720a
```

### 4.4. 볼륨 미사용 컨테이너 데이터 영속 여부 확인

볼륨을 사용하지 않은 컨테이너의 데이터 영속 여부를 확인해보았습니다. 
다음과 같은 순서로 테스트를 진행합니다. 

1. 컨테이너를 실행합니다.
1. 화면에서 새로운 TODO 항목을 추가합니다.
1. 컨테이너를 정지 및 제거합니다.
1. 익명 볼륨이 없음을 확인합니다.
1. 컨테이너를 재실행합니다.
1. 데이터가 저장되지 않아서 빈 화면이 나타납니다.

<p align="center">
    <img src="/images/docker-anonymous-volume-5.gif" width="100%" class="image__border">
</p>

##### 이미지 빌드에 사용한 Dockerfile

* 볼륨을 사용하면 컨테이너 내부에 필요한 디렉토리를 함께 생성합니다. 
* 익명 볼륨을 만들지 않는 경우 디렉토리를 찾지 못하여 테스트가 실패합니다.
* `RUN mkdir -p /app/volume` 커맨드를 통해 해당 컨테이너에 테스트에 필요한 디렉토리를 만듭니다.

```dockerfile
FROM maven:3.8.6-jdk-11 as MAVEN_BUILD

WORKDIR /build

COPY pom.xml .

RUN mvn dependency:go-offline

COPY src ./src

RUN mvn package -Dmaven.test.skip=true

FROM openjdk:11-jdk-slim-buster

WORKDIR /app

# 디렉토리 추가 
RUN mkdir -p /app/volume

ARG JAR_FILE=*.jar

ENV TODO_FILE_PATH /app/volume/todos

COPY --from=MAVEN_BUILD /build/target/${JAR_FILE} ./app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
```

##### 테스트에서 사용한 명령어

```
$ docker run -d -p 8080:8080\
    --name volume-test\
    -e TODO_FILE_PATH=/app/volume/todos\
    volume-test

1bdf629190ed8360db04d24b320a2a3394ec65822b6e81cc7179c423ac99dbe9

$ docker stop $(docker ps -aq) && docker rm $(docker ps -aq)

1bdf629190ed
1bdf629190ed

$ docker volume ls

DRIVER    VOLUME NAME

$ docker run -d -p 8080:8080\
    --name volume-test\
    -e TODO_FILE_PATH=/app/volume/todos\
    volume-test

ca0efde8a72f0b9323faf162dd044e7c4ac9d1b5497b58b0f489a2f129454e2a
```

## 5. 추가 설명

기타 추가적인 내용들을 함께 정리하였습니다.

### 5.1. Dockerfile 사용

Dockerfile을 사용하여 이미지가 사용할 익명 볼륨을 미리 지정할 수 있습니다. 

* `VOLUME` 명령어를 통해 이미지에서 기본적으로 필요한 익명 볼륨을 지정할 수 있습니다. 
* 컨테이너를 실행할 때 `-v` 옵션 없이도 자동으로 익명 볼륨이 지정됩니다. 

```dockerfile
FROM maven:3.8.6-jdk-11 as MAVEN_BUILD

WORKDIR /build

COPY pom.xml .

RUN mvn dependency:go-offline

COPY src ./src

RUN mvn package -Dmaven.test.skip=true

FROM openjdk:11-jdk-slim-buster

WORKDIR /app

VOLUME /app/volume

ARG JAR_FILE=*.jar

ENV TODO_FILE_PATH /app/volume/todos

COPY --from=MAVEN_BUILD /build/target/${JAR_FILE} ./app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
```

### 5.2. Anonymous Volume 자동 삭제

컨테이너가 종료되도 볼륨은 자동으로 삭제되지 않습니다. 
하지만 `--rm` 옵션을 사용하면 컨테이너 종료될 때 익명 볼륨을 자동으로 함께 제거할 수 있습니다. 

* 컨테이너를 실행합니다.
* 볼륨 리스트를 확인합니다.
    * 생성된 익명 볼륨을 확인할 수 있습니다.
* 컨테이너를 종료하면 동시에 삭제됩니다.
* 볼륨 리스트를 확인합니다.
    * 생성된 익명 볼륨이 함께 정리되었습니다. 

```
$ docker run -d -p 8080:8080\
    --name volume-test\
    -e TODO_FILE_PATH=/app/volume/todos\
    -v /app/volume\
    --rm\
    volume-test

b7ed2ccb0b2190a6e61b0274c0bba90336e1c598aac296c5ae801f21d583c184

$ docker volume ls

DRIVER    VOLUME NAME
local     b21516de433bd74b05c7eab6bd76dc9a3cdc08fccd162dabb959ab3851dbbe44

$ docker stop $(docker ps -aq)

b7ed2ccb0b21

$ docker ps -a

CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES

$ docker volume ls

DRIVER    VOLUME NAME
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-09-19-docker-volume>

#### RECOMMEND NEXT POSTS

* [Docker Named Volume][docker-named-volume-link]

#### REFERENCE

* [Docker & Kubernetes: The Practical Guide [2022 Edition]][docker-kube-lecture-link]
* <https://docs.docker.com/storage/>
* <https://docs.docker.com/storage/volumes/>
* <https://www.baeldung.com/ops/docker-container-filesystem>
* <https://spin.atomicobject.com/2019/07/11/docker-volumes-explained/>
* <https://stackoverflow.com/questions/44976571/docker-anonymous-volumes>
* <https://stackoverflow.com/questions/48632059/difference-between-volume-and-run-mkdir-in-dockerfile>
* <https://stackoverflow.com/questions/41935435/understanding-volume-instruction-in-dockerfile/46992367#46992367>
* <https://stackoverflow.com/questions/34809646/what-is-the-purpose-of-volume-in-dockerfile>
* <https://arisu1000.tistory.com/27809>

[docker-kube-lecture-link]: https://www.udemy.com/course/docker-kubernetes-the-practical-guide/

[docker-named-volume-link]: https://junhyunny.github.io/docker/docker-named-volume/