---
title: "[programmers] 124 나라의 숫자"
search: false
category:
  - problem
  - algorithm
  - data-structure
last_modified_at: 2021-03-21T00:00:00
---

<br>

## 문제 Link
- <https://programmers.co.kr/learn/courses/30/lessons/12899>

## 문제 설명
124 나라가 있습니다. 124 나라에서는 10진법이 아닌 다음과 같은 자신들만의 규칙으로 수를 표현합니다. 

1. 124 나라에는 자연수만 존재합니다.
1. 124 나라에는 모든 수를 표현할 때 1, 2, 4만 사용합니다.

예를 들어서 124 나라에서 사용하는 숫자는 다음과 같이 변환됩니다.

| 10진법 | 124 나라 | 10진법 | 124 나라 |
|---|---|---|---|
| 1 | 1 | 6 | 14 |
| 2 | 2 | 7 | 21 |
| 3 | 4 | 8 | 22 |
| 4 | 11 | 9 | 24 |
| 5 | 12 | 10 | 41 |

자연수 n이 매개변수로 주어질 때, n을 124 나라에서 사용하는 숫자로 바꾼 값을 return 하도록 solution 함수를 완성해 주세요. 

## 제한 사항
- n은 500,000,000이하의 자연수 입니다.

## 입출력 예

| n | result |
|---|---|
| 1 | 1 |
| 2 | 2 |
| 3 | 4 |
| 4 | 11 |

## 코드 해설
- 작성 중입니다.

```java
class Solution {
    public String solution(int n) {
        int exp = 1;
        int base = 0;
        while (n > base + Math.pow(3, exp)) {
            base += Math.pow(3, exp);
            exp++;
        }
        StringBuffer answer = new StringBuffer();
        for (int index = exp - 1; index >= 0; index--) {
            double temp = Math.pow(3, index);
            int subIndex = 0;
            for (subIndex = 1; subIndex <= 3; subIndex++) {
                if (n - base <= temp * subIndex) {
                    break;
                }
            }
            base += temp * (subIndex - 1);
            if (subIndex == 3) {
                answer.append(4);
            } else {
                answer.append(subIndex);
            }
        }
        return answer.toString();
    }
}
```

## OPINION
작성 중입니다.