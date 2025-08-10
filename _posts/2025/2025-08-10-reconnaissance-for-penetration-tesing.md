---
title: "침투 테스트(penetration test)의 정찰 단계(reconnaissance)"
search: false
category:
  - security
  - hacking
  - white-hacking
  - penetration-test
  - pentest
  - renossance
last_modified_at: 2025-08-10T08:55:00
---

<br/>

## 1. Penetration Test

침투 테스트(penetration test, 약칭 펜 테스트)는 실전 공격자처럼 행동해서 시스템, 네트워크, 애플리케이션의 보안 취약점을 식별하고 이를 악용 가능한지 확인하는 활동이다. 펜 테스트는 5단계로 진행된다.

1. Reconnaissance(정찰)
  - 정찰 단계는 하며 대상 시스템/도메인/서비스에 대한 최대한 많은 정보를 수집한다.
2. Scanning(스캐닝 및 분석)
  - 수집한 정보를 바탕으로 시스템을 스캔한다. 대상 시스템의 네트워크, 서비스 버전, OS, 포트, 엔드포인트 등을 식별하고 분석한다.
3. Exploitation(취약점 공격)
  - 발견된 취약점을 실제로 공격해 침투 가능한지 검증한다.
4. Post-Exploitation (권한 상승 및 내부 접근)
  - 시스템 내부에서 권한을 상승하거나 추가 정보를 탈취하고, 재접근을 위한 백도어를 만든다.
5. Analysis / Reporting (분석 및 보고)
  - 침투 테스트라면 나중에 무엇을 했는지 추적할 수 있도록 모든 행위를 기록하여 포렌식 가능성을 유지하고 보고서를 작성한다.
  - 실제 공격자라면 로그 삭제, 명령어 히스토리 삭제 등과 같이 흔적을 없앤다. 

펜 테스트는 실제 해킹과 유사한 방법을 사용하기 때문에 반드시 사전에 명시적인 허가를 받은 대상에 대해서만 진행해야 한다. 사전 동의 없이 타인의 시스템이나 네트워크에 대한 펜 테스트는 불법이며 민사상 손해배상 및 형사 처벌을 받을 수 있다. 안전하게 펜 테스트를 하려면 테스트 범위, 기간, 방법, 책임 범위 등을 명시한 계약 또는 서면 동의가 필요하다. 이런 사전 준비가 우선적으로 수행되어야 한다.

이번 글은 침투 테스트에서 정보 수집 단계는 무엇이고 어떤 도구들을 사용하는지 정리한다.

## 2. Reconnaissance Phase

정찰 단계에선 대상 시스템의 네트워크, 조직, 도메인, 사람 등에 대한 모든 정보를 수집하고 분석 및 분류한다. 목표물의 운영 체제, 네트워크 구조, 도메인 정보 등 최대한 많은 단서를 확보해야 한다. 정보 수집이 부정확하여 적절한 취약점을 파악하지 못하면 취약점이 없는 시스템을 공격하기 위해 시도하기 때문에 결과적으로 시간과 자원을 낭비한다. 충분한 정보 수집은 공격 성공률을 좌우한다. 

정찰 단계는 기술적으로 정보를 수집하기 때문에 정보 수집(information gathering) 단계라고도 한다. 정보 수집은 두 가지로 구분한다.

- 패시브 정보 수집(passive information gathering)
  - 패시브 정보 수집은 대상 시스템에 직접 접근하지 않고, 공개된 정보를 수집하는 방법이다.
  - 탐지될 가능성이 거의 없고, 법적 위험이 낮다. 
- 액티브 정보 수집(active information gathering)
  - 액티브 정보 수집은 대상 시스템과 직접 통신하며 정보를 수집한다.
  - 특정 서비스, 포트의 동작 여부를 직접 확인할 수 있다.
  - IDS/IPS, 방화벽 등에 탐지될 가능성이 높고, 법적 허가 없이 수행하면 불법이다.

액티브 정보 수집은 실제 서비스, 포트의 동작 여부를 실제로 확인한다는 점에서 스캐닝(scanning) 단계라고 봐도 무방하다. 우선 패시브 정보 수집을 통해 눈에 띄지 않게 최대한 많은 정보를 모으고, 그 정보를 바탕으로 스캐닝을 계획한다.

패시브 정보 수집에서 수집한 데이터들은 다음 스캐닝 계획을 수립하기 위해 사용한다. 아래 데이터들이 핵심 수집 대상이다.

- IP 주소 범위 
  - 스캔 대상을 지정한다. 
- 도메인, 서브 도메인 목록
  - 스캔 범위를 확장하고, 내부/외부 서비스를 파악한다.
- 네임서버(DNS) 정보
  - DNS 취약점을 스캔하거나 Zone Transfer 가능성을 확인한다.
- 사용 중인 네트워크 블록(ASN)
  - 해당 기업이 소유한 전체 네트워크를 스캔이 가능하다.
- 웹 서비스 목록 & 기술 스택
  - 포트, 서비스 등의 스캔 방향을 설정한다.
- 메일 서버(MX) 정보
  - 이메일 관련 취약점을 테스트한다.
- SSL/TLS 인증서 정보
  - 도메인, 서브 도메인을 식별하고 버전 취약점을 탐색한다.
- 운영 국가 및 지역
  - 스캐닝 시간대 및 법률을 준수한다.
- 직원 정보 및 이메일 주소
  - 소셜 엔지니어링 또는 피싱을 연계할 떄 사용한다.

## 3. Information Gathering Tools

정보 수집을 위한 도구들을 살펴보자. 

### 3.1. whois

`whois` 명령어는 도메인 이름, IP 주소, ASN(Autonomous System Number)에 대한 등록 정보를 조회하는 도구다. 인터넷 자원 소유자 정보를 알려주는 전화번호부 같은 역할이다. 다음과 같은 정보를 알 수 있다.

- 도메인 소유자(registrant)
- 등록기관(register)
- 등록/만료 날짜
- 네임서버 정보
- 이메일, 전화번호 같은 연락처 정보
- IP 주소 범위와 소유자 정보

구글 홈페이지에 whois 명령어를 실행해보자.

```
$ whois google.com
   Domain Name: GOOGLE.COM
   Registry Domain ID: 2138514_DOMAIN_COM-VRSN
   Registrar WHOIS Server: whois.markmonitor.com
   Registrar URL: http://www.markmonitor.com
   Updated Date: 2019-09-09T15:39:04Z
   Creation Date: 1997-09-15T04:00:00Z
   Registry Expiry Date: 2028-09-14T04:00:00Z
   Registrar: MarkMonitor Inc.
   Registrar IANA ID: 292
   Registrar Abuse Contact Email: abusecomplaints@markmonitor.com
   Registrar Abuse Contact Phone: +1.2086851750
   Domain Status: clientDeleteProhibited https://icann.org/epp#clientDeleteProhibited
   Domain Status: clientTransferProhibited https://icann.org/epp#clientTransferProhibited
   Domain Status: clientUpdateProhibited https://icann.org/epp#clientUpdateProhibited
   Domain Status: serverDeleteProhibited https://icann.org/epp#serverDeleteProhibited
   Domain Status: serverTransferProhibited https://icann.org/epp#serverTransferProhibited
   Domain Status: serverUpdateProhibited https://icann.org/epp#serverUpdateProhibited
   Name Server: NS1.GOOGLE.COM
   Name Server: NS2.GOOGLE.COM
   Name Server: NS3.GOOGLE.COM
   Name Server: NS4.GOOGLE.COM
   DNSSEC: unsigned
   URL of the ICANN Whois Inaccuracy Complaint Form: https://www.icann.org/wicf/
   ...
--
```

### 3.2. whatweb

`whatweb` 명령어는 웹 사이트의 기술 스택과 구성 요소를 식별하는 도구다. 웹 사이트가 어떤 서버, 프레임워크, CMS, 스크립트 등을 쓰는지 확인할 수 있다. whatweb 명령어는 액티브 정보 수집 도구다. HTTP 요청을 보내서 웹 서버의 정보, 플러그인, CMS 버전 등을 식별하기 때문에 대상이 민감하게 반응하면 비인가 스캐닝으로 간주될 수 있다. 

`--aggressive` 옵션을 통해 정보 수집 강도를 모드를 조정할 수 있다. 공격성 레벨이 높다면 대량의 요청을 보내 부하를 줄 수 있기 때문에 비인가 스캐닝으로 간주될 수 있다. 공격 강도는 스텔스(1) 모드에서 헤비(4) 모드까지 지원한다. 강도를 높이지 않고 디폴트 값을 사용하는 것이 좋다.

```
$ whatweb --help

...

AGGRESSION:
The aggression level controls the trade-off between speed/stealth and
reliability.
  --aggression, -a=LEVEL        Set the aggression level. Default: 1.
  1. Stealthy                   Makes one HTTP request per target and also
                                follows redirects.
  3. Aggressive                 If a level 1 plugin is matched, additional
                                requests will be made.
  4. Heavy                      Makes a lot of HTTP requests per target. URLs
                                from all plugins are attempted.
```

명령어를 실행하면 플러그인(plugin) 정보를 확인할 수 있다. 플러그인이란 웹 애플리케이션, 서버, 브라우저 환경에서 기능을 확장하는 구성 요소 전반을 의미한다. 예를 들면 다음과 같은 플러그인 정보들을 확인할 수 있다.

- 웹 서버 종류 및 버전 식별
  - e.g. apache 모듈, nginx 모듈
- CMS 종류 및 버전 식별
  - e.g. wordpress, joomla 확장 기능
- JavaScript 라이브러리
  - e.g. jQuery, react, angular emd
- 보안, 추적 코드
  - e.g. 구글 애널리틱스, 페이스북 픽셀
- 서드파티 서비스
  - e.g. 결제 모듈, 지도 API, 채팅 위젯

[칼리 리눅스(kali linux) 도구 설명 사이트](https://www.kali.org/tools/whatweb/)에서 whatweb 명령어의 실행 예시 응답을 확인할 수 있다. 다음과 같이 서버, OS, 프론트엔드 라이브리러 정보 등을 획득할 수 있다. 구글, 페이스북 같은 대형 서비스에선 배너 마스킹을 통해 서버나 운영체제 정보를 공개하지 않는다. 서버나 운영체제의 버전 정보 노출은 공격자에게 불필요한 단서를 제공할 수 있기 때문이다. 

```
$ whatweb -v -a 3 192.168.0.102
WhatWeb report for http://192.168.0.102
Status    : 200 OK
Title     : Toolz TestBed
IP        : 192.168.0.102
Country   : RESERVED, ZZ

Summary   : JQuery, Script, X-UA-Compatible[IE=edge], HTML5, Apache[2.2,2.2.22], HTTPServer[Ubuntu Linux][Apache/2.2.22 (Ubuntu)]

Detected Plugins:
[ Apache ]
  The Apache HTTP Server Project is an effort to develop and
  maintain an open-source HTTP server for modern operating
  systems including UNIX and Windows NT. The goal of this
  project is to provide a secure, efficient and extensible
  server that provides HTTP services in sync with the current
  HTTP standards.

  Version      : 2.2.22 (from HTTP Server Header)
  Version      : 2.2
  Version      : 2.2
  Google Dorks: (3)
  Website     : http://httpd.apache.org/

[ HTML5 ]
  HTML version 5, detected by the doctype declaration


[ HTTPServer ]
  HTTP server header string. This plugin also attempts to
  identify the operating system from the server header.

  OS           : Ubuntu Linux
  String       : Apache/2.2.22 (Ubuntu) (from server string)

[ JQuery ]
  A fast, concise, JavaScript that simplifies how to traverse
  HTML documents, handle events, perform animations, and add
  AJAX.

  Website     : http://jquery.com/

[ Script ]
  This plugin detects instances of script HTML elements and
  returns the script language/type.


[ X-UA-Compatible ]
  This plugin retrieves the X-UA-Compatible value from the
  HTTP header and meta http-equiv tag. - More Info:
  http://msdn.microsoft.com/en-us/library/cc817574.aspx

  String       : IE=edge

HTTP Headers:
  HTTP/1.1 200 OK
  Server: Apache/2.2.22 (Ubuntu)
  Last-Modified: Fri, 02 Feb 2018 15:27:56 GMT
  ETag: "11f-2e38-5643c5b56a8d3"
  Accept-Ranges: bytes
  Vary: Accept-Encoding
  Content-Encoding: gzip
  Content-Length: 3541
  Connection: close
  Content-Type: text/html
```

### 3.3. theHarvester

대표적인 OSINT(오픈소스 정보 수집) 도구 중 하나이다. 주 목적은 도메인 기반으로 이메일, 서브도메인, 호스트, 직원 이름, IP 정보 등을 공개된 데이터에서 수집하는 것이다. 검색 엔진, 공개 PGP, SNS, Shodan API 등을 이용한 패시브 정보 수집을 수행한다. 

이렇게 수집한 이메일 정보는 사용자를 속이는 피싱(phising), 유출된 다른 사이트의 계정, 비밀번호 조합을 사용하여 로그인을 시도하는 크레덴셜  스터핑(credential stuffing), 스팸(spam)이나 멀웨어를 배포하는 등의 용도로 사용된다. 

theHarverster 명령어의 실행 결과는 매번 다르기 때문에 이를 감안해야 한다. 아래 실행 결과는 theHarvester 명령어를 통해 bing 검색 엔진에서 arh.bg.ac.rs 도메인에 관련된 정보를 수집한 내용이다. 호스트 정보와 이메일 정보를 수집했다.

```
$ theHarvester -d arh.bg.ac.rs -b bing

Read proxies.yaml from /etc/theHarvester/proxies.yaml
*******************************************************************
*  _   _                                            _             *
* | |_| |__   ___    /\  /\__ _ _ ____   _____  ___| |_ ___ _ __  *
* | __|  _ \ / _ \  / /_/ / _` | '__\ \ / / _ \/ __| __/ _ \ '__| *
* | |_| | | |  __/ / __  / (_| | |   \ V /  __/\__ \ ||  __/ |    *
*  \__|_| |_|\___| \/ /_/ \__,_|_|    \_/ \___||___/\__\___|_|    *
*                                                                 *
* theHarvester 4.8.1                                              *
* Coded by Christian Martorella                                   *
* Edge-Security Research                                          *
* cmartorella@edge-security.com                                   *
*                                                                 *
*******************************************************************

[*] Target: arh.bg.ac.rs 

Read api-keys.yaml from /etc/theHarvester/api-keys.yaml
        Searching 0 results.
[*] Searching Bing. 

[*] No IPs found.

[*] Emails found: 25
----------------------
2020_41012@edu.arh.bg.ac.rs
a.cirovic@arh.bg.ac.rs
dekan@arh.bg.ac.rs
dfurundzic@arh.bg.ac.rs
doctoral.school@arh.bg.ac.rs
eeplatforma@arh.bg.ac.rs
enestorm@arh.bg.ac.rs
exhibition@arh.bg.ac.rs
fakultet@arh.bg.ac.rs
ivana.gaiovic@arh.bg.ac.rs
ivana.gajovic@arh.bg.ac.rs
jelena.ivanovic@arh.bg.ac.rs
jelena.maric@arh.bg.ac.rs
jelena@arh.bg.ac.rs
lazovicz@arh.bg.ac.rs
makovl@arh.bg.ac.rs
prijemnimaf@arh.bg.ac.rs
prodekan.za.afirmaciju.kvaliteta@arh.bg.ac.rs
prodekan.za.nastavu@arh.bg.ac.rs
prodekan.za.nauku@arh.bg.ac.rs
redakcijasajta@arh.bg.ac.rs
saj@arh.bg.ac.rs
studentskasluzba@arh.bg.ac.rs
vesnac@arh.bg.ac.rs
viden@arh.bg.ac.rs

[*] No people found.

[*] Hosts found: 7
---------------------
e-learning.arh.bg.ac.rs
edu.arh.bg.ac.rs
eeplatforma.arh.bg.ac.rs
exhibition.arh.bg.ac.rs
raf.arh.bg.ac.rs
student.arh.bg.ac.rs
zaposleni.arh.bg.ac.rs
```

### 3.4. RED_HAWK

웹 기반 OSINT와 기본 취약점 분석을 한 번에 수행할 수 있는 PHP 기반 스캐닝 도구다. 터미널에서 PHP CLI를 통해 실행한다. 아래와 같은 작업을 수행할 수 있다.

- whois lookup 
  - 도메인 등록자, 등록 날짜, 네임서버 등 정보 조회
- Geo-IP lookup 
  - 도메인의 서버 위치(IP 기반 위치) 확인
- DNS lookup
  - A, MX, TXT, NS 레코드 조회
- Subdomain Finder
  - 대상 도메인의 하위 도메인 식별
- Banner Grabbing
  - 서버/서비스에서 반환하는 소프트웨어 및 버전 식별

이 도구를 사용하려면 [RED_HAWK 레포지토리](https://github.com/Tuhinshubhra/RED_HAWK)에서 스크립트를 클론(clone)한다. 해당 레포지토리 디렉토리에서 `php rhawk.php` 명령어를 실행한다. 도메인을 정하고 스캔 옵션들 중에 하나를 선택한다.

```
$ php rhawk.php

           All In One Tool For Information Gathering And Vulnerability Scanning
                                                              .  .  .  .
                                                              .  |  |  .
                                                           .  |        |  .
                                                           .              .
                                              @@@@@      . |  (\.|\/|./)  | .   ___   ____
  ██████╗ ███████╗██████╗    ###     ###    @@@@ @@@@    .   (\ |||||| /)   .  |   | /   /
  ██╔══██╗██╔════╝██╔══██╗   ###     ###   @@@@   @@@@   |  (\  |/  \|  /)  |  |   |/   /
  ██████╔╝█████╗  ██║  ██║   ###########   @@@@@@@@@@@     (\             )    |       /
  ██╔══██╗██╔══╝  ██║  ██║   ###########   @@@@@@@@@@@    (\  Ver  2.0.0  /)   |       \
  ██║  ██║███████╗██████╔╝   ###     ###   @@@     @@@     \      \/      /    |   |\   \
  ╚═╝  ╚═╝╚══════╝╚═════╝    ###     ###   @@@     @@@      \____/\/\____/     |___| \___\
                                                                |0\/0|
         {C} Coded By - R3D#@X0R_2H1N A.K.A Tuhinshubhra         \/\/
                                                                  \/  [$] Shout Out - You ;)

  
[#] Enter The Website You Want To Scan : google.com

[#] Enter 1 For HTTP OR Enter 2 For HTTPS: 2


      +--------------------------------------------------------------+                            
      +                  List Of Scans Or Actions                    +                            
      +--------------------------------------------------------------+                            

             Scanning Site : https://google.com                                                   


 [0]  Basic Recon (Site Title, IP Address, CMS, Cloudflare Detection, Robots.txt Scanner)
 [1]  Whois Lookup
 [2]  Geo-IP Lookup       
 [3]  Grab Banners
 [4]  DNS Lookup  
 [5]  Subnet Calculator   
 [6]  NMAP Port Scan      
 [7]  Subdomain Scanner   
 [8]  Reverse IP Lookup & CMS Detection     
 [9]  SQLi Scanner (Finds Links With Parameter And Scans For Error Based SQLi)  
 [10] Bloggers View (Information That Bloggers Might Be Interested In) 
 [11] WordPress Scan (Only If The Target Site Runs On WP)     
 [12] Crawler     
 [13] MX Lookup   
 [A]  Scan For Everything - (The Old Lame Scanner)   
 [F]  Fix (Checks For Required Modules and Installs Missing Ones)      
 [U]  Check For Updates   
 [B]  Scan Another Website (Back To Site Selection)  
 [Q]  Quit!       

[#] Choose Any Scan OR Action From The Above List: 0 

[+] Scanning Begins ...   
[i] Scanning Site: https://google.com       
[S] Scan Type : BASIC SCAN

[iNFO] Site Title: Google
[iNFO] IP address: 172.217.25.174  
[iNFO] Web Server: gws    
[iNFO] CMS: Could Not Detect
[iNFO] Cloudflare: Not Detected    
[iNFO] Robots File: Could NOT Find robots.txt!       


[*] Scanning Complete. Press Enter To Continue OR CTRL + C To Stop
```

### 3.5. Sherlock

셜록은 OSINT 도구다. 사용자 이름(username) 기반의 정보 수집에 특화되어 있다. 전 세계 수많은 웹사이트와 소셜 미디어에서 특정 사용자명을 검색해서 해당 계정이 존재하는지를 파악하는 도구다. 파이썬 기반의 프로젝트다. 병렬 처리로 빠르게 트위터, 깃허브, 인스타그램, 레딧, 틱톡 같은 사이트에서 해당 계정이 존재하는지 확인한다. 결과는 JSON/CSV 파일로 저장할 수 있다.

아래 명령어로 설치할 수 있다.

```
$ pipx install sherlock-project
```

설치가 완료되면 `sherlock` 명령어를 글로벌에서 사용할 수 있다. junhyunny 라는 사용자 정보를 찾아보자.

```
$ sherlock junhyunny

[*] Checking username junhyunny on:

[+] Dealabs: https://www.dealabs.com/profile/junhyunny
[+] Disqus: https://disqus.com/junhyunny
[+] Docker Hub: https://hub.docker.com/u/junhyunny/
[+] Duolingo: https://www.duolingo.com/profile/junhyunny
[+] Freelance.habr: https://freelance.habr.com/freelancers/junhyunny
[+] GNOME VCS: https://gitlab.gnome.org/junhyunny
[+] GitHub: https://www.github.com/junhyunny
[+] HackenProof (Hackers): https://hackenproof.com/hackers/junhyunny
[+] kaskus: https://www.kaskus.co.id/@junhyunny
[+] LibraryThing: https://www.librarything.com/profile/junhyunny
[+] Mydramalist: https://www.mydramalist.com/profile/junhyunny
[+] NICommunityForum: https://community.native-instruments.com/profile/junhyunny
[+] NationStates Nation: https://nationstates.net/nation=junhyunny
[+] NationStates Region: https://nationstates.net/region=junhyunny
[+] PepperIT: https://www.pepper.it/profile/junhyunny/overview
[+] Reddit: https://www.reddit.com/user/junhyunny
[+] Roblox: https://www.roblox.com/user.aspx?username=junhyunny
[+] TorrentGalaxy: https://torrentgalaxy.to/profile/junhyunny
[+] Velog: https://velog.io/@junhyunny/posts
[+] Weblate: https://hosted.weblate.org/user/junhyunny/
[+] YandexMusic: https://music.yandex/users/junhyunny/playlists
[+] livelib: https://www.livelib.ru/reader/junhyunny
[+] svidbook: https://www.svidbook.ru/user/junhyunny
[+] threads: https://www.threads.net/@junhyunny

[*] Search completed with 24 results
```

해당 결과는 junhyunny.txt 라는 파일에 저장된다.

```
$ cat junhyunny.txt

https://www.dealabs.com/profile/junhyunny
https://disqus.com/junhyunny
https://hub.docker.com/u/junhyunny/
https://www.duolingo.com/profile/junhyunny
https://freelance.habr.com/freelancers/junhyunny
https://gitlab.gnome.org/junhyunny
https://www.github.com/junhyunny
https://hackenproof.com/hackers/junhyunny
https://www.kaskus.co.id/@junhyunny
https://www.librarything.com/profile/junhyunny
https://www.mydramalist.com/profile/junhyunny
https://community.native-instruments.com/profile/junhyunny
https://nationstates.net/nation=junhyunny
https://nationstates.net/region=junhyunny
https://www.pepper.it/profile/junhyunny/overview
https://www.reddit.com/user/junhyunny
https://www.roblox.com/user.aspx?username=junhyunny
https://torrentgalaxy.to/profile/junhyunny
https://velog.io/@junhyunny/posts
https://hosted.weblate.org/user/junhyunny/
https://music.yandex/users/junhyunny/playlists
https://www.livelib.ru/reader/junhyunny
https://www.svidbook.ru/user/junhyunny
https://www.threads.net/@junhyunny
Total Websites Username Detected On : 24
```

## CLOSING

정보 수집할 때 하나의 만능 도구는 없는 것 같다. 여러 도구들의 특성을 알고, 적절하게 사용해야하는 것 같다. 학습을 위해서 사용한다면 공격으로 간주될 수 있기 때문에 액티브 정보 수집 방식을 주의해야 한다.

#### REFERENCE

- <https://www.udemy.com/course/complete-ethical-hacking-bootcamp-zero-to-mastery/>
- <https://en.wikipedia.org/wiki/Penetration_test>
- <https://www.kali.org/tools/whatweb/>
- <https://github.com/Tuhinshubhra/RED_HAWK>
- <https://github.com/sherlock-project/sherlock>