---
title: "@PrePersist, @PreUpdate 애너테이션 활용하기"
search: false
category:
  - spring-boot
  - jpa
  - junit
last_modified_at: 2021-09-04T13:00:00
---

<br/>

## 1. 애너테이션 소개
### 1.1. @PrePersist 애너테이션
JPA 엔티티(Entity)가 비영속(new/transient) 상태에서 영속(managed) 상태가 되는 시점 이전에 실행됩니다. 

<p align="center"><img src="/images/pre-persist-pre-update-1.JPG" width="70%"></p>

### 1.2. @PreUpdate 애너테이션
영속 상태의 엔티티를 이용하여 데이터 업데이트를 수행하기 이전에 실행됩니다. 

<p align="center"><img src="/images/pre-persist-pre-update-2.JPG" width="70%"></p>

### 1.3. @MappedSuperclass 애너테이션 - createdAt, lastUpdatedAt 필드 적용하기
데이터베이스 엔티티 설계 시 기본적으로 반드시 필요한 데이터가 존재합니다. 
대표적으로 데이터 생성 시점(createdAt), 데이터 마지막 업데이트 시점(lastUpdatedAt)을 예로 들어보겠습니다. 

두 필드를 모든 엔티티에 포함시키고 싶어서 상속(Inheritance)을 이용하였습니다. 
아래와 같은 모습을 갖도록 엔티티 설계를 수행하였습니다. 

#### 1.3.1. Base 엔티티 설계 모습
- 자식 클래스에서 부모 클래스의 필드를 컬럼으로 사용할 수 있도록 `@MappedSuperclass` 애너테이션을 사용합니다. 
- 두 항목이 NULL 값을 가질 수 없도록 NOT_NULL 제약사항을 주었습니다. 
- createdAt 필드는 INSERT 시점에만 필요한 항목이므로 updatable 옵션을 false 값으로 지정합니다.
- `@PrePersist` 애너테이션 없이 prePersist 메소드를 정의하고 createAt, lastUpdatedAt 필드를 현재 시각으로 지정합니다. 
- `@PreUpdate` 애너테이션 없이 preUpdate 메소드를 정의하고 lastUpdatedAt 필드를 현재 시각으로 지정합니다. 

```java
@Log4j2
@Getter
@Setter
@NoArgsConstructor
@MappedSuperclass
class Base {

    @Column(name = "CREATED_AT", updatable = false, nullable = false)
    private LocalDateTime createAt;

    @Column(name = "LAST_UPDATED_AT", nullable = false)
    private LocalDateTime lastUpdatedAt;

    public void prePersist() {
        log.info("prePersist");
        LocalDateTime now = LocalDateTime.now();
        createAt = now;
        lastUpdatedAt = now;
    }

    public void preUpdate() {
        log.info("preUpdate");
        lastUpdatedAt = LocalDateTime.now();
    }
}
```

#### 1.3.2. 일반 엔티티 설계 모습
- `@PrePersist` 애너테이션을 추가한 prePersist 메소드를 재정의합니다. 
- 부모 클래스의 prePersist 메소드 호출 후 해당 엔티티에서 default 값이 필요한 필드를 채웁니다.
- `@PreUpdate` 애너테이션을 추가한 preUpdate 메소드를 재정의합니다. 
- 부모 클래스의 preUpdate 메소드를 호출합니다.

```java
@Getter
@Setter
@NoArgsConstructor
@Entity
class Book extends Base {

    @Id
    @GeneratedValue
    private Long id;

    @Column(name = "TITLE")
    private String title;

    @Column(name = "DEFAULT_VALUE")
    private String defaultValue;

    @Override
    @PrePersist
    public void prePersist() {
        super.prePersist();
        defaultValue = defaultValue == null ? "DEFAULT" : defaultValue;
    }

    @Override
    @PreUpdate
    public void preUpdate() {
        super.preUpdate();
    }
}
```

## 2. 테스트 코드

### 2.1. test_prePersist_createdAtIsNotNull 메소드
- 새로운 book 객체를 만듭니다.
- JpaRepository save 메소드를 통해 해당 객체를 영속 상태로 만들어줍니다.
- createdAt 항목이 NULL 값이 아닌지 확인합니다.
- 로그를 통해 prePersist 메소드가 어느 시점에 호출되었는지 확인합니다.

```java
    @Test
    public void test_prePersist_createdAtIsNotNull() {
        Book book = new Book();
        log.info("before save");
        bookRepository.save(book);
        log.info("after save");
        assertThat(book.getCreateAt()).isNotNull();
    }
```

##### test_prePersist_createdAtIsNotNull 메소드 수행 로그
- book 객체의 createdAt 항목을 별도로 지정해주지 않았음에도 NULL 값이 아님을 확인할 수 있습니다.
- 로그를 통해 `before save` > `prePersist` > `INSERT QUERY` > `after save` 순으로 동작했음을 확인할 수 있습니다.

```
2021-07-20 02:16:47.185  INFO 18388 --- [           main] blog.in.action.PrePersistUpdateTest      : before save
2021-07-20 02:16:47.195  INFO 18388 --- [           main] blog.in.action.Base                      : prePersist
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: insert into book (created_at, last_updated_at, default_value, title, id) values (?, ?, ?, ?, ?)
2021-07-20 02:16:47.246  INFO 18388 --- [           main] blog.in.action.PrePersistUpdateTest      : after save
```

### 2.2. test_preUpdate 메소드
- 새로운 book 객체를 만듭니다.
- 해당 객체를 영속 상태로 만듭니다.
- book 객체의 title 필드를 변경합니다.
- JpaRepository save 메소드를 통해 변경된 값을 반영합니다.
- 반환된 retutrnedBook 객체와 book 객체가 동일한지 확인합니다. 
- book 객체의 createAt 필드와 lastUpdatedAt 필드 값이 동일한지 확인합니다.
- retutrnedBook 객체의 createAt 필드와 lastUpdatedAt 필드 값이 동일한지 확인합니다.
- 로그를 통해 preUpdate 메소드가 어느 시점에 호출되었는지 확인합니다.

```java
    @Test
    public void test_preUpdate() throws InterruptedException {
        Book book = new Book();
        log.info("before first save");
        Book returnedBook = bookRepository.save(book);
        log.info("after first save");
        assertThat(book).isEqualTo(returnedBook);
        book.setTitle("CHANGED");
        Thread.sleep(1000L);
        log.info("before second save");
        returnedBook = bookRepository.save(book);
        log.info("after second save");
        assertThat(book).isNotEqualTo(returnedBook);
        assertThat(book.getCreateAt()).isEqualTo(book.getLastUpdatedAt());
        assertThat(returnedBook.getCreateAt()).isNotEqualTo(returnedBook.getLastUpdatedAt());
    }
```

##### test_preUpdate 메소드 수행 로그
- 비영속 객체를 영속 상태로 만드는 save 메소드 수행 시 반환된 returnedBook 객체는 book 객체와 동일함을 확인할 수 있습니다.
- 영속 상태의 객체 필드 값 변경 후 save 메소드 수행 시 반환된 returnedBook 객체는 book 객체와 동일하지 않음을 확인할 수 있습니다. 
- book 객체의 createdAt 필드와 lastUpdatedAt 필드의 값이 동일함을 알 수 있습니다.
- returnedBook 객체의 createdAt 필드와 lastUpdatedAt 필드의 값이 동일하지 않음을 알 수 있습니다. 
- 로그를 통해 `before first save` > `prePersist` > `INSERT QUERY` > `after first save` > `before second save` > `preUpdate` > `after second save` 순으로 동작하였습니다.

```
2021-07-20 13:57:20.779  INFO 7156 --- [           main] blog.in.action.PrePersistUpdateTest      : before first save
2021-07-20 13:57:20.795  INFO 7156 --- [           main] blog.in.action.Base                      : prePersist
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: insert into book (created_at, last_updated_at, default_value, title, id) values (?, ?, ?, ?, ?)
2021-07-20 13:57:20.885  INFO 7156 --- [           main] blog.in.action.PrePersistUpdateTest      : after first save
2021-07-20 13:57:21.934  INFO 7156 --- [           main] blog.in.action.PrePersistUpdateTest      : before second save
Hibernate: select book0_.id as id1_0_0_, book0_.created_at as created_2_0_0_, book0_.last_updated_at as last_upd3_0_0_, book0_.default_value as default_4_0_0_, book0_.title as title5_0_0_ from book book0_ where book0_.id=?
2021-07-20 13:57:21.977  INFO 7156 --- [           main] blog.in.action.Base                      : preUpdate
Hibernate: update book set last_updated_at=?, default_value=?, title=? where id=?
2021-07-20 13:57:21.981  INFO 7156 --- [           main] blog.in.action.PrePersistUpdateTest      : after second save
```

##### 데이터베이스 확인

<p align="left"><img src="/images/pre-persist-pre-update-3.JPG" width="50%"></p>

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-07-20-pre-persist-pre-update>
