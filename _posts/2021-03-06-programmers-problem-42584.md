---
title: "[programmers] 주식가격"
search: false
category:
  - problem
  - algorithm
last_modified_at: 2021-03-04T09:00:00
---

<br>

## 문제 Link
- <https://programmers.co.kr/learn/courses/30/lessons/42584>

## 문제 설명
초 단위로 기록된 주식가격이 담긴 배열 prices가 매개변수로 주어질 때, 가격이 떨어지지 않은 기간은 몇 초인지를 return 하도록 solution 함수를 완성하세요.

## 제한 사항
- prices의 각 가격은 1 이상 10,000 이하인 자연수입니다. 
- prices의 길이는 2 이상 100,000 이하입니다.

## 입출력 예

| prices | return |
|---|---|
| [1,2,3,2,3] | [4,3,1,1,0] |

## 코드 해설
- 이중 for 문을 사용하여 각 price 별로 현재 자기 자신보다 가격이 낮았던 적이 있었는지 확인합니다.
- n 인덱스 가격은 n + 1 인덱스 가격부터 자신보다 가격이 낮았던 적이 있는지 확인합니다. 
- 시간이 지난 정도를 알 수 있도록 cnt 변수를 1씩 증가시킵니다.
- 가격이 떨어지지 않았다면 continue, 떨어졌다면 break 합니다.
- answer 배열 n 인덱스에 cnt 값을 넣어줍니다.

## 제출 코드

```java
class Solution {
    public int[] solution(int[] prices) {
        int[] answer = new int[prices.length];
        int length = prices.length;
        for (int index = 0; index < length; index++) {
            int cnt = 0;
            for (int subIndex = index + 1; subIndex < length; subIndex++) {
                cnt++;
                if (prices[index] <= prices[subIndex]) {
                    continue;
                } else {
                    break;
                }
            }
            answer[index] = cnt;
        }
        return answer;
    }
}
```

## OPINION
Stack, Queue 자료구조와 관련된 문제라고 하지만 간단한 로직이어서 별도로 사용하진 않았습니다. 
기회가 된다면 해당 Stack, Queue 자료구조를 사용하여 문제를 해결해보도록 하겠습니다.