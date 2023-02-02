---
title: "[programmers] 두 개 뽑아서 더하기"
search: false
category:
  - problem
  - algorithm
  - data-structure
last_modified_at: 2021-03-04T18:00:00
---

<br/>

## 1. 문제 Link
- <https://programmers.co.kr/learn/courses/30/lessons/68644>

## 2. 문제 설명
정수 배열 numbers가 주어집니다. 
numbers에서 서로 다른 인덱스에 있는 두 개의 수를 뽑아 더해서 만들 수 있는 모든 수를 배열에 오름차순으로 담아 return 하도록 solution 함수를 완성해주세요.

## 3. 제한 사항
- numbers의 길이는 2 이상 100 이하입니다. 
- numbers의 모든 수는 0 이상 100 이하입니다.

## 4. 입출력 예

| numbers | result |
|---|---|
| [2,1,3,4,1] | [2,3,4,5,6,7] |
| [5,0,2,7] | [2,5,7,9,12] |

## 5. 코드 해설
- 중복되는 값이 제거될 수 있도록 Set 객체를 선언합니다.
- 중첩 for 문을 이용하여 서로 다른 인덱스에 있는 두 개의 수를 뽑아 더한 값을 set 객체에 담습니다.
- set 객체에 담긴 값들은 정렬되어 있지 않기 때문에 정렬하기 위한 temp 배열을 선언합니다.
- set 객체에 담긴 값을 temp 배열의 index으로 지정하여 해당 위치 값을 1로 변경합니다.
- 결과로 반환할 answer 배열을 생성합니다.
- temp 배열에 담긴 값이 1인 인덱스를 answer 배열에 순차적으로 담습니다. 이 부분에서 정렬됩니다.
- answer 배열을 반환합니다.

## 6. 제출 코드

```java
import java.util.Set;
import java.util.HashSet;

class Solution {
    public int[] solution(int[] numbers) {
        Set<Integer> set = new HashSet<>();
        int length = numbers.length;
        // 모든 경우의 수 합 & 중복 제거
        for (int index = 0; index < length; index++) {
            for (int subIndex = index + 1; subIndex < length; subIndex++) {
                set.add(numbers[index] + numbers[subIndex]);
            }
        }
        // 두 수의 합산은 최대 0 ~ 200
        int[] temp = new int[201];
        for (Integer sum : set) {
            temp[sum] = 1;
        }
        int answerIndex = 0;
        int[] answer = new int[set.size()];
        for (int index = 0; index < 201; index++) {
            if (temp[index] == 1) {
                answer[answerIndex++] = index;
            }
        }
        return answer;
    }
}
```

## 7. BEST PRACTICE
- Stream API를 이용하는 경우 더 가독성 높은 코드를 작성할 수 있습니다.
- 저의 코드에서 정렬을 위해 수행하였던 단계들이 제거되었습니다. 
    - ~~set 객체에 담긴 값들은 정렬되어 있지 않기 때문에 정렬하기 위한 temp 배열을 선언합니다.~~
    - ~~set 객체에 담긴 값을 temp 배열의 index으로 지정하여 해당 위치의 값을 1로 변경합니다.~~
    - ~~결과로 반환할 answer 배열을 생성합니다.~~
    - ~~temp 배열에 담긴 값이 1인 인덱스를 answer 배열에 순차적으로 담습니다. 이 부분에서 정렬됩니다.~~

```java
import java.util.Set;
import java.util.HashSet;

class Solution {
    public int[] solution(int[] numbers) {
        Set<Integer> set = new HashSet<>();
        int length = numbers.length;
        // 모든 경우의 수 합 & 중복 제거
        for(int index = 0; index < length; index++) {
            for(int subIndex = index + 1; subIndex < length; subIndex++) {
                set.add(numbers[index] + numbers[subIndex]);
            }
        }
        return set.stream().sorted().mapToInt(a -> a.intValue()).toArray();
    }
}
```

## CLOSING
Java Collection을 쉽게 정렬할 수 있는 방법이 있음에도 불구하고 비효율적인 코드를 작성하였습니다.
- 정렬을 위한 별도 메모리 공간 생성
- 불필요한 반복문을 두 차례 수행

다른 분의 제출 내용을 보니 `Java Stream API`을 이용하여 가독성이 매우 좋은 코드를 작성하였습니다. 
평소에 `Stream`을 사용하지만 mapToInt(), toArray() 메소드를 연결하여 int 배열을 만드는 방법은 미처 생각해내지 못했습니다. 
다른 분들의 코드를 통해 다양한 풀이 기법, 좋은 문제 접근 방법 등을 배우는 습관을 길러야겠습니다.