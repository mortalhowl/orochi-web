// src/lib/slug.ts

/**
 * Vietnamese character map for slug generation
 */
const vietnameseMap: Record<string, string> = {
  à: 'a', á: 'a', ả: 'a', ã: 'a', ạ: 'a',
  ă: 'a', ằ: 'a', ắ: 'a', ẳ: 'a', ẵ: 'a', ặ: 'a',
  â: 'a', ầ: 'a', ấ: 'a', ẩ: 'a', ẫ: 'a', ậ: 'a',
  đ: 'd',
  è: 'e', é: 'e', ẻ: 'e', ẽ: 'e', ẹ: 'e',
  ê: 'e', ề: 'e', ế: 'e', ể: 'e', ễ: 'e', ệ: 'e',
  ì: 'i', í: 'i', ỉ: 'i', ĩ: 'i', ị: 'i',
  ò: 'o', ó: 'o', ỏ: 'o', õ: 'o', ọ: 'o',
  ô: 'o', ồ: 'o', ố: 'o', ổ: 'o', ỗ: 'o', ộ: 'o',
  ơ: 'o', ờ: 'o', ớ: 'o', ở: 'o', ỡ: 'o', ợ: 'o',
  ù: 'u', ú: 'u', ủ: 'u', ũ: 'u', ụ: 'u',
  ư: 'u', ừ: 'u', ứ: 'u', ử: 'u', ữ: 'u', ự: 'u',
  ỳ: 'y', ý: 'y', ỷ: 'y', ỹ: 'y', ỵ: 'y',
  // Uppercase
  À: 'A', Á: 'A', Ả: 'A', Ã: 'A', Ạ: 'A',
  Ă: 'A', Ằ: 'A', Ắ: 'A', Ẳ: 'A', Ẵ: 'A', Ặ: 'A',
  Â: 'A', Ầ: 'A', Ấ: 'A', Ẩ: 'A', Ẫ: 'A', Ậ: 'A',
  Đ: 'D',
  È: 'E', É: 'E', Ẻ: 'E', Ẽ: 'E', Ẹ: 'E',
  Ê: 'E', Ề: 'E', Ế: 'E', Ể: 'E', Ễ: 'E', Ệ: 'E',
  Ì: 'I', Í: 'I', Ỉ: 'I', Ĩ: 'I', Ị: 'I',
  Ò: 'O', Ó: 'O', Ỏ: 'O', Õ: 'O', Ọ: 'O',
  Ô: 'O', Ồ: 'O', Ố: 'O', Ổ: 'O', Ỗ: 'O', Ộ: 'O',
  Ơ: 'O', Ờ: 'O', Ớ: 'O', Ở: 'O', Ỡ: 'O', Ợ: 'O',
  Ù: 'U', Ú: 'U', Ủ: 'U', Ũ: 'U', Ụ: 'U',
  Ư: 'U', Ừ: 'U', Ứ: 'U', Ử: 'U', Ữ: 'U', Ự: 'U',
  Ỳ: 'Y', Ý: 'Y', Ỷ: 'Y', Ỹ: 'Y', Ỵ: 'Y',
}

/**
 * Convert Vietnamese string to Latin
 */
function vietnameseToLatin(str: string): string {
  return str
    .split('')
    .map((char) => vietnameseMap[char] || char)
    .join('')
}

/**
 * Generate URL-friendly slug from string
 * @param str - Input string (can contain Vietnamese characters)
 * @param options - Configuration options
 * @returns URL-friendly slug
 */
export function generateSlug(
  str: string,
  options: {
    lowercase?: boolean
    separator?: string
    maxLength?: number
  } = {}
): string {
  const {
    lowercase = true,
    separator = '-',
    maxLength = 200,
  } = options

  let slug = str.trim()

  // Convert Vietnamese to Latin
  slug = vietnameseToLatin(slug)

  // Convert to lowercase if needed
  if (lowercase) {
    slug = slug.toLowerCase()
  }

  // Replace spaces and special characters with separator
  slug = slug
    .replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/[\s_]+/g, separator) // Replace spaces and underscores with separator
    .replace(new RegExp(`${separator}+`, 'g'), separator) // Replace multiple separators with single
    .replace(new RegExp(`^${separator}|${separator}$`, 'g'), '') // Remove leading/trailing separator

  // Truncate to max length
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength)
    // Remove trailing separator if truncation created one
    slug = slug.replace(new RegExp(`${separator}$`), '')
  }

  return slug
}

/**
 * Generate unique slug by appending number if needed
 * @param baseSlug - Base slug to start with
 * @param existingSlugs - Array of existing slugs to check against
 * @returns Unique slug
 */
export function generateUniqueSlug(
  baseSlug: string,
  existingSlugs: string[]
): string {
  let slug = baseSlug
  let counter = 1

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

/**
 * Validate slug format
 * @param slug - Slug to validate
 * @returns True if valid, false otherwise
 */
export function isValidSlug(slug: string): boolean {
  // Only lowercase letters, numbers, and hyphens
  // Cannot start or end with hyphen
  // Cannot have consecutive hyphens
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 200
}

/**
 * Sanitize slug input (for user-edited slugs)
 * @param slug - User input slug
 * @returns Sanitized slug
 */
export function sanitizeSlug(slug: string): string {
  return generateSlug(slug, { lowercase: true })
}

// ============================================
// SLUG SUGGESTIONS
// ============================================

/**
 * Generate slug suggestions from title
 * @param title - Event title
 * @param options - Options for variations
 * @returns Array of slug suggestions
 */
export function generateSlugSuggestions(
  title: string,
  options: {
    includeYear?: boolean
    includeMonth?: boolean
    maxSuggestions?: number
  } = {}
): string[] {
  const { includeYear = true, includeMonth = false, maxSuggestions = 5 } = options

  const suggestions: string[] = []
  const baseSlug = generateSlug(title)

  // Base suggestion
  suggestions.push(baseSlug)

  // With current year
  if (includeYear) {
    const year = new Date().getFullYear()
    suggestions.push(`${baseSlug}-${year}`)
  }

  // With current month and year
  if (includeMonth) {
    const date = new Date()
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    suggestions.push(`${baseSlug}-${month}-${year}`)
  }

  // Shortened versions (if base is long)
  if (baseSlug.length > 30) {
    const words = baseSlug.split('-')
    if (words.length > 3) {
      // Take first 3 words
      const shortSlug = words.slice(0, 3).join('-')
      suggestions.push(shortSlug)

      // First 3 words + year
      if (includeYear) {
        suggestions.push(`${shortSlug}-${new Date().getFullYear()}`)
      }
    }
  }

  // Return unique suggestions, limited to maxSuggestions
  return [...new Set(suggestions)].slice(0, maxSuggestions)
}

// ============================================
// EXAMPLES & TESTS
// ============================================

// Example usage:
// generateSlug('Workshop Next.js 2024') → 'workshop-nextjs-2024'
// generateSlug('Hội thảo AI tại Việt Nam') → 'hoi-thao-ai-tai-viet-nam'
// generateSlug('Summer Music Festival 🎵') → 'summer-music-festival'
// isValidSlug('workshop-nextjs-2024') → true
// isValidSlug('Workshop_NextJS') → false (uppercase, underscore)