---
title: "Spring Filter, Interceptor 그리고 AOP"
search: false
category:
  - spring-boot
last_modified_at: 2021-05-13T21:00:00
---

<br>

> **`'Spring 필터(Filter)와 인터셉터(Interceptor)의 차이점에 대해 설명해주세요.'`**<br>
> **`'필터는 서블릿 컨테이너에 이전에 공통적으로 처리해야되는 부분을 처리합니다.`** 
> **`인터셉터는 AOP 처럼 특정 시점을 빼앗아 동작하는 것을 의미하는 것 같습니다.'`** 

<p align="center"><img src="/images/filter-interceptor-and-aop-1.JPG" width="50%"></p>
<center>이미지 출처, https://torbjorn.tistory.com/120</center><br>

똑같은 질문을 화상 면접, 1차 면접에서 총 2 번 받았습니다. 
화상 면접이 끝나고 관련된 개념을 찾아보지 않았기 때문에 두 번째 질문에도 동일하게 대답했습니다. 
하지만 질문을 받았을 때 식은 땀이 주륵 났습니다. 

**`'이전 면접에 대한 내용들이 기록되어 있을텐데 같은 질문을 다시 했다? 이건 뭔가 잘못되었다.'`** 

네, 단단히 잘못 되었습니다.😢 
인터셉터는 요청 처리를 위해 별도로 사용되는 기능이었습니다. 
필터와 인터셉터의 차이점을 포스트로 정리해보겠습니다. 

## 필터, 인터셉터 그리고 AOP 기능별 위치
필터, 인터셉터 그리고 AOP 기능은 모두 다른 기능입니다. 
그리고 처리하는 일과 기능이 구현된 위치가 다릅니다. 

##### 필터와 인터셉터 위치

<p align="center"><img src="/images/filter-interceptor-and-aop-2.JPG" width="70%"></p>
<center>이미지 출처, https://justforchangesake.wordpress.com/2014/05/07/spring-mvc-request-life-cycle/</center><br>

##### AOP 기능 위치

<p align="center"><img src="/images/filter-interceptor-and-aop-3.JPG" width="70%"></p>
<center>이미지 출처, https://programming.vip/docs/spring-aop-basic-use.html</center><br>

## OPINION
작성 중 입니다.

#### REFERENCE
- <https://goddaehee.tistory.com/154>
- <https://supawer0728.github.io/2018/04/04/spring-filter-interceptor/>