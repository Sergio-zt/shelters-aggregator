# Feedback 14.1–14.4 — 15 листопада 2026

Джерело: актуальний Figma handoff Screens 14 · 14.1–14.4, node 195-2890; empty frame 210-5148, error frame 210-5544. Додано обов’язкове ім’я автора перед коментарем. Name field у Figma: 76 px із label, gap8 та input48; між групами12. Коментар лишається72 px, resize:none. Обидві мови підтримано.

- npm run check: lint, TS / production build, 39/39 тестів і Prettier пройшли. Системний Node20.17 виконав перевірки; задекларована підтримувана версія проєкту лишається Node>=22.12.
- Новий HTTP-тест перевіряє payload name/comment із shelter_id і без нього. Mock-тест відхиляє порожнє/пробільне ім’я або коментар.
- Браузер: валідація кожного поля, успішний mock-submit, помилка з обома значеннями, retry→success, локалізація без скидання чернетки, спільна форма меню без shelter-context.
- Sending-preview: обидва поля disabled, spinner і aria-busy. Це статичний preview, не вимір тривалості реального запиту.
- 12 замірів: empty/ready/sending/error на320,390,1440 px. Переповнення немає; input48, textarea72, resize:none.
- Консоль: без error/warn. Новий Lighthouse-аудит не запускався. Реальний backend ще не підключений.

Артефакти: browser-checks.json, mobile-empty-uk.jpg, mobile-error-uk.jpg, mobile-ready-en.jpg, desktop-ready-en.jpg. Jira URL/ключ у цьому чаті поки не надано; задачу не редагували.
