---
title: "[programmers] 카카오 프렌즈 컬러링북"
search: false
category:
  - problem
  - algorithm
last_modified_at: 2021-04-15T18:00:00
---

<br/>

## 1. 문제 Link
- <https://programmers.co.kr/learn/courses/30/lessons/1829>

## 2. 문제 설명
출판사의 편집자인 어피치는 네오에게 컬러링북에 들어갈 원화를 그려달라고 부탁하여 여러 장의 그림을 받았다. 
여러 장의 그림을 난이도 순으로 컬러링북에 넣고 싶었던 어피치는 영역이 많으면 
색칠하기가 까다로워 어려워진다는 사실을 발견하고 그림의 난이도를 영역의 수로 정의하였다. 
(영역이란 상하좌우로 연결된 같은 색상의 공간을 의미한다.)

그림에 몇 개의 영역이 있는지와 가장 큰 영역의 넓이는 얼마인지 계산하는 프로그램을 작성해보자.

<p align="center"><img src="/images/programmers-problem-1829-1.JPG" width="45%"></p>
<center>https://programmers.co.kr/learn/courses/30/lessons/1829</center>

위의 그림은 총 12개 영역으로 이루어져 있으며, 가장 넓은 영역은 어피치의 얼굴면으로 넓이는 120이다.

## 3. 제한 사항
입력은 그림의 크기를 나타내는 m 과 n, 그리고 그림을 나타내는 m × n 크기의 2차원 배열 picture로 주어진다. 
제한조건은 아래와 같다.
- 1 <= m, n <= 100
- picture의 원소는 0 이상 2^31 - 1 이하의 임의의 값이다.
- picture의 원소 중 값이 0인 경우는 색칠하지 않는 영역을 뜻한다.

### 3.1. 출력 형식
리턴 타입은 원소가 두 개인 정수 배열이다. 
그림에 몇 개의 영역이 있는지와 가장 큰 영역은 몇 칸으로 이루어져 있는지를 리턴한다.

## 4. 입출력 예

| m | n | picture | answer |
|---|---|---|---|
| 6 | 4 | [[1, 1, 1, 0], [1, 2, 2, 0], [1, 0, 0, 1], [0, 0, 0, 1], [0, 0, 0, 3], [0, 0, 0, 3]] | [4, 5] |

## 5. 코드 해설

### 5.1. solution 메소드
- 문제 풀이의 흐름을 제어합니다.
- preProcess 메소드를 이용해 데이터를 전처리합니다.
- 전처리 이후 사진의 전 픽셀을 탐색합니다.
- 방문하지 않은 위치만 탐색을 수행합니다.
- 해당 위치를 기반으로 search 메소드를 이용하여 DFS 탐색을 수행합니다.
- 이전 탐색보다 큰 사이즈를 가지는 영역 탐색이 성공했다면 이를 maxSizeOfOneArea 변수에 저장합니다.
- 분할된 영역의 개수와 가장 큰 영역의 사이즈 정보를 배열에 담아 반환합니다.

```java
    public int[] solution(int m, int n, int[][] picture) {

        boolean[][] visited = new boolean[m][n];

        // 데이터 전처리, 0인 영역은 제외
        preProcess(visited, picture);

        int numberOfArea = 0;
        int maxSizeOfOneArea = 0;

        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                if (!visited[r][c]) {
                    // 새로운 영역 추가
                    numberOfArea++;
                    // 새로운 영역을 만나면 탐색 시작, 연결된 모든 영역을 탐색한다.
                    int temp = search(visited, picture, r, c, 0, picture[r][c]);
                    // 가장 큰 영역을 결정한다.
                    maxSizeOfOneArea = maxSizeOfOneArea > temp ? maxSizeOfOneArea : temp;
                }
            }
        }

        int[] answer = new int[2];
        answer[0] = numberOfArea;
        answer[1] = maxSizeOfOneArea;
        return answer;
    }
```

### 5.2. preProcess 메소드
- 데이터의 전처리를 수행합니다.
- 특정 위치 값이 0 이라면 방문한 것으로 처리합니다.

```java
    private void preProcess(boolean[][] visited, int[][] picture) {
        int rows = picture.length;
        int cols = picture[0].length;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (picture[r][c] == 0) {
                    visited[r][c] = true;
                }
            }
        }
    }
```

### 5.3. search 메소드
- DFS 탐색을 수행합니다.
- 현재 방문하는 사진 위치는 rowIndex, colIndex 입니다.
- cnt 는 여태 방문한 픽셀의 수입니다.
- valus 는 현재 탐색의 기준이 되는 색상 정보입니다.
- 영역을 벗어나면 현재까지 방문한 픽셀 수를 반환합니다.
- 방문한 위치인 경우 현재까지 방문한 픽셀 수를 반환합니다.
- 현재 탐색 중인 색상과 다른 색상을 가지는 위치인 경우 현재까지 방문한 픽셀 수를 반환합니다.
- 현재 위치를 방문 처리합니다.
- 상, 하, 좌, 우 위치를 탐색합니다.
- 재귀 함수를 이용해 구한 cnt 값을 반환합니다.

```java
    public int search(boolean[][] visited, int[][] picture, int rowIndex, int colIndex, int cnt, int value) {
        int rows = picture.length;
        int cols = picture[0].length;
        // 영역을 벗어나는 순간 stop
        if (rowIndex >= rows || rowIndex < 0) {
            return cnt;
        }
        if (colIndex >= cols || colIndex < 0) {
            return cnt;
        }
        // 방문한 영역이면 stop
        if (visited[rowIndex][colIndex]) {
            return cnt;
        }
        // 탐색할 영역이 기준인 값이랑 다르면 탐색 종료
        if (picture[rowIndex][colIndex] != value) {
            return cnt;
        }
        // 방문한 영역이 아니면 위, 아래, 좌, 우 탐색
        // 현재 영역 개수 추가
        cnt++;
        visited[rowIndex][colIndex] = true;
        cnt = search(visited, picture, rowIndex - 1, colIndex, cnt, value);
        cnt = search(visited, picture, rowIndex + 1, colIndex, cnt, value);
        cnt = search(visited, picture, rowIndex, colIndex - 1, cnt, value);
        cnt = search(visited, picture, rowIndex, colIndex + 1, cnt, value);
        return cnt;
    }
```

## 6. 제출 코드

```java
class Solution {

    public int search(boolean[][] visited, int[][] picture, int rowIndex, int colIndex, int cnt, int value) {
        int rows = picture.length;
        int cols = picture[0].length;
        // 영역을 벗어나는 순간 stop
        if (rowIndex >= rows || rowIndex < 0) {
            return cnt;
        }
        if (colIndex >= cols || colIndex < 0) {
            return cnt;
        }
        // 방문한 영역이면 stop
        if (visited[rowIndex][colIndex]) {
            return cnt;
        }
        // 탐색할 영역이 기준인 값이랑 다르면 탐색 종료
        if (picture[rowIndex][colIndex] != value) {
            return cnt;
        }
        // 방문한 영역이 아니면 위, 아래, 좌, 우 탐색
        // 현재 영역 개수 추가
        cnt++;
        visited[rowIndex][colIndex] = true;
        cnt = search(visited, picture, rowIndex - 1, colIndex, cnt, value);
        cnt = search(visited, picture, rowIndex + 1, colIndex, cnt, value);
        cnt = search(visited, picture, rowIndex, colIndex - 1, cnt, value);
        cnt = search(visited, picture, rowIndex, colIndex + 1, cnt, value);
        return cnt;
    }

    private void preProcess(boolean[][] visited, int[][] picture) {
        int rows = picture.length;
        int cols = picture[0].length;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (picture[r][c] == 0) {
                    visited[r][c] = true;
                }
            }
        }
    }

    public int[] solution(int m, int n, int[][] picture) {

        boolean[][] visited = new boolean[m][n];

        // 데이터 전처리, 0인 영역은 제외
        preProcess(visited, picture);

        int numberOfArea = 0;
        int maxSizeOfOneArea = 0;

        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                if (!visited[r][c]) {
                    // 새로운 영역 추가
                    numberOfArea++;
                    // 새로운 영역을 만나면 탐색 시작, 연결된 모든 영역을 탐색한다.
                    int temp = search(visited, picture, r, c, 0, picture[r][c]);
                    // 가장 큰 영역을 결정한다.
                    maxSizeOfOneArea = maxSizeOfOneArea > temp ? maxSizeOfOneArea : temp;
                }
            }
        }

        int[] answer = new int[2];
        answer[0] = numberOfArea;
        answer[1] = maxSizeOfOneArea;
        return answer;
    }
}
```