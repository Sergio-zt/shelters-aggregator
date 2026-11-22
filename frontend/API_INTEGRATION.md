# Локалізація та підготовка API

## Що працює зараз

- UI бере всі переклади з `src/i18n/uk.json` та `src/i18n/en.json`. Словники мають однакові ключі; змінні й українські форми числівників перевіряються тестами.
- Початкова мова надходить через `api.getPreferences()`. Перемикач викликає `api.updateLanguage()` і застосовує **мову з відповіді**, а не оптимістично вибране значення.
- Коди мов у даних — `uk` / `en`; видимі позначення кнопок — UA / EN. Непідтримуваний код має fallback `uk`.
- За замовчуванням використовується mock API. Воно асинхронне, підтримує AbortSignal та зберігає налаштування мови в localStorage під ключем `safeplace.mock.preferences.v1` як імітацію серверного стану. Це не справжній бекенд.
- Список укриттів, довідник районів, пошукові місця та надсилання форм також проходять через спільний API-інтерфейс. Компоненти не імпортують fixtures.
- Вибране укриття та контекст відгуку зберігаються за ID. Переклад не скидає фільтри, відкриту панель, коментар, адресу чи вибір типу/зручностей у формі.
- `html.lang`, заголовок вкладки, опис сторінки, ARIA-підписи та кнопки масштабу карти теж локалізуються.

## Межі шарів

```text
Компоненти / UI-модель Shelter
         ↓
useShelterCatalog / usePlaceSearch / useApiSubmit / I18nProvider
         ↓
AppApi — src/api/types.ts
         ↓
mock.ts АБО http.ts
         ↓
DTO відповіді → adapters.ts → локалізовані UI-моделі
```

- `src/api/index.ts` вибирає транспорт.
- `src/api/mock.ts` — демонстраційні відповіді. Тексти даних теж беруться з локальних JSON; географія — з окремого `demoCoordinates.ts`.
- `src/api/http.ts` — URL, методи, JSON, обробка HTTP-помилок і передавання AbortSignal.
- `src/api/adapters.ts` — перетворення відповідей у внутрішні моделі, локалізація даних, райони, валідація координат і ID.
- `src/i18n/I18nProvider.tsx` — завантаження/збереження налаштувань мови та спільний стан перемикачів.

## Увімкнення реального транспорту

У `.env.example` є параметри. Після узгодження контракту створити `.env.local`:

```dotenv
VITE_API_MODE=http
VITE_API_BASE_URL=https://your-backend.example/api
```

Після зміни env потрібно перезапустити dev-сервер або перебудувати production-збірку. Секрети у VITE-змінні не записувати: вони потрапляють у клієнтський код.

**Реальний сервер ще не підключено.** Наведені нижче шляхи й DTO — робочий приклад для HTTP-транспорту, а не вимога до бекенда. Коли буде фактична документація, підлаштовуємо `http.ts` / `adapters.ts` під неї.

| Операція           | Поточний приклад маршруту                     |
| ------------------ | --------------------------------------------- |
| Отримати мову      | `GET /preferences`                            |
| Змінити мову       | `PATCH /preferences` з `{ "language": "uk" }` |
| Райони             | `GET /districts`                              |
| Каталог / точки    | `GET /shelters`                               |
| Пошук місць        | `GET /places?q=...`                           |
| Відгук             | `POST /feedback`                              |
| Пропозиція укриття | `POST /shelter-suggestions`                   |

Налаштування повертають `{ "language": "uk" }` або `{ "language": "en" }`. Транспорт очікує повні колекції як масив або `{ "items": [...] }`. Якщо бекенд використовує іншу оболонку, пагінацію чи окремі маршрути каталогу/точок, змінюється цей шар.

## Дані укриття та карта

Мінімум для відображення точки:

```json
{
  "id": "123",
  "latitude": 50.48,
  "longitude": 30.51
}
```

Якщо назви немає, UI використовує нейтральний підпис «Укриття 123». Приклад повнішого запису:

```json
{
  "id": "123",
  "name": { "uk": "Укриття", "en": "Shelter" },
  "address": "Берестейський проспект, 134, Київ",
  "district_id": 3,
  "type": "Metro",
  "access": "alerts",
  "capacity": 150,
  "facilities": ["ramp", "wifi", "electricity"],
  "latitude": "50.48",
  "longitude": "30.51"
}
```

- Числові рядки координат підтримуються. Відсутні/нечислові координати, значення поза допустимими межами, відсутні та повторні ID не створюють піни. UI показує кількість відхилених записів; якщо відхилено всі записи, показується помилка даних.
- Нульові координати географічно валідні й не відкидаються через перевірку truthy.
- Внутрішня модель використовує `latitude` / `longitude`; GeoJSON і MapLibre отримують **`[longitude, latitude]`**.
- Район може бути `district_id` + довідник `[{id, name}]`, вбудований `{id, name}` або назва. ID зберігається як `districtId`; відсутній район не блокує точку.
- Текст із API може бути простим рядком або об’єктом `{uk, en}`. Прості рядки зберігаються як є; довільні назви з бекенда не перекладаються автоматично. Відсутній переклад використовує доступну мову.
- Тип укриття залишається назвою з API. Відомі англійські/українські назви локалізуються для показу й визначають оригінальний пін; невідомі назви зберігаються та мають загальний пін.
- Зручності у прикладі використовують стабільні коди `ramp`, `pets`, `wifi`, `electricity`, `toilet`. Якщо бекенд повертає ID/назви/об’єкти, їхнє зіставлення додається в адаптер.
- Невідомий режим доступу не вважається відкритим для всіх.
- Підкладка залишається MapLibre + OpenFreeMap Positron. Інший набір координат не потребує заміни карти чи правок компонентів пінів.
- При зміні мови геометрія кластерів лишається тією самою; вибраний пін і камера не перестворюються лише через нові назви.

## Пошук і форми

Пошукове місце має стабільний ID, назву, опис, тип `metro` / `street` / `address` і координати. Вибір місця зберігає саме координати, а не шукає їх за перекладеним текстом. Пошук має короткий debounce; старі запити скасовуються та не перезаписують нові результати.

`FeedbackInput` містить обов’язкові `name` (ім’я автора) та `comment`, а також необов’язковий контекст `shelterId` / `shelterName`. HTTP-мапінг надсилає `name`, `comment` і `shelter_id`, якщо відгук відкрито з укриття. Ім’я автора не є назвою укриття. Обидва поля перевіряються після trim; порожні та пробільні значення не надсилаються. Фактичний endpoint і додатковий контекст адаптуються під контракт бекенда.

Пропозиція укриття має адресу, тип, коди зручностей і додатковий текст. Форми використовують `useApiSubmit`: pending/error/retry, захист від повторного надсилання, скасування при закритті. У mock-режимі нічого не надсилається на зовнішній сервер; у HTTP-режимі працюють налаштовані POST-маршрути.

## Що уточнити при реальному підключенні

1. Фактичні URL, поля DTO, авторизацію, CORS/CSRF та формат помилок.
2. Чи каталог і точки — один endpoint. Якщо різні, об’єднати їх за ID у сервісному шарі.
3. Пагінацію, серверні фільтри й завантаження за bbox для великої кількості точок. Зараз каталог завантажується повністю, а фільтрація області/зручностей відбувається на клієнті.
4. Чи деталі приходять разом зі списком або потребують окремого запиту за ID. Вибір уже зберігається за ID, тому додавання такого запиту не прив’язане до текстових назв.
5. Формат значень типів, доступу, зручностей та мультимовних назв.
6. Контракт форм, максимальну довжину коментаря та серверну валідацію.

## Перевірки

Тести покривають парність словників, змінні, українські форми числівників, збереження/скасування налаштувань, DTO районів і точок, порядок GeoJSON-координат, помилки HTTP та порожні успішні відповіді.

Окрім mock-режиму, браузерний smoke-test виконано через тимчасовий локальний HTTP-сервер: його власна точка `http-coordinate-proof` з координатами `50.48 / 30.51` намалювалася на карті, `district_id` перетворився на назву району, некоректна точка була відхилена, а мова відновилася після PATCH/reload. Тестовий сервер не є бекендом проєкту та після перевірки зупинений.

## Local backend proxy — 2026-11-21

The Vite development server forwards `/api/*` to `http://127.0.0.1:8000/*`,
removing the `/api` prefix and preserving query parameters and cookies.
With Docker running, `/api/health` should return the backend health response.
This configuration is for development; production hosting needs its own routing.
Keep `VITE_API_MODE=mock` until HTTP routes, DTOs and language preferences are adapted.
The current backend has no `/preferences` endpoint, which currently blocks HTTP bootstrap.

## Real backend transport — 2026-11-21

HTTP transport now uses GET /places, GET /filters (districts), and
GET /places/search?q=...&limit=100. Search shows up to 100 server matches;
full pagination and separate detail fetch remain follow-up work.
Reviews initialize GET /visitor and POST {author_name, text} to /reviews
or /places/{id}/reviews. Suggestions initialize the visitor and POST /suggestion.
Cookies are included. Review inputs follow backend limits of 100/2000 characters.
Catalog adapters accept multilingual types/capacity_tier/operating_hours and
facility ID/name objects. Unknown access stays unknown.

Language in HTTP mode is temporarily local (safeplace.language), because the
backend has no preference endpoint. Earlier descriptions of server-confirmed
HTTP language settings and placeholder routes are superseded by this section.
The mock transport remains available for isolated UI previews.

Deployment is pending Docker installation. Do not claim live backend verification
from unit tests. A local ignored backend/shelters_local_test.csv contains three
user-authorized synthetic records for the normal importer. No real shelter dataset
has been provided. Run migrations before importing. Keep VITE_API_MODE=mock until
health and database-backed endpoints pass, then set it to http in .env.local.

## Local live verification — 2026-11-21

The local frontend now selects HTTP in ignored .env.local. Real FastAPI and
PostgreSQL passed catalog, district/filter, search, detail and persistence checks.
The frontend transport was exercised through Vite proxy with cookies and a saved
review; adapters produced three valid map records. This is not a visual browser audit.
The environment currently uses host Python 3.13/PostgreSQL 14, since Docker download
failed. The declared Python 3.14/PostgreSQL 17 Docker setup remains unverified.
Three synthetic shelters and smoke submissions are isolated in the local database.
Language still persists locally; detail panels use the loaded real catalog.

## Details integration — 2026-11-22

Added AppApi.getShelter and useShelterDetails. Details load separately by ID with
loading/error/retry, abort on close/selection change and stale-response protection.
Locale changes adapt the cached response without refetching. Mock supports details.
Lint/build/format and 41 existing tests pass; added detail transport test passes
separately (42 total). Real GET details and 404 verified through Vite proxy.
Visual browser/motion audit not repeated. No push or commit performed.
