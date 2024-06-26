---
title: "Virtual Environment for Python"
search: false
category:
  - python
last_modified_at: 2024-06-26T23:55:00
---

<br/>

## 0. 들어가면서

대학생 시절 OpenCV를 다뤘던 적이 있다. 당시에 C++, 파이썬(python) 두 가지 언어를 사용할 수 있었다. 필자는 C++을 선택했다. C, C++ 언어가 익숙한 이유도 있었지만, 참조하는 파이썬 예제 코드가 버전에 따라 제대로 동작하지 않는 경우가 허다 했기 때문이다. 파이썬 관련 의존성들의 버전을 잘못 설치하면 애플리케이션이 전체적으로 망가져 라즈베리 파이(raspberry pi)를 몇 번이고 포맷헀다. 당시에 파이썬은 버전에 매우 민감한 언어라는 선입견이 생겨 버린 것 같다. 

최근 프로젝트에서 파이썬을 다룰 일이 있었다. 이때 파이썬에 가상 환경을 구축해서 프로젝트 별로 의존성을 관리하는 방법이 있다는 처음 알았다. 대학교를 졸업한지 7년이 넘어가기 때문에 기술이 많이 발전한 것이겠지만, 어쨋든 매우 흥미로웠다. 이번 글은 파이썬 프로젝트를 구축할 때 가상 환경을 만들고 사용하는 방법에 대해 정리했다.

## 1. What is a virtual environment in Python?

파이썬에서 가상 환경(virtual environment)은 가상 머신(virtual machine)처럼 논리적으로 격리된 공간을 의미한다. 파이썬 가상 환경은 가상 머신과 다르게 프로젝트 단위로 적용된다. 기본적으로 파이썬 패키지를 설치하면 호스트 머신에 글로벌하게 설치된다. 패키지가 글로벌하게 설치되면 무슨 문제가 있을까? 파이썬 프로젝트가 두 개 있다고 가정해보자. 두 프로젝트는 서로 다른 의존성을 사용한다.

- `프로젝트 A`는 `Django 3.2`를 사용한다. 
- `프로젝트 B`는 `Django 4.0`를 사용한다.

파이썬 패키지는 리눅스 기준으로 `/usr/local/lib/python3.12/site-packages` 폴더에 설치된다. 설치된 Django 버전에 따라 두 프로젝트 중 하나는 문제가 발생한다. 가상 환경은 이런 문제를 해결한다. 각 프로젝트 내부에 `venv` 폴더를 만들고 여기에서 패키지를 관리한다. 

<div align="center">
  <img src="/images/posts/2024/virtual-environment-for-python-01.png" width="80%" class="image__border">
</div>

<br/>

환경을 격리하는 것 뿐만 아니라 프로젝트에 필요한 환경을 다시 구성하는 것도 매우 쉽다. `requirements.txt`라는 파일을 통해 프로젝트에 필요한 의존성들의 버전을 관리한다. 이를 사용해 프로젝트에 필요한 의존성을 다시 설치할 수 있다. 자세한 내용은 실습을 통해 확인해보자. 

## 2. Practice

간단하게 FastAPI 프레임워크를 사용하는 프로젝트를 만들고 가상 환경을 구축해보자. 필자는 MacOS, `python 3.12.3`을 사용 중이다. 윈도우즈(windows)는 명령어가 일부 다를 수 있다.

### 2.1. Setup virtual environment

프로젝트 경로에 가상 환경 구축을 위한 myenv 폴더를 만든다. 

```
$ python3 -m venv myenv

$ ls -al
total 0
drwxr-xr-x  4 junhyunk  staff  128 Jun 26 11:21 .
drwx------@ 7 junhyunk  staff  224 Jun 26 11:17 ..
-rw-r--r--  1 junhyunk  staff    0 Jun 26 11:17 app.py
drwxr-xr-x  6 junhyunk  staff  192 Jun 26 11:21 myenv
```

가상 환경이 준비됬다면 이를 활성화 한다. myenv 폴더 내부에 activate 파일을 적용한다.

```
$ source ./myenv/bin/activate
```

사용 중인 터미널에 따라 다르겠지만, 필자의 경우 다음과 같이 터미널이 변경된다. 터미널의 사용자 앞에 가상 환경임을 나타내는 `(myenv)` 표시가 보인다.

```
(myenv) $ 
```

### 2.2. Install packages

프로젝트에 필요한 fastapi 패키지를 설치한다. 

```
(myenv) $ pip install fastapi   

Collecting fastapi
  Using cached fastapi-0.111.0-py3-none-any.whl.metadata (25 kB)
Collecting starlette<0.38.0,>=0.37.2 (from fastapi)
  Using cached starlette-0.37.2-py3-none-any.whl.metadata (5.9 kB)
Collecting pydantic!=1.8,!=1.8.1,!=2.0.0,!=2.0.1,!=2.1.0,<3.0.0,>=1.7.4 (from fastapi)
  Downloading pydantic-2.7.4-py3-none-any.whl.metadata (109 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 109.4/109.4 kB 467.2 kB/s eta 0:00:00

...

Successfully installed MarkupSafe-2.1.5 annotated-types-0.7.0 anyio-4.4.0 certifi-2024.6.2 click-8.1.7 dnspython-2.6.1 email_validator-2.2.0 fastapi-0.111.0 fastapi-cli-0.0.4 h11-0.14.0 httpcore-1.0.5 httptools-0.6.1 httpx-0.27.0 idna-3.7 jinja2-3.1.4 markdown-it-py-3.0.0 mdurl-0.1.2 orjson-3.10.5 pydantic-2.7.4 pydantic-core-2.18.4 pygments-2.18.0 python-dotenv-1.0.1 python-multipart-0.0.9 pyyaml-6.0.1 rich-13.7.1 shellingham-1.5.4 sniffio-1.3.1 starlette-0.37.2 typer-0.12.3 typing-extensions-4.12.2 ujson-5.10.0 uvicorn-0.30.1 uvloop-0.19.0 watchfiles-0.22.0 websockets-12.0
```

### 2.3. Create and use requirements.txt

프로젝트 가상 환경에서 사용 중인 패키지와 버전 정보를 파일로 추출할 수 있다.

```
$ pip freeze > requirements.txt

$ cat requirements.txt
annotated-types==0.7.0
anyio==4.4.0
certifi==2024.6.2
click==8.1.7
dnspython==2.6.1
email_validator==2.2.0
fastapi==0.111.0
fastapi-cli==0.0.4
h11==0.14.0
httpcore==1.0.5
httptools==0.6.1
httpx==0.27.0
idna==3.7
Jinja2==3.1.4
markdown-it-py==3.0.0
MarkupSafe==2.1.5
mdurl==0.1.2
orjson==3.10.5
pydantic==2.7.4
pydantic_core==2.18.4
Pygments==2.18.0
python-dotenv==1.0.1
python-multipart==0.0.9
PyYAML==6.0.1
rich==13.7.1
shellingham==1.5.4
sniffio==1.3.1
starlette==0.37.2
typer==0.12.3
typing_extensions==4.12.2
ujson==5.10.0
uvicorn==0.30.1
uvloop==0.19.0
watchfiles==0.22.0
websockets==12.0
```

requirements.txt 파일은 Git, SVN 같은 도구를 통해 코드 형상 관리를 하고 `myenv` 디렉토리는 .gitignore 파일을 통해 형상 관리에서 제외한다. `myenv` 폴더는 프로젝트 가상 환경과 패키지 등이 포함되어 용량이 굉장히 크기 때문에 원격 레포지토리에 업로드 되지 않도록 주의가 필요하다. 다음 명령어를 통해 requirements.txt 파일에 정리된 의존성들을 설치한다. 개발자들이 협력할 때 동일한 프로젝트 환경을 구축하기 쉽다. 

```
$ pip install -r requirements.txt
```

### 2.4. Run application

간단한 애플리케이션을 가상 환경에서 실행해보자. 다음과 같은 엔드-포인트(end-point)를 만든다. 루트 경로로 접근 시 "Hello World" 문자열을 반환한다.

```python
from fastapi import FastAPI


app = FastAPI()


@app.get("/")
async def index():
    return "Hello World"
```

`fastapi dev` 명령어로 메인 스크립트 파일을 실행한다.

```
$ fastapi dev app.py 
INFO     Using path app.py
INFO     Resolved absolute path /Users/junhyunk/Desktop/action-in-blog/app.py
INFO     Searching for package file structure from directories with __init__.py files
INFO     Importing from /Users/junhyunk/Desktop/action-in-blog

 ╭─ Python module file ─╮
 │                      │
 │  🐍 app.py           │
 │                      │
 ╰──────────────────────╯

INFO     Importing module app
INFO     Found importable FastAPI app

 ╭─ Importable FastAPI app ─╮
 │                          │
 │  from app import app     │
 │                          │
 ╰──────────────────────────╯

INFO     Using import string app:app

 ╭────────── FastAPI CLI - Development mode ───────────╮
 │                                                     │
 │  Serving at: http://127.0.0.1:8000                  │
 │                                                     │
 │  API docs: http://127.0.0.1:8000/docs               │
 │                                                     │
 │  Running in development mode, for production use:   │
 │                                                     │
 │  fastapi run                                        │
 │                                                     │
 ╰─────────────────────────────────────────────────────╯

INFO:     Will watch for changes in these directories: ['/Users/junhyunk/Desktop/action-in-blog']
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [69175] using WatchFiles
INFO:     Started server process [69179]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### 2.5. Deactivate

가상 환경을 모두 사용했다면 이를 비활성화 한다.

```
$ deactivate
```

## 3. Several tools for python virtual environment

파이썬 프로젝트 환경을 구축할 수 있는 다양한 도구들이 존재한다. 용도나 사용 방법이 조금씩 다르기 때문에 간략하게 정리해봤다.

1. venv
  - Python3.3 이상부터 포함된 가상 환경 패키지다.
  - 별도 설치 없이 파이썬만 있어도 사용 가능하다.
  - `pyvenv`라는 라이브러리도 Python3.3에 함께 포함되었지만, Python3.7부터 삭제되었다.
1. virtualenv
  - 표준은 아니지만 `PyPA`에서 공인된 패키지다.
  - 이 글에서 소개한 `venv`와 유사하지만, Python2, 3을 모두 지원한다는 장점을 갖고 있다.
2. pyenv
  - 파이썬 버전 별로 가상 환경 생성이 가능하다.
  - 가상 환경은 virtualenv 같은 서드-파티(3rd party) 패키지를 사용해야 한다.
  - pyenv-virtualenv, pyenv-virtualenvwrapper 같은 플러그인을 추가해 사용할 수 있다.
3. pipenv
  - Pipfile, pip, virtualenv 등을 하나의 커맨드로 실행할 수 있는 라이브러리다.
  - pip 명령어 대신 pipenv 명령어를 사용하면 루트 디렉토리에 가상 환경이 생성된다.
  - 가상 환경에서 작업을 수행하기 위해선 마찬기자로 pipenv 명령어를 사용한다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-06-26-virtual-environment-for-python>

#### REFERENCE

- [파이썬 가상환경: Conda와 Venv의 이해](https://velog.io/@tngus0325/%ED%8C%8C%EC%9D%B4%EC%8D%AC-%EA%B0%80%EC%83%81%ED%99%98%EA%B2%BD-Conda%EC%99%80-Venv%EC%9D%98-%EC%9D%B4%ED%95%B4)
- <https://www.daleseo.com/python-venv/>
- <https://homubee.tistory.com/38>