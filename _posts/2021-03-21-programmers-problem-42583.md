---
title: "[programmers] 다리를 지나는 트럭"
search: false
category:
  - problem
  - algorithm
last_modified_at: 2021-03-21T00:00:00
---

<br>

## 문제 Link
- <https://programmers.co.kr/learn/courses/30/lessons/42583>

## 문제 설명
트럭 여러 대가 강을 가로지르는 일 차선 다리를 정해진 순으로 건너려 합니다. 
모든 트럭이 다리를 건너려면 최소 몇 초가 걸리는지 알아내야 합니다. 
트럭은 1초에 1만큼 움직이며, 다리 길이는 bridge_length이고 다리는 무게 weight까지 견딥니다. 
※ 트럭이 다리에 완전히 오르지 않은 경우, 이 트럭의 무게는 고려하지 않습니다. 

예를 들어, 길이가 2이고 10kg 무게를 견디는 다리가 있습니다. 
무게가 [7, 4, 5, 6]kg인 트럭이 순서대로 최단 시간 안에 다리를 건너려면 다음과 같이 건너야 합니다.

| 경과 시간 | 다리를 지난 트럭 | 다리를 건너는 트럭 | 대기 트럭 |
|---|---|---|---|
| 0 | [] | [] | [7,4,5,6] |
| 1~2 | [] | [7] | [4,5,6] |
| 3 | [7] | [4] | [5,6] |
| 4 | [7] | [4,5] | [6] |
| 5 | [7,4] | [5] | [6] |
| 6~7 | [7,4,5] | [6] | [] |
| 8 | [7,4,5,6] | [] | [] |

따라서, 모든 트럭이 다리를 지나려면 최소 8초가 걸립니다.

solution 함수의 매개변수로 다리 길이 bridge_length, 다리가 견딜 수 있는 무게 weight, 트럭별 무게 truck_weights가 주어집니다. 
이때 모든 트럭이 다리를 건너려면 최소 몇 초가 걸리는지 return 하도록 solution 함수를 완성하세요. 

## 제한 사항
- bridge_length는 1 이상 10,000 이하입니다.
- weight는 1 이상 10,000 이하입니다.
- truck_weights의 길이는 1 이상 10,000 이하입니다.
- 모든 트럭의 무게는 1 이상 weight 이하입니다.

## 입출력 예

| bridge_length | weight | truck_weights | return |
|---|---|---|---|
| 2 | 10 | [7,4,5,6] | 8 |
| 100 | 100 | [10] | 101 |
| 100 | 100 | [10,10,10,10,10,10,10,10,10,10] | 110 |

## 코드 해설
- 작성 중입니다.

## 제출 코드

```java
class Solution {

    // 모두 이동했는지 확인
    public boolean checkAllTrucksPassed(int[] departedTrucks) {
        for (int index = 0; index < departedTrucks.length; index++) {
            if (departedTrucks[index] != -1) {
                return false;
            }
        }
        return true;
    }

    // 아직 출발 안한 차량
    public int getCandidateTruck(int[] departedTrucks) {
        for (int index = 0; index < departedTrucks.length; index++) {
            if (departedTrucks[index] == 0) {
                return index;
            }
        }
        return -1;
    }

    // 한칸씩 이동
    public void moveTrucks(int[] departedTrucks) {
        for (int index = 0; index < departedTrucks.length; index++) {
            if (departedTrucks[index] != -1 && departedTrucks[index] != 0) {
                departedTrucks[index]++;
            }
        }
    }

    // 도착한 차량 탐색, 도착한 차량은 -1 처리
    public int findArrivedTruck(int bridge_length, int[] departedTrucks) {
        for (int index = 0; index < departedTrucks.length; index++) {
            if (departedTrucks[index] == bridge_length + 1) {
                departedTrucks[index] = -1;
                return index;
            }
        }
        return -1;
    }

    public int solution(int bridge_length, int weight, int[] truck_weights) {
        int answer = 0;
        int totalWeightTrucks = 0;
        // Arrays.sort(truck_weights);
        int[] departedTrucks = new int[truck_weights.length];
        while (!checkAllTrucksPassed(departedTrucks)) {
            answer++;
            // 출발한 차량들 한칸씩 이동
            moveTrucks(departedTrucks);
            // 도착한 차량 존재하는지 확인
            int arriveTruckIndex = findArrivedTruck(bridge_length, departedTrucks);
            // 도착한 차량이 존재하면 무게 감소
            if (arriveTruckIndex != -1) {
                totalWeightTrucks -= truck_weights[arriveTruckIndex];
            }
            int candidateTruckIndex = getCandidateTruck(departedTrucks);
            // 무게가 넘지 않는 경우
            if (candidateTruckIndex != -1 && weight >= totalWeightTrucks + truck_weights[candidateTruckIndex]) {
                // 출발
                departedTrucks[candidateTruckIndex]++;
                // 무게 증가
                totalWeightTrucks += truck_weights[candidateTruckIndex];
            }
        }
        return answer;
    }
}
```

## OPINION
작성 중입니다.