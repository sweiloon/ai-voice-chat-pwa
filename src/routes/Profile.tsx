import { User, Settings, Bell, Shield, HelpCircle, LogOut } from 'lucide-react'

/**
 * Profile Route - User profile and account management (MVP Widget)
 *
 * Placeholder for future features:
 * - Account information
 * - Preferences
 * - Notifications
 * - Privacy & Security
 * - Help & Support
 */
export const Profile = () => {
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="flex h-14 md:h-16 items-center px-4 md:px-6 max-w-7xl mx-auto">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-lg bg-primary/10 text-primary">
                <User size={16} className="md:w-[18px] md:h-[18px]" />
              </div>
              <h1 className="text-base md:text-lg font-bold text-foreground">
                Profile
              </h1>
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground ml-10 md:ml-11 hidden sm:block">
              Manage your account and preferences
            </p>
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-secondary/5 pt-[56px] md:pt-[64px] pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          {/* Profile Header */}
          <div className="flex flex-col items-center gap-4 py-8 md:py-12 text-center">
            <div className="rounded-full border-2 border-primary/30 p-8 md:p-10 bg-gradient-to-br from-primary/5 to-transparent">
              <User size={48} className="md:w-16 md:h-16 text-primary" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Welcome Back
              </h2>
              <p className="text-sm md:text-base text-muted-foreground">
                Your profile features are coming soon
              </p>
            </div>
          </div>

          {/* Feature Preview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 max-w-4xl mx-auto">
            <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 md:p-6 hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 text-primary mb-3">
                <Settings size={20} className="md:w-6 md:h-6" />
              </div>
              <h3 className="font-semibold text-sm md:text-base mb-2">Account Settings</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Manage your personal information and account details
              </p>
            </div>

            <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 md:p-6 hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 text-primary mb-3">
                <Bell size={20} className="md:w-6 md:h-6" />
              </div>
              <h3 className="font-semibold text-sm md:text-base mb-2">Notifications</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Control how and when you receive notifications
              </p>
            </div>

            <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 md:p-6 hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 text-primary mb-3">
                <Shield size={20} className="md:w-6 md:h-6" />
              </div>
              <h3 className="font-semibold text-sm md:text-base mb-2">Privacy & Security</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Manage your privacy settings and security preferences
              </p>
            </div>

            <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 md:p-6 hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 text-primary mb-3">
                <HelpCircle size={20} className="md:w-6 md:h-6" />
              </div>
              <h3 className="font-semibold text-sm md:text-base mb-2">Help & Support</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Get help, view documentation, and contact support
              </p>
            </div>

            <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 md:p-6 hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg bg-destructive/10 text-destructive mb-3">
                <LogOut size={20} className="md:w-6 md:h-6" />
              </div>
              <h3 className="font-semibold text-sm md:text-base mb-2">Sign Out</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Securely sign out of your account
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
