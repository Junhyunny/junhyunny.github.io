---
title: "How to test file upload in Spring"
search: false
category:
  - java
  - spring-boot
last_modified_at: 2023-10-15T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [MultipartFile Interface and File Upload][multipartfile-link]
* [File Upload with Data Transfer Object in Spring][multipartfile-in-dto-link]
* [Content-Type and Spring Boot Annotation][content-type-and-spring-annotation-link]

## 0. 들어가면서

파일 업로드 기능에 대한 단위 테스트를 작성해 본 경험이 없어서 관련된 내용을 정리하였습니다. 
스프링 프레임워크를 사용해 개발하는 경우 MultipartFile 인터페이스를 통해 쉽게 파일 업로드 기능을 구현할 수 있습니다. 
MultipartFile 인터페이스에 대한 내용은 [MultipartFile Interface and File Upload][multipartfile-link] 포스트를 참고하길 바랍니다. 
DTO(Data Transfer Object) 클래스를 통해 파일 업로드하는 예제는 [File Upload with Data Transfer Object in Spring][multipartfile-in-dto-link] 포스트를 참고하길 바랍니다. 

## 1. Test Target Method

세 가지 기능에 대한 테스트를 수행합니다. 

* 단일 이미지를 업로드
    * 메소드 파라미터 변수 이름을 `file`로 지정합니다. 
* 다중 이미지를 업로드
    * 메소드 파라미터 변수 이름을 `files`로 지정합니다.
* DTO 클래스를 사용해 이미지와 다른 정보들을 함께 업로드
    * 이름, 나이, 사진 정보를 프로퍼티로 지닌 클래스입니다. 

```java
package action.in.blog.controller;

import action.in.blog.domain.Profile;
import action.in.blog.service.ProfileService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @PostMapping("/profiles/image")
    public void uploadProfileImage(MultipartFile file) {
        profileService.uploadProfileImage(file);
    }

    @PostMapping("/profiles/images")
    public void uploadProfileImages(List<MultipartFile> files) {
        profileService.uploadProfileImages(files);
    }

    @PostMapping("/profiles")
    public void uploadProfile(Profile profile) {
        profileService.uploadProfile(profile);
    }
}
```

다음 Profile 클래스를 살펴보겠습니다. 

* 이름, 나이, 사진 프로퍼티를 가집니다.

```java
package action.in.blog.domain;

import org.springframework.web.multipart.MultipartFile;

public record Profile(
        String name,
        int age,
        MultipartFile picture
) {
}
```

## 2. Tests

컨트롤러(controller)의 각 메소드들을 검증하기 위한 테스트 코드를 작성합니다. 
메소드들의 반환 타입이 `void`이므로 ProfileService 인스턴스를 테스트 더블(test double)로 사용하여 파일 업로드 여부를 검증합니다. 

### 2.1. MockMultipartFile Class

파일 업로드 테스트를 위해 MockMultipartFile 클래스를 사용합니다. 
테스트 객체 생성을 위해 생성자 함수를 살펴보겠습니다. 

* name 
    * 스프링 API 엔드 포인트(end point) 메소드에서 파일을 받을 때 사용하는 이름입니다.
    * 파리미터 이름과 동일하게 설정합니다.
    * @RequestParam 애너테이션을 사용한다면 파라미터 이름과 동일하게 설정합니다.
    * @ModelAttribute 애너테이션을 사용한다면 DTO 클래스 프로퍼티 이름과 동일하게 설정합니다. 
* originalFilename
    * 실제 파일 이름을 의미합니다.
* contentType
    * 파일 타입을 의미합니다.
* content
    * 파일을 이진화(binary)하였을 때 바이트 배열(byte array) 값을 의미합니다.

```java
    public MockMultipartFile(String name, @Nullable String originalFilename, @Nullable String contentType, @Nullable byte[] content) {
        Assert.hasLength(name, "Name must not be empty");
        this.name = name;
        this.originalFilename = (originalFilename != null ? originalFilename : "");
        this.contentType = contentType;
        this.content = (content != null ? content : new byte[0]);
    }
```

### 2.2. Test uploadProfileImage Method

각 메소드를 테스트합니다. 
uploadProfileImage 메소드를 먼저 테스트합니다. 

* 더미(dummy) MultipartFile 인스턴스를 생성합니다.
    * 파라미터 키는 `file`입니다.
* profileService 스파이(spy) 객체에 전달된 파라미터 값을 확인합니다.
    * 파일 이름, 컨텐츠 타입, 이진 값을 확인합니다.

```java
package action.in.blog.controller;

import action.in.blog.domain.Profile;
import action.in.blog.service.ProfileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ProfileControllerTest {

    ProfileService profileService;
    MockMvc sut;

    @BeforeEach
    void setUp() {
        profileService = Mockito.mock(ProfileService.class);
        sut = MockMvcBuilders
                .standaloneSetup(new ProfileController(profileService))
                .build();
    }

    @Test
    public void uploadProfileImage() throws Exception {

        var profileImage = new MockMultipartFile("file", "profile.jpg", "image/jpeg", "profile-image-binary".getBytes());


        sut.perform(
                multipart("/profiles/image")
                        .file(profileImage)
        ).andExpect(status().isOk());


        var argumentCaptor = ArgumentCaptor.forClass(MultipartFile.class);
        verify(profileService, times(1)).uploadProfileImage(argumentCaptor.capture());

        var result = argumentCaptor.getValue();
        assertEquals("profile.jpg", result.getOriginalFilename());
        assertEquals("image/jpeg", result.getContentType());
        assertArrayEquals("profile-image-binary".getBytes(), result.getBytes());
    }
}
```

### 2.3. Test uploadProfileImages Method

uploadProfileImages 메소드를 테스트합니다. 

* 더미(dummy) MultipartFile 인스턴스를 생성합니다.
    * 파라미터 키는 `files`입니다.
* profileService 스파이(spy) 객체에 전달된 파라미터 값을 확인합니다.
    * MultipartFile 리스트 정보를 확인합니다.
    * 리스트 사이즈, 각 파일 이름, 각 컨텐츠 타입, 각 이진 값을 확인합니다.

```java
package action.in.blog.controller;

import action.in.blog.domain.Profile;
import action.in.blog.service.ProfileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ProfileControllerTest {

    ProfileService profileService;
    MockMvc sut;

    @BeforeEach
    void setUp() {
        profileService = Mockito.mock(ProfileService.class);
        sut = MockMvcBuilders
                .standaloneSetup(new ProfileController(profileService))
                .build();
    }

    @Test
    public void uploadProfileImages() throws Exception {

        var profileImage = new MockMultipartFile("files", "profile.jpg", "image/jpeg", "profile-image-binary".getBytes());
        var backgroundImage = new MockMultipartFile("files", "background.jpg", "image/jpeg", "background-image-binary".getBytes());


        sut.perform(
                multipart("/profiles/images")
                        .file(profileImage)
                        .file(backgroundImage)
        ).andExpect(status().isOk());


        var argumentCaptor = ArgumentCaptor.forClass(List.class);
        verify(profileService, times(1)).uploadProfileImages(argumentCaptor.capture());

        var result = (List<MultipartFile>) argumentCaptor.getValue();
        assertEquals(2, result.size());
        assertEquals("profile.jpg", result.get(0).getOriginalFilename());
        assertEquals("image/jpeg", result.get(0).getContentType());
        assertArrayEquals("profile-image-binary".getBytes(), result.get(0).getBytes());
        assertEquals("background.jpg", result.get(1).getOriginalFilename());
        assertEquals("image/jpeg", result.get(1).getContentType());
        assertArrayEquals("background-image-binary".getBytes(), result.get(1).getBytes());
    }
}
```

### 2.3. Test uploadProfile Method

uploadProfile 메소드를 테스트합니다. 

* 더미(dummy) MultipartFile 인스턴스를 생성합니다.
    * 파라미터 키는 `picture`입니다.
    * Profile 클래스에 포함된 파일 속성의 이름이 `picture`입니다. 
* 요청 파라미터로 이름, 나이 정보를 전달합니다. 
    * DTO 클래스로 파일을 받는 경우 요청 파라미터를 통해 값들이 전달됩니다.
    * 컨텐츠 타입이 `application/json`이 아닌 경우 스프링 프레임워크는 해당 데이터를 요청 파라미터로 받습니다. 
* profileService 스파이(spy) 객체에 전달된 파라미터 값을 확인합니다.
    * Profile 인스턴스에 포함된 이름, 나이, 사진 정보를 확인합니다.

```java
package action.in.blog.controller;

import action.in.blog.domain.Profile;
import action.in.blog.service.ProfileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ProfileControllerTest {

    ProfileService profileService;
    MockMvc sut;

    @BeforeEach
    void setUp() {
        profileService = Mockito.mock(ProfileService.class);
        sut = MockMvcBuilders
                .standaloneSetup(new ProfileController(profileService))
                .build();
    }

    @Test
    public void uploadProfile() throws Exception {

        var profileImage = new MockMultipartFile("picture", "profile.jpg", "image/jpeg", "profile-image-binary".getBytes());


        sut.perform(
                multipart("/profiles")
                        .file(profileImage)
                        .param("name", "junhyunny")
                        .param("age", "20")
        ).andExpect(status().isOk());


        var argumentCaptor = ArgumentCaptor.forClass(Profile.class);
        verify(profileService, times(1)).uploadProfile(argumentCaptor.capture());

        var result = argumentCaptor.getValue();
        assertEquals("junhyunny", result.name());
        assertEquals(20, result.age());
        assertEquals("profile.jpg", result.picture().getOriginalFilename());
        assertEquals("image/jpeg", result.picture().getContentType());
        assertArrayEquals("profile-image-binary".getBytes(), result.picture().getBytes());
    }
}
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-10-15-how-to-test-multipart-file-upload-in-spring>

#### REFERENCE

* <https://www.baeldung.com/spring-multipart-post-request-test>

[multipartfile-link]: https://junhyunny.github.io/spring-boot/vue.js/multipartfile/
[multipartfile-in-dto-link]: https://junhyunny.github.io/spring-boot/vue.js/multipartfile-in-dto/
[content-type-and-spring-annotation-link]: https://junhyunny.github.io/information/spring-boot/javascript/content-type-and-spring-annotation/