---
title: "[leetcode] number-of-enclaves"
search: false
category:
  - problem
  - algorithm
last_modified_at: 2021-05-16T18:00:00
---

<br/>

## 1. 문제 Link
- <https://leetcode.com/problems/number-of-enclaves/>

## 2. 문제 설명
You are given an m x n binary matrix grid, where 0 represents a sea cell and 1 represents a land cell. 
A move consists of walking from one land cell to another adjacent (4-directionally) land cell or walking off the boundary of the grid. 
Return the number of land cells in grid for which we cannot walk off the boundary of the grid in any number of moves. 

## 3. 제한 사항
- m == grid.length
- n == grid[i].length
- 1 <= m, n <= 500
- grid[i][j] is either 0 or 1.

## 4. 입출력 예

### 4.1. 예시1

<p align="center"><img src="/images/leetcode-problem-1020-1.JPG" width="25%"></p>
<center>https://leetcode.com/problems/number-of-enclaves/</center>

- Input: grid = [[0,0,0,0],[1,0,1,0],[0,1,1,0],[0,0,0,0]]
- Output: 3
- Explanation: There are three 1s that are enclosed by 0s, and one 1 that is not enclosed because its on the boundary.

### 4.2. 예시2

<p align="center"><img src="/images/leetcode-problem-1020-2.JPG" width="25%"></p>
<center>https://leetcode.com/problems/number-of-enclaves/</center>

- Input: grid = [[0,1,1,0],[0,0,1,0],[0,0,1,0],[0,0,0,0]]
- Output: 0
- Explanation: All 1s are either on the boundary or can reach the boundary.

## 5. 코드 해설

### 5.1. numEnclaves 메소드
- 내부에 고립된 칸의 개수를 찾는 문제입니다. 
- 전달받은 grid 배열의 가장 자리만 DFS 탐색을 수행합니다.
- 탐색이 끝난 후 탐색하지 못한 섬의 개수를 반환합니다.

```java
    public int numEnclaves(int[][] grid) {
        for (int row = 0; row < grid.length; row++) {
            search(grid, row, 0);
            search(grid, row, grid[0].length - 1);
        }
        for (int col = 0; col < grid[0].length; col++) {
            search(grid, 0, col);
            search(grid, grid.length - 1, col);
        }
        return count(grid);
    }
```

### 5.2. search 메소드
- row에 대해 범위를 벗어나는 경우인지 확인합니다.
- col에 대해 범위를 벗어나는 경우인지 확인합니다.
- 해당 위치가 섬인지 확인합니다.
- 섬인 경우에는 방문의 표시로 배열 값을 2로 변경합니다.
- 상, 하, 좌, 우에 대해 재귀적인 탐색을 수행합니다.

```java
    void search(int[][] grid, int row, int col) {
        if (row < 0 || row >= grid.length) {
            return;
        }
        if (col < 0 || col >= grid[0].length) {
            return;
        }
        if (grid[row][col] != 1) {
            return;
        }
        grid[row][col] = 2;
        search(grid, row - 1, col);
        search(grid, row + 1, col);
        search(grid, row, col - 1);
        search(grid, row, col + 1);
    }
```

### 5.3. numEnclaves 메소드
- 배열의 가장 자리를 제외한 영역을 탐색합니다.
- 값이 1인 경우에는 고립되어 탐색되지 않은 영역이므로 result 수를 증가시킵니다.
- 고립된 칸의 개수를 반환합니다.

```java
    int count(int[][] grid) {
        int result = 0;
        for (int row = 1; row < grid.length - 1; row++) {
            for (int col = 1; col < grid[0].length - 1; col++) {
                if (grid[row][col] == 1) {
                    result++;
                }
            }
        }
        return result;
    }
```

## 6. 제출 코드

```java
class Solution {

    int count(int[][] grid) {
        int result = 0;
        for (int row = 1; row < grid.length - 1; row++) {
            for (int col = 1; col < grid[0].length - 1; col++) {
                if (grid[row][col] == 1) {
                    result++;
                }
            }
        }
        return result;
    }

    void search(int[][] grid, int row, int col) {
        if (row < 0 || row >= grid.length) {
            return;
        }
        if (col < 0 || col >= grid[0].length) {
            return;
        }
        if (grid[row][col] != 1) {
            return;
        }
        grid[row][col] = 2;
        search(grid, row - 1, col);
        search(grid, row + 1, col);
        search(grid, row, col - 1);
        search(grid, row, col + 1);
    }

    public int numEnclaves(int[][] grid) {
        for (int row = 0; row < grid.length; row++) {
            search(grid, row, 0);
            search(grid, row, grid[0].length - 1);
        }
        for (int col = 0; col < grid[0].length; col++) {
            search(grid, 0, col);
            search(grid, grid.length - 1, col);
        }
        return count(grid);
    }
}
```

## CLOSING
영어도 친숙해지고 알고리즘 문제풀이에도 익숙해질 겸 leetcode 문제 풀이를 시작해보았습니다. 
문제 자체가 어렵진 않아 시간이 오래걸리지는 않았습니다. 
프로그래머스와 다르게 다른 사람의 코드를 확인할 수는 없지만 성능과 메모리 측면의 분석 리포트를 보여주는 장점이 있습니다. 

##### 속도 성능
<p align="center"><img src="/images/leetcode-problem-1020-3.JPG" width="70%"></p>

##### 메모리 성능
<p align="center"><img src="/images/leetcode-problem-1020-4.JPG" width="70%"></p>