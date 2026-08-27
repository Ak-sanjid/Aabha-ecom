export interface JwtPayload {
  sub: string;
  email: string | null;
  phone: string | null;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';
  /** Permission keys resolved from RBAC at sign-in time. */
  permissions?: string[];
}

export interface AuthenticatedUser extends JwtPayload {
  fullName: string | null;
  locale: 'EN' | 'BN';
  mustChangePassword: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResult {
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    fullName: string | null;
    role: string;
    locale: 'EN' | 'BN';
    mustChangePassword: boolean;
    isNewAccount: boolean;
  };
  tokens: AuthTokens;
  /** Copy for the floating auto-dismissing notification on the storefront. */
  notice?: {
    kind: 'GUEST_ACCOUNT_CREATED' | 'ACCOUNT_LINKED' | 'PASSWORD_CHANGE_REQUIRED';
    messageEn: string;
    messageBn: string;
  };
}

/** Result of the unified login/register bar's first step. */
export interface IdentifyResult {
  identifierKind: 'email' | 'phone' | 'unknown';
  normalized: string;
  exists: boolean;
  /** Which field the UI should reveal next. */
  nextStep: 'PASSWORD' | 'OTP' | 'REGISTER' | 'INVALID';
  hasPassword: boolean;
  /** Social providers already linked, so the UI can nudge "Continue with Google". */
  linkedProviders: string[];
  maskedHint?: string;
}
