# 改用更轻量且更稳定的官方 bullseye 版本
FROM node:20.19.0-bullseye


WORKDIR /app

# 先复制 package 和 yarn.lock，缓存依赖层
COPY package*.json yarn.lock ./

# 限制 yarn 并发，避免 worker threads 问题
RUN yarn install --network-concurrency 1

# 再复制其他源码
COPY . .

# 执行构建
RUN yarn build

# 暴露端口
EXPOSE 3000

# 启动
CMD ["yarn", "start"]