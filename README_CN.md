# PaoEventPanel

[English](README.md)

校园活动实时计圈排行榜系统。用于跑步、接力等活动的圈数记录、排名展示和数据导出。

## 功能

- **实时排行榜** - 学生个人排名 + 学院排名，自动滚动适配大屏投影
- **圈数管理** - 管理员实时增减圈数，所有操作留有审计记录
- **学院系统** - 四个学院（春/夏/秋/冬），自定义颜色，自动汇总排名
- **主题引擎** - 明暗模式独立配置，支持纯色/渐变/图片背景、卡片毛玻璃效果，内置 4 套预设（Default/Ocean/Spring/Sakura），可自定义保存
- **权限控制** - 三级权限：访客（只读）、管理员（学生和圈数管理）、超级管理员（全部功能）
- **数据导出** - 排名数据导出为 Excel (.xlsx)
- **天气时钟** - 实时时钟 + 基于 IP 的天气显示

## 技术栈

| 层 | 技术 |
|---|---|
| 后端 | Go, Gin, GORM, JWT |
| 前端 | React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion |
| 数据库 | SQLite（默认）/ PostgreSQL |
| 部署 | Docker, 多阶段构建 |

## 快速开始

### Docker（推荐）

```bash
SUPER_ADMIN_PASSKEY=strongpass docker compose up -d
```

访问 http://localhost:8080，使用超级管理员通行码登录，然后在 设置 → Admins 中设置管理员通行码。

通过环境变量自定义配置：

```bash
JWT_SECRET=your-secret SUPER_ADMIN_PASSKEY=strongpass docker compose up -d
```

### 本地开发

**前置要求**：Go 1.25+、Node.js 22+

```bash
# 克隆项目
git clone https://github.com/HenryXiaoYang/PaoEventPanel.git
cd PaoEventPanel

# 配置环境变量
cp .env.example .env

# 启动后端（默认 :8080）
make dev-backend

# 启动前端开发服务器（另开终端）
make dev-frontend
```

### 构建生产版本

```bash
make build
./pao-event-panel
```

## 配置

通过环境变量或 `.env` 文件配置：

| 变量 | 默认值 | 说明 |
|---|---|---|
| `PORT` | `8080` | 服务端口 |
| `DB_DRIVER` | `sqlite` | 数据库驱动（`sqlite` 或 `postgres`） |
| `DB_DSN` | `pao_event.db` | 数据库连接字符串 |
| `JWT_SECRET` | `change-me-in-production` | JWT 签名密钥 |
| `SUPER_ADMIN_PASSKEY` | _(无)_ | 超级管理员通行码；未设置则无法以超级管理员登录。管理员通行码在 设置 → Admins 中设置 |

PostgreSQL 连接示例：

```
DB_DRIVER=postgres
DB_DSN=host=localhost user=postgres password=postgres dbname=pao_event port=5432 sslmode=disable
```

## 项目结构

```
PaoEventPanel/
├── main.go                  # 入口
├── config/                  # 配置加载
├── internal/
│   ├── database/            # 数据库初始化、迁移、种子数据
│   ├── handler/             # HTTP 处理器
│   ├── middleware/          # JWT 认证、CORS
│   ├── model/               # 数据模型
│   ├── router/              # 路由定义
│   └── service/             # 业务逻辑
├── web/                     # React 前端
│   ├── src/
│   │   ├── api/             # API 客户端
│   │   ├── components/      # UI 组件
│   │   ├── hooks/           # 自定义 Hooks
│   │   ├── stores/          # Zustand 状态管理
│   │   └── types/           # TypeScript 类型定义
│   └── ...
├── Dockerfile
├── docker-compose.yml
└── Makefile
```

## API

### 公开接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/login` | 使用通行码登录获取 JWT |
| GET | `/api/rankings/houses` | 学院排名 |
| GET | `/api/rankings/students` | 学生排名 |
| GET | `/api/rankings/stats` | 统计数据 |
| GET | `/api/activity` | 活动设置 |
| GET | `/api/students` | 学生列表 |

### 管理员接口（需 JWT）

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/students` | 添加学生 |
| PUT | `/api/students/:id` | 编辑学生 |
| DELETE | `/api/students/:id` | 删除学生 |
| POST | `/api/students/:id/laps` | 增减圈数 |
| PUT | `/api/students/:id/laps` | 设置圈数 |

### 超级管理员接口（需 JWT）

| 方法 | 路径 | 说明 |
|---|---|---|
| PUT | `/api/activity` | 更新活动设置 |
| POST | `/api/upload/logo` | 上传 Logo |
| POST | `/api/upload/background` | 上传背景图 |
| PUT | `/api/auth/admin-passkey` | 修改管理员通行码（所有管理员需重新登录） |
| GET | `/api/houses` | 学院列表 |
| PUT | `/api/houses/:id/color` | 修改学院颜色 |
| GET/POST/DELETE | `/api/theme-presets` | 主题预设管理 |
| POST | `/api/theme-presets/builtin/apply` | 应用内置预设 |
| POST | `/api/theme-presets/:id/apply` | 应用自定义预设 |
| GET | `/api/export/rankings` | 导出排名 Excel |

## License

MIT
