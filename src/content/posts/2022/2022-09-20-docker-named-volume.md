---
title: "도커 명명 볼륨(Docker Named Volume)"
publishedAt: "2022-09-20"
updatedAt: "2026-11-12T16:18:37+09:00"
canonicalPath: "/docker/docker-named-volume/"
categories:
  - "docker"
summary: "도커 볼륨 개념을 요약하고, TODO 서비스 예제로 명명 볼륨을 만들어 데이터를 영속화하고 여러 컨테이너가 공유하는 방법을 정리했다."
recommendedPosts:
  - title: "Docker Anonymous Volume"
    href: "https://junhyunny.github.io/docker/docker-anonymous-volume/"
---

## 0. 들어가면서

[Docker Anonymous Volume][docker-anonymous-volume-link] 글에서 도커 볼륨의 전반적인 내용과 익명 볼륨(anonymous volume)을 정리했다. 이번 글에선 명명 볼륨(named volume)을 다룬다. 글의 가독성을 위해 도커 볼륨과 관련된 내용을 먼저 빠르게 요약하고 진행한다.

## 1. Docker Volume Quick Summary

### 1.1. Pain Point of Docker Container Layer

도커 컨테이너는 자신에게 필요한 데이터와 파일을 컨테이너 레이어(container layer)라는 영역에서 읽거나 저장한다. 컨테이너 레이어에는 다음과 같은 한계가 있다.

- 컨테이너를 생성할 때 초기화된 상태로 함께 새로 생성된다.
- 컨테이너 종료 시 함께 삭제된다.

### 1.2. Docker Volume for Data Persistence

도커 볼륨은 컨테이너에서 관리하는 데이터를 안전하게 영속화하는 방법이다. 도커 엔진이 관리하는 영역에 데이터 저장 공간을 마련해 컨테이너 라이프사이클과 상관없이 데이터 영속성을 유지한다. 도커가 관리하는 영역은 호스트 머신의 파일 시스템 어딘가에 존재한다.

도커 스토리지(storage)에는 다음과 같은 종류가 있다.

- 볼륨(volume) - 호스트 머신의 도커 엔진이 관리 중인 영역에 저장하는 방식
- bind mount - 호스트 머신의 파일 시스템에 직접 저장하는 방식
- tmpfs mount - 호스트 머신의 메모리에 저장하는 방식

이번 글에선 볼륨, 그중에서도 명명 볼륨(named volume)만 다룬다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/docker-named-volume-01.png" width="60%">
</div>
<center>https://docs.docker.com/storage/volumes/</center>

### 1.3. Docker Volume Advantages

도커 볼륨을 사용하면 다음과 같은 이점을 얻을 수 있다.

- 쉽게 백업과 이전(migration) 작업을 수행할 수 있다.
- Docker CLI 명령어 혹은 Docker API를 통해 볼륨을 관리할 수 있다.
- 리눅스와 윈도우 컨테이너에서 모두 사용할 수 있다.
- 여러 컨테이너 사이에서 안전하게 공유할 수 있다.
  - 쉽게 접근할 수 없는 도커 영역에 데이터가 저장되므로 직접 변경할 수 있는 호스트 머신의 파일 시스템보다 안전하다.
- 볼륨 드라이버(driver)를 사용하면 원격 호스트나 클라우드 제공자에 쉽게 데이터를 저장할 수 있다.
  - 볼륨 콘텐츠를 암호화하거나 다른 기능을 추가할 수 있다.

## 2. Example Service for Docker Volume Concept

간단한 서비스로 도커 볼륨의 개념을 알아보자. 예제 서비스는 다음과 같다.

- 간단한 TODO 리스트를 화면에 보여 주는 서비스다.
- 컨테이너의 파일 시스템에 저장된 TODO 항목들을 보여 준다.
- 간단한 입력 창으로 새로운 TODO 항목을 등록할 수 있다.

<div class="block-break" align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/docker-named-volume-02.png" width="100%" class="image__border">
</div>

Dockerfile에서는 `TODO_FILE_PATH` 환경 변수로 파일 경로를 지정할 수 있다. 기본값은 `/app/volume/todos`이다.

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

`application.yml` 파일에서는 도커 환경 변수로 전달받은 `TODO_FILE_PATH` 값을 파일 경로 설정으로 사용한다. 기본값은 `files/todos`이다.

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

서비스의 주요 클래스는 다음과 같다.

- `TodoController` 클래스
  - 생성자 - 설정된 파일 경로를 전달받아 최초 파일 읽기를 수행한다.
  - `/` 경로 - TODO 항목들을 보여 주는 화면을 반환한다.
  - `/todo` 경로 - 새로운 TODO 항목을 파일 시스템에 저장한다.
- `TodoUtil` 클래스
  - `readTodoList` 메서드 - 파일 읽기를 수행한다.
  - `writeTodoList` 메서드 - 파일 쓰기를 수행한다.

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

## 3. Named Volume 사용하기

볼륨을 사용하기 위해 프로젝트 경로에서 이미지를 빌드한다.

```
$ docker build -t volume-test .

[+] Building 2.4s (17/17) FINISHED
 => [internal] load build definition from Dockerfile                                                                                          0.0s
 => => transferring dockerfile: 463B                                                                                                          0.0s
 => [internal] load .dockerignore                                                                                                             0.0s
 => => transferring context: 34B                                                                                                              0.0s
 => [internal] load metadata for docker.io/library/openjdk:11-jdk-slim-buster                                                                 2.3s
 => [internal] load metadata for docker.io/library/maven:3.8.6-jdk-11                                                                         2.3s
 => [auth] library/openjdk:pull token for registry-1.docker.io                                                                                0.0s
 => [auth] library/maven:pull token for registry-1.docker.io                                                                                  0.0s
 => [maven_build 1/6] FROM docker.io/library/maven:3.8.6-jdk-11@sha256:805f366910aea2a91ed263654d23df58bd239f218b2f9562ff51305be81fa215       0.0s
 => [internal] load build context                                                                                                             0.0s
 => => transferring context: 1.20kB                                                                                                           0.0s
 => [stage-1 1/3] FROM docker.io/library/openjdk:11-jdk-slim-buster@sha256:863ce6f3c27a0a50b458227f23beadda1e7178cda0971fa42b50b05d9a5dcf55   0.0s
 => CACHED [stage-1 2/3] WORKDIR /app                                                                                                         0.0s
 => CACHED [maven_build 2/6] WORKDIR /build                                                                                                   0.0s
 => CACHED [maven_build 3/6] COPY pom.xml .                                                                                                   0.0s
 => CACHED [maven_build 4/6] RUN mvn dependency:go-offline                                                                                    0.0s
 => CACHED [maven_build 5/6] COPY src ./src                                                                                                   0.0s
 => CACHED [maven_build 6/6] RUN mvn package -Dmaven.test.skip=true                                                                           0.0s
 => CACHED [stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                                0.0s
 => exporting to image                                                                                                                        0.0s
 => => exporting layers                                                                                                                       0.0s
 => => writing image sha256:f082b31988483849da2f61b8edea7fb40bb8992363b3ddf7b0fef668af408ca4                                                  0.0s
 => => naming to docker.io/library/volume-test
```

### 3.1. docker run 명령어

다음 명령어로 컨테이너를 실행한다. `-v` 옵션으로 볼륨을 지정할 수 있으며, 볼륨이 없다면 자동으로 생성한다.

- `-v` 옵션으로 컨테이너의 `/app/volume` 경로를 명명 볼륨으로 연결한다.
  - 도커의 볼륨 이름은 `todos`이다.
  - 콜론(:)을 기준으로 왼쪽이 볼륨 이름, 오른쪽이 컨테이너 내 경로다.
- `-e` 옵션으로 파일 경로를 `/app/volume/todos`로 지정한다.
- `--rm` 옵션을 사용하면 컨테이너 실행을 멈출 때 컨테이너를 함께 정리한다.

```
$ docker run -d -p 8080:8080\
    --name volume-test\
    -e TODO_FILE_PATH=/app/volume/todos\
    -v todos:/app/volume\
    --rm\
    volume-test

42bfca664e0d
```

### 3.2. Named Volume 확인

다음 도커 명령어들로 볼륨을 확인한다. 먼저 `docker volume ls` 명령어로 볼륨 리스트를 확인하면 `todos`라는 이름의 볼륨이 생성되었음을 알 수 있다.

```
$ docker volume ls

DRIVER    VOLUME NAME
local     todos
```

`docker volume inspect ${volume_name}` 명령어로 볼륨 상세 정보를 확인한다. 마운트 위치는 `/var/lib/docker/volumes/todos/_data` 경로로 지정된다. 이 위치는 로컬 머신에 실제로 존재하지 않고, 도커 엔진이 가상으로 관리하는 경로다.

```
$ docker volume inspect todos
[
    {
        "CreatedAt": "2022-09-19T17:01:57Z",
        "Driver": "local",
        "Labels": null,
        "Mountpoint": "/var/lib/docker/volumes/todos/_data",
        "Name": "todos",
        "Options": null,
        "Scope": "local"
    }
]
```

### 3.3. 데이터 영속 여부 확인

다음과 같은 순서로 테스트를 진행한다.

1. 컨테이너를 실행한다.
1. 화면에서 새로운 TODO 항목을 추가한다.
1. 컨테이너를 정지하고 제거한다.
1. 생성된 명명 볼륨을 확인한다.
1. 명명 볼륨을 지정해 컨테이너를 재실행한다.
1. 이전 컨테이너 화면에서 입력한 데이터를 확인할 수 있다.

<div class="block-break" align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/docker-named-volume-03.gif" width="100%" class="image__border">
</div>

테스트에서 사용한 명령어는 다음과 같다.

```
$ docker run -d -p 8080:8080\
    --name volume-test\
    -e TODO_FILE_PATH=/app/volume/todos\
    -v todos:/app/volume\
    --rm\
    volume-test

e56b5dfef4abe7fa382ad6fc363d2f231f3be82cec8c3e139cced3d77e604d31

$ docker stop $(docker ps -aq)

e56b5dfef4ab

$ docker volume ls

DRIVER    VOLUME NAME
local     todos

$ docker run -d -p 8080:8080\
    --name volume-test\
    -e TODO_FILE_PATH=/app/volume/todos\
    -v todos:/app/volume\
    --rm\
    volume-test

4e3858c1ca1cc6c2d27eaedda29ca10f97cc1472a4a55b020f1c6b751bb243be
```

### 3.4. 명명 볼륨 공유하기

[Docker Anonymous Volume][docker-anonymous-volume-link] 글에서 확인했듯이 볼륨을 사용하지 않으면 데이터가 저장되지 않는다. 같은 테스트를 두 번 진행하는 것은 낭비이므로 이번 글에선 컨테이너 사이에서 볼륨을 공유해 보자. 다음과 같은 순서로 테스트를 진행한다.

1. 포트 8080 컨테이너를 실행한다.
1. 포트 8080 서비스에 접근한 후 화면에서 새로운 TODO 항목을 추가한다.
1. 생성된 명명 볼륨을 확인한다.
1. 포트 8081 컨테이너를 실행한다.
1. 포트 8081 서비스에 접근하면 포트 8080 서비스에서 저장한 데이터가 보이는지 확인한다.

<div class="block-break" align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/docker-named-volume-04.gif" width="100%" class="image__border">
</div>

테스트에서 사용한 명령어는 다음과 같다.

```
$ docker run -d -p 8080:8080\
    --name volume-test\
    -e TODO_FILE_PATH=/app/volume/todos\
    -v todos:/app/volume\
    --rm\
    volume-test

75ee013a2089b32a71be585cb2e652638ea62c5104115b9843c308845e312cb0

$ docker volume ls

DRIVER    VOLUME NAME
local     todos

$ docker run -d -p 8081:8080\
    --name 2nd-volume-test\
    -e TODO_FILE_PATH=/app/volume/todos\
    -v todos:/app/volume\
    --rm\
    volume-test

b7f7cc5fc60a56bbd0b17f8ec02ccd07c98bf47f1b2a3c11a7860cae6f342df3
```

## 4. 추가 설명

그 밖의 내용을 함께 정리했다.

### 4.1. Docker CLI 사용

`Docker CLI`로 도커 볼륨을 먼저 생성한 뒤 사용할 수도 있다.

```
$ docker volume create custom-volume

custom-volume

$ docker volume ls

DRIVER    VOLUME NAME
local     custom-volume
local     todos
```

### 4.2. Anonymous And Named Volume

익명 볼륨과 명명 볼륨의 차이를 간단하게 정리했다.

| | Anonymous Volume | Named Volume |
|:---:|:---:|:---:|
| `-v` 옵션 사용 | `-v {container_directory}` | `-v {volume_name}:{container_directory}` |
| `--rm` 옵션 사용 | 컨테이너를 종료하는 경우 볼륨이 함께 삭제 | 컨테이너를 종료하더라도 볼륨 유지 |
| 이름 지정 | 도커에 의해 임의 문자열 생성 | 사용자 지정 |
| 재사용성 | 임의의 이름이 지정되므로 재사용이 어려움 | 이름이 사용자에 의해 지정되므로 재사용이 용이 |
| Dockerfile 사용 | Dockerfile을 통해 생성 가능 | Dockerfile을 통해 생성 불가능 |

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-09-19-docker-volume>

#### REFERENCE

- [Docker & Kubernetes: The Practical Guide [2022 Edition]][docker-kube-lecture-link]
- <https://docs.docker.com/storage/>
- <https://docs.docker.com/storage/volumes/>
- <https://www.baeldung.com/ops/docker-container-filesystem>
- <https://spin.atomicobject.com/2019/07/11/docker-volumes-explained/>
- <https://stackoverflow.com/questions/44976571/docker-anonymous-volumes>
- <https://stackoverflow.com/questions/48632059/difference-between-volume-and-run-mkdir-in-dockerfile>
- <https://stackoverflow.com/questions/41935435/understanding-volume-instruction-in-dockerfile/46992367#46992367>
- <https://stackoverflow.com/questions/34809646/what-is-the-purpose-of-volume-in-dockerfile>
- <https://arisu1000.tistory.com/27809>

[docker-anonymous-volume-link]: https://junhyunny.github.io/docker/docker-anonymous-volume/

[docker-kube-lecture-link]: https://www.udemy.com/course/docker-kubernetes-the-practical-guide/
