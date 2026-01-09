import { useState } from 'react'
import { Store, Search, Download, Star, Filter } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ScrollArea } from '@/components/ui/ScrollArea'

interface AppItem {
  id: string
  name: string
  description: string
  icon: string
  color: string
  author: string
  installs: number
  rating: number
  isInstalled?: boolean
}

const mockApps: AppItem[] = [
  {
    id: '1',
    name: 'Research Assistant',
    description: 'Deep web search and summarization agent powered by Perplexity.',
    icon: '🔍',
    color: 'from-blue-500 to-cyan-500',
    author: 'AI Labs',
    installs: 1250,
    rating: 4.8,
    isInstalled: true
  },
  {
    id: '2',
    name: 'Code Reviewer',
    description: 'Automated code analysis and improvement suggestions via GitHub.',
    icon: '💻',
    color: 'from-purple-500 to-pink-500',
    author: 'DevTools',
    installs: 890,
    rating: 4.9
  },
  {
    id: '3',
    name: 'Voice Translator',
    description: 'Real-time speech translation for 50+ languages.',
    icon: '🌐',
    color: 'from-green-500 to-emerald-500',
    author: 'Polyglot',
    installs: 3400,
    rating: 4.7
  },
  {
    id: '4',
    name: 'Creative Writer',
    description: 'Story generation and content brainstorming partner.',
    icon: '✍️',
    color: 'from-orange-500 to-red-500',
    author: 'Muse',
    installs: 560,
    rating: 4.6
  },
  {
    id: '5',
    name: 'Data Analyst',
    description: 'Visualize CSV data and generate insights instantly.',
    icon: '📊',
    color: 'from-indigo-500 to-violet-500',
    author: 'DataWiz',
    installs: 1100,
    rating: 4.8
  }
]

export const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredApps = mockApps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-16 border-b border-white/5 sticky top-0 bg-background/80 backdrop-blur-xl z-10">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold">Marketplace</h1>
        </div>
        <Button variant="outline" size="sm" className="gap-2 border-white/10 hover:bg-white/5">
          <Download size={16} />
          My Apps
        </Button>
      </header>

      {/* Search & Filter */}
      <div className="p-6 border-b border-white/5 bg-white/5">
        <div className="max-w-4xl mx-auto flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search workflows & agents..." 
              className="pl-10 bg-background/50 border-white/10 focus:border-primary/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2 border-white/10 bg-background/50">
            <Filter size={16} />
            Filters
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApps.map((app) => (
              <div 
                key={app.id}
                className="group relative bg-card/50 border border-white/5 rounded-xl p-5 hover:border-primary/30 hover:shadow-glow-blue transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center text-2xl shadow-lg`}>
                    {app.icon}
                  </div>
                  {app.isInstalled ? (
                    <span className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium border border-primary/20">
                      Installed
                    </span>
                  ) : (
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-white/10">
                      <Download size={16} />
                    </Button>
                  )}
                </div>

                <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{app.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                  {app.description}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-white/5">
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-yellow-500 fill-yellow-500" />
                    <span className="font-medium text-foreground">{app.rating}</span>
                    <span>({app.installs})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>by {app.author}</span>
                  </div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
