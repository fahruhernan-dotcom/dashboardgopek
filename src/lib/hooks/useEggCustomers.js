import { useTenantTable } from './useTenantTable'

export function useEggCustomers() {
  return useTenantTable('egg_customers', { orderBy: 'name', ascending: true, queryKeyPrefix: 'egg-customers' })
}

