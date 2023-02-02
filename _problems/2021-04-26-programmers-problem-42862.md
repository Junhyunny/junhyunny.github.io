---
title: "[programmers] 체육복"
search: false
category:
  - problem
  - algorithm
last_modified_at: 2021-04-26T18:00:00
---

<br/>

## 1. 문제 Link
- <https://programmers.co.kr/learn/courses/30/lessons/42862>

## 2. 문제 설명
점심시간에 도둑이 들어, 일부 학생이 체육복을 도난당했습니다. 
다행히 여벌 체육복이 있는 학생이 이들에게 체육복을 빌려주려 합니다. 
학생들의 번호는 체격 순으로 매겨져 있어, 바로 앞번호의 학생이나 바로 뒷번호의 학생에게만 체육복을 빌려줄 수 있습니다. 
예를 들어, 4번 학생은 3번 학생이나 5번 학생에게만 체육복을 빌려줄 수 있습니다. 
체육복이 없으면 수업을 들을 수 없기 때문에 체육복을 적절히 빌려 최대한 많은 학생이 체육수업을 들어야 합니다.

전체 학생의 수 n, 체육복을 도난당한 학생들의 번호가 담긴 배열 lost, 
여벌의 체육복을 가져온 학생들의 번호가 담긴 배열 reserve가 매개변수로 주어질 때, 
체육수업을 들을 수 있는 학생의 최댓값을 return 하도록 solution 함수를 작성해주세요.

## 3. 제한 사항
- 전체 학생의 수는 2명 이상 30명 이하입니다.
- 체육복을 도난당한 학생의 수는 1명 이상 n명 이하이고 중복되는 번호는 없습니다.
- 여벌의 체육복을 가져온 학생의 수는 1명 이상 n명 이하이고 중복되는 번호는 없습니다.
- 여벌 체육복이 있는 학생만 다른 학생에게 체육복을 빌려줄 수 있습니다.
- 여벌 체육복을 가져온 학생이 체육복을 도난당했을 수 있습니다. 
  이때 이 학생은 체육복을 하나만 도난당했다고 가정하며, 남은 체육복이 하나이기에 다른 학생에게는 체육복을 빌려줄 수 없습니다.

## 4. 입출력 예

| n | lost | reserve | return |
|---|---|---|---|
| 5 | [2, 4] | [1, 3, 5] | 5 |
| 5 | [2, 4] | [3] | 4 |
| 3 | [3] | [1] | 2 |

## 5. 코드 해설

### 5.1. solution 메소드
- 여분의 옷을 가진 사람이 옷을 잃어버린 경우에는 자신이 입어야하므로 lost, reserve 배열에서 제거합니다.
- 여분의 옷을 가진 첫번째 사람을 기준으로 양 옆의 사람에게 옷을 빌려줘봅니다.(reserve 메소드)
- 왼쪽을 빌려줬을 때 경우의 수(minusCount), 오른쪽을 빌려줬을 때 경우의 수(plusCount) 중 큰 값을 결정합니다.
- 전체 사람 수에서 잃어버린 사람을 뺀 값에 빌려준 수를 더해줍니다.

```java
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
```

### 5.2. reserve 메소드
- DFS 탐색을 수행합니다.
- 빌려줄 수 있는 사람을 찾으면 잃어버린 사람을 lost 배열에서 제거합니다.(-1 setting)
- curIndex 값이 현재 빌려줄 수 있는 사람 수를 넘어가면 이전 잃어버린 사람을 lost 배열에 복구합니다.
- reserve 메소드를 재귀적으로 수행합니다.
- 왼쪽을 빌려줬을 때 경우의 수(minusCount), 오른쪽을 빌려줬을 때 경우의 수(plusCount) 중 큰 값을 결정합니다.
- 결정된 값에 현재 위치에서 빌려준 사람 수를 더해줍니다.
- 현재 call stack에서 잃어버린 사람의 값을 복구합니다.

```java
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
```

### 5.3. restore 메소드
- index 위치에 있던 옷을 잃어버린 사람을 다시 lost 배열에 넣어줍니다.

```java
    public void restore(int[] lost, int index, int beforeValue) {
        // 탐색을 마친 후 데이터 값 복구
        if (index < lost.length && lost[index] == -1) {
            lost[index] = beforeValue;
        }
    }
```

## 6. 제출 코드

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

## 7. BEST PRACTICE
- 최초 answer 값은 전체 사람 수입니다.
- people 배열에 각 인덱스에는 사람 별로 들고 있는 옷의 수를 저장합니다.
- lost 배열을 이용해 옷을 잃어버린 사람들 위치에 숫자는 낮춥니다.
- reserve 배열을 이용해 여분의 옷을 가진 사람들 위치에 숫자는 높입니다.
- i 위치에 사람이 옷이 없다면 양 옆에서 빌립니다.
- 양 옆 사람에게 모두 빌리지 못 했다면 answer 값을 하나 낮춥니다.
- 최종 answer 값을 반환합니다.

```java
class Solution {
    public int solution(int n, int[] lost, int[] reserve) {
        int[] people = new int[n];
        int answer = n;
        for (int l : lost) people[l - 1]--;
        for (int r : reserve) people[r - 1]++;
        for (int i = 0; i < people.length; i++) {
            if (people[i] == -1) {
                if (i - 1 >= 0 && people[i - 1] == 1) {
                    people[i]++;
                    people[i - 1]--;
                } else if (i + 1 < people.length && people[i + 1] == 1) {
                    people[i]++;
                    people[i + 1]--;
                } else answer--;
            }
        }
        return answer;
    }
}
```