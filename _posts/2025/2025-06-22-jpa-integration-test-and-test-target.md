---
title: "JPA 결합 테스트에서 JpaRepository를 준비/검증을 위해 사용하는 것이 좋을까?"
search: false
category:
  - spring
  - spring-boot
  - jpa
  - unit-test
  - integration-test
last_modified_at: 2025-06-22T23:55:00
---

<br/>

## 0. 들어가면서

몇 주 전에 JpaRepository를 테스트를 위한 준비나 검증을 위해 사용하는 것이 좋지 않다는 이야기를 같이 페어 프로그래밍(pair programming)하는 개발자에게 말한적이 있었다. 그 이후에 다시 관련된 질문을 받았는데, 좋은 기회다 싶어서 예제 코드와 글로 정리해봤다.

## 1.Test scope

JPA 결합 테스트의 스코프(scope)를 생각해보자. `@DataJpaTest` 애너테이션이나 `@SpringBootTest` 애너테이션과 테스트 컨테이너(test container)를 같이 사용한 테스트의 경우를 예로 들어본다. MemberServiceTest의 테스트 대상은 MemberService 객체이지만, 실제 MemberRepository 인스턴스를 사용한다. 이 경우 [테스트 더블(test double)][test-double-link]은 데이터베이스(H2 혹은 테스트 컨테이너)가 된다. 즉, 테스트에서 검증하고 싶은 대상은 서비스 계층과 레포지토리 계층 모두이다. 두 계층 사이의 상호 작용을 통해 원하는 결과를 얻을 수 있는지 확인하는 것이 테스트의 주된 관심사다.

<div align="center">
  <img src="/images/posts/2025/jpa-integration-test-and-test-target-01.png" width="100%" class="image__border">
</div>

<br/>

본론으로 다시 돌아와서 JPA 결합 테스트에서 MemberRepository 인스턴스를 사용해 테스트 준비(arrange)와 검증(assert)하는 것은 좋은 패턴일까? 나는 아니라고 생각한다. MemberRepository 인스턴스는 결합 테스트로 확인하고 싶은 스코프에 포함되기 때문에 이를 사용해 준비와 검증을 하는 것은 제대로 검증되지 않아 신뢰도가 낮은 객체로 테스트를 위한 준비와 검증을 한다는 이야기다. 이는 거짓 음성(false negative)를 만들어내어 테스트가 신뢰도를 잃을 수 있다. (거짓 음성은 구현 코드에 문제 혹은 버그가 있는데 테스트가 통과하는 경우를 의미한다.)

## 2. Simple example

아주 간단한 예시를 만들어보자. createEnableMember 메소드를 테스트한다. 테스트의 관심사는 사전에 동일한 이메일로 등록된 멤버가 있지만 비활성화된 사용자라면 createEnableMember 메소드로 신규 사용자를 생성할 수 있는지 여부이다. 동일한 이메일로 미리 비활성화된 사용자를 준비하고, 동일한 이메일로 신규 사용자를 등록한다.

```java
@DataJpaTest
class BadCaseMemberServiceTest {

    @Autowired
    MemberRepository memberRepository;
    MemberService sut;

    @BeforeEach
    void setUp() {
        sut = new MemberService(memberRepository);
    }

    @Test
    void givenMemberWithSameMailIsDisabled_whenCreateEnableMember_thenNewMemberIsSaved() {
        // given - save disabled user with a same email
        memberRepository.save(
                new MemberEntity("user@example.com", false)
        );


        // when - save enable member
        var saved = sut.createEnableMember("user@example.com");


        // then - find enable member
        var result = memberRepository.findEnableMemberByEmail(
                "user@example.com"
        ).orElseThrow();
        assertThat(
                result.getId(),
                equalTo(saved.getId())
        );
    }
}
```

개발자는 마침 MemberRepository 인터페이스에 이메일로 활성화된 사용자를 찾는 메소드가 있어서 검증부에서 이를 사용했다. findEnableMemberByEmail 메소드를 통해 이메일로 활성화된 사용자를 찾았기 때문에 중복되는 검증을 제외하고 저장된 객체의 ID가 동일한지만 확인하는 코드를 작성했다. 테스트를 언뜻 보면 큰 문제는 없어보인다. 

이번엔 테스트 대상인 createEnableMember 메소드를 살펴보자. 코드를 보면 버그가 있다. 동일한 사용자를 찾는 로직 이후에 활성화된 사용자를 저장할 때 활성화 여부가 null 값으로 지정되어 있다. 

```java
@Service
public class MemberService {

    private final MemberRepository memberRepository;

    public MemberService(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    public MemberEntity createEnableMember(String email) {
        if (memberRepository.findEnableMemberByEmail(email).isPresent()) {
            throw new IllegalStateException(
                    String.format("enable user with this email is exsited.(%s)", email)
            );
        }
        return memberRepository.save(
                new MemberEntity(
                        email,
                        null
                )
        );
    }
}
```

구현 코드에 문제가 있지만, findEnableMemberByEmail 메소드에도 문제가 있다면 테스트는 정상적으로 통과할 수 있다. findEnableMemberByEmail 메소드의 이름만 보면 활성화된 사용자를 찾는 것처럼 보이지만, 쿼리에 enable 여부를 확인하는 조건에 문제가 있다. `e.enable is not false` 조건은 `true`와 `null` 값을 모두 허용한다. 두 가지 버그가 함께 맞물려서 구현 코드에 문제가 있음에도 테스트가 통과하는 거짓 음성을 만들고 있다.

```java
public interface MemberRepository extends JpaRepository<MemberEntity, Long> {
    @Query("""
            select e from MemberEntity e where e.email = :email and e.enable is not false
            """)
    Optional<MemberEntity> findEnableMemberByEmail(String email);
}
```

## 3. Improvement

테스트 케이스를 보완해보자. 쿼리로 활성화된 사용자를 찾고 싶다면 검증부에서 EntityManager 인스턴스를 활용한다. 이메일과 활성화 여부를 확인하는 쿼리를 직접 작성해 신뢰할 수 있는 테스트 코드의 검증부를 작성한다. 아래 테스트는 활성화 된 사용자를 찾는 쿼리를 실행할 때 결과를 찾을 수 없어서 테스트가 실패한다.

```java
@DataJpaTest
class GoodCaseMemberServiceTest {

    @Autowired
    EntityManager em;
    @Autowired
    MemberRepository memberRepository;
    MemberService sut;

    @BeforeEach
    void setUp() {
        sut = new MemberService(memberRepository);
    }

    @Test
    void givenMemberWithSameMailIsDisabled_whenCreateEnableMember_thenNewMemberIsSaved_1() {
        memberRepository.save(
                new MemberEntity("user@example.com", false)
        );

        
        var saved = sut.createEnableMember("user@example.com");


        var result = em.createQuery(
                        "select m from MemberEntity m where m.email = :email and m.enable = true ",
                        MemberEntity.class
                )
                .setParameter("email", "user@example.com")
                .getSingleResult();
        assertThat(
                result.getId(),
                equalTo(saved.getId())
        );
    }
}
```

혹은 식별자로 엔티티를 조회한 후 이메일과 활성화 여부를 확인한다. 아래 테스트는 활성화 여부를 확인할 때 true 값이 아니기 때문에 테스트가 실패한다.

```java
    @Test
    void givenMemberWithSameMailIsDisabled_whenCreateEnableMember_thenNewMemberIsSaved_2() {
        memberRepository.save(
                new MemberEntity("user@example.com", false)
        );

        
        var saved = sut.createEnableMember("user@example.com");


        var result = em.find(MemberEntity.class, saved.getId());
        assertThat(
                result.getId(),
                equalTo(saved.getId())
        );
        assertThat(
                result.getEmail(),
                equalTo("user@example.com")
        );
        assertThat(
                result.isEnable(),
                equalTo(true)
        );
    }
```

위에서 살펴본 두 테스트들 createEnableMember 메소드가 갖는 문제에 대해 양성 반응을 보이기 때문에 개발자가 문제가 되는 부분을 찾을 수 있다.

## CLOSING

잘못된 테스트 케이스에서도 assertThat 구문을 통해 활성화 여부까지 확인했다면 물론 거짓 음성을 차단할 수 있다. 하지만 어떤 개발자들은 findEnableMemberByEmail 메소드를 통해 활성화 여부가 확인되었다고 믿고 중복된 검증을 작성하지 않을 가능성도 있다.

나는 Repository를 테스트 준비와 검증을 위해 사용하는 것을 권장하지 않을 뿐 원칙적으로 금지하는 것은 아니다. `findById`, `findAll`, `save`, `saveAll` 같은 메소드들은 Spring Data JPA 내부에서 충분히 검증되었기 때문에 신뢰하고 적절히 활용할 수 있다. 다만 Repository를 테스트 코드의 준비와 검증에서 사용되기 시작하면, 위 예시처럼 커스텀 메소드들을 아무 의심 없이 준비와 검증에서 사용하는 테스트를 작성할 수 있다. Repository에 결함이 있으면 구현 코드에 결함이 있어도 테스트가 통과하는 **거짓 음성(false negative)**이 발생할 수 있으며, 이는 테스트의 신뢰도를 크게 떨어뜨린다. 나는 이를 사전에 방지하기 위해 EntityManager 같은 별도 모듈을 사용하는 것을 선호한다. 

테스트 준비와 검증에서 테스트 대상으로 포함되는 모듈을 활용하지 말라는 내용을 어디선가 읽은 뒤로 항상 이를 염두에 두고 테스트를 작성하고 있다. 2022년쯤에 읽고 그 이후 프로젝트들은 테스트 코드를 작성할 때 이런 부분들을 고민하기 시작했다. 그런데 출처가 도무지 기억나지 않는다. 집에 있는 책들 중 테스트 관련된 내용을 훑어봤지만 찾을 수가 없다. 여유가 된다면 관련 책들을 다시 꼼꼼히 읽어봐야겠다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2025-06-22-jpa-integration-test-and-test-target>

[test-double-link]: https://junhyunny.github.io/test/test-driven-development/test-double/