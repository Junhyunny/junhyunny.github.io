---
title: "Reduce Git Folder Size"
search: false
category:
  - git
last_modified_at: 2024-03-05T23:55:00
---

<br/>

## 1. Problem Context

프로젝트 중반에 잘 동작하던 CI/CD 파이프라인이 깨지기 시작했다. 테스트 코드나 린트(lint) 문제가 없었는데 파이프라인이 깨지는 것이 의아했다. 로그를 살펴보니 레포지토리 코드를 체크아웃(checkout)하면서 타임아웃(timeout)이 발생했다. 차근차근 살펴보니 문제가 발생한 원인은 다음과 같다.

- 고객사 공장 내 제한된 네트워크에서 일하기 위해 필요한 모든 컨테이너 이미지들을 깃허브(github) 저장소에 올렸다.
- 배포 작업이 끝난 후 레포지토리에 저장한 컨테이너 이미지들을 지웠다.
- 하지만 이력 관리를 위해 필요한 `.git` 폴더 사이즈가 너무 커졌다. 폴더 사이즈가 12GB를 초과했다.

<p align="center">
  <img src="/images/posts/2024/reduce-git-folder-size-01.png" width="100%" class="image__border">
</p>

## 2. Solve the problem

깃(git)은 커밋(commit) 시점 스냅샷(snapshot)으로 돌아가기 위해 커밋 시점 정보를 모두 저장하고 있다. 폴더 용량을 크게 만드는 근본적인 문제를 해결하려면 히스토리에 저장된 파일들을 삭제해야한다. 다음 명령어로 커밋 히스토리에 저장된 파일이나 폴더를 제거할 수 있다. 

```
$ git filter-branch --tree-filter 'rm fileName' HEAD
$ git filter-branch --tree-filter 'rm -rf folderName' HEAD
```

모든 커밋 이력들을 오버라이드하기 때문에 변경 내용을 원격 저장소에 반영하려면 `--force` 옵션이 필요하다.

```
$ git push origin main --force
```

정리한 폴더 사이즈는 151MB 정도로 많이 줄었다.

<p align="center">
  <img src="/images/posts/2024/reduce-git-folder-size-02.png" width="100%" class="image__border">
</p>

#### REFERENCE

- <https://hanyeop.tistory.com/443>