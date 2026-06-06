---
title: "Lombok @EqualsAndHashCode 애너테이션"
search: false
category:
  - information
  - java
last_modified_at: 2026-06-06T23:21:11+09:00
---

<br/>

## 1. 문제 상황

테스트 코드를 작성하던 중 다음과 같은 문제를 만났다.

- Spy 테스트 더블(test double)을 이용한 테스트 코드를 작성했다.
- 메서드에 전달한 파라미터가 동일한지 확인하는 과정에서 에러가 발생했다.

실제 테스트 코드는 다음과 같다.

- `todoDto` 객체를 API 요청의 리퀘스트 바디(request body)로 전달한다.
- `verify` 메서드로 `mockTodoService` 객체의 `createTodo` 메서드가 1회 호출되었는지 확인한다. 이때 `todoDto` 객체가 `createTodo` 메서드의 파라미터로 사용되었는지 확인한다.

```java
    @Test
    public void createTodo_invokeCreateTodo() throws Exception {
        TodoDto todoDto = TodoDto.builder()
                .id(-1)
                .value("Reading a book")
                .createdAt(null)
                .build();
        mockMvc.perform(post("/todo")
                .contentType(MediaType.APPLICATION_JSON)
                .content(new ObjectMapper().writeValueAsString(todoDto)));
        verify(mockTodoService, times(1)).createTodo(todoDto);
    }
```

위 테스트를 실행하면 다음과 같은 에러 로그를 확인할 수 있다.

- `Argument(s) are different!` 로그를 통해 사용된 인스턴스가 다르다는 것을 판단할 수 있다.

```
Argument(s) are different! Wanted:
todoService.createTodo(
    com.tdd.backendspringboot.todo.dto.TodoDto@6069dd38
);
-> at com.tdd.backendspringboot.todo.controller.TodoControllerTest.createTodo_invokeCreateTodo(TodoControllerTest.java:154)
Actual invocations have different arguments:
todoService.createTodo(
    com.tdd.backendspringboot.todo.dto.TodoDto@5a237731
);
-> at com.tdd.backendspringboot.todo.controller.TodoController.createTodo(TodoController.java:26)
```

## 2. 문제 해결

에러 로그를 보고 `equals` 메서드와 `hashCode` 메서드 오버라이딩을 떠올렸지만 이를 구현하는 일이 상당히 귀찮았다. 클래스에 정의된 필드를 모두 비교해야 한다거나 해시 코드 계산이 필요하기 때문이다. 이를 쉽게 해결할 수 있는 방법을 찾아보니 `Lombok`에 `@EqualsAndHashCode` 애너테이션이 있었다. 해당 애너테이션을 클래스 위에 정의하면 컴파일 시점에 자동으로 `equals` 메서드와 `hashCode` 메서드가 오버라이딩된다. 디컴파일(decompile)한 코드를 살펴보면 클래스에 있는 모든 필드를 비교한다.

- `@EqualsAndHashCode` 애너테이션은 클래스 위에 추가해서 사용한다.

```java
@EqualsAndHashCode
public class TodoDto {

    private long id;
    private String value;
    private Timestamp createdAt;
    private String userId;
}
```

위 `TodoDto` 클래스의 `.class` 파일을 디컴파일하면 다음과 같은 코드를 볼 수 있다.

```java
    public boolean equals(final Object o) {
        if (o == this) {
            return true;
        } else if (!(o instanceof TodoDto)) {
            return false;
        } else {
            TodoDto other = (TodoDto)o;
            if (!other.canEqual(this)) {
                return false;
            } else if (this.getId() != other.getId()) {
                return false;
            } else {
                label49: {
                    Object this$value = this.getValue();
                    Object other$value = other.getValue();
                    if (this$value == null) {
                        if (other$value == null) {
                            break label49;
                        }
                    } else if (this$value.equals(other$value)) {
                        break label49;
                    }

                    return false;
                }

                Object this$createdAt = this.getCreatedAt();
                Object other$createdAt = other.getCreatedAt();
                if (this$createdAt == null) {
                    if (other$createdAt != null) {
                        return false;
                    }
                } else if (!this$createdAt.equals(other$createdAt)) {
                    return false;
                }

                Object this$userId = this.getUserId();
                Object other$userId = other.getUserId();
                if (this$userId == null) {
                    if (other$userId != null) {
                        return false;
                    }
                } else if (!this$userId.equals(other$userId)) {
                    return false;
                }

                return true;
            }
        }
    }

    public int hashCode() {
        int PRIME = true;
        int result = 1;
        long $id = this.getId();
        int result = result * 59 + (int)($id >>> 32 ^ $id);
        Object $value = this.getValue();
        result = result * 59 + ($value == null ? 43 : $value.hashCode());
        Object $createdAt = this.getCreatedAt();
        result = result * 59 + ($createdAt == null ? 43 : $createdAt.hashCode());
        Object $userId = this.getUserId();
        result = result * 59 + ($userId == null ? 43 : $userId.hashCode());
        return result;
    }
```

## 3. @EqualsAndHashCode 애너테이션 속성

`@EqualsAndHashCode` 애너테이션 속성 몇 가지를 추가로 정리했다. `of` 속성을 사용하면 특정 필드만 선택해서 `equals`, `hashCode` 메서드를 오버라이딩한다.

```java
@EqualsAndHashCode(of = {"id"})
public class TodoDto {

    private long id;
    private String value;
    private String userId;
    private Timestamp createdAt;
    private Timestamp updatedAt;
}
```

위 클래스 파일을 디컴파일하면 다음과 같은 코드를 볼 수 있다.

```java
    public boolean equals(final Object o) {
        if (o == this) {
            return true;
        } else if (!(o instanceof TodoDto)) {
            return false;
        } else {
            TodoDto other = (TodoDto)o;
            if (!other.canEqual(this)) {
                return false;
            } else {
                return this.getId() == other.getId();
            }
        }
    }

    public int hashCode() {
        int PRIME = true;
        int result = 1;
        long $id = this.getId();
        int result = result * 59 + (int)($id >>> 32 ^ $id);
        return result;
    }
```

`exclude` 속성을 사용하면 특정 필드를 제외하고 `equals`, `hashCode` 메서드를 오버라이딩한다.

```java
@EqualsAndHashCode(exclude = {"userId", "createdAt", "updatedAt"})
public class TodoDto {

    private long id;
    private String value;
    private String userId;
    private Timestamp createdAt;
    private Timestamp updatedAt;
}
```

위 클래스를 디컴파일하면 다음과 같은 코드를 볼 수 있다.

```java
    public boolean equals(final Object o) {
        if (o == this) {
            return true;
        } else if (!(o instanceof TodoDto)) {
            return false;
        } else {
            TodoDto other = (TodoDto)o;
            if (!other.canEqual(this)) {
                return false;
            } else if (this.getId() != other.getId()) {
                return false;
            } else {
                Object this$value = this.getValue();
                Object other$value = other.getValue();
                if (this$value == null) {
                    if (other$value != null) {
                        return false;
                    }
                } else if (!this$value.equals(other$value)) {
                    return false;
                }

                return true;
            }
        }
    }

    public int hashCode() {
        int PRIME = true;
        int result = 1;

        long $id = this.getId();
        int result = result * 59 + (int)($id >>> 32 ^ $id);
        Object $value = this.getValue();
        result = result * 59 + ($value == null ? 43 : $value.hashCode());
        return result;
    }
```

위에 언급한 `of`, `exclude` 속성 이외에 다른 속성에 대한 간단한 설명으로 글을 마무리한다.

- cacheStrategy 속성
  - `hashCode` 메서드의 결과를 캐시하는 방식을 결정한다.
- callSuper 속성
  - 현재 클래스의 필드를 계산하기 전에 상위 클래스의 `equals`, `hashCode` 구현을 호출한다.
- doNotUseGetters 속성
  - 일반적으로 게터(getter)가 있으면 해당 메서드를 호출한다.
- onlyExplicitlyIncluded 속성
  - `@EqualsAndHashCode.Include`로 명시한 필드와 메서드만 포함한다.
- onParam 속성
  - 여기에 지정한 애너테이션은 생성된 `equals`, `canEqual` 메서드의 파라미터에 추가된다.

#### REFERENCE

- <https://lars-sh.github.io/lombok-annotations/apidocs/lombok/EqualsAndHashCode.html>
