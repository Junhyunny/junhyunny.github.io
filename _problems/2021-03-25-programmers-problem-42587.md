---
title: "[programmers] 프린터"
search: false
category:
  - problem
  - algorithm
last_modified_at: 2021-03-25T18:00:00
---

<br/>

## 1. 문제 Link
- <https://programmers.co.kr/learn/courses/30/lessons/42587>

## 2. 문제 설명
일반적인 프린터는 인쇄 요청이 들어온 순서대로 인쇄합니다. 
그렇기 때문에 중요한 문서가 나중에 인쇄될 수 있습니다. 
이런 문제를 보완하기 위해 중요도가 높은 문서를 먼저 인쇄하는 프린터를 개발했습니다. 
이 새롭게 개발한 프린터는 아래와 같은 방식으로 인쇄 작업을 수행합니다.

1. 인쇄 대기목록의 가장 앞에 있는 문서(J)를 대기목록에서 꺼냅니다.
2. 나머지 인쇄 대기목록에서 J보다 중요도가 높은 문서가 한 개라도 존재하면 J를 대기목록의 가장 마지막에 넣습니다.
3. 그렇지 않으면 J를 인쇄합니다.

예를 들어, 4개의 문서(A, B, C, D)가 순서대로 인쇄 대기목록에 있고 중요도가 2 1 3 2 라면 C D A B 순으로 인쇄하게 됩니다.

내가 인쇄를 요청한 문서가 몇 번째로 인쇄되는지 알고 싶습니다. 위의 예에서 C는 1번째로, A는 3번째로 인쇄됩니다.

현재 대기목록에 있는 문서의 중요도가 순서대로 담긴 배열 priorities와 
내가 인쇄를 요청한 문서가 현재 대기목록의 어떤 위치에 있는지를 알려주는 location이 매개변수로 주어질 때, 
내가 인쇄를 요청한 문서가 몇 번째로 인쇄되는지 return 하도록 solution 함수를 작성해주세요.

## 3. 제한 사항
- 현재 대기목록에는 1개 이상 100개 이하의 문서가 있습니다.
- 인쇄 작업의 중요도는 1~9로 표현하며 숫자가 클수록 중요하다는 뜻입니다.
- location은 0 이상 (현재 대기목록에 있는 작업 수 - 1) 이하의 값을 가지며 대기목록의 가장 앞에 있으면 0, 두 번째에 있으면 1로 표현합니다.

## 4. 입출력 예

| priorities | location | return |
|---|---|---|
| [2, 1, 3, 2] | 2 | 1 |
| [1, 1, 9, 1, 1, 1] | 0 | 5 |

## 5. 코드 해설
- 전달받은 우선순위를 큐에 담습니다.
- location이 -1이 될 때까지 반복 수행합니다.
- 큐에서 맨 앞에 있는 값을 꺼냅니다.
- 가장 우선순위가 높아서 프린트가 가능한지 큐를 탐색합니다.
- 프린트가 가능한 경우 위치(location)를 감소시키고 순번(answer)을 증가시킵니다. 
- 프린트가 불가능한 경우 다음과 같이 행동합니다.
    - 현재 위치가 맨 앞인 경우 맨 마지막으로 이동합니다.
    - 현재 위치가 맨 앞이 아닌 경우에는 앞으로 한 칸 이동합니다.

## 6. 제출 코드

```java
import java.util.LinkedList;
import java.util.List;

class Solution {
    public int solution(int[] priorities, int location) {
        List<Integer> que = new LinkedList<>();
        for (int index = 0; index < priorities.length; index++) {
            que.add(priorities[index]);
        }
        int answer = 0;
        while (location != -1) {
            boolean possiblePrint = true;
            int element = que.remove(0);
            for (Integer el : que) {
                // 더 큰 우선순위가 존재하는 경우
                if (element < el) {
                    que.add(element);
                    possiblePrint = false;
                    break;
                }
            }
            // 프린트가 가능한 경우
            if (possiblePrint) {
                // 순번 감소
                location--;
                // 프린트 횟수 증가
                answer++;
            } else {
                if (location == 0) {
                    // 맨 뒤로 이동
                    location = que.size() - 1;
                } else {
                    location--;
                }
            }
        }
        return answer;
    }
}
```

## 7. BEST PRACTICE
- 전달받은 우선순위를 큐에 담습니다.
- 우선순위를 오름차순으로 정렬합니다.
- 큐가 모두 비워질 때까지 반복 수행합니다.
- 현재 큐에서 꺼낸 값이 최우선 순위인지 priorities 배열 맨 마지막부터 확인합니다.
- 최우선 순위인 경우 순서(answer)를 증가시키고 위치(l)를 감소시킵니다.
- 위치가 0보다 작아진 경우 반복문을 탈출합니다.
- 최우선 순위가 아닌 경우 큐의 맨 뒤로 이동시킵니다.
- 위치 값을 감소시키고, 만약 0보다 작아진 경우에는 위치 값을 리스트의 맨 마지막 값으로 변경합니다.

```java
import java.util.Arrays;
import java.util.LinkedList;
import java.util.Queue;

class Solution {
    public int solution(int[] priorities, int location) {
        int answer = 0;
        int l = location;
        Queue<Integer> que = new LinkedList<Integer>();
        for (int i : priorities) {
            que.add(i);
        }
        Arrays.sort(priorities);
        int size = priorities.length - 1;
        while (!que.isEmpty()) {
            Integer i = que.poll();
            if (i == priorities[size - answer]) {
                answer++;
                l--;
                if (l < 0) {
                    break;
                }
            } else {
                que.add(i);
                l--;
                if (l < 0) {
                    l = que.size() - 1;
                }
            }
        }
        return answer;
    }
}
```