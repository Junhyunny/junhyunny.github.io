---
title: "[programmers] 다리를 지나는 트럭"
search: false
category:
  - problem
  - algorithm
  - data-structure
last_modified_at: 2021-03-21T18:00:00
---

<br/>

## 1. 문제 Link
- <https://programmers.co.kr/learn/courses/30/lessons/42583>

## 2. 문제 설명
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

## 3. 제한 사항
- bridge_length는 1 이상 10,000 이하입니다.
- weight는 1 이상 10,000 이하입니다.
- truck_weights의 길이는 1 이상 10,000 이하입니다.
- 모든 트럭의 무게는 1 이상 weight 이하입니다.

## 4. 입출력 예

| bridge_length | weight | truck_weights | return |
|---|---|---|---|
| 2 | 10 | [7,4,5,6] | 8 |
| 100 | 100 | [10] | 101 |
| 100 | 100 | [10,10,10,10,10,10,10,10,10,10] | 110 |

## 5. 코드 해설

### 5.1. solution 메소드
- 문제의 주요 흐름을 진행합니다.
- checkAllTrucksPassed 메소드를 통해 모든 차량이 통과하였는지 확인합니다.
- 모든 차량이 통과하지 못했다면 시간을 증가시키면서 아래 반복문을 지속적으로 수행합니다.
    - moveTrucks 메소드를 통해 다리 위의 차량들을 한 칸씩 이동시킵니다.
    - findArrivedTruck 메소드를 통해 도착한 차량의 인덱스를 찾아냅니다.
    - 도착한 차량이 있다면 다리 위에 존재하는 차량들의 무게 합에서 해당 차량 무게를 제거합니다.
    - getCandidateTruck 메소드를 통해 대기 중인 차량들 중에서 가장 빠른 순번의 차량 인덱스를 반환합니다.
    - 무게가 허용 무게를 넘지 않는 경우 해당 인덱스의 차량을 한 대 더 출발시킵니다.

```java
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
```

### 5.2. checkAllTrucksPassed 메소드
- 모든 차량이 이동 완료했는지 확인합니다.
- 이동 완료한 차량은 -1 값을 가집니다.

```java
    // 모두 이동했는지 확인
    public boolean checkAllTrucksPassed(int[] departedTrucks) {
        for (int index = 0; index < departedTrucks.length; index++) {
            if (departedTrucks[index] != -1) {
                return false;
            }
        }
        return true;
    }
```

### 5.3. getCandidateTruck 메소드
- 대기하는 차량 중 가장 빠른 순번의 차량을 반환합니다.

```java
    // 아직 출발 안한 차량
    public int getCandidateTruck(int[] departedTrucks) {
        for (int index = 0; index < departedTrucks.length; index++) {
            if (departedTrucks[index] == 0) {
                return index;
            }
        }
        return -1;
    }
```

### 5.4. moveTrucks 메소드
- 모두 도착한 차량(-1)이거나 대기 중인 차량(0)을 제외하고는 현재 위치를 1씩 증가시켜준다.

```java
    // 한칸씩 이동
    public void moveTrucks(int[] departedTrucks) {
        for (int index = 0; index < departedTrucks.length; index++) {
            if (departedTrucks[index] != -1 && departedTrucks[index] != 0) {
                departedTrucks[index]++;
            }
        }
    }
```

### 5.5. findArrivedTruck 메소드
- 차량의 위치가 다리 길이보다 1 커지는 경우 도착한 차량입니다.
- 도착한 차량의 위치를 -1로 만들고 해당 인덱스를 반환합니다.

```java
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
```

## 6. 제출 코드

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

## 7. BEST PRACTICE
- 트럭 클래스를 생성합니다. 자신의 무게와 이동한 거리를 멤버 변수로 가집니다.
- 대기 중인 차량은 waitQ에 이동 중인 차량은 moveQ에 저장합니다.
- 처음 모든 차량은 waitQ에 존재합니다.
- waitQ와 moveQ가 모두 비어질 때까지 아래 반복문을 수행합니다.
    - moveQ가 비어있다면 waitQ에서 제거한 트럭을 한 대를 moveQ로 이동시킵니다.
    - 현재 다리 위 차량 무게(이하 curWeight)에 해당 차량 무게를 더합니다. 다음 루프를 수행합니다.
    - moveQ에 존재하는 모든 트럭을 한 칸씩 이동시킵니다.
    - moveQ에 먼저 출발한 차량의 이동 거리가 다리 길이보다 큰 경우 해당 차량을 moveQ에서 제거합니다.
    - 현재 curWeight에서 해당 차량 무게를 제거합니다. 
    - waitQ가 비어있지 않고 다음 출발할 차량의 무게와 현재 curWeight과 더하였을 때 제한된 무게를 넘지 않는 경우 차량을 출발시킵니다. 
    - waitQ에서 moveQ로 이동시킨 후 해당 차량 무게를 현재 curWeight에 더합니다. 

```java
import java.util.LinkedList;
import java.util.Queue;

class Solution {

    class Truck {

        int weight;
        int move;

        public Truck(int weight) {
            this.weight = weight;
            this.move = 1;
        }

        public void moving() {
            move++;
        }
    }

    public int solution(int bridgeLength, int weight, int[] truckWeights) {

        Queue<Truck> waitQ = new LinkedList<>();
        Queue<Truck> moveQ = new LinkedList<>();

        for (int t : truckWeights) {
            waitQ.offer(new Truck(t));
        }

        int answer = 0;
        int curWeight = 0;

        while (!waitQ.isEmpty() || !moveQ.isEmpty()) {
            answer++;
            if (moveQ.isEmpty()) {
                Truck t = waitQ.poll();
                curWeight += t.weight;
                moveQ.offer(t);
                continue;
            }
            for (Truck t : moveQ) {
                t.moving();
            }
            if (moveQ.peek().move > bridgeLength) {
                Truck t = moveQ.poll();
                curWeight -= t.weight;
            }
            if (!waitQ.isEmpty() && curWeight + waitQ.peek().weight <= weight) {
                Truck t = waitQ.poll();
                curWeight += t.weight;
                moveQ.offer(t);
            }
        }
        return answer;
    }
}
```

## CLOSING
큐를 이용한 BEST RPACTICE는 가독성과 성능이 모두 좋아서 이를 함께 정리하였습니다. 
제가 제출한 코드를 보면 불필요한 탐색을 하는 코드가 존재하는데 큐를 사용하는 경우 모두 제거 가능한 연산입니다.
- ~~checkAllTrucksPassed 메소드에서 모든 차량이 통과했는지 확인하는 탐색~~
- ~~getCandidateTruck 메소드에서 다음으로 출발할 차량이 존재하는지 확인~~
- ~~findArrivedTruck 메소드에서 도착한 차량이 있는지 확인하는 탐색~~

##### 제출한 코드 성능
<p align="center"><img src="/images/programmers-problem-42583-1.JPG"></p>

##### BEST PRACTICE 코드 성능
<p align="center"><img src="/images/programmers-problem-42583-2.JPG"></p>