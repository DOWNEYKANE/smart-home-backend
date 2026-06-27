FROM node:20-alpine
WORKDIR /app
COPY . .
EXPOSE 3001 80
CMD ["node", "src/index.js"]
