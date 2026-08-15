---
title: "대용량 CSV 다운로드 Streaming 처리를 통한 개선"
search: false
category:
  - post-format
last_modified_at: 2100-01-01T23:55:00
---

<br/>

## 1. Problem context

문제 현상을 살펴보자. 사용자로부터 'CSV 파일을 다운로드 받을 때 브라우저에서 반응이 없다'라는 피드백을 받았다. 문제 원인은 단순하게 데이터가 너무 많았기 때문이다. 데이터베이스로부터 필요한 데이터를 가져오기 위해 쿼리를 수행하는 시간이 길어졌다.

동기식으로 데이터를 조회 후 내려주기 때문에 데이터가 많을수록 클라이언트는 반응이 느렸다. 다음과 같은 방식으로 구현되어 있었다.

- 레포지토리 객체의 findAll 메서드는 JPA 기본 메서드로 모든 데이터를 가져온다.
- 조회한 데이터로 CSV 포맷 응답을 만들어 반환한다.

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

위 로직에서 데이터가 많을수록 findAll 메서드의 실행 시간이 길어지기 때문에 사용자가 다운로드 버튼을 눌러도 반응이 없는 것처럼 보인다. 100만 건의 데이터를 CSV로 다운로드 받을 떄 화면의 응답 속도를 체감해보자. 다운로드 버튼을 누른 이후 아무런 반응이 없다가 10초 뒤에 파일이 다운로드된다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/csv-download-with-streaming-01.gif" width="100%" class="image__border">
</div>

## 2. Solve the problem

쿼리 자체를 빨라지게 하는 것만으로 한계가 있었다. 기간을 지정한 단순한 쿼리나 위 예제처럼 findAll 메서드를 사용하는 다운로드도 있었기 때문에 데이터베이스 인덱스를 활용하는 것만으로는 문제를 해결할 수 없었다. 가장 큰 문제점은 응답 피드백이 느려서 사용자가 서비스가 멈춘 것 같다는 인상을 받는 것이다. 이 문제는 스프링 프레임워크의 두 가지 기능을 통해 해결할 수 있다.

- HTTP Streaming 방식 StreamingResponseBody 인터페이스
- JPA Stream 조회

스프링 MVC의 StreamingResponseBody 인터페이스는 공식적으로 비동기 처리를 위한 반환 타입이다. 컨트롤러 엔드포인트에 주입되는 HttpServletResponse 객체의 OutputStream 에 직접 데이터를 쓸 수 있고, 서블릿 컨테이너(servlet container)의 요청 처리 스레드를 계속 점유하지 않도록 설계되어 있다. 대신 실제 스트리밍 작업은 별도의 스레드에서 수행된다. 리퀘스트-퍼-스레드(request-per-trhead) 모델인 스프링 MVC에 치명적인 서블릿 컨테이너 요청 처리 스레드가 오랜 시간 점유되는 문제를 완화할 수 있다.

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

스프링 JPA는 `Stream<T>` 리턴 타입을 지원한다. 조회 결과 전체를 컬렉션으로 만들고 Stream 객체로 감싸는 게 아니라, JPA, Hibernate, JDBC 등 실제 데이터 저장소 계층이 제공하는 스트리밍(streaming) 기능을 이용해 결과를 점진적으로 처리할 수 있다. 예를 들어보자. 아래 메서드는 데이터베이스에서 SELECT 해서 전체 결과를 읽고, 이를 `List<User>` 컬렉션에 담아서 반환한다.

```java
List<TodoEntity> todos = repository.findAll();
```

반면, 아래 Stream 타입을 반환하는 메서드는 데이터를 지정한 fetchSize 만큼 데이터를 가져와서 게으르게(lazy) 소비한다. 조건에 맞는 데이터를 일부만 조회하고, 버퍼에 있는 데이터가 모두 소비되면 다음 데이터들을 fetchSize 만큼 조회한다.

```java
@Query("select t from TodoEntity t")
@QueryHints(value = @QueryHint(name = "org.hibernate.fetchSize", value = "1000"))
Stream<TodoEntity> findAllAsStream();
```

이 두 기능을 사용하면 사용자에게 좀 더 빠른 응답을 보낼 수 있다. 컨트롤러 영역 코드를 살펴보기에 앞서 StreamingResponseBody 인터페이스는 입력 파라미터가 OutputStream 객체이고, 반환 값이 없는 컨슈머(consumer) 타입의 함수형 인터페이스다.

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

위 인터페이스를 반환하는 엔드포인트를 만든다. 해당 응답 바디(body) StreamingResponseBody 함수형 인터페이스와 동일한 형태의 메서드로 지정할 수 있다. ResponseEntity 클래스의 응답 바디 부분에 TodoService 객체의 exportCsv 메소드 참조를 전달한다.

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

다음 서비스 레이어 코드를 살펴보자. 다음 3개의 로직이 필요하다.

1. 트랜잭션 경계 설정
2. 짧은 단위에 응답 내리기 (flush)
3. 영속성 컨텍스트 비우기 (clear)

스트림 반환 타입을 가진 JPA 메서드는 반드시 트랜잭션 내에서 동작해야 한다. 자세한 내용은 이번 글의 주제를 넘어가기 때문에 다른 글로 정리하면 좋을 것 같다. 서비스 레이어에서 @Transactional 애너테이션을 통해 트랜잭션 경계를 설정해야 한다.

데이터를 1000개 씩 조회하고, 소비한 데이터는 버려지지 않고 영속성 컨텍스트의 캐시 영역에 남는다. 주기적으로 영속성 컨텍스트를 비워주지 않으면 애플리케이션 메모리에 큰 용량의 데이터가 남는다. JPA 레포지토리에 지정한 fetchSize 만큼 소비했으면 EntityManager 객체의 clear 메서드를 통해 영속성 컨텍스트를 비워준다.

이번 문제는 데이터 조회가 완료될 때까지 기다리기 때문에 클라이언트 쪽은 반응이 없어서 발생했다. 클라이언트에게 작은 데이터라도 일부 응답해서 현재 처리가 진행 중임을 알려주면 된다. 영속성 컨텍스트를 비우는 것과 마찬가지로 fetchSize 만큼 소비했으면 outputStream 객체에 쓰여진 데이터를 flush 메서드를 통해 클라이언트에게 내려 보낸다.

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

마지막으로 JPA 레포지토리 인터페이스를 살펴보자. @QueryHints, @QueryHint 애너테이션을 사용해서 하이버네이트(hibernate) fetchSize 옵션을 1000개로 지정한다. fetchSize를 1000개로 지정한다고 해서 1000개씩 데이터를 조회하는 쿼리가 여러 번 수행되는 것은 아니다. 자세한 내용은 다른 글로 정리할 생각이다.

```java
public interface TodoRepository extends JpaRepository<TodoEntity, Long> {

    @Query("select t from TodoEntity t")
    @QueryHints(value = @QueryHint(name = "org.hibernate.fetchSize", value = "1000"))
    Stream<TodoEntity> findAllAsStream();
}
```

이렇게 스트림 처리가 적용되었을 때 데이터를 조회하면 얼마나 빠르게 반응할까? 아래 영상을 보면 사용자가 클릭 버튼을 누르자마자 다운로드가 실행된다. 완료가 어느 시점에 될지 알 수는 없지만, 사용자가 시스템이 멈췄거나 매우 느린 것처럼 느끼게 만드는 나쁜 경험을 만들지 않는다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/csv-download-with-streaming-02.gif" width="100%" class="image__border">
</div>

## CLOSING

메모리 효율 측면에서도 상당히 좋아진다. 모든 데이터를 조회해서 메모리에 올리는 것보다 1000개 씩 사용하고 버리는 편이 메모리 차원에서 부하가 덜하다. 100만 건의 TODO 데이터를 findAll 메서드를 통해 가져오면 아래 사진과 같이 1.7GB 정도의 메모리를 사용한다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/csv-download-with-streaming-03.png" width="100%" class="image__border">
</div>

<br/>

반면, 스트림 방식을 사용하면 메모리 사용량이 거의 없다. 1000건의 데이텅만 메모리에 올려서 사용 후 버리기 때문에 메모리 사용량을 봤을 때 흔들림이 적다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/csv-download-with-streaming-04.png" width="100%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <>

#### REFERENCE

- <https://swmobenz.tistory.com/56>
- <https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-async.html#mvc-ann-async-output-stream>
- <https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-async.html>
- <https://docs.spring.io/spring-data/jpa/reference/repositories/query-methods-details.html#repositories.query-streaming>
- <https://docs.spring.io/spring-data/jpa/reference/4.1/repositories/query-return-types-reference.html#return-type.stream>