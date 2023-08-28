---
title: "Schema Migration"
search: false
category:
  - information
  - database
last_modified_at: 2023-08-21T23:55:00
---

<br/>

## 1. Risk of Change Schema 

어플리케이션을 개발하거나 시스템을 운영하다보면 데이터베이스 스키마(schema)에 변경이 발생하게 됩니다. 

* 새로운 기능(feature)이 추가되면서 데이터 모델의 변화가 발생할 수 있습니다.
* 성능 최적화를 위한 인덱스 추가, 변경 등의 스키마 변경이 발생할 수 있습니다.
* 데이터를 효율적으로 관리하기 위해 데이터 모델이 재구조화될 수 있습니다. 
* 데이터 정확성과 일관성을 유지하기 위해 제약조건(constraint)을 추가할 수 있습니다. 

개발 혹은 테스트를 위한 데이터베이스의 스키마 변경은 쉬운 편입니다. 
반면 운영 중인 데이터베이스의 스키마를 바꾸는 일은 상당히 어렵습니다. 
시스템 규모가 클수록 스키마 변경의 어려움은 커집니다. 

* 잘못된 스키마 변경으로 운영 중인 데이터의 손실이 발생할 수 있습니다.
* 스키마를 변경하면 동작 중인 어플리케이션에 이상이 발생할 수 있습니다.
* 큰 규모의 스키마 변경은 데이터베이스 다운타임(downtime)이 필요할 수 있습니다.
* 스키마를 변경 후 문제가 문제가 발생한 경우 백업과 롤백이 어려울 수 있습니다.

## 2. Schema Migration

> 스키마 마이그레이션(schema migration)은 스키마 변경을 계획적으로 관리하는 프로세스

스키마 변경에 대한 리스크를 완화하기 위해 버전 관리, 롤백, 테스트 작업 등을 수행합니다. 
데이터베이스 마이그레이션이라 부르기도 하며 데이터 마이그레이션(data migration)과는 다르므로 주의해야 합니다. 

### 2.1. Why Schema Migration?

개발이 진행되면 어플리케이션 실행 환경마다 서로 다른 데이터베이스를 사용하기 때문에 스키마가 달라질 수 있습니다. 
소스 코드는 깃(git) 같은 형상 관리 도구를 통해 공통적인 코드 베이스 관리가 가능하지만, 데이터베이스에 대한 형상 관리는 어려움이 따릅니다. 

* 개발자마다 로컬 환경에 필요한 데이터베이스를 설치하여 사용합니다.
    * 개발자 Axel은 기능 개발을 위해 자신의 로컬 데이터베이스의 스키마만 변경 후 변경된 기능을 검증합니다.
    * 코드를 올리면 CI 환경과 다른 개발자들 환경에서 스키마 관련된 에러가 발생할 수 있습니다.
* 개발, 테스트, 프로덕션 환경마다 서로 다른 데이터베이스를 사용합니다.
    * 각 환경으로 어플리케이션이 배포될 때마다 개발자 혹은 DBA가 변경된 스키마를 위한 작업을 수행해야합니다.
    * DDL(Data Definition Language) 스크립트를 일일이 작성하고 실행하는 것은 실수의 위험이나 빠른 롤백의 어려움이 있습니다. 

<p align="center">
    <img src="/images/schema-migration-1.JPG" width="100%" class="image__border image__padding">
</p>
<center>https://documentation.red-gate.com/fd/why-database-migrations-184127574.html</center>

### 2.2. Schema Migration Tools

프로그램적으로 작업을 수행할 수 있는 도구를 통해 스키마 마이그레이션이 가능합니다. 
마이그레이션 도구를 통해 다음과 같은 이점들을 얻을 수 있습니다. 

* 스키마 마이그레이션을 위한 스크립트를 작성하고 관리할 수 있습니다.
    * 코드 형상 관리 도구를 스크립트를 관리할 수 있으며 이를 통해 변경된 스키마 마이그레이션 정보를 개발자들이 쉽게 알 수 있습니다. 
    * 변경된 데이터베이스 스키마 정보를 각 환경마다 적용시킬 수 있습니다.
* 스키마 변경에 대한 이력성 메타 데이터를 관리합니다.
    * 변경 작업에 대한 버전 관리를 수행합니다.
    * 변경 작업을 추적하고 롤백하는데 유용합니다.
* 여러 개발자가 동시에 작업을 수행하더라도 일관된 스키마 변경을 유지할 수 있습니다.
    * 모든 변경 사항이 버전으로 관리되므로 개발자는 최신 스키마 상태를 유지할 수 있습니다.
* 변경 작업을 테스트하고 롤백할 수 있는 기능을 제공합니다.
    * 테스트 환경에서 검증할 수 있으며 롤백을 통해 이전 상태로 돌릴 수 있습니다.
* 마이그레이션 파일에 변경 내용과 목적을 설명하는 주석을 함께 작성할 수 있습니다.   
    * 변경 사항에 대한 의도와 내용을 문서화할 수 있습니다.
    * 스키마 변화를 추적할 수 있습니다.

스키마 마이그레이션 도구를 사용하더라도 스키마 변경으로 인한 데이터 손실의 위험성은 동일하므로 주의가 필요합니다. 

#### REFERENCE

* <https://en.wikipedia.org/wiki/Schema_migration>
* <https://chat.openai.com>
* <https://documentation.red-gate.com/fd/why-database-migrations-184127574.html>