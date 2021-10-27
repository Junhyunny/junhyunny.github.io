---
title: "Hadoop Ambari 설치하기"
search: false
category:
  - information
  - hadoop
last_modified_at: 2021-10-27T23:55:00
---

<br>

## 0. 들어가면서
클라이언트로부터 Ambari 설치를 요청받았는데, 쉽게 생각했던 일이 사실은 만만하지 않았습니다. 
무엇보다 큰 장벽이 Ambari 버전이었습니다. 
Ambari 2.4.0 버전으로 설치를 진행하다 거의 하루를 소비했었는데, 나중에서야 확인해보니 너무 하위 버전이었습니다. 
다른 분들은 이런 고생을 하지 않도록 포스트로 정리하였습니다. 

## 1. Ambari 소개
공식 홈페이지의 글을 인용하자면 다음과 같습니다.

> Apache Hadoop 클러스터를 관리, 모니터링하기 위한 소프트웨어입니다. 
> 소프트웨어를 통해 Apache Ambari 프로젝트는 하둡 관리를 더 쉽게 만드는 것이 목적입니다. 
> Web UI를 통해 직관적이고, 쉬운 하둡 관리 기능을 제공합니다. 

Hadoop 설치, 설정 및 배포, 모니터링, 알림 등의 운영 편의성을 제공해주는 소프트웨어입니다.
Ambari는 시스템 관리자가 다음과 같은 세 가지를 가능하도록 만듭니다. 
- Provision a Hadoop Cluster
    - Ambari provides a step-by-step wizard for installing Hadoop services across any number of hosts.
    - Ambari handles configuration of Hadoop services for the cluster.
- Manage a Hadoop Cluster
    - Ambari provides central management for starting, stopping, and reconfiguring Hadoop services across the entire cluster.
- Monitor a Hadoop Cluster
    - Ambari provides a dashboard for monitoring health and status of the Hadoop cluster.
    - Ambari leverages Ambari Metrics System for metrics collection.
    - Ambari leverages Ambari Alert Framework for system alerting and will notify you when your attention is needed (e.g., a node goes down, remaining disk space is low, etc).

<p align="center"><img src="/images/hadoop-ambari-1.JPG" width="60%"></p>
<center>이미지 출처, https://docs.microsoft.com/ko-kr/azure/hdinsight/hdinsight-cluster-availability</center>

## 2. Ambari 설치 환경
다음과 같은 환경에서 Ambari 설치를 수행하였습니다.
- ubuntu-20.04.3-desktop-amd64
- Ambari 2.7.5.0.0
- JDK 1.8, 1.8 버전이 아닌 경우에는 에러가 발생합니다.

다음과 같은 부가적인 툴(tool)들이 필요합니다.
- maven 3.6.3
- npm 6.14.4
- git 2.25.1

## 3. Ambari 설치
이제 본격적으로 설치를 진행해보겠습니다. 
다음과 같은 절차를 통해 설치를 진행합니다. 
1. 코드 다운받기
1. 메이븐을 이용한 코드 빌드 및 패키지 파일 생성
1. 패키지 파일 설치
1. 서버 설정 및 실행

설치 방법은 아래 링크를 참조해주시길 바랍니다.
- <https://cwiki.apache.org/confluence/display/AMBARI/Installation+Guide+for+Ambari+2.7.5>

##### 코드 다운로드 및 버전 설정

```
wget https://www-eu.apache.org/dist/ambari/ambari-2.7.5/apache-ambari-2.7.5-src.tar.gz (use the suggested mirror from above)
tar xfvz apache-ambari-2.7.5-src.tar.gz
cd apache-ambari-2.7.5-src
mvn versions:set -DnewVersion=2.7.5.0.0
 
pushd ambari-metrics
mvn versions:set -DnewVersion=2.7.5.0.0
popd
```

##### 빌드 및 패키지 생성

```
mvn -B clean install jdeb:jdeb -DnewVersion=2.7.5.0.0 -DbuildNumber=5895e4ed6b30a2da8a90fee2403b6cab91d19972 -DskipTests -Dpython.ver="python >= 2.6"
```

##### 패키지 파일 설치
설명 글에는 `ambari-server/target/rpm/ambari-server/RPMS/noarch/` 경로라고 설명되어 있지만, `ambari-server/target` 폴더에 존재합니다. 

```
apt-get install ./ambari-server*.deb
```

## 4. Ambari 설치 관련 오류 및 해결 방법

### 4.1. apache-rat-plugin 문제

처음으로 다음과 같은 에러를 만날 수 있습니다. 

```
[INFO] ------------------------------------------------------------------------
[ERROR] Failed to execute goal org.apache.rat:apache-rat-plugin:0.12:check (default) on project ambari: Too many files with unapproved license: 1 See RAT report in: /home/***/Apache_Ambari/apache-ambari-2.7.5-src/target/rat.txt -> [Help 1]
[ERROR] 
[ERROR] To see the full stack trace of the errors, re-run Maven with the -e switch.
[ERROR] Re-run Maven using the -X switch to enable full debug logging.
[ERROR] 
[ERROR] For more information about the errors and possible solutions, please read the following articles:
[ERROR] [Help 1] http://cwiki.apache.org/confluence/display/MAVEN/MojoFailureException
```

찾아보니 오픈 소스를 사용할 때 라이센스가 붙어 있지 않은 파일들이 있는 경우 에러가 발생한다고 합니다. 
라이센스 내용을 넣어주면 에러가 나지 않지만, 파일이 너무 많습니다.

##### 해결 방법
- `-Drat.skip=true` 옵션을 통해 해결 가능합니다.
- 해당 옵션을 추가한 명령어는 아래와 같습니다. 

```
mvn -B clean install jdeb:jdeb -DnewVersion=2.7.5.0.0 -DbuildNumber=5895e4ed6b30a2da8a90fee2403b6cab91d19972 -DskipTests -Drat.skip=true -Dpython.ver="python >= 2.6"
```

### 4.2. Ambari Amdin View 설치 에러
`Ambari Amdin View` 설치 중 발생하는 에러입니다. 

```
[INFO] Copying extracted folder /tmp/phantomjs/phantomjs-2.1.1-linux-x86_64.tar.bz2-extract-1635360411327/phantomjs-2.1.1-linux-x86_64 -> /home/jun/apache-ambari-2.7.5-src/ambari-admin/src/main/resources/ui/admin-web/node_modules/phantomjs/lib/phantom
[INFO] Install exited unexpectedly
[ERROR] npm ERR! Linux 5.11.0-38-generic
[ERROR] npm ERR! argv "/home/jun/apache-ambari-2.7.5-src/ambari-admin/src/main/resources/ui/admin-web/node/node" "/home/jun/apache-ambari-2.7.5-src/ambari-admin/src/main/resources/ui/admin-web/node/node_modules/npm/bin/npm-cli.js" "install" "--unsafe-perm"
[ERROR] npm ERR! node v4.5.0
[ERROR] npm ERR! npm  v2.15.0
[ERROR] npm ERR! code ELIFECYCLE
[ERROR] 
[ERROR] npm ERR! phantomjs@1.9.20 install: `node install.js`
[ERROR] npm ERR! Exit status 1
[ERROR] npm ERR! 
[ERROR] npm ERR! Failed at the phantomjs@1.9.20 install script 'node install.js'.
[ERROR] npm ERR! This is most likely a problem with the phantomjs package,
[ERROR] npm ERR! not with npm itself.
[ERROR] npm ERR! Tell the author that this fails on your system:
[ERROR] npm ERR!     node install.js
[ERROR] npm ERR! You can get information on how to open an issue for this project with:
[ERROR] npm ERR!     npm bugs phantomjs
[ERROR] npm ERR! Or if that isn't available, you can get their info via:
[ERROR] npm ERR! 
[ERROR] npm ERR!     npm owner ls phantomjs
[ERROR] npm ERR! There is likely additional logging output above.
[ERROR] 
[ERROR] npm ERR! Please include the following file with any support request:
[ERROR] npm ERR!     /home/jun/apache-ambari-2.7.5-src/ambari-admin/src/main/resources/ui/admin-web/npm-debug.log
```

##### 해결 방법
- `StackOverflow` - <https://stackoverflow.com/questions/26053982/setup-script-exited-with-error-command-x86-64-linux-gnu-gcc-failed-with-exit>
- pom.xml 설정 중 `admin-web` 설정에 대한 버전 값을 변경합니다.

##### 이전 버전

```
    <configuration>
        <nodeVersion>v4.5.0</nodeVersion>
        <npmVersion>2.15.0</npmVersion>
        <workingDirectory>src/main/resources/ui/admin-web/</workingDirectory>
        <npmInheritsProxyConfigFromMaven>false</npmInheritsProxyConfigFromMaven>
    </configuration>
```

##### 변경된 버전

```
    <configuration>
        <nodeVersion>v11.10.0</nodeVersion>
        <npmVersion>6.7.0</npmVersion>
        <workingDirectory>src/main/resources/ui/admin-web/</workingDirectory>
        <npmInheritsProxyConfigFromMaven>false</npmInheritsProxyConfigFromMaven>
     </configuration>
```

### 4.3. Cannot get from amazone A3
`ambari-metrics` 의존성 빌드 시 아마존 스토리지에 접근할 때 다음과 같은 에러가 발생합니다. 
브라우저를 통해 접근해보니 `Access Denied` 상태입니다. 

```
[ERROR] Failed to execute goal org.apache.maven.plugins:maven-antrun-plugin:1.7:run (default) on project ambari-metrics-timelineservice: An Ant BuildException has occured: Can't get https://s3.amazonaws.com/dev.hortonworks.com/HDP/centos7/3.x/BUILDS/3.1.4.0-315/tars/hbase/hbase-2.0.2.3.1.4.0-315-bin.tar.gz to /root/apache-ambari-2.7.5-src/ambari-metrics/ambari-metrics-timelineservice/target/embedded/hbase.tar.gz
[ERROR] around Ant part ...<get usetimestamp="true" src="https://s3.amazonaws.com/dev.hortonworks.com/HDP/centos7/3.x/BUILDS/3.1.4.0-315/tars/hbase/hbase-2.0.2.3.1.4.0-315-bin.tar.gz" dest="/root/apache-ambari-2.7.5-src/ambari-metrics/ambari-metrics-timelineservice/target/embedded/hbase.tar.gz"/>... @ 5:273 in /root/apache-ambari-2.7.5-src/ambari-metrics/ambari-metrics-timelineservice/target/antrun/build-Download HBase.xml
```

##### 해결 방법
- `StackOverflow` - <https://stackoverflow.com/questions/64494636/install-ambari-cant-download-hortonworks-hdp-from-amazon-s3>
- `Github` - <https://github.com/apache/ambari/pull/3283/commits/3dca705f831383274a78a8c981ac2b12e2ecce85>
- Github 링크로 접근하면 총 3개의 파일이 변경된 커밋(commit) 이력을 확인할 수 있습니다.
    - ambari-infra/ambari-infra-assembly/pom.xml
    - ambari-metrics/ambari-metrics-timelineservice/pom.xml
    - ambari-metrics/pom.xml
- 3개의 파일 모두를 다운받아서 각 폴더 위치에 있는 pom.xml 파일과 변경합니다.

#### REFERENCE
- <https://cwiki.apache.org/confluence/display/AMBARI/Installation+Guide+for+Ambari+2.7.5>
- <https://jjeong.tistory.com/1014>
- <https://stackoverflow.com/questions/64494636/install-ambari-cant-download-hortonworks-hdp-from-amazon-s3>
- <https://stackoverflow.com/questions/26053982/setup-script-exited-with-error-command-x86-64-linux-gnu-gcc-failed-with-exit>