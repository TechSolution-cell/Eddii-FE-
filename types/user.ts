
export type Role = 'SUPER_ADMIN' | 'BUSINESS_ADMIN';

export interface User {
    id: string
    name: string;
    email: string;
    role?: Role;
    avatarUrl?: string | null
}