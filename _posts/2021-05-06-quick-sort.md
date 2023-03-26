---
title: "Quick Sort"
search: false
category:
  - information
  - algorithm
last_modified_at: 2021-08-28T13:30:00
---

<br/>

👉 이어서 읽기를 추천합니다.
- [Merge Sort][merge_sort_link]

## 1. 퀵 정렬(Merge Sort)
퀵 정렬은 다음과 같은 특징을 가집니다. 
- 불안정 정렬이며, 다른 원소와의 비교를 통해 정렬을 수행합니다. 
- 분할 정복 알고리즘 중 하나로 평균적으로 매우 빠른 수행 속도를 가집니다. 
- 추가적인 메모리 공간이 필요하지 않다.
- 이미 정렬된 리스트에 대해서는 불균형 분할이 수행되면서 수행시간이 더 오래 걸립니다.
- 평균적으로 O(n log n), 최악의 경우 O(pow(n, 2)) 수행 시간이 걸립니다. 

##### 퀵 정렬 동작 방식
<p align="center"><img src="/images/quick-sort-1.gif" width="50%"></p>
<center>https://en.wikipedia.org/wiki/Quick_sort</center>

## 2. 퀵 정렬 수행 과정(오름 차순 정렬)
퀵 정렬은 다음과 같은 과정을 통해 수행됩니다.
1. 리스트 가운데서 하나의 원소를 고릅니다. 이렇게 고른 원소를 피벗(pivot)이라고 합니다.
1. 피벗 앞에는 피벗보다 값이 작은 원소들이 오고, 피벗 뒤에는 피벗보다 값이 큰 원소들이 오도록 정렬하면서 리스트를 둘로 나눕니다. 
1. 정렬을 마친 뒤에 피벗은 더 이상 움직이지 않습니다.
1. 분할된 두 개의 작은 리스트에 대해 재귀(Recursion)적으로 이 과정을 반복합니다. 
1. 재귀는 리스트의 크기가 0이나 1이 될 때까지 반복됩니다.

## 3. 퀵 정렬의 분할 정복
- 분할(Divide) - 입력 배열을 피벗을 기준으로 비균등하게 2개의 부분으로 나눕니다.(왼쪽에는 작은 값, 오른쪽에는 큰 값)
- 정복(Conquer) - 부분 배열을 정렬합니다. 부분 배열의 크기가 충분히 작지 않으면 재귀적으로 분할을 수행합니다.
- 결합(Combine) - 정렬된 배열들을 하나의 배열로 합병합니다.

## 4. 퀵 정렬 코드 설명

### 4.1. main 메소드
- mergeSort 메소드에 변수로 배열의 시작 index, 마지막 index를 전달합니다. 
- 매개변수로 전달한 index들은 정렬 범위에 포함됩니다.

```java
    public static void main(String args[]) {
        int[] array = new int[]{6, 2, 5, 7, 9, 1, 3, 4, 10, 11, 4, 0, -1, 20, 5, 7, 5, 1, 6,};
        quickSort(array, 0, array.length - 1);
        System.out.println(Arrays.toString(array));
    }
```

### 4.2. partition 메소드
- pivotIndex 위치의 값을 기준으로 값을 정렬합니다. 
- pivotIndex 위치의 값보다 작은 값은 왼쪽, 큰 값은 오른쪽으로 변경합니다.
- lowIndex 위치의 값이 pivotIndex 위치의 값보다 작은 경우 계속 증가시킵니다. lowIndex가 right를 넘지 않는 시점까지 반복합니다.
- highIndex 위치의 값이 pivotIndex 위치의 값보다 큰 경우 계속 감소시킵니다. highIndex가 left를 넘지 않는 시점까지 반복합니다.
- lowIndex 값과 hightIndex 값이 교차되지 않았다면 두 값을 교환합니다. 
- lowIndex 값과 hightIndex 값이 교차되는 시점까지 지속적으로 반복합니다.
- 값이 교차되었다면 교차된 지점의 값과 pivotIndex 위치의 값을 변경합니다.

```java
    static int partition(int[] array, int left, int right) {
        int pivotIndex = left;
        int lowIndex = left;
        int highIndex = right + 1;
        do {
            // pivotIndex 위치의 값보다 작으면 skip
            do {
                lowIndex++;
            } while (lowIndex <= right && array[lowIndex] < array[pivotIndex]);
            // pivotIndex 위치의 값보다 크면 skip
            do {
                highIndex--;
            } while (left <= highIndex && array[highIndex] > array[pivotIndex]);
            // lowIndex와 highIndex 값이 교차되지 않았다면 값 변경
            if (lowIndex < highIndex) {
                swap(array, lowIndex, highIndex);
            }
        } while (lowIndex < highIndex);

        // pivotIndex 위치의 값과 highIndex 위치의 값을 변경
        swap(array, pivotIndex, highIndex);

        return highIndex;
    }
```

### 4.3. quickSort 메소드
- 분할과 정렬 과정을 통해 반환된 pivotIndex를 기준으로 왼쪽 배열, 오른쪽 배열을 재정렬합니다.
- pivotIndex 위치는 제외합니다.

```java
    static void quickSort(int[] array, int left, int right) {
        if (left < right) {
            int pivotIndex = partition(array, left, right);
            quickSort(array, left, pivotIndex - 1);
            quickSort(array, pivotIndex + 1, right);
        }
    }
```

### 4.4. 전체 코드

```java
package blog.in.action;

import java.util.Arrays;

public class Main {

    static void swap(int[] array, int from, int to) {
        int temp = array[from];
        array[from] = array[to];
        array[to] = temp;
    }

    static int partition(int[] array, int left, int right) {
        int pivotIndex = left;
        int lowIndex = left;
        int highIndex = right + 1;
        do {
            // pivotIndex 위치의 값보다 작으면 skip
            do {
                lowIndex++;
            } while (lowIndex <= right && array[lowIndex] < array[pivotIndex]);
            // pivotIndex 위치의 값보다 크면 skip
            do {
                highIndex--;
            } while (left <= highIndex && array[highIndex] > array[pivotIndex]);
            // lowIndex와 highIndex 값이 교차되지 않았다면 값 변경
            if (lowIndex < highIndex) {
                swap(array, lowIndex, highIndex);
            }
        } while (lowIndex < highIndex);

        // pivotIndex 위치의 값과 highIndex 위치의 값을 변경
        swap(array, pivotIndex, highIndex);

        return highIndex;
    }

    static void quickSort(int[] array, int left, int right) {
        if (left < right) {
            int pivotIndex = partition(array, left, right);
            quickSort(array, left, pivotIndex - 1);
            quickSort(array, pivotIndex + 1, right);
        }
    }

    public static void main(String args[]) {
        int[] array = new int[]{6, 2, 5, 7, 9, 1, 3, 4, 10, 11, 4, 0, -1, 20, 5, 7, 5, 1, 6,};
        quickSort(array, 0, array.length - 1);
        System.out.println(Arrays.toString(array));
    }
}
```

## 5. 퀵 정렬과 합병 정렬의 차이점
퀵 정렬과 합병 정렬의 차이점을 비교해보았습니다. 
- 퀵 정렬은 균등 분할이 아닙니다.
- 추가적인 메모리가 필요하지 않습니다.
- 합병 정렬과 반대로 퀵 정렬은 먼저 정렬 후 분할을 수행합니다. 

## CLOSING
항상 알고리즘을 공부하다보면 나오는 시간 복잡도에 대한 이야기가 빠지지 않습니다. 
참조한 블로그에 퀵 정렬을 기준으로 시간 복잡도 계산에 대한 이해를 쉽게 돕는 자료가 있어서 함께 정리해보았습니다. 
아이템의 개수 n(=pow(2, k))개만큼 존재한다고 가정합니다. 
퀵 정렬을 위해 선택한 pivot 의 값이 적절한지 여부에 따라 정렬이 수행될 때 시간 복잡도를 계산하는 방법입니다. 

##### 최적의 pivot 값을 이용하여 정렬 수행
- pivot 값이 적절하여 배열이 계속 2등분 되는 경우입니다. 
- 이런 경우 분할되는 재귀함수의 깊이는 k(=log2n) 입니다. 
- 각 깊이 별로 값을 비교를 n 번씩 수행합니다. 
- 최종적으로 계산된 시간 복잡도는 **`깊이 * 각 깊이 별 비교 횟수 = n * log2n`** 입니다. 

<p align="center"><img src="/images/quick-sort-1.JPG" width="65%"></p>
<center>https://gmlwjd9405.github.io/2018/05/10/algorithm-quick-sort.html</center>

##### 최악의 pivot 값을 이용하여 정렬 수행
- pivot 값이 적절하지 않아 길이가 1개와 n-1개의 배열로 나뉘어지는 경우입니다. 
- 이런 경우 분할되는 재귀함수의 깊이는 k(=n) 입니다. 
- 각 깊이 별로 값을 비교를 n 번씩 수행합니다. 
- 최종적으로 계산된 시간 복잡도는 **`깊이 * 각 깊이 별 비교 횟수 = n * n = pow(2, 2)`** 입니다. 

<p align="center"><img src="/images/quick-sort-2.JPG" width="65%"></p>
<center>https://gmlwjd9405.github.io/2018/05/10/algorithm-quick-sort.html</center>

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-05-06-quick-sort>

#### REFERENCE
- <https://en.wikipedia.org/wiki/Quicksort>
- <https://gmlwjd9405.github.io/2018/05/10/algorithm-quick-sort.html>

[merge_sort_link]: https://junhyunny.github.io/information/algorithm/merge-sort/