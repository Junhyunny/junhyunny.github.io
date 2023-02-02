---
title: "[programmers] 크레인 인형뽑기 게임"
search: false
category:
  - problem
  - algorithm
  - data-structure
last_modified_at: 2021-03-03T18:00:00
---

<br/>

## 1. 문제 Link
- <https://programmers.co.kr/learn/courses/30/lessons/64061>

## 2. 문제 설명
[문제 Link][problem-link]를 참고하세요.

## 3. 제한 사항
- board 배열은 2차원 배열로 크기는 "5 x 5" 이상 "30 x 30" 이하입니다.
- board의 각 칸에는 0 이상 100 이하인 정수가 담겨있습니다.
  - 0은 빈 칸을 나타냅니다.
  - 1 ~ 100의 각 숫자는 각기 다른 인형의 모양을 의미하며 같은 숫자는 같은 모양의 인형을 나타냅니다.
- moves 배열의 크기는 1 이상 1,000 이하입니다.
- moves 배열 각 원소들의 값은 1 이상이며 board 배열의 가로 크기 이하인 자연수입니다.

## 4. 입출력 예

| board | moves | result |
|---|---|:---:|
| [[0,0,0,0,0],[0,0,1,0,3],[0,2,5,0,1],[4,2,4,4,2],[3,5,1,3,1]] | [1,5,3,5,1,2,1,4] | 4 |

## 5. 코드 해설
- 인형을 옮겨 담을 temp 배열을 선언합니다. Stack 자료구조를 사용해도 좋습니다.
- 전달받은 move 배열만큼 반복 수행합니다.
- 인형을 보드 배열에서 꺼내기 위한 search 메소드를 호출합니다.
  - 인형 보드 배열과 인형을 꺼낼 위치를 전달하면 가장 위에 있는 인형을 전달합니다.
  - 인형이 없으면 0을 반환합니다.
  - 인형을 꺼낸 위치는 0으로 변경합니다.
- 인형을 꺼내지 못했다면 다음 move를 수행합니다.
- search 메소드를 통해 꺼낸 인형과 temp 배열 가장 위에 존재하는 인형이 동일한지 비교합니다.
  - 동일하면 2개의 인형이 없어지므로 answer 값을 2 증가시킵니다.
  - temp 배열의 맨 위를 가르키는 pos 값을 1 감소시킵니다.
  - 동일하지 않으면 맨 위에 temp 배열 맨 뒤에 인형 값을 전달하고 pos 값을 1 증가시킵니다.
- aswer를 반환합니다. 

## 6. 제출 코드

```java
class Solution {

    public int search(int[][] board, int move) {
        int result = 0;
        int rowLength = board.length;
        // 위에서부터 탐색
        for (int row = 0; row < rowLength; row++) {
            int character = board[row][move];
            if (character != 0) {
                board[row][move] = 0;
                result = character;
                break;
            }
        }
        return result;
    }

    public int solution(int[][] board, int[] moves) {
        int answer = 0;
        int pos = 0;
        int[] temp = new int[901];
        int movesLength = moves.length;
        for (int index = 0; index < movesLength; index++) {
            int move = moves[index];
            int character = search(board, move - 1);
            if (character == 0) {
                continue;
            }
            if (temp[pos] == character) {
                answer += 2;
                temp[pos] = 0;
                pos--;
            } else {
                temp[pos + 1] = character;
                pos++;
            }
        }
        return answer;
    }
}
```

[problem-link]: https://programmers.co.kr/learn/courses/30/lessons/64061