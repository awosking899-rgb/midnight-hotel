FROM node:20-alpine
WORKDIR /app
COPY . .
ENV PORT=3000 DB_FILE=/data/rooms.json
EXPOSE 3000
CMD ["node","server.js"]
