---
title: "React 환경 변수 설정과 실행 환경 분리"
search: false
category:
  - react
last_modified_at: 2022-09-30T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [React 개발 서버 CORS 문제 해결][react-proxy-link]

## 0. 들어가면서

`CRA(Create-React-App)`를 사용해 프로젝트를 만드는 경우 `react-scripts`에 의해 개발 서버 실행, 빌드, 테스트 등이 실행됩니다. 
이번 포스트에서 설명하는 실행 환경 변수를 작성하고 파일을 분리하는 방법은 `CRA`를 통해 만들어진 프로젝트에 한해서 동작합니다. 
다른 개발 도구를 통해 개발 환경을 구축한 경우엔 정상적으로 동작하지 않을 수 있으니 참고 바랍니다. 

## 1. React 환경 변수 설정과 사용

리액트 애플리케이션 개발 시 성격에 따라 환경 변수로 분리하는 값들이 있습니다. 
환경 변수들은 `.env` 파일 내부에 선언하고 값을 설정하여 사용할 수 있습니다. 
`REACT_APP_` 키워드가 앞에 붙은 변수들만 환경 변수로 사용 가능합니다. 

##### 환경 변수 설정

```
REACT_APP_SERVER=/api
```

##### 환경 변수 사용

* 코드에선 `process.env` 변수를 통해 환경 변수에 접근할 수 있습니다. 

```javascript
export const getTodos = async () => {
    const {data} = await axios.get(`${process.env.REACT_APP_SERVER}/todos`)
    return data
}
```

### 1.1. 환경 변수 설정 시 주의 사항

`CRA` 공식 문서를 보면 다음과 같은 주의 사항을 볼 수 있습니다. 

> WARNING: Do not store any secrets (such as private API keys) in your React app

비공개 API 키 같은 값들을 저장하는 것을 지양하는 이유는 환경 변수가 빌드에 내장되어 누구든지 이를 확인할 수 있기 때문입니다. 

## 2. 실행 환경 분리

실행 환경에 따라 환경 변수를 분리하는 방법을 알아보겠습니다. 
`.env` 파일을 다음과 같이 확장할 수 있습니다. 

* .env 
    * 기본 설정 파일입니다.
* .env.local 
    * .env 파일을 오버라이드(override)합니다.
    * 테스트 환경을 제외하고 모든 환경에서 사용됩니다.
* .env.development, .env.test, .env.production
    * 각 실행 환경에 따라 사용됩니다.
* .env.development.local, .env.test.local, .env.production.local
    * 각 실행 환경에 따라 사용되는 `.env.{environment}` 파일을 오버라이드합니다. 

### 2.1. 설정 파일 우선 순위 적용

`react-scripts` 실행에 따라 다음과 같은 우선 순위가 적용됩니다. 
왼쪽에 있을수록 우선 순위가 높으며 동일한 이름의 환경 변수가 있다면 우선 순위가 높은 파일의 환경 변수가 사용됩니다. 

* npm start
    * .env.development.local > .env.local > .env.development > .env
* npm run build
    * .env.production.local > .env.local > .env.production > .env
* npm test
    * .env.test.local > .env.test > .env

## 3. 환경 변수 분리 예시

환경 변수가 각 실행 환경에서 다르게 적용되는 예시를 살펴보겠습니다. 
애플리케이션 코드는 별로 중요하지 않으므로 깊게 다루지 않았습니다. 
필요한 정보들만 가볍게 다뤘습니다. 

##### 프론트엔드 서비스 코드

이번 예시에서는 `CORS` 문제를 해결하기 위해 `axios` 모듈에 전달하는 API 경로 파라미터를 환경 변수로 제어합니다. 
먼저 프론트엔드 서비스에서 `axios` 모듈을 사용하는 코드를 간략하게 설명하겠습니다. 

* `axios` 모듈은 URL 일부 경로만 받는 경우 화면을 서비스하는 서버로 요청을 전달합니다.
    * `/api/todos`처럼 일부 경로만 사용하는 경우 화면을 서비스하는 서버로 요청을 전달합니다.
    * `http://google.com`처럼 전체 도메인이 포함된 URL을 사용하는 경우 해당 서버로 요청을 전달합니다.
* `addTodo` 함수
    * POST 요청을 수행합니다.
    * 경로는 `${process.env.REACT_APP_SERVER}/todo` 입니다.
* `getTodos` 함수
    * POST 요청을 수행합니다.
    * 경로는 `${process.env.REACT_APP_SERVER}/todos` 입니다.

```javascript
import axios from "axios";

export const addTodo = async (todo) => {
    await axios.post(`${process.env.REACT_APP_SERVER}/todo`, {title: todo}, {
        headers: {
            'Content-Type': 'application/json'
        }
    })
}

export const getTodos = async () => {
    const {data} = await axios.get(`${process.env.REACT_APP_SERVER}/todos`)
    return data
}
```

##### 백엔드 서비스 코드

다음은 백엔드 서비스에서 요청을 받아주는 `TodoController` 클래스입니다. 

* `/todo` 경로는 POST 요청을 받아 신규 `TODO` 항목을 생성합니다.
* `/todos` 경로는 GET 요청을 받아 등록된 `TODO` 항목들을 반환합니다. 

```java
package action.in.blog.todo.controller;

import action.in.blog.todo.domain.Todo;
import action.in.blog.todo.service.TodoService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class TodoController {

    private final TodoService todoService;

    public TodoController(TodoService todoService) {
        this.todoService = todoService;
    }

    @PostMapping("/todo")
    public void addTodo(@RequestBody Todo todo) {
        todoService.addTodo(todo);
    }

    @GetMapping("/todos")
    public List<Todo> getTodos() {
        return todoService.getTodos();
    }
}
```

### 3.1. npm start 명령어

`npm start` 명령어에서 사용되는 `.env.development` 파일에 환경 변수를 선언하고 결과를 확인합니다.

#### 3.1.1. .env.development

* 환경 변수를 선언하고 값을 지정하진 않습니다.

```
REACT_APP_SERVER=
```

#### 3.1.2. package.json

* `webpack` 개발 서버의 프록시 사용을 위해 `proxy` 값에 백엔드 서버 주소를 설정합니다.
    * `http://localhost:8080` 값으로 지정합니다.

```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^14.0.0",
    "axios": "^0.27.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "proxy": "http://localhost:8080"
}
```

#### 3.1.3. 개발 서버 실행

프론트엔드 서비스와 백엔드 서비스를 터미널에서 각자 실행합니다. 

##### 프론트엔드 서비스 실행

```
$ cd frontend && npm start    

> frontend@0.1.0 start
> react-scripts start

(node:69698) [DEP_WEBPACK_DEV_SERVER_ON_AFTER_SETUP_MIDDLEWARE] DeprecationWarning: 'onAfterSetupMiddleware' option is deprecated. Please use the 'setupMiddlewares' option.
(Use `node --trace-deprecation ...` to show where the warning was created)
(node:69698) [DEP_WEBPACK_DEV_SERVER_ON_BEFORE_SETUP_MIDDLEWARE] DeprecationWarning: 'onBeforeSetupMiddleware' option is deprecated. Please use the 'setupMiddlewares' option.
Starting the development server...
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.0.2:3000
```

##### 백엔드 서비스 실행

```
$ cd backend && mvn spring-boot:run

[INFO] Scanning for projects...
[WARNING] 
[WARNING] Some problems were encountered while building the effective model for action.in.blog:backend:jar:0.0.1-SNAPSHOT
[WARNING] 'dependencies.dependency.(groupId:artifactId:type:classifier)' must be unique: org.projectlombok:lombok:jar -> version 1.18.24 vs (?) @ line 37, column 21
[WARNING] 
[WARNING] It is highly recommended to fix these problems because they threaten the stability of your build.
[WARNING] 
[WARNING] For this reason, future Maven versions might no longer support building such malformed projects.
[WARNING] 
[INFO] 
[INFO] -----------------------< action.in.blog:backend >-----------------------
[INFO] Building backend 0.0.1-SNAPSHOT
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] 
[INFO] >>> spring-boot-maven-plugin:2.7.4:run (default-cli) > test-compile @ backend >>>
[INFO] 
[INFO] --- maven-resources-plugin:3.2.0:resources (default-resources) @ backend ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Using 'UTF-8' encoding to copy filtered properties files.
[INFO] Copying 1 resource
[INFO] Copying 0 resource
[INFO] 
[INFO] --- maven-compiler-plugin:3.10.1:compile (default-compile) @ backend ---
[INFO] Changes detected - recompiling the module!
[INFO] Compiling 7 source files to /Users/junhyunk/Desktop/workspace/blog/blog-in-action/2022-09-30-react-env-variable-setting/backend/target/classes
[INFO] 
[INFO] --- maven-resources-plugin:3.2.0:testResources (default-testResources) @ backend ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Using 'UTF-8' encoding to copy filtered properties files.
[INFO] skip non existing resourceDirectory /Users/junhyunk/Desktop/workspace/blog/blog-in-action/2022-09-30-react-env-variable-setting/backend/src/test/resources
[INFO] 
[INFO] --- maven-compiler-plugin:3.10.1:testCompile (default-testCompile) @ backend ---
[INFO] Changes detected - recompiling the module!
[INFO] Compiling 3 source files to /Users/junhyunk/Desktop/workspace/blog/blog-in-action/2022-09-30-react-env-variable-setting/backend/target/test-classes
[INFO] 
[INFO] <<< spring-boot-maven-plugin:2.7.4:run (default-cli) < test-compile @ backend <<<
[INFO] 
[INFO] 
[INFO] --- spring-boot-maven-plugin:2.7.4:run (default-cli) @ backend ---
[INFO] Attaching agents: []

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v2.7.4)

2022-10-01 03:22:47.823  INFO 70218 --- [           main] action.in.blog.BackendApplication        : Starting BackendApplication using Java 17.0.1 on junhyunk-a01.vmware.com with PID 70218 (/Users/junhyunk/Desktop/workspace/blog/blog-in-action/2022-09-30-react-env-variable-setting/backend/target/classes started by junhyunk in /Users/junhyunk/Desktop/workspace/blog/blog-in-action/2022-09-30-react-env-variable-setting/backend)
2022-10-01 03:22:47.825  INFO 70218 --- [           main] action.in.blog.BackendApplication        : No active profile set, falling back to 1 default profile: "default"
2022-10-01 03:22:48.463  INFO 70218 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port(s): 8080 (http)
2022-10-01 03:22:48.473  INFO 70218 --- [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
2022-10-01 03:22:48.474  INFO 70218 --- [           main] org.apache.catalina.core.StandardEngine  : Starting Servlet engine: [Apache Tomcat/9.0.65]
2022-10-01 03:22:48.538  INFO 70218 --- [           main] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring embedded WebApplicationContext
2022-10-01 03:22:48.539  INFO 70218 --- [           main] w.s.c.ServletWebServerApplicationContext : Root WebApplicationContext: initialization completed in 675 ms
2022-10-01 03:22:48.794  INFO 70218 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8080 (http) with context path ''
2022-10-01 03:22:48.801  INFO 70218 --- [           main] action.in.blog.BackendApplication        : Started BackendApplication in 1.357 seconds (JVM running for 1.587)
```

##### API 요청 동작 과정

* 브라우저를 통해 `http://localhost:3000`에 접근합니다.
* 최초 렌더링 시 이전에 등록한 `TODO` 항목들을 가져오기 위해 `http://localhost:3000/todos`로 API 요청을 수행합니다. 
* 개발 서버는 프록시를 통해 `http://localhost:8080/todos`로 요청을 라우팅합니다.

<p align="center">
    <img src="/images/react-env-variable-setting-1.JPG" width="80%" class="image__border">
</p>

### 3.2. npm run build 명령어

`npm run build` 명령어에서 사용되는 `.env.production` 파일에 환경 변수를 선언하고 결과를 확인합니다. 

#### 3.2.1. .env.production

* 환경 변수 `REACT_APP_SERVER`에 `/api` 값을 지정합니다.

```
REACT_APP_SERVER=/api
```

#### 3.2.2. Dockerfile

* 프론트엔드 컨테이너 이미지를 만들 때 `npm run build` 명령어를 사용합니다.

```dockerfile
FROM node:16-buster-slim as builder

WORKDIR /app

COPY package.json .

RUN npm install --silent

COPY . .

RUN npm run build

FROM nginx

COPY conf/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### 3.2.3. nginx.conf

* 컨테이너 이미지를 만들 때 사용한 `nginx` 설정 파일입니다.
* 요청 경로에 `/api`가 있는 경우 나머지 경로와 파라미터는 유지한 채 `/api` 문자열만 제거합니다.
* 변경한 경로를 사용하여 `http://backend:8080/todos`로 요청을 재전달합니다.

```conf
upstream backend {
    server backend:8080;
}

server {
    listen 80;
    server_name frontend;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri /index.html;
    }
    
    location /api {
        rewrite ^/api(.*)$ $1?$args break;
        proxy_pass http://backend;
    }
}
```

#### 3.2.4. 컨테이너 실행

* 도커 컴포즈(compose)를 통해 컨테이너를 실행합니다.

```
$ docker-compose up -d 

[+] Building 4.5s (33/33) FINISHED
 => [2022-09-30-react-env-variable-setting-backend internal] load build definition from Dockerfile                                    0.0s
 => => transferring dockerfile: 32B                                                                                                   0.0s
 => [2022-09-30-react-env-variable-setting-frontend internal] load build definition from Dockerfile                                   0.0s
 => => transferring dockerfile: 32B                                                                                                   0.0s
 => [2022-09-30-react-env-variable-setting-backend internal] load .dockerignore                                                       0.0s
 => => transferring context: 2B                                                                                                       0.0s
 => [2022-09-30-react-env-variable-setting-frontend internal] load .dockerignore                                                      0.0s
 => => transferring context: 2B                                                                                                       0.0s
 => [2022-09-30-react-env-variable-setting-backend internal] load metadata for docker.io/library/openjdk:11-jdk-slim-buster           2.0s
 => [2022-09-30-react-env-variable-setting-backend internal] load metadata for docker.io/library/maven:3.8.6-jdk-11                   2.0s
 => [2022-09-30-react-env-variable-setting-frontend internal] load metadata for docker.io/library/nginx:latest                        1.9s
 => [2022-09-30-react-env-variable-setting-frontend internal] load metadata for docker.io/library/node:16-buster-slim                 2.0s
 => [auth] library/openjdk:pull token for registry-1.docker.io                                                                        0.0s
 => [auth] library/nginx:pull token for registry-1.docker.io                                                                          0.0s
 => [auth] library/maven:pull token for registry-1.docker.io                                                                          0.0s
 => [auth] library/node:pull token for registry-1.docker.io                                                                           0.0s
 => [2022-09-30-react-env-variable-setting-backend maven_build 1/6] FROM docker.io/library/maven:3.8.6-jdk-11@sha256:805f366910aea2a  0.0s
 => [2022-09-30-react-env-variable-setting-backend internal] load build context                                                       0.0s
 => => transferring context: 1.90kB                                                                                                   0.0s
 => [2022-09-30-react-env-variable-setting-backend stage-1 1/3] FROM docker.io/library/openjdk:11-jdk-slim-buster@sha256:863ce6f3c27  0.0s
 => [2022-09-30-react-env-variable-setting-frontend builder 1/6] FROM docker.io/library/node:16-buster-slim@sha256:0070b4ae6bfe264b7  0.0s
 => [2022-09-30-react-env-variable-setting-frontend stage-1 1/3] FROM docker.io/library/nginx@sha256:0b970013351304af46f322da1263516  0.0s
 => [2022-09-30-react-env-variable-setting-frontend internal] load build context                                                      2.3s
 => => transferring context: 3.20MB                                                                                                   2.2s
 => CACHED [2022-09-30-react-env-variable-setting-backend stage-1 2/3] WORKDIR /app                                                   0.0s
 => CACHED [2022-09-30-react-env-variable-setting-backend maven_build 2/6] WORKDIR /build                                             0.0s
 => CACHED [2022-09-30-react-env-variable-setting-backend maven_build 3/6] COPY pom.xml .                                             0.0s
 => CACHED [2022-09-30-react-env-variable-setting-backend maven_build 4/6] RUN mvn dependency:go-offline                              0.0s
 => CACHED [2022-09-30-react-env-variable-setting-backend maven_build 5/6] COPY src ./src                                             0.0s
 => CACHED [2022-09-30-react-env-variable-setting-backend maven_build 6/6] RUN mvn package -Dmaven.test.skip=true                     0.0s
 => CACHED [2022-09-30-react-env-variable-setting-backend stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar          0.0s
 => [2022-09-30-react-env-variable-setting-frontend] exporting to image                                                               0.0s
 => => exporting layers                                                                                                               0.0s
 => => writing image sha256:a57a2076bf7d956dc71138a1cb433fa1a13c0d38dbf6d1dda9f1de9b7fb4b85d                                          0.0s
 => => naming to docker.io/library/2022-09-30-react-env-variable-setting-backend                                                      0.0s
 => => writing image sha256:3ec93336920f7ac1fc96d3fd8db9926c034ecc1beb452cda42beb45966864d5d                                          0.0s
 => => naming to docker.io/library/2022-09-30-react-env-variable-setting-frontend                                                     0.0s
 => CACHED [2022-09-30-react-env-variable-setting-frontend stage-1 2/3] COPY conf/nginx.conf /etc/nginx/conf.d/default.conf           0.0s
 => CACHED [2022-09-30-react-env-variable-setting-frontend builder 2/6] WORKDIR /app                                                  0.0s
 => CACHED [2022-09-30-react-env-variable-setting-frontend builder 3/6] COPY package.json .                                           0.0s
 => CACHED [2022-09-30-react-env-variable-setting-frontend builder 4/6] RUN npm install --silent                                      0.0s
 => CACHED [2022-09-30-react-env-variable-setting-frontend builder 5/6] COPY . .                                                      0.0s
 => CACHED [2022-09-30-react-env-variable-setting-frontend builder 6/6] RUN npm run build                                             0.0s
 => CACHED [2022-09-30-react-env-variable-setting-frontend stage-1 3/3] COPY --from=builder /app/build /usr/share/nginx/html          0.0s
[+] Running 3/3
 ⠿ Network 2022-09-30-react-env-variable-setting_default       Created                                                                0.0s
 ⠿ Container 2022-09-30-react-env-variable-setting-backend-1   Started                                                                1.0s
 ⠿ Container 2022-09-30-react-env-variable-setting-frontend-1  Starte...                                                              1.1s 
```

##### API 요청 동작 과정

* 브라우저를 통해 `http://localhost:80`에 접근합니다.
* 최초 렌더링 시 이전에 등록한 `TODO` 항목들을 가져오기 위해 `http://localhost:80/api/todos`로 API 요청을 수행합니다. 
    * 환경 변수에 의해 `/api` 문자열이 경로 중간에 추가됩니다.
* `nginx` 서버는 해당 요청 경로에서 `/api` 문자열을 제거합니다.
* `nginx` 서버는 `http://backend:8080/todos`로 요청을 재전달합니다.

<p align="center">
    <img src="/images/react-env-variable-setting-2.JPG" width="80%" class="image__border">
</p>

### 3.3. npm test

`npm test` 명령어에서 사용되는 `.env.test` 파일에 환경 변수를 선언하고 결과를 확인합니다. 

#### 3.2.1. .env.test

* 환경 변수 `REACT_APP_SERVER`에 `/test` 값을 지정합니다.

```
REACT_APP_SERVER=/test
```

#### 3.2.2. 테스트 코드

다음은 테스트 코드입니다. 
`axios` 모듈을 목(mock)으로 감싸 특정 파라미터가 잘 전달되었는지 검증합니다. 

* `call post method with parameter` 테스트
    * `addTodo` 함수를 호출합니다.
    * `axios` 모듈에게 전달되는 요청 경로가 `/test/todo`일 것으로 예상합니다. 
* `call get method and return todos` 테스트
    * `getTodos` 함수를 호출합니다.
    * `axios` 모듈에게 전달되는 요청 경로가 `/test/todos`일 것으로 예상합니다.

```javascript
import axios from "axios";
import {addTodo, getTodos} from "./TodoRepository";

describe('TodoRepository Test', () => {

    test('call post method with parameter', () => {
        const post = jest.spyOn(axios, 'post')

        addTodo('Hello World')

        expect(post).nthCalledWith(1, '/test/todo', {title: 'Hello World'}, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
    })

    test('call get method and return todos', async () => {
        const get = jest.spyOn(axios, 'get').mockResolvedValue({
            data: [{id: '1', title: 'Hello World'}]
        })

        const todos = await getTodos()

        expect(get).nthCalledWith(1, '/test/todos')
        expect(todos[0].id).toEqual('1')
        expect(todos[0].title).toEqual('Hello World')
    })
})
```

##### 테스트 실행 결과

테스트가 정상적으로 통과합니다.

```
$ cd frontend && npm test -- --watchAll=false TodoRepository

> frontend@0.1.0 test
> react-scripts test "--watchAll=false" "TodoRepository"

 PASS  src/repository/TodoRepository.test.js
  TodoRepository Test
    ✓ call post method with parameter (22 ms)
    ✓ call get method and return todos (1 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        1.555 s
Ran all test suites matching /TodoRepository/i.
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-09-30-react-env-variable-setting>

#### REFERENCE

* <https://create-react-app.dev/docs/adding-custom-environment-variables/>

[react-proxy-link]: https://junhyunny.github.io/information/react/react-proxy/