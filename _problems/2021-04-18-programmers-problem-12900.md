---
title: "[programmers] 2 x n 타일링"
search: false
category:
  - problem
  - algorithm
last_modified_at: 2021-04-18T18:00:00
---

<br/>

## 1. 문제 Link
- <https://programmers.co.kr/learn/courses/30/lessons/12900>

## 2. 문제 설명
가로 길이가 2이고 세로의 길이가 1인 직사각형모양의 타일이 있습니다. 
이 직사각형 타일을 이용하여 세로의 길이가 2이고 가로의 길이가 n인 바닥을 가득 채우려고 합니다. 
타일을 채울 때는 다음과 같이 2가지 방법이 있습니다.

- 타일을 가로로 배치 하는 경우
- 타일을 세로로 배치 하는 경우

예를들어서 n이 7인 직사각형은 다음과 같이 채울 수 있습니다.

<p align="center"><img src="/images/programmers-problem-12900-1.JPG" width="45%"></p>
<center>https://programmers.co.kr/learn/courses/30/lessons/12900</center>

직사각형의 가로의 길이 n이 매개변수로 주어질 때, 이 직사각형을 채우는 방법의 수를 return 하는 solution 함수를 완성해주세요.

## 3. 제한 사항
- 가로의 길이 n은 60,000이하의 자연수 입니다.
- 경우의 수가 많아 질 수 있으므로, 경우의 수를 1,000,000,007으로 나눈 나머지를 return해주세요.

## 4. 입출력 예

| n | result |
|---|---|
| 4 | 5 |

## 5. 코드 해설
- n = 1 인 경우, 경우의 수는 1가지입니다.
- n = 2 인 경우, 경우의 수는 2가지입니다.
- n = 3 인 경우 아래와 같이 생각할 수 있습니다.
    - 앞에 1칸을 채운다면 나머지 2칸은 n = 2 인 경우의 수와 동일합니다.
    - 앞에 2칸을 채운다면 나머지 1칸은 n = 1 인 경우의 수와 동일합니다.
- n = 4 인 경우 아래와 같이 생각할 수 있습니다.
    - 앞에 1칸을 채운다면 나머지 3칸은 n = 3 인 경우의 수와 동일합니다.
    - 앞에 2칸을 채운다면 나머지 2칸은 n = 2 인 경우의 수와 동일합니다.
- 이를 일반화시켜서 n인 경우 경우의 수는 다음과 같이 생각할 수 있습니다.
    - 앞에 1칸을 채운다면 나머지 n - 1칸은 n - 1 일 때 경우의 수와 동일합니다.
    - 앞에 2칸을 채운다면 나머지 n - 2칸은 n - 2 일 때 경우의 수와 동일합니다.

## 6. 제출 코드

```java
class Solution {
    public int solution(int n) {
        int[] dp = new int[n + 1];
        dp[1] = 1;
        dp[2] = 2;
        for (int index = 3; index <= n; index++) {
            dp[index] = dp[index - 1] + dp[index - 2];
            dp[index] %= 1000000007;
        }
        return dp[n];
    }
}
```