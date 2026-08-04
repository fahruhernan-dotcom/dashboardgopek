import { useTenantTable } from './useTenantTable'

export function useEggSuppliers() {
  return useTenantTable('egg_suppliers', { orderBy: 'name', ascending: true, queryKeyPrefix: 'egg-suppliers' })
}

