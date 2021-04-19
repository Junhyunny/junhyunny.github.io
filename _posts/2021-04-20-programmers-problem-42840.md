---
title: "[programmers] 모의고사"
search: false
category:
  - problem
  - algorithm
last_modified_at: 2021-04-20T00:00:00
---

<br>

## 문제 Link
- <https://programmers.co.kr/learn/courses/30/lessons/42840>

## 문제 설명
수포자는 수학을 포기한 사람의 준말입니다. 수포자 삼인방은 모의고사에 수학 문제를 전부 찍으려 합니다. 
수포자는 1번 문제부터 마지막 문제까지 다음과 같이 찍습니다.

1번 수포자가 찍는 방식: 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, ...
2번 수포자가 찍는 방식: 2, 1, 2, 3, 2, 4, 2, 5, 2, 1, 2, 3, 2, 4, 2, 5, ...
3번 수포자가 찍는 방식: 3, 3, 1, 1, 2, 2, 4, 4, 5, 5, 3, 3, 1, 1, 2, 2, 4, 4, 5, 5, ...

1번 문제부터 마지막 문제까지의 정답이 순서대로 들은 배열 answers가 주어졌을 때, 가장 많은 문제를 맞힌 사람이 누구인지 배열에 담아 return 하도록 solution 함수를 작성해주세요.

## 제한 사항
- 시험은 최대 10,000 문제로 구성되어있습니다.
- 문제의 정답은 1, 2, 3, 4, 5중 하나입니다.
- 가장 높은 점수를 받은 사람이 여럿일 경우, return하는 값을 오름차순 정렬해주세요.

## 입출력 예

| answers | return |
|---|---|
| [1,2,3,4,5] | [1] |
| [1,3,2,4,2] | [1,2,3] |

## 코드 해설
- 작성 중 입니다.

```java
import java.util.ArrayList;
import java.util.List;

class Solution {
    public int[] solution(int[] answers) {
        int[] score = {0, 0, 0};
        int[] oneAsnwer = {1, 2, 3, 4, 5};
        int[] twoAsnwer = {2, 1, 2, 3, 2, 4, 2, 5};
        int[] threeAsnwer = {3, 3, 1, 1, 2, 2, 4, 4, 5, 5};
        int answersLength = answers.length;
        for (int index = 0; index < answersLength; index++) {
            int answer = answers[index];
            if (answer == oneAsnwer[index % 5]) {
                // 1번 수포자 정답수
                score[0]++;
            }
            if (answer == twoAsnwer[index % 8]) {
                // 2번 수포자 정답수
                score[1]++;
            }
            if (answer == threeAsnwer[index % 10]) {
                // 3번 수포자 정답수
                score[2]++;
            }
        }
        int maximum = score[0];
        for (int index = 1; index < 3; index++) {
            if (maximum < score[index]) {
                maximum = score[index];
            }
        }
        List<Integer> result = new ArrayList<>();
        for (int index = 0; index < 3; index++) {
            if (score[index] == 0) {
                continue;
            }
            if (maximum == score[index]) {
                result.add(index + 1);
            }
        }
        return result.stream().mapToInt(Integer::intValue).toArray();
    }
}
```

## OPINION
작성 중 입니다.