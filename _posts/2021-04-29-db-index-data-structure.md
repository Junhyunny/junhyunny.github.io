---
title: "DB 인덱스(INDEX) 자료구조"
search: false
category:
  - information
  - data-structure
last_modified_at: 2021-04-29T09:00:00
---

<br>

[DB 인덱스(INDEX) 개념 및 설정 시 고려사항][db-index-blogLink] 포스트에서 DB 인덱스를 잘 설정할 수 있는 방법에 관해 정리하였습니다. 
당시 글을 정리하면서도 몇 가지 의문사항들이 있었는데, 하필 최근에 이와 관련된 질문을 받았었습니다. 

> 인덱스 자료구조로 가장 많이 사용되는 B+Tree 는 어떤 특징을 가지고 있는가? 

**'아...😭 DB 인덱스 정리하는 김에 같이 할껄...'** 이라는 생각이 뇌리를 스쳤습니다. 
어설프게 알고 있는 내용을 아는 것마냥 설명하고 싶지는 않아서 모른다고 이야기했지만 다소 아쉬움이 남았습니다. 
이번에 포스트로 정리하면서 저의 지식으로 만들어보겠습니다. 
DB 인덱스를 위한 자료구조로 언급되는 몇 가지들을 소개하고 가장 적합한 자료구조와 그 이유를 정리해보았습니다. 

## 해시 테이블(Hash Table)
Key-Value 형태로 데이터를 저장하는 자료구조입니다. 
내부적으로 배열(버킷)을 사용하여 데이터를 저장하기 때문에 빠른 검색 속도를 제공합니다. 
데이터 탐색 시 해시 함수(Hash Function)를 이용해 Key에 해당하는 index 값을 구합니다. 
index를 이용하여 배열에 저장된 value에 접근하기 때문에 해시 테이블의 평균 시간복잡도는 O(1)입니다.

<p align="center"><img src="/images/db-index-data-structure-1.JPG" width="60%"></p>
<center>이미지 출처, https://en.wikipedia.org/wiki/Hash_table</center><br>

#### 해시 함수(Hash Function)
해시 테이블 자료구조의 핵심입니다. 
Key를 사용해 적절한 배열의 index를 계산하는 계산식입니다. 
적절한 index를 찾아내야만 Key 충돌을 줄이므로 빠른 속도를 유지할 수 있습니다. 
Key 충돌이 있는 경우에는 정책에 따라 부가적인 처리가 필요합니다. 
자세한 내용은 별도 포스트를 통해 정리하도록 하겠습니다. 

<p align="center"><img src="/images/db-index-data-structure-2.JPG" width="60%"></p>
<center>이미지 출처, https://en.wikipedia.org/wiki/Hash_table</center><br>

## B-Tree
B-Tree는 자식 노드의 개수가 2개 이상인 트리를 말합니다. 
트리의 차수에 따라 노드 내 최대 데이터 수가 달라집니다. 
노드 내 데이터 수 2개 - 2차 B-Tree, 노드 내 데이터 수 3개 - 3차 B-Tree..., 노드 내 데이터 수 N개 - N차 B-Tree 입니다. 

트리를 구성하는 아이템 하나 하나를 노드(node)라고 합니다. 
가장 상단을 구성하는 것이 루트 노드(root node), 중간에 위치한 브랜치 노드(branch node), 마지막에 위치한 리프 노드(leaf node)로 구성됩니다. 
B-Tree는 이진 트리(Binary Tree)와 유사하지만 한 노드 당 자식 노드가 2개 이상 가능합니다. 

##### B-Tree 구조
- 최상위 노드를 Root 노드라고 합니다.
- 중간에 위치한 노드들을 Branck 노드라고 합니다.
- 맨 말단에 위치한 노드를 Leaf 노드라고 합니다.
- 하나의 노드에 매달린 자식 노드는 2개 이상 가능합니다.
- 데이터 값들이 항상 정렬된 상태로 유지됩니다.
- 균형 트리(Balanced Tree)로 Root 노드에서 Leaf 노드까지의 거리가 모두 동일합니다.

<p align="center"><img src="/images/db-index-data-structure-3.JPG" width="70%"></p>
<center>이미지 출처, https://zorba91.tistory.com/293</center><br>

<p align="center"><img src="/images/db-index-data-structure-4.JPG" width="70%"></p>
<center>이미지 출처, https://zorba91.tistory.com/293</center><br>

균형 트리인 B-Tree는 Root 노드에서 Leaf 노드까지 동일한 거리를 가지기 때문에 어떤 값에 대해서도 같은 시간에 결과를 얻을 수 있습니다. 
데이터 CUD 명령으로 인해 데이터의 균형이 깨지고 성능이 악화됩니다. 

##### B-Tree 아이템 ISNERT 시뮬레이션
<p align="center"><img src="/images/db-index-data-structure-5.gif" width="100%"></p>

## B+Tree
작성 중 입니다.

## DB 인덱스에 적합한 자료구조
### 해시 테이블
작성 중 입니다.
<!-- 모든 자료구조와 그 어떤 알고리즘을 비교해도 탐색 시간이 가장 빠른 것은 바로 해시 테이블이다. 해시 테이블은 해시 함수를 통해 나온 해시 값을 이용하여 저장된 메모리 공간에 한 번에 접근을 하기 때문에 O(1)이라는 시간 복잡도를 가진다. (물론 해시 충돌 등으로 최악의 경우에 O(N)이 될 수 있지만, 평균적으로는 O(1)으로 볼 수 있다)
그러나 이는 온전히 '단 하나의 데이터를 탐색하는 시간' 에만 O(1)이다. 예를 들어 1,2,3,4,5가 저장되어 있는 해시 테이블에서 3이라는 데이터를 찾을 때에만 O(1)이라는 것이다. (3이라는 데이터를 인풋으로 해시 함수를 통해 나온 해시 값으로 3이 저장된 메모리 공간에 접근을 할 것이기 때문이다)
'그게 무엇이 문제이냐'라고 생각한다면 잠깐 이 부분을 놓쳤을 것이다.
우리는 DB에서 등호(=) 뿐 아니라 부등호(<, >)도 사용할 수 있다는 것을.
모든 값이 정렬되어있지 않으므로, 해시 테이블에서는 특정 기준보다 크거나 작은 값을 찾을 수 없다. 굳이 찾으려면 찾을 수는 있지만 O(1)의 시간 복잡도를 보장할 수 없고 매우 비효율적이다.
그렇기에 기준 값보다 크거나 작은 요소들을 항상 탐색할 수 있어야 하는 DB 인덱스 용도로 해시 테이블은 어울리지 않는 자료구조인 것이다. -->

### B-Tree
작성 중 입니다.
<!-- 모든 면으로 DB 인덱스 용도로 가장 적합한 자료구조인 B-Tree
결론적으로 DB 인덱스로 B-Tree가 가장 적합한 이유들을 정리하면 아래와 같다.
항상 정렬된 상태로 특정 값보다 크고 작은 부등호 연산에 문제가 없다.
참조 포인터가 적어 방대한 데이터 양에도 빠른 메모리 접근이 가능하다.
데이터 탐색뿐 아니라, 저장, 수정, 삭제에도 항상 O(logN)의 시간 복잡도를 가진다 -->

### B+Tree
작성 중 입니다.

## OPINION
작성 중 입니다.

#### REFERENCE
- <https://mangkyu.tistory.com/96>
- <https://beelee.tistory.com/37>
- <https://mangkyu.tistory.com/102>
- <https://zorba91.tistory.com/293>
- <https://potatoggg.tistory.com/174>
- <https://helloinyong.tistory.com/296>
- <https://www.cs.usfca.edu/~galles/visualization/BTree.html>
- <https://junhyunny.github.io/information/database-index-and-considerations/>

[db-index-blogLink]: https://junhyunny.github.io/information/database-index-and-considerations/