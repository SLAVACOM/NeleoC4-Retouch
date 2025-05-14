# Используем официальный образ Node.js
FROM node:18-alpine

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем package.json и package-lock.json (или yarn.lock)
COPY front-end-neleoc4/package*.json ./

# Устанавливаем зависимости
RUN npm install --legacy-peer-deps

# Копируем весь код проекта в контейнер
COPY front-end-neleoc4/ .

# Собираем проект
RUN npm run build



# Прокси-порт на котором будет работать приложение
EXPOSE 3000

# Команда для запуска приложения
CMD ["npm", "run", "start"]