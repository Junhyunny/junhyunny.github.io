---
title: "EntityManager의 Thread Safety"
search: false
category:
  - spring
  - jpa
  - database
last_modified_at: 2021-02-02T00:00:00
---

# EntityManager의 Thread Safety<br>

> EntityManager는 여러 스레드가 동시에 접근하면 동시성 문제가 발생하므로 스레드 간에 절대 공유하면 안 된다.

여기서 말하는 **`동시성 문제`**란 짧은 찰나이지만 동일 시간대에 여러 스레드가 동시에 EntityManager를 사용한다면 수행 결과가 매번 달라질 수 있는 현상을 의미합니다. 

## OPINION
작성 중 입니다.

#### 참조글
- [Spring Container는 JPA EntityManager의 Thread-Safety를 어떻게 보장할까?][thread-safety-blogLink]

[thread-safety-blogLink]: https://medium.com/@SlackBeck/spring-container%EB%8A%94-jpa-entitymanager%EC%9D%98-thread-safety%EB%A5%BC-%EC%96%B4%EB%96%BB%EA%B2%8C-%EB%B3%B4%EC%9E%A5%ED%95%A0%EA%B9%8C-1650473eeb64