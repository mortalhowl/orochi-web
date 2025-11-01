// src/components/avatar-with-rank.tsx
"use client"

import { User } from '@supabase/supabase-js'

type Rank = {
  name: string
  display_name: string
  color: string
  level: number
}

type Profile = {
  rank: Rank | null
}

type AvatarWithRankProps = {
  user: User
  profile?: Profile
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showBadge?: boolean
}

export function AvatarWithRank({ 
  user, 
  profile, 
  size = 'md',
  showBadge = false 
}: AvatarWithRankProps) {
  const rank = profile?.rank

  // Size mappings
  const sizeMap = {
    sm: {
      container: 'w-8 h-8',
      border: 'border-2',
      text: 'text-xs',
      badge: 'w-3 h-3 border',
    },
    md: {
      container: 'w-10 h-10',
      border: 'border-2',
      text: 'text-sm',
      badge: 'w-4 h-4 border-2',
    },
    lg: {
      container: 'w-16 h-16',
      border: 'border-[3px]',
      text: 'text-lg',
      badge: 'w-5 h-5 border-2',
    },
    xl: {
      container: 'w-24 h-24',
      border: 'border-4',
      text: 'text-2xl',
      badge: 'w-7 h-7 border-2',
    },
  }

  const sizes = sizeMap[size]
  const rankColor = rank?.color || '#9CA3AF' // Default gray

  // Gradient border cho các rank cao
  const getBorderStyle = () => {
    if (!rank) return { borderColor: '#9CA3AF' }
    
    const level = rank.level
    
    // Diamond - Rainbow gradient border
    if (level >= 5) {
      return {
        background: `linear-gradient(white, white) padding-box,
                     linear-gradient(135deg, #B9F2FF, #E5E4E2, #FFD700, #B9F2FF) border-box`,
        border: '0',
      }
    }
    
    // Platinum - Silver shine
    if (level === 4) {
      return {
        background: `linear-gradient(white, white) padding-box,
                     linear-gradient(135deg, #E5E4E2, #C0C0C0, #E5E4E2) border-box`,
        border: '0',
      }
    }
    
    // Gold - Gold gradient
    if (level === 3) {
      return {
        background: `linear-gradient(white, white) padding-box,
                     linear-gradient(135deg, #FFD700, #FFA500, #FFD700) border-box`,
        border: '0',
      }
    }
    
    // Silver & Bronze - Solid color
    return { borderColor: rankColor }
  }

  const borderStyle = getBorderStyle()

  return (
    <div className="relative inline-block">
      {/* Avatar container */}
      <div
        className={`${sizes.container} ${sizes.border} rounded-full overflow-hidden bg-background transition-all hover:scale-105`}
        style={borderStyle}
      >
        {user.user_metadata.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt={user.user_metadata.full_name || user.email || 'User'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center font-bold text-white"
            style={{ backgroundColor: rankColor }}
          >
            <span className={sizes.text}>
              {(user.user_metadata.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Rank badge (optional) */}
      {showBadge && rank && (
        <div 
          className={`absolute -bottom-1 -right-1 ${sizes.badge} rounded-full border-background flex items-center justify-center text-white text-xs font-bold shadow-lg`}
          style={{ backgroundColor: rankColor }}
          title={rank.display_name}
        >
          {rank.level}
        </div>
      )}
    </div>
  )
}

// Variant: Avatar với rank name
export function AvatarWithRankLabel({ 
  user, 
  profile,
  size = 'md',
  layout = 'horizontal' // 'horizontal' | 'vertical'
}: AvatarWithRankProps & { layout?: 'horizontal' | 'vertical' }) {
  const rank = profile?.rank

  if (layout === 'vertical') {
    return (
      <div className="flex flex-col items-center gap-2">
        <AvatarWithRank user={user} profile={profile} size={size} showBadge />
        {rank && (
          <div className="text-center">
            <div 
              className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block"
              style={{ 
                backgroundColor: `${rank.color}20`,
                color: rank.color,
              }}
            >
              {rank.display_name}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <AvatarWithRank user={user} profile={profile} size={size} showBadge />
      <div>
        <p className="font-medium text-sm">
          {user.user_metadata.full_name || user.email}
        </p>
        {rank && (
          <div 
            className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block"
            style={{ 
              backgroundColor: `${rank.color}20`,
              color: rank.color,
            }}
          >
            {rank.display_name}
          </div>
        )}
      </div>
    </div>
  )
}