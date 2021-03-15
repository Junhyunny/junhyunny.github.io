---
title: "[IllegalStateException] Incompatible fallbackFactory instance."
search: false
category:
  - spring
  - spring cloud
  - msa
  - circuit-breaker
  - hystrix
  - netflix-oss
  - exception
last_modified_at: 2021-03-16T00:00:00
---

<br>

작성 중입니다.

> **IllegalStateException 발생**<br>
> Incompatible fallbackFactory instance. 
> Fallback/fallbackFactory of type class cloud.in.action.proxy.BServiceFeinClient$BServiceFallbackFactory is not assignable 
> to interface org.springframework.cloud.openfeign.FallbackFactory for feign client b-service

## 발생 원인
import org.springframework.cloud.openfeign.FallbackFactory; not error<br>
import feign.hystrix.FallbackFactory; error

## OPINION
작성 중입니다.

#### REFERENCE
- <>