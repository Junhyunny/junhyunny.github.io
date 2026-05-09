---
title: "파이썬 작업 단위 패턴(Python UnitOfWork Pattern)"
search: false
category:
  - python
  - design-pattern
  - unit-of-work-pattern
  - transaction
last_modified_at: 2026-05-09T12:08:07+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [파이썬 컨텍스트 매니저(Context Manager)와 with 키워드][python-with-keyword-and-context-manager-link]
- [파이썬 비동기 컨텍스트 매니저(Async Context Manager)와 async with 키워드][python-async-with-keyword-and-async-context-manager-link]
- [FastAPI Depends 함수를 통한 의존성 주입(DI)과 제어의 역전(IoC)][fast-api-depends-di-ioc-link]
- [레이어 아키텍처(Layered Architecture)][layered-architecture-link]
- [트랜잭션(transaction) ACID 특징][transcation-acid-link]

## 0. 들어가면서

AI 에이전트를 사용해서 [토이 프로젝트](https://github.com/Junhyunny/todo-agent)에서 파이썬 서버 개발을 하고 있다. FastAPI, SQLAlchemy 등 처음 사용해 보는 라이브러리가 많아서 공부할 게 많다. AI 에이전트가 없었으면 토이 프로젝트를 시작할 엄두도 안 났을 거다. 이번 글은 프로젝트 코드를 개선하기 위한 작업 단위(UnitOfWork) 디자인 패턴에 대해 정리했다.

## 1. UnitOfWork Pattern

작업 단위 패턴에 대해 알아보기 전에 왜 필요한지 살펴보자. 지금 프로젝트 코드를 보면 영속성 계층에서 트랜잭션을 커밋(transaction commit)하고 있다.

```python
  async def create(self, model: AgentEntity, tool_ids: list[str]) -> AgentEntity:
    ...
    self.session.add(new_model)
    await self.session.commit()
    return new_model
```

위 코드처럼 커밋을 영속성 계층에서 하는 것은 좋지 않다. [레이어 아키텍처(layered architecture)][layered-architecture-link]에서 서비스 계층 객체들은 영속성 계층 객체들과 협력해서 비즈니스 로직을 수행하고 변경 사항을 데이터베이스에 영속화한다. 서비스 계층에서 처리할 작업이 큰 경우 데이터 변경은 몇 차례 일어날 수 있다. 데이터 변경이 있을 때마다 영속성 계층에서 커밋을 만들면 서비스 계층의 큰 작업 흐름 중 에러가 발생했을 때 트랜잭션을 롤백(rollback)하는 것이 어려워진다.

스프링(spring) 프레임워크에서는 @Transactional 애너테이션만으로 쉽게 트랜잭션 경계를 지정할 수 있지만, FastAPI, SQLAlchemy를 사용하는 프로젝트에선 트랜잭션 경계를 개발자가 코드를 작성해서 직접 지정해줘야 한다. 이때 가장 많이 사용되는 디자인 패턴이 `작업 단위 패턴`이다.

`작업 단위 패턴`은 연관된 여러 번의 데이터베이스 연산을 하나의 트랜잭션으로 묶어 처리함으로써 [데이터의 무결성과 원자성][transcation-acid-link]을 보장하기 위한 추상화 패턴이다. 서비스 계층(비즈니스 로직)과 영속성 계층(데이터베이스 접근)을 완전히 분리하는 데 핵심적인 역할을 한다.

```python
from domain.uow import AbstractUnitOfWork

class OrderService:
    def __init__(self, uow: AbstractUnitOfWork):  # 의존성 주입
        self.uow = uow

    def place_order(self, user_id: int, items: list) -> Order:
        with self.uow: # 컨텍스트 매니저를 통한 자원 정리 및 에러 발생 시 롤백 처리
            order = Order.create(user_id, items)
            self.uow.orders.add(order)
            self.uow.commit() # 명시적 데이터베이스 커밋
        return order
```

작업 단위 패턴을 활용하면 여러 데이터베이스 작업을 원자적으로 처리할 수 있고, 그 밖의 장점도 있다. 트랜잭션 경계를 서비스 계층 외부(e.g. API, 컨트롤러 계층)에 두면, API 계층이 데이터베이스 세션과 저장소를 직접 다루게 되어 불필요한 결합이 발생한다. 트랜잭션을 관리하는 UoW(작업 단위) 객체를 서비스 계층 내부에 추상화(abstract)하여 배치하면, 외부의 API는 단순히 HTTP 요청과 관련된 처리에만 집중할 수 있다. 실제 비즈니스 로직과 트랜잭션 경계는 서비스 계층에 위임한다.

서비스 계층도 영속성 계층의 구현체를 직접 사용하지 않는다. 서비스 계층은 UoW 추상화에 의존하고, UoW 구현체가 ORM 같은 영속성 계층의 세부 기술을 다룬다. 이런 추상화를 통해 모듈 사이의 결합도를 낮춘다. [참고한 글](https://www.cosmicpython.com/book/chapter_06_uow.html)을 보면 추상 UoW도 레포지토리 추상화에 의존한다. 기술 스택을 직접 사용하는 하위 모듈에 직접 의존하지 않아서 기술에 대한 결합도를 낮춘다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/python-work-of-unit-pattern-01.png" width="100%" class="image__border image__padding">
</div>

<br/>

플라스크(flask) 프레임워크에 대해 잘 몰라서 확실하진 않지만, [위 예제](https://www.cosmicpython.com/book/chapter_06_uow.html)는 플라스크 프레임워크를 사용한 예제라서 그런지 API 계층에서 서비스 계층으로 UoW 객체를 초기화한 후 주입했다. FastAPI 프레임워크는 [Depends 함수][fast-api-depends-di-ioc-link]를 통해 의존성 주입이 가능하기 때문에 API 계층에서 서비스 계층 모듈에만 의존해도 된다.

## 2. Example

간단한 예제 코드를 통해 FastAPI 프로젝트에서 UoW 패턴을 적용한 코드를 살펴보자. 필요한 코드의 일부분만 살펴본다. 전체 코드는 [이 레포지토리](https://github.com/Junhyunny/blog-in-action/tree/master/2026-05-09-python-work-of-unit-pattern)에서 확인할 수 있다. 프로젝트의 패키지 구조는 다음과 같다.

```
.
├── Makefile
├── pyproject.toml
├── requirements.txt
├── src
│   ├── core
│   │   ├── __init__.py
│   │   ├── database.py
│   │   ├── repository.py
│   │   └── unit_of_work.py
│   ├── dependencies.py
│   ├── main.py
│   └── todo
│       ├── __init__.py
│       ├── model.py
│       ├── repository.py
│       ├── schema.py
│       ├── service.py
│       └── unit_of_work.py
└── test.sh
```

먼저 FastAPI 애플리케이션을 실행하고 API 엔드포인트 코드가 작성된 main.py 파일을 살펴보자. FastAPI 애플리케이션을 실행할 때 lifespan 기능을 통해 데이터베이스 스키마를 초기화한다.

```python
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request
from fastapi.responses import JSONResponse

from core.database import Base, engine
from dependencies import get_todo_service
from todo.schema import TodoCreate, TodoResponse, TodoUpdate
from todo.service import TodoService


@asynccontextmanager
async def lifespan(app: FastAPI):
  async with engine.begin() as conn:
    await conn.run_sync(Base.metadata.create_all)
  yield


app = FastAPI(title="Todo API", lifespan=lifespan)

...
```

다음 API 엔드포인트 코드를 살펴보자. API 계층에서 서비스 계층 객체는 Depends 함수를 통해 의존성 주입을 받는다.

```python
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request
from fastapi.responses import JSONResponse

from core.database import Base, engine
from dependencies import get_todo_service
from todo.schema import TodoCreate, TodoResponse, TodoUpdate
from todo.service import TodoService

...

@app.exception_handler(ValueError)
async def not_found_handler(request: Request, exc: ValueError):
  return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.get("/todos", response_model=list[TodoResponse])
async def get_todos(todo_service: TodoService = Depends(get_todo_service)):
  return await todo_service.get_all()


@app.get("/todos/{todo_id}", response_model=TodoResponse)
async def get_todo(todo_id: int, todo_service: TodoService = Depends(get_todo_service)):
  return await todo_service.get_by_id(todo_id)


@app.post("/todos", response_model=int, status_code=201)
async def create_todo(
  payload: TodoCreate, todo_service: TodoService = Depends(get_todo_service)
):
  return await todo_service.create(payload)


@app.patch("/todos/{todo_id}", response_model=None)
async def update_todo(
  todo_id: int,
  payload: TodoUpdate,
  todo_service: TodoService = Depends(get_todo_service),
):
  await todo_service.update(todo_id, payload)


@app.delete("/todos/{todo_id}", status_code=204)
async def delete_todo(
  todo_id: int, todo_service: TodoService = Depends(get_todo_service)
):
  await todo_service.delete(todo_id)
```

`todo/service.py` 파일에는 서비스 계층에 속하는 TodoService 클래스가 정의되어 있다. TodoService 객체를 생성할 때 UoW 객체를 주입받는다. AbstractUnitOfWork 추상 클래스를 사용해서 특정 기술에 종속된 구현 클래스에 대한 결합도를 낮춘다. 런타임에 적절한 객체를 주입받는다.

UoW 객체는 [비동기 컨텍스트 매니저(async context manager)][python-async-with-keyword-and-async-context-manager-link] 객체이기 때문에 `async with` 키워드를 통해 자동으로 세션을 열고 닫을 수 있다. 비즈니스 로직이 완료되면 명시적으로 트랜잭션 작업을 커밋한다. 조회만 수행하는 경우(read-only)에는 커밋 작업이 필요 없다.

```python
from core.unit_of_work import AbstractUnitOfWork
from todo.schema import TodoCreate, TodoResponse, TodoUpdate


class TodoService:
  def __init__(self, uow: AbstractUnitOfWork):
    self.uow = uow

  async def create(self, dto: TodoCreate) -> int:
    async with self.uow as uow:
      todo_id = await uow.todos.create(dto)
      await uow.commit()
    return todo_id

  async def get_all(self) -> list[TodoResponse]:
    async with self.uow as uow:
      todos = await uow.todos.get_all()
      return [TodoResponse.model_validate(todo) for todo in todos]

  async def get_by_id(self, todo_id: int) -> TodoResponse:
    async with self.uow as uow:
      todo = await uow.todos.get_by_id(todo_id)
      if todo is None:
        raise ValueError("Todo not found")
      return TodoResponse.model_validate(todo)

  async def update(self, todo_id: int, dto: TodoUpdate) -> None:
    async with self.uow as uow:
      await uow.todos.update(todo_id, dto)
      await uow.commit()

  async def delete(self, todo_id: int) -> None:
    async with self.uow as uow:
      await uow.todos.delete(todo_id)
      await uow.commit()
```

`core/unit_of_work.py` 파일에 정의된 AbstractUnitOfWork 추상 클래스를 살펴보자. 주요 코드는 다음과 같다.

- AbstractTodoRepository 추상 클래스 타입의 인스턴스 속성(attribute)
  - 추상 클래스 타입의 레포지토리 인스턴스 속성을 정의한다.
  - 서비스 계층 객체들은 AbstractUnitOfWork 추상 클래스의 인스턴스 속성을 통해 레포지토리 추상화의 기능을 사용할 수 있다.
- `__aexit__` 함수
  - 비동기 컨텍스트 매니저 객체의 리소스를 정리할 때 자동으로 롤백을 수행한다.
  - 이를 통해 서비스 계층에서 명시적 커밋이 없는 경우 자동으로 트랜잭션이 롤백되도록 한다.

```python
from abc import ABC, abstractmethod

from core.repository import AbstractTodoRepository


class AbstractUnitOfWork(ABC):
  todos: AbstractTodoRepository # 서비스 계층에서 레포지토리 추상화의 기능을 사용할 수 있게 만드는 장치

  async def __aenter__(self):
    return self

  async def __aexit__(self, _exc_type, _exc_val, _exc_tb):
    await self.rollback() # 자동 롤백

  @abstractmethod
  async def commit(self):
    raise NotImplementedError

  @abstractmethod
  async def rollback(self):
    raise NotImplementedError
```

`todo/unit_of_work.py` 파일에 정의된 SQLAlchemyUnitOfWork 클래스를 살펴보자. SQLAlchemyUnitOfWork 클래스는 AbstractUnitOfWork 추상 클래스의 구현체다. 구현 클래스는 실제 영속성 계층에서 사용하는 라이브러리인 `SQLAlchemy`에 의존한다. SQLAlchemyUnitOfWork 객체가 생성될 때 세션 팩토리(session factory) 객체를 의존성으로 주입받는다. 주요 코드는 다음과 같다.

- `__aenter__` 함수
  - `async with` 진입점에서 실행된다.
  - 새로운 세션을 생성하고 AbstractTodoRepository 추상 클래스의 구현체인 SQLAlchemyTodoRepository 객체를 생성한다.
- `__aexit__` 함수
  - `async with` 코드 블록이 끝나는 시점에 실행된다.
  - 부모 클래스인 AbstractUnitOfWork 클래스의 `__aexit__` 함수를 통해 명시적 커밋이 없는 경우 자동으로 트랜잭션을 롤백한다.
  - 사용한 세션을 닫는 작업을 수행한다.
- commit 함수
  - 세션 객체를 통해 트랜잭션을 커밋한다.
- rollback 함수
  - 세션 객체를 통해 트랜잭션을 롤백한다.

```python
from typing import Callable

from sqlalchemy.ext.asyncio import AsyncSession

from core.unit_of_work import AbstractUnitOfWork
from todo.repository import SQLAlchemyTodoRepository


class SQLAlchemyUnitOfWork(AbstractUnitOfWork):
  def __init__(self, async_session_factory: Callable[[], AsyncSession]):
    self.async_session_factory = async_session_factory
    self.session: AsyncSession | None = None

  async def __aenter__(self):
    self.session = self.async_session_factory()
    self.todos = SQLAlchemyTodoRepository(self.session)
    return await super().__aenter__()

  async def __aexit__(self, exc_type, exc_val, exc_tb):
    await super().__aexit__(exc_type, exc_val, exc_tb)
    await self.session.close()

  async def commit(self):
    await self.session.commit()

  async def rollback(self):
    await self.session.rollback()
```

`todo/repository.py` 파일에 정의된 SQLAlchemyTodoRepository 클래스 코드를 살펴보자. SQLAlchemyTodoRepository 클래스는 AbstractTodoRepository 추상 클래스를 상속받았다. 트랜잭션의 경계는 서비스 계층에서 UoW 객체를 통해 관리하기 때문에 레포지토리 객체는 데이터베이스 커밋과 롤백에 관련된 작업을 신경 쓰지 않는다.

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.repository import AbstractTodoRepository
from todo.model import Todo
from todo.schema import TodoCreate, TodoUpdate


class SQLAlchemyTodoRepository(AbstractTodoRepository):
  def __init__(self, session: AsyncSession):
    self.session = session

  async def create(self, dto: TodoCreate) -> int:
    todo = Todo(title=dto.title, description=dto.description)
    self.session.add(todo)
    await self.session.flush()
    return todo.id

  async def get_all(self) -> list[Todo]:
    result = await self.session.execute(select(Todo))
    return result.scalars().all()

  async def get_by_id(self, todo_id: int) -> Todo | None:
    result = await self.session.execute(select(Todo).filter(Todo.id == todo_id))
    return result.scalars().first()

  async def update(self, todo_id: int, dto: TodoUpdate) -> None:
    result = await self.session.execute(select(Todo).filter(Todo.id == todo_id))
    todo = result.scalars().first()
    if not todo:
      raise ValueError("Todo not found")
    if dto.title is not None:
      todo.title = dto.title
    if dto.description is not None:
      todo.description = dto.description
    if dto.completed is not None:
      todo.completed = dto.completed

  async def delete(self, todo_id: int) -> None:
    result = await self.session.execute(select(Todo).filter(Todo.id == todo_id))
    todo = result.scalars().first()
    if not todo:
      raise ValueError("Todo not found")
    await self.session.delete(todo)
```

core/database.py 코드를 살펴보자. 세션 팩토리 객체는 SQLAlchemy 패키지의 async_sessionmaker 함수를 통해 생성한다.

```python
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

DATABASE_URL = "sqlite+aiosqlite:///./todos.db"

engine = create_async_engine(DATABASE_URL)
DEFAULT_ASYNC_SESSION_FACTORY = async_sessionmaker(
  autocommit=False, autoflush=False, bind=engine
)
```

dependencies.py 코드를 살펴보자. 의존성 주입은 팩토리 함수들(factory functions)을 통해 수행한다. HTTP 요청이 들어올 때마다 Depends 함수를 통해 객체 생성 및 의존성 주입이 이뤄지기 때문에 요청마다 새로운 세션 객체가 만들어지고, 비즈니스 로직이 완료되면 세션이 닫히는 구조가 된다.

```python
from fastapi import Depends

from core.database import DEFAULT_ASYNC_SESSION_FACTORY
from todo.service import TodoService
from todo.unit_of_work import SQLAlchemyUnitOfWork


def get_unit_of_work() -> SQLAlchemyUnitOfWork:
  return SQLAlchemyUnitOfWork(DEFAULT_ASYNC_SESSION_FACTORY)


def get_todo_service(
  unit_of_work: SQLAlchemyUnitOfWork = Depends(get_unit_of_work),
) -> TodoService:
  return TodoService(unit_of_work)
```

최종적으로 구성된 의존 관계 그래프는 다음과 같다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/python-work-of-unit-pattern-02.png" width="100%" class="image__border">
</div>

## 3. Run and test application

애플리케이션을 실행한 후 정상적으로 CRUD 작업이 수행되는지 살펴보자. 파이썬 가상 환경을 만든다.

```
$ python3 -m venv .venv
```

가상 환경을 활성화한다.

```
$ source .venv/bin/activate
```

필요한 의존성을 설치한다.

```
$ pip install -r requirements.txt
```

Makefile에 정의한 스크립트를 통해 애플리케이션을 실행한다.

```
$ make run
```

새 터미널 세션에서 미리 준비한 셸 스크립트를 실행한다.

```
$ sh test.sh
```

위 셸 스크립트를 실행하면 CRUD 작업이 정상적으로 동작하는 것을 확인할 수 있다.

```
=== POST /todos (create first) ===
HTTP status: 201
1

=== POST /todos (create second) ===
HTTP status: 201
2

=== GET /todos (list all) ===
HTTP status: 200
[
    {
        "id": 1,
        "title": "Buy groceries",
        "description": "Milk, eggs, bread",
        "completed": false
    },
    {
        "id": 2,
        "title": "Read book",
        "description": "Clean Code",
        "completed": false
    }
]

=== GET /todos/1 (get by id) ===
HTTP status: 200
{
    "id": 1,
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "completed": false
}

=== PATCH /todos/1 (update) ===
HTTP status: 200
null

=== GET /todos/1 (verify update) ===
HTTP status: 200
{
    "id": 1,
    "title": "Buy groceries and cook",
    "description": "Milk, eggs, bread",
    "completed": true
}

=== DELETE /todos/2 ===
HTTP status: 204

=== GET /todos (verify delete) ===
HTTP status: 200
[
    {
        "id": 1,
        "title": "Buy groceries and cook",
        "description": "Milk, eggs, bread",
        "completed": true
    }
]

=== GET /todos/999 (not found) ===
HTTP status: 404
{
    "detail": "Todo not found"
}
```

## CLOSING

서비스 계층에서 명시적으로 커밋하는 코드를 주석 처리한다면, 트랜잭션이 자동으로 롤백되어 데이터가 데이터베이스에 저장되지 않는 것을 확인할 수 있다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-05-09-python-work-of-unit-pattern>

#### REFERENCE

- <https://www.cosmicpython.com/book/chapter_06_uow.html>
- <https://monsterkos.tistory.com/27>
- <https://hajinnote.tistory.com/115>

[python-with-keyword-and-context-manager-link]: https://junhyunny.github.io/python/with/context-manager/python-with-keyword-and-context-manager/
[python-async-with-keyword-and-async-context-manager-link]: https://junhyunny.github.io/python/async-with/async-context-manager/python-async-with-keyword-and-async-context-manager/
[fast-api-depends-di-ioc-link]: https://junhyunny.github.io/fast-api/dependency-injection/inversion-of-control/fast-api-depends-di-ioc/
[layered-architecture-link]: https://junhyunny.github.io/architecture/pattern/layered-architecture/
[transcation-acid-link]: https://junhyunny.github.io/information/database/acid/transaction/transcation-acid/
