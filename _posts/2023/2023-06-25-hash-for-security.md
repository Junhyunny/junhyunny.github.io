---
title: "Hash for Security"
search: false
category:
  - information
  - security
  - java
last_modified_at: 2023-06-25T23:55:00
---

<br/>

## 1. Hash

해시(hash)는 단방향 암호화 기법이다. 평문을 암호화 된 텍스트로 만들어준다. 해시 함수(hash function)를 사용해 평문(plain text)을 암호화 된 문자열로 변환한다. 암호화 된 문자열은 고정된 길이를 갖는 데 이를 다이제스트(digest)라고 한다. 단방향이기 때문에 암호화 된 문자열을 다시 평문으로 복호화가 불가능하다. 일부만 변경되어도 전혀 다른 값이 된다는 특징 때문에 다음과 같은 용도로 사용하다.

- 메시지의 오류나 변조를 탐지할 수 있는 무결성 확인 용도로 사용한다.
- 복호화 할 필요가 없는 비밀번호, 전자투표, 전자상거래 등에 사용된다.

<div align="center">
  <img src="/images/posts/2023/hash-for-security-01.png" width="80%" class="image__border">
</div>
<center>https://st-lab.tistory.com/100</center>

### 1.1. Hash Function

해시 함수는 암호화 알고리즘을 의미한다. 다음과 같은 특징을 가진다. 

- 입력 값이 일부만 변경되어도 다른 다이제스트 값을 출력한다. 
  - 입력 값에 아주 작은 변화만으로도 전혀 다른 다이제스트 값을 가지며 이를 `눈사태 효과`라고 한다. 
- 입력 값에 상관 없이 고정된 길이의 다이제스트 값을 출력한다.
- 복호화가 불가능하지만, 입력 값이 같다면 같은 출력 값을 보장한다.
- 복잡하지 않은 알고리즘을 사용하기 때문에 CPU와 메모리 같은 시스템 자원을 덜 소모한다.

### 1.2. Kind of Algorithms

다음과 같은 종류의 해시 알고리즘들이 있다. 

- MD5(Message-Digest Algorithm 5)
  - 1992년 128비트 길이로 만들어진 알고리즘이다.
  - 해시 값을 고속으로 출력할 수 있으며 현재는 많은 약점이 노출되어 단독으로 사용되지 않는다.
- SHA-1(Secure Hash Algorithm-1)
  - 1995년에 발표된 규격으로 160비트 해시 값을 생성한다.
  - 2017년 2월에 해시 충돌 약점을 이용한 브루트 포스 공격으로 돌파되어 현재는 사용하지 않는다. 
- SHA-2(Secure Hash Algorithm-2)
  - SHA-1을 개량하여 2001년 NIST(미국 표준 기술 연구소)에 의해 표준화 된 규격이다.
  - 뒤에 붙는 숫자에 따라 해시 값의 길이와 블록 크기 등이 결정되며 길수록 안정성이 높아집니다. 
  - 현재는 SHA-256이나 SHA-512가 주로 사용된다.

## 2. Problems

해시는 훌륭한 보안 수단이지만, 다음과 같은 문제점이 있다. 

- 브루트 포스(brute force) 공격이 가능하다.
  - 해시는 자원 소모가 적기 때문에 처리 속도가 빠른데 이는 장점이자 취약점이 된다. 
  - 고성능의 GPU를 사용하면 수많은 값을 비교할 수 있기 때문에 모두 대입하여 뚫릴 가능성이 높다. 
- 다른 입력 값을 암호화하더라도 같은 다이제스트 출력 값을 가질 수 있다. 
  - 해싱 충돌이 발생한 경우이다. 
  - 다른 입력이지만, 변환된 다이제스트 출력 값만을 비교한다면 보안이 뚫릴 수 있다.
- 사전 공격이 가능하다. 
  - 여러가지 암호 유형의 데이터를 대량으로 미리 암호화하고 테이블에 저장하는데 이를 레인보우 테이블(rainbow table)라고 한다. 
  - 동일한 입력에 대해선 항상 같은 출력이기 때문에 다이제스트 값을 탈취했다면 레인보우 테이블을 통해 평문 값을 찾아낼 수 있다.
  - MD5 해시 알고리즘 같은 경우에는 이미 인터넷에 수많은 레인보우 테이블이 노출되어 있다고 한다.

이런 문제를 해결하기 위해 다음과 같은 보조 수단을 사용한다.

- 솔트(salt)
  - 일종의 랜덤 텍스트이며 이를 함께 섞어 다이제스트를 생성한다.
  - 스토리지에 저장되는 비밀번호를 보호하기 위해 사용된다.
  - 솔트 값이 유저마다 다르다면 한 명의 비밀번호가 유출되더라도 다른 사람의 비밀번호는 안전한다.
  - 해시 값을 알더라도 레인보우 테이블에서 일치하는 비밀번호를 찾기 어렵습니다.

<div align="center">
    <img src="/images/posts/2023/hash-for-security-02.png" width="80%" class="image__border">
</div>
<center>https://st-lab.tistory.com/100</center>

- 키 스트레칭(key stretching)
  - 해싱을 여러 차례 수행한다.
  - 여러 차례 해싱을 수행하기 때문에 더 많은 시간이 소요된다.

<div align="center">
    <img src="/images/posts/2023/hash-for-security-03.png" width="80%" class="image__border">
</div>
<center>https://st-lab.tistory.com/100</center>

## 3. Practice

스프링 시큐리티(spring security)에 포함된 해시 기능들을 살펴보자. 

- PBKDF2(Password-Based Key Derivation Fucntion)
  - 솔트를 적용한 후 해시 함수를 임의의 반복 횟수만큼 적용한다. 
- BCrypt
  - 패스워드 저장을 목적으로 설계되었습니다.
  - 패스워드를 생성할 때 랜덤한 솔트를 사용하기 때문에 다른 인코딩 결과를 반환한다.
- SCrypt
  - 다이제스트를 생성할 때 메모리 오버헤드를 갖도록 설계되었습니다.
  - 브루트 포스 공격을 방지할 때 사용되며 PBKDF2, BCrypt보다 강력한 보안을 제공한다.

이들 중 `BCrypt`와 JDK(Java Development Kit)이 기본적으로 제공하는 `MessageDigest`를 사용한 예제를 살펴보자. 

### 3.1. Use Bcrypt in Spring Security

Bcrypt 클래스를 먼저 사용해보자.

- BCrypt 클래스는 랜덤한 솔트를 사용해 매번 새로운 해시 값을 생성한다.
- checkpw 메소드는 전달받은 평문과 다이제스트가 동일한지 확인한다.
- BCrypt 알고리즘의 다이제스트는 솔트 정보를 함께 포함하고 있기 때문에 매번 새로운 해시 값을 만들어져도 동일한지 확인 가능하다.

```java
package action.in.blog;

import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

class SpringSecurityCryptoTests {

    Logger logger = LoggerFactory.getLogger(SpringSecurityCryptoTests.class);

    @Test
    void bcrypt_test() {
        var password = "Hello World";
        var salt1 = BCrypt.gensalt();
        var salt2 = BCrypt.gensalt();
        var firstDigest = BCrypt.hashpw(password, salt1);
        var secondDigest = BCrypt.hashpw(password, salt2);


        logger.info(salt1);
        logger.info(salt2);
        logger.info(firstDigest);
        logger.info(secondDigest);


        assertThat(firstDigest.equals(secondDigest), equalTo(false));
        assertThat(BCrypt.checkpw(password, firstDigest), equalTo(true));
        assertThat(BCrypt.checkpw(password, secondDigest), equalTo(true));
    }

    ...
}
```

다음과 같은 로그를 확인할 수 있다.

- 같은 평문을 암호화하지만 서로 다른 다이제스트 값이 출력된다.
- 해시 암호화에 사용한 솔트 값이 다이제스트에 포함되어 있다.

```
21:40:55.404 [Test worker] INFO action.in.blog.SpringSecurityCryptoTests -- $2a$10$/F0RcK9VrT.b5TDxLtwC9u
21:40:55.407 [Test worker] INFO action.in.blog.SpringSecurityCryptoTests -- $2a$10$BIWirX2YhEodCaZRo/hNSe
21:40:55.407 [Test worker] INFO action.in.blog.SpringSecurityCryptoTests -- $2a$10$/F0RcK9VrT.b5TDxLtwC9u1mgfKOPFtJk9JTZbAQtKxoBZxtXx2Vu
21:40:55.408 [Test worker] INFO action.in.blog.SpringSecurityCryptoTests -- $2a$10$BIWirX2YhEodCaZRo/hNSe3EEXfpualrce8YQPsS1xf.CYdy7cvwq
```

이번엔 BCryptPasswordEncoder 클래스를 사용한다. PasswordEncoder 인스턴스는 스프링 시큐리티의 인증 프로세스에서 사용된다. 

- 동일한 평문을 암호화하지만, 다이제스트 값은 동일하지 않다.
- matches 메소드를 사용하면 해당 평문과 다이제스트가 동일한지 확인할 수 있다.

```java
class SpringSecurityCryptoTests {

    Logger logger = LoggerFactory.getLogger(SpringSecurityCryptoTests.class);

    @Test
    void password_encoder_test() {
        var sut = new BCryptPasswordEncoder();
        var password = "Hello World";
        var firstDigest = sut.encode(password);
        var secondDigest = sut.encode(password);


        logger.info(firstDigest);
        logger.info(secondDigest);


        assertThat(firstDigest.equals(secondDigest), equalTo(false));
        assertThat(sut.matches(password, firstDigest), equalTo(true));
        assertThat(sut.matches(password, secondDigest), equalTo(true));
    }
}
```

다음과 같은 로그를 볼 수 있다.

- 같은 평문을 암호화하지만 서로 다른 다이제스트 값이 출력된다.

```
21:42:00.038 [Test worker] INFO action.in.blog.SpringSecurityCryptoTests -- $2a$10$Q.LHWjEFfe36IFNDgvlLteEP8ESU.AALYFNWr/MpFLvSO.fA88mZe
21:42:00.041 [Test worker] INFO action.in.blog.SpringSecurityCryptoTests -- $2a$10$8RzhABRyuSsl94G1K.hN8OZehAT8kobDBG4N3FTZHJgII1OfmzrBG
```

### 3.2. Use MessageDigest with SHA-256 Algorithm in JDK

이번엔 MessageDigest 클래스를 사용해 평문을 암호화해본다. 

1. MessageDigest 클래스를 사용할 때 원하는 알고리즘을 지정한다.
  - SHA-256 알고리즘을 사용한다.
2. 솔트와 키 스트레칭 작업을 별도로 수행해야 한다.
  - 아래 예제에선 5회 스트레칭을 수행한다.

```java
package action.in.blog;

import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;

class JavaSecurityTests {

    Logger logger = LoggerFactory.getLogger(JavaSecurityTests.class);

    private String getSalt() {
        SecureRandom random = new SecureRandom();
        byte[] salt = new byte[16];
        random.nextBytes(salt);
        return getStringFromBytes(salt);
    }

    private String getStringFromBytes(byte[] bytes) {
        StringBuilder builder = new StringBuilder();
        for (byte b : bytes) {
            builder.append(String.format("%02x", b));
        }
        return builder.toString();
    }

    private String getDigest(String password, String salt) throws NoSuchAlgorithmException {
        var messageDigest = MessageDigest.getInstance("SHA-256"); // 1
        byte[] tempDigest = null;
        for (int index = 0; index < 5; index++) { // 2
            String passwordOrDigest = index == 0 ? password : new String(tempDigest, StandardCharsets.UTF_8);
            String saltedPassword = passwordOrDigest + salt;
            messageDigest.update(saltedPassword.getBytes(StandardCharsets.UTF_8));
            tempDigest = messageDigest.digest();
        }
        return getStringFromBytes(tempDigest);
    }

    @Test
    void message_digest_test() throws NoSuchAlgorithmException {
        var password = "Hello World";
        var salt = getSalt();
        var digest = getDigest(password, salt);


        logger.info(salt);
        logger.info(digest);
    }
}
```

다음과 같은 로그를 확인할 수 있다.

```
16:12:44.813 [Test worker] INFO action.in.blog.JavaSecurityTests -- 86070f069b31a07521eb1d0637951054
16:12:44.817 [Test worker] INFO action.in.blog.JavaSecurityTests -- 0effc8662724e98e5bcf4dba84df56a5893b335929bad70560074dffe7a94ea8
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-06-25-hash-for-security>

#### REFERENCE

- <https://en.wikipedia.org/wiki/Bcrypt>
- <https://jeong-pro.tistory.com/92>
- <https://ru-magazine.tistory.com/47>
- <https://tired-overtime.tistory.com/136>
- <https://blog.humminglab.io/posts/tls-cryptography-10-hash/>
- <https://st-lab.tistory.com/100>
- <https://www.baeldung.com/java-password-hashing>
- <https://en.wikipedia.org/wiki/Bcrypt>
- [암호화의 종류와 Bcrypt](https://velog.io/@yenicall/%EC%95%94%ED%98%B8%ED%99%94%EC%9D%98-%EC%A2%85%EB%A5%98%EC%99%80-Bcrypt)
