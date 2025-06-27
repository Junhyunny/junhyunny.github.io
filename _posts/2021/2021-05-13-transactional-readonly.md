---
title: "readOnly Attribute in @Transactional"
search: false
category:
  - spring-boot
  - jpa
  - junit
last_modified_at: 2021-09-01T02:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [EntityManager 특징과 영속성 컨텍스트 장점][persistence-context-advantages-link]
* [테스트 컨테이너와 스프링 애플리케이션 MySQL 결합 테스트][test-container-for-database-link]

## 1. @Transactional readOnly Attribute

먼저 `javadoc`을 살펴봤습니다. 

* 트랜잭션이 읽기 전용인 경우 true 값으로 설정하는 플래그이다.
* 런타임 시 해당 트랜잭션을 최적화한다.
* 트랜잭션 하위 시스템에 대한 힌트 역할을 수행한다.
* 반드시 쓰기 액세스 시도 실패를 야기하지 않는다.
* 읽기 전용 힌트를 해석할 수 없는 트랜잭션 매니저는 예외를 던지지 않고 힌트는 무시한다. 

```java
    /**
     * A boolean flag that can be set to {@code true} if the transaction is
     * effectively read-only, allowing for corresponding optimizations at runtime.
     * <p>Defaults to {@code false}.
     * <p>This just serves as a hint for the actual transaction subsystem;
     * it will <i>not necessarily</i> cause failure of write access attempts.
     * A transaction manager which cannot interpret the read-only hint will
     * <i>not</i> throw an exception when asked for a read-only transaction
     * but rather silently ignore the hint.
     * @see org.springframework.transaction.interceptor.TransactionAttribute#isReadOnly()
     * @see org.springframework.transaction.support.TransactionSynchronizationManager#isCurrentTransactionReadOnly()
     */
    boolean readOnly() default false;
```

어떤 뉘앙스인지 알 것 같지만, 기능에 대한 정확한 이해를 원했습니다. 
검색 중 백기선님의 댓글을 발견했습니다. 

> readOnly는 현재 해당 그 트랜잭션 내에서 데이터를 읽기만 할건지 설정하는 겁니다. 이걸 설정하면 DB 중에 read 락(lock)과 write 락을 따로 쓰는 경우 해당 트랜잭션에서 의도치 않게 데이터를 변경하는 일을 막아줄 뿐 아니라, 하이버네이트를 사용하는 경우에는 FlushMode를 Manual로 변경하여 dirty checking을 생략하게 해준다거나 DB에 따라 DataSource의 Connection 레벨에도 설정되어 약간의 최적화가 가능합니다.

관련된 내용들을 바탕으로 다시 정리해봤습니다. 

* 의도지 않게 데이터를 변경하는 것을 막아준다. 
* 하이버네이트(hibernate)를 사용하는 경우에는 플러시 모드를 매뉴얼(manual)로 변경한다.
    * 오염 감지(dirty checking) 과정을 생략하면서 속도 향상 효과를 얻는다.
* 데이터베이스에 따라 데이터소스(datasource) 연결 수준에서 약간의 최적화가 가능하다.

## 2. Practice

데이터소스 연결 설정에 관련된 내용을 제외하고 요약한 내용들을 간단한 테스트 코드를 통해 살펴보겠습니다. 
다음과 같은 환경에서 테스트를 수행합니다.

* JDK17
* Spring Boot 3.1.0
* TestConatiner for MySql

### 2.1. application.yml

* 로그 확인을 위해 필요한 패키지들의 로그 레벨을 트레이스(trace)로 변경합니다.

```yml
logging:
  level:
    org.springframework.orm.jpa: DEBUG
    org.hibernate.persister.entity: TRACE
```

### 2.2. PostService Class

* 클래스에 `readonly` 속성을 true 값으로 설정합니다.
    * 클래스 하위 모든 메소드들에게 적용됩니다.
* arhive 메소드
    * 데이터를 조회 후 엔티티의 상태를 변경합니다.
    * 오염 감지 기능이 동작하기를 예상합니다.

```java
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class PostService {

    private final PostRepository repository;

    public void create(Post post) {
        repository.save(post);
    }

    public void update(Post post) {
        repository.save(post);
    }

    public void archive(long id) {
        var post = repository.findById(id).orElseThrow();
        post.archive();
    }
}
```

### 2.3. Post Entity Class

엔티티(entity)를 작성합니다.

```java
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private String content;
    @Enumerated(value = EnumType.STRING)
    private PostState state;

    public void archive() {
        state = ARCHIVE;
    }
}
```

### 2.4. ReadOnlyAttributeTests Class

* throw_exception_when_create_in_readonly
    * `readonly`인 경우 새로운 데이터 삽입(insert)시 에러가 발생합니다.
    * "Connection is read-only. Queries leading to data modification are not allowed" 에러 메시지를 확인합니다.
* nothing_change_when_update_in_readonly
    * `readonly`인 경우 업데이트가 이뤄지지 않습니다.
* nothing_change_when_dirty_check_in_readonly
    * `readonly`인 경우 업데이트가 이뤄지지 않습니다.

```java
@SpringBootTest
@TestPropertySource(
        properties = {
                "spring.jpa.show-sql=true",
                "spring.jpa.hibernate.ddl-auto=create",
                "spring.datasource.url=jdbc:tc:mysql:8.0.32:///test",
                "spring.datasource.driver-class-name=org.testcontainers.jdbc.ContainerDatabaseDriver",
        }
)
@Testcontainers
public class ReadOnlyAttributeTests {

    @Container
    static MySQLContainer<?> mysqlContainer = new MySQLContainer<>("mysql:8.0.32").withDatabaseName("test");

    @Autowired
    PostService sut;

    @Autowired
    PostRepository repository;

    @BeforeEach
    void beforeEach() {
        repository.deleteAll();
    }

    @Test
    void throw_exception_when_create_in_readonly() {

        JpaSystemException throwable = assertThrows(JpaSystemException.class, () -> {
            sut.create(
                    Post.builder()
                            .content("Hello World")
                            .build()
            );
        });


        var result = repository.findByContent("Hello World");
        assertThat(result, equalTo(null));
        assertThat(throwable.getRootCause().getMessage(), equalTo("Connection is read-only. Queries leading to data modification are not allowed"));
    }

    @Test
    void nothing_change_when_update_in_readonly() {

        var post = Post.builder()
                .content("Hello World")
                .build();
        repository.saveAndFlush(post);


        sut.update(
                Post.builder()
                        .id(post.getId())
                        .content("This is new world")
                        .build()
        );


        var result = repository.findById(post.getId()).orElseThrow();
        assertThat(result.getContent(), equalTo("Hello World"));
    }

    @Test
    void nothing_change_when_dirty_check_in_readonly() {

        var post = Post.builder()
                .state(STAGE)
                .build();
        repository.saveAndFlush(post);


        sut.archive(post.getId());


        var result = repository.findById(post.getId()).orElseThrow();
        assertThat(result.getState(), equalTo(STAGE));
    }
}
```

### 2.5. Result Logs

각 테스트 별로 로그를 살펴보겠습니다. 

#### 2.5.1. Insert

* 삽입 관련 쿼리가 출력됩니다. 
* SQL Error: 0, SQLState: S1009 에러가 발생합니다.
* "Connection is read-only. Queries leading to data modification are not allowed" 메시지가 출력됩니다.

```
23:53:07.518 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.deleteAll]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
23:53:07.518 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Opened new EntityManager [SessionImpl(2082364692<open>)] for JPA transaction
23:53:07.523 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@3b6098fd]
Hibernate: select p1_0.id,p1_0.content,p1_0.state from post p1_0
23:53:07.609 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Initiating transaction commit
23:53:07.609 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Committing JPA transaction on EntityManager [SessionImpl(2082364692<open>)]
23:53:07.612 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Closing JPA EntityManager [SessionImpl(2082364692<open>)] after transaction
23:53:07.616 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Creating new transaction with name [blog.in.action.transcation.readonly.PostService.create]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
23:53:07.617 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Opened new EntityManager [SessionImpl(1036454560<open>)] for JPA transaction
23:53:07.620 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@76ac3ad0]
23:53:07.620 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Found thread-bound EntityManager [SessionImpl(1036454560<open>)] for JPA transaction
23:53:07.620 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Participating in existing transaction
Hibernate: insert into post (content,state) values (?,?)
23:53:07.638 [main] WARN  org.hibernate.engine.jdbc.spi.SqlExceptionHelper - SQL Error: 0, SQLState: S1009
23:53:07.638 [main] ERROR org.hibernate.engine.jdbc.spi.SqlExceptionHelper - Connection is read-only. Queries leading to data modification are not allowed
23:53:07.640 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Participating transaction failed - marking existing transaction as rollback-only
23:53:07.641 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Setting JPA transaction on EntityManager [SessionImpl(1036454560<open>)] rollback-only
23:53:07.642 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Initiating transaction rollback
23:53:07.642 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Rolling back JPA transaction on EntityManager [SessionImpl(1036454560<open>)]
23:53:07.647 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Closing JPA EntityManager [SessionImpl(1036454560<open>)] after transaction
23:53:07.649 [main] DEBUG org.springframework.orm.jpa.SharedEntityManagerCreator$SharedEntityManagerInvocationHandler - Creating new EntityManager for shared EntityManager invocation
23:53:07.675 [main] TRACE org.hibernate.persister.entity.AbstractEntityPersister - #findSubPart(`content`)
23:53:07.675 [main] TRACE org.hibernate.persister.entity.AbstractEntityPersister - #findSubPart(`content`)
Hibernate: select p1_0.id,p1_0.content,p1_0.state from post p1_0 where p1_0.content=?
```

#### 2.5.2. Update

* 업데이트 쿼리 관련 로그가 출력되지 않습니다.

```
23:53:07.748 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.deleteAll]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
23:53:07.748 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Opened new EntityManager [SessionImpl(816736033<open>)] for JPA transaction
23:53:07.750 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@717b4de2]
Hibernate: select p1_0.id,p1_0.content,p1_0.state from post p1_0
23:53:07.755 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Initiating transaction commit
23:53:07.755 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Committing JPA transaction on EntityManager [SessionImpl(816736033<open>)]
Hibernate: delete from post where id=?
23:53:07.765 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Closing JPA EntityManager [SessionImpl(816736033<open>)] after transaction
23:53:07.765 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.saveAndFlush]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
23:53:07.766 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Opened new EntityManager [SessionImpl(429409829<open>)] for JPA transaction
23:53:07.767 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@4e293c35]
Hibernate: insert into post (content,state) values (?,?)
23:53:07.769 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Initiating transaction commit
23:53:07.769 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Committing JPA transaction on EntityManager [SessionImpl(429409829<open>)]
23:53:07.773 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Closing JPA EntityManager [SessionImpl(429409829<open>)] after transaction
23:53:07.773 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Creating new transaction with name [blog.in.action.transcation.readonly.PostService.update]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
23:53:07.774 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Opened new EntityManager [SessionImpl(1998598990<open>)] for JPA transaction
23:53:07.776 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@2c78771b]
23:53:07.776 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Found thread-bound EntityManager [SessionImpl(1998598990<open>)] for JPA transaction
23:53:07.776 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Participating in existing transaction
23:53:07.777 [main] TRACE org.hibernate.persister.entity.AbstractEntityPersister - Fetching entity: [blog.in.action.transcation.readonly.Post#2]
Hibernate: select p1_0.id,p1_0.content,p1_0.state from post p1_0 where p1_0.id=?
23:53:07.780 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Initiating transaction commit
23:53:07.780 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Committing JPA transaction on EntityManager [SessionImpl(1998598990<open>)]
23:53:07.784 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Closing JPA EntityManager [SessionImpl(1998598990<open>)] after transaction
23:53:07.784 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.findById]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
23:53:07.784 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Opened new EntityManager [SessionImpl(1299858199<open>)] for JPA transaction
23:53:07.786 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@5f1d270a]
23:53:07.786 [main] TRACE org.hibernate.persister.entity.AbstractEntityPersister - Fetching entity: [blog.in.action.transcation.readonly.Post#2]
Hibernate: select p1_0.id,p1_0.content,p1_0.state from post p1_0 where p1_0.id=?
23:53:07.788 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Initiating transaction commit
23:53:07.789 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Committing JPA transaction on EntityManager [SessionImpl(1299858199<open>)]
23:53:07.792 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Closing JPA EntityManager [SessionImpl(1299858199<open>)] after transaction
```

#### 2.5.3. Dirty Checking

* 업데이트 쿼리 관련 로그가 출력되지 않습니다.

```
23:53:07.694 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.deleteAll]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
23:53:07.694 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Opened new EntityManager [SessionImpl(1333404258<open>)] for JPA transaction
23:53:07.696 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@4a577b99]
Hibernate: select p1_0.id,p1_0.content,p1_0.state from post p1_0
23:53:07.699 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Initiating transaction commit
23:53:07.699 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Committing JPA transaction on EntityManager [SessionImpl(1333404258<open>)]
23:53:07.702 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Closing JPA EntityManager [SessionImpl(1333404258<open>)] after transaction
23:53:07.702 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.saveAndFlush]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
23:53:07.703 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Opened new EntityManager [SessionImpl(833536074<open>)] for JPA transaction
23:53:07.704 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@109fff4a]
Hibernate: insert into post (content,state) values (?,?)
23:53:07.716 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Initiating transaction commit
23:53:07.716 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Committing JPA transaction on EntityManager [SessionImpl(833536074<open>)]
23:53:07.721 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Closing JPA EntityManager [SessionImpl(833536074<open>)] after transaction
23:53:07.721 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Creating new transaction with name [blog.in.action.transcation.readonly.PostService.archive]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
23:53:07.722 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Opened new EntityManager [SessionImpl(372894842<open>)] for JPA transaction
23:53:07.724 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@1928208d]
23:53:07.724 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Found thread-bound EntityManager [SessionImpl(372894842<open>)] for JPA transaction
23:53:07.724 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Participating in existing transaction
23:53:07.728 [main] TRACE org.hibernate.persister.entity.AbstractEntityPersister - Fetching entity: [blog.in.action.transcation.readonly.Post#1]
Hibernate: select p1_0.id,p1_0.content,p1_0.state from post p1_0 where p1_0.id=?
23:53:07.734 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Initiating transaction commit
23:53:07.734 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Committing JPA transaction on EntityManager [SessionImpl(372894842<open>)]
23:53:07.738 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Closing JPA EntityManager [SessionImpl(372894842<open>)] after transaction
23:53:07.738 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.findById]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
23:53:07.738 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Opened new EntityManager [SessionImpl(509557834<open>)] for JPA transaction
23:53:07.740 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@2aea7775]
23:53:07.740 [main] TRACE org.hibernate.persister.entity.AbstractEntityPersister - Fetching entity: [blog.in.action.transcation.readonly.Post#1]
Hibernate: select p1_0.id,p1_0.content,p1_0.state from post p1_0 where p1_0.id=?
23:53:07.742 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Initiating transaction commit
23:53:07.742 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Committing JPA transaction on EntityManager [SessionImpl(509557834<open>)]
23:53:07.745 [main] DEBUG org.springframework.orm.jpa.JpaTransactionManager - Closing JPA EntityManager [SessionImpl(509557834<open>)] after transaction
```

## CLOSING

관련된 포스트들을 확인하니 데이터베이스 제품에 따라 readOnly 기능 제공 여부가 다르다고 합니다. 

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-05-13-transactional-readonly>

#### REFERENCE

* <https://www.inflearn.com/questions/7185>
* <http://wonwoo.ml/index.php/post/839>
* <https://kwonnam.pe.kr/wiki/springframework/transaction>

[persistence-context-advantages-link]: https://junhyunny.github.io/spring-boot/jpa/junit/persistence-context-advantages/
[test-container-for-database-link]: https://junhyunny.github.io/spring-boot/test-container/mysql/test-container-for-database/