---
title: "[programmers] 삼각 달팽이"
search: false
category:
  - problem
  - algorithm
last_modified_at: 2021-04-11T18:00:00
---

<br/>

## 1. 문제 Link
- <https://programmers.co.kr/learn/courses/30/lessons/68645>

## 2. 문제 설명
정수 n이 매개변수로 주어집니다. 
다음 그림과 같이 밑변의 길이와 높이가 n인 삼각형에서 맨 위 꼭짓점부터 반시계 방향으로 달팽이 채우기를 진행한 후, 
첫 행부터 마지막 행까지 모두 순서대로 합친 새로운 배열을 return 하도록 solution 함수를 완성해주세요.

<p align="center"><img src="/images/programmers-problem-68645-1.JPG" width="80%"></p>
<center>https://programmers.co.kr/learn/courses/30/lessons/68645</center>

## 3. 제한 사항
- n은 1 이상 1,000 이하입니다.

## 4. 입출력 예

| n | result |
|---|---|
| 4 | [1,2,9,3,10,8,4,5,6,7] |
| 5 | [1,2,12,3,13,11,4,14,15,10,5,6,7,8,9] |
| 6 | [1,2,15,3,16,14,4,17,21,13,5,18,19,20,12,6,7,8,9,10,11] |

## 5. 코드 해설
- n 인 경우 총 배열의 길이는 (n * (n + 1) / 2) 입니다. (등차가 1인 등차 수열의 합)
- map 배열에 value 값을 넣을 때 turnMode 값을 기준으로 배열의 위치를 지정합니다.
    - turnMode = 0 - row 증가, col 고정
    - turnMode = 1 - row 고정, col 증가
    - turnMode = 2 - row 감소, col 감소
- turnMode 값은 turnPoint 값이 0 이 되는 지점마다 변경됩니다.
- turnMode 값은 0 > 1 > 2 > 0 순서로 반복적으로 변경됩니다.
- turnPoint 값이 0 이 되면 새로운 turnPoint 에 이전 초기 turnPoint 값보다 1 작은 값을 지정합니다.
- value 값이 answerSize + 1 값이 될 때까지 반복 수행합니다.
- map 배열에 저장된 값을 순차적으로 answer 배열에 넣어줍니다.(0 인 값 제외)

## 6. 제출 코드

```java
class Solution {
    public int[] solution(int n) {
        int answerSize = n * (n + 1) / 2;
        int[][] map = new int[n][n];
        int[] answer = new int[answerSize];
        int turnPoint = n;
        int turnMode = 0;
        int value = 1;
        int row = 0;
        int col = 0;
        while (value != answerSize + 1) {
            turnPoint--;
            if (turnMode == 0) {
                map[row++][col] = value;
            } else if (turnMode == 1) {
                map[row][col++] = value;
            } else if (turnMode == 2) {
                map[row--][col--] = value;
            }
            value++;
            if (turnPoint == 0) {
                if (turnMode == 0) {
                    row--;
                    col++;
                    turnMode++;
                } else if (turnMode == 1) {
                    row--;
                    col -= 2;
                    turnMode++;
                } else if (turnMode == 2) {
                    row += 2;
                    col++;
                    turnMode = 0;
                }
                n--;
                turnPoint = n;
            }
        }
        int cnt = 0;
        int rowSize = map.length;
        int colSize = map[0].length;
        for (int index = 0; index < rowSize; index++) {
            for (int subIndex = 0; subIndex < colSize; subIndex++) {
                if (map[index][subIndex] == 0) {
                    break;
                }
                answer[cnt++] = map[index][subIndex];
            }
        }
        return answer;
    }
}
```

## 7. BEST PRACTICE
- n 인 경우 총 배열의 길이는 (n * (n + 1) / 2) 입니다. (등차가 1인 등차 수열의 합)
- 바깥 쪽 반복문을 제어하는 i 값은 입력해나가는 방향을 제어합니다.(위 풀이의 turnMode 값과 동일한 역할 수행)
- matrix 배열에 num 값을 넣을 때 i 값을 기준으로 배열의 위치를 지정합니다.
    - i % 3 = 0 - row 증가, col 고정
    - i % 3 = 1 - row 고정, col 증가
    - i % 3 = 2 - row 감소, col 감소
- 안 쪽 반복문을 제어하는 j 값은 방향 별로 입력해야 할 갯수를 제어합니다.(위 풀이의 turnPoint 값과 동일한 역할 수행)
- matrix 배열에 저장된 값을 순차적으로 answer 배열에 넣어줍니다.(0 인 값 제외)

```java
class Solution {
    public int[] solution(int n) {
        int[] answer = new int[(n * (n + 1)) / 2];
        int[][] matrix = new int[n][n];
        int x = -1, y = 0;
        int num = 1;
        for (int i = 0; i < n; ++i) {
            for (int j = i; j < n; ++j) {
                if (i % 3 == 0) {
                    ++x;
                } else if (i % 3 == 1) {
                    ++y;
                } else if (i % 3 == 2) {
                    --x;
                    --y;
                }
                matrix[x][y] = num++;
            }
        }
        int k = 0;
        for (int i = 0; i < n; ++i) {
            for (int j = 0; j < n; ++j) {
                if (matrix[i][j] == 0)
                    break;
                answer[k++] = matrix[i][j];
            }
        }

        return answer;
    }
}
```