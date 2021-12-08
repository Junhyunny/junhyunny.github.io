---
title: "Lombok @EqualsAndHashCode 애너테이션"
search: false
category:
  - information
  - java
last_modified_at: 2021-12-08T09:00:00
---

<br>

## 1. 문제 상황

테스트 코드를 작성하는 중에 다음과 같은 문제를 만났습니다. 
- Spy 테스트 더블(test double)을 이용한 테스트 코드 작성하였습니다.
- 메소드 파라미터로 전달한 파라미터가 동일한지 확인하는 과정에서 에러가 발생하였습니다.

##### 테스트 코드
- `todoDto` 인스턴스를 요청 정보(request body)로 전달합니다.
- `verify` 메소드로 `mockTodoService` 테스트 더블 인스턴스의 `createTodo` 메소드가 1회 호출되었는지 확인합니다.
- `todoDto` 인스턴스가 전달되어 `createTodo` 메소드의 파라미터로 사용되었는지 확인합니다.

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

##### 에러 로그
- `Argument(s) are different!` 로그를 통해 사용된 인스턴스가 다르다는 것을 판단할 수 있습니다.

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

에러 로그를 보고 `equals` 메소드와 `hashCode` 메소드 오버라이딩을 떠올렸지만 이를 구현하는 일이 상당히 귀찮았습니다. 
클래스에 정의된 필드들을 모두 비교해야한다거나 해시 코드 계산이 필요하기 때문입니다. 
이를 쉽게 해결할 수 있는 방법을 찾아보니 `Lombok`에 `@EqualsAndHashCode` 애너테이션이 있었습니다. 
해당 애너테이션을 클래스 위에 정의하면 컴파일 시점에 자동으로 `equals` 메소드와 `hashCode` 메소드 오버라이딩이 됩니다. 
디컴파일(decompile) 한 코드를 살펴보면 클래스에 있는 모든 필드들에 대한 비교를 수행합니다.

##### @EqualsAndHashCode 애너테이션 사용

```java
@EqualsAndHashCode
public class TodoDto {

    private long id;
    private String value;
    private Timestamp createdAt;
    private String userId;
}
```

##### TodoDto 클래스 디컴파일(decompile) 코드

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