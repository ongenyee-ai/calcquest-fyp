# Chapter 1: Introduction

## 1.1 Motivation

Calculus underpins quantitative analysis across engineering disciplines, yet its abstract concepts make it highly challenging. Because mathematical knowledge is cumulative, unresolved gaps cause compounding difficulties in subsequent coursework [1]. At Nanyang Technological University (NTU), struggling EEE students face cascading challenges in advanced modules. Large cohorts make individualised instructor feedback infeasible, hindering the consistent independent practice required for mastery.

Two recent developments offer viable solutions. Research confirms that gamification mechanics—points, badges, and leaderboards—sustain daily engagement and knowledge retention [2], overcoming motivation drop-offs in self-directed study. Separately, large language models (LLMs) enable scalable, personalised feedback. Integrating structured gamification with AI tutoring could encourage the regular practice calculus demands. This project proposes developing such a platform tailored for undergraduate calculus students.

## 1.1.1 Current Limitations

Despite these advancements, existing tools fail to unify gamification, adaptive AI, and curriculum alignment. Brilliant.org offers interactive lessons, but its generalised content lacks engineering syllabus rigour. Daily Integral provides calculus puzzles with streaks, but functions merely as a drill tool lacking progressive paths. 

Platforms like WeBWorK provide reliable automated grading [3], but typically offer only basic correct-or-incorrect verdicts, lacking engaging mechanics. Conversely, generic AI chatbots solve problems but are inherently unstructured and misaligned with specific syllabi. Without structured constraints, students use them to bypass active problem-solving and obtain final answers. This reveals a distinct gap: existing solutions prioritise assessment without engagement, or gamification without curriculum alignment.

## 1.2 Objective

The primary objective of this project is to design, develop and evaluate an AI-assisted gamified web platform teaching undergraduate calculus through short, interactive practice sessions to significantly improve student engagement and measurable learning outcomes. The platform integrates core game mechanics—including experience points, levels, streaks, badges, lives, and adaptive difficulty—with an AI tutor providing real-time, contextual hints and step-by-step feedback.

## 1.3 Scope and Boundaries

To ensure technical feasibility, mathematical content is restricted to a foundational chapter on differentiation, enabling deep feature integration against specific learning objectives. Targeting NTU EEE undergraduates, it is implemented as a responsive web application for deployment on the Gemini Enterprise Agentic Platform (GEAP). AI interactions are strictly bounded to contextual hints and difficulty adjustments, excluding free-form chat to maintain syllabus alignment.

Correspondingly, native mobile applications and multiplayer features are excluded to focus development on core research questions. Platform efficacy is evaluated via a localised user study collecting backend usage analytics, pre- and post-test scores, and qualitative survey feedback. Technical implementation is reserved for later chapters.

## 1.4 Organisations

This report is organised into six distinct chapters. Chapter 1 introduces motivations, limitations, objectives, and scope. Chapter 2 reviews literature on game-based learning and AI tutoring to establish the research gap. Chapter 3 outlines system design and gamification architecture. Chapter 4 details technical development and GEAP deployment. Chapter 5 presents evaluation methodology and student feedback. Finally, Chapter 6 summarises key contributions, addresses platform limitations, and offers recommendations for future work.

## References

[1] K. Fischer, "The hidden roots of mathematics struggles: Foundational gaps over conceptual peaks," The Learning Agency, Dec. 19, 2025. [Online]. Available: https://the-learning-agency.com/guides-resources/the-hidden-roots-of-mathematics-struggles-foundational-gaps-over-conceptual-peaks/. Accessed: Sep. 11, 2026.

[2] L. Jaramillo-Mediavilla, A. Basantes-Andrade, M. Cabezas-González, and S. Casillas-Martín, "Impact of gamification on motivation and academic performance: A systematic review," Education Sciences, vol. 14, no. 6, p. 639, 2024, doi: 10.3390/educsci14060639.

[3] D. R. Adhikari and L. Wang, "Improving Student Success in Math Courses Using WeBWorK," in Software Engineering Research and Practice and e-Learning, Springer, 2025, doi: 10.1007/978-3-031-86644-9_19.
