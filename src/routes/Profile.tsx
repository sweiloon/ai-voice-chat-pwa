import { User, Mail, Shield, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { ScrollArea } from '@/components/ui/ScrollArea'

export const Profile = () => {
  const { user, logout } = useAuthStore()

  return (
    <div className="flex h-full flex-col bg-secondary/30">
      {/* Header */}
      <header className="flex items-center px-6 h-16 bg-background border-b sticky top-0 z-10">
        <h1 className="text-xl font-bold">Profile</h1>
      </header>

      <ScrollArea className="flex-1">
        <div className="max-w-2xl mx-auto p-6 space-y-8">
          
          {/* Profile Card */}
          <div className="bg-card border rounded-xl p-6 flex flex-col items-center text-center space-y-4 shadow-sm">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={user?.avatarUrl || undefined} />
              <AvatarFallback className="text-2xl">{user?.displayName?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{user?.displayName || 'Guest User'}</h2>
              <p className="text-muted-foreground">{user?.email || 'Not signed in'}</p>
            </div>
            <Button variant="outline" className="w-full max-w-xs">
              Edit Profile
            </Button>
          </div>

          {/* Account Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">Account Details</h3>
            <div className="bg-card border rounded-xl overflow-hidden divide-y">
              <div className="p-4 flex items-center gap-4">
                <User className="text-muted-foreground" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium">Display Name</p>
                  <p className="text-xs text-muted-foreground">{user?.displayName || '-'}</p>
                </div>
              </div>
              <div className="p-4 flex items-center gap-4">
                <Mail className="text-muted-foreground" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium">Email Address</p>
                  <p className="text-xs text-muted-foreground">{user?.email || '-'}</p>
                </div>
              </div>
              <div className="p-4 flex items-center gap-4">
                <Shield className="text-muted-foreground" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium">Account Type</p>
                  <p className="text-xs text-muted-foreground">{user?.isCreator ? 'Creator' : 'Standard User'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-8">
            <Button 
              variant="destructive" 
              className="w-full" 
              onClick={() => logout()}
            >
              <LogOut className="mr-2" size={16} />
              Sign Out
            </Button>
          </div>

        </div>
      </ScrollArea>
    </div>
  )
}
