# ===== 构建阶段 =====
FROM node:22-alpine AS build
WORKDIR /app

# 先装依赖（利用层缓存）
COPY package.json ./
COPY .npmrc ./
RUN npm install

# 拷贝源码并构建
COPY . .
RUN npm run build

# 移除 devDependencies，减小运行时镜像体积
RUN npm prune --omit=dev

# ===== 运行阶段 =====
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=3000
ENV UPLOAD_DIR=/app/data/uploads

# 运行时需要的文件：依赖、构建产物、建表脚本
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/scripts ./scripts

RUN mkdir -p /app/data/uploads

EXPOSE 3000
# 首次启动自动建表（CREATE TABLE IF NOT EXISTS，幂等），随后启动服务
CMD ["sh", "-c", "node scripts/init-db.js && node dist/server/main.js"]
