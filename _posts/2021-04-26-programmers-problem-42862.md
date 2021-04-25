---
title: "[programmers] 체육복"
search: false
category:
  - problem
  - algorithm
last_modified_at: 2021-04-26T00:00:00
---

<br>

## 문제 Link
- <https://programmers.co.kr/learn/courses/30/lessons/42862>

## 문제 설명
점심시간에 도둑이 들어, 일부 학생이 체육복을 도난당했습니다. 
다행히 여벌 체육복이 있는 학생이 이들에게 체육복을 빌려주려 합니다. 
학생들의 번호는 체격 순으로 매겨져 있어, 바로 앞번호의 학생이나 바로 뒷번호의 학생에게만 체육복을 빌려줄 수 있습니다. 
예를 들어, 4번 학생은 3번 학생이나 5번 학생에게만 체육복을 빌려줄 수 있습니다. 
체육복이 없으면 수업을 들을 수 없기 때문에 체육복을 적절히 빌려 최대한 많은 학생이 체육수업을 들어야 합니다.

전체 학생의 수 n, 체육복을 도난당한 학생들의 번호가 담긴 배열 lost, 
여벌의 체육복을 가져온 학생들의 번호가 담긴 배열 reserve가 매개변수로 주어질 때, 
체육수업을 들을 수 있는 학생의 최댓값을 return 하도록 solution 함수를 작성해주세요.

## 제한 사항
- 전체 학생의 수는 2명 이상 30명 이하입니다.
- 체육복을 도난당한 학생의 수는 1명 이상 n명 이하이고 중복되는 번호는 없습니다.
- 여벌의 체육복을 가져온 학생의 수는 1명 이상 n명 이하이고 중복되는 번호는 없습니다.
- 여벌 체육복이 있는 학생만 다른 학생에게 체육복을 빌려줄 수 있습니다.
- 여벌 체육복을 가져온 학생이 체육복을 도난당했을 수 있습니다. 
  이때 이 학생은 체육복을 하나만 도난당했다고 가정하며, 남은 체육복이 하나이기에 다른 학생에게는 체육복을 빌려줄 수 없습니다.


## 입출력 예

| n | lost | reserve | return |
|---|---|---|---|
| 5 | [2, 4] | [1, 3, 5] | 5 |
| 5 | [2, 4] | [3] | 4 |
| 3 | [3] | [1] | 2 |

## 코드 해설
- 작성 중 입니다.

```java
class Solution {

    public void restore(int[] lost, int index, int beforeValue) {
        // 탐색을 마친 후 데이터 값 복구
        if (index < lost.length && lost[index] == -1) {
            lost[index] = beforeValue;
        }
    }

    // 빌리는데 성공한 학생 수
    public int reserve(int[] lost, int[] reserve, int curIndex, int canReserveNumer) {
        int index = 0;
        int temp = 0;
        int result = 0;
        int length = lost.length;
        for (index = 0; index < length; index++) {
            if (canReserveNumer == lost[index]) {
                temp = lost[index];
                lost[index] = -1;
                result = 1;
                break;
            }
        }
        // 마지막 체크할 학생 수 초과
        if (curIndex == reserve.length) {
            restore(lost, index, temp);
            return result;
        }
        int minusCount = reserve(lost, reserve, curIndex + 1, reserve[curIndex] - 1);
        int plusCount = reserve(lost, reserve, curIndex + 1, reserve[curIndex] + 1);
        // 탐색을 마친 후 데이터 값 복구
        restore(lost, index, temp);
        return (minusCount > plusCount ? minusCount : plusCount) + result;
    }

    public int solution(int n, int[] lost, int[] reserve) {
        // 여별의 옷이 있는 학생이 도두맞은 케이스 제거
        int lostLength = lost.length;
        int reserveLength = reserve.length;
        for (int index = 0; index < reserveLength; index++) {
            for (int subIndex = 0; subIndex < lostLength; subIndex++) {
                if (lost[subIndex] == reserve[index]) {
                    lost[subIndex] = -1;
                    reserve[index] = -2;
                    break;
                }
            }
        }
        int minusCount = reserve(lost, reserve, 1, reserve[0] - 1);
        int plusCount = reserve(lost, reserve, 1, reserve[0] + 1);
        int result = minusCount > plusCount ? minusCount : plusCount;
        int answer = n - lost.length + result;
        return answer;
    }
}
```

## OPINION
작성 중 입니다.