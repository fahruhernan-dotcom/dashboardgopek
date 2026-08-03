import { BUSINESS_ROLES } from './constants';

export const isOwner = (profile) => profile?.role === BUSINESS_ROLES.OWNER;

export const isManager = (profile) => [BUSINESS_ROLES.MANAGER, BUSINESS_ROLES.MANAJER].includes(profile?.role);

export const isStaff = (profile) => profile?.role === BUSINESS_ROLES.STAFF;

export const isViewOnly = (profile) => profile?.role === BUSINESS_ROLES.VIEW_ONLY;

