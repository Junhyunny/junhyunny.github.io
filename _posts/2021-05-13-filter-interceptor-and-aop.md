---
title: "Spring Filter, Interceptor 그리고 AOP"
search: false
category:
  - spring-boot
last_modified_at: 2021-05-13T21:00:00
---

<br>

> **'Spring 필터(Filter)와 인터셉터(Interceptor)의 차이점에 대해 설명해주세요.'**<br>
> **'필터는 서블릿 컨테이너에 이전에 공통적으로 처리해야되는 부분을 처리합니다. 인터셉터는 AOP 처럼 특정 시점을 빼앗아 동작하는 것을 의미하는 것 같습니다.'** 

<p align="center"><img src="/images/filter-interceptor-and-aop-1.JPG" width="30%"></p>
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
필터, 인터셉터, AOP 기능이 위치를 알아보고, 각자 해야할 역할에 대한 설명을 이어가보겠습니다. 

##### 필터와 인터셉터 위치

<p align="center"><img src="/images/filter-interceptor-and-aop-2.JPG" width="60%"></p>
<center>이미지 출처, https://justforchangesake.wordpress.com/2014/05/07/spring-mvc-request-life-cycle/</center><br>

##### AOP 기능 위치

<p align="center"><img src="/images/filter-interceptor-and-aop-3.JPG" width="60%"></p>
<center>이미지 출처, https://programming.vip/docs/spring-aop-basic-use.html</center><br>

## 필터(Filter)
필터는 Web Application에 등록합니다. 
요청 스레드가 서블릿 컨테이너(Servlet Container)에 도착하기 전에 수행됩니다. 
필터는 사용자의 요청 정보에 대한 검증하고 필요에 따라 데이터를 추가하거나 변조할 수 있습니다. 
응답 정보에 대한 변경도 가능합니다. 
주로 전역적으로 처리해야하는 인코딩, 보안 관련된 일을 수행합니다. 

#### 필터 사용 예
- 로그인 여부, 권한 검사 같은 인증 기능
- 요청이나 응답에 대한 로그
- 오류 처리 기능
- 웹 보안 관련 기능 처리, XSS 방어
- 데이터 압축이나 변환 기능
- 인코딩 처리 기능

### 필터 메소드
- init() - 필터 인스턴스 초기화
- doFilter() - 전/후 처리
- destroy() - 필터 인스턴스 종료

### 필터에서만 할 수 있는 일
ServletRequest 혹은 ServletResponse를 교체할 수 있습니다. 아래와 같은 일이 가능합니다. 

## 인터셉터(Interceptor)
인터셉터는 스프링 컨텍스트(Context)에 등록합니다. 

### 인터셉터에서만 할 수 있는 일

## AOP 기능

## OPINION
작성 중 입니다.

#### REFERENCE
- <https://yzlosmik.tistory.com/24>
- <https://goddaehee.tistory.com/154>
- <https://supawer0728.github.io/2018/04/04/spring-filter-interceptor/>
