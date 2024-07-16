FROM node:21.6.1 as frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend ./
RUN npm run build

FROM node:21.6.1

WORKDIR /app

COPY backend/package*.json ./backend/

RUN cd backend && npm install

COPY backend ./backend

COPY --from=frontend-builder /app/frontend/dist ./backend/public

COPY backend/models/SeedData.js ./backend/models/SeedData.js

ENV MONGO_URI=mongodb://mongo:27017/schedule

EXPOSE 3000

CMD ["sh", "-c", "node ./backend/models/SeedData.js && node backend/app.js"]
