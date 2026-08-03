import { BUSINESS_ROLES } from './constants';

export const canManageSales = (profile) => [
  BUSINESS_ROLES.OWNER,
  BUSINESS_ROLES.ADMIN,
  BUSINESS_ROLES.MANAJER,
  BUSINESS_ROLES.MANAGER,
  BUSINESS_ROLES.SALES,
  BUSINESS_ROLES.STAFF,
].includes(profile?.role);

export const canUpdateSales = (profile) => canManageSales(profile);

export const canManagePurchases = (profile) => [
  BUSINESS_ROLES.OWNER,
  BUSINESS_ROLES.ADMIN,
  BUSINESS_ROLES.MANAJER,
  BUSINESS_ROLES.MANAGER,
  BUSINESS_ROLES.STAFF_GUDANG,
  BUSINESS_ROLES.GUDANG,
  BUSINESS_ROLES.STAFF,
].includes(profile?.role);

export const canUpdatePurchases = (profile) => canManagePurchases(profile);

export const canManagePayments = (profile) => [
  BUSINESS_ROLES.OWNER,
  BUSINESS_ROLES.ADMIN,
  BUSINESS_ROLES.MANAJER,
  BUSINESS_ROLES.MANAGER,
  BUSINESS_ROLES.FINANCE,
  BUSINESS_ROLES.SALES,
].includes(profile?.role);

export const canUpdatePayments = (profile) => canManagePayments(profile);

export const canManageInventory = (profile) => [
  BUSINESS_ROLES.OWNER,
  BUSINESS_ROLES.ADMIN,
  BUSINESS_ROLES.MANAJER,
  BUSINESS_ROLES.MANAGER,
  BUSINESS_ROLES.GUDANG,
  BUSINESS_ROLES.GUDANG_RPA,
  BUSINESS_ROLES.STAFF_GUDANG,
  BUSINESS_ROLES.STAFF,
].includes(profile?.role);

export const canManageLogistics = (profile) => [
  BUSINESS_ROLES.OWNER,
  BUSINESS_ROLES.ADMIN,
  BUSINESS_ROLES.MANAJER,
  BUSINESS_ROLES.MANAGER,
  BUSINESS_ROLES.SUPIR,
  BUSINESS_ROLES.KURIR,
].includes(profile?.role);

export const canViewFinance = (profile) => [
  BUSINESS_ROLES.OWNER,
  BUSINESS_ROLES.ADMIN,
  BUSINESS_ROLES.FINANCE,
  BUSINESS_ROLES.MANAJER,
  BUSINESS_ROLES.MANAGER,
].includes(profile?.role);

export const canManageOperations = (profile) => [
  BUSINESS_ROLES.OWNER,
  BUSINESS_ROLES.ADMIN,
  BUSINESS_ROLES.MANAJER,
  BUSINESS_ROLES.MANAGER,
  BUSINESS_ROLES.ADMIN_RPA,
  BUSINESS_ROLES.OPERATOR,
  BUSINESS_ROLES.QC,
  BUSINESS_ROLES.STAFF,
].includes(profile?.role);

export const canManageTeam = (profile) => [
  BUSINESS_ROLES.OWNER,
  BUSINESS_ROLES.ADMIN,
  BUSINESS_ROLES.MANAJER,
  BUSINESS_ROLES.MANAGER,
].includes(profile?.role);

export const canViewReports = (profile) => [
  BUSINESS_ROLES.OWNER,
  BUSINESS_ROLES.ADMIN,
  BUSINESS_ROLES.MANAJER,
  BUSINESS_ROLES.MANAGER,
  BUSINESS_ROLES.FINANCE,
  BUSINESS_ROLES.SALES,
].includes(profile?.role);
