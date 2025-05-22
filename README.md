# NeleoC4-Retouch

## Оглавление
- [Описание](#описание)
- [Структура проекта](#структура-проекта)
- [Требования](#требования)
- [Установка](#установка)
  - [Клонирование репозитория](#1-клонирование-репозитория)
  - [Настройка .env файлов](#2-настройка-env-файлов)
  - [Установка зависимостей](#3-установка-зависимостей)
    - [Бэкенд](#бэкенд)
    - [Фронтенд](#фронтенд)
- [Запуск проекта](#запуск-проекта)
  - [Запуск бэкенда](#запуск-бэкенда)
  - [Запуск фронтенда](#запуск-фронтенда)
- [Вклад в проект](#вклад-в-проект)
- [Лицензия](#лицензия)
- [Контакты](#контакты)

## Описание
**NeleoC4-Retouch** — это проект, состоящий из бэкенд- и фронтенд-частей. Основной стек технологий: **TypeScript** (98.6%) и другие (1.4%).  

## Структура проекта
- **backend/** — директория с исходным кодом бэкенд-части.
- **frontend/** — директория с исходным кодом фронтенд-части.

## Требования
Перед началом работы убедитесь, что у вас установлено:
- **Node.js** (рекомендуемая версия: >=16.x)
- **npm** или **yarn**
- Prisma и PrismaClient (Установленные как зависимости в проекте: см. инструкцию в секции "Установка зависимостей")

## Установка

### 1. Клонирование репозитория
Клонируйте репозиторий на локальный компьютер:
```bash
git clone https://github.com/SLAVACOM/NeleoC4-Retouch.git
```

### 2. Настройка .env файлов
Создайте файлы `.env` для бэкенда и фронтенда в соответствующих директориях:
#### Для **backend/.env**:
```env
# Пример конфигурации для бэкенда
DATABASE_URL=your_database_url
ENABLE_TRACING=true

BOT_TOKEN=your_bot_token
ADMIN_CHAT_ID=your_chat_id

JWT_SECRET=your_secret_key

PAYMENT_TERMINAL_API_URL=your_termimal_url
CLOUDPAYMENTS_API_KEY=your_cloudpayments_key
CLOUDPAYMENTS_API_PASSWORD=your_cloudpayments_password

RETOUCH_API="https://retoucher.hz.labs.retouch4.me/api/v1/retoucher/"
RETOUCH_API_TOKEN=your_retouch_token
```

#### Для **frontend/.env**:
```env
# Пример конфигурации для фронтенда
API_URL=http://localhost:5000
NEXTAUTH_URL = http://localhost:3000

AUTH_SECRET = your_auth_secret
NEXTAUTH_SECRET = your_auth_secret
```

Убедитесь, что вы заполнили переменные своими значениями.

### 3. Установка зависимостей

#### Бэкенд
Перейдите в директорию `backend` и установите зависимости, включая Prisma и PrismaClient:
```bash
cd backend
npm install --legacy-peer-deps
npm install prisma @prisma/client --save-dev
```

После установки выполните команду для генерации Prisma Client:
```bash
npx prisma generate
```

#### Фронтенд
Перейдите в директорию `frontend` и установите зависимости:
```bash
cd frontend
npm install --legacy-peer-deps
```

## Запуск проекта
### Запуск в режиме разработки

#### Бэкенд
1. Перейдите в директорию `backend`.
2. Запустите сервер в режиме разработки:
   ```bash
   npm run start:dev
   ```
3. Сервер будет доступен по адресу `http://localhost:5000`.

#### Фронтенд
1. Перейдите в директорию `frontend`.
2. Запустите клиент в режиме разработки:
   ```bash
   npm run dev
   ```
3. Фронтенд будет доступен по адресу `http://localhost:3000`.

### Компиляция и запуск сборки

#### Бэкенд
1. Перейдите в директорию `backend`.
2. Скомпилируйте сервер:
   ```bash
   npm run build
   ```
3. После компиляции запустите сервер:
   ```bash
   npm start
   ```

#### Фронтенд
1. Перейдите в директорию `frontend`.
2. Скомпилируйте проект:
   ```bash
   npm run build
   ```
3. После компиляции запустите админ панель:
   ```bash
   npm start
   ```
---
