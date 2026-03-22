---
title: "테이블 페이징(paging) 처리 구현 (feat. Spring Boot, Vue.js)"
search: false
category:
  - spring-boot
  - vue.js
last_modified_at: 2021-09-12T23:55:00
---

<br/>

* `{ { someValue } }`으로 표기된 코드는 띄어쓰기를 붙여야지 정상적으로 동작합니다.

👉 해당 포스트를 읽는데 도움을 줍니다.
- [JPA 페이징(paging) 처리][pageable-link]

## 1. Front-end 서비스
`Vue.js` 프레임워크를 사용한 프론트 엔드 서비스부터 살펴보겠습니다. 

### 1.1. 패키지 구조

```
$ tree -I 'node_modules|public' ./
./
|-- README.md
|-- babel.config.js
|-- package-lock.json
|-- package.json
`-- src
    |-- App.vue
    |-- api
    |   `-- post.js
    |-- components
    |   |-- Pagination.vue
    |   `-- Table.vue
    |-- main.js
    `-- utils
        `-- request.js
```

### 1.2. App.vue
- 조회 버튼을 클릭 시 `search` 함수를 통해 데이터를 조회합니다.
- `fetchList` 함수에 `page` 정보를 전달하여 API 요청을 수행합니다.
- 정상적인 응답을 받으면 컴포넌트(component)의 스테이트(state) 정보를 변경합니다. 
- 정렬 기준과 정렬 방향을 선택할 수 있는 두 개의 select 박스를 추가합니다. 
- 정렬 기준과 정렬 방향이 바뀔 때마다 search() 함수를 호출하여 API 요청을 수행합니다.
- Table 컴포넌트로 다음과 같은 props 정보를 전달합니다.
    - headerList - 테이블의 헤더 정보
    - itemList - 테이블의 행(row) 데이터
    - itemKeyList - 테이블의 행의 열(column)마다 들어가야 할 데이터의 key 정보
    - currentPage - 현재 페이지
    - totalPages - 총 페이지 수
    - pageChange - 페이지 변경 이벤트

```vue
<template>
    <input type="button" value="조회" @click="search()" />
    <select @change="onSortChange($event)">
        <option value="" disabled selected>정렬 기준</option>
        <option v-for="(header, index) in headerList" :value="itemKeyList[index]" :key="'select-' + index">{ { headerList[index] } }</option>
    </select>
    <select @change="onSortDirectionChange($event)">
        <option value="" disabled selected>정렬 방향</option>
        <option value="asc">오름차순</option>
        <option value="desc">내림차순</option>
    </select>
    <Table 
        :headerList="headerList"
        :itemList="itemList"
        :itemKeyList="itemKeyList"
        :currentPage="page.page"
        :totalPages="totalPages"
        :pageChange="onPageChange"
    />
</template>

<script>
import Table from './components/Table.vue';
import { fetchList } from '@/api/post';

export default {
    name: 'App',
    components: {
        Table
    },
    data() {
        return {
            headerList: ["등록일시", "제목", "내용"],
            itemList: [],
            itemKeyList: ["createdAt", "contents", "title"],
            sortHeader: 'createdAt',
            sortDirection: 'desc',
            totalPages: 0,
            page: {
                page: 0,
                size: 10,
                sort: "createdAt,desc"
            }
        };
    },
    methods: {
        search() {
            fetchList(this.page).then((response) => {
                this.itemList = response.data.elements;
                this.totalPages = response.data.totalPages;
                this.page.page = response.data.currentPage;
            });
        },
        onPageChange(value) {
            this.page.page = value.requestPage;
            this.search();
        },
        onSortChange(event) {
            this.sortHeader = event.target.value;
            this.page.sort = this.sortHeader + ',' + this.sortDirection;
            this.search();
        },
        onSortDirectionChange(event) {
            this.sortDirection = event.target.value;
            this.page.sort = this.sortHeader + ',' + this.sortDirection;
            this.search();
        }
    }
}
</script>
```

### 1.3. Table.vue
- 부모 컴포넌트(component)에게 전달받은 `headerList` props 정보를 이용해 테이블 헤더를 구성합니다.
- `itemList` props 정보를 이용해 테이블 행 데이터를 출력합니다.
- `itemKeyList` props 정보를 이용해 테이블 행마다 열에 들어갈 데이터를 item 객체에서 추출합니다. 
- `Pagination` 컴포넌트로 다음과 같은 props 정보를 전달합니다.
    - currentPage - 현재 페이지
    - totalPages - 총 페이지 수
    - pageChange - 페이지 변경 이벤트

```vue
<template>
    <div class="tableDiv">
        <table>
            <colgroup>
                <col v-for="(column, index) in headerList" :key="'size-' + index" />
            </colgroup>
            <thead>
                <tr>
                    <th v-for="(column, index) in headerList" :key="'header-' + index">{ { headerList[index] } }</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(item, index) in itemList" :key="'item-' + index">
                    <td v-for="(itemKey, subIndex) in itemKeyList" :key="'item-key-' + subIndex">
                        { { item[itemKey] } }
                    </td>
                </tr>
            </tbody>
        </table>
        <Pagination :currentPage="currentPage" :totalPages="totalPages" :pageChange="pageChange" />
    </div>
</template>

<script>
import Pagination from './Pagination';

export default {
    name: 'Table',
    props: ['headerList', 'itemList', 'itemKeyList', 'currentPage', 'totalPages', 'pageChange'],
    components: { Pagination }
}
</script>

<style scoped>
.tableDiv {
    border-radius: 5px;
    border: 1px solid #e0e1e3;
}

.tableDiv table th {
    font-size: 15px;
    padding: 5px 10px 5px 10px;
    color: #fff;
    background: #9d9fac;
    border: 1px solid #000;
}

.tableDiv table td {
    font-size: 15px;
    padding: 5px 10px 5px 10px;
    text-align: center;
    color: #2e2f30;
    border: 1px solid #000;
}
</style>
```

### 1.4. Pagination.vue
- 페이징 처리를 위한 숫자와 화살표를 출력합니다. 
- 간단한 계산식을 이용해 5개 단위로 숫자를 출력합니다. 
- `pageChange` props 정보를 이용해 상위 컴포넌트로 선택한 페이지 번호를 전달합니다.  

```vue
<template>
    <div class="pointer">
        <a @click="onPageChange(currentPage - 1)">&lt;</a>
        <a v-for="(paging, index) in pages" :key="index" @click="onPageChange(paging - 1)" :class="paging - 1 === currentPage ? 'currentPage' : ''">{ { paging } }</a>
        <a @click="onPageChange(currentPage + 1)">&gt;</a>
    </div>
</template>

<script>
export default {
    name: 'Pagination',
    props: ['currentPage', 'totalPages', 'pageChange'],
    data() {
        return {};
    },
    computed: {
        pages: function() {
            const list = [];
            for (let index = this.startPage; index <= this.endPage; index += 1) { list.push(index); }
            return list;
        },
        startPage() {
            return parseInt(this.currentPage / 5) * 5 + 1;
        },
        endPage() {
            let lastPage = parseInt(this.currentPage / 5) * 5 + 5;
            return lastPage <= this.totalPages ? lastPage : this.totalPages;
        }
    },
    methods: {
        onPageChange(val) {
            if (val < 0) {
                alert('첫 페이지입니다.');
                return;
            }
            if (val >= this.totalPages) {
                alert('마지막 페이지입니다.');
                return;
            }
            const param = {
                requestPage: val,
            };
            this.pageChange(param);
        }
    }
}
</script>

<style scoped>
.pointer a {
    cursor: pointer;
    margin: 5px;
}
.currentPage {
    background: #A3C010;
}
</style>
```

### 1.5. request.js
- axios 라이브러리를 이용하여 생성한 API 호출 객체를 제공합니다.

```javascript
import axios from 'axios';

const service = axios.create({
    baseURL: process.env.VUE_APP_BASE_API,
    timeout: 5000
})

export default service;
```

### 1.6. post.js
- 전달받은 질의를 request 객체를 이용하여 호출합니다.
- `/posts` 경로로 `GET` 요청 방식으로 데이터를 요청합니다.
- 전달받은 질의(query)는 params 값으로 전달합니다.

```javascript
import request from '@/utils/request';

export function fetchList(query) {
    return request({
        url: '/posts',
        method: 'get',
        params: query
    });
}
```

## 2. Back-end 서비스
`Spring Boot` 프레임워크를 사용한 벡 엔드 서비스를 살펴보겠습니다. 

### 2.1. 패키지 구조

```
./
|-- README.md
|-- action-in-blog.iml
|-- mvnw
|-- mvnw.cmd
|-- pom.xml
`-- src
    `-- main
        |-- java
        |   `-- blog
        |       `-- in
        |           `-- action
        |               |-- ActionInBlogApplication.java
        |               |-- controller
        |               |   `-- PostController.java
        |               |-- dto
        |               |   |-- PostDto.java
        |               |   `-- PostPageDto.java
        |               |-- entity
        |               |   `-- Post.java
        |               |-- repository
        |               |   `-- PostRepository.java
        |               `-- service
        |                   `-- PostService.java
        `-- resources
            `-- application.yml
```

### 2.2. ActionInBlogApplication 클래스
- CommandLineRunner 인터페이스를 구현하여 서비스 기동 시 데이터를 초기화합니다. 

```java
package blog.in.action;

import blog.in.action.entity.Post;
import blog.in.action.repository.PostRepository;
import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ActionInBlogApplication implements CommandLineRunner {

    private final PostRepository repository;

    public ActionInBlogApplication(PostRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) throws Exception {
        repository.deleteAll();
        List<Post> postList = new ArrayList<>();
        for (int index = 0; index < 100; index++) {
            postList.add(Post.builder()
                .title("title-" + index)
                .contents("contents-" + (99 - index))
                .build());
        }
        repository.saveAll(postList);
    }

    public static void main(String[] args) {
        SpringApplication.run(ActionInBlogApplication.class, args);
    }
}
```

### 2.3. PostController 클래스
- `/posts` 경로에서 데이터 조회 기능을 제공합니다. 
- `@PageableDefault` 애너테이션을 이용해 페이징 관련 정보를 전달받지 못 했을 때 사용할 Pageable 정보를 지정합니다.
    - `createdAt` 컬럼을 사용하여 정렬합니다.
    - `Sort.Direction.DESC` 내림차순으로 정렬합니다.

```java
package blog.in.action.controller;

import blog.in.action.dto.PostPageDto;
import blog.in.action.service.PostService;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@Log4j2
@CrossOrigin
@RestController
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping("/posts")
    public PostPageDto findPosts(@PageableDefault(sort = {"createdAt"}, direction = Sort.Direction.DESC) Pageable pageable) {
        return PostPageDto.of(postService.findAll(pageable));
    }
}
```

#### 2.3.1. API End-Point에서 Pageable 인터페이스 파라미터(parameter) 사용하기
Spring Boot 프레임워크는 API End-Point 메서드에 `Pageable` 인터페이스가 파라미터(parameter)로 들어있는 경우 특별한 기능을 제공합니다. 
API 질의(query)를 통해 전달받은 정보를 이용하여 `Pageable` 구현체를 만들어 제공합니다. 
간단한 예시를 들어보겠습니다. 

##### 예시 질의(query)
- `page=1` - 1번 페이지를 조회
- `size=10` - 10개 항목씩 페이징 처리
- `sort=createdAt,desc` - createdAt 항목으로 내림차순 정렬하여 조회
- 위와 같은 조건으로 조회할 수 있는 `Pageable` 구현체를 만들어 제공합니다. 

```
?page=1&size=10&sort=createdAt,desc
```

#### 2.3.2. @PageableDefault 애너테이션
API 요청 질의에 page, size, sort 같은 정보가 없는 경우 `@PageableDefault` 애너테이션에서 지정한 디폴트 값으로 `Pageable` 구현체가 생성됩니다. 
해당 애너테이션을 살펴보면 모두 디폴트(default) 값이 지정되어 있습니다. 
`sort` 값만 추가하면 정렬 기능을 사용 가능합니다. 

```java
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.PARAMETER)
public @interface PageableDefault {

    /**
     * Alias for {@link #size()}. Prefer to use the {@link #size()} method as it makes the annotation declaration more
     * expressive and you'll probably want to configure the {@link #page()} anyway.
     *
     * @return
     */
    int value() default 10;

    int size() default 10;

    int page() default 0;

    String[] sort() default {};

    Direction direction() default Direction.ASC;
}
```

### 2.4. Post 클래스
- 제목, 내용, 생성 일시 정보를 담은 엔티티(entity)입니다.

```java
package blog.in.action.dto;

import blog.in.action.entity.Post;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PostDto {

    private long id;

    private String title;

    private String contents;

    private LocalDateTime createdAt;

    public static PostDto of(Post post) {
        return PostDto
            .builder()
            .id(post.getId())
            .title(post.getTitle())
            .contents(post.getContents())
            .createdAt(post.getCreatedAt())
            .build();
    }
}
```

### 2.5. PostService 클래스
- 별도 조회 조건은 없이 `Pageable` 구현체를 사용한 페이징 처리 조회만 제공합니다.
- JpaRepository 인터페이스에서 기본적으로 제공하는 findAll 메서드를 사용합니다.

```java
package blog.in.action.service;

import blog.in.action.entity.Post;
import blog.in.action.repository.PostRepository;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Log4j2
@Service
public class PostService {

    private final PostRepository repository;

    public PostService(PostRepository repository) {
        this.repository = repository;
    }

    public Page<Post> findAll(Pageable pageable) {
        return repository.findAll(pageable);
    }
}
```

### 2.6. PostPageDto 클래스
- 전달받은 Page 객체를 Dto 객체로 변환합니다.
    - elements - 조회한 페이지에 해당하는 데이터 리스트
    - totalElements - 총 데이터 수
    - currentPage - 현재 페이지 번호
    - totalPages - 총 페이지 수

```java
package blog.in.action.dto;

import blog.in.action.entity.Post;
import java.util.List;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.domain.Page;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PostPageDto {

    private List<PostDto> elements;

    private long totalElements;

    private int currentPage;

    private int totalPages;

    public static PostPageDto of(Page<Post> postPage) {
        return PostPageDto
            .builder()
            .elements(postPage.getContent().stream().map(entity -> PostDto.of(entity)).collect(Collectors.toList()))
            .totalElements(postPage.getTotalElements())
            .totalPages(postPage.getTotalPages())
            .currentPage(postPage.getNumber())
            .build();
    }
}
```

### 2.7 PostDto 클래스
- Post 엔티티에 대응하는 Dto 클래스입니다.

```java
package blog.in.action.dto;

import blog.in.action.entity.Post;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PostDto {

    private long id;

    private String title;

    private String contents;

    private LocalDateTime createdAt;

    public static PostDto of(Post post) {
        return PostDto
            .builder()
            .id(post.getId())
            .title(post.getTitle())
            .contents(post.getContents())
            .createdAt(post.getCreatedAt())
            .build();
    }
}
```

## 3. 테스트

<p align="center"><img src="{{ site.image_url_2021 }}/spring-boot-vue-js-paging-table-01.gif" width="95%"></p>

## CLOSING
원래 이번 포스트는 간단하게 `@PageableDefault` 애너테이션에 대한 소개로 시작하였습니다. 
작성하다 보니 내용이 단순하여 살을 붙이기 시작했는데 `Vue.js`와 `Spring Boot` 프레임워크를 활용한 페이징 테이블 구현으로 포스트가 마무리되었습니다. 
페이징 처리는 단순할 것 같으면서도 상당히 번거로운 작업입니다. 
사용하는 기술 스택에 따라 구현 방법이 달라지고, 공통으로 사용하는 컴포넌트로 뽑아내면 입맛에 맞게 사용하기 어려울 때도 있습니다. 
이 포스트가 `Vue.js`와 `Spring Boot` 프레임워크를 사용하는 분들께 많은 도움이 되길 바랍니다.    

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-09-12-spring-boot-vue-js-paging-table>

[pageable-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-paging/