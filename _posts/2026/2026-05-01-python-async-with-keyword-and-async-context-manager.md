---
title: "파이썬 비동기 컨텍스트 매니저(Async Context Manager)와 async with 키워드"
search: false
category:
  - python
  - async-with
  - async-context-manager
last_modified_at: 2026-05-01T16:33:47+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [파이썬 제너레이터(Python Generator)][python-generator-function-link]
- [파이썬 GIL(Global Interpreter Lock)와 asyncio 라이브러리][python-global-intpreter-lock-and-asynchronous-link]
- [파이썬 컨텍스트 매니저(Context Manager)와 with 키워드][python-with-keyword-and-context-manager-link]

## 0. 들어가면서

이전 글에서는 [동기식 컨텍스트 매니저(context manager)][python-with-keyword-and-context-manager-link]를 다뤘다. 이번 글에서는 비동기 컨텍스트 매니저에 대해 정리해 보려 한다.

## 1. Async Context Manager

파이썬 비동기 컨텍스트 매니저(Async Context Manager)는 네트워크 요청, 데이터베이스 쿼리, 파일 입출력처럼 대기 시간이 발생하는 **비동기 리소스**를 안전하고 효율적으로 할당하고 해제하기 위해 사용하는 파이썬 기능이다. 기존의 `with` 구문 대신 `async with` 구문과 함께 사용된다.

비동기 컨텍스트 매니저는 리소스를 얻거나 반납하는 과정에서 `await`가 필요한 경우에 유용하다. 코드 블록에 진입하기 전에는 비동기 초기화 작업을 수행하고, 블록을 빠져나올 때는 예외 발생 여부와 관계없이 비동기 정리 작업을 수행한다.

비동기 컨텍스트 매니저는 `__aenter__()`와 `__aexit__()`라는 [코루틴(Coroutine) 메서드][python-global-intpreter-lock-and-asynchronous-link]를 구현하여 동작한다. 이 메서드들은 내부적으로 `await`를 통해 실행되므로, 리소스를 준비하거나 해제하는 동안 프로그램이 블로킹(blocking)되지 않고 다른 비동기 작업을 처리할 수 있게 해준다.

핵심 동작 원리를 살펴보자. 비동기 컨텍스트 매니저는 내부적으로 다음 두 가지 메서드를 통해 동작한다.

- `__aenter__()` 메서드
  - `async with` 블록에 진입할 때 자동으로 호출되고 `await`되는 메서드다.
  - 여기서 비동기 연결을 열거나 락(lock)을 획득하는 작업을 수행한다. 반환된 값은 `as` 키워드 뒤에 지정된 대상 변수에 바인딩되어 블록 안에서 사용된다.
- `__aexit__()` 메서드
  - `async with` 블록을 빠져나올 때 자동으로 호출되고 `await`되는 메서드다.
  - 정상 종료뿐만 아니라 예외가 발생했을 때도 호출된다. 비동기 연결을 닫거나 비동기 락을 해제하는 등 사용한 리소스의 비동기 뒷정리를 담당한다.
  - 동기식 컨텍스트 매니저와 마찬가지로, 블록 내부에서 예외가 발생했을 경우 예외 정보(exc_type, exc_value, traceback)를 받아 이를 상위로 전파할지, 무시하고 처리할지 결정할 수 있다.

비동기 컨텍스트 매니저도 특별한 타입이 아니라, `__aenter__()`와 `__aexit__()` 두 메서드를 구현한 객체다. `async with` 문은 이 두 메서드를 적절한 시점에 호출하고 `await`하는 문법적 설탕(syntactic sugar)이라고 볼 수 있다. 비동기 컨텍스트 매니저는 아래 이미지처럼 동작한다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/python-async-with-keyword-and-async-context-manager-01.png" width="100%" class="image__border image__background_black">
</div>

<br/>

## 2. Practice

비동기 컨텍스트 매니저의 동작 과정을 확인하기 위해 간단한 예제 코드를 살펴보자. 먼저 비동기 세션을 열고 닫는 역할을 수행하는 `AsyncSessionManager` 클래스를 정의한다.

```python
import asyncio


class AsyncSessionManager:
  def __init__(self):
    self.session = "async session"
    print("initialize async session manager")

  async def __aenter__(self):
    print("open async session manager")
    await asyncio.sleep(0.1)
    return self.session

  async def __aexit__(self, exc_type, exc_value, exc_traceback):
    if exc_type:
      print(f"handle exception: {exc_type}, {exc_value}, {exc_traceback}")
    await asyncio.sleep(0.1)
    print("close async session manager")
```

`__aexit__()` 메서드를 보면 세 개의 파라미터가 있다. 동기식 컨텍스트 매니저의 `__exit__()` 메서드와 동일하게 예외 정보를 전달받는다.

- exc_type
  - 발생한 예외의 클래스 타입.
- exc_value
  - 발생한 예외의 실제 인스턴스(에러 메시지 등).
- traceback
  - 에러 발생 위치를 추적할 수 있는 트레이스백 객체.
  - 비동기 컨텍스트 매니저는 전달받은 이 인자들을 통해 에러를 분석하고 어떻게 처리할지 결정할 수 있다.

위 비동기 컨텍스트 매니저를 `async with` 블록 없이 직접 호출하면 다음과 같이 작성할 수 있다.

```python
import asyncio
from async_session_manager import AsyncSessionManager


async def main():
  manager = AsyncSessionManager()
  try:
    m = await manager.__aenter__()
    print(f"do something with {m}")
  finally:
    await manager.__aexit__(None, None, None)


asyncio.run(main())
```

위 코드를 실행하면 다음과 같은 로그를 볼 수 있다.

```
initialize async session manager
open async session manager
do something with async session
close async session manager
```

위 코드는 `async with` 블록을 사용하면 단순해진다. `async with ... as` 문법을 통해 보일러플레이트(boilerplate) 같은 try/finally 블록이 사라진다. `__aenter__()`, `__aexit__()` 메서드가 자동으로 실행되고 `await`된다.

```python
import asyncio
from async_session_manager import AsyncSessionManager


async def main():
  async with AsyncSessionManager() as m:
    print(f"do something with {m}")


asyncio.run(main())
```

위 코드를 실행하면 이전과 동일한 로그를 확인할 수 있다.

```
initialize async session manager
open async session manager
do something with async session
close async session manager
```

로직 중간에 예외가 발생하면 어떨까? `async with` 블록이 없는 경우 다음과 같은 예외 처리 로직이 필요하다.

```python
import sys
import asyncio
from async_session_manager import AsyncSessionManager


async def main():
  manager = AsyncSessionManager()
  try:
    m = await manager.__aenter__()
    print(f"do something with {m}")
    raise Exception("something went wrong")
  except:
    await manager.__aexit__(*sys.exc_info())
    raise
  else:
    await manager.__aexit__(None, None, None)


asyncio.run(main())
```

위 코드를 실행하면 다음과 같은 로그를 확인할 수 있다. 비동기 컨텍스트 매니저의 `__aexit__()` 메서드 내부에서 예외 객체가 있는지 확인하고 적절한 처리를 수행한다.

```
python example-03.py
initialize async session manager
open async session manager
do something with async session
handle exception: <class 'Exception'>, something went wrong, <traceback object>
close async session manager
Traceback (most recent call last):
  File "example-03.py", line 11, in main
    raise Exception("something went wrong")
Exception: something went wrong
```

`async with` 블록을 사용하면 위와 같은 예외 처리 블록이 별도로 필요 없다.

```python
import asyncio
from async_session_manager import AsyncSessionManager


async def main():
  async with AsyncSessionManager() as m:
    print(f"do something with {m}")
    raise Exception("something went wrong")


asyncio.run(main())
```

위 코드를 실행하면 이전과 동일한 로그를 볼 수 있다.

```
initialize async session manager
open async session manager
do something with async session
handle exception: <class 'Exception'>, something went wrong, <traceback object>
close async session manager
Traceback (most recent call last):
  File "example-04.py", line 8, in main
    raise Exception("something went wrong")
Exception: something went wrong
```

비동기 컨텍스트 매니저와 `async with` 블록을 사용할 때 예외가 발생하면 `__aexit__()` 메서드의 반환 값에 따라 예외를 전파할지 무시할지(suppress)가 결정된다. `True` 값을 반환하면 필요한 예외 처리가 `__aexit__()` 메서드 내부에서 처리되었다고 판단하여 예외를 전파하지 않는다. `False` 값이나 반환 값이 없는 경우에는 그대로 예외를 전파한다.

`AsyncSessionManager` 컨텍스트 매니저 객체의 `__aexit__()` 메서드에서 `True` 값을 반환하는 예시 코드를 살펴보자.

```python
class AsyncSessionManager:

  ...

  async def __aexit__(self, exc_type, exc_value, exc_traceback):
    if exc_type:
      print(f"handle exception: {exc_type}, {exc_value}, {exc_traceback}")
    await asyncio.sleep(0.1)
    print("close async session manager")
    return True # to suppress exception
```

예외가 전파되지 않기 때문에 이전 로그처럼 트레이스백 로그가 출력되지 않는다.

```
initialize async session manager
open async session manager
do something with async session
handle exception: <class 'Exception'>, something went wrong, <traceback object>
close async session manager
```

## 3. Using contextlib asynccontextmanager decorator

파이썬 표준 라이브러리인 `contextlib`의 `@asynccontextmanager` 데코레이터를 사용하면 클래스를 정의하지 않아도 비동기 컨텍스트 매니저를 생성할 수 있다. `@asynccontextmanager` 데코레이터를 사용하려면 비동기 제너레이터(async generator) 함수로 정의해야 한다. 아래와 같이 함수형 비동기 컨텍스트 매니저를 만들 수 있다.

```python
import asyncio
from contextlib import asynccontextmanager


@asynccontextmanager
async def async_session():
  session = "async session"
  print("initialize async session") # __init__ 역할
  print("open async session") # __aenter__ 역할
  await asyncio.sleep(0.1)
  try:
    yield session
  except Exception as e: # __aexit__ 예외 처리 역할
    print(f"handle exception: {type(e)}, {e}")
    # raise를 제거하고 pass를 사용하면 예외를 무시한다.
    raise # to propagate exception
  finally:
    print("close async session") # __aexit__ 역할
```

`@asynccontextmanager` 데코레이터를 사용하면 클래스 형식이 아니라 함수 형식으로 정의할 수 있다. 명시적으로 try-except-finally 구문을 작성하기 때문에 코드 흐름을 파악하기 쉽다. 클래스 방식에 비해 보일러플레이트가 줄어 더 간결하다. 예외가 발생했을 때 예외를 전파할 것인지 무시할 것인지 `raise`/`pass` 키워드를 통해 제어할 수 있다. 함수형 비동기 컨텍스트 매니저도 동일한 방식으로 사용한다.

```python
import asyncio
from async_session_contextlib import async_session


async def main():
  async with async_session() as session:
    print(f"do something with {session}")
    raise Exception("something went wrong")


asyncio.run(main())
```

위 코드를 실행하면 다음과 같은 로그를 확인할 수 있다.

```
initialize async session
open async session
do something with async session
handle exception: <class 'Exception'>, something went wrong
close async session
Traceback (most recent call last):
  File "example-05.py", line 8, in main
    raise Exception("something went wrong")
Exception: something went wrong
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-05-01-python-async-with-keyword-and-async-context-manager>

#### REFERENCE

- <https://docs.python.org/3/reference/datamodel.html#asynchronous-context-managers>
- <https://docs.python.org/3/reference/compound_stmts.html#the-async-with-statement>
- <https://docs.python.org/3/library/contextlib.html#contextlib.asynccontextmanager>
- <https://wikidocs.net/251997>
- <https://bcho.tistory.com/1464>
- <https://seungriyou.github.io/posts/python-context-manager-protocol-and-with/>

[python-generator-function-link]: https://junhyunny.github.io/python/generator-function/python-generator-function/
[python-global-intpreter-lock-and-asynchronous-link]: https://junhyunny.github.io/python/generator-function/async-await/asynchronous-task/python-global-intpreter-lock-and-asynchronous/
[python-with-keyword-and-context-manager-link]: https://junhyunny.github.io/python/with/context-manager/python-with-keyword-and-context-manager/
