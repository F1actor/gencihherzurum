# Aşama 1: Build (Derleme)
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Aşama 2: Serve (Nginx ile yayınlama)
FROM nginx:alpine
# Derlenen dosyaları Nginx'e kopyala
COPY --from=build /app/dist /usr/share/nginx/html
# Özel Nginx ayarını kopyala
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
