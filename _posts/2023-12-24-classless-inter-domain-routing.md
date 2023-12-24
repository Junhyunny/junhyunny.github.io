---
title: "CIDR(Classless Inter-Domain Routing) Converter"
search: false
category:
  - information
  - react
  - jest
  - test-driven-development
last_modified_at: 2023-12-24T23:55:00
---

<br/>

## 0. 들어가면서

최근까지 CIDR(Classless Inter-Domain Routing)은 네트워크 방화벽 기준을 정의할 때 많이 사용하는 IP 표기 방법 정도로만 알고 있었다. 정확한 개념은 몰랐지만, 여태 경험한 프로젝트들은 개발, 스테이징(staging) 환경에서나 IP 대역을 제한했기 때문에 정확한 메커니즘을 몰라도 상관 없었다. 이번에 CIDR 방식으로 표현된 IP 주소를 일반적인 IP 주소 범위로 변환하는 기능을 개발하면서 제대로 이해하기 위해 대학교 시절 전공 서적을 다시 펼쳤다. 공부한 내용을 공유하고 구현한 코드와 설명도 함께 첨부한다. 

### 1. CIDR(Classless Inter-Domain Routing)

CIDR(Classless Inter-Domain Routing)을 직역하면 "클래스 없는 도메인 간 라우팅"이다. 클래스라는 개념을 없앤 라우팅 방법이라는 것을 이름을 통해 유추할 수 있다. 클래스 기반 주소 지정(classful addressing) 방식의 어떤 문제를 해결하고 싶어서 CIDR 개념이 등장했는지 먼저 살펴보자. 

### 1.1. Classful Addressing

클래스 기반 주소 지정 방식은 인터넷이 시작할 당시에 IPv4 주소를 나눠 가지는 방법이었다. IPv4 주소는 32개 비트로 표현된다. 주소를 할당할 수 있는 최대 수는 4,294,967,296개이다. 약 43억개의 한정된 자원을 기관이나 개인이 나눠 사용하기 위한 방법이다. 모두 5개의 클래스로 나뉜다. 

- A 클래스
- B 클래스
- C 클래스
- D 클래스
- E 클래스

규칙은 단순한다. 접두사 비트를 통해 네트워크를 표현하고, 접미사 비트를 통해 각 네트워크 별로 가질 수 있는 호스트 주소를 표현한다. 어떤 의미인지 정확히 감이 안 올 수 있지만, 각 클래스의 특징을 하나씩 살펴보면 어떤 컨셉인지 이해할 수 있다. 각 클래스 별 특징들을 살펴보자. 

A 클래스는 32개 비트 중 앞에 8개 비트를 네트워크 주소로 사용하는 방식이다. 맨 첫 번째 비트는 0으로 고정되기 때문에 `0.0.0.0`에서 `127.255.255.255`까지 주소는 A 클래스 주소이다. 128개 기관이 16,581,375개씩 IPv4 주소를 나눠 가진다. IP 주소 자원의 50%에 해당한다.

B 클래스는 앞에 16개 비트를 네트워크 주소로 사용하는 방식이다. 앞 두 비트는 10로 고정이다. `128.0.0.0`에서 `191.255.255.255`까지 주소가 해당된다. 16,384개 기관이 65,025개씩 IP 주소를 나눠 가진다. IP 주소 자원의 25%에 해당한다.

C 클래스는 앞에 24개 비트를 네트워크 주소로 사용하는 방식이다. 앞 세 비트는 110으로 고정이다. `192.0.0.0`에서 `223.255.255.255`까지 주소가 해당된다. 2,097,152개 기관이 255개씩 IP 주소를 나눠가진다. 전체 자원 중 12.5%에 해당한다.

D 클래스는 네트워크 주소나 호스트 주소가 없이 멀티 캐스트 주소로 사용한다. 앞 네 비트는 1110으로 고정이다. `224.0.0.0`에서 `239.255.255.255`까지 주소가 해당된다. 전체 자원 중 6.25%에 해당한다.

E 클래스도 마찬가지로 접두사와 접미사는 별도로 없다. 앞 네 비트가 1111으로 고정이며 예약된 주소이다. `240.0.0.0`에서 `255.255.255.255`까지 주소가 해당된다. 전체 자원 중 6.25%에 해당한다.

<p align="center">
  <img src="/images/classless-inter-domain-routing-01.png" width="80%" class="image__border">
</p>
<center>Data Communication and Networking 5th</center>  

### 1.2. Classless Inter-Domain Routing

클래스 기반 방식은 자원 할당이 고르게 되지 않아 주소가 낭비된다. A 클래스 주소는 128개 기관이 각자 16,581,375개씩 IP 주소를 나눠가진다. 1,600만 개씩이나 IP가 필요한 기관이 128개씩이나 있을까? 규모가 작은 기관이 규모가 큰 클래스 주소를 할당받는다면 대부분의 자원은 낭비되는 모양일 것이다. 자원 낭비는 고갈로 이어진다. A, B 클래스와 반대로 C 클래스는 한 조직에 사용할 수 있는 IP 개수가 255개로 제한되기 때문에 너무 적은 것이 문제였다. 비효율적인 자원 할당 문제를 해결하기 위해 서브네팅(subnetting), 수퍼네팅(supernetting) 방식이 고안되었지만, IP 주소 재분배이나 패킷 라우팅이 어려웠기 때문에 이 문제를 해결할 수 없었다고 한다.

클래스 없는 주소 지정(classless addressing)은 IP 자원이 유연하게 나뉘지 못하는 근본적인 원인인 클래스를 제거한 방식이다. 클래스 기반 방식과 큰 차이점은 접두사 비트가 고정이 아니라는 점이다. 접두사 길이를 0에서 32사이 값을 유연하게 결정하여 조직이나 기관에서 필요한 IP 주소 개수만큼 할당 받을 수 있게 되었다. 클래스 없는 주소 지정 방식은 접두사 길이가 중요하기 때문에 IP 주소 옆에 접두사 비트를 슬래시(/)로 구분하여 표시한다. 이를 `CIDR 표기법`이라고 한다. 

- 접두사(prefix) 비트 길이는 0 ~ 32까지 값을 가진다.

<p align="center">
  <img src="/images/classless-inter-domain-routing-02.png" width="80%" class="image__border">
</p>
<center>Data Communication and Networking 5th</center>  

## 2. Convert CIDR

요약하자면 고정된 비트 수로 네트워크 자원을 나누는 클래스 기반 방법은 비효율적이기 때문에 가변 비트 수로 네트워크 자원을 나누는 클래스 없는 주소 지정 방식이 등장했고, 가변 접두사 비트로 네트워크 자원이 나눠진 것을 표기한 방법이 CIDR이다. 이 글을 작성하게 된 계기는 CIDR 표기법을 서비스 사용자가 이해할 수 있는 IP 주소 영역(from, to)으로 변경하는 기능을 개발해야 됬기 때문이다. 코드를 작성하기 전 비즈니스 로직이 되어줄 변환 과정을 살펴보자.

먼저 `X.X.X.X/n`으로 CIDR 표현법에서 `n`의 의미를 알아본다. `n`은 접두사 비트 길이를 의미한다. `n=24`인 케이스를 예로 들어본다. IP 주소 앞에서부터 1이 채워진 길이가 24라는 의미이다. `11111111.11111111.11111111.00000000(255.255.255.0)`을 마스크로 사용한다. 

접두사 길이로 마스크를 정의하는 방법에 대해 살펴봤으니 `167.199.170.82/27`를 기준으로 주소 변환 예시를 살펴본다. `167.199.170.82` 주소를 이진수로 표현하면 다음과 같다.

```
10100111.11000111.10101010.01010010
```

`/27` 접두사 비트 길이를 마스크로 표현하면 다음과 같다.

```
11111111.11111111.11111111.11100000
```

IP 주소와 마스크를 &(AND 연산자)로 비트 마스킹(bit masking)하면 시작 주소가 된다.

```
10100111.11000111.10101010.01010010
                 &
11111111.11111111.11111111.11100000
                 =
10100111.11000111.10101010.01000000(167.199.170.64)
```

마지막 주소는 시작 주소에서 접두사 길이 이후 비트들을 1로 채우면 된다.

```
10100111.11000111.10101010.01000000(167.199.170.64)
                 |
00000000.00000000.00000000.00011111
                 =
10100111.11000111.10101010.01011111(167.199.170.95)
```

`167.199.170.82/27`의 IP 주소 범위는 `167.199.170.64`에서 `167.199.170.95`까지 32개다. 마스크에서 0으로 채워진 부분이 와일드 카드 영역이다. 이 영역으로 표현 가능한 숫자가 사용 가능한 IP 주소 개수가 된다. 예를 들면 다음과 같다.

- /32 
    - 11111111.11111111.11111111.11111111
    - 2^(32-32) = 2^0 = 1
    - 사용 가능한 IP 주소 1개
- /31
    - 11111111.11111111.11111111.11111110
    - 2^(32-31) = 2^1 = 2
    - 사용 가능한 IP 주소 1개
- /30
    - 11111111.11111111.11111111.11111100
    - 2^(32-30) = 2^2 = 4
    - 사용 가능한 IP 주소 4개
- /16
    - 11111111.11111111.00000000.00000000
    - 2^(32-16) = 2^16 = 65,536
    - 사용 가능한 IP 주소 65,536개
- /0
    - 00000000.00000000.00000000.00000000
    - 2^(32-0) = 2^32 = 4,294,967,296
    - 사용 가능한 IP 주소 4,294,967,296개
    - 모든 IPv4 주소

## 3. Implementation

지금부터 구현 코드를 살펴본다. 이 기능을 개발할 때 변환하는 코드를 인터넷에서 쉽게 찾을 수 있을 줄 알았는데, 변환 사이트만 있어서 직접 구현했다. 개발을 끝내고 이 글을 쓰는 시점에 ChatGPT가 떠오르긴 했지만, 공부도 할 겸 나쁘지 않았다. 리액트 애플리케이션이었기 때문에 타입스크립트로 작성했다.

### 3.1. Validation

먼저 입력된 값의 유효성 검사를 수행한다. 다음과 같은 경우 에러이다.

- X.X.X.X/n 형식이 아닌 경우
- 숫자가 아닌 이상한 값이 중간에 섞인 경우
- 접두사 비트 길이가 0보다 작거나 32를 넘어가는 경우
- IPv4 주소 각 옥텟(octet)의 크기가 0보다 작거나 255를 넘어가는 경우
    - 옥텟은 점(.)으로 구분된 각 숫자 블럭을 의미한다.

```typescript
function isValidIpAddress(ipBlocks: string[]) {
  for (let block of ipBlocks) {
    if (isNaN(+block) || +block < 0 || +block > 255) {
      return false;
    }
  }
  return true;
}

function isValidCIDR(cidr: string): boolean {
  const ipAndMask = cidr.split("/");
  if (ipAndMask.length !== 2) {
    return false;
  }
  const ip = ipAndMask[0];
  const ipBlocks = ip.split(".");
  if (ipBlocks.length !== 4) {
    return false;
  }
  if (!isValidIpAddress(ipBlocks)) {
    return false;
  }
  if (!ipAndMask[1]) {
    return false;
  }
  const mask = +ipAndMask[1];
  return !(isNaN(mask) || mask < 0 || mask > 32);
}
```

### 3.2. Mask

접두사 비트 길이를 기준으로 마스크를 생성한다. 먼저 주어진 마스크 길이만큼 1을 채운 32자리 문자열을 8자리씩 나눠 십진수로 변환 후 이를 배열로 반환한다. 예를 들어 `/24`인 경우 다음과 같은 과정을 가진다.

- 11111111111111111111111100000000 문자열을 먼저 만든다.
- 8자리씩 십진수 숫자로 변환한다. 
    - 접두사 `0b`는 이진수 표현임을 의미이다.
    - 접두사 `0b`이 앞에 붙은 0과 1로 이뤄진 문자열은 Number 함수를 통해 십진수로 변환할 수 있다. 

```typescript
function getMaskBlocks(mask: number) {
  let result = "";
  for (let index = 0; index < 32; index++) {
    if (mask > 0) {
      result = result + "1";
    } else {
      result = result + "0";
    }
    mask--;
  }
  return [
    Number("0b" + result.substring(0, 8)),
    Number("0b" + result.substring(8, 16)),
    Number("0b" + result.substring(16, 24)),
    Number("0b" + result.substring(24, 32)),
  ];
}
```

### 3.3. Start IP Address

시작 IP 주소를 구하는 과정은 단순하다. ipBlocks, maskBlocks 매개변수 모두 십진수 배열이다. 각 블럭 별로 숫자로 변환된 값들이 담긴 배열이다. 각 옥텟 위치 별로 AND 비트 마스크 연산을 수행한다. AND 연산 수행한 값을 문자열로 변경한다.

```typescript
function fromIp(ipBlocks: number[], maskBlocks: number[]) {
  const result = [];
  for (let index = 0; index < 4; index++) {
    result.push(String(ipBlocks[index] & maskBlocks[index]));
  }
  return result;
}
```

### 3.4. End IP Address

종료 IP 주소를 구하는 과정은 조금 이해가 필요하다. 마스크 주소의 블럭이 0인 케이스와 아닌 케이스로 구분한다. 먼저 마스크 주소 블럭이 0인 케이스다. 이 블럭으로 표현할 수 있는 주소는 모두 허용이기 때문에 255 값과 OR 연산을 수행한 결과가 담긴다. 255 값을 그대로 넣어도 무방하다. 

마스크 주소의 블럭이 0이 아닌 경우 다음과 같은 연산 과정을 따른다.

```
(ipBlocks[index] & maskBlocks[index]) + (255 - maskBlocks[index])
```

이해를 돕기 위해 위에서 살펴본 예시를 다시 가져온다. `ipBlocks[index] & maskBlocks[index]` 연산은 시작 IP를 구하는 작업이다. 

```
10100111.11000111.10101010.01010010(167.199.170.82)
                 &
11111111.11111111.11111111.11100000
                 =
10100111.11000111.10101010.01000000(167.199.170.64)
```

`255 - maskBlocks[index]` 작업은 와일드 카드 비트들을 구하는 과정이다.

```
11111111.11111111.11111111.11111111
                 -
11111111.11111111.11111111.11100000
                 = 
00000000.00000000.00000000.00011111
```

두 값을 더하는 작업은 OR(|) 연산을 수행하는 것과 동일한 효과를 얻는다. 시작 IP 주소는 이미 마스킹 된 상태이기 때문이다. 더하기(+) 연산이 아니라 OR 연산을 사용하더라도 결과는 같다.

```
10100111.11000111.10101010.01000000(167.199.170.64)
                 +
00000000.00000000.00000000.00011111
                 =
10100111.11000111.10101010.01011111(167.199.170.95)
```

구현 코드는 다음과 같다.

```typescript
function toIP(ipBlocks: number[], maskBlocks: number[]) {
  const result = [];
  for (let index = 0; index < 4; index++) {
    let block;
    if (maskBlocks[index] === 0) {
      block = String(ipBlocks[index] | 255);
    } else {
      block = String(
        (ipBlocks[index] & maskBlocks[index]) + (255 - maskBlocks[index])
      );
    }
    result.push(String(block));
  }
  return result;
}
```

### 3.5. Convert Module and Test

전체 코드는 다음과 같다.

```typescript
import IpAddressRange from "../type/IpAddressRange";

const INVALID_IP_ADDRESS_RANGE: IpAddressRange = {
  fromIp: null,
  toIp: null,
};

function getMaskBlocks(mask: number) {
  let result = "";
  for (let index = 0; index < 32; index++) {
    if (mask > 0) {
      result = result + "1";
    } else {
      result = result + "0";
    }
    mask--;
  }
  return [
    Number("0b" + result.substring(0, 8)),
    Number("0b" + result.substring(8, 16)),
    Number("0b" + result.substring(16, 24)),
    Number("0b" + result.substring(24, 32)),
  ];
}

function fromIp(ipBlocks: number[], maskBlocks: number[]) {
  const result = [];
  for (let index = 0; index < 4; index++) {
    result.push(String(ipBlocks[index] & maskBlocks[index]));
  }
  return result;
}

function toIP(ipBlocks: number[], maskBlocks: number[]) {
  const result = [];
  for (let index = 0; index < 4; index++) {
    let block;
    if (maskBlocks[index] === 0) {
      block = String(ipBlocks[index] | 255);
    } else {
      block = String(
        (ipBlocks[index] & maskBlocks[index]) + (255 - maskBlocks[index])
      );
    }
    result.push(String(block));
  }
  return result;
}

function isValidIpAddress(ipBlocks: string[]) {
  for (let block of ipBlocks) {
    if (isNaN(+block) || +block < 0 || +block > 255) {
      return false;
    }
  }
  return true;
}

function isValidCIDR(cidr: string): boolean {
  const ipAndMask = cidr.split("/");
  if (ipAndMask.length !== 2) {
    return false;
  }
  const ip = ipAndMask[0];
  const ipBlocks = ip.split(".");
  if (ipBlocks.length !== 4) {
    return false;
  }
  if (!isValidIpAddress(ipBlocks)) {
    return false;
  }
  if (!ipAndMask[1]) {
    return false;
  }
  const mask = +ipAndMask[1];
  return !(isNaN(mask) || mask < 0 || mask > 32);
}

export const convertCIDR = (cidr: string): IpAddressRange => {
  const isValid = isValidCIDR(cidr);
  if (!isValid) {
    return INVALID_IP_ADDRESS_RANGE;
  }
  const ipAndMask = cidr.split("/");
  const ipBlocks = ipAndMask[0].split(".").map((block) => +block);
  const maskBlocks = getMaskBlocks(+ipAndMask[1]);
  return {
    fromIp: fromIp(ipBlocks, maskBlocks).join("."),
    toIp: toIP(ipBlocks, maskBlocks).join("."),
  };
};
```

테스트 코드는 다음과 같다. 테스트를 통해 예상된 값으로 변환 작업이 잘 이뤄지는지 확인한다.

```typescript
import * as sut from "./ip-converter";

describe("IP converter Test", () => {
  test.each([
    "0.0.0.256/24",
    "0.0.0.255/a",
    "0.0.0.255/24/24",
    "256.0.0.255/24",
    "0.256.0.0/24",
    "a.255.0.0/24",
    "0.b.0.0/24",
    "0.0.c.0/24",
    "0.0.0.d/24",
    "0.0.256.0/24",
    "127.167.108.0/-1",
    "127.167.108.0/33",
    "0.0.0.256",
    "0.0.0.256/",
    "0.0.0.255/",
    "/24",
    "0.0.255/24",
    "0.255/24",
    "256/24",
  ])("유효하지 않은 CIDR를 입력하면 NULL을 반환한다.", (value) => {
    const result = sut.convertCIDR(value);

    expect(result.fromIp).toBeNull();
    expect(result.toIp).toBeNull();
  });

  test.each([
    ["7.88.135.144/28", ["7.88.135.144", "7.88.135.159"]],
    ["192.168.1.0/22", ["192.168.0.0", "192.168.3.255"]],
    ["125.214.10.5/22", ["125.214.8.0", "125.214.11.255"]],
    ["125.214.10.5/32", ["125.214.10.5", "125.214.10.5"]],
    ["125.214.10.5/0", ["0.0.0.0", "255.255.255.255"]],
    ["125.214.10.25/24", ["125.214.10.0", "125.214.10.255"]],
    ["125.214.10.25/16", ["125.214.0.0", "125.214.255.255"]],
    ["125.214.10.25/1", ["0.0.0.0", "127.255.255.255"]],
  ])("유효한 값을 입력하면 변환된 값이 반환된다.", (value, expectedResult) => {
    const result = sut.convertCIDR(value);

    expect(result.fromIp).toEqual(expectedResult[0]);
    expect(result.toIp).toEqual(expectedResult[1]);
  });
});
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-12-24-classless-inter-domain-routing>

#### REFERENCE

- <https://ko.wikipedia.org/wiki/CIDR>
- <https://en.wikipedia.org/wiki/Classful_network>
- <https://datatracker.ietf.org/doc/html/rfc1519>
- <https://datatracker.ietf.org/doc/html/rfc4632>
- <https://aws.amazon.com/ko/what-is/cidr/>
- [Data Communication and Networking 5th](https://product.kyobobook.co.kr/detail/S000003937861)