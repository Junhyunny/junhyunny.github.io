---
title: "Usage of @PrePersist and @PreUpdate Annotations"
search: false
category:
  - spring-boot
  - jpa
  - junit
last_modified_at: 2021-09-04T13:00:00
---

<br/>

## 1. @PrePersist and @PreUpdate Annotations

@PrePersist, @PreUpdate 두 애너테이션은 JPA 엔티티의 라이프사이클을 따라 자동으로 실행돼야 하는 메서드를 지정할 때 사용한다. 두 애너테이션은 서로 실행 시점이 다르다. @PrePersist 애너테이션의 실행 시점을 먼저 살펴보자.

- JPA 엔티티(entity)가 비영속 상태에서 영속 상태가 되는 시점 이전에 실행된다. 

<div align="center">
  <img src="/images/posts/2021/pre-persist-pre-update-01.png" width="80%" class="image__border">
</div>

<br/>

@PreUpdate 애너테이션은 언제 실행될까?

- 영속 상태인 엔티티의 변경 사항이 데이터베이스에 반영되는 시점 이전에 실행된다. 

<div align="center">
  <img src="/images/posts/2021/pre-persist-pre-update-02.png" width="80%" class="image__border">
  </div>

## 2. Usage

두 애너테이션을 추가한 메서드는 엔티티가 데이터베이서에 영속화 되기 전에 실행된다. 다음과 같은 작업을 수행할 수 있다.

- 데이터 무결성을 보장하기 위해 특정 엔티티 필드의 값이 조건을 만족하지 못 하는 경우 예외를 발생시킬 수 있다.
- 엔티티의 필드 값을 암호화하거나 사용자의 권한을 확인하는 작업을 수행할 수 있다.
- 엔티티 필드 값이 변경될 때마다 이를 일관성 있게 처리하거나 데이터를 검증할 수 있다.

## 3. Example

필자는 데이터베이스 설계 시 기본적으로 추가하는 필드가 있다. 

- 데이터 생성 시점(createdAt)
- 데이터 업데이트 시점(updatedAt)

두 필드의 값을 설정할 때 주로 두 애너테이션을 활용한다.

### 3.1. BaseEntity Class

두 필드를 모든 JPA 엔티티에 포함시키고 싶은 경우 @MappedSuperclass 애너테이션과 함께 활용한다. 먼저 부모 클래스를 만들고 모든 엔티티들이 이를 상속 받도록 만든다. @MappedSuperclass 애너테이션을 사용하면 부모 클래스의 위치한 필드를 테이블의 컬럼으로 매핑할 수 있다.

1. createAt 필드  
  - 업데이트 시 변경되지 않도록 updatable 속성을 false 값으로 설정한다.
  - null 데이터가 설정되지 않도록 nullable 속성을 false 값으로 설정한다.
2. updatedAt 필드
  - null 데이터가 설정되지 않도록 nullable 속성을 false 값으로 설정한다.
3. prePersist 메서드
  - createAt, updatedAt 필드 값을 변경한다.
4. preUpdate 메서드
  - updatedAt 필드 값을 변경한다.

```java
package blog.in.action.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.extern.log4j.Log4j2;

import javax.persistence.Column;
import javax.persistence.MappedSuperclass;
import java.time.LocalDateTime;

@Log4j2
@Getter
@NoArgsConstructor
@MappedSuperclass
class BaseEntity {

    @Column(updatable = false, nullable = false) // 1
    protected LocalDateTime createAt;
    @Column(nullable = false) // 2
    protected LocalDateTime updatedAt;

    public void prePersist() { // 3
        LocalDateTime now = LocalDateTime.now();
        createAt = now;
        updatedAt = now;
    }

    public void preUpdate() { // 4
        updatedAt = LocalDateTime.now();
    }
}
```

### 3.2. BookEntity Class

예제를 위한 북 엔티티를 만들어보자. 

1. prePersist 메서드
  - 데이터를 영속화하기 전에 isbn 값이 있는지 확인한다.
  - 부모 클래스의 prePersist 메서드를 호출한다.
2. preUpdate 메서드
  - 부모 클래스의 preUpdate 메서드를 호출한다.

```java
package blog.in.action.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.persistence.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
public class BookEntity extends BaseEntity {

    @Id
    @GeneratedValue
    private Long id;
    @Column
    private String isbn;
    @Column
    private String title;

    @Override
    @PrePersist // 1
    public void prePersist() {
        if (isbn == null) {
            throw new RuntimeException("isbn must be not null");
        }
        super.prePersist();
    }

    @Override
    @PreUpdate // 2
    public void preUpdate() {
        super.preUpdate();
    }
}
```

### 3.3. Test

JPA 의존성에 의해 자동으로 실행되기 때문에 단위 테스트로 검증하기 어렵다. 스프링 애플리케이션의 실행 환경과 동일한 환경을 만들어주는 @SpringBootTest 애너테이션을 사용해 결합 테스트를 수행해야 한다. @PrePersist 애너테이션의 동작을 살펴보자. 먼저 정상적인 케이스를 확인한다.

1. Given
  - 북 엔티티를 준비한다.
2. When
  - 데이터를 영속화한다.
3. Then
  - 북 엔티티를 저장했을 때 createAt, updatedAt 필드가 null 값이 아닌지 확인한다.
  - createAt, updatedAt 필드가 동일한 값을 갖는지 확인한다.

```java
package blog.in.action;

import blog.in.action.domain.BookEntity;
import blog.in.action.repository.BookRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;

import javax.persistence.EntityManager;
import javax.persistence.TypedQuery;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@AutoConfigureTestDatabase
@SpringBootTest
public class PrePersistTest {

    @Autowired
    EntityManager entityManager;
    @Autowired
    BookRepository sut;

    @Test
    void save_createdAtAndUpdatedAtIsNotNull() {
        BookEntity book = BookEntity.builder() // 1
                .title("JPA 101")
                .isbn(UUID.randomUUID().toString())
                .build();


        sut.save(book); // 2


        assertNotNull(book.getCreateAt()); // 3
        assertNotNull(book.getUpdatedAt());
        assertEquals(book.getCreateAt(), book.getUpdatedAt());
    }
}
```

다음은 필요한 값이 없을 때 예외가 발생하는지 확인한다.

1. Given
  - 북 엔티티를 준비한다.
  - 필수 값인 `isbn`이 존재하지 않는다.
2. When
  - 데이터를 영속화한다.
3. Then
  - 예상된 메시지와 함께 예외가 발생하는지 확인한다.
  - 데이터가 저장되지 않았는지 확인한다.

```java
@AutoConfigureTestDatabase
@SpringBootTest
public class PrePersistTest {

    @Autowired
    EntityManager entityManager;
    @Autowired
    BookRepository sut;

    @Test
    void isbnIsNull_save_throwException() {
        BookEntity book = BookEntity.builder() // 1
                .title("JPA 201")
                .build();


        RuntimeException throwable = assertThrows(RuntimeException.class, () -> sut.save(book)); // 2
        assertEquals(throwable.getMessage(), "isbn must be not null"); // 3
        TypedQuery<BookEntity> query = entityManager.createQuery(
                "select b from BookEntity b where b.title=:title",
                BookEntity.class
        );
        query.setParameter("title", "JPA 201");
        List<BookEntity> result = query.getResultList();
        assertEquals(0, result.size());
    }
}
```

다음은 @PreUpdate 애너테이션의 동작을 확인해보자. @PreUpdate 시점엔 updatedAt 필드만 최신화하므로 updateAt 필드가 createAt 필드보다 값이 크다. 이를 테스트 코드에서 확인한다.

1. Given
  - 시간 차이를 확실히 만들기 위해 100ms 뒤에 테스트를 실행한다.
  - 이전에 영속화 되어있던 북 엔티티를 조회한다.
2. When
  - 북 엔티티의 타이틀을 변경한다.
3. Then
  - 변경된 타이틀로 엔티티 객체가 조회되는지 확인한다.
  - updatedAt 값이 createdAt 값보다 이후 값인지 확인한다.

```java
package blog.in.action;

import blog.in.action.domain.BookEntity;
import blog.in.action.repository.BookRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.persistence.EntityManager;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
public class PreUpdateTest {

    @Autowired
    EntityManager entityManager;
    @Autowired
    BookRepository sut;

    BookEntity book;

    @BeforeEach
    void setUp() {
        book = BookEntity.builder()
                .title("JPA 301")
                .isbn(UUID.randomUUID().toString())
                .build();
        sut.save(book);
    }

    @Test
    void update_updatedAtIsAfterCreatedAt() throws InterruptedException {
        Thread.sleep(100); // 1
        BookEntity givenBook = entityManager.find(BookEntity.class, book.getId());


        sut.save( // 2
                BookEntity.builder()
                        .id(givenBook.getId())
                        .isbn(givenBook.getIsbn())
                        .title("JPA 401")
                        .build()
        );


        BookEntity result = entityManager.find(BookEntity.class, book.getId()); // 3
        LocalDateTime createdAt = result.getCreateAt();
        LocalDateTime updatedAt = result.getUpdatedAt();
        assertEquals("JPA 401", result.getTitle());
        assertTrue(updatedAt.isAfter(createdAt));
    }
}
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-07-11-pre-persist-pre-update>

#### REFERENCE

- <https://blog.naver.com/seek316/223353802740>
