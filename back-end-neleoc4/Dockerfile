# Используем официальный образ Node.js
FROM node:20-alpine

RUN apk --no-cache add \
    openssl \
    bash 

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app


# Копируем package.json и устанавливаем зависимости
COPY back-end-neleoc4/package*.json ./
RUN npm install --legacy-peer-deps

# Копируем весь код проекта в контейнер
COPY back-end-neleoc4/ .

# Генерируем Prisma Client
RUN npx prisma generate

# Собираем проект
RUN npm run build

# Прокси-порт на котором будет работать приложение
EXPOSE 5000

# Команда для запуска приложения
CMD npx prisma db push && npm run start