---
title: "DevOps(Development and Operations)"
search: false
category:
    - information
last_modified_at: 2021-08-21T16:00:00
---

<br>

## 0. Intro

> It is culture and methodology 
> that combines development and system operation into a single organization to solve the problems 
> that arise when the development and system operation are seperated.

I wrote this post based on my experience after reading reference to [조대협님의 블로그::개발과 운영의 조화][blog-link] that I can relate to, among the articles related to `DevOps`. 

I joined as a junior for a project for new system, and now the project has been completed. 
The development team was converted into the system operation team and I have been used to operate MES(Manufacture Execution System).

In the early stage of the development project, the system operation team for the legacy and the development team where I was in didn't have communication with each other. 
We collaborated together to narrow the gap between the legacy and the new system based on the business know-how of the operation team in the middle stage of the project. 
At the end of the project, we had made good results for the long journey which is for two-year and six-month  that we had performed the pre-operational testing, the operation and stabilization system. 
I could relate to `DevOps` that I did not empathize with before at the end of the project.

> Engineers write codes, build, deploy and run services on the system by themselves.<br>
> And it is the process and culture to improve services while constantly interacting with users.
 
I was arrogant in middle phase of the project when I had collaborated with the operation team. 
I thought that the operation team was not skillful. 
**It turned out that my thought was stupid, as soon as the system has been run.** 
The new system had been unstatble and users in the field continued complaints. 
At that time, the operation team's know-how and business experties shone. 
System users in the field wanted someone who can have a business conversation, not someone with great IT knowledge. 

**Unfamiliar on-site terminology<br>**
**User who only explains the phenomena occuring in the field<br>**
**Cause of problems taht is difficult to find out when performing work through an interface with other systems**

While all of those things bothered me, the operation team talked to the users and analyzed the phenomena to fix the problematic system modules. 
It was a valuable exprience that I realzied the business conversation with clients can improve the system.   

## 1. DevOps Features

- **Cross Functional Team** 
    - It allows your team which members can play different roles each other to operate the entire end to end service. 
    - It would be great if there were members who have business know-how and development skill, but the real is not. 

- **Widely Shared Metris**
    - The team needs a common metric for the baseline. 

- **Automating Repetitive Tasks**
    - Automate repetitive tasks using tools. 
    - Automate and manage the process from build, test to the deployment by using CI/CD tool.

- **Post Mortems**
    - After handling the problems and issues, those shoul be shared with the whole team. 

- **Regular Release**
    - The system should be regular released. 
    - It is a very collaborative work. 
    - It has to process through the development, test and deployment. 
    - When the release is over, the team has to prepare the next release. 

## 2. Development cycle of Devops team

1. Analyze and collect users' needs and voice of customer 
1. Write stories for users(write requirment)
1. Define and prioritize scope for the user stories
1. Report and manage for stakeholders
1. Manage dependencies with other projects
1. Evaluate and introduce solutions if necessary
1. Development
1. Test
1. Release
1. Manage security asnd compliance(personal information protection, country specific legal matter, etc)
1. Operate services and monitoring
1. Customer supoort

## 3. Compentencies for Devops team developer

- **Coding skills are essential**
    - Since Devops engineers are basically developer, they require basic coding skills for development.
    - If an engineer is biased towards operation or systems, the ability to write scripts for automation is essential.

- **Ability to collaborate and communicate well with others**
    - **Devops is a collaborative culture across the board.** 
    - It begins to solve the communication problem between development and operation. 
    - It is very important to have an open-minded communication ability to respect the opinions of other team members and to solve problems together. 

- **Ability to understand processes and sometimes redefine them**
    - On the face of it, Devops may not seem like a formal process. 
    - Test automation, deployment and gathering and defining requirments are all processes.
    - Devops team need to understand the processes and have ability to build it together.

#### REFERENCE
- <https://bcho.tistory.com/817>

[blog-link]: https://bcho.tistory.com/817