---
title: "[programmers] 완주하지 못한 선수"
search: false
category:
  - problem
  - algorithm
last_modified_at: 2021-04-09T09:00:00
---

<br>

## 1. 문제 Link
- <https://programmers.co.kr/learn/courses/30/lessons/42576>

## 2. 문제 설명
수많은 마라톤 선수들이 마라톤에 참여하였습니다. 단 한 명의 선수를 제외하고는 모든 선수가 마라톤을 완주하였습니다.

마라톤에 참여한 선수들의 이름이 담긴 배열 participant와 완주한 선수들의 이름이 담긴 배열 completion이 주어질 때, 
완주하지 못한 선수의 이름을 return 하도록 solution 함수를 작성해주세요.

## 3. 제한 사항
- 마라톤 경기에 참여한 선수의 수는 1명 이상 100,000명 이하입니다.
- completion의 길이는 participant의 길이보다 1 작습니다.
- 참가자의 이름은 1개 이상 20개 이하의 알파벳 소문자로 이루어져 있습니다.
- 참가자 중에는 동명이인이 있을 수 있습니다.

## 4. 입출력 예

| participant | completion | return |
|---|---|---|
| ["leo", "kiki", "eden"] | ["eden", "kiki"] | "leo" |
| ["marina", "josipa", "nikola", "vinko", "filipa"] | ["josipa", "filipa", "marina", "nikola"] | "vinko" |
| ["mislav", "stanko", "mislav", "ana"] | ["stanko", "ana", "mislav"] | "mislav" |

## 5. 코드 해설
- 참여자 정보를 participantsMap 객체에 담습니다.
- 완주자 정보를 completionsMap 객체에 담습니다.
- 참여자 이름을 기준으로 반복 수행합니다.
- 참여자 이름이 완주자 명단에 존재한다면 참여자 수와 완주자 수를 비교합니다. 
- 참여자 수와 완주자 수가 다른 경우 해당 이름이 완주하지 못한 사람의 이름입니다.
- 참여자 이름이 완주자 명단에 없으면 해당 이름이 완주하지 못한 사람의 이름입니다.

## 6. 제출 코드

```java
import java.util.HashMap;
import java.util.Map;

class Solution {
    public String solution(String[] participants, String[] completions) {

        // 참여자 이름과 참석자 수를 담는 맵
        Map<String, Integer> participantsMap = new HashMap<>();
        Map<String, Integer> completionsMap = new HashMap<>();

        for (String participant : participants) {
            if (participantsMap.containsKey(participant)) {
                int number = participantsMap.get(participant);
                participantsMap.put(participant, number + 1);
            } else {
                participantsMap.put(participant, 0);
            }
        }

        for (String completion : completions) {
            if (completionsMap.containsKey(completion)) {
                int number = completionsMap.get(completion);
                completionsMap.put(completion, number + 1);
            } else {
                completionsMap.put(completion, 0);
            }
        }

        // 참여자 탐색
        String answer = "";
        for (String participant : participantsMap.keySet()) {
            int participantNumber = participantsMap.get(participant);
            if (completionsMap.containsKey(participant)) {
                int completionNumber = completionsMap.get(participant);
                if (participantNumber != completionNumber) {
                    answer = participant;
                    break;
                }
            } else {
                answer = participant;
                break;
            }
        }

        return answer;
    }
}
```

## 7. BEST PRACTICE
- 참여자 명단을 hm 객체에 담으면서 참여자 수를 1 씩 증가시킵니다.
- 완주자 명단을 기준으로 hm 객체에 담긴 참여자 수를 1 씩 감소시킵니다.
- hm 객체에 담긴 참여자 이름으로 반복 수행하면서 담긴 값이 0 인지 확인합니다.
- 0 이 아닌 경우 참여자 수와 완주자 수가 다름으로 해당 이름이 완주하지 못한 사람의 이름입니다.

```java
import java.util.HashMap;

class Solution {
    public String solution(String[] participant, String[] completion) {
        String answer = "";
        HashMap<String, Integer> hm = new HashMap<>();
        for (String player : participant) {
            hm.put(player, hm.getOrDefault(player, 0) + 1);
        }
        for (String player : completion) {
            hm.put(player, hm.get(player) - 1);
        }
        for (String key : hm.keySet()) {
            if (hm.get(key) != 0) {
                answer = key;
            }
        }
        return answer;
    }
}
```

## OPINION
BEST PRACTICE를 보면 HashMap 클래스에 getOrDefault() 메소드를 통해 불필요한 if-else 구문이 없앴습니다. 
참여자 수와 완주자 수가 다름을 더하고 뺏을 때 0 값이 되는 것을 이용하여 짧고 가독성 좋은 코드가 되었습니다. 
또한 하나의 MAP 객체만 이용 가능하여 메모리 측면에서도 더 효율적인 코드를 작성하였습니다. 
👍👍 **'Two thumbs up!'** 드리도록 하겠습니다.