---
title: "Docker Named Volume"
search: false
category:
  - docker
last_modified_at: 2022-09-20T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Docker Anonymous Volume][docker-anonymous-volume-link]

## 0. 들어가면서

[Docker Anonymous Volume][docker-anonymous-volume-link] 포스트에서 도커 볼륨의 전반적인 내용과 익명 볼륨(anonymous volume)에 대해 정리하였습니다. 
이번 포스트에선 명명 볼륨(named volume)에 대해 알아보겠습니다. 
글의 가독성을 위해 도커 볼륨에 관련된 내용을 이번 포스트에서도 빠르게 요약한 후 진행하겠습니다. 

## 1. Docker Volume Quick Summary

### 1.1. Pain Point of Docker Container Layer

도커 컨테이너는 자신이 필요한 데이터, 파일들을 컨테이너 레이어(container layer)라는 영역에서 읽거나 저장합니다. 
컨테이너 레이어는 다음과 같은 한계점이 존재합니다. 

* 컨테이너 생성 시 초기화 된 상태로 함께 새롭게 생성된다.
* 컨테이너 종료 시 함께 삭제된다. 

### 1.2. Docker Volume for Data Persistence 

도커 볼륨은 컨테이너에서 관리하는 데이터를 안전하게 영속화시키는 방법입니다. 
도커 엔진이 관리하는 영역에 데이터 저장 공간을 마련하여 컨테이너 라이프 사이클과 상관없이 데이터 영속성을 유지합니다. 
도커가 관리하는 영역은 호스트 머신의 파일 시스템 어딘가에 존재합니다. 

* 도커 스토리지(storage)는 다음과 같은 종류가 있습니다.
    * 볼륨(volume) - 호스트 머신의 도커 엔진이 관리 중인 영역에 저장하는 방식
    * bind mount - 호스트 머신의 파일 시스템에 직접 저장하는 방식
    * tmpfs mount - 호스트 머신의 메모리에 저장하는 방식
* 이번 포스트에선 볼륨, 그 중에서도 명명 볼륨(named volume)에 대해서만 다룹니다. 

<p align="center">
    <img src="/images/docker-named-volume-1.JPG" width="60%">
</p>
<center>https://docs.docker.com/storage/volumes/</center>

### 1.3. Docker Volume Advantages

도커 볼륨을 사용하면 다음과 같은 이점들을 얻을 수 있습니다. 

* 쉽게 백업과 이전(migration) 작업을 수행할 수 있습니다.
* Docker CLI 명령어 혹은 Docker API를 통해 볼륨을 관리할 수 있습니다.
* 리눅스와 윈도우 컨테이너에서 모두 사용 가능합니다.
* 여러 컨테이너들 사이에서 안전하게 공유될 수 있습니다. 
    * 쉽게 접근하지 못하는 도커 영역에서 데이터가 저장되므로 직접 변경할 수 있는 호스트 머신의 파일 시스템보다 안전합니다. 
* 볼륨 드라이버(driver)를 사용하면 원격 호스트나 클라우드 제공자들에 쉽게 데이터를 저장할 수 있습니다.
    * 볼륨 컨텐츠를 암호화하거나 다른 기능을 추가할 수 있습니다.

## 2. Example Service for Docker Volume Concept

간단한 서비스를 통해 도커 볼륨의 컨셉에 대해 알아보겠습니다. 

* 간단한 TODO 리스트를 화면을 통해 보여주는 서비스입니다.
* 컨테이너의 파일 시스템에 저장된 TODO 항목들을 보여줍니다. 
* 간단한 입력 창을 통해 새로운 TODO 항목을 등록할 수 있습니다.

<p align="center">
    <img src="/images/docker-named-volume-2.JPG" width="80%" class="image__border">
</p>

### 2.1. Dockerfile

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

### 2.2. applicaiton.yml

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

### 2.3. 주요 클래스

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

## 3. Named Volume 사용하기

볼륨을 사용하기 위해 프로젝트 경로에서 이미지를 빌드합니다. 

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

다음 명령어를 통해 컨테이너를 실행합니다. 
`-v` 옵션을 통해 볼륨을 지정할 수 있으며 없다면 자동으로 생성합니다. 

* `-v` 옵션으로 컨테이너의 `/app/volume` 경로를 명명 볼륨으로 연결합니다.
    * 도커의 볼륨 이름은 `todos` 입니다.
    * 콜론(:)을 기준으로 왼쪽이 볼륨 이름, 오른쪽이 컨테이너 내 경로입니다.
* `-e` 옵션으로 파일 경로를 `/app/volume/todos`으로 지정합니다.
* `--rm` 옵션을 사용하여 컨테이너의 실행을 멈추면 컨테이너를 함께 정리합니다. 

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

다음 도커 명령어들을 통해 볼륨을 확인합니다.

##### 볼륨 리스트 확인

* `docker volume ls` 명령어로 볼륨 리스트를 확인합니다.
* `todos`라는 이름을 가진 볼륨이 생성되었음을 확인할 수 있습니다.

```
$ docker volume ls

DRIVER    VOLUME NAME
local     todos
```

##### 볼륨 상세 정보 확인

* `docker volume inspect ${volume_name}` 명령어로 볼륨 상세 정보를 확인합니다.
* 마운트 위치는 `/var/lib/docker/volumes/todos/_data` 경로로 지정됩니다.
* 해당 위치는 로컬 머신에 실제로 존재하지 않고, 도커 엔진에 의해 가상으로 관리되는 경로입니다.

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

다음과 같은 순서로 테스트를 진행합니다. 

1. 컨테이너를 실행합니다.
1. 화면에서 새로운 TODO 항목을 추가합니다.
1. 컨테이너를 정지 및 제거합니다.
1. 생성된 명명 볼륨을 확인합니다.
1. 명명 볼륨을 지정하여 컨테이너를 재실행합니다.
1. 화면에서 이전 컨테이너 화면에서 입력한 데이터를 확인할 수 있습니다. 

<p align="center">
    <img src="/images/docker-named-volume-3.gif" width="100%" class="image__border">
</p>

##### 테스트에서 사용한 명령어 

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

[Docker Anonymous Volume][docker-anonymous-volume-link] 포스트에서 확인했듯이 볼륨을 사용하지 않으면 데이터가 저장되지 않습니다. 
동일한 테스트를 두 번 진행하는 것은 낭비이기 때문에 이번 포스트에선 컨테이너 사이에서 볼륨을 공유해보겠습니다. 
다음과 같은 순서로 테스트를 진행합니다. 

1. 포트 8080 컨테이너를 실행합니다.
1. 포트 8080 서비스에 접근한 후 화면에서 새로운 TODO 항목을 추가합니다.
1. 생성된 명명 볼륨을 확인합니다.
1. 포트 8081 컨테이너를 실행합니다. 
1. 포트 8081 서비스에 접근하면 포트 8080 서비스에서 저장한 데이터가 보이는지 확인합니다. 

<p align="center">
    <img src="/images/docker-named-volume-4.gif" width="100%" class="image__border">
</p>

##### 테스트에서 사용한 명령어

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

기타 추가적인 내용들을 함께 정리하였습니다.

### 4.1. Docker CLI 사용

`Docker CLI`를 사용하여 먼저 도커 볼륨을 생성하고 사용할 수 있습니다.

```
$ docker volume create custom-volume

custom-volume

$ docker volume ls

DRIVER    VOLUME NAME
local     custom-volume
local     todos
```

### 4.2. Anonymous And Named Volume

익명, 명명 볼륨의 차이를 간단하게 정리하였습니다. 

| | Anonymous Volume | Named Volume |
|:---:|:---:|:---:|
| `-v` 옵션 사용 | `-v {container_directory}` | `-v {volume_name}:{container_directory}` |
| `--rm` 옵션 사용 | 컨테이너를 종료하는 경우 볼륨이 함께 삭제 | 컨테이너를 종료하더라도 볼륨 유지 |
| 이름 지정 | 도커에 의해 임의 문자열 생성 | 사용자 지정 |
| 재사용성 | 임의의 이름이 지정되므로 재사용이 어려움 | 이름이 사용자에 의해 지정되므로 재사용이 용이 |
| Dockerfile 사용 | Dockerfile을 통해 생성 가능 | Dockerfile을 통해 생성 불가능 |

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-09-19-docker-volume>

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

[docker-anonymous-volume-link]: https://junhyunny.github.io/docker/docker-anonymous-volume/

[docker-kube-lecture-link]: https://www.udemy.com/course/docker-kubernetes-the-practical-guide/