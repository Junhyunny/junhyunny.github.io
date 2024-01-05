---
title: "Create Self-Signed SAN SSL Ceriticate"
search: false
category:
  - information
last_modified_at: 2023-09-04T23:55:00
---

<br/>

## 0. 들어가면서

테스트를 위해 로컬 머신에 하버(harbor)를 설치하고 접근하는 과정에서 다음과 같은 인증서 문제가 발생했습니다. 

* 레거시 Common Name 방식이 아닌 SANs 방식의 인증서를 사용해야 한다.

```
x509: certificate relies on legacy Common Name field, use SANs instead
```

문제를 일으키는 Common Name 인증서와 이를 대신해 사용하라는 SANs 인증서에 대해 알아보겠습니다. 

## 1. Legacy Common Name(CN)

### 1.1. X.509 Certificate

X.509는 국제전기통신연합(ITU, International Telecommunication Union)에서 정의한 공개 키 인증서 국제 표준 포맷(format)입니다. 
X.509 인증서는 HTTPS 통신에 사용되는 TLS/SSL 프로토콜을 포함한 여러 인터넷 프로토콜에서 사용됩니다. 
X.509 인증서는 다음과 같은 구조를 가집니다. 

* 버전(Version)
    * X.509 인증서의 버전을 나타내며, 1, 2, 3 혹은 4 같은 정수 값으로 표현합니다.
    * 각 버전은 다른 필드 및 확장을 지원합니다.
    * 현재 3 버전이 주로 사용되며 Subject Alternaticve Name(SAN)과 같은 중요한 기능을 지원합니다.
* 일련 번호(Serial Number)
    * X.509 인증서의 고유한 식별자로 CA(인증 기관)가 각 인증서에 할당합니다.
* 서명 알고리즘(Signature Algorithm) 
    * CA가 인증서에 서명할 때 사용한 암호화 알고리즘을 의미합니다.
* 발급자(Issuer)
    * 인증서를 발급한 기관(CA) 정보를 의미합니다.
* 유효 기간(Validity Period)
    * 인증서의 유효 기간을 의미합니다.
    * 시작일, 만료일로 구성되어 있으며 이 기간 동안만 인증서가 유효합니다.
* 주체(Subject)
    * 인증서가 인증하는 개체의 정보를 나타냅니다.
* 공개 키(Public Key)
    * 인증서에는 공개 키가 포함되어 있으며, 이 키를 사용해 암호화 및 디지털 서명이 이뤄집니다.
* 서명(Signature)
    * CA가 개인 키로 서명한 인증서의 디지털 서명을 의미합니다.
    * 이 서명은 인증성의 무결성을 검증하고 CA의 신원을 확인하는 데 사용합니다.
* 확장(Extension)
    * 확장 필드는 인증서에 추가 정보를 포함할 수 있습니다. 
    * Basic Constraints
    * Key Usage
    * Extended Key Usage
    * Subject Alternative Name 

### 1.2. Subject in X.509 Certificate

X.509 인증서에서 주체 정보는 인증서가 인증하는 개체에 대한 정보입니다. 
주로 개인, 기업, 서버, 라우터 또는 다른 네트워크 디바이스 등을 식별하기 위해 사용합니다. 
다음과 같은 정보들이 포함되어 있습니다. 

* Common Name(CN)
    * 일반적인 이름을 나타내는 필드입니다.
    * 주로 도메인 이름이나 호스트 이름을 포함합니다.
    * 웹 서버에서 SSL/TLS 인증서를 사용할 때 웹 사이트의 도메인 이름이 여기에 들어갑니다.
* 조직(Organization)
    * 주체의 조직 또는 회사 이름을 나타내는 필드입니다.
* 조직 단위(Organizational Unit)
    * 조직 내에서의 부서 또는 단위를 식별하는 필드입니다.
    * 조직 내부 구조를 나타냅니다.
* 도시(Locality)
    * 주체의 위치를 나타내는 필드입니다.
* 주(State/Province)
    * 주체의 주 또는 주 소재지를 나타내는 필드입니다.
* 국가(Country)
    * 주체가 속한 국가를 나타내는 필드입니다.
    * 국가 코드를 사용하여 국가를 식별합니다.

## 2. Subject Alternative Name Certificate

일반 인증서는 주로 단일 도메인 또는 호스트 이름을 보호하기 위해 사용합니다. 
반면, SAN(Subject Alternative Name) 인증서는 하나의 SSL/TLS 인증서를 사용해 여러 개의 도메인이나 호스트를 보호하는데 사용됩니다. 
다음과 같은 경우에 SAN 인증서를 사용합니다.

* 다중 도메인 보호
    * 여러 개의 도메인 이름을 포함할 수 있습니다.
    * e.g. example.com, example.net, example.org
* 서브 도메인 보호
    * 주 도메인과 함께 여러 서브 도메인 이름을 포함할 수 있습니다.
    * e.g. blog.example.com, shop.example.com
* 멀티 도메인 보호
    * 주로 웹 호스팅 회사나 기업에서 여러 도메인을 보호하기 위해 사용합니다.

## 3. How to make Self-Signed SANs Certificate?

글 처음에 봤던 에러에서 레거시 Common Name을 사용하는 인증서의 의미는 CN 값은 지정되어 있지만, Subject Alternative Name 값이 설정되어 있지 않은 인증서를 의미합니다. 
OpenSSL을 사용하여 자체 서명 SANs 인증서를 만들어보겠습니다. 

### 3.1. Temporal CA Certificate

루트 CA(신뢰할 수 있는 CA) 인증서를 사용하지 않는다면 직접 CA 인증서를 생성하여 사용할 수 있습니다. 
테스트 용도로 사용하기 때문에 CA 인증서를 임의로 생성합니다. 

* CA 인증서를 생성할 때 사용할 개인 키(private key)를 생성합니다.

```
$ openssl genrsa -out ca.key 4096
```

* 임시 CA 인증서를 생성합니다.
    * req 
        * OpenSSL 인증서 생성 요청을 위한 명령어입니다.
    * -x509 
        * X.509 인증서를 생성하는 옵션입니다.
    * -new 
        * CA 자체를 생성하기 위해 이 옵션을 사용합니다.
        * 인증서 생성에 필요한 CSR(Certificate Signing Request) 정보를 입력하기 위한 옵션입니다.
    * -sha512
        * 서명 알고리즘으로 SHA-512를 사용합니다.
    * -days 365
        * 인증서 유효 기간을 설정합니다.
    * -key ca.key
        * CA 개인 키 파일을 지정하는 옵션입니다.
    * -out ca.crt
        * 생성된 자체 인증 CA 인증서의 이름을 지정합니다.

```
$ openssl req -x509 -new -sha512 -days 365 -key ca.key -out ca.crt

You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:KR
State or Province Name (full name) [Some-State]:Seoul
Locality Name (eg, city) []:Seoul
Organization Name (eg, company) [Internet Widgits Pty Ltd]:VMware
Organizational Unit Name (eg, section) []:Tanzu Labs
Common Name (e.g. server FQDN or YOUR name) []:temporal.root.ca.certificate
Email Address []:
```

### 3.2. SANs Configuration File

SAN 인증서를 생성하기 위해 필요한 설정 파일입니다. 
주체의 다른 도메인 주소들을 추가 입력합니다. 

```
$ echo 'subjectAltName=DNS:myharbor.io,DNS:www.myharbor.io' > version3extions.cnf
```

### 3.3. Self-Signed Certificate for Server

하버 서버에서 사용할 인증서를 생성합니다. 

* 서버에서 사용할 개인 키(private key)를 생성합니다.

```
$ openssl genrsa -out server.key 4096
```

* CSR 파일을 생성합니다.
    * 인증서를 발급하기 위해 필요한 주체 정보를 담은 파일입니다.
    * 위 CA 인증서 발급에서는 인증서 발급과 동시에 수행하였습니다.
    * CN 정보를 입력할 때 하버 서버의 도메인 이름을 작성합니다.

```
$ openssl req -sha512 -new -key server.key -out server.csr

You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:ㅏKR
State or Province Name (full name) [Some-State]:Seoul
Locality Name (eg, city) []:Seoul
Organization Name (eg, company) [Internet Widgits Pty Ltd]:VMware
Organizational Unit Name (eg, section) []:Tanzu Labs
Common Name (e.g. server FQDN or YOUR name) []:myharbor.io
Email Address []:

Please enter the following 'extra' attributes
to be sent with your certificate request
A challenge password []:
An optional company name []:
```

* CRT 인증서 파일을 생성합니다.
    * -extfile version3extions.cnf
        * 이전 단계에서 생성한 version3extions.cnf 파일을 사용해 SAN 정보를 추가합니다.
    * -CA ca.crt
        * 이전 단계에서 생성한 CA 인증서를 사용합니다.
        * 서명에 사용할 CA 인증서 파일을 의미합니다.
    * -CAkey ca.key
        * 이전 단계에서 생성한 CA 개인 키를 지정합니다.
        * CA 서명에 사용됩니다.
    * -CAcreateserial
        * 시리얼 번호 파일을 자동으로 생성하는 옵션입니다.
        * 발급된 서버용 인증서의 고유한 식별자를 관리합니다.
    * -in server.csr
        * 이전 단계에서 생성한 CSR 파일을 사용합니다.

```
$ openssl x509 -req -sha512 -days 365 \
-extfile version3extions.cnf \
-CA ca.crt -CAkey ca.key -CAcreateserial \
-in server.csr \
-out server.crt

Certificate request self-signature ok
subject=C = KR, ST = Seoul, L = Seoul, O = VMware, OU = Tanzu Labs, CN = myharbor.io
```

* 정상적으로 SAN 정보가 인증서에 추가되었는지 다음 명령어를 통해 확인합니다.
    * SAN 정보가 추가되어 있습니다.

```
$ openssl x509 -text -noout -in server.crt | grep -A 1 "Subject Alternative Name"

            X509v3 Subject Alternative Name:
                DNS:myharbor.io, DNS:www.myharbor.io
```

#### REFERENCE

* <https://en.wikipedia.org/wiki/X.509>
* <https://goharbor.io/docs/2.0.0/install-config/configure-https/>
* <https://gist.github.com/KeithYeh/bb07cadd23645a6a62509b1ec8986bbc>
* <https://velog.io/@hyeseong-dev/Harbor-%EC%86%8C%EA%B0%9C-%EC%84%A4%EC%B9%98-%EB%B0%8F-%EB%B0%B0%ED%8F%AC>
* <https://www.golinuxcloud.com/openssl-subject-alternative-name/>
* <https://chat.openai.com/>