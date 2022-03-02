---
title: "Strategy Pattern"
search: false
category:
  - information
  - design-pattern
last_modified_at: 2022-03-01T23:55:00
---

<br>

## 1. 전략 패턴(Strategy Pattern)

> Design Patterns: Elements of Reusable Object Oriented Software<br>
> 동일 계열의 알고리즘군을 정의하고, 각 알고리즘을 캡슐화하며, 이들을 상호교환이 가능하도록 만듭니다. 
> 알고리즘을 사용하는 클라이언트와 상관없이 독립적으로 알고리즘을 다양하게 변경할 수 있게 합니다.

`GoF 디자인 패턴` 내용은 역시 심오합니다. 
제가 얻은 인사이트(insight)를 바탕으로 내용을 풀어 설명해보겠습니다. 
- 전략 패턴은 인터페이스를 통한 다형성(polymorphism)을 이용한 패턴입니다.
- `if-else`, `switch-case` 구문으로 나뉜 로직들을 클래스로 나눕니다.
- 클래스들이 제공하는 알고리즘(혹은 비즈니스 로직)을 추상화하는 인터페이스를 만듭니다.

##### 전략 패턴 클래스 다이어그램
- 전략 패턴을 이해하기 위해선 패턴을 이루는 몇 가지 요소들에 대해 이해할 필요가 있습니다. 
- 컨텍스트(Context)
    - 실제 전략 인터페이스의 구현체를 사용하는 클래스입니다. 
    - 전략 인터페이스 구현체와 집합 관계이므로 객체를 외부로부터 전달받습니다.(집합 관계, aggregation)
- 전략 인터페이스(Strategy Interface) 
    - 전략(혹은 알고리즘) 기능을 명시한 인터페이스입니다.
- 구체적 전략 클래스들(ConcreteStrategies)
    - 전략 인터페이스를 구현하였습니다.(implement)
    - 각자 고유한 전략을 구현한 클래스들입니다. 

<p align="center">
    <img src="/images/strategy-pattern-01.JPG" width="50%" class="image__border">
</p>
<center>https://copynull.tistory.com/125</center>

## 2. 전략 패턴 적용하기

이해도를 높히고자 간단한 예시 코드를 작성해보았습니다. 
전략 패턴을 적용하기 위한 시나리오는 다음과 같습니다.
- 현재 운영 중인 게임의 케릭터는 손에 쥔 무기에 따라 휘두르는 모션이 달라집니다.
- 게임 초창기에는 맨손, 나이프 그리고 장검이 있었는데, 최근 대규모 업데이트로 무기 5개가 추가 예정입니다. 
- 지속되는 업데이트로 무기가 추가될 때마다 `GameCharacter` 클래스의 `attack` 메소드를 수정하고 싶지 않습니다.
- `Charater` 클래스
    - 전략 패턴에서 컨텍스트 역할을 수행합니다.
    - 게임 케릭터를 표현한 객체이며 `attack` 메소드를 통해 공격을 수행합니다.

### 2.1. 기존 레거시 코드 살펴보기

#### 2.1.1. Charater 클래스
- 전략 패턴에서 컨텍스트 역할을 수행합니다.
- `attack` 메소드
    - 쥐고 있는 무기 타입에 따라 다른 모션으로 공격을 수행합니다.
    - 10~20 줄의 코드를 간단한 로그로 표현하였습니다.

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

#### 2.2.1. AttackStrategy 인터페이스
- 전략 패턴에서 전략 인터페이스를 담당합니다.
- 공격 기능을 추상화하였습니다.
- 파리미터로 캐릭터를 넘겨준 이유는 각각의 전략마다 필요한 캐릭터의 정보가 다를 수 있기 때문입니다.
    - 예를 들어, 캐릭터가 남성인지 여성인지에 따라 공격 모션이 달라지는 경우가 있다고 가정해보겠습니다.
    - 나이프는 가벼워서 공격시 공격 모션에 차이가 없습니다.
    - 나이프 공격 전략에서 캐릭터의 성별 정보는 사용하지 않습니다.
    - 장검은 무겁기 때문에 남성은 한손으로 공격이 가능하지만, 여성은 두손으로 공격 모션을 취합니다.
    - 장검 공격 전략은 캐릭터의 성별 정보가 필요합니다.
- 전략 별로 필요한 데이터가 다르면 추상화가 어려우므로 `GameCharacter` 인스턴스를 전달합니다. 

```java
package action.in.blog.attack;

import action.in.blog.GameCharacter;

public interface AttackStrategy {

    void attack(GameCharacter gameCharacter);
}
```

#### 2.2.1. KnifeAttackStrategy 클래스
- 나이프로 공격하는 기능을 구현합니다.

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

#### 2.2.2. SwordAttackStrategy 클래스
- 장검으로 공격하는 기능을 구현합니다.

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

#### 2.2.3. DefaultAttackStrategy 클래스
- 펀치로 공격하는 기능을 구현합니다.

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
- 무기 공격 전략을 외부로부터 전달받습니다.
- 무기 공격 전략이 없는 경우 기본 공격으로 주먹 공격을 수행합니다.
- 무기 공격 전략이 있는 경우 자신에 맞는 무기 공격 모션을 수행합니다.

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

##### 변경된 클래스 다이어그램

<p align="center">
    <img src="/images/strategy-pattern-02.JPG" width="80%" class="image__border">
</p>

### 2.4. 캐릭터 클래스 사용하기
- `WeaponType` enum
    - 무기와 무기 전략을 관리하기 위한 enum 클래스를 만들었습니다.
    - 무기 종류를 통해 무기 전략을 얻을 수 있습니다.
- `weaponPickUpEventHandler` 메소드
    - 게임 사용자에 의한 이벤트를 처리하는 메소드라고 가정하였습니다.
    - 게임 사용자가 무기를 줍는 경우 무기 타입에 해당하는 문자열이 전달됩니다.
    - 무기 타입 문자열로 `WeaponType`에서 적절한 공격 전략을 찾아 매칭합니다. 

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
- 전략(무기) 종류가 확장되더라도 컨텍스트(케릭터) 클래스의 코드 변경없이, 전략 클래스만 새롭게 추가됩니다.
- 전략 패턴은 개방-폐쇄 원칙(OCP, Open-Closed Principle)을 준수합니다.
    - 확장에 대해 열려있고, 수정에 대해서 닫혀 있어야 합니다.
- 조건문이 많은 경우 알고리즘들을 캡슐화하여 이를 없앨 수 있습니다. 

### 3.2. 단점
- 알고리즘이 몇 개 없고, 추가될 가능성이 없다면 전략 패턴 적용은 고민이 필요합니다.
    - 단순한 `if-else`, `switch-case` 구문에 비해 전반적인 기능을 파악하기 어렵습니다.
- 전략 객체와 컨텍스트 객체 사이에 의사소통의 오버헤드가 발생합니다.
    - 모든 전략 객체가 동일한 데이터를 필요로하지 않습니다.
    - 전략 알고리즘 기능들을 하나의 메소드로 추상화시키면서 어떤 전략 객체는 불필요한 데이터를 떠안을 수 있습니다.
    - 이 문제를 해결하기 위해 위 예시에서는 공격 전략 인스턴스에게 `GameCharacter` 인스턴스를 전달하였습니다. 
    - 각 전략 객체 입장에선 자신이 필요한 정보만 `GameCharacter` 인스턴스로부터 꺼내 사용할 수 있습니다. 
    - 이로 인해 전략 객체 입장에선 `GameCharacter` 클래스에 대한 의존성이 발생합니다.
    - 별도로 데이터 전달을 위한 인터페이스와 클래스를 만들면 오버헤드와 결합도를 줄일 수 있을 것으로 보입니다. 

## 4. Strategy pattern in Spring

`Spring` 프레임워크에서 어댑터 패턴이 적용된 케이스를 찾아보았습니다. 

### 4.1. SecurityContextHolder 클래스
- `SecurityContextHolder` 클래스는 전략 패턴에서 컨텍스트 클래스에 해당합니다.
- 시스템 설정 값을 통해 컨텍스트 홀드(hold) 전략을 결정합니다.
    - `System.getProperty("spring.security.strategy")`
- 컨텍스트 홀드 전략 객체를 생성합니다.
    - `initializeStrategy` 메소드
- `SecurityContextHolderStrategy` 인터페이스는 전략 패턴에서 전략 인터페이스에 해당합니다.
- 전략 구현 클레스들은 아래와 같습니다.
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