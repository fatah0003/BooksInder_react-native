import apiClient from './api';

export interface PasswordResetRequestData {
  email: string;
}

export interface PasswordResetConfirmData {
  token: string;
  newPassword: string;
}

export const passwordResetService = {
  // Demander un code de réinitialisation
  requestReset: async (data: PasswordResetRequestData): Promise<void> => {
    await apiClient.post('/password/reset-request', data);
  },

  // Confirmer la réinitialisation avec le code
  confirmReset: async (data: PasswordResetConfirmData): Promise<void> => {
    await apiClient.post('/password/reset-confirm', data);
  },
};
