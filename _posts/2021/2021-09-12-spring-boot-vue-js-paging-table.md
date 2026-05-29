---
title: "스프링 부트(Spring Boot)와 VueJS 프레임워크로 테이블 페이징(paging) 처리"
search: false
category:
  - spring-boot
  - vue.js
last_modified_at: 2026-05-30T01:48:52+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [JPA 페이징(paging) 처리][pageable-link]

## 0. 들어가면서

Jekyll 문법과 충돌하므로 `{ { someValue } }`으로 표기된 코드는 공백을 제거해야 정상적으로 동작한다.

## 1. 프론트엔드 서비스

`Vue.js` 프레임워크를 사용한 프론트엔드 서비스부터 살펴보자. 패키지 구조는 다음과 같다.

```
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

메인 화면인 `App.vue` 파일을 살펴보자.

1. 조회 버튼을 클릭하면 `search` 함수 이벤트가 실행된다.
2. `fetchList` 함수에 `page` 정보를 전달하여 API 요청을 수행한다.
3. 정상 응답을 받으면 컴포넌트(component)의 스테이트(state) 정보를 변경한다.

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

화면에는 정렬 기준과 정렬 방향을 선택할 수 있는 두 개의 select 박스가 있다. 정렬 기준과 정렬 방향이 바뀔 때마다 마찬가지로 `search()` 함수를 호출하여 API 요청을 수행한다. 위 코드를 보면 `Table` 컴포넌트에 다음과 같은 props 정보를 전달한다.

- headerList - 테이블의 헤더 정보
- itemList - 테이블의 행(row) 데이터
- itemKeyList - 테이블 행의 열(column)마다 들어가야 할 데이터의 key 정보
- currentPage - 현재 페이지
- totalPages - 총 페이지 수
- pageChange - 페이지 변경 이벤트

`Table` 컴포넌트는 어떻게 구현되어 있을까? `Table.vue` 코드를 살펴보자.

1. 부모 컴포넌트(component)에서 전달받은 `headerList` props 정보를 이용해 테이블 헤더를 구성한다.
2. `itemList` props 정보를 이용해 테이블 행 데이터를 출력한다.
3. `itemKeyList` props 정보를 이용해 테이블 행마다 열에 들어갈 데이터를 item 객체에서 추출한다.

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

`Table` 컴포넌트는 `Pagination` 컴포넌트에 다음과 같은 props 정보를 전달한다.

- currentPage - 현재 페이지
- totalPages - 총 페이지 수
- pageChange - 페이지 변경 이벤트

`Pagination` 컴포넌트는 어떻게 구현되어 있을까? `Pagination.vue` 코드를 살펴보자.

1. 페이징 처리를 위한 숫자와 화살표를 출력한다.
2. 간단한 계산식을 이용해 5개 단위로 숫자를 출력한다.
3. `pageChange` props 정보를 이용해 상위 컴포넌트에 선택한 페이지 번호를 전달한다.

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

`request.js` 파일에 axios 라이브러리를 이용해서 API 호출을 위한 API 클라이언트 객체를 만든다.

```javascript
import axios from 'axios';

const service = axios.create({
    baseURL: process.env.VUE_APP_BASE_API,
    timeout: 5000
})

export default service;
```

`post.js` 파일에서 전달받은 질의를 request 객체를 이용해 API 엔드포인트를 호출한다.

- `/posts` 경로로 `GET` 요청 방식으로 데이터를 요청한다. 전달받은 질의(query)는 params 값으로 전달한다.

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

## 2. 백엔드 서비스

스프링 부트(Spring Boot) 프레임워크로 애플리케이션을 구현한다. 패키지 구조는 다음과 같다.

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

`main` 메서드가 위치한 ActionInBlogApplication 클래스를 살펴보자. CommandLineRunner 인터페이스를 구현하여 서비스 기동 시 데이터를 초기화한다.

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

엔드포인트가 정의된 PostController 클래스를 살펴보자. `/posts` 경로로 데이터를 조회할 수 있다.

- `@PageableDefault` 애너테이션을 이용해 페이징 관련 정보를 전달받지 못했을 때 사용할 Pageable 정보를 지정한다.
  - `createdAt` 컬럼을 사용하여 정렬한다.
  - `Sort.Direction.DESC` 내림차순으로 정렬한다.

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

스프링 부트 프레임워크는 API 엔드포인트에서 `Pageable` 인스턴스가 메서드 시그니처(signature)의 파라미터(parameter)로 들어 있는 경우 특별한 기능을 제공한다. API 질의(query)를 통해 전달받은 정보로 `Pageable` 구현체를 만들어 제공한다. 간단한 예시를 살펴보자. 다음과 같이 클라이언트가 쿼리 요청을 보냈다고 가정해 보자.

```
?page=1&size=10&sort=createdAt,desc
```

위 쿼리가 포함된 요청을 받으면 아래 조건으로 데이터를 조회할 수 있는 `Pageable` 인스턴스가 메서드에 주입된다.

- `page=1` - 1번 페이지를 조회
- `size=10` - 10개 항목씩 페이징 처리
- `sort=createdAt,desc` - createdAt 항목으로 내림차순 정렬하여 조회

`@PageableDefault` 애너테이션은 요청 쿼리에 page, size, sort 같은 정보가 없는 경우 `@PageableDefault` 애너테이션에서 지정한 디폴트 값으로 `Pageable` 인스턴스를 주입받을 수 있는 기능이다. 해당 애너테이션을 살펴보면 모두 디폴트(default) 값이 지정되어 있다. `sort` 값만 추가하면 정렬 기능을 사용할 수 있다.

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

이제 데이터베이스 연결에 필요한 엔티티(entity) Post 클래스를 살펴보자. 제목, 내용, 생성 일시 정보를 담고 있다.

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

비즈니스 로직을 수행하는 PostService 클래스를 살펴보자. JpaRepository 인터페이스에서 기본적으로 제공하는 `findAll` 메서드를 사용한다. `Pageable` 인스턴스를 전달하면 자동으로 페이징 처리가 적용된 조회가 수행된다.

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

API 응답을 위한 PostPageDto 클래스를 살펴보자. `of` 메서드에서 Post 엔티티 객체들이 담긴 Page 인스턴스를 PostPageDto 객체로 변경한다.

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

Post 엔티티에 대응하는 PostDto 클래스를 살펴보자.

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

필요한 모든 기능 구현 코드를 살펴봤다. 실제로 잘 동작하는지 실행해 보자.

<div align="center">
  <img src="{{ site.image_url_2021 }}/spring-boot-vue-js-paging-table-01.gif" width="100%">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-09-12-spring-boot-vue-js-paging-table>

[pageable-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-paging/
