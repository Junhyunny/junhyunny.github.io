---
title: "FastAPI Depends 함수를 통한 의존성 주입(DI)과 제어의 역전(IoC)"
search: false
category:
  - fast-api
  - dependency-injection
  - inversion-of-control
last_modified_at: 2026-04-30T16:51:47+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [스프링 프레임워크의 제어의 역전(IoC)과 의존성 주입(DI)][spring-ioc-di-link]
- [파이썬 제너레이터(Python Generator)][python-generator-function-link]
- [파이썬 GIL(Global Interpreter Lock)와 asyncio 라이브러리][python-global-intpreter-lock-and-asynchronous-link]

## 0. 들어가면서

[토이 프로젝트](https://github.com/Junhyunny/todo-agent)에서 랭체인(langchain)을 사용한 AI 에이전트 애플리케이션을 만들어 보고 있다. AI 에이전트 개발과 관련된 프레임워크를 공부하고 싶었기 때문에 가장 대중적인 랭체인을 선택했다. 단순한 예제가 아니라 실제로 직접 사용할 만큼 가치가 있는 애플리케이션을 만들고 싶었기 때문에 클라이언트-서버 구조를 도입했다. 그러면서 자연스럽게 인기가 많은 FastAPI 서버 프레임워크를 사용하게 됐다.

개발자 인생에서 스프링(spring) 외에 서버 프레임워크를 자세히 들여다보는 게 처음인 것 같다. FastAPI 프레임워크를 사용하면서 받은 인상은 스프링 프레임워크만큼 강력한 애플리케이션 컨텍스트 관리 기능이 없어 개발자가 필요한 구현을 전부 해 줘야 한다는 점이 불편했다는 것이다. 트랜잭션 관리, 객체 생성 및 의존성 주입 등도 직접 해 줘야 해서 손이 많이 간다. 새로운 기술을 배워 재미있기도 하지만, 불편하다는 감정도 함께 든다. 스프링의 마법 같은 기능들이 그리워진다.

이번 글은 FastAPI 프레임워크에서 의존성을 주입하는 방법에 대해 정리해 봤다.

## 1. Dependency Injection and Inversion of Control

의존성 주입(DI, Dependency Injection)과 제어의 역전(IoC, Inversion of Control)에 대해 조금 정리하고 글을 시작하면 좋을 것 같다. 의존(dependency)이란 어떤 객체가 다른 객체의 기능을 필요로 해서 사용하는 것을 의미한다. 예를 들어, 아래 코드는 Service 객체가 FileSystemRepository 객체의 저장(save) 기능에 의존하는 모습이다. 이런 경우 'Service 객체는 FileSystemRepository 객체에 의존한다(depend)'라고 표현한다.

```python
class Service:
  def __init__(self):
    self.repository = FileSystemRepository()

  def save_data(self, data: str):
    self.repository.save(data)


class FileSystemRepository:
  def save(self, data: str):
    print(f"saving data in file system: {data}")
```

클래스 다이어그램으로 그려보면 다음과 같이 표현할 수 있다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/fast-api-depends-di-ioc-01.png" width="100%" class="image__border">
</div>

<br/>

위 코드는 Service 객체와 FileSystemRepository 객체가 강하게 결합(coupling)되어 있다. Service 객체가 자신이 필요한 의존성인 FileSystemRepository 객체를 직접 생성해서 사용하고 있기 때문이다. 예를 들어, 현재는 파일 시스템에 데이터를 저장하고 있지만, 데이터베이스를 사용하게 된다면 어떻게 될까? 데이터베이스에 연결하기 위한 DatabaseRepository 클래스를 작성하고, 해당 Service 객체는 DatabaseRepository 객체를 만들어 사용해야 한다.

```python
class Service:
  def __init__(self):
    self.repository = DatabaseRepository() # 변경 발생

  def save_data(self, data: str):
    self.repository.save(data)


class DatabaseRepository:
  def save(self, data: str):
    print(f"saving data in database: {data}")
```

클래스 다이어그램으로 살펴보자. 데이터베이스와 관련된 새로운 기능이 추가되었고, Service 클래스에 코드 변경이 발생했다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/fast-api-depends-di-ioc-02.png" width="100%" class="image__border">
</div>

<br/>

좋은 설계를 위해 알아야 하는 개념들, 예를 들어 유명한 SOLID 원칙이나 흔히 말하는 결합도(coupling), 응집도(cohesion)라는 개념, 수많은 디자인 패턴의 근간에는 **'코드 변경이 발생하는 영역(scope)을 줄이고, 영향도를 줄이자'**는 생각이 깔려 있다. 아무리 작은 코드 변경이더라도 문제가 발생할 여지가 있기 때문이다. 그렇다면 의존 관계의 변화가 필요할 때 어떻게 하면 코드의 변화를 줄일 수 있을까?

인터페이스(interface)와 의존성 주입을 통해 컴포넌트 간 결합도를 낮추고, 코드 변화의 영향도를 줄일 수 있다. 구체적인 구현 방식을 인터페이스 뒤로 숨겨 보자. 파이썬은 인터페이스가 없어서 추상 클래스를 사용한다.

```python
from abc import ABC, abstractmethod


class Repository(ABC):
  @abstractmethod
  def save(self, data: str):
    pass


class FileSystemRepository(Repository):
  def save(self, data: str):
    print(f"saving data in file system: {data}")


class DatabaseRepository(Repository):
  def save(self, data: str):
    print(f"saving data in database: {data}")


class Service:
  def __init__(self, repository: Repository):
    self.repository = repository

  def save_data(self, data: str):
    self.repository.save(data)
```

Service 객체는 Repository 추상 클래스에 의존하고, 외부로부터 주입받기 때문에 Repository 인스턴스가 실제로 어떤 객체인지 관심이 없다. Repository 인스턴스의 기능이 확장되더라도 Service 클래스의 코드를 변경할 필요가 없다. 이 변경으로 인해 애플리케이션은 하위 모듈에 직접 의존하지 않고 추상화된 계층을 참조하는 의존성 역전 원칙(DIP, Dependency Inversion Principle)을 따르게 된다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/fast-api-depends-di-ioc-03.png" width="100%" class="image__border">
</div>

<br/>

좋다. 그런데 의존성 주입은 어떻게 해야 할까? 결국 Service 객체에 필요한 Repository 인스턴스를 누군가 만들어 넣어 줘야 한다. 이런 작업을 해 주는 것이 FastAPI 프레임워크의 역할이다. 개발자가 직접 의존성 주입을 위한 코드를 작성하고, 의존 관계를 제어하는 것이 아니다. 프레임워크가 객체 생성을 제어하고, 필요한 의존성 간의 연결을 도와준다면 의존성 주입을 통해 각 컴포넌트 간 결합도를 낮출 수 있다. 이를 제어의 역전(IoC, Inversion of Control)이라고 한다.

## 2. Depends function

서론이 길었다. 이제 본격적으로 FastAPI 프레임워크에서 의존성 주입을 하는 방법에 대해 알아보자. FastAPI 프레임워크에서는 의존성 주입을 위해 **Depends 함수**를 사용한다. 라우트 함수(API 엔드포인트)의 매개변수에 기본값으로 설정하여 의존성을 주입할 수 있다.

Depends 함수는 다른 함수나 클래스 같은 '호출 가능한 객체(Callable)'를 단일 매개변수로 전달한다. 개발자가 함수를 직접 호출하는 것이 아니라 함수 객체 자체만 전달하면, API 요청이 들어왔을 때 FastAPI 프레임워크가 해당 함수를 올바른 매개변수와 함께 대신 실행해 준다.

글로만 읽어서는 이해가 어려우니 예제 코드를 함께 살펴보자. fastapi 패키지에서 Depends 함수를 가져와 사용한다. 파이썬에서 클래스도 Callable 객체이기 때문에 Depends 함수에 클래스 이름을 전달해도 된다.

- / 경로로 요청이 들어오면 FastAPI 프레임워크에 의해 TodoService 객체가 생성되어 get_all 함수에 주입된다.

```python
from fastapi import Depends, FastAPI

app = FastAPI()


class TodoService:
  def get_all(self) -> list[str]:
    return ["todo1", "todo2", "todo3"]


@app.get("/")
async def get_all(todo_service: TodoService = Depends(TodoService)) -> list[str]:
  return todo_service.get_all()
```

의존성을 주입하는 방법은 두 가지가 있다.

- 함수 주입 방법
  - 가장 일반적인 방법이다. 함수 내부에서 객체를 반환하면서 필요한 로직이 있다면 함께 수행할 수 있다.
  - 예를 들어, 함수에서 데이터베이스 세션을 생성하거나 토큰을 검증하는 등의 로직을 작성할 수 있다.
  - yield 키워드를 사용하는 제너레이터 함수를 주입하면, 메인 로직이 끝난 후 필요한 마무리 작업까지 알아서 처리할 수 있다.
- 클래스 주입 방법
  - 클래스를 전달하면 해당 클래스의 생성자(__init__)가 호출되어 새로운 인스턴스가 주입된다.
  - 코드 중복을 피하기 위해 `매개변수: 클래스명 = Depends()`처럼 타입 추론을 통해 Depends 내부의 인자를 생략하는 축약형 문법도 지원한다.

클래스 주입 방법은 위에서 살펴봤으니 함수 주입 방법을 살펴보자. FastAPI 프레임워크에서는 이 방법을 주로 사용하는 것 같다. 지금부터 아래와 같은 의존성 체인이 있을 때 Depends 함수를 사용해 의존성 객체들을 연결하는 코드를 살펴보자.

```
Router
  └─ Depends(get_todo_service)
       └─ Depends(get_todo_repository)
            └─ Depends(get_session)
                 └─ async_session_factory
```

엔드포인트 역할을 수행하는 라우터부터 코드를 살펴보자. get_todo_service 함수를 사용해서 TodoService 객체를 주입받는다. 엔드포인트에서부터 의존성 체인을 연결한다.

```python
from fastapi import Depends, FastAPI

from dependencies import get_todo_service
from todo_service import TodoService

app = FastAPI()


@app.get("/")
async def read_root(todo_service: TodoService = Depends(get_todo_service)) -> list[str]:
  return todo_service.get_all()
```

TodoService 클래스를 살펴보자. TodoRepository 객체를 주입받는다.

```python
from todo_repository import TodoRepository


class TodoService:
  def __init__(self, repository: TodoRepository):
    self.repository = repository

  def get_all(self):
    return self.repository.get_all()
```

TodoRepository 클래스도 마찬가지로 외부에서 세션 객체를 주입받는 방식으로 코드를 작성한다.

```python
from database import DatabaseSession


class TodoRepository:
  def __init__(self, session: DatabaseSession):
    self.session = session

  def get_all(self):
    return ["todo1", "todo2", "todo3"]
```

의존성 체인을 구성할 각 클래스를 살펴봤으니 의존성 객체들을 실제로 주입하는 팩토리 함수들을 작성해 보자. 각 팩토리 함수마다 FastAPI 프레임워크로부터 필요한 의존 객체를 주입받기 위해 Depends 함수를 사용한다. Depends 함수에 팩토리 함수를 전달한다.

```python
from typing import AsyncGenerator

from fastapi import Depends

from database import DatabaseSession
from todo_repository import TodoRepository
from todo_service import TodoService


async def get_session() -> AsyncGenerator[DatabaseSession, None]:
  async with DatabaseSession() as session:
    yield session


def get_todo_repository(session: DatabaseSession = Depends(get_session)):
  return TodoRepository(session=session)


def get_todo_service(repository: TodoRepository = Depends(get_todo_repository)):
  return TodoService(repository=repository)
```

위 코드에서 get_session 함수를 보면 단순히 객체를 생성해서 yield 키워드로 반환하는 제너레이터가 아니다. `async with` 키워드를 통해 세션을 열고 닫는 작업을 요청이 마무리될 때 자동으로 수행한다.

`async with` 키워드를 사용했을 때 호출되는 `__aenter__`, `__aexit__` 함수를 DatabaseSession 클래스에 작성하고, 실제로 세션을 열고 닫는 작업이 수행되는지 로그를 통해 확인해 보자.

```python
class DatabaseSession:
  def __init__(self):
    print("[ 세션 생성 ]")
    pass

  async def __aenter__(self):
    print("[ 세션 열림 ]")
    return self

  async def __aexit__(self, exc_type, exc_val, exc_tb):
    print("[ 세션 닫힘 ]")
```

의존성 주입까지 완료되었으니 애플리케이션을 실행하고 요청을 보내면 다음과 같은 로그를 볼 수 있다.

```
[ 세션 생성 ]
[ 세션 열림 ]
INFO:     127.0.0.1:52160 - "GET / HTTP/1.1" 200 OK
[ 세션 닫힘 ]
```

## 3. Dependency Caching

하나의 HTTP 요청 안에서 동일한 의존성이 여러 번 필요할 경우, FastAPI 프레임워크는 기본적으로 해당 의존성 함수를 한 번만 실행하고 그 결괏값을 캐싱하여 나머지 의존성 호출에 재사용한다. 예제 코드를 통해 살펴보자.

- TodoService 객체는 TodoRepository 객체와 ReplyRepository 객체에 의존하도록 변경한다.
- TodoRepository 객체와 ReplyRepository 객체 모두 세션 객체를 주입받는다.

```python
def get_todo_repository(session: DatabaseSession = Depends(get_session)):
  return TodoRepository(session=session)


def get_reply_repository(session: DatabaseSession = Depends(get_session)):
  return ReplyRepository(session=session)


def get_todo_service(
  todo_repository: TodoRepository = Depends(get_todo_repository),
  reply_repository: ReplyRepository = Depends(get_reply_repository),
):
  return TodoService(todo_repository=todo_repository, reply_repository=reply_repository)
```

애플리케이션을 실행한 후 요청을 보내면 다음과 같은 로그를 확인할 수 있다.

- 세션 생성이 1회만 수행된다.

```
[ 세션 생성 ]
[ 세션 열림 ]
INFO:     127.0.0.1:52238 - "GET / HTTP/1.1" 200 OK
[ 세션 닫힘 ]
```

만약 매번 새롭게 함수를 실행해야 하는 특별한 상황이라면 `Depends(의존성, use_cache=False)`로 설정하여 이 캐싱 동작을 끌 수도 있다. 아래 코드처럼 캐시를 끄면 어떨까?

```python
def get_todo_repository(
  session: DatabaseSession = Depends(get_session, use_cache=False),
):
  return TodoRepository(session=session)


def get_reply_repository(
  session: DatabaseSession = Depends(get_session, use_cache=False),
):
  return ReplyRepository(session=session)


def get_todo_service(
  todo_repository: TodoRepository = Depends(get_todo_repository),
  reply_repository: ReplyRepository = Depends(get_reply_repository),
):
  return TodoService(todo_repository=todo_repository, reply_repository=reply_repository)
```

애플리케이션을 실행한 후 요청을 보내면 다음과 같은 로그를 확인할 수 있다.

- 세션 생성, 열림, 닫힘이 각각 2회 수행된다.

```
[ 세션 생성 ]
[ 세션 열림 ]
[ 세션 생성 ]
[ 세션 열림 ]
INFO:     127.0.0.1:52311 - "GET / HTTP/1.1" 200 OK
[ 세션 닫힘 ]
[ 세션 닫힘 ]
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-04-30-fast-api-depends-di-ioc>

#### REFERENCE

- <https://fastapi.tiangolo.com/tutorial/dependencies/>
- <https://fastapi.tiangolo.com/reference/dependencies/>
- <https://probehub.tistory.com/62>
- <https://jimmy-ai.tistory.com/467>
- <https://wikidocs.net/176223>

[spring-ioc-di-link]: https://junhyunny.github.io/spring-boot/design-pattern/spring-ioc-di/
[python-generator-function-link]: https://junhyunny.github.io/python/generator-function/python-generator-function/
[python-global-intpreter-lock-and-asynchronous-link]: https://junhyunny.github.io/python/generator-function/async-await/asynchronous-task/python-global-intpreter-lock-and-asynchronous/
