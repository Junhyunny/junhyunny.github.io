---
title: "Install Hadoop Ambari"
search: false
category:
  - information
  - hadoop
last_modified_at: 2021-10-27T23:55:00
---

<br/>

## 0. 들어가면서

클라이언트로부터 Ambari 설치를 요청 받았다. 쉽게 생각했던 일이었지만, 암바리(Ambari) 버전 때문에 만만치 않았다. 암바리 2.4.0 버전 설치를 거의 하루를 소비했다. 나중에 확인해보니 너무 하위 버전이었다. 버전을 올리니 정상적으로 설치가 가능했다. 다른 사람들은 같은 문제를 겪지 않도록 글로 정리했다. 

## 1. What is Ambari?

공식 홈페이지에 다음과 같은 설명이 있다.

> Apache Hadoop 클러스터를 관리, 모니터링하기 위한 소프트웨어입니다. 
> 소프트웨어를 통해 Apache Ambari 프로젝트는 하둡 관리를 더 쉽게 만드는 것이 목적입니다. 
> Web UI를 통해 직관적이고, 쉬운 하둡 관리 기능을 제공합니다. 

Hadoop 설치, 설정 및 배포, 모니터링, 알림 등의 운영 편의성을 제공해주는 소프트웨어이다. 암바리는 시스템 관리자에게 다음 세 가지 기능을 제공한다. 

- Provision a Hadoop Cluster
  - Ambari provides a step-by-step wizard for installing Hadoop services across any number of hosts.
  - Ambari handles configuration of Hadoop services for the cluster.
- Manage a Hadoop Cluster
  - Ambari provides central management for starting, stopping, and reconfiguring Hadoop services across the entire cluster.
- Monitor a Hadoop Cluster
  - Ambari provides a dashboard for monitoring health and status of the Hadoop cluster.
  - Ambari leverages Ambari Metrics System for metrics collection.
  - Ambari leverages Ambari Alert Framework for system alerting and will notify you when your attention is needed (e.g., a node goes down, remaining disk space is low, etc).

<div align="center">
  <img src="/images/posts/2021/hadoop-ambari-01.png" width="80%" class="image__border">
</div>
<center>https://docs.microsoft.com/ko-kr/azure/hdinsight/hdinsight-cluster-availability</center>

## 2. Install Environment for Ambari 

다음과 같은 환경에서 암바리를 설치했다.

- ubuntu-20.04.3-desktop-amd64
- Ambari 2.7.5.0.0
- JDK 1.8(1.8 버전이 아닌 경우에는 에러가 발생한다.)

다음과 같은 부가적인 도구들이 필요하다.

- maven 3.6.3
- npm 6.14.4
- git 2.25.1

## 3. Install Ambari

이제 본격적으로 설치를 진행해보자. 다음과 같은 절차를 통해 설치를 진행한다. 

1. 코드 다운받기
2. 메이븐을 이용한 코드 빌드 및 패키지 파일 생성
3. 패키지 파일 설치
4. 서버 설정 및 실행

설치 방법은 아래 링크를 참조했다.

- <https://cwiki.apache.org/confluence/display/AMBARI/Installation+Guide+for+Ambari+2.7.5>

### 3.1. Download code and version setting

다음 명령어를 사용해 암바리 소스 코드를 받을 수 있다. 소스 코드를 다운로드 받고 압축을 푼다. 프로젝트 디렉토리로 이동해서 메이븐 버전을 변경한다.

```
$ sudo wget https://www-eu.apache.org/dist/ambari/ambari-2.7.5/apache-ambari-2.7.5-src.tar.gz (use the suggested mirror from above)
$ tar xfvz apache-ambari-2.7.5-src.tar.gz
$ cd apache-ambari-2.7.5-src
$ sudo mvn versions:set -DnewVersion=2.7.5.0.0
```

다음과 명령어를 사용해도 된다.

```
$ pushd ambari-metrics
$ sudo mvn versions:set -DnewVersion=2.7.5.0.0
$ popd
```

### 3.2. Build and package

메이븐을 사용해 프로젝트 빌드와 패키징을 수행한다.

```
$ sudo mvn -B clean install jdeb:jdeb -DnewVersion=2.7.5.0.0 -DbuildNumber=5895e4ed6b30a2da8a90fee2403b6cab91d19972 -DskipTests -Dpython.ver="python >= 2.6"
```

### 3.3. Intsall server package

필자가 참고한 글에는 `ambari-server/target/rpm/ambari-server/RPMS/noarch/` 경로라고 설명되어 있지만, 실제로 `ambari-server/target` 폴더에 존재한다. 해당 디렉토리에서 `ambari-server_2.7.5.0-0-dist.deb` 패키지를 설치한다.

```
$ cd ./ambari-server/target
$ sudo apt-get install ./ambari-server_2.7.5.0-0-dist.deb
```

### 3.4. Setup Ambari Server and start

다음 명령어를 통해 암바리 서버 설정을 적용하고 시작한다.

```
$ sudo ambari-server setup
$ sudo ambari-server start
```

### 3.5. Install agent package and start

필자가 참고한 글에는 `ambari-agent/target/rpm/ambari-agent/RPMS/x86_64/` 경로라고 설명되어 있지만, 실제로 `ambari-agent/target` 폴더에 존재합니다. 해당 디렉토리에서 `ambari-agent_2.7.5.0-0.deb` 패키지를 설치한다.

```
$ cd ./ambari-agent/target
$ sudo apt-get install ./ambari-agent_2.7.5.0-0.deb
```

설치가 완료되면 다음 명령어를 통해 에이전트를 실행한다.

```
$ sudo ambari-agent start
```

## 4. Trouble shooting

설치 과정에서 만난 에러들과 해결 방법을 정리했다.

### 4.1. apache-rat-plugin problem

다음과 같은 에러가 발생한다. 오픈 소스를 사용할 때 라이센스가 붙어 있지 않은 파일들이 있는 경우 에러가 발생한다. 라이센스 내용을 넣어주면 에러가 나지 않지만, 파일이 너무 많았다.

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

`-Drat.skip=true` 옵션을 통해 해결 가능하다.

- 해당 옵션을 추가한 명령어는 아래와 같다. 

```
$ mvn -B clean install jdeb:jdeb -DnewVersion=2.7.5.0.0 -DbuildNumber=5895e4ed6b30a2da8a90fee2403b6cab91d19972 -DskipTests -Drat.skip=true -Dpython.ver="python >= 2.6"
```

### 4.2. Installation error Ambari Amdin View  

`Ambari Amdin View` 설치 중 에러가 발생한다. 특정 의존성의 버전이 맞지 않아 발생하는 것으로 보인다.

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

[StackOverflow 글](https://stackoverflow.com/questions/61654584/ambari-admin-view-2-7-5-0-0-build-failure)을 참고했다. pom.xml 설정 중 `admin-web` 모듈 버전 값을 변경한다. pom.xml 파일을 보면 해당 설정을 찾을 수 있다.

```xml
    <configuration>
        <nodeVersion>v4.5.0</nodeVersion>
        <npmVersion>2.15.0</npmVersion>
        <workingDirectory>src/main/resources/ui/admin-web/</workingDirectory>
        <npmInheritsProxyConfigFromMaven>false</npmInheritsProxyConfigFromMaven>
    </configuration>
```

다음과 같이 변경한다.

```xml
    <configuration>
        <nodeVersion>v11.10.0</nodeVersion>
        <npmVersion>6.7.0</npmVersion>
        <workingDirectory>src/main/resources/ui/admin-web/</workingDirectory>
        <npmInheritsProxyConfigFromMaven>false</npmInheritsProxyConfigFromMaven>
     </configuration>
```

### 4.3. Compile error for ambari-metrics-common 

특정 클래스, 애너테이션들을 찾을 수 없다는 컴파일 에러가 발생한다.

```
[ERROR] Failed to execute goal org.apache.maven.plugins:maven-compiler-plugin:3.2:compile (default-compile) on project ambari-metrics-common: Compilation failure: Compilation failure: 
[ERROR] /home/jun/apache-ambari-2.7.5-src/ambari-metrics/ambari-metrics-common/src/main/java/org/apache/hadoop/metrics2/sink/timeline/ContainerMetric.java:[24,33] package javax.xml.bind.annotation does not exist
...
[ERROR] /home/jun/apache-ambari-2.7.5-src/ambari-metrics/ambari-metrics-common/src/main/java/org/apache/hadoop/metrics2/sink/timeline/TimelineMetricMetadata.java:[140,4] cannot find symbol
[ERROR]   symbol:   class XmlElement
[ERROR]   location: class org.apache.hadoop.metrics2.sink.timeline.TimelineMetricMetadata
...
```

자바(Java) 버전을 확인 후 JDK 1.8 버전으로 변경하면 해결된다. 자바 버전은 다음 명령어로 확인할 수 있다.

```
$ java -version
openjdk version "11.0.11" 2021-04-20
OpenJDK Runtime Environment (build 11.0.11+9-Ubuntu-0ubuntu2.20.04)
OpenJDK 64-Bit Server VM (build 11.0.11+9-Ubuntu-0ubuntu2.20.04, mixed mode, sharing)
```

다음 명령어를 통해 자바를 설치할 수 있다.

```
$ sudo apt get install opendjdk-8-jdk
```

대체할 수 있는 자바 리스트를 확인한다.

```
$ sudo update-java-alternatives -l
java-1.11.0-openjdk-amd64      1111       /usr/lib/jvm/java-1.11.0-openjdk-amd64
java-1.8.0-openjdk-amd64       1081       /usr/lib/jvm/java-1.8.0-openjdk-amd64
```

자바 버전을 변경한다.

```
$ sudo update-java-alternatives -s java-1.8.0-openjdk-amd64
```

자바 버전이 변경된 것을 확인할 수 있다.

```
$ java -version
openjdk version "1.8.0_292"
OpenJDK Runtime Environment (build 1.8.0_292-8u292-b10-0ubuntu1~20.04-b10)
OpenJDK 64-Bit Server VM (build 25.292-b10, mixed mode)
```

### 4.4. Installation error Ambari Metrics Collector

`ambari-metrics-timelineservice` 의존성 빌드시 아마존 스토리지에 접근할 때 다음과 같은 에러가 발생한다. 

- 해당 URL을 브라우저를 통해 접근해보면 `Access Denied` 상태입니다. 

```
Download HBase:
    [mkdir] Created dir: /home/jun/apache-ambari-2.7.5-src/ambari-metrics/ambari-metrics-timelineservice/target/embedded
      [get] Getting: https://s3.amazonaws.com/dev.hortonworks.com/HDP/centos7/3.x/BUILDS/3.1.4.0-315/tars/hbase/hbase-2.0.2.3.1.4.0-315-bin.tar.gz
      [get] To: /home/jun/apache-ambari-2.7.5-src/ambari-metrics/ambari-metrics-timelineservice/target/embedded/hbase.tar.gz
      [get] Error opening connection java.io.IOException: Server returned HTTP response code: 403 for URL: https://s3.amazonaws.com/dev.hortonworks.com/HDP/centos7/3.x/BUILDS/3.1.4.0-315/tars/hbase/hbase-2.0.2.3.1.4.0-315-bin.tar.gz
      [get] Error opening connection java.io.IOException: Server returned HTTP response code: 403 for URL: https://s3.amazonaws.com/dev.hortonworks.com/HDP/centos7/3.x/BUILDS/3.1.4.0-315/tars/hbase/hbase-2.0.2.3.1.4.0-315-bin.tar.gz
      [get] Error opening connection java.io.IOException: Server returned HTTP response code: 403 for URL: https://s3.amazonaws.com/dev.hortonworks.com/HDP/centos7/3.x/BUILDS/3.1.4.0-315/tars/hbase/hbase-2.0.2.3.1.4.0-315-bin.tar.gz
      [get] Can't get https://s3.amazonaws.com/dev.hortonworks.com/HDP/centos7/3.x/BUILDS/3.1.4.0-315/tars/hbase/hbase-2.0.2.3.1.4.0-315-bin.tar.gz to /home/jun/apache-ambari-2.7.5-src/ambari-metrics/ambari-metrics-timelineservice/target/embedded/hbase.tar.gz
...
[ERROR] Failed to execute goal org.apache.maven.plugins:maven-antrun-plugin:1.7:run (default) on project ambari-metrics-timelineservice: An Ant BuildException has occured: Can't get https://s3.amazonaws.com/dev.hortonworks.com/HDP/centos7/3.x/BUILDS/3.1.4.0-315/tars/hbase/hbase-2.0.2.3.1.4.0-315-bin.tar.gz to /home/jun/apache-ambari-2.7.5-src/ambari-metrics/ambari-metrics-timelineservice/target/embedded/hbase.tar.gz
[ERROR] around Ant part ...<get usetimestamp="true" src="https://s3.amazonaws.com/dev.hortonworks.com/HDP/centos7/3.x/BUILDS/3.1.4.0-315/tars/hbase/hbase-2.0.2.3.1.4.0-315-bin.tar.gz" dest="/home/jun/apache-ambari-2.7.5-src/ambari-metrics/ambari-metrics-timelineservice/target/embedded/hbase.tar.gz"/>... @ 5:277 in /home/jun/apache-ambari-2.7.5-src/ambari-metrics/ambari-metrics-timelineservice/target/antrun/build-Download HBase.xml
```

[StackOverflow 글](https://stackoverflow.com/questions/64494636/install-ambari-cant-download-hortonworks-hdp-from-amazon-s3)과 [깃허브 이슈](https://github.com/apache/ambari/pull/3283/commits/3dca705f831383274a78a8c981ac2b12e2ecce85)를 참고했다.

- GitHub 링크로 접근하면 총 3개의 파일이 변경된 커밋(commit) 이력을 확인할 수 있다.
  - ambari-infra/ambari-infra-assembly/pom.xml
  - ambari-metrics/ambari-metrics-timelineservice/pom.xml
  - ambari-metrics/pom.xml
- 3개의 파일 모두를 다운받아서 각 폴더 위치에 있는 pom.xml 파일과 변경한다.

### 4.4. Error Ambari Metrics Monitor

파이썬 헤더를 찾지 못하는 에러가 발생했다.

```
ild/psutil
     [exec] running build_ext
     [exec] building '_psutil_linux' extension
     [exec] creating build
     [exec] creating build/temp.linux-x86_64-2.7
     [exec] creating build/temp.linux-x86_64-2.7/psutil
     [exec] x86_64-linux-gnu-gcc -pthread -fno-strict-aliasing -Wdate-time -D_FORTIFY_SOURCE=2 -g -fdebug-prefix-map=/build/python2.7-QDqKfA/python2.7-2.7.18=. -fstack-protector-strong -Wformat -Werror=format-security -fPIC -I/usr/include/python2.7 -c psutil/_psutil_linux.c -o build/temp.linux-x86_64-2.7/psutil/_psutil_linux.o
     [exec] psutil/_psutil_linux.c:12:10: fatal error: Python.h: No such file or directory
     [exec]    12 | #include <Python.h>
     [exec]       |          ^~~~~~~~~~
     [exec] compilation terminated.
     [exec] error: command 'x86_64-linux-gnu-gcc' failed with exit status 1
[INFO] ------------------------------------------------------------------------
[INFO] Reactor Summary:
```

[StackOverflow 글](https://stackoverflow.com/questions/26053982/setup-script-exited-with-error-command-x86-64-linux-gnu-gcc-failed-with-exit)을 참고했다. 다음과 같은 필요한 패키지들을 설치한다.

```
$ sudo apt-get install python-dev libffi-dev 
```

### 5. Ambari server page

암바리 서버가 정상적으로 동작하는지 웹 브라우저를 통해 확인해보자. 아이디, 비밀번호를 변경하지 않았다면 초기 값은 모두 `admin`이다.

<div align="center">
  <img src="/images/posts/2021/hadoop-ambari-02.png" width="100%" class="image__border">
</div>

#### REFERENCE

- <https://cwiki.apache.org/confluence/display/AMBARI/Installation+Guide+for+Ambari+2.7.5>
- <https://jjeong.tistory.com/1014>
- <https://stackoverflow.com/questions/61654584/ambari-admin-view-2-7-5-0-0-build-failure>
- <https://stackoverflow.com/questions/64494636/install-ambari-cant-download-hortonworks-hdp-from-amazon-s3>
- <https://stackoverflow.com/questions/26053982/setup-script-exited-with-error-command-x86-64-linux-gnu-gcc-failed-with-exit>