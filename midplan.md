# 中期开发规划 (Mid-Term Development Plan - 1-2个月)

**前提条件**: MVP 完成并上线运行，基础功能稳定

**目标**: 建立完整的创作者生态系统，增强用户体验，优化性能

**开发原则**:
- ✅ MVP优先：确保 MVP 功能稳定后再开发新功能
- ✅ 用户反馈驱动：根据 MVP 用户反馈调整开发优先级
- ✅ 性能为王：每个新功能都要考虑性能影响
- ✅ 渐进增强：新功能不影响现有功能稳定性
- ✅ 数据驱动：使用 Supabase Analytics 跟踪关键指标

---

## Phase 5: 创作者中心 (Creator Center) (2-3周)

**目标**: 允许用户创建和发布自己的应用到市场

### 5.1 数据库扩展

#### 新增表: `app_versions` (应用版本管理)

```sql
-- 使用 Supabase MCP: apply_migration

CREATE TABLE app_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES marketplace_apps(id) ON DELETE CASCADE NOT NULL,

  -- 版本信息
  version VARCHAR(20) NOT NULL, -- 例如 "1.0.0"
  release_notes TEXT,
  changelog TEXT,

  -- N8N 集成
  workflow_id VARCHAR(255),
  webhook_url TEXT NOT NULL,

  -- 状态
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_latest BOOLEAN DEFAULT false,

  -- 统计
  downloads_count INT DEFAULT 0,
  error_count INT DEFAULT 0,

  -- 时间戳
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 确保同一应用的版本号唯一
  UNIQUE(app_id, version)
);

-- 创建索引
CREATE INDEX idx_app_versions_app ON app_versions(app_id);
CREATE INDEX idx_app_versions_status ON app_versions(status);
CREATE INDEX idx_app_versions_latest ON app_versions(app_id, is_latest) WHERE is_latest = true;

-- RLS 策略
ALTER TABLE app_versions ENABLE ROW LEVEL SECURITY;

-- 所有人可以查看已发布的版本
CREATE POLICY "Published versions are viewable by everyone"
  ON app_versions FOR SELECT
  USING (
    status = 'published' OR
    EXISTS (
      SELECT 1 FROM marketplace_apps
      WHERE id = app_versions.app_id AND creator_id = auth.uid()
    )
  );

-- 创作者可以创建版本
CREATE POLICY "Creators can create versions"
  ON app_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM marketplace_apps
      WHERE id = app_versions.app_id AND creator_id = auth.uid()
    )
  );

-- 创作者可以更新自己的版本
CREATE POLICY "Creators can update own versions"
  ON app_versions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM marketplace_apps
      WHERE id = app_versions.app_id AND creator_id = auth.uid()
    )
  );
```

**测试检查点**:
- [ ] app_versions 表创建成功
- [ ] RLS 策略正常工作
- [ ] 版本号唯一约束正常
- [ ] 索引创建成功

---

#### 触发器: 自动更新 is_latest 标志

```sql
-- 使用 Supabase MCP: apply_migration

-- 当新版本发布时，自动设置为最新版本
CREATE OR REPLACE FUNCTION update_latest_version()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果新版本被发布，将其设置为最新版本
  IF NEW.status = 'published' AND NEW.is_latest = false THEN
    -- 取消该应用其他版本的 is_latest 标志
    UPDATE app_versions
    SET is_latest = false
    WHERE app_id = NEW.app_id AND id != NEW.id;

    -- 设置新版本为最新
    NEW.is_latest = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_latest_version
BEFORE UPDATE ON app_versions
FOR EACH ROW EXECUTE FUNCTION update_latest_version();
```

**测试检查点**:
- [ ] 触发器创建成功
- [ ] is_latest 自动更新正常

---

### 5.2 Creator Store (创作者状态管理)

**创建 Creator Store** (`src/store/creator.ts`):

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

export interface CreatorApp {
  id: string
  name: string
  slug: string
  description: string
  shortDescription: string
  category: string
  tags: string[]
  webhookUrl: string
  iconUrl: string | null
  status: 'draft' | 'pending_review' | 'published' | 'suspended' | 'archived'
  downloadsCount: number
  activeUsersCount: number
  ratingAverage: number
  ratingCount: number
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

export interface AppFormData {
  name: string
  slug: string
  description: string
  shortDescription: string
  category: string
  tags: string[]
  webhookUrl: string
  iconUrl?: string
}

interface CreatorState {
  myApps: CreatorApp[]
  isLoading: boolean

  // CRUD operations
  fetchMyApps: () => Promise<void>
  createApp: (data: AppFormData) => Promise<{ success: boolean; appId?: string; error?: string }>
  updateApp: (appId: string, data: Partial<AppFormData>) => Promise<{ success: boolean; error?: string }>
  deleteApp: (appId: string) => Promise<{ success: boolean; error?: string }>
  publishApp: (appId: string) => Promise<{ success: boolean; error?: string }>

  // Helper
  getAppById: (appId: string) => CreatorApp | undefined
}

export const useCreatorStore = create<CreatorState>()(
  persist(
    (set, get) => ({
      myApps: [],
      isLoading: false,

      async fetchMyApps() {
        set({ isLoading: true })

        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            set({ isLoading: false })
            return
          }

          const { data: apps, error } = await supabase
            .from('marketplace_apps')
            .select('*')
            .eq('creator_id', user.id)
            .order('created_at', { ascending: false })

          if (error) throw error

          const transformedApps: CreatorApp[] = apps.map((app) => ({
            id: app.id,
            name: app.name,
            slug: app.slug,
            description: app.description,
            shortDescription: app.short_description,
            category: app.category,
            tags: app.tags || [],
            webhookUrl: app.webhook_url,
            iconUrl: app.icon_url,
            status: app.status,
            downloadsCount: app.downloads_count,
            activeUsersCount: app.active_users_count,
            ratingAverage: Number(app.rating_average),
            ratingCount: app.rating_count,
            createdAt: app.created_at,
            updatedAt: app.updated_at,
            publishedAt: app.published_at,
          }))

          set({ myApps: transformedApps, isLoading: false })
        } catch (error) {
          console.error('Failed to fetch creator apps:', error)
          set({ isLoading: false })
        }
      },

      async createApp(data) {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            return { success: false, error: 'User not authenticated' }
          }

          // Update user to creator if not already
          await supabase
            .from('user_profiles')
            .update({ is_creator: true })
            .eq('id', user.id)

          // Create app
          const { data: newApp, error } = await supabase
            .from('marketplace_apps')
            .insert({
              creator_id: user.id,
              name: data.name,
              slug: data.slug,
              description: data.description,
              short_description: data.shortDescription,
              category: data.category,
              tags: data.tags,
              webhook_url: data.webhookUrl,
              icon_url: data.iconUrl,
              status: 'draft',
            })
            .select()
            .single()

          if (error) throw error

          // Refresh apps list
          await get().fetchMyApps()

          return { success: true, appId: newApp.id }
        } catch (error: any) {
          console.error('Failed to create app:', error)
          return {
            success: false,
            error: error.message || 'Failed to create app'
          }
        }
      },

      async updateApp(appId, data) {
        try {
          const { error } = await supabase
            .from('marketplace_apps')
            .update({
              name: data.name,
              slug: data.slug,
              description: data.description,
              short_description: data.shortDescription,
              category: data.category,
              tags: data.tags,
              webhook_url: data.webhookUrl,
              icon_url: data.iconUrl,
              updated_at: new Date().toISOString(),
            })
            .eq('id', appId)

          if (error) throw error

          // Refresh apps list
          await get().fetchMyApps()

          return { success: true }
        } catch (error: any) {
          console.error('Failed to update app:', error)
          return {
            success: false,
            error: error.message || 'Failed to update app'
          }
        }
      },

      async deleteApp(appId) {
        try {
          const { error } = await supabase
            .from('marketplace_apps')
            .delete()
            .eq('id', appId)

          if (error) throw error

          // Refresh apps list
          await get().fetchMyApps()

          return { success: true }
        } catch (error: any) {
          console.error('Failed to delete app:', error)
          return {
            success: false,
            error: error.message || 'Failed to delete app'
          }
        }
      },

      async publishApp(appId) {
        try {
          const { error } = await supabase
            .from('marketplace_apps')
            .update({
              status: 'published',
              published_at: new Date().toISOString(),
            })
            .eq('id', appId)

          if (error) throw error

          // Refresh apps list
          await get().fetchMyApps()

          return { success: true }
        } catch (error: any) {
          console.error('Failed to publish app:', error)
          return {
            success: false,
            error: error.message || 'Failed to publish app'
          }
        }
      },

      getAppById(appId) {
        return get().myApps.find((app) => app.id === appId)
      },
    }),
    {
      name: 'creator-storage',
      partialize: (state) => ({}), // 不持久化，每次重新获取
    }
  )
)
```

**测试检查点**:
- [ ] Creator Store 创建成功
- [ ] fetchMyApps 正常工作
- [ ] createApp 正常工作
- [ ] updateApp 正常工作
- [ ] deleteApp 正常工作
- [ ] publishApp 正常工作

---

### 5.3 创作者中心 UI

#### 创作者中心首页 (`src/routes/CreatorCenter.tsx`)

```typescript
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus,
  Package,
  Eye,
  Edit,
  Trash2,
  BarChart,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCreatorStore } from '@/store/creator'
import { useAuthStore } from '@/store/auth'

const statusConfig = {
  draft: {
    label: 'Draft',
    color: 'text-gray-600 bg-gray-100',
    icon: Clock,
  },
  pending_review: {
    label: 'Pending Review',
    color: 'text-yellow-600 bg-yellow-100',
    icon: Clock,
  },
  published: {
    label: 'Published',
    color: 'text-green-600 bg-green-100',
    icon: CheckCircle,
  },
  suspended: {
    label: 'Suspended',
    color: 'text-red-600 bg-red-100',
    icon: AlertCircle,
  },
  archived: {
    label: 'Archived',
    color: 'text-gray-600 bg-gray-100',
    icon: Package,
  },
}

export const CreatorCenter = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { myApps, isLoading, fetchMyApps, deleteApp, publishApp } = useCreatorStore()

  useEffect(() => {
    fetchMyApps()
  }, [fetchMyApps])

  const handleDelete = async (appId: string, appName: string) => {
    if (!confirm(`Are you sure you want to delete "${appName}"? This action cannot be undone.`)) {
      return
    }

    const { success, error } = await deleteApp(appId)
    if (success) {
      toast.success('App deleted successfully')
    } else {
      toast.error(error || 'Failed to delete app')
    }
  }

  const handlePublish = async (appId: string, appName: string) => {
    if (!confirm(`Are you sure you want to publish "${appName}"?`)) {
      return
    }

    const { success, error } = await publishApp(appId)
    if (success) {
      toast.success('App published successfully!')
    } else {
      toast.error(error || 'Failed to publish app')
    }
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center px-4">
        <div className="text-center">
          <Package size={48} className="mx-auto text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Login Required</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please login to access Creator Center
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Creator Center</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {myApps.length} {myApps.length === 1 ? 'app' : 'apps'} created
              </p>
            </div>
            <Link
              to="/creator/new"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              <Plus size={16} />
              Create App
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : myApps.length > 0 ? (
            <div className="space-y-4">
              {myApps.map((app) => {
                const StatusIcon = statusConfig[app.status].icon

                return (
                  <div
                    key={app.id}
                    className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50"
                  >
                    <div className="flex items-start gap-4">
                      {/* App Icon */}
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-4xl">
                        {app.iconUrl || '📱'}
                      </div>

                      {/* App Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-foreground line-clamp-1">
                              {app.name}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                              {app.shortDescription || app.description}
                            </p>
                          </div>

                          {/* Status Badge */}
                          <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusConfig[app.status].color}`}>
                            <StatusIcon size={14} />
                            {statusConfig[app.status].label}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="mt-4 flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Eye size={16} />
                            <span>{app.downloadsCount.toLocaleString()} downloads</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <BarChart size={16} />
                            <span>{app.ratingAverage.toFixed(1)} rating</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Package size={16} />
                            <span>{app.activeUsersCount.toLocaleString()} active users</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link
                            to={`/marketplace/${app.slug}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition hover:bg-accent"
                          >
                            <Eye size={14} />
                            View
                          </Link>
                          <Link
                            to={`/creator/edit/${app.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition hover:bg-accent"
                          >
                            <Edit size={14} />
                            Edit
                          </Link>

                          {app.status === 'draft' && (
                            <button
                              onClick={() => handlePublish(app.id, app.name)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                            >
                              <Upload size={14} />
                              Publish
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(app.id, app.name)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-destructive px-3 py-1.5 text-sm font-medium text-destructive transition hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-12 text-center">
              <Package size={48} className="mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">No Apps Yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first app to start sharing with the community
              </p>
              <Link
                to="/creator/new"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                <Plus size={16} />
                Create Your First App
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
- [ ] 创作者中心首页渲染正常
- [ ] 应用列表显示正常
- [ ] 状态徽章显示正确
- [ ] 统计数据显示正确
- [ ] 所有操作按钮正常工作

---

#### 创建/编辑应用表单 (`src/routes/CreatorAppForm.tsx`)

```typescript
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Loader2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useCreatorStore, type AppFormData } from '@/store/creator'

const categories = [
  'Utility',
  'Productivity',
  'Developer Tools',
  'AI',
  'Entertainment',
  'Business',
  'Education',
  'Health',
  'Finance',
]

export const CreatorAppForm = () => {
  const navigate = useNavigate()
  const { appId } = useParams<{ appId?: string }>()
  const { createApp, updateApp, getAppById } = useCreatorStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<AppFormData>({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    category: 'Utility',
    tags: [],
    webhookUrl: '',
    iconUrl: '',
  })
  const [tagInput, setTagInput] = useState('')

  const isEditing = Boolean(appId)

  // Load existing app data if editing
  useEffect(() => {
    if (appId) {
      const app = getAppById(appId)
      if (app) {
        setFormData({
          name: app.name,
          slug: app.slug,
          description: app.description,
          shortDescription: app.shortDescription,
          category: app.category,
          tags: app.tags,
          webhookUrl: app.webhookUrl,
          iconUrl: app.iconUrl || '',
        })
      }
    }
  }, [appId, getAppById])

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
    }))
  }

  const handleAddTag = () => {
    if (!tagInput.trim()) return
    if (formData.tags.includes(tagInput.trim())) {
      toast.error('Tag already exists')
      return
    }

    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, tagInput.trim()],
    }))
    setTagInput('')
  }

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      toast.error('Please enter app name')
      return
    }

    if (!formData.slug.trim()) {
      toast.error('Please enter app slug')
      return
    }

    if (!formData.description.trim()) {
      toast.error('Please enter app description')
      return
    }

    if (!formData.webhookUrl.trim()) {
      toast.error('Please enter webhook URL')
      return
    }

    setIsSubmitting(true)

    try {
      if (isEditing && appId) {
        const { success, error } = await updateApp(appId, formData)
        if (success) {
          toast.success('App updated successfully!')
          navigate('/creator')
        } else {
          toast.error(error || 'Failed to update app')
        }
      } else {
        const { success, error, appId: newAppId } = await createApp(formData)
        if (success) {
          toast.success('App created successfully!')
          navigate('/creator')
        } else {
          toast.error(error || 'Failed to create app')
        }
      }
    } catch (error) {
      toast.error('An error occurred')
      console.error(error)
    } finally {
      setIsSubmitting(false)
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
          <h1 className="text-lg font-bold text-foreground">
            {isEditing ? 'Edit App' : 'Create New App'}
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-semibold">Basic Information</h2>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  App Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="My Awesome App"
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2.5 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Slug <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="my-awesome-app"
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2.5 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  URL: /marketplace/{formData.slug || 'your-app-slug'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Short Description <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="One-line description (max 100 characters)"
                  maxLength={100}
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2.5 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.shortDescription.length}/100
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of your app..."
                  rows={6}
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2.5 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Category <span className="text-destructive">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2.5 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {/* Technical Info */}
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-semibold">Technical Configuration</h2>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Webhook URL <span className="text-destructive">*</span>
                </label>
                <input
                  type="url"
                  value={formData.webhookUrl}
                  onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                  placeholder="https://your-n8n-instance.com/webhook/your-app"
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2.5 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The N8N webhook URL that will receive user interactions
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Icon (Emoji)</label>
                <input
                  type="text"
                  value={formData.iconUrl || ''}
                  onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                  placeholder="📱"
                  maxLength={2}
                  className="w-20 rounded-lg border border-border bg-transparent px-3 py-2.5 text-center text-3xl transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground">
                  Single emoji to represent your app
                </p>
              </div>
            </section>

            {/* Tags */}
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-semibold">Tags</h2>

              <div className="space-y-2">
                <label className="text-sm font-medium">Add Tags</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                    placeholder="ai, productivity, automation..."
                    className="flex-1 rounded-lg border border-border bg-transparent px-3 py-2.5 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="rounded-lg border border-border px-4 py-2.5 transition hover:bg-accent"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="rounded-full hover:text-destructive transition"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Submit */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium transition hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Save size={16} />
                    {isEditing ? 'Update App' : 'Create App'}
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
```

**测试检查点**:
- [ ] 创建应用表单渲染正常
- [ ] 表单验证正常工作
- [ ] Slug 自动生成正常
- [ ] 标签添加/删除正常
- [ ] 创建应用功能正常
- [ ] 编辑应用功能正常

---

### 5.4 路由配置更新

```typescript
import { CreatorCenter } from '@/routes/CreatorCenter'
import { CreatorAppForm } from '@/routes/CreatorAppForm'

// 添加路由
{
  path: '/creator',
  element: (
    <ProtectedRoute>
      <CreatorCenter />
    </ProtectedRoute>
  )
},
{
  path: '/creator/new',
  element: (
    <ProtectedRoute>
      <CreatorAppForm />
    </ProtectedRoute>
  )
},
{
  path: '/creator/edit/:appId',
  element: (
    <ProtectedRoute>
      <CreatorAppForm />
    </ProtectedRoute>
  )
}
```

---

## Phase 5 完成检查清单

- [ ] app_versions 表创建成功
- [ ] 触发器正常工作
- [ ] Creator Store 创建并测试通过
- [ ] 创作者中心首页 UI 完成
- [ ] 创建/编辑应用表单完成
- [ ] 路由配置完成
- [ ] 所有 CRUD 操作测试通过
- [ ] 发布流程正常工作

**预估时间**: 2-3周
**回滚方案**: 删除 app_versions 表和创作者相关组件
**下一阶段**: Phase 6 - 高级功能

---

## Phase 6: 高级功能 (Advanced Features) (2-3周)

### 6.1 评价系统增强

#### 评价组件 (`src/components/marketplace/ReviewSection.tsx`)

```typescript
import { useState, useEffect } from 'react'
import { Star, ThumbsUp, Flag } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'

interface Review {
  id: string
  userId: string
  userName: string
  userAvatar: string | null
  rating: number
  title: string | null
  comment: string | null
  helpfulCount: number
  createdAt: string
  isVerifiedPurchase: boolean
}

interface ReviewSectionProps {
  appId: string
}

export const ReviewSection = ({ appId }: ReviewSectionProps) => {
  const { user } = useAuthStore()
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Review form state
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [showForm, setShowForm] = useState(false)

  // Load reviews
  useEffect(() => {
    loadReviews()
  }, [appId])

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('app_reviews')
        .select(`
          *,
          user:user_profiles!user_id (
            display_name,
            avatar_url
          )
        `)
        .eq('app_id', appId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })

      if (error) throw error

      const transformedReviews: Review[] = data.map((review) => ({
        id: review.id,
        userId: review.user_id,
        userName: review.user?.display_name || 'Anonymous',
        userAvatar: review.user?.avatar_url,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        helpfulCount: review.helpful_count,
        createdAt: review.created_at,
        isVerifiedPurchase: review.is_verified_purchase,
      }))

      setReviews(transformedReviews)
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to load reviews:', error)
      setIsLoading(false)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('Please login to leave a review')
      return
    }

    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    setIsSubmitting(true)

    try {
      // Check if user has installed the app
      const { data: installation } = await supabase
        .from('user_installed_apps')
        .select('id')
        .eq('user_id', user.id)
        .eq('app_id', appId)
        .single()

      // Insert review
      const { error } = await supabase
        .from('app_reviews')
        .insert({
          app_id: appId,
          user_id: user.id,
          rating,
          title: title.trim() || null,
          comment: comment.trim() || null,
          is_verified_purchase: Boolean(installation),
        })

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already reviewed this app')
        } else {
          throw error
        }
        return
      }

      toast.success('Review submitted successfully!')

      // Reset form
      setRating(0)
      setTitle('')
      setComment('')
      setShowForm(false)

      // Reload reviews
      await loadReviews()
    } catch (error) {
      console.error('Failed to submit review:', error)
      toast.error('Failed to submit review')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Reviews ({reviews.length})</h3>
        {user && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmitReview} className="mb-6 space-y-4 rounded-lg border border-border bg-muted/30 p-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={24}
                    className={
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sum up your review"
              maxLength={200}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Comment (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this app..."
              rows={4}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setRating(0)
                setTitle('')
                setComment('')
              }}
              className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-border pb-4 last:border-0">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                  {review.userAvatar ? (
                    <img
                      src={review.userAvatar}
                      alt={review.userName}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    review.userName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{review.userName}</span>
                    {review.isVerifiedPurchase && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={
                            star <= review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground'
                          }
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.title && (
                    <h4 className="mt-2 font-medium text-sm">{review.title}</h4>
                  )}
                  {review.comment && (
                    <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                      {review.comment}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-4 text-xs">
                    <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition">
                      <ThumbsUp size={14} />
                      Helpful ({review.helpfulCount})
                    </button>
                    <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition">
                      <Flag size={14} />
                      Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No reviews yet. Be the first to review!
        </div>
      )}
    </section>
  )
}
```

**测试检查点**:
- [ ] 评价列表正确显示
- [ ] 评价表单正常工作
- [ ] 评分功能正常
- [ ] Verified Purchase 徽章显示正常
- [ ] 评价提交成功
- [ ] 平均评分自动更新

---

### 6.2 高级搜索和过滤

#### 增强的搜索功能

**更新 Marketplace Store** 添加高级搜索:

```typescript
// 添加到 useMarketplaceStore
interface MarketplaceState {
  // ... existing fields
  sortBy: 'downloads' | 'rating' | 'latest'
  priceFilter: 'all' | 'free' | 'paid'

  setSortBy: (sortBy: MarketplaceState['sortBy']) => void
  setPriceFilter: (priceFilter: MarketplaceState['priceFilter']) => void
}

// Implementation
setSortBy(sortBy) {
  set({ sortBy })
},

setPriceFilter(priceFilter) {
  set({ priceFilter })
},
```

**更新 Marketplace.tsx** 添加排序和过滤:

```typescript
// 添加排序和过滤 UI
<div className="flex items-center gap-2">
  <select
    value={sortBy}
    onChange={(e) => setSortBy(e.target.value as any)}
    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
  >
    <option value="downloads">Most Downloaded</option>
    <option value="rating">Highest Rated</option>
    <option value="latest">Latest</option>
  </select>
</div>

// 应用排序
const sortedApps = [...filteredApps].sort((a, b) => {
  switch (sortBy) {
    case 'downloads':
      return b.downloadsCount - a.downloadsCount
    case 'rating':
      return b.ratingAverage - a.ratingAverage
    case 'latest':
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    default:
      return 0
  }
})
```

---

### 6.3 应用分析和统计

#### 创建分析页面 (`src/routes/CreatorAnalytics.tsx`)

```typescript
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, TrendingUp, Users, Download, Star, Calendar } from 'lucide-react'
import { useCreatorStore } from '@/store/creator'
import { supabase } from '@/lib/supabase'

interface Analytics {
  totalDownloads: number
  activeUsers: number
  averageRating: number
  totalReviews: number
  downloadsTrend: number
  usersTrend: number
}

export const CreatorAnalytics = () => {
  const navigate = useNavigate()
  const { appId } = useParams<{ appId: string }>()
  const { getAppById } = useCreatorStore()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const app = appId ? getAppById(appId) : null

  useEffect(() => {
    if (appId) {
      loadAnalytics()
    }
  }, [appId])

  const loadAnalytics = async () => {
    try {
      // Load current stats
      const { data: app, error } = await supabase
        .from('marketplace_apps')
        .select('downloads_count, active_users_count, rating_average, rating_count')
        .eq('id', appId)
        .single()

      if (error) throw error

      // TODO: Calculate trends (需要历史数据表)
      const analyticsData: Analytics = {
        totalDownloads: app.downloads_count,
        activeUsers: app.active_users_count,
        averageRating: Number(app.rating_average),
        totalReviews: app.rating_count,
        downloadsTrend: 0,
        usersTrend: 0,
      }

      setAnalytics(analyticsData)
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to load analytics:', error)
      setIsLoading(false)
    }
  }

  if (!app) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div>App not found</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex h-14 items-center px-4 gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-9 h-9 rounded-lg transition-all hover:bg-secondary"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold">{app.name}</h1>
            <p className="text-xs text-muted-foreground">Analytics</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : analytics ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Downloads */}
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Downloads</p>
                    <p className="mt-2 text-3xl font-bold">{analytics.totalDownloads.toLocaleString()}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Download size={24} />
                  </div>
                </div>
              </div>

              {/* Active Users */}
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                    <p className="mt-2 text-3xl font-bold">{analytics.activeUsers.toLocaleString()}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                    <Users size={24} />
                  </div>
                </div>
              </div>

              {/* Average Rating */}
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Average Rating</p>
                    <p className="mt-2 text-3xl font-bold">{analytics.averageRating.toFixed(1)}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-600">
                    <Star size={24} />
                  </div>
                </div>
              </div>

              {/* Total Reviews */}
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Reviews</p>
                    <p className="mt-2 text-3xl font-bold">{analytics.totalReviews.toLocaleString()}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
                    <Calendar size={24} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground">No analytics data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

---

## Phase 6 完成检查清单

- [ ] 评价系统增强完成
- [ ] 评价组件正常工作
- [ ] 高级搜索和过滤完成
- [ ] 排序功能正常
- [ ] 分析页面创建完成
- [ ] 统计数据正确显示
- [ ] 所有功能测试通过

**预估时间**: 2-3周
**下一阶段**: Phase 7 - 性能优化

---

## Phase 7: 性能优化 (Performance Optimization) (1-2周)

### 7.1 数据库优化

#### 添加缓存层

**创建 Redis 缓存配置** (可选，使用 Vercel KV):

```typescript
// src/lib/cache.ts
import { kv } from '@vercel/kv'

const CACHE_TTL = 60 * 5 // 5 minutes

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL
): Promise<T> {
  // Try cache first
  const cached = await kv.get<T>(key)
  if (cached) {
    return cached
  }

  // Fetch fresh data
  const data = await fetcher()

  // Store in cache
  await kv.set(key, data, { ex: ttl })

  return data
}

export async function invalidateCache(pattern: string) {
  // Invalidate all keys matching pattern
  const keys = await kv.keys(pattern)
  if (keys.length > 0) {
    await kv.del(...keys)
  }
}
```

**使用缓存优化 Marketplace Store**:

```typescript
import { getCached, invalidateCache } from '@/lib/cache'

async fetchApps() {
  set({ isLoading: true })

  try {
    const apps = await getCached('marketplace:apps:published', async () => {
      const { data, error } = await supabase
        .from('marketplace_apps')
        .select(`
          *,
          creator:user_profiles!creator_id (id, display_name, avatar_url)
        `)
        .eq('status', 'published')
        .order('is_featured', { ascending: false })
        .order('downloads_count', { ascending: false })

      if (error) throw error
      return data
    })

    // Transform and set apps
    // ...
  } catch (error) {
    console.error('Failed to fetch apps:', error)
    set({ isLoading: false })
  }
}
```

---

### 7.2 前端优化

#### 代码分割和懒加载

```typescript
// src/main.tsx
import { lazy, Suspense } from 'react'

// Lazy load routes
const Marketplace = lazy(() => import('@/routes/Marketplace'))
const AppDetail = lazy(() => import('@/routes/AppDetail'))
const CreatorCenter = lazy(() => import('@/routes/CreatorCenter'))

// Loading fallback
const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
)

// Wrap routes with Suspense
{
  path: '/marketplace',
  element: (
    <Suspense fallback={<LoadingFallback />}>
      <Marketplace />
    </Suspense>
  )
}
```

#### 图片优化

```typescript
// src/components/OptimizedImage.tsx
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  fallback?: string
}

export const OptimizedImage = ({ src, alt, className, fallback = '🖼️' }: OptimizedImageProps) => {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (error || !src) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <span className="text-4xl">{fallback}</span>
      </div>
    )
  }

  return (
    <>
      {!loaded && (
        <div className={`animate-pulse bg-muted ${className}`} />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${loaded ? 'block' : 'hidden'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        loading="lazy"
      />
    </>
  )
}
```

---

### 7.3 API 优化

#### 批量查询优化

```typescript
// 使用 Supabase 批量查询
async function getAppsWithCreators(appIds: string[]) {
  const { data, error } = await supabase
    .from('marketplace_apps')
    .select(`
      *,
      creator:user_profiles!creator_id (id, display_name, avatar_url),
      reviews:app_reviews (rating)
    `)
    .in('id', appIds)

  return data
}
```

---

### 7.4 监控和分析

#### 添加性能监控

```typescript
// src/lib/analytics.ts
export function trackPageView(page: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: page,
    })
  }
}

export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Usage
trackEvent('app_install', 'marketplace', appName)
trackEvent('app_publish', 'creator', appName)
```

---

## Phase 7 完成检查清单

- [ ] 数据库查询优化完成
- [ ] 缓存层实现（如果需要）
- [ ] 代码分割和懒加载完成
- [ ] 图片优化完成
- [ ] API 批量查询优化
- [ ] 性能监控实现
- [ ] 页面加载时间 < 2秒
- [ ] Bundle 大小优化

**预估时间**: 1-2周

---

## 中期规划总结

**开发周期**: 1-2 个月

**核心成就**:
- ✅ 完整的创作者生态系统
- ✅ 评价和反馈系统
- ✅ 高级搜索和过滤
- ✅ 应用分析和统计
- ✅ 性能优化完成

**关键指标**:
- 页面加载时间 < 2秒
- API 响应时间 < 300ms
- 支持 100+ 应用
- 支持 1000+ 用户

**下一阶段**:
- 支付和变现系统
- 审核和质量控制
- 高级分析和报表
- 企业级功能

**技术债务管理**:
- 定期代码审查
- 性能基准测试
- 安全审计
- 文档更新

---

**注意**: 此规划基于 MVP 完成后的持续开发，应根据实际用户反馈和业务需求调整优先级。
