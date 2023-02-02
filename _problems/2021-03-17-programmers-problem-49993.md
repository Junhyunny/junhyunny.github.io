---
title: "[programmers] 스킬트리"
search: false
category:
  - problem
  - algorithm
last_modified_at: 2021-03-17T18:00:00
---

<br/>

## 1. 문제 Link
- <https://programmers.co.kr/learn/courses/30/lessons/49993>

## 2. 문제 설명
선행 스킬이란 어떤 스킬을 배우기 전에 먼저 배워야 하는 스킬을 뜻합니다. 
예를 들어 선행 스킬 순서가 스파크 → 라이트닝 볼트 → 썬더일때, 썬더를 배우려면 먼저 라이트닝 볼트를 배워야 하고, 
라이트닝 볼트를 배우려면 먼저 스파크를 배워야 합니다. 
위 순서에 없는 다른 스킬(힐링 등)은 순서에 상관없이 배울 수 있습니다. 
따라서 스파크 → 힐링 → 라이트닝 볼트 → 썬더와 같은 스킬트리는 가능하지만, 썬더 → 스파크나 라이트닝 볼트 → 스파크 → 힐링 → 썬더와 같은 스킬트리는 불가능합니다. 
선행 스킬 순서 skill과 유저들이 만든 스킬트리1를 담은 배열 skill_trees가 매개변수로 주어질 때, 가능한 스킬트리 개수를 return 하는 solution 함수를 작성해주세요. 

## 3. 제한 사항
- 스킬은 알파벳 대문자로 표기하며, 모든 문자열은 알파벳 대문자로만 이루어져 있습니다.
- 스킬 순서와 스킬트리는 문자열로 표기합니다.
    - 예를 들어, C → B → D 라면 "CBD"로 표기합니다
- 선행 스킬 순서 skill의 길이는 1 이상 26 이하이며, 스킬은 중복해 주어지지 않습니다.
- skill_trees는 길이 1 이상 20 이하인 배열입니다.
- skill_trees의 원소는 스킬을 나타내는 문자열입니다.
    - skill_trees의 원소는 길이가 2 이상 26 이하인 문자열이며, 스킬이 중복해 주어지지 않습니다.

## 4. 입출력 예

| skill | skill_trees | return |
|---|---|---|
| "CBD" | ["BACDE", "CBADF", "AECB", "BDA"] | 2 |

## 5. 코드 해설
- 매개변수로 전달받은 스킬 트리를 하나씩 검사합니다.
- 스킬의 선순 스킬부터 해당 스킬 트리에 존재하는지 확인합니다.
- 이전에 검사한 스킬의 인덱스 정보는 beforeIndex, 현재 검사한 스킬의 인덱스 정보는 curIndex에 저장합니다.
- 선순 스킬이 없었는데 현재 검사하는 스킬이 존재하면 false 입니다.
- 현재 검사하는 스킬의 인덱스보다 선순 스킬의 인덱스가 큰 경우에는 false 입니다.
- 정상적으로 선순 스킬 트리를 가지는 케이스인 경우 answer를 증가시킵니다.
- answer를 반환합니다.

## 6. 제출 코드

```java
class Solution {
    public int solution(String skill, String[] skill_trees) {
        int answer = 0;
        for (String skillTree : skill_trees) {
            boolean success = true;
            int strLength = skill.length();
            int beforeIndex = skillTree.indexOf(skill.charAt(0));
            for (int index = 1; index < strLength; index++) {
                int curIndex = skillTree.indexOf(skill.charAt(index));
                if (beforeIndex == -1) {
                    if (curIndex == -1) {
                        continue;
                    } else {
                        success = false;
                        break;
                    }
                }
                if (curIndex == -1) {
                    beforeIndex = curIndex;
                    continue;
                }
                if (beforeIndex >= curIndex) {
                    success = false;
                    break;
                }
                beforeIndex = curIndex;
            }
            if (success) {
                answer++;
            }
        }
        return answer;
    }
}
```

## 7. BEST PRACTICE
- 정규식을 이용하여 코드를 매우 단순하게 구성하였습니다.
- 현재 검사하는 스킬 트리에서 skill을 구성하는 문자들을 제외한 모든 문자를 제거합니다. (replaceAll("[^" + skill + "]", "") 부분)
- 제외한 문자열이 skill 문자열과 동일한지 indexOf 메소드를 이용해 확인합니다.
- 동일하지 않은 경우 이를 스킬 트리 리스트에서 제거합니다.
- 남은 스킬 트리 리스트 사이즈를 반환합니다.

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;

class Solution {
    public int solution(String skill, String[] skill_trees) {
        int answer = 0;
        ArrayList<String> skillTrees = new ArrayList<String>(Arrays.asList(skill_trees));
        Iterator<String> it = skillTrees.iterator();
        while (it.hasNext()) {
            if (skill.indexOf(it.next().replaceAll("[^" + skill + "]", "")) != 0) {
                it.remove();
            }
        }
        answer = skillTrees.size();
        return answer;
    }
}
```
