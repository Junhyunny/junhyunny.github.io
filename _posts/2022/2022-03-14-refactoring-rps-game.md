---
title: "Refactoring RPS(Rock, Paper, Scissors) Game"
search: false
category:
  - java
  - design-pattern
  - test-driven-development
last_modified_at: 2022-03-14T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [Strategy Pattern][strategy-pattern-link] 

## 0. 들어가면서

최근 TDD(Test Driven Devlepment)에 대해 설명하는 시간을 가지면서 간단한 예시로 가위, 바위, 보 게임을 만들었습니다. 
게임 구현 자체는 매우 쉽습니다. 
테스트 코드를 작성해가는 과정을 소개하기에 좋은 예제였지만, 리팩토링하기엔 애매한 부분이 있었습니다. 
저는 코드를 리팩토링하거나 변경하였을 때 놓칠 수 있는 버그를 잡아주는 것이 `TDD` 개발 방식의 가장 큰 장점이라고 생각합니다. 
그런 관점에서 코드를 크게 리팩토링하고 싶었는데, 생각보다 쉽지 않았습니다. 
많은 고민 끝에 함수형 인터페이스를 이용해 `enum` 객체를 추상화하였는데, 좋은 연습이 될 수 있을 것 같아서 포스트로 정리하였습니다. 

## 1. RPS 게임 소개

모두가 아는 가위, 바위, 보 게임입니다. 
- 가위는 바위에게 지고, 보에게 이깁니다. 
- 바위는 보에게 지고, 가위에게 이깁니다. 
- 보는 가위에게 지고, 바위에게 이깁니다. 

두 명의 플레이어가 가위, 바위, 보 게임을 한다면 총 9개의 경우의 수가 발생합니다. 
간단한 테스트 코드와 구현 코드를 살펴보겠습니다. 

##### 가위, 바위, 보 게임

<p align="center">
    <img src="/images/refactoring-rps-game-1.JPG" width="50%" class="image__border">
</p>
<center>https://en.wikipedia.org/wiki/Rock_paper_scissors</center>

### 1.1. RPSGame 클래스

```java
package action.in.blog.rps;

public class RpsGame {

    public static String play(Hand player1, Hand player2) {
        if (player1.equals(Hand.ROCK)) {
            if (player2.equals(Hand.SCISSORS)) {
                return "PLAYER1";
            } else if (player2.equals(Hand.PAPER)) {
                return "PLAYER2";
            }
        } else if (player1.equals(Hand.PAPER)) {
            if (player2.equals(Hand.ROCK)) {
                return "PLAYER1";
            } else if (player2.equals(Hand.SCISSORS)) {
                return "PLAYER2";
            }
        } else if (player1.equals(Hand.SCISSORS)) {
            if (player2.equals(Hand.PAPER)) {
                return "PLAYER1";
            } else if (player2.equals(Hand.ROCK)) {
                return "PLAYER2";
            }
        }
        return "DRAW";
    }
}
```

### 1.2. Hand enum
- 가위, 바위, 보에 대해 정의합니다. 

```java
package action.in.blog.rps;

public enum Hand {
    
    SCISSORS, PAPER, ROCK
}
```

##### 최초 클래스 다이어그램

<p align="left">
    <img src="/images/refactoring-rps-game-2.JPG" width="35%" class="image__border">
</p>

### 1.3. 테스트 코드 

```java
package action.in.blog.rps;

import org.junit.jupiter.api.Test;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

public class RpsGameTests {

    @Test
    public void rockVsScissors_play_winnerIsPlayer1() {
        String winner = RpsGame.play(Hand.ROCK, Hand.SCISSORS);
        assertThat(winner, equalTo("PLAYER1"));
    }

    @Test
    public void rockVsPaper_play_winnerPlayer2() {
        String winner = RpsGame.play(Hand.ROCK, Hand.PAPER);
        assertThat(winner, equalTo("PLAYER2"));
    }

    @Test
    public void rockVsRock_play_draw() {
        String winner = RpsGame.play(Hand.ROCK, Hand.ROCK);
        assertThat(winner, equalTo("DRAW"));
    }

    @Test
    public void paperVsRock_play_winnerIsPlayer1() {
        String winner = RpsGame.play(Hand.PAPER, Hand.ROCK);
        assertThat(winner, equalTo("PLAYER1"));
    }

    @Test
    public void paperVsScissors_play_winnerPlayer2() {
        String winner = RpsGame.play(Hand.PAPER, Hand.SCISSORS);
        assertThat(winner, equalTo("PLAYER2"));
    }

    @Test
    public void paperVsPaper_play_draw() {
        String winner = RpsGame.play(Hand.PAPER, Hand.PAPER);
        assertThat(winner, equalTo("DRAW"));
    }

    @Test
    public void scissorsVsPaper_play_winnerIsPlayer1() {
        String winner = RpsGame.play(Hand.SCISSORS, Hand.PAPER);
        assertThat(winner, equalTo("PLAYER1"));
    }

    @Test
    public void scissorVsRock_play_winnerPlayer2() {
        String winner = RpsGame.play(Hand.SCISSORS, Hand.ROCK);
        assertThat(winner, equalTo("PLAYER2"));
    }

    @Test
    public void scissorVsScissors_play_draw() {
        String winner = RpsGame.play(Hand.SCISSORS, Hand.SCISSORS);
        assertThat(winner, equalTo("DRAW"));
    }
}
```

## 2. RPS 게임 확장을 위한 리팩토링

사용자들은 오랜 시간 가위, 바위, 보 게임을 즐겼습니다. 
슬슬 인기가 식어가기 시작합니다. 
개발 팀은 몇 가지 규칙을 더 섞어서 게임을 확장하자고 결정하였습니다. 
이번엔 도마뱀(lizard), 스팍(spock)을 추가하려고 합니다. 

개발 팀은 게임이 앞으로도 계속 확장될 수 있다고 생각하니 `RpsGame` 클래스의 `play` 메소드를 계속 변경하는 것은 매우 위험하다고 판단하였습니다. 
늘어나는 경우의 수와 증가하는 코드 라인 수는 개발자의 가독성과 이해도를 낮춥니다. 
`RpsGame` 클래스의 `play` 메소드를 사용하는 곳들에 영향을 주지 않고 이를 리팩토링하려고 합니다. 

##### 가위, 바위, 보, 도마뱀 그리고 스팍 게임

<p align="center">
    <img src="/images/refactoring-rps-game-3.JPG" width="50%" class="image__border">
</p>
<center>https://m.post.naver.com/viewer/postView.naver?volumeNo=23912903&memberNo=39735121</center>

### 2.1. 함수형 인터페이스를 이용한 Hand enum 기능 추상화
- 각 `enum` 객체들이 자신이 겨룰 수 있는 경우의 수를 직접 판단하도록 합니다. 
- 자신과 상대방이 싸웠을 때 다음과 같은 결과를 반환합니다.
    - 자신이 이기면 1을 반환합니다.
    - 자신이 지면 -1을 반환합니다.
    - 비기면 0을 반환합니다.
- 도마뱀과 스팍을 새로 추가하면서 자신들이 싸워서 나올 수 있는 경우의 수를 함께 추가합니다.
- 도마뱀과 스팍이 추가되면 가위, 바위, 보 객체의 판정 함수도 변경이 필요합니다.

```java
package action.in.blog.rps;

import java.util.function.Function;

public enum Hand {

    SCISSORS("SCISSORS", (otherHand) -> {
        if (otherHand.value.equals("PAPER")) {
            return 1;
        } else if (otherHand.value.equals("ROCK")) {
            return -1;
        }
        return 0;
    }),
    PAPER("PAPER", (otherHand) -> {
        if (otherHand.value.equals("ROCK")) {
            return 1;
        } else if (otherHand.value.equals("SCISSORS")) {
            return -1;
        }
        return 0;
    }),
    ROCK("ROCK", (otherHand) -> {
        if (otherHand.value.equals("SCISSORS")) {
            return 1;
        } else if (otherHand.value.equals("PAPER")) {
            return -1;
        }
        return 0;
    });

    private final String value;
    private final Function<Hand, Integer> versus;

    Hand(String value, Function<Hand, Integer> versus) {
        this.value = value;
        this.versus = versus;
    }

    public int versus(Hand otherHand) {
        return this.versus.apply(otherHand);
    }
}
```

### 2.2. RPSGame 클래스 
- 플레이어끼리 경기를 겨뤄 결과를 확인합니다.
    - 결과가 1인 경우 `PLAYER1`이 승리자입니다. 
    - 결과가 -1인 경우 `PLAYER2`가 승리자입니다. 
    - 결과가 0인 경우 무승부입니다.
- 앞으로 `Hand` 객체에 도마뱀과 스팍이 추가되어도 핵심 로직인 `play` 메소드에 변화는 없습니다.

```java
package action.in.blog.rps;

public class RpsGame {
    public static String play(Hand player1, Hand player2) {
        int result = player1.versus(player2);
        if (result == 1) {
            return "PLAYER1";
        } else if (result == -1) {
            return "PLAYER2";
        }
        return "DRAW";
    }
}
```

##### 변경된 클래스 다이어그램

<p align="left">
    <img src="/images/refactoring-rps-game-4.JPG" width="35%" class="image__border">
</p>

## 3. 더 나아가 전략 패턴 적용하기

코드는 변경하지 않는 것이 가장 안전합니다. 
리팩토링으로 `RPSGame` 클래스의 `play` 메소드 변경에 대한 위험은 줄였습니다. 
그런데, 이번엔 `Hand enum` 클래스가 문제입니다. 
앞으로 어떤 객체가 추가되거나 삭제되면 `Hand enum` 클래스에 많은 변경이 있을 것 같습니다. 
더 안정적인 게임 확장을 원하는 개발자는 전략 패턴을 적용하기로 합니다. 

### 3.1. RpsStrategy 인터페이스
- 가위, 바위, 보 전략에 대한 인터페이스입니다.

```java
package action.in.blog.rps.strategy;

import action.in.blog.rps.Hand;

public interface RpsStrategy {

    int versus(Hand otherHand);
}
```

### 3.2. 각 전략 클래스들

##### NormalPaperStrategy 클래스
- 자신이 보자기일 때 경우의 수를 결정합니다.

```java
package action.in.blog.rps.strategy.impl;

import action.in.blog.rps.Hand;
import action.in.blog.rps.strategy.RpsStrategy;

public class NormalPaperStrategy implements RpsStrategy {

    @Override
    public int versus(Hand otherHand) {
        if (otherHand.equals(Hand.ROCK)) {
            return 1;
        } else if (otherHand.equals(Hand.SCISSORS)) {
            return -1;
        }
        return 0;
    }
}
```

##### NormalRockStrategy 클래스
- 자신이 바위일 때 경우의 수를 결정합니다.

```java
package action.in.blog.rps.strategy.impl;

import action.in.blog.rps.Hand;
import action.in.blog.rps.strategy.RpsStrategy;

public class NormalRockStrategy implements RpsStrategy {

    @Override
    public int versus(Hand otherHand) {
        if (otherHand.equals(Hand.SCISSORS)) {
            return 1;
        } else if (otherHand.equals(Hand.PAPER)) {
            return -1;
        }
        return 0;
    }
}
```

##### NormalScissorsStrategy 클래스
- 자신이 가위일 때 경우의 수를 결정합니다.

```java
package action.in.blog.rps.strategy.impl;

import action.in.blog.rps.Hand;
import action.in.blog.rps.strategy.RpsStrategy;

public class NormalScissorsStrategy implements RpsStrategy {

    @Override
    public int versus(Hand otherHand) {
        if (otherHand.equals(Hand.PAPER)) {
            return 1;
        } else if (otherHand.equals(Hand.ROCK)) {
            return -1;
        }
        return 0;
    }
}
```

### 3.3. Hand enum 클래스
- 각 객체 별로 자신에게 맞는 전략 클래스를 매칭합니다.
- 도마뱀, 스팍이 추가되더라도 적당한 전략 클래스를 만들어 기능을 확장합니다.

```java
package action.in.blog.rps;

import action.in.blog.rps.strategy.RpsStrategy;
import action.in.blog.rps.strategy.impl.NormalPaperStrategy;
import action.in.blog.rps.strategy.impl.NormalRockStrategy;
import action.in.blog.rps.strategy.impl.NormalScissorsStrategy;

public enum Hand {

    SCISSORS(new NormalScissorsStrategy()),
    PAPER(new NormalPaperStrategy()),
    ROCK(new NormalRockStrategy());

//    SCISSORS(new ExtendedScissorsStrategy()),
//    PAPER(new ExtendedPaperStrategy()),
//    ROCK(new ExtendedRockStrategy()),
//    LIZARD(new ExtendedLizardStrategy()),
//    SPOCK(new ExtendedSpockStrategy());

    private final RpsStrategy strategy;

    Hand(RpsStrategy strategy) {
        this.strategy = strategy;
    }

    public int versus(Hand otherHand) {
        return strategy.versus(otherHand);
    }
}
```

##### 최종 클래스 다이어그램

<p align="center">
    <img src="/images/refactoring-rps-game-5.JPG" width="90%" class="image__border">
</p>

## CLOSING

추가될 기능을 고려하고, 개방 폐쇄 원칙(OCP, Open-Close-Principal)을 만족하기 위한 많은 리팩토링 작업이 있었습니다. 
그럼에도 불구하고 개발자는 이에 대한 두려움이 없습니다. 
이미 기본 시나리오가 정상적으로 동작할 수 있는지 확인 가능한 테스트 코드들이 있기 때문입니다. 

##### 테스트 코드 성공

<p align="left">
    <img src="/images/refactoring-rps-game-6.JPG" width="65%" class="image__border">
</p>

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-03-14-refactoring-rps-game>

[strategy-pattern-link]: https://junhyunny.github.io/information/design-pattern/strategy-pattern/