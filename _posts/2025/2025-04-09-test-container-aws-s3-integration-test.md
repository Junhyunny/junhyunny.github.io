---
title: "테스트 컨테이너와 스프링 애플리케이션 AWS S3 결합 테스트"
search: false
category:
  - spring-boot
  - test-container
  - aws
last_modified_at: 2025-04-09T23:55:00
---

<br/>

## 0. 들어가면서

데이터베이스나 파일 스토리지 같은 외부 시스템과 연결이 있는 경우 결합 테스트(integration test)가 필요하다. 스파이(spy)처럼 단순 객체의 호출 여부를 확인하는 테스트는 제대로 된 검증이 안 되기 때문에 실제 동작에서 문제가 생기는 경우가 많았다. 네트워크 환경 같이 제약적인 상황이 아니라면 실제 컴포넌트와 동일하게 동작하는 페이크(fake) 서버와 결합 테스트를 수행하는 것이 좋다고 생각한다. 이번 글은 결합 테스트에서 많이 사용하는 테스트 컨테이너(test container)를 통해 AWS S3와 결합 테스트하는 방법에 대해 정리했다.

## 1. Background 

예제를 살펴보기 전에 우선 테스트 컨테이너를 통해 결합 테스트를 구축한 백그라운드에 대해 잠시 이야기한다. 현재 프로젝트는 다음과 같은 문제가 있었다.

- 2025년에 만료될(deprecated) 1.X.X 버전 AWS SDK 사용
- io.findify.s3mock_2.13 라이브러리를 통한 S3 결합 테스트

곧 만료되는 1.X.X 버전의 AWS SDK도 문제였지만, S3 결합 테스트에서 사용 중인 [io.findify.s3mock_2.13 라이브러리](https://github.com/findify/s3mock)는 마지막 업데이트가 2020년 3월이고 아카이브(archive) 된 상태였다. 현재는 문제 없이 동작하는 중이었지만, 이 둘을 계속 사용하는 것은 기술 부채를 키우는 행위라고 판단했다. SDK 버전을 2.X.X로 올리고 AWS S3 역할을 수행할 수 있는 MinIO 컨테이너를 사용했다. [MinIO](https://min.io/)는 오브젝트 스토리지 솔루션으로 AWS S3와 호환되는 API를 제공하는 오픈 소스 소프트웨어다.

## 2. Dependencies

스프링 애플리케이션에서 결합 테스트를 수행하려면 다음과 같은 의존성들이 필요하다.

- software.amazon.awssdk:s3
  - AWS S3 클라이언트
- org.springframework.boot:spring-boot-testcontainers
  - 테스트 컨테이너 의존성
- org.testcontainers:minio
  - MinIO 지원 테스트 컨테이너

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.testcontainers:junit-jupiter'
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'

    // S3 클라이언트와 테스트 컨테이너 의존성
    implementation 'software.amazon.awssdk:s3:2.31.17'
    testImplementation 'org.springframework.boot:spring-boot-testcontainers'
    testImplementation 'org.testcontainers:minio:1.20.6'
}
```

## 3. Implementation code

테스트 코드로 검증하고 싶은 테스트 대상 구현 코드를 살펴본다. S3Client 객체를 만드는 설정 빈(bean) 객체는 다음과 같다.

```java
package action.in.blog.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

import java.net.URI;

@Configuration
public class StorageConfig {
    @Value("${storage.endpoint}")
    private String endpoint;
    @Value("${storage.region}")
    private String region;
    @Value("${storage.access-key-id}")
    private String accessKeyId;
    @Value("${storage.secret-access-key}")
    private String secretAccessKey;

    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .region(Region.of(region))
                .endpointOverride(URI.create(endpoint))
                .forcePathStyle(true)
                .credentialsProvider(
                        StaticCredentialsProvider
                                .create(
                                        AwsBasicCredentials
                                                .builder()
                                                .accessKeyId(accessKeyId)
                                                .secretAccessKey(secretAccessKey)
                                                .build()
                                )
                )
                .build();
    }
}
```

FileUploader 객체는 S3Client 객체와 협력하여 디렉토리를 생성한다. 버킷 이름과 S3Client 객체는 생성자를 통해 의존성 주입을 받는다.

- createDirectory 메소드
  - 파일 스토리지에 디렉토리 생성
- createFile 메소드
  - 파일 스토리지에 파일 생성

```java
package action.in.blog.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;

@Component
public class FileUploader {
    private final String bucket;
    private final S3Client s3Client;

    public FileUploader(
            @Value("${storage.bucket}") String bucket,
            S3Client s3Client
    ) {
        this.bucket = bucket;
        this.s3Client = s3Client;
    }

    public boolean createDirectory(String filePath) {
        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket)
                            .contentType("application/x-directory")
                            .contentLength(0L)
                            .key(filePath)
                            .build(),
                    RequestBody.fromBytes(new byte[0])
            );
        } catch (Exception e) {
            return false;
        }
        return true;
    }

    public void createFile(MultipartFile multipartFile, String fileName) {
        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket)
                            .key(fileName)
                            .contentType(multipartFile.getContentType())
                            .contentLength(multipartFile.getSize())
                            .build(),
                    RequestBody.fromInputStream(
                            multipartFile.getInputStream(),
                            multipartFile.getSize()
                    )
            );
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file to S3", e);
        }
    }
}
```

## 3. Test code

이제 테스트 코드를 살펴보자. 코드를 각 부분으로 나눠서 살펴본다. 설명은 주석으로 대체한다.

```java
package action.in.blog;

import action.in.blog.client.FileUploader;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MinIOContainer;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.IOException;
import java.net.URI;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class ActionInBlogApplicationTests {

class ActionInBlogApplicationTests {

    static final String TEST_BUCKET_NAME = "test-bucket";

    // MinIO 컨테이너 준비
    static MinIOContainer container = new MinIOContainer("minio/minio:latest")
            .withEnv("MINIO_ACCESS_KEY", "DUMMY_KEY_ID")
            .withEnv("MINIO_SECRET_KEY", "DUMMY_ACCESS_KEY");

    // 테스트 컨테이너에 접근하기 위한 application.yml 설정 오버라이드(override)
    @DynamicPropertySource
    static void s3Properties(DynamicPropertyRegistry registry) {
        // 테스트 컨테이너의 포트 번호가 매번 랜덤하게 변경되기 때문에 엔드포인트(endpoint)를 오버라이드한다.
        registry.add(
                "storage.endpoint", () -> "http://localhost:" + container.getMappedPort(9000)
        );
        registry.add(
                "storage.bucket", () -> TEST_BUCKET_NAME
        );
    }

    ... 
}
```

다음으로 컨테이너를 실행하고, 테스트 코드에서 사용할 S3Client 객체를 만드는 코드를 작성한다.

```java
package action.in.blog;

...

@SpringBootTest
class ActionInBlogApplicationTests {

    static S3Client s3Client;

    @BeforeAll
    static void beforeAll() {
        // 테스트가 시작되기 전에 테스트 컨테이너를 실행한다.
        container.start();

        var credentialsProvider = StaticCredentialsProvider
                .create(
                        AwsBasicCredentials
                                .builder()
                                .accessKeyId("DUMMY_KEY_ID")
                                .secretAccessKey("DUMMY_ACCESS_KEY")
                                .build()
                );
        
        // 테스트 대상 객체와 협력하는 S3Client 객체가 의도한 설정대로 MinIO 테스트 컨테이너와 연결하여 파일을 저장하는지 테스트 코드에서 확인하기 위해 별도로 별도로 S3Client 객체를 준비한다. 
        s3Client = S3Client.builder()
                .region(Region.of("ap-northeast-1"))
                .endpointOverride(URI.create("http://localhost:" + container.getMappedPort(9000)))
                .forcePathStyle(true)
                .credentialsProvider(credentialsProvider)
                .build();
    }

    @AfterAll
    static void afterAll() {
        // 모든 테스트가 완료되면 테스트 컨테이너를 종료한다.
        container.stop();
    }

    ...
}
```

마지막으로 테스트 코드를 통해 테스트 대상의 기능을 검증한다. 각 테스트가 서로 영향을 주지 않도록 MinIO 버킷을 매번 새로 만들고 정리한다.

```java
package action.in.blog;

...

@SpringBootTest
class ActionInBlogApplicationTests {

    ...

    @Autowired
    FileUploader sut;

    @BeforeEach
    void setUp() {
        // 각 테스트를 실행하기 전에 새로운 버킷을 만든다.
        s3Client.createBucket(
                CreateBucketRequest.builder()
                        .bucket(TEST_BUCKET_NAME)
                        .build()
        );
    }

    @AfterEach
    void tearDown() {
        // 각 테스트가 종료되면 버킷을 비우고 삭제한다.
        var result = s3Client.listObjects(
                ListObjectsRequest.builder()
                        .bucket(TEST_BUCKET_NAME)
                        .build()
        );
        if (!result.contents().isEmpty()) {
            var objects = result.contents()
                    .stream()
                    .map(obj -> ObjectIdentifier.builder()
                            .key(obj.key())
                            .build()
                    )
                    .toList();
            s3Client.deleteObjects(
                    DeleteObjectsRequest.builder()
                            .bucket(TEST_BUCKET_NAME)
                            .delete(
                                    Delete.builder()
                                            .objects(objects)
                                            .build()
                            )
                            .build()
            );
        }
        s3Client.deleteBucket(
                DeleteBucketRequest.builder()
                        .bucket(TEST_BUCKET_NAME)
                        .build()
        );
    }

    @Test
    void createDirectory() {
        var result = sut.createDirectory("attachments");


        assertTrue(result);
        var resultObject = s3Client.listObjects(
                ListObjectsRequest
                        .builder()
                        .bucket(TEST_BUCKET_NAME)
                        .build()
        );
        assertEquals(1, resultObject.contents().size());
        var object = resultObject.contents().get(0);
        assertEquals("attachments", object.key());
    }

    @Test
    void createFile() throws IOException {
        var sampleFile = new MockMultipartFile("sample.txt", "HelloWorld".getBytes());


        sut.createFile(sampleFile, "attachments/directory/1/sample.txt");


        var result = s3Client.getObject(
                GetObjectRequest.builder()
                        .bucket(TEST_BUCKET_NAME)
                        .key("attachments/directory/1/sample.txt")
                        .build()
        );
        assertArrayEquals("HelloWorld".getBytes(), result.readAllBytes());
    }
}
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2025-04-09-test-container-aws-s3-integration-test>

#### RECOMMEND NEXT POSTS

- [테스트 컨테이너와 스프링 애플리케이션 MySQL 결합 테스트][test-container-for-database-link]
- [테스트 컨테이너와 스프링 애플리케이션 DynamoDB 결합 테스트][test-container-for-dynamodb-test-link]

#### REFERENCE

- <https://java.testcontainers.org/modules/minio/>

[test-container-for-database-link]: https://junhyunny.github.io/post-format/test-container-for-database/
[test-container-for-dynamodb-test-link]: https://junhyunny.github.io/spring-boot/aws/dynamodb/test-container/test-container-for-dynamodb-test/