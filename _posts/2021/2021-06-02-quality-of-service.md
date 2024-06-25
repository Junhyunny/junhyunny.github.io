---
title: "Quality of Service"
search: false
category:
  - information
last_modified_at: 2021-09-03T01:00:00
---

<br/>

## 0. 들어가면서

MQTT 프로토콜을 사용하는 프로젝트에 참여했다. QoS 레벨에 관련된 이야기가 나와서 관련된 내용을 찾아봤다. 서비스 품질(QoS, Quality of Service)이라는 검색어로 찾아봤을 때 MQTT 프로토콜에 관련된 내용은 거의 없었다. 이왕 공부한 김에 블로그에 정리했다. MQTT 프로토콜의 SoQ 레벨 관련된 내용은 [MQTT(Message Queuing Telemetry Transport) Protocol][mqtt-protocol-link]을 참고하길 바란다.

## 1. Quality of Service

> Wiki<br/>
> 서비스 품질은 응용 프로그램, 사용자, 데이터 흐름 등에 우선 순위를 정하여 데이터 전송에 특정 수준의 성능을 보장하기 위한 능력을 말한다. 

서비스 품질이란 네트워크 관련 용어로 네트워크 트래픽의 성능, 신뢰성 및 우선순위를 관리하고 보장하는 것을 의미한다. 대역폭이 제한되고 다양한 유형의 데이터가 효과적으로 작동하기 위해선 서비스 품질을 보장하기 위한 기술이 필요하다. 

높은 서비스 품질은 부드럽고 신뢰할 수 있는 사용자 경험을 만든다. VoIP(Voice over IP), 화상 회의 및 스트리밍 서비스와 실시간 통신이 필요한 서비스의 경우 중단 없이 효율적으로 작동하도록 보장한다. 높은 서비스 품질을 위한 작업은 네트워크 리소스 사용을 최적화하여 혼잡 및 병목 현상을 줄일 수 있다.

## 2. How to measure OoS?

일정 수준의 서비스 품질을 유지한다는 것은 서비스 품질이 측정 가능해야 한다는 의미이다. 어떤 요소들을 통해 서비스 품질을 측정할 수 있을까?

- 대역폭(bandwidth) 관리
  - 애플리케이션이 필요한 네트워크 대역폭을 할당 받아야 한다.
  - 대역폭은 일정 시간에 처리한 데이터의 총량을 의미한다.
- 지연(delay)
  - 데이터가 발송지에서 목적지까지 가는 이동하는 데 걸리는 시간이다.
- 패킷 손실(packet loss)
  - 전송 중 손실되는 패킷의 백분율을 의미한다.
  - 네트워크 혼잡으로 인한 버퍼 오버플로우 때문에 주로 패킷 손실이 발생한다.
- 지터(jitter)
  - 각 데이터 패킷 사이의 지연 시간 변동성을 의미한다.
  - 패킷 도착 시간의 불일치를 측정한다. 
  - 높은 지터는 데이터 패킷의 일관된 타이밍이 중요한 VoIP, 화상 회의 및 온라인 게임과 같은 실시간 통신에서 문제를 일으킨다.

## 3. How to improve QoS?

어떻게 서비스 품질을 높일 수 있을까? 서비스 품질을 높이기 위해선 여러 전략과 기술이 함께 동작한다. 몇 가지만 살펴보자. 트래픽의 우선순위를 결정하는 방법이 있다.

- 트래픽의 우선순위를 구분하고 마킹(marking)하기 위해 DSCP(Differentiated Services Code Point)이나 CoS(Class of Service)를 사용한다.
- 우선순위 별로 큐를 구분하여 사용한다.

다음으로 네트워크 대역폭을 관리하는 방법이 있다. 

- 중요한 애플리케이션에게 적절한 네트워크 대역폭을 지정한다.
- 패킷 버퍼나 토큰을 사용해 네트워크 망에 유익, 유출되는 트래픽량과 속도를 조절하는 트래픽 쉐이핑(traffic shaping)을 사용한다. 
- 트래픽 혼잡을 방지하기 위해 최대 데이터 전송률을 지정한다.

네트워크 혼잡을 관리하는 방법도 있다.

- WFQ(Weighted Fair Queuing)이나 LLQ(Low-Latency Queuing) 같은 큐 전략을 사용한다.
- RED(Random Early Detection) 전략을 통해 네트워크 혼잡이 미리 감지되면 패킷을 드랍(drop)한다.

이 외에도 지터, 지연, 패킷 손실 등을 줄이는 방법이나 네트워크 망을 디자인하고 최적화하는 방법들이 있다. 높은 서비스 품질 유지를 위해선 서비스 품질을 측정할 수 있는 기술과 도구들을 활용해 모니터링과 분석을 수행할 필요가 있다. 

## CLOSING

필자는 네트워크 전문가가 아니기 때문에 자세한 내용은 필요한 경우 공부할 생각이다.

#### REFERENCE

- <https://chatgpt.com>
- <https://ko.wikipedia.org/wiki/QoS>
- <https://itwiki.kr/w/QoS#QoS_.EB.A0.88.EB.B2.A8>
- <https://www.cisco.com/c/ko_kr/support/docs/quality-of-service-qos/qos-policing/22833-qos-faq.html>
- <https://m.blog.naver.com/bi1189/221472713258>

[mqtt-protocol-link]: https://junhyunny.github.io/information/mqtt-protocol/
