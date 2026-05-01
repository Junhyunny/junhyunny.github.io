---
title: "파이썬 컨텍스트 매니저(Python Context Manager)와 with 키워드"
search: false
category:
  - python
  - with
  - context-manager
last_modified_at: 2026-05-01T12:51:01+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [파이썬 제너레이터(Python Generator)][python-generator-function-link]

## 1. Context Manager

파이썬 컨텍스트 매니저(Python Context Manager)는 리소스를 효율적이고 안전하게 관리하기 위해 고안된 기능이다. 주로 with 키워드와 함께 사용되며, 리소스를 사용하는 코드 블록에 진입하기 전과 벗어난 후에 필요한 할당 및 해제 작업을 자동으로 수행하기 위해 사용한다.

이를 통해 번거로운 try/finally 예외 처리 구조를 단순화하고, 코드 실행 중 예외가 발생하더라도 자원이 반드시 해제되도록 보장하여 리소스 누수(resource leak)를 막는다.

핵심 동작 원리를 살펴보자. 컨텍스트 매니저는 내부적으로 다음 두 가지 메서드를 통해 동작한다.

- `__enter__()` 메서드
  - `with` 블록에 진입할 때 자동으로 호출되는 메서드다.
  - 여기서 자원을 초기화하거나 연결한다. 반환된 값은 `as` 키워드 뒤에 지정된 대상 변수에 바인딩되어 블록 내에서 사용된다.
- `__exit__()` 메서드
  - `with` 블록을 빠져나올 때 무조건 호출되는 메서드다.
  - 정상 종료뿐만 아니라 예외가 발생했을 때도 포함된다. 파일을 닫거나 DB 연결을 해제하는 등 뒷정리를 담당한다.
  - 블록 내부에서 예외가 발생했을 경우 예외 정보를 받아 처리하거나 무시할지 결정할 수 있다.

컨텍스트 매니저는 특별한 타입이 아니라, `__enter__()`와 `__exit__()` 두 메서드를 구현한 객체다. with 문은 단순히 이 두 메서드를 호출하는 문법적 설탕(syntactic sugar)이라고 볼 수 있다. 컨텍스트 매니저와 with 블록을 함께 사용했을 때 동작 과정을 다음과 같이 시각화할 수 있다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/python-with-keyword-and-context-manager-01.png" width="100%" class="image__border image__background_black">
</div>

## 2. Practice

아래와 같은 파이썬 코드를 많이 볼 수 있다. 컨텍스트 매니저 객체와 with 블록을 사용해 파일을 안전하게 열고 닫을 수 있는 좋은 예시다.

```python
with open("hello.txt", "w") as f:
  f.write("안녕하세요!")
```

컨텍스트 매니저의 이해도를 높이기 위해 간단한 예제 코드를 통해 컨텍스트 매니저의 동작 과정을 살펴보자. with 블록을 사용하지 않은 코드와 사용한 코드를 비교해 보며 복잡한 로직이 얼마나 단순해지는지 확인해 보자.

먼저 컨텍스트 매니저 역할을 수행할 FileManager 클래스를 정의한다.

```python
class FileManager:
  def __init__(self):
    print("initialize file manager")
    pass

  def __enter__(self):
    print("open file manager")
    return self

  def __exit__(self, exc_type, exc_value, exc_traceback):
    if exc_type:
      print(f"handle exception: {exc_type}, {exc_value}, {exc_traceback}")
    print("close file manager")
```

`__exit__()` 메서드를 보면 세 개의 파라미터가 존재한다. 각 파라미터는 다음과 같은 용도로 사용된다.

- exc_type
  - 발생한 예외의 클래스 타입.
- exc_value
  - 발생한 예외의 실제 인스턴스(에러 메시지 등).
- traceback
  - 에러 발생 위치를 추적할 수 있는 트레이스백 객체.
  - 컨텍스트 매니저는 전달받은 이 인자들을 통해 에러를 분석하고 어떻게 처리할지 결정할 수 있다.

위 컨텍스트 매니저를 with 블록 없이 사용하면 다음과 같이 사용할 수 있다.

1. 컨텍스트 매니저인 FileManager 객체를 생성한다.
2. try 블록에서 `__enter__()` 메서드를 호출한다.
3. 컨텍스트 매니저가 `__enter__()` 메서드로 반환한 객체를 사용해 필요한 작업을 수행한다.
4. finally 블록에서 `__exit__()` 메서드를 호출한다.

```python
from file_manager import FileManager

manager = FileManager()
try:
  m = manager.__enter__()
  print(f"do something with {m}")
finally:
  manager.__exit__(None, None, None)
```

위 코드를 실행하면 다음과 같은 로그를 볼 수 있다.

```
initialize file manager
open file manager
do something with <file_manager.FileManager object at 0x100bc6120>
close file manager
```

위 코드는 with 블록을 사용하면 단순해진다. with-as 키워드를 통해 보일러플레이트(boilerplate) 같은 try/finally 블록이 사라진다. `__enter__()`, `__exit__()` 메서드가 자동으로 실행된다.

```python
from file_manager import FileManager

with FileManager() as m:
  print(f"do something with {m}")
```

with 블록을 사용한 코드를 실행하면 이전과 동일한 로그를 확인할 수 있다.

```
initialize file manager
open file manager
do something with <file_manager.FileManager object at 0x1075ade80>
close file manager
```

로직 중간에 예외가 발생하면 어떨까? with 블록이 없는 경우 다음과 같은 예외 처리 로직이 필요하다.

```python
import sys
from file_manager import FileManager

manager = FileManager()
try:
  m = manager.__enter__()
  print(f"do something with {m}")
  raise Exception("something went wrong")
except:
  manager.__exit__(*sys.exc_info())
  raise
else:
  manager.__exit__(None, None, None)
```

위 코드를 실행하면 다음과 같은 로그를 확인할 수 있다. 컨텍스트 매니저의 `__exit__()` 메서드 내부에서 예외 객체의 존재 여부를 확인하고 적절한 처리를 수행한다.

```
initialize file manager
open file manager
do something with <file_manager.FileManager object at 0x1003fe120>
handle exception: <class 'Exception'>, something went wrong, <traceback object at 0x10040b500>
close file manager
Traceback (most recent call last):
  File "/Users/junhyunny/Desktop/action-in-blog/example-03.py", line 8, in <module>
    raise Exception("something went wrong")
Exception: something went wrong
```

with 블록을 사용하면 위와 같은 예외 처리 블록이 별도로 필요 없다.

```python
from file_manager import FileManager

with FileManager() as m:
  print(f"do something with {m}")
  raise Exception("something went wrong")
```

위 코드를 실행하면 이전과 동일한 로그를 볼 수 있다.

```
initialize file manager
open file manager
do something with <file_manager.FileManager object at 0x104639e80>
handle exception: <class 'Exception'>, something went wrong, <traceback object at 0x104647500>
close file manager
Traceback (most recent call last):
  File "/Users/junhyunny/Desktop/action-in-blog/example-04.py", line 5, in <module>
    raise Exception("something went wrong")
Exception: something went wrong
```

컨텍스트 매니저와 with 블록을 사용할 때 예외가 발생하면 `__exit__()` 메서드의 반환 값에 따라 예외를 전파할지 무시할지(suppress)가 결정된다. 구체적으로 알아보자. True 값을 반환하면 필요한 예외 처리가 `__exit__()` 메서드 내부에서 처리되었다고 판단하여 예외를 전파하지 않는다. False 값이나 반환 값이 없는 경우에는 그대로 예외를 전파한다.

FileManager 컨텍스트 매니저 객체의 `__exit__()` 메서드에서 True 값을 반환해 보자.

```python
class FileManager:

  ...

  def __exit__(self, exc_type, exc_value, exc_traceback):
    if exc_type:
      print(f"handle exception: {exc_type}, {exc_value}, {exc_traceback}")
    print("close file manager")
    return True # to suppress exception
```

예외가 전파되지 않기 때문에 이전 로그처럼 트레이스백 로그가 출력되지 않는다.

```
python example-04.py
initialize file manager
open file manager
do something with <file_manager.FileManager object at 0x105fe1e80>
handle exception: <class 'Exception'>, something went wrong, <traceback object at 0x105fef500>
close file manager
```

## 3. Using contextlib @contextmanager decorator

파이썬 표준 라이브러리인 `contextlib`의 `@contextmanager` 데코레이터를 사용하면 클래스를 정의하지 않아도 컨텍스트 매니저를 생성할 수 있다. `@contextmanager` 데코레이터를 사용하려면 [제너레이터(generator) 함수][python-generator-function-link]를 사용해야 한다. 다음과 같이 컨텍스트 매니저를 만들 수 있다.

```python
from contextlib import contextmanager


@contextmanager
def file_manager():
  print("initialize file manager") # __init__ 역할
  print("open file manager") # __enter__ 역할
  try:
    yield # as 변수에 매칭될 객체를 반환, __enter__ 메서드의 return 역할, 현재는 None 반환
  except Exception as e: # __exit__ 예외 처리 역할
    print(f"handle exception: {type(e)}, {e}")
    # pass # to suppress exception
    raise # to propagate exception
  finally:
    print("close file manager") # __exit__ 역할
```

`@contextmanager` 데코레이터를 사용하면 클래스 형식이 아니라 함수 형식으로 정의할 수 있다. 명시적으로 try-except-finally 구문을 작성하기 때문에 코드 흐름을 파악하기 쉽다. 클래스 방식에 비해 보일러플레이트가 줄어 더 간결하다. 예외가 발생했을 때 예외를 전파할 것인지 무시할 것인지 raise/pass 키워드를 통해 제어할 수 있다.

함수형 컨텍스트 매니저도 동일한 방식으로 사용한다.

```python
from file_manager_contextlib import file_manager


with file_manager() as m:
  print(f"do something with {m}")
  raise Exception("something went wrong")
```

위 코드를 실행하면 다음과 같은 로그를 확인할 수 있다.

```
initialize file manager
open file manager
do something with None
handle exception: <class 'Exception'>, something went wrong
close file manager
Traceback (most recent call last):
  File "/Users/junhyunny/Desktop/action-in-blog/example-05.py", line 7, in <module>
    raise Exception("something went wrong")
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-05-01-python-with-keyword-and-context-manager>

#### REFERENCE

- <https://www.scaler.com/topics/context-manager-python/>
- <https://wikidocs.net/231339>
- <https://seungriyou.github.io/posts/python-context-manager-protocol-and-with/>
- <https://sjquant.tistory.com/12>
- <https://velog.io/@qlgks1/python-%EB%8F%99%EC%8B%9C%EC%84%B1-%EC%B2%98%EB%A6%AC-with-%EA%B5%AC%EB%AC%B8%EA%B3%BC-context-manager>

[python-generator-function-link]: https://junhyunny.github.io/python/generator-function/python-generator-function/
