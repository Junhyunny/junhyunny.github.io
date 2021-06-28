---
title: "@Version 사용 시 주의사항"
search: false
category:
  - spring-boot
  - jpa
  - junit
last_modified_at: 2021-06-28T00:00:00
---

<br>

여러 사용자에 의한 특정 데이터 동시 수정 문제를 해결하기 위해 @Version 애너테이션을 사용하였습니다. 
간단한 테스트를 수행하는데 여기 저기서 에러가 터져나오기 시작했습니다. 
빨리 문제 원인과 현상을 찾아서 고쳐야겠습니다.🥶 

## 기존 코드
개발 중인 코드를 노출할 수는 없으므로 문제가 된 부분의 코드 흐름을 설명하고 비슷한 테스트 코드를 작성하였습니다.

### 기존 코드 실행 흐름
1. 신규 A 엔티티 객체 생성, A 엔티티 new
1. JpaRepository save 메소드 수행, A 엔티티 persist
1. save 메소드의 파라미터로 전달한 객체를 지속해서 사용
1. A 엔티티의 자식 엔티티 save 메소드 수행, A 자식 엔티티 persist 

### 테스트 코드 

```java
    @Test
    public void test_nonTransientEntity_throwException() {

        // 신규 엔티티 생성, new
        DefaultVersionEntity versionEntity = new DefaultVersionEntity();
        versionEntity.setValue("DefaultVersionEntity");
        versionEntity.setChildEntity(new ChildEntity(versionEntity));

        // 엔티티 save, persist
        defaultVersionEntityRepository.save(versionEntity);

        // 자식 엔티티, persist
        childEntityRepository.save(versionEntity.getChildEntity());
    }
```

### 에러 로그
- 기존에 발생하지 않던 InvalidDataAccessApiUsageException 감지 

```
org.springframework.dao.InvalidDataAccessApiUsageException: org.hibernate.TransientPropertyValueException: object references an unsaved transient instance - save the transient instance before flushing
```

### 에러 발생 원인
Jpa Entity Manager는 기본적으로 save 메소드에 파라미터로 전달한 객체를 영속성 컨텍스트(persistence context)에서 관리합니다. 
그렇기 때문에 save 메소드를 통해 저장한 객체와 save 메소드를 통해 반환되는 객체가 동일한 객체입니다.(주소가 동일) 

## OPINION
딱 코드 한 줄만 추가하였는데 여파는 무시무시했습니다. 

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action>

#### REFERENCE
- <>