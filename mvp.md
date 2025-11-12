# MVP Development Plan (短期规划 - 2-3周)

**目标**: 建立基础的应用市场功能，支持用户注册、浏览应用、安装应用

**开发原则**:
- ✅ 前端优先：先用 localStorage 实现功能，测试通过后再连接后端
- ✅ 增量部署：每个 Phase 独立测试上线
- ✅ Supabase MCP：所有数据库操作使用 Supabase MCP
- ✅ 细化步骤：每个任务 < 4小时，包含测试检查点

---

## Phase 1: Supabase 初始化与数据库设计 (3-4天)

### 1.1 Supabase 项目设置

**任务清单**:
- [ ] 手动创建 Supabase 项目（你操作）
- [ ] 获取项目 URL 和 anon key
- [ ] 配置环境变量
- [ ] 测试 Supabase MCP 连接

**环境变量设置** (`.env.local`):
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**测试检查点**:
```bash
# 测试 Supabase MCP 连接
✅ 能够通过 MCP 执行 SQL 查询
✅ 能够列出现有表
✅ 能够创建测试表
```

---

### 1.2 核心数据库表设计

使用 **Supabase MCP** 创建以下表：

#### Table 1: `user_profiles` (用户资料)

```sql
-- 使用 Supabase MCP: apply_migration
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  is_creator BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_creator ON user_profiles(is_creator);

-- RLS 策略
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 用户可以查看所有 profile
CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  USING (true);

-- 用户只能更新自己的 profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- 用户可以插入自己的 profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

**MCP 命令**:
```bash
迁移名称: create_user_profiles_table
SQL: 上面的完整 SQL
```

**测试检查点**:
- [ ] 表创建成功
- [ ] RLS 策略生效
- [ ] 索引创建成功
- [ ] 可以通过 MCP 查询表结构

---

#### Table 2: `marketplace_apps` (市场应用)

```sql
-- 使用 Supabase MCP: apply_migration
CREATE TABLE marketplace_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,

  -- 基本信息
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL, -- URL友好的名称
  description TEXT NOT NULL,
  short_description VARCHAR(500),
  category VARCHAR(50) NOT NULL,
  tags TEXT[], -- 标签数组

  -- N8N 集成
  n8n_workflow_id VARCHAR(255),
  webhook_url TEXT NOT NULL,

  -- 媒体资源
  icon_url TEXT,
  cover_image_url TEXT,
  screenshots TEXT[], -- 截图数组

  -- 统计数据
  downloads_count INT DEFAULT 0,
  active_users_count INT DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0.00,
  rating_count INT DEFAULT 0,

  -- 状态管理
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'published', 'suspended', 'archived')),
  is_featured BOOLEAN DEFAULT false,

  -- 时间戳
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 搜索优化
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED
);

-- 创建索引
CREATE INDEX idx_marketplace_apps_creator ON marketplace_apps(creator_id);
CREATE INDEX idx_marketplace_apps_status ON marketplace_apps(status);
CREATE INDEX idx_marketplace_apps_category ON marketplace_apps(category);
CREATE INDEX idx_marketplace_apps_slug ON marketplace_apps(slug);
CREATE INDEX idx_marketplace_apps_search ON marketplace_apps USING GIN (search_vector);
CREATE INDEX idx_marketplace_apps_featured ON marketplace_apps(is_featured) WHERE is_featured = true;

-- RLS 策略
ALTER TABLE marketplace_apps ENABLE ROW LEVEL SECURITY;

-- 所有人可以查看已发布的应用
CREATE POLICY "Published apps are viewable by everyone"
  ON marketplace_apps FOR SELECT
  USING (status = 'published' OR creator_id = auth.uid());

-- 创作者可以插入自己的应用
CREATE POLICY "Creators can insert own apps"
  ON marketplace_apps FOR INSERT
  WITH CHECK (creator_id = auth.uid());

-- 创作者可以更新自己的应用
CREATE POLICY "Creators can update own apps"
  ON marketplace_apps FOR UPDATE
  USING (creator_id = auth.uid());

-- 创作者可以删除自己的应用
CREATE POLICY "Creators can delete own apps"
  ON marketplace_apps FOR DELETE
  USING (creator_id = auth.uid());
```

**MCP 命令**:
```bash
迁移名称: create_marketplace_apps_table
SQL: 上面的完整 SQL
```

**测试检查点**:
- [ ] 表创建成功
- [ ] 所有索引创建成功
- [ ] RLS 策略测试通过
- [ ] 全文搜索功能正常

---

#### Table 3: `user_installed_apps` (用户已安装应用)

```sql
-- 使用 Supabase MCP: apply_migration
CREATE TABLE user_installed_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  app_id UUID REFERENCES marketplace_apps(id) ON DELETE CASCADE NOT NULL,

  -- 使用统计
  install_count INT DEFAULT 1, -- 安装次数
  last_used_at TIMESTAMP WITH TIME ZONE,
  total_usage_count INT DEFAULT 0,

  -- 用户配置
  custom_config JSONB, -- 用户自定义配置
  is_pinned BOOLEAN DEFAULT false, -- 是否置顶
  is_favorite BOOLEAN DEFAULT false, -- 是否收藏

  -- 时间戳
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 唯一约束
  UNIQUE(user_id, app_id)
);

-- 创建索引
CREATE INDEX idx_user_installed_apps_user ON user_installed_apps(user_id);
CREATE INDEX idx_user_installed_apps_app ON user_installed_apps(app_id);
CREATE INDEX idx_user_installed_apps_pinned ON user_installed_apps(user_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_user_installed_apps_favorite ON user_installed_apps(user_id, is_favorite) WHERE is_favorite = true;

-- RLS 策略
ALTER TABLE user_installed_apps ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己安装的应用
CREATE POLICY "Users can view own installed apps"
  ON user_installed_apps FOR SELECT
  USING (user_id = auth.uid());

-- 用户可以安装应用
CREATE POLICY "Users can install apps"
  ON user_installed_apps FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 用户可以更新自己的安装配置
CREATE POLICY "Users can update own installations"
  ON user_installed_apps FOR UPDATE
  USING (user_id = auth.uid());

-- 用户可以卸载应用
CREATE POLICY "Users can uninstall apps"
  ON user_installed_apps FOR DELETE
  USING (user_id = auth.uid());
```

**MCP 命令**:
```bash
迁移名称: create_user_installed_apps_table
SQL: 上面的完整 SQL
```

**测试检查点**:
- [ ] 表创建成功
- [ ] 唯一约束工作正常
- [ ] RLS 策略测试通过

---

#### Table 4: `app_reviews` (应用评价)

```sql
-- 使用 Supabase MCP: apply_migration
CREATE TABLE app_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES marketplace_apps(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,

  -- 评价内容
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  comment TEXT,

  -- 互动统计
  helpful_count INT DEFAULT 0,

  -- 版本信息
  app_version VARCHAR(20),

  -- 状态
  is_verified_purchase BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 一个用户只能评价一个应用一次
  UNIQUE(user_id, app_id)
);

-- 创建索引
CREATE INDEX idx_app_reviews_app ON app_reviews(app_id);
CREATE INDEX idx_app_reviews_user ON app_reviews(user_id);
CREATE INDEX idx_app_reviews_rating ON app_reviews(app_id, rating);
CREATE INDEX idx_app_reviews_created ON app_reviews(app_id, created_at DESC);

-- RLS 策略
ALTER TABLE app_reviews ENABLE ROW LEVEL SECURITY;

-- 所有人可以查看未隐藏的评价
CREATE POLICY "Public reviews are viewable by everyone"
  ON app_reviews FOR SELECT
  USING (is_hidden = false);

-- 用户可以创建评价
CREATE POLICY "Users can create reviews"
  ON app_reviews FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 用户可以更新自己的评价
CREATE POLICY "Users can update own reviews"
  ON app_reviews FOR UPDATE
  USING (user_id = auth.uid());

-- 用户可以删除自己的评价
CREATE POLICY "Users can delete own reviews"
  ON app_reviews FOR DELETE
  USING (user_id = auth.uid());
```

**MCP 命令**:
```bash
迁移名称: create_app_reviews_table
SQL: 上面的完整 SQL
```

**测试检查点**:
- [ ] 表创建成功
- [ ] 评分约束正常工作
- [ ] 唯一约束防止重复评价
- [ ] RLS 策略测试通过

---

### 1.3 数据库函数和触发器

#### Function 1: 更新应用评分

```sql
-- 使用 Supabase MCP: apply_migration
CREATE OR REPLACE FUNCTION update_app_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新应用的平均评分和评价数量
  UPDATE marketplace_apps
  SET
    rating_average = (
      SELECT COALESCE(AVG(rating), 0)
      FROM app_reviews
      WHERE app_id = NEW.app_id AND is_hidden = false
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM app_reviews
      WHERE app_id = NEW.app_id AND is_hidden = false
    ),
    updated_at = NOW()
  WHERE id = NEW.app_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
CREATE TRIGGER trigger_update_app_rating
AFTER INSERT OR UPDATE OR DELETE ON app_reviews
FOR EACH ROW EXECUTE FUNCTION update_app_rating();
```

**MCP 命令**:
```bash
迁移名称: create_update_app_rating_function
SQL: 上面的完整 SQL
```

---

#### Function 2: 更新下载统计

```sql
-- 使用 Supabase MCP: apply_migration
CREATE OR REPLACE FUNCTION increment_app_downloads()
RETURNS TRIGGER AS $$
BEGIN
  -- 增加应用的下载次数
  UPDATE marketplace_apps
  SET
    downloads_count = downloads_count + 1,
    active_users_count = (
      SELECT COUNT(DISTINCT user_id)
      FROM user_installed_apps
      WHERE app_id = NEW.app_id
    ),
    updated_at = NOW()
  WHERE id = NEW.app_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
CREATE TRIGGER trigger_increment_downloads
AFTER INSERT ON user_installed_apps
FOR EACH ROW EXECUTE FUNCTION increment_app_downloads();
```

**MCP 命令**:
```bash
迁移名称: create_increment_downloads_function
SQL: 上面的完整 SQL
```

**测试检查点**:
- [ ] 函数创建成功
- [ ] 触发器正常工作
- [ ] 统计数据自动更新

---

### 1.4 Storage Buckets 设置

使用 **Supabase Dashboard** 或 API 创建以下 buckets:

#### Bucket 1: `app-icons`
```typescript
// 配置
{
  name: 'app-icons',
  public: true,
  fileSizeLimit: 2097152, // 2MB
  allowedMimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
}
```

**RLS 策略**:
```sql
-- 所有人可以查看
CREATE POLICY "Public icons are accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'app-icons');

-- 创作者可以上传
CREATE POLICY "Creators can upload icons"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'app-icons' AND auth.uid() IS NOT NULL);
```

---

#### Bucket 2: `app-screenshots`
```typescript
// 配置
{
  name: 'app-screenshots',
  public: true,
  fileSizeLimit: 5242880, // 5MB
  allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
}
```

**RLS 策略**: (同上)

---

#### Bucket 3: `user-avatars`
```typescript
// 配置
{
  name: 'user-avatars',
  public: true,
  fileSizeLimit: 1048576, // 1MB
  allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
}
```

**测试检查点**:
- [ ] 所有 buckets 创建成功
- [ ] 文件大小限制生效
- [ ] MIME 类型限制生效
- [ ] RLS 策略测试通过

---

### 1.5 安装 Supabase 客户端

**任务**:
```bash
npm install @supabase/supabase-js
```

**创建 Supabase 客户端** (`src/lib/supabase.ts`):
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 类型定义
export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          is_creator: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>
      }
      marketplace_apps: {
        Row: {
          id: string
          creator_id: string
          name: string
          slug: string
          description: string
          short_description: string | null
          category: string
          tags: string[] | null
          n8n_workflow_id: string | null
          webhook_url: string
          icon_url: string | null
          cover_image_url: string | null
          screenshots: string[] | null
          downloads_count: number
          active_users_count: number
          rating_average: number
          rating_count: number
          status: 'draft' | 'pending_review' | 'published' | 'suspended' | 'archived'
          is_featured: boolean
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['marketplace_apps']['Row'], 'id' | 'downloads_count' | 'active_users_count' | 'rating_average' | 'rating_count' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['marketplace_apps']['Insert']>
      }
      user_installed_apps: {
        Row: {
          id: string
          user_id: string
          app_id: string
          install_count: number
          last_used_at: string | null
          total_usage_count: number
          custom_config: Record<string, any> | null
          is_pinned: boolean
          is_favorite: boolean
          installed_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_installed_apps']['Row'], 'id' | 'install_count' | 'total_usage_count' | 'installed_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_installed_apps']['Insert']>
      }
      app_reviews: {
        Row: {
          id: string
          app_id: string
          user_id: string
          rating: number
          title: string | null
          comment: string | null
          helpful_count: number
          app_version: string | null
          is_verified_purchase: boolean
          is_hidden: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['app_reviews']['Row'], 'id' | 'helpful_count' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['app_reviews']['Insert']>
      }
    }
  }
}
```

**测试检查点**:
- [ ] Supabase 客户端连接成功
- [ ] 可以查询测试数据
- [ ] 类型定义正确

---

## Phase 1 完成检查清单

- [ ] Supabase 项目创建并配置
- [ ] 4个核心表创建成功
- [ ] 所有RLS策略测试通过
- [ ] 数据库函数和触发器工作正常
- [ ] 3个Storage buckets配置完成
- [ ] Supabase客户端集成成功
- [ ] 所有测试用例通过

**预估时间**: 3-4天
**回滚方案**: 使用 Supabase MCP 删除所有迁移

---

## Phase 2: 用户认证系统 (4-5天)

### 2.1 前端UI - 注册/登录页面 (localStorage版本)

**开发原则**: 先用 localStorage 模拟认证，测试UI完成后再连接 Supabase Auth

#### 创建认证 Store (`src/store/auth.ts`)

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  displayName: string | null
  avatarUrl: string | null
  isCreator: boolean
}

interface AuthState {
  user: User | null
  isLoading: boolean

  // localStorage 模拟方法（测试用）
  mockLogin: (email: string, password: string) => Promise<boolean>
  mockRegister: (email: string, password: string) => Promise<boolean>
  mockLogout: () => void

  // 真实方法（Phase 2.2 实现）
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,

      // ===== localStorage 模拟实现（测试用）=====
      async mockLogin(email, password) {
        set({ isLoading: true })

        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 从 localStorage 获取用户数据
        const usersJson = localStorage.getItem('mock_users')
        const users = usersJson ? JSON.parse(usersJson) : []

        const user = users.find((u: any) => u.email === email && u.password === password)

        if (user) {
          const { password: _, ...userData } = user
          set({ user: userData, isLoading: false })
          return true
        }

        set({ isLoading: false })
        return false
      },

      async mockRegister(email, password) {
        set({ isLoading: true })

        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 从 localStorage 获取用户数据
        const usersJson = localStorage.getItem('mock_users')
        const users = usersJson ? JSON.parse(usersJson) : []

        // 检查邮箱是否已存在
        if (users.some((u: any) => u.email === email)) {
          set({ isLoading: false })
          return false
        }

        // 创建新用户
        const newUser = {
          id: `mock-${Date.now()}`,
          email,
          password, // 注意：真实环境不应该存储明文密码
          displayName: email.split('@')[0],
          avatarUrl: null,
          isCreator: false,
        }

        users.push(newUser)
        localStorage.setItem('mock_users', JSON.stringify(users))

        const { password: _, ...userData } = newUser
        set({ user: userData, isLoading: false })
        return true
      },

      mockLogout() {
        set({ user: null })
      },

      // ===== 真实实现占位符 =====
      async login(email, password) {
        // Phase 2.2 实现
        return false
      },

      async register(email, password) {
        // Phase 2.2 实现
        return false
      },

      async logout() {
        // Phase 2.2 实现
      },

      async checkSession() {
        // Phase 2.2 实现
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
)
```

**测试检查点**:
- [ ] Store 创建成功
- [ ] mockRegister 可以注册用户
- [ ] mockLogin 可以登录用户
- [ ] mockLogout 可以登出
- [ ] localStorage 正确存储数据

---

#### 创建登录页面 (`src/routes/Login.tsx`)

```typescript
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

export const Login = () => {
  const navigate = useNavigate()
  const { mockLogin, isLoading } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Please enter email and password')
      return
    }

    const success = await mockLogin(email, password)

    if (success) {
      toast.success('Login successful!')
      navigate('/')
    } else {
      toast.error('Invalid email or password')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access your apps
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-border bg-transparent pl-10 pr-4 py-3 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-border bg-transparent pl-10 pr-12 py-3 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
```

**测试检查点**:
- [ ] 登录页面UI渲染正常
- [ ] 表单验证工作正常
- [ ] mockLogin 调用成功
- [ ] 登录后跳转到首页
- [ ] 错误提示正确显示

---

#### 创建注册页面 (`src/routes/Register.tsx`)

```typescript
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, Mail, Lock, User } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

export const Register = () => {
  const navigate = useNavigate()
  const { mockRegister, isLoading } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 验证
    if (!email || !password || !confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    const success = await mockRegister(email, password)

    if (success) {
      toast.success('Account created successfully!')
      navigate('/')
    } else {
      toast.error('Email already exists')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Start building with AI-powered workflows
          </p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-border bg-transparent pl-10 pr-4 py-3 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-lg border border-border bg-transparent pl-10 pr-12 py-3 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full rounded-lg border border-border bg-transparent pl-10 pr-4 py-3 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
```

**测试检查点**:
- [ ] 注册页面UI渲染正常
- [ ] 表单验证工作正常（密码长度、匹配等）
- [ ] mockRegister 调用成功
- [ ] 注册后自动登录并跳转
- [ ] 重复邮箱提示正确

---

#### 添加路由

**更新 `src/main.tsx` 或路由配置**:
```typescript
import { Login } from '@/routes/Login'
import { Register } from '@/routes/Register'

// 添加路由
{
  path: '/login',
  element: <Login />
},
{
  path: '/register',
  element: <Register />
}
```

---

#### 创建路由保护组件

**`src/components/auth/ProtectedRoute.tsx`**:
```typescript
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user } = useAuthStore()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
```

**使用示例**:
```typescript
{
  path: '/marketplace',
  element: (
    <ProtectedRoute>
      <Marketplace />
    </ProtectedRoute>
  )
}
```

**测试检查点**:
- [ ] 未登录用户被重定向到登录页
- [ ] 已登录用户可以访问受保护页面

---

### Phase 2.1 完成检查清单

- [ ] Auth Store创建并测试通过
- [ ] Login页面UI完成
- [ ] Register页面UI完成
- [ ] 路由配置完成
- [ ] ProtectedRoute组件工作正常
- [ ] localStorage模拟认证功能正常
- [ ] 所有表单验证测试通过

**预估时间**: 2天
**回滚方案**: 删除新增的路由和页面文件

---

### 2.2 集成 Supabase Auth (真实认证)

**前提条件**: Phase 2.1 测试通过，localStorage版本工作正常

#### 更新 Auth Store - 真实实现

**更新 `src/store/auth.ts`**:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  displayName: string | null
  avatarUrl: string | null
  isCreator: boolean
}

interface AuthState {
  user: UserProfile | null
  session: any | null
  isLoading: boolean

  // 真实认证方法
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isLoading: false,

      // ===== 注册 =====
      async register(email, password) {
        set({ isLoading: true })

        try {
          // 1. 使用 Supabase Auth 注册
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            }
          })

          if (authError) throw authError

          if (!authData.user) {
            throw new Error('Registration failed')
          }

          // 2. 创建用户 profile
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: authData.user.id,
              email: authData.user.email!,
              display_name: authData.user.email!.split('@')[0],
              is_creator: false,
            })

          if (profileError) throw profileError

          // 3. 获取 profile 数据
          const { data: profile, error: fetchError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single()

          if (fetchError) throw fetchError

          // 4. 更新状态
          set({
            user: {
              id: profile.id,
              email: profile.email,
              displayName: profile.display_name,
              avatarUrl: profile.avatar_url,
              isCreator: profile.is_creator,
            },
            session: authData.session,
            isLoading: false,
          })

          return { success: true }

        } catch (error: any) {
          set({ isLoading: false })
          return {
            success: false,
            error: error.message || 'Registration failed'
          }
        }
      },

      // ===== 登录 =====
      async login(email, password) {
        set({ isLoading: true })

        try {
          // 1. Supabase Auth 登录
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (authError) throw authError

          if (!authData.user) {
            throw new Error('Login failed')
          }

          // 2. 获取用户 profile
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single()

          if (profileError) throw profileError

          // 3. 更新状态
          set({
            user: {
              id: profile.id,
              email: profile.email,
              displayName: profile.display_name,
              avatarUrl: profile.avatar_url,
              isCreator: profile.is_creator,
            },
            session: authData.session,
            isLoading: false,
          })

          return { success: true }

        } catch (error: any) {
          set({ isLoading: false })
          return {
            success: false,
            error: error.message || 'Login failed'
          }
        }
      },

      // ===== 登出 =====
      async logout() {
        await supabase.auth.signOut()
        set({ user: null, session: null })
      },

      // ===== 检查会话 =====
      async checkSession() {
        set({ isLoading: true })

        try {
          const { data: { session } } = await supabase.auth.getSession()

          if (!session) {
            set({ user: null, session: null, isLoading: false })
            return
          }

          // 获取用户 profile
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profile) {
            set({
              user: {
                id: profile.id,
                email: profile.email,
                displayName: profile.display_name,
                avatarUrl: profile.avatar_url,
                isCreator: profile.is_creator,
              },
              session,
              isLoading: false,
            })
          } else {
            set({ user: null, session: null, isLoading: false })
          }

        } catch (error) {
          console.error('Session check error:', error)
          set({ user: null, session: null, isLoading: false })
        }
      },

      // ===== 更新 Profile =====
      async updateProfile(updates) {
        const { user } = get()
        if (!user) return false

        try {
          const { error } = await supabase
            .from('user_profiles')
            .update({
              display_name: updates.displayName,
              avatar_url: updates.avatarUrl,
              bio: updates.bio,
            })
            .eq('id', user.id)

          if (error) throw error

          // 更新本地状态
          set({
            user: {
              ...user,
              ...updates,
            }
          })

          return true

        } catch (error) {
          console.error('Profile update error:', error)
          return false
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
      }),
    }
  )
)
```

---

#### 更新登录页面

**更新 `src/routes/Login.tsx`**:
```typescript
// 只需要更改这一行
const { login, isLoading } = useAuthStore()  // 使用真实的 login 而非 mockLogin

// 更新 handleSubmit
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!email || !password) {
    toast.error('Please enter email and password')
    return
  }

  const { success, error } = await login(email, password)

  if (success) {
    toast.success('Login successful!')
    navigate('/')
  } else {
    toast.error(error || 'Login failed')
  }
}
```

---

#### 更新注册页面

**更新 `src/routes/Register.tsx`**:
```typescript
// 只需要更改这一行
const { register, isLoading } = useAuthStore()  // 使用真实的 register

// 更新 handleSubmit
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  // 验证
  if (!email || !password || !confirmPassword) {
    toast.error('Please fill in all fields')
    return
  }

  if (password !== confirmPassword) {
    toast.error('Passwords do not match')
    return
  }

  if (password.length < 6) {
    toast.error('Password must be at least 6 characters')
    return
  }

  const { success, error } = await register(email, password)

  if (success) {
    toast.success('Account created! Please check your email to verify.')
    navigate('/')
  } else {
    toast.error(error || 'Registration failed')
  }
}
```

---

#### 添加会话检查

**更新 `src/main.tsx` 或 `App.tsx`**:
```typescript
import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'

function App() {
  const { checkSession } = useAuthStore()

  useEffect(() => {
    // 检查会话
    checkSession()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session)
        await checkSession()
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return <Router />
}
```

---

### Phase 2.2 完成检查清单

- [ ] Auth Store 真实实现完成
- [ ] 注册功能连接 Supabase
- [ ] 登录功能连接 Supabase
- [ ] 登出功能正常
- [ ] 会话持久化正常
- [ ] Profile 自动创建
- [ ] 所有错误处理正确
- [ ] Email 验证流程（可选）

**预估时间**: 2-3天
**回滚方案**: 切换回 localStorage mock 实现

---

## Phase 2 完成检查清单

- [ ] 前端认证UI完成（Phase 2.1）
- [ ] localStorage模拟测试通过
- [ ] Supabase Auth集成完成（Phase 2.2）
- [ ] 用户注册/登录/登出功能正常
- [ ] 会话管理正常
- [ ] 路由保护正常工作
- [ ] 所有测试用例通过

**预估时间**: 4-5天
**下一阶段**: Phase 3 - 应用市场前端

---

## Phase 3: 应用市场前端 (localStorage版本) (5-6天)

### 3.1 市场首页 - 应用列表

**开发原则**: 先用 localStorage 存储应用数据，UI完成并测试通过后再连接 Supabase

#### 创建市场 Store (`src/store/marketplace.ts`)

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface MarketplaceApp {
  id: string
  creatorId: string
  creatorName: string
  name: string
  slug: string
  description: string
  shortDescription: string
  category: string
  tags: string[]
  webhookUrl: string
  iconUrl: string | null
  coverImageUrl: string | null
  screenshots: string[]
  downloadsCount: number
  activeUsersCount: number
  ratingAverage: number
  ratingCount: number
  status: 'draft' | 'published'
  isFeatured: boolean
  createdAt: string
  updatedAt: string
}

interface MarketplaceState {
  apps: MarketplaceApp[]
  installedAppIds: Set<string>
  isLoading: boolean
  searchQuery: string
  selectedCategory: string | null

  // localStorage 模拟方法（测试用）
  mockFetchApps: () => Promise<void>
  mockInstallApp: (appId: string) => Promise<boolean>
  mockUninstallApp: (appId: string) => Promise<boolean>
  mockInitializeData: () => void

  // 真实方法占位符（Phase 4实现）
  fetchApps: () => Promise<void>
  installApp: (appId: string) => Promise<boolean>
  uninstallApp: (appId: string) => Promise<boolean>
  searchApps: (query: string) => void
  filterByCategory: (category: string | null) => void
}

export const useMarketplaceStore = create<MarketplaceState>()(
  persist(
    (set, get) => ({
      apps: [],
      installedAppIds: new Set(),
      isLoading: false,
      searchQuery: '',
      selectedCategory: null,

      // ===== localStorage 模拟实现 =====
      mockInitializeData() {
        // 初始化一些示例应用数据
        const mockApps: MarketplaceApp[] = [
          {
            id: 'app-1',
            creatorId: 'creator-1',
            creatorName: 'AI Assistant Team',
            name: 'Weather Assistant',
            slug: 'weather-assistant',
            description: 'Get real-time weather information for any location using voice or text commands.',
            shortDescription: 'Get weather info instantly',
            category: 'Utility',
            tags: ['weather', 'ai', 'assistant'],
            webhookUrl: 'https://example.com/webhook/weather',
            iconUrl: '☀️',
            coverImageUrl: null,
            screenshots: [],
            downloadsCount: 1250,
            activeUsersCount: 890,
            ratingAverage: 4.5,
            ratingCount: 234,
            status: 'published',
            isFeatured: true,
            createdAt: new Date().toISOString(),
            updated At: new Date().toISOString(),
          },
          {
            id: 'app-2',
            creatorId: 'creator-2',
            creatorName: 'Productivity Pro',
            name: 'Task Manager',
            slug: 'task-manager',
            description: 'Manage your tasks and to-do lists with AI-powered reminders and smart scheduling.',
            shortDescription: 'AI task management',
            category: 'Productivity',
            tags: ['tasks', 'productivity', 'reminders'],
            webhookUrl: 'https://example.com/webhook/tasks',
            iconUrl: '✅',
            coverImageUrl: null,
            screenshots: [],
            downloadsCount: 2100,
            activeUsersCount: 1500,
            ratingAverage: 4.8,
            ratingCount: 456,
            status: 'published',
            isFeatured: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'app-3',
            creatorId: 'creator-3',
            creatorName: 'Dev Tools Inc',
            name: 'Code Snippet Manager',
            slug: 'code-snippet-manager',
            description: 'Save and organize your code snippets with AI-powered search and tagging.',
            shortDescription: 'Organize code snippets',
            category: 'Developer Tools',
            tags: ['code', 'snippets', 'developer'],
            webhookUrl: 'https://example.com/webhook/code',
            iconUrl: '💻',
            coverImageUrl: null,
            screenshots: [],
            downloadsCount: 850,
            activeUsersCount: 620,
            ratingAverage: 4.3,
            ratingCount: 178,
            status: 'published',
            isFeatured: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]

        // 存储到 localStorage
        localStorage.setItem('mock_marketplace_apps', JSON.stringify(mockApps))
        set({ apps: mockApps })
      },

      async mockFetchApps() {
        set({ isLoading: true })

        // 模拟 API 延迟
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 从 localStorage 获取数据
        const appsJson = localStorage.getItem('mock_marketplace_apps')
        let apps: MarketplaceApp[] = []

        if (appsJson) {
          apps = JSON.parse(appsJson)
        } else {
          // 如果没有数据，初始化
          get().mockInitializeData()
          apps = get().apps
        }

        set({ apps, isLoading: false })
      },

      async mockInstallApp(appId) {
        set({ isLoading: true })

        // 模拟 API 延迟
        await new Promise(resolve => setTimeout(resolve, 500))

        const { installedAppIds } = get()
        const newInstalledIds = new Set(installedAppIds)
        newInstalledIds.add(appId)

        // 更新下载统计
        const apps = get().apps.map(app =>
          app.id === appId
            ? { ...app, downloadsCount: app.downloadsCount + 1 }
            : app
        )

        set({
          installedAppIds: newInstalledIds,
          apps,
          isLoading: false
        })

        // 持久化到 localStorage
        localStorage.setItem('mock_installed_apps', JSON.stringify([...newInstalledIds]))
        localStorage.setItem('mock_marketplace_apps', JSON.stringify(apps))

        return true
      },

      async mockUninstallApp(appId) {
        set({ isLoading: true })

        // 模拟 API 延迟
        await new Promise(resolve => setTimeout(resolve, 500))

        const { installedAppIds } = get()
        const newInstalledIds = new Set(installedAppIds)
        newInstalledIds.delete(appId)

        set({
          installedAppIds: newInstalledIds,
          isLoading: false
        })

        // 持久化到 localStorage
        localStorage.setItem('mock_installed_apps', JSON.stringify([...newInstalledIds]))

        return true
      },

      searchApps(query) {
        set({ searchQuery: query })
      },

      filterByCategory(category) {
        set({ selectedCategory: category })
      },

      // ===== 真实方法占位符 =====
      async fetchApps() {
        // Phase 4 实现
      },

      async installApp(appId) {
        // Phase 4 实现
        return false
      },

      async uninstallApp(appId) {
        // Phase 4 实现
        return false
      },
    }),
    {
      name: 'marketplace-storage',
      partialize: (state) => ({
        installedAppIds: [...state.installedAppIds],
      }),
    }
  )
)
```

**测试检查点**:
- [ ] Store 创建成功
- [ ] mockInitializeData 创建示例数据
- [ ] mockFetchApps 从 localStorage 读取数据
- [ ] mockInstallApp 正常工作
- [ ] mockUninstallApp 正常工作

---

**由于字符限制，mvp.md 的剩余内容太长。让我继续创建完整的文档...**

让我继续完成 mvp.md 的创建（由于篇幅限制，我会分多次完成）。
#### 创建应用卡片组件 (`src/components/marketplace/AppCard.tsx`)

```typescript
import { Star, Download, Users, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { MarketplaceApp } from '@/store/marketplace'

interface AppCardProps {
  app: MarketplaceApp
  isInstalled?: boolean
  onInstall?: (appId: string) => void
  onUninstall?: (appId: string) => void
}

export const AppCard = ({ app, isInstalled, onInstall, onUninstall }: AppCardProps) => {
  return (
    <Link
      to={`/marketplace/${app.slug}`}
      className="group block rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-lg"
    >
      {/* App Icon & Featured Badge */}
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-3xl">
          {app.iconUrl || '📱'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-foreground line-clamp-1 group-hover:text-primary transition">
              {app.name}
            </h3>
            {app.isFeatured && (
              <span className="shrink-0 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                Featured
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
            by {app.creatorName}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
        {app.shortDescription || app.description}
      </p>

      {/* Stats */}
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Star size={14} className="fill-yellow-400 text-yellow-400" />
          <span className="font-medium text-foreground">{app.ratingAverage.toFixed(1)}</span>
          <span>({app.ratingCount})</span>
        </div>
        <div className="flex items-center gap-1">
          <Download size={14} />
          <span>{app.downloadsCount.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <Users size={14} />
          <span>{app.activeUsersCount.toLocaleString()}</span>
        </div>
      </div>

      {/* Category Tags */}
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground">
          {app.category}
        </span>
        {app.tags?.slice(0, 2).map((tag) => (
          <span key={tag} className="rounded-full bg-secondary/50 px-2 py-1 text-xs text-muted-foreground">
            {tag}
          </span>
        ))}
      </div>

      {/* Install Status */}
      <div className="mt-4 flex items-center justify-between">
        {isInstalled ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
            <div className="h-2 w-2 rounded-full bg-green-600" />
            Installed
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Not installed</span>
        )}
        <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition" />
      </div>
    </Link>
  )
}
```

**测试检查点**:
- [ ] AppCard 正确渲染所有应用信息
- [ ] Featured badge 显示正常
- [ ] 评分和统计数据格式化正确
- [ ] 链接跳转到正确的详情页
- [ ] Hover 效果正常

---

#### 创建市场首页 (`src/routes/Marketplace.tsx`)

```typescript
import { useEffect, useState } from 'react'
import { Search, Filter, TrendingUp, Sparkles } from 'lucide-react'
import { useMarketplaceStore } from '@/store/marketplace'
import { AppCard } from '@/components/marketplace/AppCard'

const categories = ['All', 'Utility', 'Productivity', 'Developer Tools', 'AI', 'Entertainment']

export const Marketplace = () => {
  const {
    apps,
    installedAppIds,
    isLoading,
    searchQuery,
    selectedCategory,
    mockFetchApps,
    mockInstallApp,
    mockUninstallApp,
    searchApps,
    filterByCategory,
  } = useMarketplaceStore()

  const [localSearch, setLocalSearch] = useState(searchQuery)

  // Load apps on mount
  useEffect(() => {
    mockFetchApps()
  }, [mockFetchApps])

  // Filter apps based on search and category
  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      !searchQuery ||
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = !selectedCategory || selectedCategory === 'All' || app.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Separate featured and regular apps
  const featuredApps = filteredApps.filter((app) => app.isFeatured)
  const regularApps = filteredApps.filter((app) => !app.isFeatured)

  return (
    <div className="flex h-screen flex-col bg-background pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-[calc(4rem+env(safe-area-inset-bottom))]">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">App Marketplace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Discover and install powerful AI-powered workflows
          </p>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value)
                searchApps(e.target.value)
              }}
              placeholder="Search apps..."
              className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2.5 text-sm transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="overflow-x-auto px-4 pb-3">
          <div className="flex gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => filterByCategory(category === 'All' ? null : category)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  (category === 'All' && !selectedCategory) || selectedCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-8">
          {/* Featured Apps */}
          {featuredApps.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Sparkles size={20} className="text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Featured Apps</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featuredApps.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    isInstalled={installedAppIds.has(app.id)}
                    onInstall={mockInstallApp}
                    onUninstall={mockUninstallApp}
                  />
                ))}
              </div>
            </section>
          )}

          {/* All Apps */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">
                {selectedCategory ? `${selectedCategory} Apps` : 'All Apps'}
              </h2>
              <span className="text-sm text-muted-foreground">({regularApps.length})</span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : regularApps.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {regularApps.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    isInstalled={installedAppIds.has(app.id)}
                    onInstall={mockInstallApp}
                    onUninstall={mockUninstallApp}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-12 text-center">
                <p className="text-muted-foreground">No apps found</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
```

**测试检查点**:
- [ ] 市场首页渲染正常
- [ ] 搜索功能正常工作
- [ ] 分类过滤正常工作
- [ ] Featured apps 单独显示
- [ ] 应用卡片点击跳转正常
- [ ] Loading 状态显示正常

---

### 3.2 应用详情页

#### 创建应用详情页 (`src/routes/AppDetail.tsx`)

```typescript
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Star,
  Download,
  Users,
  ExternalLink,
  Check,
  Loader2,
  Calendar,
  Tag,
} from 'lucide-react'
import { toast } from 'sonner'
import { useMarketplaceStore } from '@/store/marketplace'
import { useAuthStore } from '@/store/auth'

export const AppDetail = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { apps, installedAppIds, mockInstallApp, mockUninstallApp, isLoading } = useMarketplaceStore()

  const [installing, setInstalling] = useState(false)

  const app = apps.find((a) => a.slug === slug)
  const isInstalled = app ? installedAppIds.has(app.id) : false

  useEffect(() => {
    if (!app && !isLoading) {
      toast.error('App not found')
      navigate('/marketplace')
    }
  }, [app, isLoading, navigate])

  if (!app) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const handleInstall = async () => {
    if (!user) {
      toast.error('Please login to install apps')
      navigate('/login')
      return
    }

    setInstalling(true)
    const success = await mockInstallApp(app.id)
    setInstalling(false)

    if (success) {
      toast.success(`${app.name} installed successfully!`)
    } else {
      toast.error('Failed to install app')
    }
  }

  const handleUninstall = async () => {
    setInstalling(true)
    const success = await mockUninstallApp(app.id)
    setInstalling(false)

    if (success) {
      toast.success(`${app.name} uninstalled`)
    } else {
      toast.error('Failed to uninstall app')
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-[calc(4rem+env(safe-area-inset-bottom))]">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex h-14 items-center px-4 gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-9 h-9 rounded-lg transition-all hover:bg-secondary"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-foreground">App Details</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
          {/* App Header */}
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-5xl">
              {app.iconUrl || '📱'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{app.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">by {app.creatorName}</p>
                </div>
                {app.isFeatured && (
                  <span className="shrink-0 rounded-full bg-primary/20 px-3 py-1 text-sm font-medium text-primary">
                    Featured
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Star size={16} className="fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{app.ratingAverage.toFixed(1)}</span>
                  <span className="text-muted-foreground">({app.ratingCount} reviews)</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Download size={16} />
                  <span>{app.downloadsCount.toLocaleString()} downloads</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users size={16} />
                  <span>{app.activeUsersCount.toLocaleString()} active users</span>
                </div>
              </div>
            </div>
          </div>

          {/* Install Button */}
          <div className="flex gap-3">
            {isInstalled ? (
              <>
                <button
                  onClick={handleUninstall}
                  disabled={installing}
                  className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {installing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Uninstalling...
                    </span>
                  ) : (
                    'Uninstall'
                  )}
                </button>
                <Link
                  to={`/chat/${app.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                >
                  <Check size={16} />
                  Open App
                </Link>
              </>
            ) : (
              <button
                onClick={handleInstall}
                disabled={installing}
                className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {installing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Installing...
                  </span>
                ) : (
                  'Install'
                )}
              </button>
            )}
          </div>

          {/* Description */}
          <section className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground">About</h3>
            <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">{app.description}</p>
          </section>

          {/* Category & Tags */}
          <section className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">Category & Tags</h3>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                <Tag size={14} />
                {app.category}
              </span>
              {app.tags?.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-secondary px-3 py-1.5 text-sm text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>

          {/* Information */}
          <section className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Creator</span>
                <span className="font-medium">{app.creatorName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Published</span>
                <span className="font-medium">
                  {new Date(app.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="font-medium">
                  {new Date(app.updatedAt).toLocaleDateString()}
                </span>
              </div>
              {app.webhookUrl && (
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Webhook</span>
                  <a
                    href={app.webhookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    View
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
```

**测试检查点**:
- [ ] 应用详情页正确显示所有信息
- [ ] Install/Uninstall 按钮功能正常
- [ ] 已安装应用显示 "Open App" 按钮
- [ ] 未登录用户点击安装跳转到登录页
- [ ] 返回按钮正常工作

---

### 3.3 我的应用页面

#### 创建我的应用页面 (`src/routes/MyApps.tsx`)

```typescript
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, ChevronRight, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useMarketplaceStore } from '@/store/marketplace'
import { useAuthStore } from '@/store/auth'

export const MyApps = () => {
  const { user } = useAuthStore()
  const { apps, installedAppIds, mockFetchApps, mockUninstallApp } = useMarketplaceStore()

  useEffect(() => {
    mockFetchApps()
  }, [mockFetchApps])

  const installedApps = apps.filter((app) => installedAppIds.has(app.id))

  const handleUninstall = async (appId: string, appName: string) => {
    if (!confirm(`Are you sure you want to uninstall ${appName}?`)) {
      return
    }

    const success = await mockUninstallApp(appId)
    if (success) {
      toast.success(`${appName} uninstalled`)
    } else {
      toast.error('Failed to uninstall app')
    }
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center px-4">
        <div className="text-center">
          <Package size={48} className="mx-auto text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Login Required</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please login to view your installed apps
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-[calc(4rem+env(safe-area-inset-bottom))]">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">My Apps</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {installedApps.length} {installedApps.length === 1 ? 'app' : 'apps'} installed
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6">
          {installedApps.length > 0 ? (
            <div className="space-y-3">
              {installedApps.map((app) => (
                <div
                  key={app.id}
                  className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50"
                >
                  {/* App Icon */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-3xl">
                    {app.iconUrl || '📱'}
                  </div>

                  {/* App Info */}
                  <Link to={`/marketplace/${app.slug}`} className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition line-clamp-1">
                      {app.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                      {app.shortDescription || app.description}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-secondary px-2 py-0.5">{app.category}</span>
                      <span>•</span>
                      <span>{app.downloadsCount.toLocaleString()} downloads</span>
                    </div>
                  </Link>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      to={`/chat/${app.id}`}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                    >
                      Open
                    </Link>
                    <button
                      onClick={() => handleUninstall(app.id, app.name)}
                      className="rounded-lg border border-border p-2 text-muted-foreground transition hover:border-destructive hover:bg-destructive hover:text-destructive-foreground"
                      aria-label="Uninstall"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-12 text-center">
              <Package size={48} className="mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">No Apps Installed</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Browse the marketplace to discover and install apps
              </p>
              <Link
                to="/marketplace"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Browse Marketplace
                <ChevronRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

**测试检查点**:
- [ ] 我的应用页面正确显示已安装应用
- [ ] Open 按钮正常跳转
- [ ] Uninstall 按钮功能正常
- [ ] 未登录用户显示登录提示
- [ ] 空状态显示正常

---

### 3.4 路由配置更新

**更新路由配置文件** (例如 `src/main.tsx` 或 `src/App.tsx`):

```typescript
import { Marketplace } from '@/routes/Marketplace'
import { AppDetail } from '@/routes/AppDetail'
import { MyApps } from '@/routes/MyApps'

// 添加路由
{
  path: '/marketplace',
  element: <Marketplace />
},
{
  path: '/marketplace/:slug',
  element: <AppDetail />
},
{
  path: '/my-apps',
  element: (
    <ProtectedRoute>
      <MyApps />
    </ProtectedRoute>
  )
}
```

**测试检查点**:
- [ ] 所有路由配置正确
- [ ] 页面跳转正常工作
- [ ] ProtectedRoute 正常保护需要登录的页面

---

## Phase 3 完成检查清单

- [ ] Marketplace Store 创建并测试通过
- [ ] AppCard 组件渲染正常
- [ ] 市场首页 UI 完成
- [ ] 应用详情页 UI 完成
- [ ] 我的应用页面 UI 完成
- [ ] 路由配置完成
- [ ] localStorage 模拟功能正常
- [ ] 所有 UI 交互测试通过

**预估时间**: 5-6天
**回滚方案**: 删除新增的组件和路由
**下一阶段**: Phase 4 - 连接 Supabase 后端

---

## Phase 4: Supabase 后端集成 (4-5天)

### 4.1 Marketplace Store - 真实实现

**前提条件**: Phase 1-3 测试通过，localStorage 版本工作正常

#### 更新 Marketplace Store (`src/store/marketplace.ts`)

**真实实现部分**:

```typescript
// ===== 真实 Supabase 实现 =====
async fetchApps() {
  set({ isLoading: true })

  try {
    const { data: apps, error } = await supabase
      .from('marketplace_apps')
      .select(`
        *,
        creator:user_profiles!creator_id (
          id,
          display_name,
          avatar_url
        )
      `)
      .eq('status', 'published')
      .order('is_featured', { ascending: false })
      .order('downloads_count', { ascending: false })

    if (error) throw error

    // Transform data
    const transformedApps: MarketplaceApp[] = apps.map((app) => ({
      id: app.id,
      creatorId: app.creator_id,
      creatorName: app.creator?.display_name || 'Unknown',
      name: app.name,
      slug: app.slug,
      description: app.description,
      shortDescription: app.short_description,
      category: app.category,
      tags: app.tags || [],
      webhookUrl: app.webhook_url,
      iconUrl: app.icon_url,
      coverImageUrl: app.cover_image_url,
      screenshots: app.screenshots || [],
      downloadsCount: app.downloads_count,
      activeUsersCount: app.active_users_count,
      ratingAverage: Number(app.rating_average),
      ratingCount: app.rating_count,
      status: app.status,
      isFeatured: app.is_featured,
      createdAt: app.created_at,
      updatedAt: app.updated_at,
    }))

    // Load user's installed apps
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: installed } = await supabase
        .from('user_installed_apps')
        .select('app_id')
        .eq('user_id', user.id)

      const installedIds = new Set(installed?.map((i) => i.app_id) || [])
      set({
        apps: transformedApps,
        installedAppIds: installedIds,
        isLoading: false,
      })
    } else {
      set({
        apps: transformedApps,
        isLoading: false,
      })
    }
  } catch (error) {
    console.error('Failed to fetch apps:', error)
    set({ isLoading: false })
  }
},

async installApp(appId) {
  set({ isLoading: true })

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      set({ isLoading: false })
      return false
    }

    // Check if already installed
    const { data: existing } = await supabase
      .from('user_installed_apps')
      .select('id')
      .eq('user_id', user.id)
      .eq('app_id', appId)
      .single()

    if (existing) {
      set({ isLoading: false })
      return false
    }

    // Insert installation record
    const { error } = await supabase
      .from('user_installed_apps')
      .insert({
        user_id: user.id,
        app_id: appId,
      })

    if (error) throw error

    // Update local state
    const { installedAppIds } = get()
    const newInstalledIds = new Set(installedAppIds)
    newInstalledIds.add(appId)

    set({
      installedAppIds: newInstalledIds,
      isLoading: false,
    })

    // Refresh apps to get updated download count
    await get().fetchApps()

    return true
  } catch (error) {
    console.error('Failed to install app:', error)
    set({ isLoading: false })
    return false
  }
},

async uninstallApp(appId) {
  set({ isLoading: true })

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      set({ isLoading: false })
      return false
    }

    // Delete installation record
    const { error } = await supabase
      .from('user_installed_apps')
      .delete()
      .eq('user_id', user.id)
      .eq('app_id', appId)

    if (error) throw error

    // Update local state
    const { installedAppIds } = get()
    const newInstalledIds = new Set(installedAppIds)
    newInstalledIds.delete(appId)

    set({
      installedAppIds: newInstalledIds,
      isLoading: false,
    })

    return true
  } catch (error) {
    console.error('Failed to uninstall app:', error)
    set({ isLoading: false })
    return false
  }
},

searchApps(query) {
  set({ searchQuery: query })
},

filterByCategory(category) {
  set({ selectedCategory: category })
},
```

**测试检查点**:
- [ ] fetchApps 从 Supabase 获取数据
- [ ] installApp 正确创建安装记录
- [ ] uninstallApp 正确删除安装记录
- [ ] 下载统计自动更新（通过触发器）
- [ ] 错误处理正确

---

### 4.2 更新前端组件 - 切换到真实实现

#### 更新 Marketplace.tsx

**替换 mock 方法调用为真实方法**:

```typescript
// 原来的
const { mockFetchApps, mockInstallApp, mockUninstallApp } = useMarketplaceStore()

// 改为
const { fetchApps, installApp, uninstallApp } = useMarketplaceStore()

// useEffect
useEffect(() => {
  fetchApps()  // 从 mockFetchApps 改为 fetchApps
}, [fetchApps])
```

#### 更新 AppDetail.tsx

**替换 mock 方法调用**:

```typescript
// 原来的
const { mockInstallApp, mockUninstallApp } = useMarketplaceStore()

// 改为
const { installApp, uninstallApp } = useMarketplaceStore()

// handleInstall 函数
const handleInstall = async () => {
  if (!user) {
    toast.error('Please login to install apps')
    navigate('/login')
    return
  }

  setInstalling(true)
  const success = await installApp(app.id)  // 从 mockInstallApp 改为 installApp
  setInstalling(false)

  if (success) {
    toast.success(`${app.name} installed successfully!`)
  } else {
    toast.error('Failed to install app')
  }
}

// handleUninstall 函数
const handleUninstall = async () => {
  setInstalling(true)
  const success = await uninstallApp(app.id)  // 从 mockUninstallApp 改为 uninstallApp
  setInstalling(false)

  if (success) {
    toast.success(`${app.name} uninstalled`)
  } else {
    toast.error('Failed to uninstall app')
  }
}
```

#### 更新 MyApps.tsx

**替换 mock 方法调用**:

```typescript
// 原来的
const { mockFetchApps, mockUninstallApp } = useMarketplaceStore()

// 改为
const { fetchApps, uninstallApp } = useMarketplaceStore()

// useEffect
useEffect(() => {
  fetchApps()  // 从 mockFetchApps 改为 fetchApps
}, [fetchApps])

// handleUninstall 函数
const handleUninstall = async (appId: string, appName: string) => {
  if (!confirm(`Are you sure you want to uninstall ${appName}?`)) {
    return
  }

  const success = await uninstallApp(appId)  // 从 mockUninstallApp 改为 uninstallApp
  if (success) {
    toast.success(`${appName} uninstalled`)
  } else {
    toast.error('Failed to uninstall app')
  }
}
```

**测试检查点**:
- [ ] 所有组件使用真实 Supabase 方法
- [ ] 市场首页正确显示数据库中的应用
- [ ] 安装/卸载功能正常工作
- [ ] 下载统计自动更新
- [ ] 错误提示正确显示

---

### 4.3 创建测试数据

#### 使用 Supabase MCP 创建测试应用

**任务**: 创建 3-5 个测试应用数据

```sql
-- 使用 Supabase MCP: execute_sql

-- 首先确保有测试用户（使用你注册的账号 ID）
-- 替换 'your-user-id' 为实际的用户 ID

-- 测试应用 1: Weather Assistant
INSERT INTO marketplace_apps (
  creator_id,
  name,
  slug,
  description,
  short_description,
  category,
  tags,
  webhook_url,
  icon_url,
  status,
  is_featured,
  published_at
) VALUES (
  'your-user-id',
  'Weather Assistant',
  'weather-assistant',
  'Get real-time weather information for any location using voice or text commands. This app connects to multiple weather APIs to provide accurate forecasts, current conditions, and weather alerts.',
  'Get weather info instantly with AI',
  'Utility',
  ARRAY['weather', 'ai', 'assistant', 'forecast'],
  'https://your-n8n-instance.com/webhook/weather',
  '☀️',
  'published',
  true,
  NOW()
);

-- 测试应用 2: Task Manager
INSERT INTO marketplace_apps (
  creator_id,
  name,
  slug,
  description,
  short_description,
  category,
  tags,
  webhook_url,
  icon_url,
  status,
  is_featured,
  published_at
) VALUES (
  'your-user-id',
  'Task Manager',
  'task-manager',
  'Manage your tasks and to-do lists with AI-powered reminders and smart scheduling. Never miss a deadline with intelligent notifications and priority management.',
  'AI-powered task management',
  'Productivity',
  ARRAY['tasks', 'productivity', 'reminders', 'ai'],
  'https://your-n8n-instance.com/webhook/tasks',
  '✅',
  'published',
  true,
  NOW()
);

-- 测试应用 3: Code Snippet Manager
INSERT INTO marketplace_apps (
  creator_id,
  name,
  slug,
  description,
  short_description,
  category,
  tags,
  webhook_url,
  icon_url,
  status,
  is_featured,
  published_at
) VALUES (
  'your-user-id',
  'Code Snippet Manager',
  'code-snippet-manager',
  'Save and organize your code snippets with AI-powered search and tagging. Supports multiple programming languages with syntax highlighting.',
  'Organize code snippets efficiently',
  'Developer Tools',
  ARRAY['code', 'snippets', 'developer', 'programming'],
  'https://your-n8n-instance.com/webhook/code',
  '💻',
  'published',
  false,
  NOW()
);

-- 测试应用 4: Meeting Notes AI
INSERT INTO marketplace_apps (
  creator_id,
  name,
  slug,
  description,
  short_description,
  category,
  tags,
  webhook_url,
  icon_url,
  status,
  is_featured,
  published_at
) VALUES (
  'your-user-id',
  'Meeting Notes AI',
  'meeting-notes-ai',
  'Automatically capture and organize meeting notes with AI-powered summarization. Get action items and key points extracted from your meetings.',
  'AI meeting notes and summaries',
  'Productivity',
  ARRAY['meetings', 'notes', 'ai', 'productivity'],
  'https://your-n8n-instance.com/webhook/meetings',
  '📝',
  'published',
  false,
  NOW()
);

-- 测试应用 5: Email Assistant
INSERT INTO marketplace_apps (
  creator_id,
  name,
  slug,
  description,
  short_description,
  category,
  tags,
  webhook_url,
  icon_url,
  status,
  is_featured,
  published_at
) VALUES (
  'your-user-id',
  'Email Assistant',
  'email-assistant',
  'Smart email management with AI-powered categorization, priority sorting, and quick replies. Save time on email with intelligent automation.',
  'Smart email management with AI',
  'Productivity',
  ARRAY['email', 'automation', 'ai', 'productivity'],
  'https://your-n8n-instance.com/webhook/email',
  '📧',
  'published',
  false,
  NOW()
);
```

**测试检查点**:
- [ ] 测试数据成功插入
- [ ] 应用在市场首页显示
- [ ] Featured apps 正确显示
- [ ] 分类过滤正常工作

---

### 4.4 测试完整流程

#### 端到端测试清单

**用户注册和登录**:
- [ ] 新用户可以注册账号
- [ ] 用户可以登录
- [ ] 登录后跳转到首页
- [ ] Session 持久化正常

**浏览市场**:
- [ ] 市场首页显示所有应用
- [ ] Featured apps 单独显示
- [ ] 搜索功能正常
- [ ] 分类过滤正常
- [ ] 应用卡片点击跳转到详情页

**应用详情**:
- [ ] 详情页显示完整应用信息
- [ ] 评分和统计数据正确
- [ ] 安装按钮功能正常
- [ ] 卸载按钮功能正常
- [ ] Open App 按钮跳转正确

**我的应用**:
- [ ] 正确显示已安装应用列表
- [ ] Open 按钮正常工作
- [ ] Uninstall 按钮正常工作
- [ ] 空状态显示正常

**数据库验证**:
- [ ] 安装记录正确创建
- [ ] 下载统计自动更新
- [ ] 活跃用户统计正确
- [ ] RLS 策略正常工作

---

## Phase 4 完成检查清单

- [ ] Marketplace Store 真实实现完成
- [ ] 所有组件切换到 Supabase
- [ ] 测试数据创建成功
- [ ] 端到端测试通过
- [ ] 数据库触发器正常工作
- [ ] RLS 策略测试通过
- [ ] 错误处理正确
- [ ] 性能测试通过

**预估时间**: 4-5天
**回滚方案**: 切换回 localStorage mock 实现

---

## MVP 最终部署检查清单

### 功能完整性
- [ ] 用户注册/登录功能完整
- [ ] 应用市场浏览功能完整
- [ ] 应用安装/卸载功能完整
- [ ] 我的应用管理功能完整
- [ ] 所有页面导航正常

### 数据库
- [ ] 所有表创建成功
- [ ] RLS 策略全部生效
- [ ] 触发器正常工作
- [ ] 索引创建成功
- [ ] Storage buckets 配置完成

### 安全性
- [ ] RLS 策略防止未授权访问
- [ ] API Key 不会泄露
- [ ] 用户数据隔离正确
- [ ] SQL 注入防护
- [ ] XSS 防护

### 性能
- [ ] 页面加载时间 < 3秒
- [ ] API 响应时间 < 500ms
- [ ] 图片优化完成
- [ ] Bundle 大小优化

### 用户体验
- [ ] 加载状态显示
- [ ] 错误提示友好
- [ ] 成功提示清晰
- [ ] 空状态设计完整
- [ ] 响应式设计正常

### 测试
- [ ] 所有功能手动测试通过
- [ ] 边界情况测试通过
- [ ] 错误情况测试通过
- [ ] 跨浏览器测试通过

---

## MVP 总结

**开发周期**: 2-3 周
**核心功能**:
- ✅ 用户认证系统
- ✅ 应用市场浏览
- ✅ 应用安装管理
- ✅ Supabase 数据库集成

**下一阶段**:
- Creator Center (创作者中心)
- 应用发布流程
- 评价系统
- 高级搜索和过滤

**技术栈验证**:
- ✅ React 19 + TypeScript
- ✅ Supabase (数据库 + 认证)
- ✅ Zustand (状态管理)
- ✅ Vercel (部署)
- ✅ N8N (Workflow 集成)
