---
title: "[programmers] 기능개발"
search: false
category:
  - problem
  - algorithm
last_modified_at: 2021-03-30T18:00:00
---

<br/>

## 1. 문제 Link
- <https://programmers.co.kr/learn/courses/30/lessons/42586>

## 2. 문제 설명
프로그래머스 팀에서는 기능 개선 작업을 수행 중입니다. 
각 기능은 진도가 100%일 때 서비스에 반영할 수 있습니다.

또, 각 기능의 개발속도는 모두 다르기 때문에 뒤에 있는 기능이 앞에 있는 기능보다 먼저 개발될 수 있고, 
이때 뒤에 있는 기능은 앞에 있는 기능이 배포될 때 함께 배포됩니다.

먼저 배포되어야 하는 순서대로 작업의 진도가 적힌 정수 배열 progresses와 
각 작업의 개발 속도가 적힌 정수 배열 speeds가 주어질 때 각 배포마다 몇 개의 기능이 배포되는지를 return 하도록 solution 함수를 완성하세요.

## 3. 제한 사항
- 작업의 개수(progresses, speeds배열의 길이)는 100개 이하입니다.
- 작업 진도는 100 미만의 자연수입니다.
- 작업 속도는 100 이하의 자연수입니다.
- 배포는 하루에 한 번만 할 수 있으며, 하루의 끝에 이루어진다고 가정합니다. 예를 들어 진도율이 95%인 작업의 개발 속도가 하루에 4%라면 배포는 2일 뒤에 이루어집니다.

## 4. 입출력 예

| progresses | speeds | return |
|---|---|---|
| [93, 30, 55] | [1, 30, 5] | [2, 1] |
| [95, 90, 99, 99, 80, 99] | [1, 1, 1, 1, 1, 1] | [1, 3, 2] |

## 5. 코드 해설
- 반복문을 통해 작업 별로 완료되기까지 걸리는 시간(날짜)을 구하여 leftDays 배열에 저장합니다.
- 배열 길이가 1개인 경우 [1] 배열을 반환합니다.
- 가장 먼저 배포되야하는 작업을 기준으로 이미 완료되었거나 동일 날짜에 끝난 작업 수(cnt)를 구합니다.(baseValue >= leftDays[index])
- 중간에 완료되지 않는 작업이 있는 경우에는 해당 작업을 기준으로 재탐색합니다.(baseValue < leftDays[index])
- 동시에 배포할 수 있는 작업 수를 result 리스트에 담고 1로 초기화합니다.
- result 리스트를 Stream API를 통해 배열로 만들어 반환합니다. 

## 6. 제출 코드

```java
import java.util.ArrayList;
import java.util.List;

class Solution {
    public int[] solution(int[] progresses, int[] speeds) {
        int[] leftDays = new int[progresses.length];
        for (int index = 0; index < progresses.length; index++) {
            int leftProgress = 100 - progresses[index];
            leftDays[index] = leftProgress / speeds[index] + (leftProgress % speeds[index] == 0 ? 0 : 1);
        }
        if (leftDays.length == 1) {
            return new int[] { 1 };
        }
        int cnt = 1;
        int baseValue = leftDays[0];
        List<Integer> result = new ArrayList<>();
        for (int index = 1; index < leftDays.length; index++) {
            if (baseValue >= leftDays[index]) {
                cnt++;
                continue;
            }
            result.add(cnt);
            baseValue = leftDays[index];
            cnt = 1;
        }
        result.add(cnt);
        return result.stream().mapToInt(num -> num.intValue()).toArray();
    }
}
```

## 7. BEST PRACTICE
- 작업 수만큼 반복 수행합니다.
- 작업 진행 상태[i] + 날짜 * 속도[i] 값을 계산하여 100 이상이 될 때까지 날짜 증가를 반복 수행합니다.
- 작업[i]이 종료되는 날짜를 인덱스로 하여 dayOfend 배열 값을 1 증가시킵니다.
- 만약, 작업[i+1]이 해당 날짜 이내로 끝나는 경우 
    - 날짜 값이 증가하지 않습니다.
    - 작업[i+1]가 종료되는 날짜가 동일하므로 동일 인덱스 위치 dayOfend 배열 값이 1 증가합니다.
- 만약, 작업[i+1]이 해당 날짜 이내로 끝나지 않는 경우
    - 날짜 값이 증가합니다.
    - 작업[i+1]가 종료되는 증가한 날짜를 인덱스로 하여 dayOfend 배열 값이 1 증가합니다.
- 이후 Stream API 필터를 이용해 0이 아닌 값들만 배열로 만들어 반환합니다.

```java
import java.util.Arrays;

class Solution {
    public int[] solution(int[] progresses, int[] speeds) {
        int[] dayOfend = new int[100];
        int day = -1;
        for (int i = 0; i < progresses.length; i++) {
            while (progresses[i] + (day * speeds[i]) < 100) {
                day++;
            }
            dayOfend[day]++;
        }
        return Arrays.stream(dayOfend).filter(i -> i != 0).toArray();
    }
}
```