import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

/**
 * 클라이언트 사이드에서 이벤트 관리 권한이 있는지 확인
 * @param userId 사용자 ID
 * @param eventId 이벤트 ID (선택사항)
 * @returns 권한 여부
 */
export async function hasEventManagementPermission(userId: string, eventId?: string): Promise<boolean> {
  try {
    const supabase = createClientComponentClient()
    
    // 1. 사용자 역할 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (profileError) {
      console.error('프로필 조회 실패:', profileError)
      return false
    }
    
    // admin, event_manager 역할은 모든 이벤트 관리 가능
    if (profile?.role === 'admin' || profile?.role === 'event_manager') {
      return true
    }
    
    // 2. 특정 이벤트의 경우 작성자인지 확인
    if (eventId) {
      const { data: event, error: eventError } = await supabase
        .from('multis')
        .select('author_id')
        .eq('id', eventId)
        .single()
      
      if (eventError) {
        console.error('이벤트 조회 실패:', eventError)
        return false
      }
      
      // 작성자는 자신의 이벤트 관리 가능
      return event?.author_id === userId
    }
    
    return false
  } catch (error) {
    console.error('권한 확인 오류:', error)
    return false
  }
}

/**
 * 사용자 역할 확인 (클라이언트 사이드)
 * @param userId 사용자 ID
 * @returns 사용자 역할
 */
export async function getUserRole(userId: string): Promise<string | null> {
  try {
    const supabase = createClientComponentClient()
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('프로필 조회 실패:', error)
      return null
    }
    
    return profile?.role || null
  } catch (error) {
    console.error('역할 확인 오류:', error)
    return null
  }
}

/**
 * 관리자 권한 확인 (클라이언트 사이드)
 * @param userId 사용자 ID
 * @returns 관리자 권한 여부
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId)
  return role === 'admin' || role === 'event_manager'
}
