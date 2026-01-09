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

  // localStorage mock methods (for testing)
  mockLogin: (email: string, password: string) => Promise<boolean>
  mockRegister: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,

      async mockLogin(email, password) {
        set({ isLoading: true })
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Get users from localStorage
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

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        const usersJson = localStorage.getItem('mock_users')
        const users = usersJson ? JSON.parse(usersJson) : []

        if (users.some((u: any) => u.email === email)) {
          set({ isLoading: false })
          return false
        }

        const newUser = {
          id: `mock-${Date.now()}`,
          email,
          password,
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

      logout() {
        set({ user: null })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
)
