---
title: "What is CI/CD?"
search: false
category:
  - english
  - information
last_modified_at: 2022-02-18T23:55:00
---

<br>

👉 Recommend next posts.
- [Install jenkins][jenkins-install-link]
- [Integrate github webhooks with jenkins][jenkins-github-webhook-link]
- [Install docker registry on EC2 instance][install-docker-registry-on-ec2-link]
- [Make private docker registry][make-private-docker-registry-on-ec2-link]
- [Deploy services using jenkins pipeline on EC2 instance][jenkins-deploy-ec2-using-docker-link]
- [Send slack notification from jenkins][jenkins-slack-notification-link]

## 0. Intro

> CI/CD is a way to deliver high-quality applications to customers in shorter cycle times by automating application development steps.

When I first encountered this definition, I thought it was an abstract concept. 
However, I naturally have understood what this concept is in my project experience. 
CI/CD is divided into three steps. 
- Continuous Integration
- Continuous Delivery
- Continuous Deployment
I have summarized what happens at each steps. 

<br>

<p align="center">
    <img src="/images/what-is-ci-cd-1.JPG" width="80%" class="image__border"/>
</p>
<center>https://www.redhat.com/ko/topics/devops/what-is-ci-cd</center>

## 1. What is Continuous Integration?

`Continuous Integration` is a method to maintain the quality of codes while integrating the codes continuously. 
The main tasks in continous integration are **build, test and merge**. 
The development of system is carried out by the collaboration of many developers. 
It is not easy to merge all of the codes implemented and test them. 
CI(Continuous Integration) solves this problem. 
CI can integrate the codes as often as possible using an automated process of build, test and merge. 
The accumulated codes in the development process can be tested easily through the automated process. 
So, the quality of system can be improved and the bugs can be minimized.  

### 1.1. Advantages of Continuous Integration
- Builds and tests are automated so developers can focus on development.
- All changes are automatically built together and can be tested.
- The codes are merged together in shorter cycle time on the automated process, so developers can find out problems quickly in the whole system.

### 1.2. Continuous Integration Tools
- Hudson
- Bamboo
- Jenkins

#### Continuous integration process

<p align="center">
    <img src="/images/what-is-ci-cd-2.JPG" width="80%" class="image__border"/>
</p>

## 2. What is Continuous Delivery?
This means that the changes by developers are built, tested and merged automatically, then uploaded to the remote repository. 
For an effective continuous delivery process to work, there must be a connected pipeline from continuous integration to continuous delivery. 
Making pipeline connection is possible through CI tools.

## 3. What is Continuous Deployment?
As an extended form of continuous delivery, it refers to automating the deployment of applications into the production environment. 
If the changes of the codes in the remote repository are captured, the modification is released automatically into the production environment for clients. 
The process is carried out by the manager after making a business decision.

#### Example of Continuous Delivery and Continuous Deployment

<p align="center">
    <img src="/images/what-is-ci-cd-3.JPG" width="80%" class="image__border"/>
</p>

#### REFERENCE
- <https://www.redhat.com/ko/topics/devops/what-is-ci-cd>

[jenkins-install-link]: https://junhyunny.github.io/information/jenkins/jenkins-install/
[jenkins-github-webhook-link]: https://junhyunny.github.io/information/jenkins/github/jenkins-github-webhook/
[install-docker-registry-on-ec2-link]: https://junhyunny.github.io/information/docker/install-docker-registry-on-ec2/
[make-private-docker-registry-on-ec2-link]: https://junhyunny.github.io/information/docker/make-private-docker-registry-on-ec2/
[jenkins-deploy-ec2-using-docker-link]: https://junhyunny.github.io/information/jenkins/jenkins-deploy-ec2-using-docker/
[jenkins-slack-notification-link]: https://junhyunny.github.io/information/jenkins/jenkins-slack-notification/