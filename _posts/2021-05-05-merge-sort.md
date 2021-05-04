---
title: "합병 정렬(Merge Sort)"
search: false
category:
  - information
  - algorithm
last_modified_at: 2021-05-05T09:00:00
---

<br>

이번 포스트에서는 알고리즘의 꽃인 정렬에 대한 이야기를 해보려고 합니다. 
최근에 받았던 합병 정렬(merge sort)과 관련된 질문에 대해 정확한 답변을 하지 못 했던 기억이 떠올라 공부할 겸 포스트로 정리하였습니다. 

## 합병 정렬(Merge Sort)
합병 정렬은 다음과 같은 특징을 가집니다. 
- 안정 정렬이며, 분할 정복 알고리즘 중 하나입니다. 
- 시간 복잡도 O(n log n)를 가집니다. 
- 병합하는 과정에서 정렬된 아이템들을 담을 공간이 필요하여 메모리가 많이 사용됩니다.

##### 합병 정렬 동작 방식
<p align="center"><img src="/images/merge-sort-1.gif" width="70%"></p>
<center>이미지 출처, https://en.wikipedia.org/wiki/Merge_sort</center><br>

## 합병 정렬 수행 과정
합병 정렬은 다음과 같은 과정을 통해 수행됩니다.
1. 리스트의 길이가 0, 1 이면 정렬이 완료된 것으로 봅니다.
1. 그렇지 않은 경우에는 절반으로 리스트를 분할합니다.
1. 각 부분의 리스트를 재귀적인 방법으로 계속 잘라나갑니다.
1. 두 부분의 리스트를 다시 하나의 정렬된 리스트로 합병합니다. 

## 합병 정렬의 분할 정복
- 분할(Divide) - 입력 배열을 같은 크기의 2개의 부분 배열로 분할합니다.
- 정복(Conquer) - 부분 배열을 정렬합니다. 부분 배열의 크기가 충분히 작지 않으면 순환 호출을 통해 배열을 분할합니다.
- 결합(Combine) - 정렬된 부분 배열들을 하나의 배열에 합병합니다.

## 합병 정렬 코드 설명
### main 메소드
- mergeSort 메소드에 변수로 배열의 시작 index, 마지막 index를 전달합니다. 
- 추가한 index는 정렬 범위에 포함됩니다.

```java
    public static void main(String args[]) {
        int[] array = new int[]{6, 2, 5, 7, 9, 1, 3, 4, 10, 11, 4};
        mergeSort(array, 0, array.length - 1);
        System.out.println(Arrays.toString(array));
    }
```

### mergeSort 메소드
- left index가 right index을 넘지 않을 때까지 계속 분할합니다.
- 범위가 1이 되는 시점까지 재귀 함수를 통해 지속적으로 범위를 좁힙니다.
- 분할이 완료되었으면 merge 함수를 통해 정렬과 병합을 수행합니다. 

``` java
    static void mergeSort(int[] array, int left, int right) {
        if (left < right) {
            int mid = (left + right) / 2;
            mergeSort(array, left, mid);
            mergeSort(array, mid + 1, right);
            merge(array, left, right);
        }
    }
```

### merge 메소드
- 정렬할 데이터를 담을 임의의 메모리 temp를 선언합니다.
- 배열을 반으로 나눠 배열에 담긴 값을 비교 정렬합니다.
- leftIndex 위치의 값과 rightIndex 위치의 값을 비교하여 작은 값을 temp 배열에 추가합니다.
- 왼쪽과 오른쪽 위치의 값들 중 한 위치를 정리했다면 반복문을 종료합니다.
- 추가적으로 정리하지 못한 값을을 temp 배열에 추가합니다.
- temp 배열에 저장된 값을 array 배열로 옮깁니다.

```java
    static void merge(int[] array, int left, int right) {

        int index = 0;
        int mid = (left + right) / 2;
        int[] temp = new int[right - left + 1];

        int leftIndex = left;
        int rightIndex = mid + 1;
        while (leftIndex <= mid && rightIndex <= right) {
            if (array[leftIndex] < array[rightIndex]) {
                temp[index++] = array[leftIndex++];
            } else {
                temp[index++] = array[rightIndex++];
            }
        }

        while (leftIndex <= mid) {
            temp[index++] = array[leftIndex++];
        }

        while (rightIndex <= right) {
            temp[index++] = array[rightIndex++];
        }

        for (int subIndex = 0; subIndex < temp.length; subIndex++) {
            array[subIndex + left] = temp[subIndex];
        }
    }
```

### 전체 코드

```java

import java.util.Arrays;

public class Main {

    static void merge(int[] array, int left, int right) {

        int index = 0;
        int mid = (left + right) / 2;
        int[] temp = new int[right - left + 1];

        int leftIndex = left;
        int rightIndex = mid + 1;
        while (leftIndex <= mid && rightIndex <= right) {
            if (array[leftIndex] < array[rightIndex]) {
                temp[index++] = array[leftIndex++];
            } else {
                temp[index++] = array[rightIndex++];
            }
        }

        while (leftIndex <= mid) {
            temp[index++] = array[leftIndex++];
        }

        while (rightIndex <= right) {
            temp[index++] = array[rightIndex++];
        }

        for (int subIndex = 0; subIndex < temp.length; subIndex++) {
            array[subIndex + left] = temp[subIndex];
        }
    }

    static void mergeSort(int[] array, int left, int right) {
        if (left < right) {
            int mid = (left + right) / 2;
            mergeSort(array, left, mid);
            mergeSort(array, mid + 1, right);
            merge(array, left, right);
        }
    }

    public static void main(String args[]) {
        int[] array = new int[]{6, 2, 5, 7, 9, 1, 3, 4, 10, 11, 4};
        mergeSort(array, 0, array.length - 1);
        System.out.println(Arrays.toString(array));
    }
}
```

## OPINION
알고리즘의 개념만 설명한 것은 이 포스트가 처음인거 같습니다. 
이번 포스트를 시작으로 간단한 정렬 방법들에서부터 프레임워크나 운영체제에서 사용되는 알고리즘들도 하나씩 정리할 예정입니다. 
공부할 주제들이 정말 너무 많습니다. 
얼마 전까지만해도 많은 것들을 알고 있다고 생각했던 제 자신이 부끄러울 따름입니다. 

#### REFERENCE
- <https://en.wikipedia.org/wiki/Merge_sort>
- <https://gmlwjd9405.github.io/2018/05/08/algorithm-merge-sort.html>