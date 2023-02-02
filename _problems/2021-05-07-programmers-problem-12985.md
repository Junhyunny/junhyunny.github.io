---
title: "[programmers] 예상 대진표"
search: false
category:
  - problem
  - algorithm
last_modified_at: 2021-05-07T18:00:00
---

<br/>

## 1. 문제 Link
- <https://programmers.co.kr/learn/courses/30/lessons/12985>

## 2. 문제 설명
△△ 게임대회가 개최되었습니다. 이 대회는 N명이 참가하고, 토너먼트 형식으로 진행됩니다. 
N명의 참가자는 각각 1부터 N번을 차례대로 배정받습니다. 
그리고, 1번<->2번, 3번<->4번, ... , N-1번<->N번의 참가자끼리 게임을 진행합니다. 
각 게임에서 이긴 사람은 다음 라운드에 진출할 수 있습니다. 
이때, 다음 라운드에 진출할 참가자의 번호는 다시 1번부터 N/2번을 차례대로 배정받습니다. 
만약 1번<->2번 끼리 겨루는 게임에서 2번이 승리했다면 다음 라운드에서 1번을 부여받고, 
3번<->4번에서 겨루는 게임에서 3번이 승리했다면 다음 라운드에서 2번을 부여받게 됩니다. 
게임은 최종 한 명이 남을 때까지 진행됩니다.

이때, 처음 라운드에서 A번을 가진 참가자는 경쟁자로 생각하는 B번 참가자와 몇 번째 라운드에서 만나는지 궁금해졌습니다. 
게임 참가자 수 N, 참가자 번호 A, 경쟁자 번호 B가 함수 solution의 매개변수로 주어질 때, 
처음 라운드에서 A번을 가진 참가자는 경쟁자로 생각하는 B번 참가자와 몇 번째 라운드에서 만나는지 return 하는 solution 함수를 완성해 주세요. 
단, A번 참가자와 B번 참가자는 서로 붙게 되기 전까지 항상 이긴다고 가정합니다.

## 3. 제한 사항
- N : 21 이상 220 이하인 자연수 (2의 지수 승으로 주어지므로 부전승은 발생하지 않습니다.)
- A, B : N 이하인 자연수 (단, A ≠ B 입니다.)

## 4. 입출력 예

| N | A | B | answer |
|---|---|---|---|
| 8 | 4 | 7 | 3 |


## 5. 코드 해설
- 숫자 a, b가 현재 싸울 수 있는 상태인지 확인합니다. 
- 싸울 수 없는 상태인 경우 토너먼트를 진행합니다.
- 싸울 수 없는 상태는 간격 차이가 1이 아니거나 간격 차이가 1이지만 짝수인 값이 작은 경우입니다.
- 현재 숫자가 짝수인 경우에 다음 토너먼트에 참가할 숫자는 current / 2 입니다.
- 현재 숫자가 홀수인 경우에 다음 토너먼트에 참가할 숫자는 current / 2 + 1 입니다.

## 6. 제출 코드

```java
class Solution {

    // 2, 3 으로 숫자가 들어오는 경우 차이가 1이어도 대결을 수행하지 못한다.
    boolean isNotFightable(int a, int b) {
        return Math.abs(a - b) != 1 || (a % 2 != 0 ? a > b : a < b);
    }

    public int solution(int n, int a, int b) {
        int answer = 1;
        while (isNotFightable(a, b)) {
            a = a % 2 == 0 ? a / 2 : a / 2 + 1;
            b = b % 2 == 0 ? b / 2 : b / 2 + 1;
            answer++;
        }
        return answer;
    }
}
```

## 7. BEST PRACTICE
- 작성 보류 중

```java
class Solution {
    public int solution(int n, int a, int b) {
        return Integer.toBinaryString((a - 1) ^ (b - 1)).length();
    }
}
```