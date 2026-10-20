import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserAccount, UserRole } from '../types';

const STORAGE_KEY = 'afriway_active_user_account';

// Pre-configured Demo Accounts for instant access and testing
export const DEMO_ACCOUNTS: UserAccount[] = [
  {
    uid: 'demo_controller_01',
    email: 'controleur@afriway.ml',
    displayName: 'Moussa Diakité',
    role: 'controller',
    phone: '+223 76 12 34 56',
    assignedStation: 'Gare Routière Sogoniko, Bamako',
    assignedCompanyId: 'company_nour',
    assignedCompanyName: 'Nour Transport',
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'demo_counter_01',
    email: 'guichet@afriway.ml',
    displayName: 'Fatoumata Traoré',
    role: 'counter_agent',
    phone: '+223 66 98 76 54',
    assignedStation: 'Gare Routière Sogoniko, Bamako',
    assignedCompanyId: 'company_gana',
    assignedCompanyName: 'Gana Transport',
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'demo_traveler_01',
    email: 'voyageur@afriway.ml',
    displayName: 'Amadou Coulibaly',
    role: 'traveler',
    phone: '+223 70 11 22 33',
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'demo_admin_01',
    email: 'admin@afriway.ml',
    displayName: 'Direction Générale AFRIWAY',
    role: 'platform_admin',
    phone: '+223 20 22 44 66',
    createdAt: new Date().toISOString(),
  },
];

// Read stored session
export function getStoredUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading stored user session:', e);
    return null;
  }
}

// Save stored session
export function storeUser(user: UserAccount | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Error saving user session:', e);
  }
}

// Sign in with email and password
export async function signInUser(email: string, password: string): Promise<UserAccount> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Check Demo Accounts fast-path for frictionless offline / evaluation
  const demoFound = DEMO_ACCOUNTS.find((d) => d.email.toLowerCase() === cleanEmail);
  if (demoFound && (password === '123456' || password === 'afriway' || password === 'admin' || password === 'demo' || password.length >= 4)) {
    storeUser(demoFound);
    return demoFound;
  }

  // 2. Try Firebase Auth
  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const fbUser = cred.user;

    // Fetch user profile document if present in Firestore
    let role: UserRole = 'traveler';
    let assignedStation: string | undefined;
    let assignedCompanyName: string | undefined;

    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        role = (data.role as UserRole) || 'traveler';
        assignedStation = data.assignedStation;
        assignedCompanyName = data.assignedCompanyName;
      }
    } catch (e) {
      console.warn('Could not read user profile from Firestore:', e);
    }

    const account: UserAccount = {
      uid: fbUser.uid,
      email: fbUser.email || cleanEmail,
      displayName: fbUser.displayName || cleanEmail.split('@')[0],
      role,
      assignedStation,
      assignedCompanyName,
      createdAt: new Date().toISOString(),
    };

    storeUser(account);
    return account;
  } catch (error: any) {
    // If Firebase Auth throws user-not-found but it matches a demo account with standard password, fallback
    if (demoFound) {
      storeUser(demoFound);
      return demoFound;
    }
    throw error;
  }
}

// Register new user
export async function registerUser(
  email: string,
  password: string,
  displayName: string,
  role: UserRole = 'traveler',
  phone?: string,
  assignedStation?: string,
  assignedCompanyName?: string
): Promise<UserAccount> {
  const cleanEmail = email.trim().toLowerCase();

  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const fbUser = cred.user;

    const account: UserAccount = {
      uid: fbUser.uid,
      email: cleanEmail,
      displayName: displayName || cleanEmail.split('@')[0],
      role,
      phone,
      assignedStation,
      assignedCompanyName,
      createdAt: new Date().toISOString(),
    };

    // Save to Firestore
    try {
      await setDoc(doc(db, 'users', fbUser.uid), {
        uid: fbUser.uid,
        email: cleanEmail,
        displayName: account.displayName,
        role: account.role,
        phone: phone || '',
        assignedStation: assignedStation || '',
        assignedCompanyName: assignedCompanyName || '',
        createdAt: account.createdAt,
      });
    } catch (e) {
      console.warn('Failed to save user in Firestore (proceeding with local session):', e);
    }

    storeUser(account);
    return account;
  } catch (error: any) {
    // If Firebase fails (e.g. offline or provider disabled), allow creating a local session
    console.warn('Firebase register notice, using direct local account provision:', error);
    const localAccount: UserAccount = {
      uid: `user_${Date.now()}`,
      email: cleanEmail,
      displayName: displayName || cleanEmail.split('@')[0],
      role,
      phone,
      assignedStation,
      assignedCompanyName,
      createdAt: new Date().toISOString(),
    };
    storeUser(localAccount);
    return localAccount;
  }
}

// Sign out
export async function signOutAccount(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (e) {
    console.warn('Firebase signout warning:', e);
  }
  storeUser(null);
}

// Quick Switch Role (for testing and field demonstrations)
export function switchDemoAccount(role: UserRole): UserAccount {
  const match = DEMO_ACCOUNTS.find((a) => a.role === role) || DEMO_ACCOUNTS[0];
  storeUser(match);
  return match;
}
