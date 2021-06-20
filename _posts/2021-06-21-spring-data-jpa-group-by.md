---
title: "JPA GROUP BY 사용 시 ConverterNotFoundException"
search: false
category:
  - spring-boot
  - jpa
  - junit
last_modified_at: 2021-06-21T00:00:00
---

<br>

통계성 데이터를 보여줄 때 가장 먼저 찾는 방법은 SQL의 `GROUP BY` 입니다. 
대부분의 데이터 처리를 SQL이 아닌 비즈니스 로직에서 해결하지만 통계성 데이터는 역시 SQL을 이용하는 것이 여러모로 편리한 것 같습니다. 
JPA를 사용하고 처음으로 `GROUP BY` 키워드가 들어간 SQL을 사용했을 때 이런 Exception을 마주쳤습니다. 

```
ConverterNotFoundException: No converter found capable of converting from type [org.springframework.data.jpa.repository.query.AbstractJpaQuery$TupleConverter$TupleBackedMap] to type
```



## OPINION

#### REFERENCE
