# 长期开发规划 (Long-Term Development Plan - 2-6个月)

**前提条件**: MVP 和中期规划完成，平台稳定运行，有一定用户基础

**目标**: 建立企业级应用市场平台，实现商业化，支持大规模用户

**开发原则**:
- ✅ 企业级架构：支持 10K+ 用户，高可用性
- ✅ 商业化：实现变现模式，支持付费应用
- ✅ 质量优先：完善审核机制，保证应用质量
- ✅ 国际化：支持多语言，服务全球用户
- ✅ 数据驱动：使用分析数据指导产品决策

---

## Phase 8: 变现系统 (Monetization System) (3-4周)

**目标**: 实现应用付费、订阅、内购等变现模式

### 8.1 数据库扩展 - 支付系统

#### 新增表: `app_pricing` (应用定价)

```sql
-- 使用 Supabase MCP: apply_migration

CREATE TABLE app_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES marketplace_apps(id) ON DELETE CASCADE NOT NULL,

  -- 定价模式
  pricing_model VARCHAR(20) NOT NULL CHECK (pricing_model IN ('free', 'paid', 'freemium', 'subscription')),

  -- 价格（美分）
  one_time_price INT, -- 一次性购买价格
  monthly_price INT, -- 月订阅价格
  yearly_price INT, -- 年订阅价格

  -- 免费试用
  has_free_trial BOOLEAN DEFAULT false,
  trial_days INT,

  -- 功能限制（Freemium）
  free_tier_limits JSONB,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 确保每个应用只有一个定价记录
  UNIQUE(app_id)
);

-- 创建索引
CREATE INDEX idx_app_pricing_app ON app_pricing(app_id);
CREATE INDEX idx_app_pricing_model ON app_pricing(pricing_model);

-- RLS 策略
ALTER TABLE app_pricing ENABLE ROW LEVEL SECURITY;

-- 所有人可以查看定价
CREATE POLICY "Pricing is viewable by everyone"
  ON app_pricing FOR SELECT
  USING (true);

-- 创作者可以设置定价
CREATE POLICY "Creators can manage pricing"
  ON app_pricing FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM marketplace_apps
      WHERE id = app_pricing.app_id AND creator_id = auth.uid()
    )
  );
```

---

#### 新增表: `user_purchases` (用户购买记录)

```sql
-- 使用 Supabase MCP: apply_migration

CREATE TABLE user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  app_id UUID REFERENCES marketplace_apps(id) ON DELETE CASCADE NOT NULL,

  -- 购买信息
  purchase_type VARCHAR(20) NOT NULL CHECK (purchase_type IN ('one_time', 'monthly', 'yearly')),
  amount INT NOT NULL, -- 美分
  currency VARCHAR(3) DEFAULT 'USD',

  -- 支付信息
  payment_provider VARCHAR(50) NOT NULL, -- 'stripe', 'paypal', etc.
  payment_id VARCHAR(255) NOT NULL, -- 支付平台的交易 ID
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),

  -- 订阅信息
  subscription_id VARCHAR(255), -- 订阅 ID（如果是订阅）
  subscription_status VARCHAR(20) CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'paused')),
  expires_at TIMESTAMP WITH TIME ZONE, -- 订阅到期时间
  auto_renew BOOLEAN DEFAULT true,

  -- 时间戳
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_user_purchases_user ON user_purchases(user_id);
CREATE INDEX idx_user_purchases_app ON user_purchases(app_id);
CREATE INDEX idx_user_purchases_status ON user_purchases(payment_status);
CREATE INDEX idx_user_purchases_subscription ON user_purchases(subscription_id) WHERE subscription_id IS NOT NULL;

-- RLS 策略
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的购买记录
CREATE POLICY "Users can view own purchases"
  ON user_purchases FOR SELECT
  USING (user_id = auth.uid());

-- 系统可以创建购买记录（通过 Service Role）
-- RLS 在 Service Role 下自动禁用
```

---

#### 新增表: `creator_earnings` (创作者收益)

```sql
-- 使用 Supabase MCP: apply_migration

CREATE TABLE creator_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  app_id UUID REFERENCES marketplace_apps(id) ON DELETE CASCADE NOT NULL,
  purchase_id UUID REFERENCES user_purchases(id) ON DELETE CASCADE NOT NULL,

  -- 收益信息
  gross_amount INT NOT NULL, -- 总金额（美分）
  platform_fee INT NOT NULL, -- 平台抽成（美分）
  net_amount INT NOT NULL, -- 净收益（美分）
  currency VARCHAR(3) DEFAULT 'USD',

  -- 提现状态
  payout_status VARCHAR(20) DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'paid', 'failed')),
  payout_id VARCHAR(255), -- 提现交易 ID
  paid_at TIMESTAMP WITH TIME ZONE,

  -- 时间戳
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_creator_earnings_creator ON creator_earnings(creator_id);
CREATE INDEX idx_creator_earnings_app ON creator_earnings(app_id);
CREATE INDEX idx_creator_earnings_payout_status ON creator_earnings(payout_status);
CREATE INDEX idx_creator_earnings_earned ON creator_earnings(earned_at DESC);

-- RLS 策略
ALTER TABLE creator_earnings ENABLE ROW LEVEL SECURITY;

-- 创作者只能查看自己的收益
CREATE POLICY "Creators can view own earnings"
  ON creator_earnings FOR SELECT
  USING (creator_id = auth.uid());
```

**测试检查点**:
- [ ] 所有支付相关表创建成功
- [ ] RLS 策略正常工作
- [ ] 索引创建成功

---

### 8.2 Stripe 集成

#### Stripe 配置

**安装 Stripe SDK**:
```bash
npm install @stripe/stripe-js stripe
```

**创建 Stripe 客户端** (`src/lib/stripe.ts`):

```typescript
import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}
```

**环境变量** (`.env.local`):
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx # 仅用于后端
```

---

#### Stripe Webhook 处理

**创建 Vercel Serverless Function** (`api/stripe-webhook.js`):

```javascript
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service Role Key for bypass RLS
)

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: 'Webhook Error' })
  }

  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object)
      break

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object)
      break

    case 'customer.subscription.deleted':
      await handleSubscriptionCancelled(event.data.object)
      break

    case 'invoice.paid':
      await handleInvoicePaid(event.data.object)
      break

    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object)
      break

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  res.json({ received: true })
}

async function handleCheckoutCompleted(session) {
  const { metadata, customer, amount_total, currency } = session

  // Create purchase record
  const { data: purchase, error: purchaseError } = await supabase
    .from('user_purchases')
    .insert({
      user_id: metadata.user_id,
      app_id: metadata.app_id,
      purchase_type: metadata.purchase_type,
      amount: amount_total,
      currency: currency.toUpperCase(),
      payment_provider: 'stripe',
      payment_id: session.id,
      payment_status: 'completed',
      subscription_id: session.subscription,
      purchased_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (purchaseError) {
    console.error('Failed to create purchase:', purchaseError)
    return
  }

  // Auto-install app for user
  await supabase
    .from('user_installed_apps')
    .insert({
      user_id: metadata.user_id,
      app_id: metadata.app_id,
    })
    .onConflict('user_id,app_id')
    .ignoreDuplicates()

  // Create earnings record for creator
  const platformFeePercent = 0.15 // 15% platform fee
  const grossAmount = amount_total
  const platformFee = Math.round(grossAmount * platformFeePercent)
  const netAmount = grossAmount - platformFee

  await supabase
    .from('creator_earnings')
    .insert({
      creator_id: metadata.creator_id,
      app_id: metadata.app_id,
      purchase_id: purchase.id,
      gross_amount: grossAmount,
      platform_fee: platformFee,
      net_amount: netAmount,
      currency: currency.toUpperCase(),
      earned_at: new Date().toISOString(),
    })
}

async function handleSubscriptionUpdate(subscription) {
  const { id, status, current_period_end, cancel_at_period_end } = subscription

  await supabase
    .from('user_purchases')
    .update({
      subscription_status: status,
      expires_at: new Date(current_period_end * 1000).toISOString(),
      auto_renew: !cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq('subscription_id', id)
}

async function handleSubscriptionCancelled(subscription) {
  await supabase
    .from('user_purchases')
    .update({
      subscription_status: 'cancelled',
      auto_renew: false,
      updated_at: new Date().toISOString(),
    })
    .eq('subscription_id', subscription.id)
}

async function handleInvoicePaid(invoice) {
  // Handle subscription renewal payment
  console.log('Invoice paid:', invoice.id)
}

async function handleInvoicePaymentFailed(invoice) {
  // Handle failed payment
  console.log('Invoice payment failed:', invoice.id)
}
```

**测试检查点**:
- [ ] Stripe webhook 配置成功
- [ ] checkout.session.completed 事件处理正常
- [ ] 订阅事件处理正常
- [ ] 购买记录创建成功
- [ ] 收益记录创建成功

---

### 8.3 支付 UI

#### 购买按钮组件 (`src/components/marketplace/PurchaseButton.tsx`)

```typescript
import { useState } from 'react'
import { ShoppingCart, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth'
import { getStripe } from '@/lib/stripe'

interface PurchaseButtonProps {
  appId: string
  appName: string
  price: number
  pricingModel: 'one_time' | 'monthly' | 'yearly'
  creatorId: string
}

export const PurchaseButton = ({
  appId,
  appName,
  price,
  pricingModel,
  creatorId,
}: PurchaseButtonProps) => {
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const handlePurchase = async () => {
    if (!user) {
      toast.error('Please login to purchase')
      return
    }

    setIsLoading(true)

    try {
      // Create Stripe Checkout Session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId,
          appName,
          price,
          pricingModel,
          userId: user.id,
          creatorId,
        }),
      })

      const { sessionId, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      // Redirect to Stripe Checkout
      const stripe = await getStripe()
      if (!stripe) {
        throw new Error('Failed to load Stripe')
      }

      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId })

      if (stripeError) {
        throw stripeError
      }
    } catch (error: any) {
      console.error('Purchase failed:', error)
      toast.error(error.message || 'Failed to start purchase')
    } finally {
      setIsLoading(false)
    }
  }

  const priceDisplay = (price / 100).toFixed(2)
  const buttonText = pricingModel === 'one_time'
    ? `Buy for $${priceDisplay}`
    : `Subscribe for $${priceDisplay}/${pricingModel === 'monthly' ? 'mo' : 'yr'}`

  return (
    <button
      onClick={handlePurchase}
      disabled={isLoading}
      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isLoading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <ShoppingCart size={16} />
          {buttonText}
        </>
      )}
    </button>
  )
}
```

---

#### 创建 Checkout Session API (`api/create-checkout-session.js`)

```javascript
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { appId, appName, price, pricingModel, userId, creatorId } = req.body

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: pricingModel === 'one_time' ? 'payment' : 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: appName,
              description: `Purchase ${appName} app`,
            },
            unit_amount: price,
            ...(pricingModel !== 'one_time' && {
              recurring: {
                interval: pricingModel === 'monthly' ? 'month' : 'year',
              },
            }),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_URL}/marketplace/${appId}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/marketplace/${appId}?cancelled=true`,
      metadata: {
        app_id: appId,
        user_id: userId,
        creator_id: creatorId,
        purchase_type: pricingModel,
      },
    })

    res.json({ sessionId: session.id })
  } catch (error) {
    console.error('Failed to create checkout session:', error)
    res.status(500).json({ error: error.message })
  }
}
```

**测试检查点**:
- [ ] 购买按钮正常显示
- [ ] Stripe Checkout 页面正确打开
- [ ] 支付成功后回调正常
- [ ] 购买记录创建成功
- [ ] 应用自动安装

---

## Phase 8 完成检查清单

- [ ] 支付系统数据库表创建成功
- [ ] Stripe 集成完成
- [ ] Webhook 处理正常
- [ ] 购买流程测试通过
- [ ] 订阅管理功能正常
- [ ] 收益计算正确
- [ ] 所有支付功能测试通过

**预估时间**: 3-4周
**下一阶段**: Phase 9 - 审核系统

---

## Phase 9: 审核和质量控制系统 (Review & Quality Control) (2-3周)

**目标**: 建立应用审核机制，保证应用质量和安全性

### 9.1 数据库扩展 - 审核系统

#### 新增表: `app_submissions` (应用提交审核)

```sql
-- 使用 Supabase MCP: apply_migration

CREATE TABLE app_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES marketplace_apps(id) ON DELETE CASCADE NOT NULL,
  version VARCHAR(20) NOT NULL,

  -- 提交信息
  submitted_by UUID REFERENCES user_profiles(id) NOT NULL,
  submission_type VARCHAR(20) NOT NULL CHECK (submission_type IN ('new', 'update', 'resubmit')),

  -- 审核状态
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'changes_requested')),

  -- 审核信息
  reviewer_id UUID REFERENCES user_profiles(id),
  review_notes TEXT,
  rejection_reason TEXT,

  -- 审核清单
  security_check BOOLEAN DEFAULT false,
  functionality_check BOOLEAN DEFAULT false,
  performance_check BOOLEAN DEFAULT false,
  content_check BOOLEAN DEFAULT false,

  -- 时间戳
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_app_submissions_app ON app_submissions(app_id);
CREATE INDEX idx_app_submissions_status ON app_submissions(status);
CREATE INDEX idx_app_submissions_submitted ON app_submissions(submitted_at DESC);
CREATE INDEX idx_app_submissions_reviewer ON app_submissions(reviewer_id);

-- RLS 策略
ALTER TABLE app_submissions ENABLE ROW LEVEL SECURITY;

-- 创作者可以查看自己的提交
CREATE POLICY "Creators can view own submissions"
  ON app_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM marketplace_apps
      WHERE id = app_submissions.app_id AND creator_id = auth.uid()
    )
  );

-- 审核员可以查看所有pending的提交
CREATE POLICY "Reviewers can view pending submissions"
  ON app_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_reviewer = true
    )
  );
```

---

#### 新增表: `quality_reports` (质量问题报告)

```sql
-- 使用 Supabase MCP: apply_migration

CREATE TABLE quality_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES marketplace_apps(id) ON DELETE CASCADE NOT NULL,

  -- 报告信息
  reported_by UUID REFERENCES user_profiles(id) NOT NULL,
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('security', 'bug', 'performance', 'inappropriate', 'spam', 'other')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  -- 详情
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  screenshots TEXT[], -- 截图 URLs

  -- 处理状态
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'wont_fix', 'duplicate')),
  assigned_to UUID REFERENCES user_profiles(id),
  resolution_notes TEXT,

  -- 时间戳
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_quality_reports_app ON quality_reports(app_id);
CREATE INDEX idx_quality_reports_status ON quality_reports(status);
CREATE INDEX idx_quality_reports_severity ON quality_reports(severity);
CREATE INDEX idx_quality_reports_type ON quality_reports(report_type);

-- RLS 策略
ALTER TABLE quality_reports ENABLE ROW LEVEL SECURITY;

-- 用户可以提交报告
CREATE POLICY "Users can create reports"
  ON quality_reports FOR INSERT
  WITH CHECK (reported_by = auth.uid());

-- 用户可以查看自己的报告
CREATE POLICY "Users can view own reports"
  ON quality_reports FOR SELECT
  USING (reported_by = auth.uid());

-- 审核员可以查看所有报告
CREATE POLICY "Reviewers can view all reports"
  ON quality_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_reviewer = true
    )
  );
```

---

#### 更新 user_profiles 表 - 添加审核员标志

```sql
-- 使用 Supabase MCP: apply_migration

ALTER TABLE user_profiles
ADD COLUMN is_reviewer BOOLEAN DEFAULT false,
ADD COLUMN is_admin BOOLEAN DEFAULT false;

CREATE INDEX idx_user_profiles_reviewer ON user_profiles(is_reviewer) WHERE is_reviewer = true;
CREATE INDEX idx_user_profiles_admin ON user_profiles(is_admin) WHERE is_admin = true;
```

**测试检查点**:
- [ ] 审核系统表创建成功
- [ ] RLS 策略正常工作
- [ ] 索引创建成功

---

### 9.2 审核流程

#### 提交审核 Store (`src/store/submission.ts`)

```typescript
import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface Submission {
  id: string
  appId: string
  appName: string
  version: string
  submissionType: 'new' | 'update' | 'resubmit'
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'changes_requested'
  reviewNotes: string | null
  rejectionReason: string | null
  submittedAt: string
  reviewedAt: string | null
}

interface SubmissionState {
  submissions: Submission[]
  isLoading: boolean

  // Creator actions
  submitForReview: (appId: string, version: string) => Promise<{ success: boolean; error?: string }>
  getMySubmissions: () => Promise<void>

  // Reviewer actions
  getPendingSubmissions: () => Promise<void>
  approveSubmission: (submissionId: string, notes: string) => Promise<{ success: boolean; error?: string }>
  rejectSubmission: (submissionId: string, reason: string) => Promise<{ success: boolean; error?: string }>
  requestChanges: (submissionId: string, notes: string) => Promise<{ success: boolean; error?: string }>
}

export const useSubmissionStore = create<SubmissionState>()((set, get) => ({
  submissions: [],
  isLoading: false,

  async submitForReview(appId, version) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Create submission
      const { error } = await supabase
        .from('app_submissions')
        .insert({
          app_id: appId,
          version,
          submitted_by: user.id,
          submission_type: 'new', // TODO: Detect if new or update
          status: 'pending',
        })

      if (error) throw error

      // Update app status to pending_review
      await supabase
        .from('marketplace_apps')
        .update({ status: 'pending_review' })
        .eq('id', appId)

      return { success: true }
    } catch (error: any) {
      console.error('Failed to submit for review:', error)
      return {
        success: false,
        error: error.message || 'Failed to submit for review'
      }
    }
  },

  async getMySubmissions() {
    set({ isLoading: true })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        set({ isLoading: false })
        return
      }

      const { data, error } = await supabase
        .from('app_submissions')
        .select(`
          *,
          app:marketplace_apps (name)
        `)
        .eq('submitted_by', user.id)
        .order('submitted_at', { ascending: false })

      if (error) throw error

      const transformedSubmissions: Submission[] = data.map((sub) => ({
        id: sub.id,
        appId: sub.app_id,
        appName: sub.app?.name || 'Unknown',
        version: sub.version,
        submissionType: sub.submission_type,
        status: sub.status,
        reviewNotes: sub.review_notes,
        rejectionReason: sub.rejection_reason,
        submittedAt: sub.submitted_at,
        reviewedAt: sub.reviewed_at,
      }))

      set({ submissions: transformedSubmissions, isLoading: false })
    } catch (error) {
      console.error('Failed to fetch submissions:', error)
      set({ isLoading: false })
    }
  },

  async getPendingSubmissions() {
    set({ isLoading: true })

    try {
      const { data, error } = await supabase
        .from('app_submissions')
        .select(`
          *,
          app:marketplace_apps (name)
        `)
        .in('status', ['pending', 'in_review'])
        .order('submitted_at', { ascending: true })

      if (error) throw error

      const transformedSubmissions: Submission[] = data.map((sub) => ({
        id: sub.id,
        appId: sub.app_id,
        appName: sub.app?.name || 'Unknown',
        version: sub.version,
        submissionType: sub.submission_type,
        status: sub.status,
        reviewNotes: sub.review_notes,
        rejectionReason: sub.rejection_reason,
        submittedAt: sub.submitted_at,
        reviewedAt: sub.reviewed_at,
      }))

      set({ submissions: transformedSubmissions, isLoading: false })
    } catch (error) {
      console.error('Failed to fetch pending submissions:', error)
      set({ isLoading: false })
    }
  },

  async approveSubmission(submissionId, notes) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Get submission
      const { data: submission } = await supabase
        .from('app_submissions')
        .select('app_id')
        .eq('id', submissionId)
        .single()

      if (!submission) {
        return { success: false, error: 'Submission not found' }
      }

      // Update submission
      const { error: submissionError } = await supabase
        .from('app_submissions')
        .update({
          status: 'approved',
          reviewer_id: user.id,
          review_notes: notes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', submissionId)

      if (submissionError) throw submissionError

      // Publish app
      const { error: appError } = await supabase
        .from('marketplace_apps')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
        })
        .eq('id', submission.app_id)

      if (appError) throw appError

      // Refresh submissions
      await get().getPendingSubmissions()

      return { success: true }
    } catch (error: any) {
      console.error('Failed to approve submission:', error)
      return {
        success: false,
        error: error.message || 'Failed to approve submission'
      }
    }
  },

  async rejectSubmission(submissionId, reason) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Get submission
      const { data: submission } = await supabase
        .from('app_submissions')
        .select('app_id')
        .eq('id', submissionId)
        .single()

      if (!submission) {
        return { success: false, error: 'Submission not found' }
      }

      // Update submission
      const { error: submissionError } = await supabase
        .from('app_submissions')
        .update({
          status: 'rejected',
          reviewer_id: user.id,
          rejection_reason: reason,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', submissionId)

      if (submissionError) throw submissionError

      // Update app status
      const { error: appError } = await supabase
        .from('marketplace_apps')
        .update({ status: 'draft' })
        .eq('id', submission.app_id)

      if (appError) throw appError

      // Refresh submissions
      await get().getPendingSubmissions()

      return { success: true }
    } catch (error: any) {
      console.error('Failed to reject submission:', error)
      return {
        success: false,
        error: error.message || 'Failed to reject submission'
      }
    }
  },

  async requestChanges(submissionId, notes) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Update submission
      const { error } = await supabase
        .from('app_submissions')
        .update({
          status: 'changes_requested',
          reviewer_id: user.id,
          review_notes: notes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', submissionId)

      if (error) throw error

      // Refresh submissions
      await get().getPendingSubmissions()

      return { success: true }
    } catch (error: any) {
      console.error('Failed to request changes:', error)
      return {
        success: false,
        error: error.message || 'Failed to request changes'
      }
    }
  },
}))
```

---

### 9.3 审核员界面

#### 审核队列页面 (`src/routes/ReviewQueue.tsx`)

```typescript
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useSubmissionStore } from '@/store/submission'
import { useAuthStore } from '@/store/auth'

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  in_review: { label: 'In Review', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
  changes_requested: { label: 'Changes Requested', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
}

export const ReviewQueue = () => {
  const { user } = useAuthStore()
  const { submissions, isLoading, getPendingSubmissions } = useSubmissionStore()

  useEffect(() => {
    getPendingSubmissions()
  }, [getPendingSubmissions])

  if (!user?.isReviewer) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-destructive" />
          <h2 className="mt-4 text-lg font-semibold">Access Denied</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You need reviewer permissions to access this page
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold">Review Queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'} pending review
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : submissions.length > 0 ? (
            <div className="space-y-4">
              {submissions.map((submission) => {
                const StatusIcon = statusConfig[submission.status].icon

                return (
                  <Link
                    key={submission.id}
                    to={`/review/${submission.id}`}
                    className="block rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{submission.appName}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Version {submission.version} • {submission.submissionType} submission
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusConfig[submission.status].color}`}>
                        <StatusIcon size={14} />
                        {statusConfig[submission.status].label}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-12 text-center">
              <CheckCircle size={48} className="mx-auto text-green-500" />
              <h3 className="mt-4 text-lg font-semibold">All Caught Up!</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                No submissions pending review
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

---

## Phase 9 完成检查清单

- [ ] 审核系统数据库表创建成功
- [ ] 审核流程 Store 创建完成
- [ ] 提交审核功能正常
- [ ] 审核员界面完成
- [ ] 批准/拒绝流程正常
- [ ] 质量报告系统完成
- [ ] 所有审核功能测试通过

**预估时间**: 2-3周
**下一阶段**: Phase 10 - 国际化和规模化

---

## Phase 10: 国际化和规模化 (Internationalization & Scale) (3-4周)

**目标**: 支持多语言，优化架构支持大规模用户

### 10.1 国际化 (i18n)

#### 安装 i18n 库

```bash
npm install react-i18next i18next i18next-browser-languagedetector
```

#### 配置 i18n (`src/i18n/config.ts`)

```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Translation files
import enTranslation from './locales/en.json'
import zhTranslation from './locales/zh.json'
import esTranslation from './locales/es.json'
import frTranslation from './locales/fr.json'
import jaTranslation from './locales/ja.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      zh: { translation: zhTranslation },
      es: { translation: esTranslation },
      fr: { translation: frTranslation },
      ja: { translation: jaTranslation },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
```

#### 翻译文件示例 (`src/i18n/locales/en.json`)

```json
{
  "common": {
    "login": "Login",
    "register": "Register",
    "logout": "Logout",
    "search": "Search",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "loading": "Loading..."
  },
  "marketplace": {
    "title": "App Marketplace",
    "subtitle": "Discover and install powerful AI-powered workflows",
    "featured": "Featured Apps",
    "allApps": "All Apps",
    "noApps": "No apps found",
    "install": "Install",
    "uninstall": "Uninstall",
    "open": "Open App"
  },
  "creator": {
    "title": "Creator Center",
    "createApp": "Create App",
    "editApp": "Edit App",
    "deleteApp": "Delete App",
    "publishApp": "Publish App",
    "myApps": "My Apps"
  }
}
```

#### 使用翻译

```typescript
import { useTranslation } from 'react-i18next'

export const Marketplace = () => {
  const { t } = useTranslation()

  return (
    <div>
      <h1>{t('marketplace.title')}</h1>
      <p>{t('marketplace.subtitle')}</p>
    </div>
  )
}
```

---

### 10.2 架构升级 - 迁移到专用后端

**目标**: 从 Vercel Serverless 迁移到专用 Node.js 后端

#### 新架构设计

```
┌─────────────────────────────────────────┐
│         Vercel (Frontend Only)          │
│  React + Vite + Static Assets           │
└─────────────────┬───────────────────────┘
                  │ API Calls
                  ↓
┌─────────────────────────────────────────┐
│      Backend API Server (Node.js)       │
│  Express + Socket.io + Bull Queue       │
│  Deployed on: Railway / Render / AWS    │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        ↓                   ↓
┌───────────────┐   ┌──────────────────┐
│   Supabase    │   │   Redis Cache    │
│   Database    │   │  + Bull Queues   │
└───────────────┘   └──────────────────┘
```

#### 后端 API Server 设置

**创建 Express Server** (`server/index.js`):

```javascript
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const app = express()
const PORT = process.env.PORT || 4000

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
app.use('/api/', limiter)

// Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Initialize services
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api/apps', require('./routes/apps'))
app.use('/api/reviews', require('./routes/reviews'))
app.use('/api/payments', require('./routes/payments'))
app.use('/api/submissions', require('./routes/submissions'))

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`)
})
```

---

### 10.3 性能优化 - CDN 和缓存

#### Cloudflare CDN 配置

```javascript
// Cloudflare Worker for edge caching
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const cache = caches.default
  const cacheKey = new Request(request.url, request)

  // Check cache
  let response = await cache.match(cacheKey)

  if (!response) {
    // Fetch from origin
    response = await fetch(request)

    // Cache for 5 minutes
    const headers = new Headers(response.headers)
    headers.set('Cache-Control', 'public, max-age=300')

    response = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers
    })

    // Store in cache
    event.waitUntil(cache.put(cacheKey, response.clone()))
  }

  return response
}
```

---

### 10.4 监控和告警

#### 集成 Sentry 错误监控

```bash
npm install @sentry/react @sentry/tracing
```

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [new BrowserTracing()],
  tracesSampleRate: 1.0,
  environment: import.meta.env.MODE,
})

export default Sentry
```

#### 性能监控

```typescript
// Track page load time
const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

console.log('Page load time:', navigationTiming.loadEventEnd - navigationTiming.fetchStart)

// Track API response time
async function trackApiCall(apiCall: () => Promise<any>) {
  const start = performance.now()
  try {
    const result = await apiCall()
    const duration = performance.now() - start

    // Send to analytics
    trackEvent('api_call', 'performance', `${duration.toFixed(0)}ms`)

    return result
  } catch (error) {
    const duration = performance.now() - start
    trackEvent('api_error', 'performance', `${duration.toFixed(0)}ms`)
    throw error
  }
}
```

---

## Phase 10 完成检查清单

- [ ] 国际化配置完成
- [ ] 至少支持 3 种语言
- [ ] 架构升级到专用后端
- [ ] CDN 配置完成
- [ ] 错误监控集成
- [ ] 性能监控实现
- [ ] 支持 10K+ 并发用户
- [ ] 99.9% uptime SLA

**预估时间**: 3-4周

---

## 长期规划总结

**开发周期**: 2-6 个月

**核心成就**:
- ✅ 完整的商业化系统（支付、订阅）
- ✅ 应用审核和质量控制
- ✅ 国际化支持（5+ 语言）
- ✅ 企业级架构（10K+ 用户）
- ✅ 完善的监控和告警

**关键指标**:
- 支持 10,000+ 活跃用户
- 99.9% 系统可用性
- < 2秒页面加载时间
- < 300ms API 响应时间
- 支持 5+ 语言
- 1000+ 应用

**商业指标**:
- 月活跃用户 (MAU): 10K+
- 付费转化率: 5-10%
- 平均每用户收入 (ARPU): $10-20/月
- 创作者收益分成: 85%
- 平台月收入: $15K-30K

**技术栈最终形态**:
- **前端**: React 19 + TypeScript + Vite (Vercel)
- **后端**: Node.js + Express (Railway/Render)
- **数据库**: Supabase (PostgreSQL)
- **缓存**: Redis + Cloudflare CDN
- **支付**: Stripe
- **监控**: Sentry + Custom Analytics
- **队列**: Bull + Redis
- **国际化**: i18next

**运维要求**:
- 自动化部署 (CI/CD)
- 数据库备份策略
- 灾难恢复计划
- 安全审计
- 性能基准测试
- 用户数据隐私合规

**团队规模**:
- 3-5 名全职开发人员
- 1 名产品经理
- 1 名 UI/UX 设计师
- 兼职审核员 (按需)

**下一步方向**:
- AI 推荐系统
- 应用协作功能
- 企业级权限管理
- API Marketplace
- 移动应用 (React Native)
- 白标解决方案

---

**注意**: 此规划为长期愿景，应根据实际业务发展、用户反馈、市场变化进行调整。重点是保持灵活性和可持续增长。
