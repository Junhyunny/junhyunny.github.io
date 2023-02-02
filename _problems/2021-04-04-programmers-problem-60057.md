---
title: "[programmers] 문자열 압축"
search: false
category:
  - problem
  - algorithm
last_modified_at: 2021-04-04T18:00:00
---

<br/>

## 1. 문제 Link
- <https://programmers.co.kr/learn/courses/30/lessons/60057>

## 2. 문제 설명
데이터 처리 전문가가 되고 싶은 "어피치"는 문자열을 압축하는 방법에 대해 공부를 하고 있습니다. 
최근에 대량의 데이터 처리를 위한 간단한 비손실 압축 방법에 대해 공부를 하고 있는데, 
문자열에서 같은 값이 연속해서 나타나는 것을 그 문자의 개수와 반복되는 값으로 표현하여 더 짧은 문자열로 줄여서 표현하는 알고리즘을 공부하고 있습니다.

간단한 예로 "aabbaccc"의 경우 "2a2ba3c"(문자가 반복되지 않아 한 번만 나타난 경우 1은 생략함)와 같이 표현할 수 있는데, 
이러한 방식은 반복되는 문자가 적은 경우 압축률이 낮다는 단점이 있습니다. 
예를 들면, "abcabcdede"와 같은 문자열은 전혀 압축되지 않습니다. 
"어피치"는 이러한 단점을 해결하기 위해 문자열을 1개 이상의 단위로 잘라서 압축하여 더 짧은 문자열로 표현할 수 있는지 방법을 찾아보려고 합니다.

예를 들어, "ababcdcdababcdcd"의 경우 문자를 1개 단위로 자르면 전혀 압축되지 않지만, 
2개 단위로 잘라서 압축한다면 "2ab2cd2ab2cd"로 표현할 수 있습니다. 
다른 방법으로 8개 단위로 잘라서 압축한다면 "2ababcdcd"로 표현할 수 있으며, 이때가 가장 짧게 압축하여 표현할 수 있는 방법입니다.

다른 예로, "abcabcdede"와 같은 경우, 문자를 2개 단위로 잘라서 압축하면 "abcabc2de"가 되지만, 
3개 단위로 자른다면 "2abcdede"가 되어 3개 단위가 가장 짧은 압축 방법이 됩니다. 
이때 3개 단위로 자르고 마지막에 남는 문자열은 그대로 붙여주면 됩니다.

압축할 문자열 s가 매개변수로 주어질 때, 
위에 설명한 방법으로 1개 이상 단위로 문자열을 잘라 압축하여 표현한 문자열 중 가장 짧은 것의 길이를 return 하도록 solution 함수를 완성해주세요.

## 3. 제한 사항
- s의 길이는 1 이상 1,000 이하입니다.
- s는 알파벳 소문자로만 이루어져 있습니다.

## 4. 입출력 예

| s | result |
|---|---|
| "aabbaccc" | 7 |
| "ababcdcdababcdcd" | 9 |
| "abcabcdede" | 8 |
| "abcabcabcabcdededededede" | 14 |
| "xababcdcdababcdcd" | 17 |

## 5. 코드 해설
- 문자열을 압축할 길이를 compressLength 변수로 지정하여 반복 수행합니다.
- 총 문자열의 절반까지만 수행하면 되므로 (length / 2) 횟수만큼 반복합니다.
- compress 메소드를 이용해 문자열을 압축해보고 가장 작은 수가 나오면 이를 answer 변수에 저장합니다.
- startIndex 부터 compressLength 만큼 substring 메소드를 수행합니다.
- (startIndex + compressLength) 값이 총 문자열 길이를 넘지 않을 때까지 반복 수행합니다. 
- 이전 문자열 before와 현재 문자열 current가 같다면 반복 횟수 count를 증가시킵니다.
- 같아지지 않는 경우에 압축 결과를 담는 buf 객체에 해당 before 문자열을 추가합니다.
- count가 1인 경우에는 문자열만, 2 이상인 경우에는 앞에 숫자를 함께 전달합니다.
- 반복문 수행이 끝난 이후에 남은 문자열을 buf 객체에 추가합니다.

## 6. 제출 코드

```java
class Solution {
    
    private String compress(String s, int startIndex, int compressLength) {
        StringBuffer buf = new StringBuffer(s.substring(0, startIndex));
        int length = s.length();
        int count = 1;
        String before = null;
        while (startIndex + compressLength <= length) {
            String current = s.substring(startIndex, startIndex + compressLength);
            startIndex = startIndex + compressLength;
            if (before == null) {
                before = current;
                continue;
            }
            if (before.equals(current)) {
                count++;
            } else {
                if (count == 1) {
                    buf.append(before);
                } else {
                    buf.append(count).append(before);
                }
                count = 1;
                before = current;
            }
        }
        // 마지막 before append
        if (count == 1) {
            buf.append(before);
        } else {
            buf.append(count).append(before);
        }
        // 나머지 문자열 append
        if (startIndex != length) {
            buf.append(s.substring(startIndex, length));
        }
        return buf.toString();
    }

    public int solution(String s) {
        int length = s.length();
        int answer = length;
        for (int compressLength = 1; compressLength <= length / 2; compressLength++) {
            int temp = compress(s, 0, compressLength).length();
            answer = answer < temp ? answer : temp;
        }
        return answer;
    }
}
```

## 7. BEST PRACTICE
- 압축할 길이를 증가시키며 getSplitedLength 메소드를 반복 수행합니다.
- preString 변수는 앞에 잘라낸 문자열, postString 변수는 남은 문자열을 참조합니다.
- startsWith 메소드를 통해 postString 객체가 preString 객체 값으로 시작하는지 확인합니다. 
- postString 객체가 preString 객체 값으로 시작하지 않는 CASE
    - repeat 값이 1 이라면 앞 문자열을 그래로 붙혀 재귀 함수를 수행합니다.<br/>
      (preString + getSplitedLength(postString, n, 1))
    - repeat 값이 1 아니라면 반복 수행 횟수 repeat 값을 앞에 붙혀 재귀 함수를 수행합니다.<br/>
      (Integer.toString(repeat) + preString + getSplitedLength(postString, n, 1))
- postString 객체가 preString 객체 값으로 시작하는 CASE
    - repeat 값에 1을 증가시켜 getSplitedLength 재귀 함수를 수행합니다.

```java
class Solution {

    public int solution(String s) {
        int answer = 0;
        for (int i = 1; i <= (s.length() / 2) + 1; i++) {
            int result = getSplitedLength(s, i, 1).length();
            answer = i == 1 ? result : (answer > result ? result : answer);
        }
        return answer;
    }

    public String getSplitedLength(String s, int n, int repeat) {
        if (s.length() < n) {
            return s;
        }
        String result = "";
        String preString = s.substring(0, n);
        String postString = s.substring(n, s.length());
        // 불일치 -> 현재까지 [반복횟수 + 반복문자] 조합
        if (!postString.startsWith(preString)) {
            if (repeat == 1) {
                return result += preString + getSplitedLength(postString, n, 1);
            }
            return result += Integer.toString(repeat) + preString + getSplitedLength(postString, n, 1);
        }
        return result += getSplitedLength(postString, n, repeat + 1);
    }
}
```