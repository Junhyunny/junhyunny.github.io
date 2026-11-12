---
title: "전략 패턴(Strategy Pattern)"
publishedAt: "2022-03-01"
updatedAt: "2026-11-12T16:26:00+09:00"
canonicalPath: "/information/design-pattern/strategy-pattern/"
categories:
  - "information"
  - "design-pattern"
summary: "무기에 따라 공격 모션이 달라지는 게임 캐릭터 예제로 전략 패턴을 적용해보고, 장단점과 스프링 SecurityContextHolder 클래스에 적용된 사례를 정리했다."
recommendedPosts:
  - title: "Refactoring RPS(Rock, Paper, Scissors) Game"
    href: "https://junhyunny.github.io/java/design-pattern/test-driven-development/refactoring-rps-game/"
---

## 1. 전략 패턴(Strategy Pattern)

> Design Patterns: Elements of Reusable Object Oriented Software<br/>
> 동일 계열의 알고리즘군을 정의하고, 각 알고리즘을 캡슐화하며, 이들을 상호교환이 가능하도록 만듭니다.
> 알고리즘을 사용하는 클라이언트와 상관없이 독립적으로 알고리즘을 다양하게 변경할 수 있게 합니다.

`GoF 디자인 패턴`의 내용은 역시 심오하다. 필자가 얻은 인사이트(insight)를 바탕으로 내용을 풀어 설명해 보려 한다. 전략 패턴은 인터페이스를 통한 다형성(polymorphism)을 이용한 패턴이다. `if-else`, `switch-case` 구문으로 나뉜 로직들을 클래스로 나누고, 이 클래스들이 제공하는 알고리즘(혹은 비즈니스 로직)을 추상화하는 인터페이스를 만든다.

전략 패턴을 이해하려면 패턴을 이루는 몇 가지 요소를 이해해야 한다. 전략 패턴의 클래스 다이어그램을 이루는 요소는 다음과 같다.

- 컨텍스트(Context)
  - 실제로 전략 인터페이스의 구현체를 사용하는 클래스이다.
  - 전략 인터페이스 구현체와 집합 관계(aggregation)이므로 객체를 외부로부터 전달받는다.
- 전략 인터페이스(Strategy Interface)
  - 전략(혹은 알고리즘) 기능을 명시한 인터페이스이다.
- 구체적 전략 클래스들(ConcreteStrategies)
  - 전략 인터페이스를 구현(implement)했다.
  - 각자 고유한 전략을 구현한 클래스들이다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/strategy-pattern-01.png" width="50%" class="image__border">
</div>
<center>https://copynull.tistory.com/125</center>

## 2. 전략 패턴 적용하기

이해를 돕기 위해 간단한 예시 코드를 작성해 봤다. 전략 패턴을 적용할 시나리오는 다음과 같다.

- 현재 운영 중인 게임의 캐릭터는 손에 쥔 무기에 따라 휘두르는 모션이 달라진다.
- 게임 초창기에는 맨손, 나이프, 장검이 있었는데, 최근 대규모 업데이트로 무기 5개가 추가될 예정이다.
- 계속되는 업데이트로 무기가 추가될 때마다 `GameCharacter` 클래스의 `attack` 메서드를 수정하고 싶지 않다.

`Character` 클래스는 게임 캐릭터를 표현한 객체이며 `attack` 메서드로 공격을 수행한다.

### 2.1. 기존 레거시 코드 살펴보기

Character 클래스는 전략 패턴에서 컨텍스트 역할을 수행한다. `attack` 메서드는 쥐고 있는 무기 타입에 따라 다른 모션으로 공격한다. 실제로는 10~20줄 정도 되는 코드를 간단한 로그로 표현했다.

```java
package action.in.blog;

public class GameCharacter {

    // ... some fields to describe character attributes

    private String weaponType;

    public void setWeaponType(String weaponType) {
        this.weaponType = weaponType;
    }

    public void attack() {
        switch (weaponType == null ? "NULL" : weaponType) {
            case "KNIFE":
                // 10 code lines to stab motion
                System.out.println("stab with a knife");
                break;
            case "SWORD":
                // 20 code lines to stab motion
                System.out.println("brandish a sword");
                break;
            default:
                // 5 code lines to punch
                System.out.println("punch");
        }
    }
}
```

### 2.2. 공격 전략 추상화 및 구현 클래스 만들기

AttackStrategy 인터페이스는 전략 패턴에서 전략 인터페이스를 담당하며, 공격 기능을 추상화했다. 파라미터로 캐릭터를 넘겨준 이유는 전략마다 필요한 캐릭터의 정보가 다를 수 있기 때문이다.

예를 들어 캐릭터가 남성인지 여성인지에 따라 공격 모션이 달라진다고 가정해 보자. 나이프는 가벼워서 성별에 따른 공격 모션의 차이가 없으므로 나이프 공격 전략은 캐릭터의 성별 정보를 사용하지 않는다. 반면 장검은 무겁기 때문에 남성은 한 손으로 공격할 수 있지만, 여성은 두 손으로 공격 모션을 취한다. 그래서 장검 공격 전략은 캐릭터의 성별 정보가 필요하다. 이처럼 전략별로 필요한 데이터가 다르면 추상화가 어려우므로 `GameCharacter` 인스턴스를 통째로 전달한다.

```java
package action.in.blog.attack;

import action.in.blog.GameCharacter;

public interface AttackStrategy {

    void attack(GameCharacter gameCharacter);
}
```

KnifeAttackStrategy 클래스는 나이프로 공격하는 기능을 구현한다.

```java
package action.in.blog.attack.concrete;

import action.in.blog.GameCharacter;
import action.in.blog.attack.AttackStrategy;

public class KnifeAttackStrategy implements AttackStrategy {

    @Override
    public void attack(GameCharacter gameCharacter) {
        // 10 code lines to stab motion
        System.out.println("stab with a knife");
    }
}
```

SwordAttackStrategy 클래스는 장검으로 공격하는 기능을 구현한다.

```java
package action.in.blog.attack.concrete;

import action.in.blog.GameCharacter;
import action.in.blog.attack.AttackStrategy;

public class SwordAttackStrategy implements AttackStrategy {

    @Override
    public void attack(GameCharacter gameCharacter) {
        // 20 code lines to stab motion
        System.out.println("brandish a sword");
    }
}
```

DefaultAttackStrategy 클래스는 펀치로 공격하는 기능을 구현한다.

```java
package action.in.blog.attack.concrete;

import action.in.blog.GameCharacter;
import action.in.blog.attack.AttackStrategy;

public class DefaultAttackStrategy implements AttackStrategy {

    @Override
    public void attack(GameCharacter gameCharacter) {
        // 5 code lines to punch
        System.out.println("punch");
    }
}
```

### 2.3. 캐릭터 클래스 리팩토링

리팩토링한 캐릭터 클래스는 무기 공격 전략을 외부로부터 전달받는다. 무기 공격 전략이 없으면 기본 공격으로 주먹 공격을 수행하고, 무기 공격 전략이 있으면 그 전략에 맞는 무기 공격 모션을 수행한다.

```java
package action.in.blog;

import action.in.blog.attack.AttackStrategy;
import action.in.blog.attack.concrete.DefaultAttackStrategy;

public class GameCharacter {

    // ... some fields to describe character attributes

    private final AttackStrategy defaultAttackStrategy = new DefaultAttackStrategy();

    private AttackStrategy weaponAttackStrategy;

    public void setWeaponAttackStrategy(AttackStrategy weaponAttackStrategy) {
        this.weaponAttackStrategy = weaponAttackStrategy;
    }

    public void attack() {
        if (weaponAttackStrategy == null) {
            defaultAttackStrategy.attack(this);
            return;
        }
        weaponAttackStrategy.attack(this);
    }
}
```

변경된 클래스 다이어그램은 다음과 같다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/strategy-pattern-02.png" width="100%" class="image__border">
</div>

### 2.4. 캐릭터 클래스 사용하기

무기와 무기 전략을 관리하기 위해 `WeaponType` enum 클래스를 만들었다. 무기 종류로 무기 전략을 얻을 수 있다.

`weaponPickUpEventHandler` 메서드는 게임 사용자가 일으킨 이벤트를 처리하는 메서드라고 가정했다. 게임 사용자가 무기를 주우면 무기 타입에 해당하는 문자열이 전달된다. 이 문자열로 `WeaponType`에서 적절한 공격 전략을 찾아 매칭한다.

```java
package action.in.blog;

import action.in.blog.attack.AttackStrategy;
import action.in.blog.attack.concrete.KnifeAttackStrategy;
import action.in.blog.attack.concrete.SwordAttackStrategy;

// enum for management relationship between weapon and strategy
enum WeaponType {

    KNIFE(new KnifeAttackStrategy()),
    SWORD(new SwordAttackStrategy());

    private final AttackStrategy attackStrategy;

    WeaponType(AttackStrategy attackStrategy) {
        this.attackStrategy = attackStrategy;
    }

    public AttackStrategy getAttackStrategy() {
        return attackStrategy;
    }
}

public class GameCharacterUsage {

    static GameCharacter gameCharacter = new GameCharacter();

    public static void weaponPickUpEventHandler(String type) {

        // legacy code
        // gameCharacter.setWeaponType(type);

        // new code
        AttackStrategy attackStrategy = null;
        try {
            WeaponType weaponType = WeaponType.valueOf(type);
            attackStrategy = weaponType.getAttackStrategy();
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
        gameCharacter.setWeaponAttackStrategy(attackStrategy);
    }

    public static void main(String[] args) {

        weaponPickUpEventHandler("KNIFE");
        gameCharacter.attack();

        weaponPickUpEventHandler("SWORD");
        gameCharacter.attack();

        weaponPickUpEventHandler(null);
        gameCharacter.attack();
    }
}
```

## 3. 전략 패턴 장점과 단점

### 3.1. 장점

전략(무기) 종류가 늘어나더라도 컨텍스트(캐릭터) 클래스의 코드는 바꾸지 않고 전략 클래스만 새로 추가하면 된다. 즉, 전략 패턴은 확장에는 열려 있고 수정에는 닫혀 있어야 한다는 개방-폐쇄 원칙(OCP, Open-Closed Principle)을 준수한다. 또한 조건문이 많은 경우 알고리즘들을 캡슐화해 조건문을 없앨 수 있다.

### 3.2. 단점

알고리즘이 몇 개 없고 추가될 가능성도 없다면 전략 패턴을 적용할지 고민해야 한다. 단순한 `if-else`, `switch-case` 구문에 비해 전반적인 기능을 파악하기 어렵기 때문이다.

또한 전략 객체와 컨텍스트 객체 사이에 의사소통의 오버헤드가 발생한다. 모든 전략 객체가 같은 데이터를 필요로 하지는 않는데, 전략 알고리즘 기능을 하나의 메서드로 추상화하면서 어떤 전략 객체는 불필요한 데이터를 떠안을 수 있다. 이 문제를 해결하기 위해 위 예시에서는 공격 전략 인스턴스에 `GameCharacter` 인스턴스를 전달했다. 각 전략 객체는 자신에게 필요한 정보만 `GameCharacter` 인스턴스에서 꺼내 사용할 수 있지만, 그 대신 `GameCharacter` 클래스에 대한 의존성이 생긴다. 데이터 전달을 위한 인터페이스와 클래스를 따로 만들면 오버헤드와 결합도를 줄일 수 있을 것으로 보인다.

## 4. Strategy pattern in Spring

`Spring` 프레임워크에서 전략 패턴이 적용된 사례를 찾아봤다.

SecurityContextHolder 클래스는 전략 패턴에서 컨텍스트 클래스에 해당한다. 시스템 설정 값(`System.getProperty("spring.security.strategy")`)으로 컨텍스트 홀드(hold) 전략을 결정하고, `initializeStrategy` 메서드에서 전략 객체를 생성한다. 전략 인터페이스에 해당하는 것은 `SecurityContextHolderStrategy` 인터페이스이며, 전략 구현 클래스들은 다음과 같다.

- `ThreadLocalSecurityContextHolderStrategy` 클래스
- `InheritableThreadLocalSecurityContextHolderStrategy` 클래스
- `GlobalSecurityContextHolderStrategy` 클래스

```java
package org.springframework.security.core.context;

import java.lang.reflect.Constructor;
import org.springframework.util.Assert;
import org.springframework.util.ReflectionUtils;
import org.springframework.util.StringUtils;

public class SecurityContextHolder {
    public static final String MODE_THREADLOCAL = "MODE_THREADLOCAL";
    public static final String MODE_INHERITABLETHREADLOCAL = "MODE_INHERITABLETHREADLOCAL";
    public static final String MODE_GLOBAL = "MODE_GLOBAL";
    private static final String MODE_PRE_INITIALIZED = "MODE_PRE_INITIALIZED";
    public static final String SYSTEM_PROPERTY = "spring.security.strategy";
    private static String strategyName = System.getProperty("spring.security.strategy");
    private static SecurityContextHolderStrategy strategy;
    private static int initializeCount = 0;

    public SecurityContextHolder() {
    }

    private static void initialize() {
        initializeStrategy();
        ++initializeCount;
    }

    private static void initializeStrategy() {
        if ("MODE_PRE_INITIALIZED".equals(strategyName)) {
            Assert.state(strategy != null, "When using MODE_PRE_INITIALIZED, setContextHolderStrategy must be called with the fully constructed strategy");
        } else {
            if (!StringUtils.hasText(strategyName)) {
                strategyName = "MODE_THREADLOCAL";
            }
            if (strategyName.equals("MODE_THREADLOCAL")) {
                strategy = new ThreadLocalSecurityContextHolderStrategy();
            } else if (strategyName.equals("MODE_INHERITABLETHREADLOCAL")) {
                strategy = new InheritableThreadLocalSecurityContextHolderStrategy();
            } else if (strategyName.equals("MODE_GLOBAL")) {
                strategy = new GlobalSecurityContextHolderStrategy();
            } else {
                try {
                    Class<?> clazz = Class.forName(strategyName);
                    Constructor<?> customStrategy = clazz.getConstructor();
                    strategy = (SecurityContextHolderStrategy)customStrategy.newInstance();
                } catch (Exception var2) {
                    ReflectionUtils.handleReflectionException(var2);
                }
            }
        }
    }

    public static void clearContext() {
        strategy.clearContext();
    }

    public static SecurityContext getContext() {
        return strategy.getContext();
    }

    public static int getInitializeCount() {
        return initializeCount;
    }

    public static void setContext(SecurityContext context) {
        strategy.setContext(context);
    }

    public static void setStrategyName(String strategyName) {
        SecurityContextHolder.strategyName = strategyName;
        initialize();
    }

    public static void setContextHolderStrategy(SecurityContextHolderStrategy strategy) {
        Assert.notNull(strategy, "securityContextHolderStrategy cannot be null");
        strategyName = "MODE_PRE_INITIALIZED";
        SecurityContextHolder.strategy = strategy;
        initialize();
    }

    public static SecurityContextHolderStrategy getContextHolderStrategy() {
        return strategy;
    }

    public static SecurityContext createEmptyContext() {
        return strategy.createEmptyContext();
    }

    public String toString() {
        return "SecurityContextHolder[strategy='" + strategy.getClass().getSimpleName() + "'; initializeCount=" + initializeCount + "]";
    }

    static {
        initialize();
    }
}
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-03-01-strategy-pattern>

#### REFERENCE

- [Design Patterns: Elements of Reusable Object Oriented Software][design-pattern-book-link]
- <https://stackoverflow.com/questions/1673841/examples-of-gof-design-patterns-in-javas-core-libraries/2707195#2707195>
- <https://joel-dev.site/75>
- <https://victorydntmd.tistory.com/292>
- <https://steady-coding.tistory.com/381>

[design-pattern-book-link]: https://www.kyobobook.co.kr/product/detailViewKor.laf?mallGb=KOR&ejkGb=KOR&barcode=9791195444953
