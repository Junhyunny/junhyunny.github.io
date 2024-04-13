---
title: "MQTT(Message Queuing Telemetry Transport) Protocol"
search: false
category:
  - information
last_modified_at: 2023-01-15T23:55:00
---

<br/>

## 0. 들어가면서

공장 센서로부터 주기적으로 수집되는 데이터를 시각화하는 프로젝트에 참여하게 됐다. IoT 센서로부터 데이터를 수신하기 때문인지 IoT 프로젝트에서 많이 사용하는 MQTT(Message Queuing Telemetry Transport) 프로토콜을 사용 중이라고 했다. 개발에 들어가기 전에 기술을 더 잘 활용하기 위해 이 프로토콜에 대해 알아봤다.

## 1. MQTT(Message Queuing Telemetry Transport)

ISO/IEC PRF 20922 표준을 따르는 발행-구독 기반의 메세징 프로토콜이다. 관련 사이트에 요약된 내용은 이렇다.

- 구독-발행 메세징 전송 프로토콜이며 TCP/IP 프로토콜을 기반으로 동작한다.
- 가볍고 개방적이며 간단하고 쉽게 구현할 수 있다. 
- M2M(Machine to Machine)이나 IoT(Internet of Things) 통신 같은 제약된 네트워크 환경에서 사용할 수 있다. 

구독-발행 메시지 프로토콜이기 때문에 일-대-다로 메시지를 전송할 수 있으며 애플리케이션들 사이의 결합도(coupling)를 낮추는 효과를 얻을 수 있다. 브로커(broker), 발행자(publisher) 그리고 구독자(subscriber) 컴포넌트가 이 프로토콜에 참여한다. 발행자는 데이터를 발생시키는 IoT 디바이스, 구독자는 데이터 수집을 원하는 필자가 개발할 애플리케이션이다. 브로커는 발행자와 구독자 사이에 데이터를 받아 전달해주는 역할을 수행한다. 대표적으로 사용되는 메시지 큐는 Mosquitto, HiveMQ, RabbitMQ, VerneMQ 등이 사용되는 것 같다. 

## 2. Characteristics

MQTT 프로토콜은 다음과 같은 특징 때문에 IoT 데이터 전송 표준이 되었다. 

- 가벼움과 효율성
  - IoT 디바이스는 리소스가 제한된다.
  - MQTT 제어 메시지는 2바이트 정도로 작다.
  - MQTT 메시지 헤더도 작기 때문에 네트워크 대역폭을 최소화 할 수 있다.
- 확장성
  - 전력 소비가 적은 프로토콜이므로 수많은 디바이스에 연결할 수 있다.
- 신뢰성
  - IoT 디바이스는 대역폭이 낮고 지연 시간이 긴 신뢰할 수 없는 셀룰러 네트워크를 통해 연결한다.
  - 정의한 QoS(Quality of Service) 레벨에 따라 메시지 전송과 수신 여부를 보장해주는 수준이 다르다.
- 보안
  - 메시지를 암호화하고 OAuth, TLS1.3, 고객 관리형 인증서 및 기타 인증 프로토콜을 사용할 수 있다.

## 3. QoS(Quality of Service)

구독자 역할을 수행하는 서버 애플리케이션을 개발하기 때문에 규격이나 특징보다는 구독 기능 구현 방법이나 신뢰도 높은 시스템을 구축하는 것에 더 관심이 간다. MQTT 특징 중 서비스 품질 수준(Quality of Service, QoS)은 MQTT 프로토콜 기반 통신 시스템의 신뢰도와 연관이 있다. 발행자 클라이언트와 브로커, 브로커와 구독자 클라이언트 사이에 메시지를 전달할 때 QoS 레벨에 따라 동작하는 방식이 다르다. 브로커마다 차이점이 있는지 모르겠지만, HiveMQ 사이트에 QoS 레벨에 대한 설명엔 다음과 같은 내용을 찾을 수 있다.

> If the subscribing client defines a lower QoS level than the publishing client, the broker will transmit the message with the lower QoS level.

구독자 클라이언트의 QoS 레벨이 발행자 클라이언트의 수준보다 낮은 경우 브로커는 낮은 수준의 QoS 레벨로 통신을 수행한다. 이제 각 수준 별로 어떻게 동작하는지 살펴보자. 발행자와 브로커 사이 통신을 기준으로 설명한다.  

- QoS 0 Level
  - 가장 낮은 레벨이며 메시지 전달을 최우선으로 한다.
  - 메시지가 브로커에게 정상적으로 전달되었는지 확인하지 않는다.
  - `fire and forget` 전략이므로 발행자는 메시지를 재전송하지 않는다.

<p align="center">
  <img src="/images/posts/2024/mqtt-protocol-01.png" width="80%" class="image__border">
</p>
<center>https://www.hivemq.com/blog/mqtt-essentials-part-6-mqtt-quality-of-service-levels/</center>

- QoS 1 Level
  - 메시지가 최소 한번은 전달되는 것을 최우선으로 한다.
  - 발행자는 메시지를 브로커에 보낸 후 `PUBACK` 응답을 받기 전까지 메시지 카피(copy)를 보관한다. 
  - `at least once` 전략이므로 발행자는 `PUBACK` 응답을 받지 못하는 경우 일정 시간 후 메시지를 재전송한다.

<p align="center">
  <img src="/images/posts/2024/mqtt-protocol-02.png" width="80%" class="image__border">
</p>
<center>https://www.hivemq.com/blog/mqtt-essentials-part-6-mqtt-quality-of-service-levels/</center>

- QoS 2 Level
  - 메시지가 정확히 한번 전달되는 것을 최우선으로 한다.
  - 브로커가 발행자의 메시지를 수신했지만, 이를 제대로 처리하지 못하는 경우를 지원한다.
  - 발행자는 메시지를 브로커에 보낸 후 `PUBREC` 응답을 받기 전까지 메시지 카피(copy)를 보관한다.
  - 발행자는 `PUBREC` 응답을 받지 못하면 일정 시간 후 메시지를 재전송한다.
  - 발행자는 `PUBREC` 응답을 받으면 `PUBREL` 요청을 보낸다.
  - 브로커는 `PUBREL` 요청을 받으면 메시지에 관련된 상태를 모두 정리하고 `PUBCOMP` 응답을 보낸다.
  - 발행자는 `PUBCOMP` 응답을 받으면 메시지에 관련된 상태를 모두 정리한다.
  - `exactly once` 전략이므로 발행자는 `PUBCOMP` 응답을 받지 못하는 경우 일정 시간 후 메시지를 재전송한다.

<p align="center">
  <img src="/images/posts/2024/mqtt-protocol-03.png" width="80%" class="image__border">
</p>
<center>https://www.hivemq.com/blog/mqtt-essentials-part-6-mqtt-quality-of-service-levels/</center>

## CLOSING

이번 글에선 MQTT 프로토콜에 관련된 내용을 살펴봤다면 다음 글은 스프링 프레임워크를 사용해 구독자 클라이언트를 구현하는 방법을 정리해볼 예정이다.

#### RECOMMEND NEXT POSTS

- [Implement MQTT Subscriber with Spring Boot][mqtt-subscriber-spring-boot]

#### REFERENCE

- <https://ko.wikipedia.org/wiki/MQTT>
- <https://www.iso.org/standard/69466.html>
- <https://aws.amazon.com/ko/what-is/mqtt/>
- <https://www.hivemq.com/blog/mqtt-essentials-part-6-mqtt-quality-of-service-levels/>

[mqtt-subscriber-spring-boot]: https://junhyunny.github.io/spring-boot/integration/mqtt-subscriber-spring-boot/