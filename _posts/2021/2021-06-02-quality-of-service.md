---
title: "QoS(Quality of Service)"
search: false
category:
  - information
last_modified_at: 2021-09-03T01:00:00
---

<br/>

## 1. QoS(Quality of Service)

여러 곳에서 `QoS`에 대한 정의를 다양하게 표현하고 있습니다. 

> QoS(Quality of Service)는 다른 응용 프로그램, 사용자, 데이터 흐름 등에 우선 순위를 정하여, 데이터 전송에 특정 수준의 성능을 보장하기 위한 능력을 말한다. 

> 프레임 릴레이, ATM(Asynchronous Transfer Mode), 이더넷 및 802.1 네트워크, SONET, IP 라우팅 네트워크 등 다양한 기본 기술을 통해 선택된 네트워크 트래픽에 더 나은 서비스를 제공하는 네트워크의 기능을 의미합니다. QoS는 어플리케이션이 데이터 처리량 용량(대역폭), 레이턴시 변형(지터), 지연 등의 측면에서 예측 가능한 서비스 레벨을 요청 및 수신할 수 있도록 하는 기술 모음입니다. 

> 한정된 네트워크 자원 내에서 특정 트래픽이 일정 수준의 성능, 속도를 보장받는 네트워크 기술

> Network 의 대역폭, 처리율, 지연율, 손실율 등을 관리하는 기술

> 서비스 이용자의 만족도를 결정하는 서비스 성능의 총체적 효과(ITU-T E.800)

이를 필자가 이해하기 쉬운 표현으로 다시 정리하면 다음과 같습니다. 

* 데이터 통신에서 발생되는 데이터 손실을 줄이고 통신 속도를 개선시키기 위한 기술
* 특정 유형의 IP 트래픽을 우대하는 방법을 이용하여 차별화되는 서비스를 제공할 수 있는 기술

## 2. 품질 측정 요소

품질에 대해 이야기이므로 기준이 정리될 필요가 있어보입니다. 
어떤 요소들이 기준이 되어 품질의 좋고 나쁨을 구별할 수 있을지 간략하게 정리해보겠습니다. 

### 2.1. 대역폭(Bandwidth)

* 특정 어플리케이션에 할당된 네트워크 자원의 양을 의미
* 일정 시간에 처리한 데이터의 총량
* 제어 기술 - Queuing Shaping, Policing

### 2.2. 지연(Delay)

* 서비스 또는 특정 처리를 위해 기다림으로 발생하는 지연
* 발송지에서 목적지까지 가는 경로에서 발생 되는 지연
* 제어 기술 - Queuing

### 2.3. 패킷 손실(Packet Loss)

* 네트워크에서 데이터를 전송하는 과정에서 패킷의 손실정도
* 주된 원인은 네트워크 혼잡으로 인한 버퍼 오버플로우
* 제어 기술 - Queuing, RED, WRED

### 2.4. 지터(Jitter)

* 신호가 네트워크를 통해서 전달되는 과정에서 원래 신호로부터 왜곡되는 정도
* 연속 지연(Serialization Delay), 전달 지연(Propagation Delay), 큐잉 지연(Queuing Delay)
* 제어 기술 - Queuing 

## 3. QoS in VerneMQ

`QoS`에 관련된 내용을 정리한 이유는 `VerneMQ`라는 기술을 공부하다가 궁금했기 때문입니다. 
`VerneMQ`에서 설명하는 `QoS`는 위에서 정리한 내용과 달리 MQTT 프로토콜이 제공하는 서비스의 신뢰도와 속도에 대한 내용이라는 느낌을 받았습니다. 

### 3.1. Fire and forget (QoS 0)

* 메시지를 한 번만 전달됩니다.
* 한 번만 전달하지만 전달 여부는 확인하지 않습니다.

### 3.2. At least once (QoS 1)

* 메시지는 최소 한번은 전달됩니다. 
* 브로커가 발행자(publisher)에게 `PUBACK`를 보내어 전달 성공을 알립니다.
* 정상적인 통신이 이루어지지 않은 경우 `PUBACK`을 받지 못한 발행자는 적정시간이 지난 후 다시 메시지를 전달합니다.
* 구독자(Subscriber)에게 중복 메시지를 보내는 경우가 발생합니다.

### 3.3. Exactly once (QoS 2)

* 메시지는 반드시 한번 전달됩니다.
* `PUBACK` 과정을 `PUBREC`, `PUBREL`으로 핸드 쉐이킹을 수행합니다.
* 브로커는 전달받은 메시지를 저장합니다.
* `PUBREC`가 분실되어 발행자가 다시 메시지를 보내도 브로커는 메시지를 알고 있기 때문에 다시 구독자에게 전달하지 않습니다.
* 발행자가 `PUBREC`을 받으면 `PUBREL` 메시지를 전달합니다.
* 브로커가 `PUBREL`을 받으면 저장해둔 메시지를 지운 후 `PUBCOMP`을 전달합니다. 

##### MQTT QoS(Qaulity of Service)

* `VernMQ`에서 말하는 `QoS` 수준은 MQTT 프로토콜의 `QoS` 수준을 의미합니다. 

<p align="center">
    <img src="/images/quality-of-service-1.jpg" width="80%" class="image__border">
</p>
<center>https://devopedia.org/mqtt</center>

#### REFERENCE

* <https://ko.wikipedia.org/wiki/QoS>
* <https://www.cisco.com/c/ko_kr/support/docs/quality-of-service-qos/qos-policing/22833-qos-faq.html>
* <https://namu.wiki/w/QoS>
* <https://itwiki.kr/w/QoS#QoS_.EB.A0.88.EB.B2.A8>
* <https://m.blog.naver.com/bi1189/221472713258>
* <https://devopedia.org/mqtt>
* <https://dalkomit.tistory.com/111>
* <https://wnsgml972.github.io/mqtt/2018/03/05/mqtt/>
* <https://vernemq.com/>
* <https://m.blog.naver.com/bi1189/221472713258>

[vernemq-link]: https://vernemq.com/