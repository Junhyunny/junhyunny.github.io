---
title: "[programmers] 멀쩡한 사각형"
search: false
category:
  - problem
  - algorithm
last_modified_at: 2021-03-09T18:00:00
---

<br/>

## 1. 문제 Link
- <https://programmers.co.kr/learn/courses/30/lessons/62048>

## 2. 문제 설명
가로 길이가 Wcm, 세로 길이가 Hcm인 직사각형 종이가 있습니다. 
종이에는 가로, 세로 방향과 평행하게 격자 형태로 선이 그어져 있으며, 모든 격자칸은 1cm x 1cm 크기입니다. 
이 종이를 격자 선을 따라 1cm × 1cm의 정사각형으로 잘라 사용할 예정이었는데, 누군가가 이 종이를 대각선 꼭지점 2개를 잇는 방향으로 잘라 놓았습니다. 
그러므로 현재 직사각형 종이는 크기가 같은 직각삼각형 2개로 나누어진 상태입니다. 
새로운 종이를 구할 수 없는 상태이기 때문에, 이 종이에서 원래 종이의 가로, 세로 방향과 평행하게 1cm × 1cm로 잘라 사용할 수 있는 만큼만 사용하기로 하였습니다. 
가로의 길이 W와 세로의 길이 H가 주어질 때, 사용할 수 있는 정사각형의 개수를 구하는 solution 함수를 완성해 주세요.

## 3. 제한 사항
- W, H : 1억 이하의 자연수

## 4. 입출력 예

| W | H | result |
|---|---|---|
| 8 | 12 | 80 |

## 5. 코드 해설
- 폭(w)과 높이(h)가 같은 경우에는 대각선에 위치한 블럭들만 정확히 잘리므로 총 개수에서 w 개수를 뺀 값을 반환합니다.
- 다른 경우에는 각 x 좌표가 커짐에 따라 차지하는 칸 수를 계산해야합니다.
- 계산량을 줄이기 위해 폭과 높에 중에 큰 값을 yMax, 작은 값을 xMax로 지정합니다.
- x 좌표가 1인 위치부터 아래 계산을 반복 수행합니다.
    - x - 1 위치의 y 좌표 값을 내림하여 floor 변수에 저장합니다.
    - x 위치의 y 좌표 값을 올림하여 ceil 변수에 저장합니다.
    - ceil 값에서 floor 값을 빼면 x - 1 좌표에서 x 좌표 사이에 잘라지는 칸 수를 구할 수 있습니다.
- answer(총 칸 수) 값에서 cnt(잘라진 칸 수) 값을 뺀 후 이를 반환합니다.

## 6. 제출 코드

```java
class Solution {
    public long solution(long w, long h) {
        long cnt = 0;
        long answer = w * h;
        if (((double) h / w) == 1) {
            return answer - w;
        } else {
            long yMax = h > w ? h : w;
            long xMax = h > w ? w : h;
            for (long x = 1; x <= xMax; x++) {
                long ceil = (new Double(Math.ceil(yMax * x / (double) xMax))).longValue();
                long floor = (new Double(Math.floor(yMax * (x - 1) / (double) xMax))).longValue();
                cnt = cnt + (ceil - floor);
            }
        }
        return answer - cnt;
    }
}
```

## 7. 문제 발생 및 해결
- W, H 가 최대 1억까지 값을 가질 수 있기 때문에 오버플로우가 발생합니다. long을 사용합니다.
- double의 부동 소수점 계산으로 인해 결과 값이 달라집니다.
    - 컴퓨터의 (yMax * x / (double) xMax) 값과 (yMax / (double) xMax * x) 값이 달라집니다.

### 7.1. 테스트 코드
- 값이 달라지는 케이스가 어느 시점인지 간단한 테스트 코드를 작성해보았습니다.

```java
package algorithm;

class Solution {

    public static void main(String[] args) {
        long yMax = 100000000;
        long xMax = 99999999;
        int ceilDiff = 0;
        int floorDiff = 0;
        for (long x = 0; x <= xMax; x++) {
            long multipleFirstCeilLong = (new Double(Math.ceil(yMax * x / (double) xMax))).longValue();
            long multipleLaterCeilLong = (new Double(Math.ceil(yMax / (double) xMax * x))).longValue();
            long multipleFirstFloorLong = (new Double(Math.floor(yMax * x / (double) xMax))).longValue();
            long multipleLaterFloorLong = (new Double(Math.floor(yMax / (double) xMax * x))).longValue();
            double multipleFirst = yMax * x / (double) xMax;
            double multipleLater = yMax / (double) xMax * x;
            if (multipleFirstCeilLong != multipleLaterCeilLong) {
                ceilDiff++;
                System.out.println("x: " + x + ", 기울기: " + (yMax / (double) xMax) + ", multipleFirst: " + multipleFirst + ", multipleLater: " + multipleLater);
                System.out.println("multipleFirstCeilLong: " + multipleFirstCeilLong + ", multipleLaterCeilLong: " + multipleLaterCeilLong);
            }
            if (multipleFirstFloorLong != multipleLaterFloorLong) {
                floorDiff++;
                System.out.println("x: " + x + ", 기울기: " + (yMax / (double) xMax) + ", multipleFirst: " + multipleFirst + ", multipleLater: " + multipleLater);
                System.out.println("multipleFirstFloorLong: " + multipleFirstFloorLong + ", multipleLaterFloorLong: " + multipleLaterFloorLong);
            }
        }
        System.out.println("계산 결과 값이 달라지는 케이스 올림: " + ceilDiff + ", 내림: " + floorDiff + "회");
    }
}
```

##### 테스트 결과
<p align="left"><img src="/images/programmers-problem-62048-1.JPG"></p>
