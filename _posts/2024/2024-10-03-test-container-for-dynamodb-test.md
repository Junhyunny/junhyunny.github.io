---
title: "테스트 컨테이너와 스프링 애플리케이션 DynamoDB 결합 테스트"
search: false
category:
  - spring-boot
  - aws
  - dynamodb
  - test-container
last_modified_at: 2024-10-03T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [DynamoDB CRUD example with spring boot][dynamodb-crud-example-with-spring-boot-link]
- [Problem of sharing ApplicationContext with TestContainer][problem-of-sharing-application-context-with-test-container-link]
- [How to setup TestContainer in Kotlin Spring Boot][how-to-setup-testcontainer-in-kotlin-spring-boot-link]

## 0. 들어가면서

[이전 글][dynamodb-crud-example-with-spring-boot-link]에선 스프링 부트 애플리케이션에서 DynamoDB에 데이터를 읽고 쓰는 예제를 다뤘다. 이번 글을 테스트 컨테이너(TestContainer)를 사용해 애플리케이션이 DynamoDB와 결합 테스트를 수행하는 방법에 대해 정리했다. 일부 변경이 있지만, 대부분의 코드는 이전 글과 동일하다.

## 1. Dependencies

RDB(relational database)는 테스트 용도를 위해 H2 같은 페이크(fake) 데이터베이스가 존재한다. DynamoDB는 AWS에서 제공하는 `DynamoDBLocal`, `SQLite4Java` 의존성을 사용해 테스트하는 방법이 있는 것 같다. 

현재 프로젝트는 로컬 환경에서 DynamoDB 컨테이너를 사용하고 있기 때문에 테스트를 위해 DynamoDBLocal 의존성을 추가하기 보단 테스트 컨테이너를 사용한 결합 테스트가 나은 선택이라 생각했다. 이번 예제를 위해선 다음과 같은 의존성이 필요하다. 

```groovy
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
    // AWS dependencies
    implementation(platform("software.amazon.awssdk:bom:2.28.11"))
    implementation("software.amazon.awssdk:dynamodb-enhanced")
    // TestContainer dependency
    testImplementation("org.springframework.boot:spring-boot-testcontainers")
}
```

## 2. application YAML

[이전 글][dynamodb-crud-example-with-spring-boot-link]의 예제 중 application YAML 설정을 일부 변경한다. 테스트 컨테이너에 의해 실행된 DynamoDB 컨테이너에 연결하기 위해선 테스트마다 변경되는 포트(port)에 맞게 엔드포인트를 주입받아야 하기 때문이다.

- endpoint
  - DynamoDB 컨테이너의 엔드포인트다.
  - 로컬 환경에서 실행할 땐 AMAZON_DYNAMODB_ENDPOINT 변수에 로컬 DynamoDB 컨테이너의 엔드포인트 주소를 설정한다.
  - AWS 클라우드 환경에선 실행할 땐 AMAZON_DYNAMODB_ENDPOINT 변수 값을 설정하지 않는다. 

```yml
amazon:
  dynamodb:
    table-name: ActionInBlog_20241001
    endpoint: ${AMAZON_DYNAMODB_ENDPOINT:default}
```

## 3. DynamoDbConfig class

런타임(runtime) 중 DynamoDB와 통신하는 클라이언트 객체를 만드는 방법도 변경한다.

1. endpoint 설정 값을 주입받는다.
  - 기본적으로 "default" 값을 주입 받는다. AWS 클라우드 환경에선 AMAZON_DYNAMODB_ENDPOINT 환경 변수를 설정하지 않으므로 동일하게 "default" 값이 주입된다.
  - 테스트 환경에서 테스트 컨테이너가 실행된 후 환경 설정 값이 변경되었다면 테스트 컨테이너의 엔드포인트 주소가 주입된다.
  - 로컬 환경에서 IDE로 실행할 땐 AMAZON_DYNAMODB_ENDPOINT 환경 변수 값에 로컬 DynamoDB 엔드포인트 주소를 설정한다.
2. 엔드포인트 값이 "default"가 아닌 경우에만 클라이언트의 엔드포인트 정보를 설정된다.
  - 위 조건에 따라 AWS 클라우드 환경을 제외한 로컬, 테스트 환경은 DynamoDB 컨테이너의 엔드포인트 주소가 주입된 설정 값으로 변경된다.

```kotlin
@Configuration
class DynamoDbConfig(
    @Value("\${amazon.dynamodb.endpoint}") private val endpoint: String, // 1
) {
    @Bean
    fun dynamoDbClient(): DynamoDbClient {
        val builder = DynamoDbClient.builder().region(Region.AP_NORTHEAST_1)
        if (endpoint != "default") { // 2
            builder
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(
                    StaticCredentialsProvider.create(
                        AwsBasicCredentials.create("dummy", "dummy"),
                    ),
                )
        }
        return builder.build()
    }

    @Bean
    fun dynamoDbEnhancedClient(dynamoDbClient: DynamoDbClient): DynamoDbEnhancedClient =
        DynamoDbEnhancedClient
            .builder()
            .dynamoDbClient(dynamoDbClient)
            .build()
}
```

## 4. MockRepositoryConfig class

예전에 작성했던 [테스트 컨테이너와 스프링 애플리케이션 컨텍스트와 관련된 글][problem-of-sharing-application-context-with-test-container-link]처럼 테스트 컨테이너를 준비하는 작업을 여러 레포지토리 테스트에서 사용할 수 있도록 추상 클래스를 만든다. 코드가 길기 때문에 일부분씩 살펴본다.

1. 테스트 컨테이너에 생성할 테이블 이름이다.
2. 테스트 컨테이너가 실행되면 테이블이나 필요한 데이터를 만들기 위한 클라이언트 객체다.
3. 테스트 컨테이너를 실행시키기 위한 컨테이너 객체다.
4. 테스트 컨테이너를 실행하고 테스트에 필요한 클라이언트 객체와 DynamoDB 테이블을 생성한다.
  - deleteTableIfExists 메서드에선 테이블이 존재하는 경우 이를 삭제한다.
  - createTable 메서드에선 테이블을 생성한다.

```kotlin
package action.`in`.blog

import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.testcontainers.containers.GenericContainer
import org.testcontainers.utility.DockerImageName
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.dynamodb.DynamoDbClient
import software.amazon.awssdk.services.dynamodb.model.AttributeDefinition
import software.amazon.awssdk.services.dynamodb.model.CreateTableRequest
import software.amazon.awssdk.services.dynamodb.model.DeleteItemRequest
import software.amazon.awssdk.services.dynamodb.model.DeleteTableRequest
import software.amazon.awssdk.services.dynamodb.model.DescribeTableRequest
import software.amazon.awssdk.services.dynamodb.model.KeySchemaElement
import software.amazon.awssdk.services.dynamodb.model.KeyType
import software.amazon.awssdk.services.dynamodb.model.ProvisionedThroughput
import software.amazon.awssdk.services.dynamodb.model.ScalarAttributeType
import software.amazon.awssdk.services.dynamodb.model.ScanRequest
import java.net.URI

abstract class MockRepositoryConfig {
    protected companion object {
        const val TEST_TABLE_NAME = "TestActionInBlog" // 1
        var dynamoDbClient: DynamoDbClient // 2

        private val dynamoDbContainer = // 3
            GenericContainer<Nothing>(
                DockerImageName
                    .parse(
                        "public.ecr.aws/aws-dynamodb-local/aws-dynamodb-local:latest",
                    ).asCompatibleSubstituteFor("amazon/dynamodb-local"),
            ).apply {
                withExposedPorts(8000)
            }

        init {
            dynamoDbContainer.start()
            dynamoDbClient =
                DynamoDbClient
                    .builder()
                    .region(Region.AP_NORTHEAST_1)
                    .endpointOverride(URI.create("http://localhost:${dynamoDbContainer.getMappedPort(8000)}"))
                    .credentialsProvider(
                        StaticCredentialsProvider.create(
                            AwsBasicCredentials.create("dummy", "dummy"),
                        ),
                    ).build()
            deleteTableIfExists()
            createTable()
        }
        ... 
    }
    ...
}
```

DynamoDB 테스트 컨테이너에 TEST_TABLE_NAME 테이블이 존재하면 삭제한다.

```kotlin
abstract class MockRepositoryConfig {
    protected companion object {
        ... 
        private fun deleteTableIfExists() {
            val tables = dynamoDbClient.listTables()
            if (tables.tableNames().contains(TEST_TABLE_NAME)) {
                dynamoDbClient.deleteTable(
                    DeleteTableRequest
                        .builder()
                        .tableName(TEST_TABLE_NAME)
                        .build()
                )
            }
        }
        ... 
    }
}
```

테이블을 생성 요청을 보낸다. 테이블이 생성될 때까지 기다린다.

```kotlin
abstract class MockRepositoryConfig {
    protected companion object {
        ... 
        private fun createTable() {
            val createTableRequest =
                CreateTableRequest
                    .builder()
                    .attributeDefinitions(
                        AttributeDefinition
                            .builder()
                            .attributeName("PK")
                            .attributeType(ScalarAttributeType.S)
                            .build(),
                        AttributeDefinition
                            .builder()
                            .attributeName("SK")
                            .attributeType(ScalarAttributeType.S)
                            .build(),
                    ).keySchema(
                        KeySchemaElement
                            .builder()
                            .attributeName("PK")
                            .keyType(KeyType.HASH)
                            .build(),
                        KeySchemaElement
                            .builder()
                            .attributeName("SK")
                            .keyType(KeyType.RANGE)
                            .build(),
                    ).provisionedThroughput(
                        ProvisionedThroughput
                            .builder()
                            .readCapacityUnits(1)
                            .writeCapacityUnits(1)
                            .build(),
                    )
                    .tableName(TEST_TABLE_NAME)
                    .build()
            dynamoDbClient.createTable(createTableRequest)

            val describeTableRequest =
                DescribeTableRequest
                    .builder()
                    .tableName(TEST_TABLE_NAME)
                    .build()
            dynamoDbClient.waiter().waitUntilTableExists(describeTableRequest)
        }
        ... 
    }
}
```

테스트 컨테이너가 실행된 후 테스트 환경에서 필요한 설정 값을 등록한다. application YAML 파일에 등록된 설정 키와 동일한 값을 사용한다.

- amazon.dynamodb.endpoint
  - 테스트 컨테이너의 DynamoDB 엔드포인트
- amazon.dynamodb.table-name
  - 테스트 컨테이너에 생성된 테이블 이름

```kotlin
abstract class MockRepositoryConfig {
    protected companion object {
        ... 
        @DynamicPropertySource
        @JvmStatic
        fun registerDynamoDbProperties(registry: DynamicPropertyRegistry) {
            registry.add("amazon.dynamodb.endpoint") { "http://localhost:${dynamoDbContainer.getMappedPort(8000)}" }
            registry.add("amazon.dynamodb.table-name") { TEST_TABLE_NAME }
        }
        ... 
    }
}
```

DynamoDB는 @Transactional 애너테이션이 동작하지 않는다. 각 테스트마다 실행하기 전 테이블에 저장된 아이템들을 정리하는 코드가 필요하다.

- clearDatabase 메서드는 테이블에 존재하는 모든 아이템을 정리한다.

```kotlin
abstract class MockRepositoryConfig {
    protected companion object {
        ... 
    }

    fun clearDatabase() {
        dynamoDbClient
            .scan(
                ScanRequest
                    .builder()
                    .tableName(TEST_TABLE_NAME)
                    .build(),
            )
            .items()
            .forEach {
                dynamoDbClient.deleteItem(
                    DeleteItemRequest
                        .builder()
                        .tableName(TEST_TABLE_NAME)
                        .key(mapOf("PK" to it["PK"], "SK" to it["SK"]))
                        .build(),
                )
            }
    }
}
```

## 5. TodoRepositoryTest class

이제 테스트 코드를 살펴보자. 테스트 코드만 살펴본다. 구현체 코드는 [이전 글][dynamodb-crud-example-with-spring-boot-link]을 참고하길 바란다.

1. 위에서 생성한 MockRepositoryConfig 추상 클래스를 상속받는다. 
2. 테스트 대상은 @Autowired 애너테이션을 통해 주입 받는다.
3. 각 테스트 실행 전 DynamoDB에 저장된 데이터를 정리한다.

```kotlin
package action.`in`.blog.repository

import action.`in`.blog.MockRepositoryConfig
import action.`in`.blog.repository.entity.TodoEntity
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import software.amazon.awssdk.services.dynamodb.model.AttributeValue.fromS
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest
import java.util.*
import kotlin.test.assertEquals
import kotlin.test.assertTrue

@SpringBootTest
class TodoRepositoryTest : MockRepositoryConfig() { // 1

    @Autowired // 2
    lateinit var sut: TodoRepository

    @BeforeEach // 3
    fun setUp() {
        clearDatabase()
    }

    ...
}
```

엔티티 리스트 데이터 조회 테스트다. 테스트 대상 테이블에 저장된 데이터를 엔티티 형태로 조회한다. 추상 클래스에 준비된 `dynamoDbClient` 객체를 사용해 데이터를 준비한다.

```kotlin
@SpringBootTest
class TodoRepositoryTest : MockRepositoryConfig() {

    @Autowired
    lateinit var sut: TodoRepository

    @BeforeEach
    fun setUp() {
        clearDatabase()
    }

    @Test
    fun when_getTodos_then_return_todoEntities() {
        val uuid = UUID.randomUUID()
        dynamoDbClient.putItem(
            PutItemRequest.builder()
                .tableName(TEST_TABLE_NAME)
                .item(
                    mapOf(
                        "PK" to fromS("TODO"),
                        "SK" to fromS("ID#20241003213000-${uuid}"),
                        "id" to fromS(uuid.toString()),
                        "title" to fromS("Hello World"),
                        "content" to fromS("This is the first todo."),
                    )
                )
                .build()
        )


        val result = sut.getTodos()


        assertEquals(1, result.size)
        assertEquals("TODO", result[0].pk)
        assertEquals("ID#20241003213000-${uuid}", result[0].sk)
        assertEquals(uuid.toString(), result[0].id)
        assertEquals("Hello World", result[0].title)
        assertEquals("This is the first todo.", result[0].content)
    }
    ... 
}
```

특정 아이템을 조회하는 테스트다. 위 테스트와 마찬가지로 dynamoDbClient 객체를 사용해 데이터를 준비한다.

```kotlin
@SpringBootTest
class TodoRepositoryTest : MockRepositoryConfig() {

    @Autowired
    lateinit var sut: TodoRepository

    @BeforeEach
    fun setUp() {
        clearDatabase()
    }

    @Test
    fun when_getTodo_then_return_todoEntity() {
        val uuid = UUID.randomUUID()
        dynamoDbClient.putItem(
            PutItemRequest.builder()
                .tableName(TEST_TABLE_NAME)
                .item(
                    mapOf(
                        "PK" to fromS("TODO"),
                        "SK" to fromS("ID#20241003213000-${uuid}"),
                        "id" to fromS(uuid.toString()),
                        "title" to fromS("Hello World"),
                        "content" to fromS("This is the first todo."),
                    )
                )
                .build()
        )


        val result = sut.getTodo("20241003213000-${uuid}")


        assertEquals("TODO", result.pk)
        assertEquals("ID#20241003213000-${uuid}", result.sk)
        assertEquals(uuid.toString(), result.id)
        assertEquals("Hello World", result.title)
        assertEquals("This is the first todo.", result.content)
    }
    ...
}
```

createTodo 메서드로 데이터가 생성되는지 테스트한다. dynamoDbClient 객체를 사용해 생성된 데이터가 테이블에 존재하는지 확인한다. 조회한 데이터는 Map 자료형이며 값은 AttributeValue 타입이다.

```kotlin
@SpringBootTest
class TodoRepositoryTest : MockRepositoryConfig() {

    @Autowired
    lateinit var sut: TodoRepository

    @BeforeEach
    fun setUp() {
        clearDatabase()
    }

    @Test
    fun when_createTodo_then_find_todoEntity_in_dynamoDb() {
        val uuid = UUID.randomUUID()
        sut.createTodo(
            TodoEntity(
                "TODO",
                "ID#20241003213000-${uuid}",
                uuid.toString(),
                "Hello World",
                "This is the first todo."
            )
        )

        val result = dynamoDbClient.getItem(
            GetItemRequest.builder()
                .tableName(TEST_TABLE_NAME)
                .key(
                    mapOf(
                        "PK" to fromS("TODO"),
                        "SK" to fromS("ID#20241003213000-${uuid}"),
                    )
                )
                .build()
        )
        assertEquals(fromS("TODO"), result.item()["PK"])
        assertEquals(fromS("ID#20241003213000-${uuid}"), result.item()["SK"])
        assertEquals(fromS(uuid.toString()), result.item()["id"])
        assertEquals(fromS("Hello World"), result.item()["title"])
        assertEquals(fromS("This is the first todo."), result.item()["content"])
    }
    ...
}
```

기존에 존재하는 데이터를 업데이트한다. 업데이트 할 때 속성이 null 값인 경우 업데이트가 되지 않는지 확인한다. null 이 아닌 값으로 매칭된 속성만 업데이트 된다.

```kotlin
@SpringBootTest
class TodoRepositoryTest : MockRepositoryConfig() {

    @Autowired
    lateinit var sut: TodoRepository

    @BeforeEach
    fun setUp() {
        clearDatabase()
    }

    @Test
    fun given_todoEntity_is_existed_when_updateTodo_then_get_updated_entity() {
        val uuid = UUID.randomUUID()
        dynamoDbClient.putItem(
            PutItemRequest.builder()
                .tableName(TEST_TABLE_NAME)
                .item(
                    mapOf(
                        "PK" to fromS("TODO"),
                        "SK" to fromS("ID#20241003213000-${uuid}"),
                        "id" to fromS(uuid.toString()),
                        "title" to fromS("Hello World"),
                        "content" to fromS("This is the first todo."),
                    )
                )
                .build()
        )


        sut.updateTodo(
            TodoEntity(
                "TODO",
                "ID#20241003213000-${uuid}",
                null,
                null,
                "This is the second todo."
            )
        )


        val result = dynamoDbClient.getItem(
            GetItemRequest.builder()
                .tableName(TEST_TABLE_NAME)
                .key(
                    mapOf(
                        "PK" to fromS("TODO"),
                        "SK" to fromS("ID#20241003213000-${uuid}"),
                    )
                )
                .build()
        )
        assertEquals(fromS("TODO"), result.item()["PK"])
        assertEquals(fromS("ID#20241003213000-${uuid}"), result.item()["SK"])
        assertEquals(fromS(uuid.toString()), result.item()["id"])
        assertEquals(fromS("Hello World"), result.item()["title"])
        assertEquals(fromS("This is the second todo."), result.item()["content"])
    }
    ...
}
```

마지막으로 deleteTodo 메서드를 통해 데이터가 제대로 삭제되는지 확인한다.

```kotlin
@SpringBootTest
class TodoRepositoryTest : MockRepositoryConfig() {

    @Autowired
    lateinit var sut: TodoRepository

    @BeforeEach
    fun setUp() {
        clearDatabase()
    }

    @Test
    fun given_todoEntity_is_existed_when_deleteTodo_then_not_found_entity_in_dynamoDb() {
        val uuid = UUID.randomUUID()
        dynamoDbClient.putItem(
            PutItemRequest.builder()
                .tableName(TEST_TABLE_NAME)
                .item(
                    mapOf(
                        "PK" to fromS("TODO"),
                        "SK" to fromS("ID#20241003213000-${uuid}"),
                        "id" to fromS(uuid.toString()),
                        "title" to fromS("Hello World"),
                        "content" to fromS("This is the first todo."),
                    )
                )
                .build()
        )


        sut.deleteTodo("20241003213000-${uuid}")


        val result = dynamoDbClient.getItem(
            GetItemRequest.builder()
                .tableName(TEST_TABLE_NAME)
                .key(
                    mapOf(
                        "PK" to fromS("TODO"),
                        "SK" to fromS("ID#20241003213000-${uuid}"),
                    )
                )
                .build()
        )
        assertTrue(result.item().isEmpty())
    }
}
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-10-02-test-container-for-dynamodb-test>

#### REFERENCE

- <https://www.baeldung.com/dynamodb-local-integration-tests>
- <https://sdk.amazonaws.com/java/api/latest/software/amazon/awssdk/enhanced/dynamodb/model/IgnoreNullsMode.html>

[dynamodb-crud-example-with-spring-boot-link]: https://junhyunny.github.io/spring-boot/aws/dynamo-db/dynamodb-crud-example-with-spring-boot/
[problem-of-sharing-application-context-with-test-container-link]: https://junhyunny.github.io/kotlin/spring-boot/test-container/problem-of-sharing-application-context-with-test-container/
[how-to-setup-testcontainer-in-kotlin-spring-boot-link]: https://junhyunny.github.io/kotlin/spring-boot/test-container/how-to-setup-testcontainer-in-kotlin-spring-boot/