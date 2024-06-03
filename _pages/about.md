---
title: "About"
permalink: /about/
layout: about
entries_layout: linear
classes: wide
---

<br/>

<div class="personal"> 
    <h2 class="personal-name">강준현</h2>
    <p class="personal__information">
       <span>kang3966@naver.com</span>
       <span>https://junhyunny.github.io/</span>
       <span>https://github.com/Junhyunny</span>
    </p>
</div>

안녕하세요. Tanzu Labs 소프트웨어 엔지니어 강준현입니다.<br/>
생각과 경험을 정리하고, 학습한 지식을 알기 쉽게 공유하는 일을 좋아합니다.

## 경력

<div class="resume-header"> 
    <img src="/images/about/about-4.jpg" width="5%" class=" image__margin-right image__border"/>
    <h3 id="vmware" class="reusme__company">
        <span class="reusme__company--name">VMWare</span>
        <span class="reusme__company--team-role">Tunzu Labs Software Engineer</span>
        <span class="reusme__company--period">2021년 11월 - PRESENT</span>
    </h3>
</div>

##### [Toyota] Rungram 러너 프로페셔널 멘토링 서비스, 2024년 4월 - 5월

- 프로 달리기 선수들의 아마추어 러너(runner)의 달리기 자세 멘토링 서비스
- iOS 및 웹 애플리케이션 MS AAD OAuth2 통합 인증 구현
- iOS 애플리케이션 MS AAD OAuth2 인증과 서비스 자체 인증 프로세스 통합 및 코드 리팩토링
- JDK21 기반 스프링 서버 애플리케이션 이미지 업로드 시 다이렉트 메모리(direct memory) 누수 현상 분석 및 해결
- 러너 달리기 자세에 대한 스켈레톤 추출 비디오 프로세싱 서비스 구현 및 시스템 통합

##### [Honda] Stellar One 공장 프로세스 모니터링, 2024년 1월 - 3월

- 실시간 웰딩(welding) 공정 작업 현황 모니터링 웹 애플리케이션
- 웰딩 공정 내 유닛(unit) 별 작업 현황 모니터링을 위한 도메인 설계 및 구현
- Github Actions CI/CD 파이프라인 구축
- 모스키토(mosquitto) MQTT 브로커를 통해 공장 PLC 센서의 데이터를 실시간으로 수집
- 조업자들의 작업 스케줄을 조정할 때 도움을 주는 실시간 작업 현황을 시각화
- 실시간 작업 완료 차량 대수와 공정 진행 속도를 기반으로 목표 대수 달성 예상 완료 시간을 계산
- 후속 웰딩 유닛 이전에 위치한 버퍼의 잔여 수와 공정 진행 속도를 기반으로 공장 가동에 문제가 발생할 수 있는 시각을 계산

##### [Toyota] EXPO 어린이 컨퍼런스 네비게이션 웹 어플리케이션, 2023년 9월 - 11월

- 어린이 대상 컨퍼런스 참여자들에게 프로그램, 예약 정보 및 직소 퍼즐 게임을 제공하는 웹 어플리케이션
- 행사 스케줄, 고객 예약 정보 관리 및 퍼즐 수집 게임 도메인 설계 및 구현
- 동일한 여러 퍼즐 조각이 수집되는 동시성 문제 해결 및 예외 처리
- 퍼즐 수집 시 등장 애니메이션 기능 개발
- Google Analytics, Google Tag Manager 연결을 통한 사용자 데이터 수집 기능 개발

##### [Toyota] EXPO 사내 컨퍼런스 네비게이션 어플리케이션, 2023년 7월 - 8월

- 도요타 사내 컨퍼런스 참여자들에게 참여 부스 정보를 제공하는 웹 어플리케이션
- AAD(Azure Active Directory) OAuth2 인증과 서비스 자체 로그인 기능 통합
- 세션에 사용자 정보 저장 시 영속성 컨텍스트가 연결된 상태로 객체 직렬화하는 과정에서 발생하는 버그 수정
- Google Analytics, Google Tag Manager 연결을 통한 사용자 데이터 수집 기능 개발

##### [LG U+] 차세대 시스템 API 하위 호환 어댑터 서비스, 2023년 6월 - 7월

- 차세대 시스템과 클라이언트 사이의 API 하위 호환성 문제를 해결하기 위한 어댑터 서비스
- 레디스와 웹 필터를 사용한 클라이언트 인증 프로세스 구현
- 외부 서비스 API 호출 기능 구현 및 와이어 목을 활용한 결합 테스트 검증

##### [Toyota] EXPO 사내 컨퍼런스 네비게이션 어플리케이션, 2023년 3월 - 4월

- 도요타 사내 컨퍼런스 참여자들에게 프로그램 정보를 제공하는 웹 어플리케이션
- 단위 테스트와 리팩토링을 통한 컴포넌트 재구성과 점진적인 신규 기능 확장
- 카드 수집 시 등장 애니메이션 버그 수정
- Google Analytics, Google Tag Manager 연결을 통한 사용자 데이터 수집 기능 개발

##### [KB 국민은행] 프론트 오피스 업무 전용 거래 서비스, 2022년 10월 - 2023년 2월

- 프론트 오피스 업무 거래용 윈도우 GUI 어플리케이션을 웹 기반 서비스로 재구축
- Jenkins CI/CD 파이프라인 구축
- 트레이더 정보 및 권한 관리, 코드 관리, 선물(future) 상품 및 거래 도메인 모델 설계 및 개발
- 외국 거래 입력 시 시차로 인해 발생하는 이슈 해결을 위한 타임존 도메인 설계 및 개발
- SSO 인증 프로세스 개발 및 사용자 권한 서비스 연계
- 레거시 연계로 인해 발생하는 도메인 오염 방지를 위한 ACL(anti corruption layer) 구축

##### [KB 국민은행] 마이데이터 기반 맞춤형 LiivM 요금제 추천 서비스, 2022년 1월 - 6월

- 마이데이터를 활용한 사용자 맞춤 알뜰폰 요금제 추천 MVP 서비스 개발
- Jenkins CI/CD 파이프라인 구축
- 마이데이터 기반 알뜰폰 추천을 위한 신규 상품 추천 도메인 모델 설계 및 개발
- KB 사내 마이데이터 플랫폼 서비스 최초 연계 및 사용
- KB 레거시 EAI 메세징 서비스 분석 및 리팩토링을 통한 코드 70% 축소

<div class="resume-header"> 
    <img src="/images/about/about-3.jpg" width="4%" class=" image__margin-right image__border"/>
    <h3 id="geneuin" class="reusme__company">
        <span class="reusme__company--name">Geneuin</span>
        <span class="reusme__company--team-role">Application Developer</span>
        <span class="reusme__company--period">2021년 4월 - 11월</span>
    </h3>
</div>

##### [한국보건산업진흥원] IoT 돌봄 서비스 고도화 프로젝트, 2021년 8월 - 11월

- 노인 거주지 및 장애인 시설 내 IoT 센서를 사용한 돌봄 서비스 고도화 프로젝트
- 업무 게시판, 돌봄 대상자 관리, 시설 도면 업로드 및 IoT 센서 맵핑 기능 개발
- 신규 모바일 서비스 개발 및 사용자 PIN 번호 발급을 통한 2차 인증 프로세스 구현
- 사용자 로그아웃 시 브라우저 쿠키 초기화 실패로 인한 재접속 불가능 버그 수정
- 레거시의 불필요 컴포넌트들 제거 및 코드 리팩토링을 통한 50% 코드 축소

##### [KC Industrial] 반도체 가스 공정 MES 개발 프로젝트, 2021년 5월 - 8월

- 가스 공정 자동화ㆍ모니터링 웹 서비스 구현
- 가스 용기 특성과 물류 흐름에 맞는 도메인 모델 설계 및 개발
- 가스 용기 입고, 전처리, 충전, 품질 검사, 출고, 반품 및 회수 처리 자동화 및 리포팅 기능 구현
- 실린더 번들 부적합 발생 시 이벤트 발행ㆍ구독 패턴을 통한 결합도 낮은 비즈니스 로직 구현
- 수백 개 입고되는 가스 용기들의 납품 PDF 문서를 CSV 파일로 변경하는 수작업을 자동화
- 용기 번호와 LOT 번호에 맞는 바코드 생성 및 출력 작업 자동화

<div class="resume-header"> 
    <img src="/images/about/about-1.jpg" width="5%" class=" image__margin-right image__border"/>
    <h3 id="posco-ict" class="reusme__company">
        <span class="reusme__company--name">POSCO ICT</span>
        <span class="reusme__company--team-role">MES Application Developer</span>
        <span class="reusme__company--period">2018년 7월 – 2021년 4월</span>
    </h3>
</div>

##### [POSCO ICT] POSCO MES3.0 야드 관리 시스템 운영, 2020년 6월 - 2021년 4월

- 포항, 광양 제철소의 야드 관리 시스템 운영 (슬라브, 코일, 후판 및 선재 품종 별 서비스)
- 각 품종 별로 하루 평균 3000만 건을 초과하는 API 트래픽 처리 
- 소재, 제품 이적 시 충돌, 추락 등으로 발생하는 품질 저하를 유발하는 장애 추적 및 개선
- 소재, 제품 적치 시 발생할 수 있는 인명 사고를 방지하기 위한 장애 추적 및 개선
- DB 트랜잭션 경합 시 비관적 락 방식의 데이터 선점과 예외 처리를 통한 데드락 현상 해소
- 이송 효율 증가와 크레인 작업자 피로도 감소를 위한 포항 전강 창고 차량 이송 물류 자동화
- 24시간 야드 관리 시스템 모니터링 및 장애 대응
- 기타 SR(service request) 처리

##### [POSCO ICT] POSCO MES3.0 야드 관리 시스템 개발, 2018년 7월 – 2020년 5월

- 모노리스 POSCO MES 야드 관리 시스템을 마이크로서비스 아키텍처로 재구축
- 타 공정, 조업, 운송, 출하 시스템 API 연결 및 폴백(fallback) 처리 구현
- 야드 관리 시스템 공통 비즈니스 룰 엔진 컴포넌트 리팩토링
- 야드 관리 시스템 소재, 제품 적치를 위한 스케줄링 도메인 객체 리팩토링 및 개발
- 메모리 캐시와 Kafka를 사용한 데이터 동기화로 룰 엔진 컴포넌트 80% 속도 개선
    - 5초 이상 소요 시간을 1초 미만으로 개선
- 이송 물류 개선을 위한 차량 이송 물류 스케줄링 구현
    - 이송될 물류를 미리 그룹화하고 순번을 지정하는 스케줄링 이후 타 운송 시스템으로 목록과 순번을 전송

<div class="resume-header"> 
    <img src="/images/about/about-1.jpg" width="5%" class=" image__margin-right image__border"/>
    <h3 id="posco-ict-intern" class="reusme__company">
        <span class="reusme__company--name">POSCO ICT</span>
        <span class="reusme__company--team-role">Internship</span>
        <span class="reusme__company--period">2017년 8월 - 2017년 11월</span>
    </h3>
</div>

##### [POSCO ICT] Smart CCTV 시스템 어플리케이션 개발, 2017년 8월 - 11월

- 영상 인식을 통한 다트(dart) 공정 이상(abnormal) 감지 어플리케이션 개발
- SVM(Support Vector Machine) 머신 러닝 알고리즘 활용

## Skills

- Java, Kotlin, Spring Boot, Spring Security, Spring Data JPA
- JavaScript, TypeScript, React, Vue, HTML, CSS
- MySQL, PostgreSQL, Redis, Nifi
- Docker, Podman, K8S
- Jenkins, Gitlab CI, Github Actions
- AWS

## Education

<div class="resume-header"> 
    <img src="/images/about/about-2.jpg" width="5%" class=" image__margin-right image__border"/>
    <h3 class="reusme__company">
        <span class="reusme__company--name">Hansung University</span>
        <span class="reusme__company--team-role">학사</span>
        <span class="reusme__company--period">2014년 2월 - 2018년 2월</span>
    </h3>
</div>

##### 정보통신공학과 전공

- 학점 4.45 / 4.5
- 우촌상 수상
    - 후기졸업자로서 전기졸업포상자를 포함해 전교에서 학업성적이 최우수한 자
- 아산 성적 우수 장학생 3년 선정
    - 2015년 - 2017년
- 제34회 전국 대학생 수학 경시대회(비수학전공분야) 은상 수상
    - 대한수학회, 고등과학원 주최
- 2016 미래전파 창의 아이디어 설계 제작 공모전 우수상 수상
    - 국립전파연구원 주최