---
title: "DynamoDB GSI(global secondary index) query example with Spring boot"
search: false
category:
  - aws
  - dynamodb
  - spring-boot
last_modified_at: 2025-01-21T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Run DynamoDB local container with docker compose][dynamodb-container-with-docker-compose-link]
- [DynamoDB CRUD example with spring boot][dynamodb-crud-example-with-spring-boot-link]
- [DynamoDB Secondary Indexes][dynamodb-seconary-indexes-link]

## 0. 들어가면서

[지난 글][dynamodb-seconary-indexes-link]에서 DynamoDB 보조 인덱스에 대한 개념과 간단한 예제 쿼리를 커맨드라인에서 실행해봤다. 이번엔 스프링 애플리케이션에서 글로벌 보조 인덱스(GSI, global secondary index)를 사용해 DynamoDB 테이블에 쿼리를 수행한다. 

## 1. Project structure

예제 프로젝트 구조는 다음과 같다.

```
.
├── HELP.md
├── build.gradle.kts
├── docker-compose.yml
├── gradlew
├── gradlew.bat
├── init
│   ├── create-table.sh
│   ├── migration-data.sh
│   └── update-table.sh
├── settings.gradle.kts
└── src
    ├── main
    │   ├── kotlin
    │   │   └── action
    │   │       └── in
    │   │           └── blog
    │   │               ├── ActionInBlogApplication.kt
    │   │               ├── config
    │   │               │   └── DynamoDbConfig.kt
    │   │               ├── controller
    │   │               │   └── MovieController.kt
    │   │               ├── domain
    │   │               │   └── MovieInfo.kt
    │   │               └── repository
    │   │                   └── MovieRepository.kt
    │   └── resources
    │       ├── application.yml
    │       ├── static
    │       └── templates
    └── test
        └── kotlin
            └── action
                └── in
                    └── blog
                        ├── ActionInBlogApplicationTests.kt
                        ├── TestActionInBlogApplication.kt
                        └── TestcontainersConfiguration.kt
```

## 2. Prepare local DyanmoDB container

도커 컴포즈(docker compose)를 통해 로컬 환경에 DynamoDB 컨테이너를 준비하는 자세한 방법은 [이 글][dynamodb-container-with-docker-compose-link]을 참고하길 바란다. 애플리케이션에서 사용할 "ActorsPortfolioTable" 테이블을 생성하는 스크립트 파일을 먼저 살펴보자. [보조 인덱스 개념을 정리한 글][dynamodb-seconary-indexes-link]의 예제와 동일한 테이블을 사용한다.

- 예제 프로젝트의 `init/create-table.sh` 파일 내용과 동일하다.
- 파티션 키는 "Actor", 정렬 키는 "Movie"를 사용한다.

```sh
aws dynamodb create-table \
    --table-name ActorsPortfolioTable \
    --attribute-definitions AttributeName=Actor,AttributeType=S \
        AttributeName=Movie,AttributeType=S \
    --key-schema AttributeName=Actor,KeyType=HASH AttributeName=Movie,KeyType=RANGE \
    --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
    --endpoint-url http://dynamodb-local:8000
```

다음 스크립트를 사용해 데이터를 준비한다.

- 예제 프로젝트의 `init/migration-data.sh` 파일 내용과 동일하다.
- 5개의 데이터를 추가한다.

```sh
aws dynamodb put-item \
      --table-name ActorsPortfolioTable \
      --item '{"Actor": {"S": "Tom Hanks"}, "Movie": {"S": "Forrest Gump"}, "Year": {"N": "1994"}, "Role": {"S": "Forrest"}, "Genre": {"S": "Drama"}}' \
      --endpoint-url http://dynamodb-local:8000

aws dynamodb put-item \
      --table-name ActorsPortfolioTable \
      --item '{"Actor": {"S": "Tom Hanks"}, "Movie": {"S": "Cast Away"}, "Year": {"N": "2000"}, "Role": {"S": "Chunck Noland"}, "Genre": {"S": "Drama"}}' \
      --endpoint-url http://dynamodb-local:8000

aws dynamodb put-item \
      --table-name ActorsPortfolioTable \
      --item '{"Actor": {"S": "Tom Hanks"}, "Movie": {"S": "Toy Story"}, "Year": {"N": "1995"}, "Role": {"S": "Woody"}, "Genre": {"S": "Children"}}' \
      --endpoint-url http://dynamodb-local:8000

aws dynamodb put-item \
      --table-name ActorsPortfolioTable \
      --item '{"Actor": {"S": "Tim Allen"}, "Movie": {"S": "Toy Story"}, "Year": {"N": "1995"}, "Role": {"S": "Buzz Lightyear"}, "Genre": {"S": "Children"}}' \
      --endpoint-url http://dynamodb-local:8000

aws dynamodb put-item \
      --table-name ActorsPortfolioTable \
      --item '{"Actor": {"S": "Natalie Portman"}, "Movie": {"S": "Black Swan"}, "Year": {"N": "2010"}, "Role": {"S": "Nina Sayers"}, "Genre": {"S": "Drama"}}' \
      --endpoint-url http://dynamodb-local:8000
```

다음 스크립트를 사용해 "ActorsPortfolioTable" 테이블에 글로벌 보조 인덱스를 추가한다.

- 예제 프로젝트의 `init/update-table.sh` 파일 내용과 동일하다.
- 글로벌 보조 인덱스 이름은 "GenreYearIndex"을 사용한다.
- 글로벌 보조 인덱스를 위한 새로운 파티션 키는 "Genre", 정렬 키는 "Year"를 사용한다.

```sh
aws dynamodb update-table \
    --table-name ActorsPortfolioTable \
    --attribute-definitions \
        AttributeName=Genre,AttributeType=S \
        AttributeName=Year,AttributeType=N \
    --global-secondary-index-updates \
        "[{
              \"Create\": {
                  \"IndexName\": \"GenreYearIndex\",
                \"KeySchema\": [
                      {\"AttributeName\": \"Genre\", \"KeyType\": \"HASH\"},
                    {\"AttributeName\": \"Year\", \"KeyType\": \"RANGE\"}
                ],
                \"Projection\": {
                      \"ProjectionType\": \"ALL\"
                },
                \"ProvisionedThroughput\": {
                      \"ReadCapacityUnits\": 1,
                    \"WriteCapacityUnits\": 1
                }
            }
        }]" \
    --endpoint-url http://dynamodb-local:8000
```

도커 컴포즈 YAML 파일에 위 스크립트들을 통해 테이블을 초기화하는 코드를 추가한다.

```yml
services:
  dynamodb-local:
    image: amazon/dynamodb-local
    container_name: dynamodb-local
    ports:
      - "8000:8000"
    healthcheck:
      test: [ "CMD-SHELL", '[ "$(curl -s -o /dev/null -I -w ''%{http_code}'' http://localhost:8000)" == "400" ]' ]
      interval: 2s
      timeout: 2s
      retries: 10
    command: "-jar DynamoDBLocal.jar -inMemory -sharedDb"

  setup-dynamo:
    image: amazon/aws-cli
    depends_on:
      dynamodb-local:
        condition: service_healthy
    environment:
      - AWS_ACCESS_KEY_ID=dummy
      - AWS_SECRET_ACCESS_KEY=dummy
      - AWS_DEFAULT_REGION=ap-northeast-1
    entrypoint: ["/bin/sh","-c"]
    volumes: # 초기화 스크립트 위치를 볼륨으로 공유한다.
      - ./init:/aws/init
    command: # 초기화 스크립트를 실행한다.
      - |
        sh ./init/create-table.sh
        sh ./init/migration-data.sh
        sh ./init/update-table.sh
```

도커 컴포즈를 실행해서 테이블을 준비한다.

```
$ docker compose up -d

[+] Running 3/3
 ✔ Network action-in-blog_default           Created        0.0s 
 ✔ Container dynamodb-local                 Healthy        2.7s 
 ✔ Container action-in-blog-setup-dynamo-1  Started     
```

NoSQL Workbench 도구를 사용하면 로컬 환경에 준비된 테이블과 아이템들을 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2025/dynamodb-gsi-example-with-spring-boot-01.png" width="100%" class="image__border">
</div>

## 3. Setup DynamoDB client

애플리케이션이 DynamoDB에 접속할 때 사용하는 클라이언트 객체를 정의한다. 우선 DynamoDB 접속 정보이 작성된 application YAML 파일을 살펴보자.

1. DynamoDB 테이블 이름
2. DynamoDB 인스턴스 URL

```yml
amazon:
  dynamodb:
    table-name: ActorsPortfolioTable # 1
    endpoint: ${AMAZON_DYNAMODB_ENDPOINT:default} # 2
```

`AMAZON_DYNAMODB_ENDPOINT` 환경 변수는 DynamoDB 클라이언트 객체의 엔드포인트를 오버라이딩(overriding)하기 위해 사용한다. 우선 DynamoDBClient 객체를 생성한 설정 클래스 코드를 살펴본다.

1. 엔드포인트 URL 주소를 주입받는다.
2. 오버라이딩 할 엔드포인트 URL 주소가 존재하는 경우 DynamoDB 클라이언트 객체의 엔드포인트를 변경한다. 

```kt
package action.`in`.blog.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.dynamodb.DynamoDbClient
import java.net.URI

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
}
```

실제 운영 환경은 AWS 클라우드에 위치한 DynamoDB를 사용하지만, 로컬 환경이나 테스트 코드에선 다른 URL 주소를 사용하기 때문에 이런 식으로 설정한다.

- 운영 환경에선 `default` 값을 사용하기 때문에 DynamoDB 클라이언트 객체의 엔트포인트를 오버라이딩 하지 않는다. 지역(region) 정보만 있다면 AWS 환경의 DynamoDB 서비스로 연결할 수 있다.
- 개발 환경에선 `http://localhost:8000` 값을 사용해 DynamoDB 클라이언트 객체가 로컬 환경의 DynamoDB 로컬 컨테이너에 접속한다.
- 테스트 코드에선 테스트 컨테이너 등에 의해 생성된 랜덤한 컨테이너에 접속한다.

## 4. MovieController class

단순한 엔드포인트를 하나 만든다. MovieRepository 인스턴스와 바로 협업한다.

```kotlin
package action.`in`.blog.controller

import action.`in`.blog.repository.MovieRepository
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/movies")
class MovieController(
    private val movieRepository: MovieRepository
) {
    @GetMapping("/genres")
    fun getGenres(
        @RequestParam genre: String,
        @RequestParam startYear: Int,
        @RequestParam endYear: Int
    ) = movieRepository.findByGenre(genre, startYear, endYear)
}
```

## 5. MovieRepository Instance

MovieRepository 인스턴스 코드를 살펴본다. DynamoDBClient 객체와 협업하여 DynamoDB 테이블로부터 데이터를 조회한다. DynamoDBClient 객체는 쿼리 요청을 만들 때 QueryRequest 클래스 빌더를 사용한다. 코드가 직관적이기 때문에 이해하기 쉽다.

1. 테이블 이름을 설정한다.
2. 글로벌 보조 인덱스 이름을 지정한다.
3. 쿼리 조건 표현식을 만든다. [이전 글][dynamodb-seconary-indexes-link]과 동일하게 장르와 개봉년도를 사용해 데이터를 조회한다.
4. 쿼리 조건 표현식에 사용되는 키 이름을 지정한다.
5. 쿼리 조건 표현식에 사용되는 값을 지정한다.

```kt
package action.`in`.blog.repository

import action.`in`.blog.domain.MovieInfo
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Repository
import software.amazon.awssdk.services.dynamodb.DynamoDbClient
import software.amazon.awssdk.services.dynamodb.model.AttributeValue.fromN
import software.amazon.awssdk.services.dynamodb.model.AttributeValue.fromS
import software.amazon.awssdk.services.dynamodb.model.QueryRequest

interface MovieRepository {
    fun findByGenre(genre: String, startYear: Int, endYear: Int): List<MovieInfo>
}

@Repository
class MovieRepositoryImpl(
    @Value("\${amazon.dynamodb.table-name}") val tableName: String,
    private val dynamoDbClient: DynamoDbClient,
) : MovieRepository {

    override fun findByGenre(
        genre: String,
        startYear: Int,
        endYear: Int
    ): List<MovieInfo> {
        return dynamoDbClient.query(
            QueryRequest.builder()
                .tableName(tableName) // 1
                .indexName("GenreYearIndex") // 2
                .keyConditionExpression("#genre = :genre AND #year BETWEEN :startYear AND :endYear") // 3
                .expressionAttributeNames( // 4
                    mapOf(
                        "#genre" to "Genre",
                        "#year" to "Year"
                    )
                )
                .expressionAttributeValues( // 5
                    mapOf(
                        ":genre" to fromS(genre),
                        ":startYear" to fromN(startYear.toString()),
                        ":endYear" to fromN(endYear.toString())
                    )
                )
                .build()
        )
            .items()
            .map { MovieInfo.of(it) }
    }
}
```

## 6. cURL get request

우선 애플리케이션을 실행한다. 애플리케이션을 실행하기 전에 `AMAZON_DYNAMODB_ENDPOINT` 환경 변수를 로컬 DynamoDB 컨테이너 주소로 지정한다. 이번 예제에선 `http://localhost:8000`를 사용했다. cURL 명령어로 스프링 애플리케이션에 아이템을 요청해보자. 장르가 "Drama"인 영화 중 1990년에서 1999년까지 작품을 조회하기 위한 파라미터를 전달한다.

```
$ curl 'http://localhost:8080/api/v1/movies/genres?genre=Drama&startYear=1990&endYear=1999' | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100    91    0    91    0     0   5778      0 --:--:-- --:--:-- --:--:--  6066
[
  {
    "actor": "Tom Hanks",
    "movie": "Forrest Gump",
    "role": "Forrest",
    "year": 1994,
    "genre": "Drama"
  }
]
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2025-01-21-dynamodb-gsi-example-with-spring-boot>

[dynamodb-container-with-docker-compose-link]: https://junhyunny.github.io/docker/aws/dynamo-db/dynamodb-container-with-docker-compose/
[dynamodb-crud-example-with-spring-boot-link]: https://junhyunny.github.io/spring-boot/aws/dynamo-db/dynamodb-crud-example-with-spring-boot/
[dynamodb-seconary-indexes-link]: https://junhyunny.github.io/aws/dynamodb/dynamodb-seconary-indexes/