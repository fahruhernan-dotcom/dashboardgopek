import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'

export function useDeliveries(statusFilter = null) {
  return useQuery({
    queryKey: ['deliveries', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('deliveries')
        .select(`
          *,
          drivers(full_name, phone),
          vehicles(brand, vehicle_plate, vehicle_type),
          sales(
            total_revenue,
            net_revenue,
            price_per_kg,
            rpa_clients(rpa_name),
            purchases(farms(farm_name))
          )
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (statusFilter && statusFilter !== 'all') query = query.eq('status', statusFilter)

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}
