---
title: "대용량 CSV 다운로드 스트리밍(streaming) 처리를 통해 개선하기"
search: false
category:
  - spring
  - spring-data-jpa
  - async-response
  - performance
last_modified_at: 2026-08-16T00:52:55+09:00
---

<br/>

## 1. Problem context

문제 현상을 살펴보자. 사용자로부터 'CSV 파일을 다운로드할 때 브라우저에서 반응이 없다'라는 피드백을 받았다. 원인은 단순히 데이터가 너무 많았기 때문이다. 데이터베이스에서 필요한 데이터를 가져오는 쿼리의 실행 시간이 길어졌다.

데이터를 동기식으로 조회한 후 응답으로 내려주기 때문에 데이터가 많을수록 클라이언트의 반응이 느렸다. 기존 기능은 다음과 같은 방식으로 구현되어 있었다.

- 레포지토리 객체의 findAll 메서드는 JPA가 제공하는 기본 메서드로, 모든 데이터를 가져온다.
- 조회한 데이터로 CSV 형식의 응답을 만들어 반환한다.

```java
@RestController
@RequestMapping("/legacy")
public class LegacyTodoExportController {

    private final TodoRepository repository;

    public LegacyTodoExportController(TodoRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportLegacy() {
        var csvHeader = "id,title,description,completed\n";
        var csvContent = repository.findAll()
                .stream()
                .map(todo ->
                        List.of(
                                todo.getId().toString(),
                                todo.getTitle(),
                                todo.getDescription(),
                                todo.isCompleted() ? "완료" : "미완료"
                        )
                )
                .map(columns -> String.join(",", columns))
                .collect(Collectors.joining("\n"));

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"todos.csv\"")
                .body((csvHeader + csvContent + "\uFEFF").getBytes(StandardCharsets.UTF_8));
    }
}
```

위 로직에서는 데이터가 많을수록 findAll 메서드의 실행 시간이 길어진다. 이 때문에 사용자가 다운로드 버튼을 눌러도 반응이 없는 것처럼 보인다. 100만 건의 데이터를 CSV로 다운로드할 때 브라우저의 반응 속도를 체감해 보자. 다운로드 버튼을 누른 후 아무런 반응이 없다가 10초 뒤 파일 다운로드가 시작된다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/csv-download-with-streaming-01.gif" width="100%" class="image__border">
</div>

## 2. Solve the problem

쿼리 자체를 빠르게 만드는 것만으로는 한계가 있었다. 다운로드 기능 중에는 기간 조건만 사용하는 단순한 쿼리나 위 예제처럼 findAll 메서드로 모든 데이터를 조회하는 경우도 있었다. 따라서 데이터베이스 인덱스만으로는 문제를 해결할 수 없었다. 가장 큰 문제는 응답이 늦어 사용자가 서비스가 멈춘 것 같다는 인상을 받는다는 점이다. 이 문제는 스프링 프레임워크의 두 가지 기능으로 해결할 수 있다.

- HTTP 스트리밍 방식인 StreamingResponseBody 인터페이스
- JPA 스트림 조회

스프링 MVC는 비동기 요청 처리를 위한 반환 타입으로 StreamingResponseBody 인터페이스를 지원한다. 이 인터페이스를 사용하면 HTTP 응답의 OutputStream에 직접 데이터를 쓸 수 있다. 실제 스트리밍 작업은 별도의 스레드에서 수행되므로 서블릿 컨테이너(servlet container)의 요청 처리 스레드를 계속 점유하지 않는다. 이를 통해 리퀘스트 퍼 스레드(request-per-thread) 모델인 스프링 MVC에서 요청 처리 스레드가 오랫동안 점유되는 문제를 완화할 수 있다.

```java
@GetMapping("/download")
public StreamingResponseBody handle() {
    return new StreamingResponseBody() {
        @Override
        public void writeTo(OutputStream outputStream) throws IOException {
            // write...
        }
    };
}
```

스프링 데이터 JPA는 `Stream<T>` 반환 타입을 지원한다. 조회 결과 전체를 컬렉션으로 만든 후 Stream 객체로 감싸는 것이 아니라 JPA, Hibernate, JDBC 등 실제 데이터 저장소 계층이 제공하는 스트리밍(streaming) 기능을 이용해 결과를 점진적으로 처리할 수 있다. 예를 들어 보자. 아래 메서드는 데이터베이스에서 SELECT 쿼리의 전체 결과를 읽고 이를 `List<User>` 컬렉션에 담아 반환한다.

```java
List<TodoEntity> todos = repository.findAll();
```

반면 아래처럼 Stream 타입을 반환하는 메서드는 지정한 fetchSize만큼 데이터를 가져와 지연(lazy) 방식으로 처리한다. 조건에 맞는 데이터 중 일부를 버퍼에 가져오고, 버퍼에 있는 데이터를 모두 소비하면 다음 데이터를 fetchSize만큼 가져온다.

```java
@Query("select t from TodoEntity t")
@QueryHints(value = @QueryHint(name = "org.hibernate.fetchSize", value = "1000"))
Stream<TodoEntity> findAllAsStream();
```

이 두 기능을 사용하면 사용자에게 초기 응답을 더 빠르게 보낼 수 있다. 컨트롤러 영역의 코드를 살펴보기에 앞서 StreamingResponseBody를 살펴보자. 이 인터페이스는 OutputStream 객체를 매개변수로 받으며 반환 값이 없는 컨슈머(consumer) 타입의 함수형 인터페이스다.

```java
@FunctionalInterface
public interface StreamingResponseBody {

	/**
	 * A callback for writing to the response body.
	 * @param outputStream the stream for the response body
	 * @throws IOException an exception while writing
	 */
	void writeTo(OutputStream outputStream) throws IOException;

}
```

위 인터페이스를 반환하는 엔드포인트를 만든다. 응답 바디(body)에는 StreamingResponseBody의 추상 메서드와 형태가 같은 람다식이나 메서드 참조를 지정할 수 있다. 여기서는 ResponseEntity 클래스의 응답 바디에 TodoService 객체의 exportCsv 메서드 참조를 전달한다.

```java
@RestController
public class TodoExportController {

    private final TodoService todoService;

    public TodoExportController(TodoService todoService) {
        this.todoService = todoService;
    }

    @GetMapping("/export")
    public ResponseEntity<StreamingResponseBody> export() {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"todos.csv\"")
                // .body((outputStream) -> todoService.exportCsv(outputStream)); 아래와 동일
                .body(todoService::exportCsv);
    }
}
```

다음으로 서비스 레이어 코드를 살펴보자. 세 가지 처리가 필요하다.

1. 트랜잭션 경계 설정
2. 짧은 주기로 응답 보내기(flush)
3. 영속성 컨텍스트 비우기(clear)

스트림 반환 타입을 가진 JPA 메서드는 반드시 트랜잭션 내에서 동작해야 한다. 자세한 내용은 이번 글의 주제를 벗어나므로 별도의 글에서 다룰 예정이다. 서비스 레이어에서는 @Transactional 애너테이션으로 트랜잭션 경계를 설정해야 한다.

스트림에서 소비한 엔티티는 영속성 컨텍스트의 캐시 영역에 남는다. 영속성 컨텍스트를 주기적으로 비우지 않으면 애플리케이션 메모리에 대량의 데이터가 쌓인다. 따라서 fetchSize로 지정한 개수만큼 데이터를 소비할 때마다 EntityManager 객체의 clear 메서드로 영속성 컨텍스트를 비워준다.

이번 문제는 데이터 조회가 완료될 때까지 클라이언트에서 아무런 반응을 확인할 수 없어 발생했다. 클라이언트에 소량의 데이터라도 전송해 현재 처리가 진행 중임을 알려주면 된다. 영속성 컨텍스트를 비우는 것과 마찬가지로 fetchSize만큼 데이터를 소비할 때마다 OutputStream 객체에 쓴 데이터를 flush 메서드로 클라이언트에 전송한다.

```java
@Service
public class TodoService {

    private final TodoRepository todoRepository;
    private final EntityManager entityManager;

    public TodoService(TodoRepository todoRepository, EntityManager entityManager) {
        this.todoRepository = todoRepository;
        this.entityManager = entityManager;
    }

    // 1. 트랜잭션 경계 설정
    @Transactional(readOnly = true)
    public void exportCsv(OutputStream outputStream) {
        try (var stream = todoRepository.findAllAsStream()) {
            AtomicInteger count = new AtomicInteger();
            var csvHeader = "id,title,description,completed\n";
            outputStream.write(csvHeader.getBytes(StandardCharsets.UTF_8));
            stream.forEach(todo -> {
                var row = String.join(",",
                        List.of(
                                todo.getId().toString(),
                                todo.getTitle(),
                                todo.getDescription(),
                                todo.isCompleted() ? "완료" : "미완료",
                                "\n"
                        )
                );
                count.getAndIncrement();
                try {
                    outputStream.write(row.getBytes(StandardCharsets.UTF_8));
                    if (count.get() % 1000 == 0) {
                        // 1000개 소비 후 영속성 컨텍스트 비우기 (메모리 최적화)
                        entityManager.clear();
                        // 1000개 소비 후 flush (클라이언트 응답)
                        outputStream.flush();
                    }
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }
            });
            outputStream.write("\uFEFF".getBytes(StandardCharsets.UTF_8));
            outputStream.flush();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
```

마지막으로 JPA 레포지토리 인터페이스를 살펴보자. @QueryHints, @QueryHint 애너테이션을 사용해 하이버네이트(Hibernate)의 fetchSize 옵션을 1000개로 지정한다. fetchSize를 1000개로 지정하더라도 데이터를 1000개씩 조회하는 쿼리가 여러 번 실행되는 것은 아니다. 자세한 내용은 별도의 글에서 다룰 예정이다.

```java
public interface TodoRepository extends JpaRepository<TodoEntity, Long> {

    @Query("select t from TodoEntity t")
    @QueryHints(value = @QueryHint(name = "org.hibernate.fetchSize", value = "1000"))
    Stream<TodoEntity> findAllAsStream();
}
```

스트림 처리를 적용하면 초기 응답이 얼마나 빨라질까? 아래 영상을 보면 사용자가 다운로드 버튼을 누르자마자 다운로드가 시작된다. 다운로드가 언제 완료될지는 알 수 없지만, 사용자가 시스템이 멈췄거나 매우 느리다고 느끼는 상황을 방지할 수 있다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/csv-download-with-streaming-02.gif" width="100%" class="image__border">
</div>

## CLOSING

메모리 효율도 상당히 개선된다. 모든 데이터를 조회해 메모리에 올리는 것보다 1000개씩 처리한 후 버리는 편이 메모리 부하가 적다. 100만 건의 TODO 데이터를 findAll 메서드로 가져오면 아래와 같이 1.7GB 정도의 메모리를 사용한다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/csv-download-with-streaming-03.png" width="100%" class="image__border">
</div>

<br/>

반면 스트림 방식을 사용하면 메모리 사용량이 거의 늘지 않는다. 한 번에 1000건의 데이터만 메모리에 올려 처리한 후 버리기 때문에 메모리 사용량의 변동 폭이 작다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/csv-download-with-streaming-04.png" width="100%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-08-15-csv-download-with-streaming>

#### REFERENCE

- <https://swmobenz.tistory.com/56>
- <https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-async.html#mvc-ann-async-output-stream>
- <https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-async.html>
- <https://docs.spring.io/spring-data/jpa/reference/repositories/query-methods-details.html#repositories.query-streaming>
- <https://docs.spring.io/spring-data/jpa/reference/4.1/repositories/query-return-types-reference.html#return-type.stream>
