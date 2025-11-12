import { Store, TrendingUp, Clock, Star } from 'lucide-react'

/**
 * Marketplace Route - Workflow Marketplace (Coming Soon)
 *
 * Placeholder for future N8N workflow marketplace features
 * Will feature: Browse workflows, Install templates, Share workflows
 */
export const Marketplace = () => {
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="flex h-14 md:h-16 items-center px-4 md:px-6 max-w-7xl mx-auto">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-lg bg-primary/10 text-primary">
                <Store size={16} className="md:w-[18px] md:h-[18px]" />
              </div>
              <h1 className="text-base md:text-lg font-bold text-foreground">
                Workflow Marketplace
              </h1>
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground ml-10 md:ml-11 hidden sm:block">
              Discover and share N8N workflows
            </p>
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-secondary/5 pt-[56px] md:pt-[64px] pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          {/* Coming Soon Section */}
          <div className="flex flex-col items-center justify-center gap-6 py-12 md:py-20 text-center">
            <div className="rounded-full border-2 border-dashed border-primary/30 p-12 md:p-16 bg-gradient-to-br from-primary/5 to-transparent">
              <Store size={48} className="md:w-16 md:h-16 text-primary" />
            </div>

            <div className="space-y-3 max-w-md">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Coming Soon
              </h2>
              <p className="text-sm md:text-base text-muted-foreground">
                The Workflow Marketplace will allow you to discover, share, and install N8N workflows from the community.
              </p>
            </div>

            {/* Feature Preview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 w-full max-w-3xl">
              <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 md:p-6">
                <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 text-primary mb-3">
                  <TrendingUp size={20} className="md:w-6 md:h-6" />
                </div>
                <h3 className="font-semibold text-sm md:text-base mb-2">Browse Workflows</h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Explore popular and trending workflows from the community
                </p>
              </div>

              <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 md:p-6">
                <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 text-primary mb-3">
                  <Clock size={20} className="md:w-6 md:h-6" />
                </div>
                <h3 className="font-semibold text-sm md:text-base mb-2">Quick Install</h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  One-click install workflows directly to your N8N instance
                </p>
              </div>

              <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 md:p-6">
                <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 text-primary mb-3">
                  <Star size={20} className="md:w-6 md:h-6" />
                </div>
                <h3 className="font-semibold text-sm md:text-base mb-2">Share & Rate</h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Share your workflows and discover the best rated ones
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
