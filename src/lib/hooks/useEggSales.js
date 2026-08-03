import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'

export function useEggSales() {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['egg-sales', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('egg_sales')
        .select('*, egg_customers(name), egg_sale_items(*, egg_inventory(product_name))')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    enabled: !!tenant?.id
  })
}
