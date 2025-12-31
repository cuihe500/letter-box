# ==========================================
# Letter Box - Production Dockerfile
# ==========================================
# 多阶段构建，优化镜像大小和构建时间
# ==========================================

# ------------------------------------------
# 阶段 1: 依赖安装
# ------------------------------------------
FROM node:20-alpine AS deps

# 安装 libc 兼容层和 OpenSSL（Prisma 需要）
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# 复制依赖清单
COPY package.json package-lock.json ./

# 安装生产依赖
RUN npm ci --only=production && \
    # 缓存生产依赖
    cp -R node_modules /tmp/node_modules_prod && \
    # 安装所有依赖（包括 devDependencies，构建需要）
    npm ci

# ------------------------------------------
# 阶段 2: 构建应用
# ------------------------------------------
FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules

# 复制源代码
COPY . .

# 生成 Prisma Client（不需要连接数据库）
RUN npx prisma generate

# 设置环境变量（构建时不需要真实数据库连接）
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 构建 Next.js 应用（standalone 模式）
RUN npm run build

# ------------------------------------------
# 阶段 3: 生产运行时
# ------------------------------------------
FROM node:20-alpine AS runner

# 安装运行时依赖
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    dumb-init

WORKDIR /app

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 复制 standalone 输出
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 复制 Prisma 相关文件（用于运行迁移）
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 使用 dumb-init 启动，确保正确处理信号
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# 启动应用
CMD ["node", "server.js"]
