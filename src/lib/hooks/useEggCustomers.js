import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'

export function useEggCustomers() {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['egg-customers', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('egg_customers')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('name', { ascending: true })
      
      if (error) throw error
      return data
    },
    enabled: !!tenant?.id
  })
}
