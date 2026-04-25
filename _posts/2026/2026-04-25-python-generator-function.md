---
title: "파이썬 제너레이터(Python Generator)"
search: false
category:
  - python
  - generator-function
  - async-await
  - asynchronous-task
last_modified_at: 2026-04-25T09:46:01+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [가비지 컬렉션(Garbage Collection) 참조 카운팅(Reference Counting) 알고리즘][reference-counting-gc-in-javascript-link]

## 0. 들어가면서

AI 코딩 에이전트와 함께 [토이 프로젝트](https://github.com/Junhyunny/todo-agent)로 간단한 AI 에이전트 애플리케이션을 만들어보고 있다. 예전에는 토이 프로젝트를 시작할 엄두조차 나지 않았는데, 지금은 정말 마음만 먹는다면 누구나 원하는 것을 만들 수 있게 되었다. 시간이 부족하다는 변명은 통하지 않는 시대를 살고 있다.

AI 에이전트 애플리케이션을 구현하면서 익숙하지 않은 파이썬(python), FastAPI, 랭체인(langchain) 같은 기술들을 사용하고 있다. 테스트와 구현 자체는 AI 코딩 에이전트와 함께 하기 때문에 수월하다. 하지만 기술에 대한 깊은 이해도가 없어서 그런지 리뷰가 어렵다. AI 결과물의 품질을 판단하고 교정하는 능력을 키우기 위해 최근에는 초심자의 마음으로 기술의 깊이를 파들어가는 시간을 가지고 있다. 뇌나 신체에 부하(load)가 가해지지 않으면 장기 기억에 남지 않기 때문에 배운 내용을 블로그 글로 남겨본다.

이번 글은 파이썬의 비동기 작업을 위한 제너레이터(generator)에 대해 정리했다.

## 1. Python Generator

파이썬의 제너레이터 함수는 일반 함수와 다르게 `return` 대신 `yield` 키워드를 사용해서 값을 반환하는 함수다. 반복자(iterator) 역할을 하는 제너레이터 객체를 생성하는 특별한 함수다. 예를 들어보자. 아래 코드는 숫자를 반환하되 무한 루프를 통해 숫자를 1씩 증가시키는 코드다.

```python
def number_generator():
    n = 0
    while True:
        yield n
        n += 1
```

해당 함수가 반환하는 값의 타입을 보면 `<class 'generator'>` 타입이다. 제너레이터 함수를 통해 생성되는 객체가 제너레이터다.

```python
if __name__ == "__main__":
  gen = number_generator()
  print(type(gen)) # <class 'generator'>
```

해당 제너레이터 객체로부터 값을 반환 받으려면 next 함수를 사용한다. next 함수를 통해 제너레이터 객체를 실행하면, yield 키워드를 만나기 전까지 실행된다. yield 키워드를 만나면 해당 값을 반환하고, 실행이 잠시 정지된다. 이후 다시 next 함수를 통해 제너레이터 객체를 실행하면 **처음부터 다시 시작되는 것이 아니라 yield 키워드를 통해 멈춘 다음 순간부터 다시 시작**한다.

로그를 추가해서 실행 흐름을 살펴보자.

```python
def number_generator():
  n = 0
  print("start generating number")
  while True:
    print("generating number: ", n)
    yield n
    n += 1

if __name__ == "__main__":
  gen = number_generator()
  print(type(gen))
  print(next(gen)) # 0
  print(next(gen)) # 1
  print(next(gen)) # 2
  # ...
```

위 코드가 실행되면 다음과 같은 로그를 볼 수 있다.

- 첫 next 함수 호출 시 출력되는 로그
  - start generating number
  - generating number:  0
- 두 번째 next 함수 호출 시 출력되는 로그
  - generating number:  1
- 세 번째 next 함수 호출 시 출력되는 로그
  - generating number:  2

```
<class 'generator'>
start generating number
generating number:  0
0
generating number:  1
1
generating number:  2
2
```

next 함수뿐만 아니라 `for-루프`를 통해서 제너레이터 객체를 실행할 수 있다.

```python
if __name__ == "__main__":
  gen = number_generator()
  # ...
  for i in gen:
    print(i)
    if(i > 4):
      break
```

로그를 보면 다음과 같이 출력된다.

```
...
generating number:  3
3
generating number:  4
4
generating number:  5
5
```

## 2. Background

제너레이터 함수의 등장 배경을 살펴보자. [PEP-255(Simple Iterators) 제안서](https://peps.python.org/pep-0255/)을 통해 처음 도입되었다. 몇 가지 페인 포인트가 있었던 것 같다.

- 이전에는 값을 연속적으로 생산하면서 내부 상태를 유지해야 하는 작업(예: 코드 파싱, 토크나이저 등)을 할 때, 콜백(callback) 함수를 넘겨주거나 전역 변수를 사용해야 해서 코드가 매우 복잡해졌다. 
- 결과를 리스트로 한 번에 모아서 반환하는 방식은 코드는 자연스럽지만, 파일이나 데이터가 너무 크면 메모리를 극심하게 낭비하는 문제가 있었다.
- 별도의 스레드를 사용해 데이터를 주고받는 방식도 가능하지만, 플랫폼에 따라 지원되지 않을 수 있고 속도(오버헤드) 측면에서 비효율적이었다.

함수의 로컬 상태를 보존한 채로 결과값을 반환하고 나중에 그 자리에서부터 다시 실행을 재개할 수 있는 메커니즘을 파이썬에 도입하게 되었다. 핵심 사양(specification)으로 함수 내부에 yield 문이 하나라도 포함되어 있으면, 해당 함수는 일반 함수가 아니라 '제너레이터 함수'로 컴파일되었다. 제너레이터 함수를 호출하면 코드가 즉시 실행되는 대신 제너레이터-이터레이터(generator-iterator) 객체를 반환한다. 이후 `next()` 함수가 호출되면 yield 키워드를 만날 때까지 코드가 실행되며, 이때 로컬 변수, 명령어 포인터, 내부 스택 등 함수의 모든 상태가 동결(frozen)되어 안전하게 보존된다.

제너레이터 안에서 return 문을 만나거나 함수의 끝에 도달하면 StopIteration 예외가 발생하여 반복이 완전히 끝났음을 알린다. return 문은 호출 시 제너레이터 객체의 로컬 상태를 파괴하고 함수를 완전히 종료한다. 참고로 PEP 255가 제안될 당시에는 제너레이터 내부의 return 문 뒤에 특정 값을 지정하여 반환하는 것이 허용되지 않았으며, 오직 "반복 종료"를 의미하는 용도로만 쓰였다.

제너레이터를 사용하면 어떻게 메모리 효율이 좋아지는지 확인해보자. 10MB짜리 txt 파일을 읽는다고 가정해보자. 아래 코드는 파일 전체를 읽어 메모리에 올리기 때문에 메모리가 10MB 이상 필요하다. 현재 메모리 사용량과 최대 메모리 사용량을 확인해보자.

```python
import tracemalloc


def read_large_file(path):
  results = [] 
  with open(path) as f:
    for line in f:
      results.append(line.strip())
  return results  


tracemalloc.start()
lines = read_large_file("big.txt")
print(f"첫 번째 줄: {lines[0]}")
current, peak = tracemalloc.get_traced_memory()
tracemalloc.stop()

print(f"현재 메모리 사용량: {current / 10**6:.2f} MB")
print(f"최대 메모리 사용량: {peak / 10**6:.2f} MB")
```

위 코드를 실행하면 다음과 같은 로그를 볼 수 있다.

```
첫 번째 줄: grg empzdlsncg kmhoagmtvo iyryysx acms xnicqjds srlf fjky olegxedgj
현재 메모리 사용량: 16.37 MB
최대 메모리 사용량: 16.51 MB
```

제너레이터를 사용하면 yield 키워드를 만나는 순간 한 줄만 반환하고 실행을 멈춘다. 항상 줄 1개 분량의 메모리와 제너레이터 객체를 유지하기 위한 메모리만 있으면 충분하다. 파일 사이즈가 1MB, 1GB, 10GB 이어도 메모리 사용량은 동일하다.

```python
import tracemalloc


def read_large_file(path):
    with open(path) as f:
        for line in f:
            yield line.strip()


tracemalloc.start()
lines = read_large_file("big.txt")
print(f"첫 번째 줄: {next(lines)}")
current, peak = tracemalloc.get_traced_memory()
tracemalloc.stop()

print(f"현재 메모리 사용량: {current / 10**6:.2f} MB")
print(f"최대 메모리 사용량: {peak / 10**6:.2f} MB")
```

위 코드를 실행하면 다음과 같은 로그를 볼 수 있다.

```
첫 번째 줄: grg empzdlsncg kmhoagmtvo iyryysx acms xnicqjds srlf fjky olegxedgj
현재 메모리 사용량: 0.14 MB
최대 메모리 사용량: 0.15 MB
```

## 3. How does it work?

어떻게 제너레이터가 동작하는지 중간에 실행 흐름을 멈추고, 다시 이전 작업으로 돌아갈 수 있는지 알아보자. 제너레이터 객체가 중간에 실행을 멈추고 다시 재개할 수 있는 핵심적인 이유는 함수의 실행 상태를 담은 프레임이 콜 스택(call stack)이 아닌 힙(heap) 메모리에 할당되어 보존되기 때문이다. 

일반적인 함수의 실행 프레임은 함수의 실행이 완료되면 스택 메모리 영역에서 소멸된다. 하지만 파이썬 컴파일러가 함수 내부에 yield 키워드가 있음을 감지하면, 인터프리터는 해당 함수를 즉시 실행하는 대신 힙(Heap) 메모리에 제너레이터 객체를 생성하여 반환한다. CPython 구조에서 제너레이터와 코루틴의 내부 `실행 프레임(_PyInterpreterFrame)`은 일반 함수들처럼 스레드별 스택 메모리에 할당되지 않고, 제너레이터 객체 구조체(PyGenObject) 내부에 직접 내장되어 힙 메모리에 저장된다.

힙 메모리에 존재하는 _PyInterpreterFrame 안에는 함수 내부의 로컬 변수, 글로벌 변수 참조, 평가 스택(evaluation stack), 그리고 **가장 중요한 '명령어 포인터(Instruction Pointer)'**가 포함되어 있다. 제너레이터가 실행되다가 yield 키워드를 만나게 되면, 파이썬은 다음과 같은 작업을 수행한다.

1. 현재 실행 중인 위치를 가리키는 프레임의 명령어 포인터를 업데이트한다.
2. 예외 상태 등 현재 인터프리터의 상태를 제너레이터 객체에 안전하게 저장한다.
3. 값을 호출자에게 넘겨주고 함수의 실행을 일시 정지한다.

여기서 호출자는 제너레이터 객체를 만든 클라이언트 코드를 의미한다. 일반 함수라면 이때 프레임이 소멸하겠지만, 제너레이터의 프레임은 스택에서 제거되지만, **힙 메모리에 할당된 객체 내부에 존재하므로 함수 호출자에게 제어권을 넘긴 후에도 로컬 변수와 상태가 그대로 생존(Outlive)**할 수 있다. 

이후 호출자가 next(), send() 메서드를 통해 제너레이터를 다시 호출하면, 인터프리터는 힙에 보존되어 있던 제너레이터 객체의 프레임으로 다시 접근한다. 그리고 **프레임에 기록되어 있던 '마지막으로 실행된 명령어 포인터'를 확인하여, 정확히 일시 정지했던 위치(yield 바로 다음)부터 바이트코드의 실행을 다시 이어나간다.** 아래 이미지를 통해 이해해보자. 

1. my_generator 함수가 호출되면 힙 메모리에 제너레이터 객체가 생성된다. 제너레이터 객체 내부에는 _PyInterpreterFrame 객체도 함께 포함되어 있다.
2. next(gen) 함수를 호출하면 콜 스택에서 next 위에 my_generator 함수가 실행된다. 로컬 변수는 _PyInterpreterFrame 객체 내부에 저장된다.
3. yield 키워드를 만나면 스레드 스택에 위치한 프레임을 힙에 보존한다. 이때 다음에 다시 호출 시 실행되어야 하는 위치를 명령어 포인터로 가리킨다.
4. 메인 실행 컨텍스트로 돌아와서 next(gen) 함수를 호출하면 위의 동작이 반복된다.
5. 함수 끝에 도달하여 더 이상 yield 키워드가 없다면 다음 next(gen) 함수를 호출했을 때 StopIteration 예외가 발생한다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/python-generator-function-01.gif" width="100%" class="image__border image__padding">
</div>

<br/>

_PyInterpreterFrame 객체는 `gi_frame` 멤버 필드를 통해 접근할 수 있다. gi_frame 객체는 다음과 같은 프로퍼티를 갖는다.

- f_lineno 필드 - 현재 실행 줄 번호
- f_locals 필드 - 로컬 변수 목록

위 예제를 기반으로 실제 프레임 객체에 어떤 값이 저장되어 있는지 로그를 통해 확인해보자.

```python
def my_generator():
  x = 10
  y = 20
  yield x + y 
  z = 30
  yield x + y + z


# ─────────────────────────────────
gen = my_generator()

print("=" * 50)
print("▶ 제네레이터 객체 생성 직후 (아직 실행 안됨)")
print("=" * 50)

frame = gen.gi_frame
print(f"프레임 존재 여부 : {frame}")
print(f"현재 실행 줄 번호 : {frame.f_lineno}")
print(f"로컬 변수 : {frame.f_locals}")
print(f"제네레이터 실행 중 : {gen.gi_running}")

print()
print("=" * 50)
print("▶ 첫 번째 next() 호출")
print("=" * 50)
print(f"yield 값 : {next(gen)}")
frame = gen.gi_frame
print(f"현재 실행 줄 번호 : {frame.f_lineno}")
print(f"로컬 변수 : {frame.f_locals}")

print()
print("=" * 50)
print("▶ 두 번째 next() 호출")
print("=" * 50)
print(f"yield 값 : {next(gen)}")
frame = gen.gi_frame
print(f"현재 실행 줄 번호 : {frame.f_lineno}")
print(f"로컬 변수 : {frame.f_locals}")

print()
print("=" * 50)
print("▶ 세 번째 next() 호출, 제네레이터 종료")
print("=" * 50)
try:
  next(gen)
except StopIteration:
  print("StopIteration 발생")
  print(f"프레임 존재 여부 : {gen.gi_frame}")
```

위 코드를 실행하면 다음과 같은 로그를 볼 수 있다.

```
==================================================
▶ 제네레이터 객체 생성 직후 (아직 실행 안됨)
==================================================
프레임 존재 여부 : <frame at 0x100a15e50, file '/Users/junhyunny/Desktop/action-in-blog/example-03.py', line 1, code my_generator>
현재 실행 줄 번호 : 1
로컬 변수 : {}
제네레이터 실행 중 : False

==================================================
▶ 첫 번째 next() 호출
==================================================
yield 값 : 30
현재 실행 줄 번호 : 4
로컬 변수 : {'x': 10, 'y': 20}

==================================================
▶ 두 번째 next() 호출
==================================================
yield 값 : 60
현재 실행 줄 번호 : 6
로컬 변수 : {'x': 10, 'y': 20, 'z': 30}

==================================================
▶ 세 번째 next() 호출, 제네레이터 종료
==================================================
StopIteration 발생
프레임 존재 여부 : None
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-04-25-python-generator-function>

#### REFERENCE

- <https://peps.python.org/pep-0255/>
- <https://peps.python.org/pep-0492/>
- <https://docs.python.org/3/reference/datamodel.html>
- <https://github.com/python/cpython/blob/main/InternalDocs/frames.md>
- <https://www.datacamp.com/tutorial/python-global-interpreter-lock>
- <https://medium.com/hackernoon/the-magic-behind-python-generator-functions-bc8eeea54220>
- <https://suman-cshil.medium.com/internals-of-python-generator-bc1ffb9e1198>

[reference-counting-gc-in-javascript-link]: https://junhyunny.github.io/information/javascript/reference-counting-gc-in-javascript/