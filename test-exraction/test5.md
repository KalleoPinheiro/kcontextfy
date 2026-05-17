---
title: "Microservices Guide"
url: "https://martinfowler.com/microservices/"
type: "article"
image: "https://martinfowler.com/logo-sq.png"
---

[![](/mf-name-white.png)][1]

[][2]

# Microservices Guide

In short, the microservice architectural style is an approach to developing a single application as a **suite of small services**, each **running in its own process** and communicating with lightweight mechanisms, often an HTTP resource API. These services are **built around business capabilities** and **independently deployable** by fully automated deployment machinery. There is a **bare minimum of centralized management** of these services, which may be written in different programming languages and use different data storage technologies.

\-- [James Lewis and Martin Fowler (2014)][3]

A guide to material on martinfowler.com about microservices.

[![Photo of Martin Fowler](/mf.jpg)][4]

[Martin Fowler][4]

21 Aug 2019

Late in 2013, hearing all the discussion in my circles about microservices, I became concerned that there was no clear definition of microservices (a fate that [caused many problems for SOA][5]). So I got together with my colleague [James Lewis][6], who was one of the more experienced practitioners of this style. Together we wrote

[![](ms-article.png)][8]

We wrote the article to provide [a firm definition for the microservices style][3], which we did by listing the common characteristics of microservice architectures that we saw in the field.

- Componentization via Services
- Organized around Business Capabilities
- Products not Projects
- Smart endpoints and dumb pipes
- Decentralized Governance
- Decentralized Data Management
- Infrastructure Automation
- Design for failure
- Evolutionary Design

We also looked at common questions such as “how big is a microservice” and “what's the difference between microservices and Service-Oriented Architecture”. The article catalyzed interest in microservices.

“Do we use it, do we not use it?

… and what on earth is it in the first place?”

[![](ms-talk.png)][10]

In my [short introductory talk][7] (~25 minutes) I pick out the most important defining characteristics, compare microservices to monoliths, and outline the vital things to do before putting a first microservice system into production.

* * *

## When should we use Microservices?

Any architectural style has trade-offs: strengths and weaknesses that we must evaluate according to the context that it's used. This is certainly the case with microservices. While it's a useful architecture - many, indeed most, situations would do better with a monolith.

### Microservices provide benefits…

- [Strong Module Boundaries][8]: Microservices reinforce modular structure, which is particularly important for larger teams.
- [Independent Deployment][9]: Simple services are easier to deploy, and since they are autonomous, are less likely to cause system failures when they go wrong.
- [Technology Diversity][10]: With microservices you can mix multiple languages, development frameworks and data-storage technologies.

### …but come with costs

- [Distribution][11]: Distributed systems are harder to program, since remote calls are slow and are always at risk of failure.
- [Eventual Consistency][12]: Maintaining strong consistency is extremely difficult for a distributed system, which means everyone has to manage eventual consistency.
- [Operational Complexity][13]: You need a mature operations team to manage lots of services, which are being redeployed regularly.

(from [Microservice Trade-Offs][14])

### [Microservice Premium][15]

![](https://martinfowler.com/bliki/images/microservice-verdict/productivity.png)

The [microservices architectural style][3] has been the hot topic over the last year. At the recent [O'Reilly software architecture conference][16], it seemed like every session talked about microservices. Enough to get everyone's over-hyped-bullshit detector up and flashing. One of the consequences of this is that we've seen teams be too eager to embrace microservices, not realizing that microservices introduce complexity on their own account. This adds a premium to a project's cost and risk - one that often gets projects into serious trouble.

by Martin Fowler

13 May 2015

[Read more…][15]

bliki

[microservices][17]

### [Monolith First][18]

![](https://martinfowler.com/bliki/images/microservice-verdict/path.png)

As I hear stories about teams using a [microservices architecture][3], I've noticed a common pattern.

1. Almost all the successful microservice stories have started with a monolith that got too big and was broken up
2. Almost all the cases where I've heard of a system that was built as a microservice system from scratch, it has ended up in serious trouble.

This pattern has led many of my colleagues to argue that **you shouldn't start a new project with microservices, even if you're sure your application will be big enough to make it worthwhile.** .

by Martin Fowler

3 Jun 2015

[Read more…][18]

bliki

[evolutionary design][19] [microservices][17]

### [Don’t start with a monolith][20]

![](https://martinfowler.com/articles/dont-start-monolith/monolith-theory-practice.png)

In the last few months, I’ve heard repeatedly that the only way to get to a successful microservices architecture is by starting with a monolith first. To paraphrase Simon Brown: If you can’t build a well-structured monolith, what makes you think you can build a well-structured set of microservices? The most recent – and, as usual, very convincing – rendering of this argument comes from Martin Fowler on this very site. As I had a chance to comment on an earlier draft, I had some time to think about this. And I did, especially because I usually find myself in agreement with him, and some others whose views I typically share seemed to agree with him, too.

I’m firmly convinced that starting with a monolith is usually exactly the wrong thing to do.

by Stefan Tilkov

9 Jun 2015

[Read more…][20]

article

[microservices][17]

### [Microservice Prerequisites][21]

![](https://martinfowler.com/bliki/images/microservicePrerequisites/sketch.png)

As I talk to people about using a [microservices architectural style][3] I hear a lot of optimism. Developers enjoy working with smaller units and have expectations of better modularity than with monoliths. But as with any architectural decision there are trade-offs. In particular with microservices there are serious consequences for operations, who now have to handle an ecosystem of small services rather than a single, well-defined monolith. Consequently if you don't have certain baseline competencies, you shouldn't consider using the microservice style.

by Martin Fowler

28 Aug 2014

[Read more…][21]

bliki

[microservices][17]

### [Microservices and the First Law of Distributed Objects][22]

![](https://martinfowler.com/articles/images/distributed-objects-microservices/local-remote.png)

In P of EAA I said "don't distribute your objects". Does this advice contradict my interest in Microservices?

by Martin Fowler

13 Aug 2014

[Read more…][22]

article

[API design][23] [microservices][17]

### [Interview with Sam Newman about Microservices][24]

![](/img/catalog/goto-book-newman.png)

goto conferences asked me to do an interview with Sam Newman on his book: “Monoliths to Microservices”. This turned into a general conversation about microservices and when to use them. Sam considers the three main reasons for them to be independent deployability, isolation of data, and reflecting the organizational structure. I'm more skeptical of the first, but consider data and people to be complicated parts of software development.

by Martin Fowler

4 Sep 2020

[More…][24]

video

[interviews][25] [microservices][17]

* * *

## Building Microservices

Microservice architectures are fairly new, but I've been fortunate that we've worked with them at Thoughtworks since their [earliest appearances][26]. For a cohesive description of how best to work with them, the best introduction is Sam Newman's book [Building Microservices][27] which he wrote based on our experiences and other published accounts.

[![](newman-book.jpg)][46]

### [Testing Strategies in a Microservice Architecture][28]

![](https://martinfowler.com/articles/microservice-testing/meta-image.png)

There has been a shift in service based architectures over the last few years towards smaller, more focussed “micro” services. There are many benefits with this approach such as the ability to independently deploy, scale and maintain each component and parallelize development across multiple teams. However, once these additional network partitions have been introduced, the testing strategies that applied for monolithic in process applications need to be reconsidered. Here, we plan to discuss a number of approaches for managing the additional testing complexity of multiple independently deployable components as well as how to have tests and the application remain correct despite having multiple teams each acting as guardians for different services.

by Toby Clemson

18 Nov 2014

[Read more…][28]

infodeck

[testing][29] [infodecks][30] [microservices][17]

### [How to break a Monolith into Microservices][31]

![](https://martinfowler.com/articles/break-monolith-into-microservices/sketch.png)

As monolithic systems become too large to deal with, many enterprises are drawn to breaking them down into the microservices architectural style. It is a worthwhile journey, but not an easy one. We've learned that to do this well, we need to start with a simple service, but then draw out services that are based on vertical capabilities that are important to the business and subject to frequent change. These services should be large at first and preferably not dependent upon the remaining monolith. We should ensure that each step of migration represents an atomic improvement to the overall architecture.

by Zhamak Dehghani

24 Apr 2018

[Read more…][31]

article

[microservices][17] [legacy modernization][32]

### [Micro Frontends][33]

![](https://martinfowler.com/articles/micro-frontends/card.png)

Good frontend development is hard. Scaling frontend development so that many teams can work simultaneously on a large and complex product is even harder. In this article we'll describe a recent trend of breaking up frontend monoliths into many smaller, more manageable pieces, and how this architecture can increase the effectiveness and efficiency of teams working on frontend code. As well as talking about the various benefits and costs, we'll cover some of the implementation options that are available, and we'll dive deep into a full example application that demonstrates the technique.

by Cam Jackson

19 Jun 2019

[Read more…][33]

article

[application architecture][34] [front-end][35] [microservices][17]

### [How to extract a data-rich service from a monolith][36]

![](https://martinfowler.com/articles/extract-data-rich-service/card.png)

When breaking monoliths into smaller services, the hardest part is actually breaking up the data that lives in the database of the monolith. To extract a data-rich service, it is useful to follow a series of steps which retain a single write-copy of the data at all times. The steps begin by making a logical separation in the existing monolith: splitting service behavior into a separate module, then separating data into a separate table. These elements can be separately moved into a new autonomous service.

by Praful Todkar

30 Aug 2018

[Read more…][36]

article

[microservices][17] [legacy modernization][32]

### [Infrastructure As Code][37]

![](https://martinfowler.com/bliki/images/infrastructureAsCode/card.png)

Infrastructure as code is the approach to defining computing and network infrastructure through source code that can then be treated just like any software system. Such code can be kept in source control to allow auditability and [ReproducibleBuilds][38], subject to testing practices, and the full discipline of [ContinuousDelivery][39]. It's an approach that's been used over the last decade to deal with growing [CloudComputing][40] platforms and will become the dominant way to handle computing infrastructure in the next.

by Martin Fowler

1 Mar 2016

[Read more…][37]

bliki

[continuous delivery][41] [microservices][17]

### [Dev Ops Culture][42]

Agile software development has broken down some of the silos between requirements analysis, testing and development. Deployment, operations and maintenance are other activities which have suffered a similar separation from the rest of the software development process. The DevOps movement is aimed at removing these silos and encouraging collaboration between development and operations.

by Rouan Wilsenach

9 Jul 2015

[Read more…][42]

bliki

[continuous delivery][41] [agile adoption][43] [team organization][44] [collaboration][45]

### [Circuit Breaker][46]

![](https://martinfowler.com/bliki/images/circuitBreaker/card.png)

It's common for software systems to make remote calls to software running in different processes, probably on different machines across a network. One of the big differences between in-memory calls and remote calls is that remote calls can fail, or hang without a response until some timeout limit is reached. What's worse if you have many callers on a unresponsive supplier, then you can run out of critical resources leading to cascading failures across multiple systems. In his excellent book [Release It][47], Michael Nygard popularized the Circuit Breaker pattern to prevent this kind of catastrophic cascade.

The basic idea behind the circuit breaker is very simple. You wrap a protected function call in a circuit breaker object, which monitors for failures. Once the failures reach a certain threshold, the circuit breaker trips, and all further calls to the circuit breaker return with an error, without the protected call being made at all. Usually you'll also want some kind of monitor alert if the circuit breaker trips.

by Martin Fowler

6 Mar 2014

[Read more…][46]

bliki

[continuous delivery][41] [application architecture][34]

[1]: https://martinfowler.com
[2]: #navmenu-bottom
[3]: /articles/microservices.html
[4]: /
[5]: /bliki/ServiceOrientedAmbiguity.html
[6]: https://twitter.com/boicy
[7]: /videos.html#microservices
[8]: /articles/microservice-trade-offs.html#boundaries
[9]: /articles/microservice-trade-offs.html#deployment
[10]: /articles/microservice-trade-offs.html#diversity
[11]: /articles/microservice-trade-offs.html#distribution
[12]: /articles/microservice-trade-offs.html#consistency
[13]: /articles/microservice-trade-offs.html#ops
[14]: /articles/microservice-trade-offs.html
[15]: /bliki/MicroservicePremium.html
[16]: http://softwarearchitecturecon.com/sa2015
[17]: /tags/microservices.html
[18]: /bliki/MonolithFirst.html
[19]: /tags/evolutionary%20design.html
[20]: /articles/dont-start-monolith.html
[21]: /bliki/MicroservicePrerequisites.html
[22]: /articles/distributed-objects-microservices.html
[23]: /tags/API%20design.html
[24]: https://gotopia.tech/bookclub/episodes/moving-to-microservices-with-sam-newman-and-martin-fowler
[25]: /tags/interviews.html
[26]: https://www.thoughtworks.com/radar/techniques/microservices
[27]: https://www.amazon.com/gp/product/1491950358/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=1491950358&linkCode=as2&tag=martinfowlerc-20
[28]: /articles/microservice-testing
[29]: /tags/testing.html
[30]: /tags/infodecks.html
[31]: /articles/break-monolith-into-microservices.html
[32]: /tags/legacy%20modernization.html
[33]: /articles/micro-frontends.html
[34]: /tags/application%20architecture.html
[35]: /tags/front-end.html
[36]: /articles/extract-data-rich-service.html
[37]: /bliki/InfrastructureAsCode.html
[38]: /bliki/ReproducibleBuild.html
[39]: /bliki/ContinuousDelivery.html
[40]: /bliki/CloudComputing.html
[41]: /tags/continuous%20delivery.html
[42]: /bliki/DevOpsCulture.html
[43]: /tags/agile%20adoption.html
[44]: /tags/team%20organization.html
[45]: /tags/collaboration.html
[46]: /bliki/CircuitBreaker.html
[47]: https://www.amazon.com/gp/product/0978739213/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=0978739213&linkCode=as2&tag=martinfowlerc-20
