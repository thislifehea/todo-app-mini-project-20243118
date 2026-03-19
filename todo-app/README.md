# Todo App Mini Project

React + Vite + Express + MongoDB Atlas로 만든 Todo 풀스택 앱.

## 폴더 구조

- frontend/ : React + Vite SPA
- backend/ : Express + Mongoose API

## 시작

1. `cd backend` / `npm install`
2. `cp .env.example .env` (MongoDB 연결 정보 입력)
3. `npm run dev`
4. `cd ../frontend` / `npm install`
5. `npm run dev`

## Vercel 배포

- `MONGODB_URI` 환경변수 설정
- `vercel.json` 그대로 사용
