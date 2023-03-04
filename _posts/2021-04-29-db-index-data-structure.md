---
title: "DB 인덱스(INDEX) 자료구조"
search: false
category:
  - information
  - data-structure
last_modified_at: 2021-08-28T02:00:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.

- [DB 인덱스(INDEX) 개념 및 설정 시 고려사항][db-index-link]

## 0. 들어가면서

> 인덱스 자료구조로 가장 많이 사용되는 B+Tree 는 어떤 특징을 가지고 있는가? 

**'아... DB 인덱스 정리하는 김에 같이 할껄...'** 이라는 생각이 뇌리를 스쳤습니다. 
어설프게 알고 있는 내용을 아는 것마냥 설명하고 싶지는 않아서 모른다고 이야기했지만 다소 아쉬움이 남았습니다. 
이번에 포스트로 정리하면서 저의 지식으로 만들어보겠습니다. 
DB 인덱스를 위한 자료구조로 언급되는 몇 가지들을 소개하고 가장 적합한 자료구조와 그 이유를 정리해보았습니다. 

## 1. 데이터베이스 인덱스 자료구조 

### 1.1. 해시 테이블(Hash Table)
Key-Value 형태로 데이터를 저장하는 자료구조입니다. 
내부적으로 배열(버킷)을 사용하여 데이터를 저장하기 때문에 빠른 검색 속도를 제공합니다. 
데이터 탐색 시 해시 함수(Hash Function)를 이용해 Key에 해당하는 index 값을 구합니다. 
index를 이용하여 배열에 저장된 value에 접근하기 때문에 해시 테이블의 평균 시간복잡도는 O(1)입니다.

<p align="center"><img src="/images/db-index-data-structure-1.JPG" width="60%"></p>
<center>https://en.wikipedia.org/wiki/Hash_table</center>

#### 1.1.1. 해시 함수(Hash Function)
해시 테이블 자료구조의 핵심입니다. 
Key를 사용해 적절한 배열의 index를 계산하는 계산식입니다. 
적절한 index를 찾아내야만 Key 충돌을 줄이므로 빠른 속도를 유지할 수 있습니다. 
Key 충돌이 있는 경우에는 정책에 따라 부가적인 처리가 필요합니다. 
자세한 내용은 별도 포스트를 통해 정리하도록 하겠습니다. 

<p align="center"><img src="/images/db-index-data-structure-2.JPG" width="60%"></p>
<center>https://en.wikipedia.org/wiki/Hash_table</center>

### 1.2. B-Tree(Balanced Tree)
트리를 구성하는 아이템 하나 하나를 노드(node)라고 합니다. 
B-Tree는 자식 노드의 개수가 2개 이상인 트리를 말합니다. 
가장 상단을 구성하는 것이 루트 노드(root node), 중간에 위치한 브랜치 노드(branch node), 마지막에 위치한 리프 노드(leaf node)로 구성됩니다. 
B-Tree는 트리의 차수에 따라 노드 내 최대 Key-Value 수가 달라집니다. 
노드 내 Key-Value 수 2개는 2차 B-Tree, 노드 내 Key-Value 수 3개는 3차 B-Tree..., 노드 내 Key-Value 수 N개는 N차 B-Tree 입니다. 

##### B-Tree 구조
- 최상위 노드를 루트 노드라고 합니다.
- 중간에 위치한 노드들을 브랜치 노드라고 합니다.
- 맨 말단에 위치한 노드를 리프 노드라고 합니다.
- 하나의 노드에 매달린 자식 노드는 2개 이상 가능합니다.
- Key-Value 값들은 Key를 기준으로 항상 오름차순으로 정렬되어 있습니다. 
- 균형 트리(Balanced Tree)로 루트 노드에서 리프 노드까지의 거리가 모두 동일합니다.

<p align="center"><img src="/images/db-index-data-structure-3.JPG" width="70%"></p>
<center>https://zorba91.tistory.com/293</center>

<p align="center"><img src="/images/db-index-data-structure-4.JPG" width="70%"></p>
<center>https://zorba91.tistory.com/293</center>

균형 트리인 B-Tree는 루트 노드에서 리프 노드까지 동일한 거리를 가지기 때문에 어떤 값에 대해서도 같은 시간에 결과를 얻을 수 있습니다. 
처음에는 균형 트리 형태이지만 시간이 지나면서 테이블 데이터 갱신(INSERT, UPDATE, DELETE)에 따라 데이터의 균형이 깨지면서 성능이 악화됩니다. 
시뮬레이션 사이트를 통해 B-Tree 생성, 동작 과정을 확인할 수 있습니다.
아래 이미지는 B-Tree를 생성, 동작하는 것을 보여줍니다. 

##### B-Tree 아이템 ISNERT 시뮬레이션
- <https://www.cs.usfca.edu/~galles/visualization/BTree.html>
<p align="center"><img src="/images/db-index-data-structure-5.gif" width="100%"></p>

### 1.3. B+Tree
B+Tree는 B-Tree의 확장된 개념입니다. 
B-Tree 노드는 B-Tree와 다르게 브랜치 노드는 Value에 대한 정보가 존재하지 않고 단순히 Key 값만 존재합니다. 
맨 말단 노드인 리프 노드에서만 Value를 관리합니다. 
리프 노드들은 LinkedList 구조로 서로를 참조하고 있기 때문에 B-Tree에 비하여 노드 순회가 쉽습니다. 
B+Tree는 브랜치 노드에 Value가 없기 때문에 B-Tree에 비해 차지하는 메모리가 적지만, Value를 찾기 위해선 리프 노드까지 이동해야 합니다.

##### B+Tree 구조
- 리프 노드를 제외한 노드들은 Key와 참조에 대한 정보만 가집니다. 
- Value는 리프 노드에 존재합니다.
- 리프 노드들은 LinkedList 구조로 서로를 참조하고 있으므로 B-Tree에 비해 노드 순회가 쉽습니다. 
- 브랜치 노드와 리프 노드에 모두 Key가 존재하므로 Key 중복이 발생합니다. 
<p align="center"><img src="/images/db-index-data-structure-6.JPG" width="70%"></p>
<center>https://ssup2.github.io/theory_analysis/B_Tree_B+_Tree/</center>

## 2. 데이터베이스 인덱스에 적합한 자료구조

### 2.1. 해시 테이블
모든 자료구조를 가져다놔도 탐색 시간이 가장 빠른 것이 해시 테이블입니다. 
해시 함수를 통해 얻은 해시 값을 이용하여 메모리 공간에 한 번에 접근하기 때문에 평균적으로 O(1)이라는 시간 복잡도를 가집니다. 
하지만 이는 단 하나의 값을 검색하기 위한 시간 복잡도입니다. 
이는 = 등호(=) 연산에 적합하다는 의미입니다. 
SQL은 <, > 등의 부등호 연산을 수행할 수 있는데, 해시 테이블은 내부적으로 데이터 정렬이 되어 있지 않으므로 탐색이 비효율적으로 이루어집니다. 
DB 인덱스는 기준 값보다 크거나 작은 요소들을 탐색할 수 있어야하므로 해시 테이블은 어울리지 않은 자료구조입니다. 

### 2.2. B-Tree
B-Tree 자료구조는 탐색에 대해 O(logN)이라는 시간 복잡도를 가집니다. 
B-Tree에 저장된 데이터들은 항상 정렬된 상태로 유지됩니다. 
그렇기 때문에 부등호 연산에 대한 효율적인 데이터 탐색이 가능합니다. 
데이터 탐색뿐 아니라, 저장, 수정, 삭제에도 항상 O(logN)의 시간 복잡도를 가지므로 DB 인덱스를 위한 자료구조로 적합합니다. 

### 2.3. B+Tree
B-Tree를 확장한 자료구조이므로 다음과 같은 이점이 존재합니다. 
리프 노드를 제외하고 Value를 담아두지 않기 때문에 노드의 메모리에 더 많은 Key를 저장할 수 있습니다. 
하나의 노드에 더 많은 Key들을 담을 수 있기에 트리의 높이는 더 낮아집니다. 
Full Scan 수행 시, 리프 노드에 데이터가 모두 있기 때문에 리프 노드를 저장한 리스트에 대해 한 번의 선형 탐색만 수행하면 됩니다. 
이는 B-tree에 비해 빠릅니다. B-tree의 경우에는 모든 노드를 확인해야 합니다. 
결국 리프 노드까지 탐색해야하는 단점은 있지만 B-Tree보다 DB 인덱스에 더 적합한 자료구조로 사용된다고 합니다.

#### REFERENCE
- <https://mangkyu.tistory.com/96>
- <https://beelee.tistory.com/37>
- <https://mangkyu.tistory.com/102>
- <https://zorba91.tistory.com/293>
- <https://potatoggg.tistory.com/174>
- <https://helloinyong.tistory.com/296>
- <https://www.cs.usfca.edu/~galles/visualization/BTree.html>
- <https://junhyunny.github.io/information/database-index-and-considerations/>

[db-index-link]: https://junhyunny.github.io/information/database-index-and-considerations/