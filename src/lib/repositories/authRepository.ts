import { invoke } from '@tauri-apps/api/tauri';
import { AuthResponse, TauriUser } from '../../types/tauri';

export const authRepository = {
  async checkFirstRun(): Promise<boolean> {
    return await invoke<boolean>('check_first_run');
  },

  async setupAdminPin(fullName: string, pin: string): Promise<AuthResponse> {
    return await invoke<AuthResponse>('setup_admin_pin', {
      fullName,
      pin,
    });
  },

  async loginWithPin(pin: string): Promise<AuthResponse> {
    return await invoke<AuthResponse>('login_with_pin', {
      pin,
    });
  },

  async logout(): Promise<void> {
    return await invoke<void>('logout');
  },

  async checkSession(): Promise<TauriUser | null> {
    return await invoke<TauriUser | null>('check_session');
  },
};
