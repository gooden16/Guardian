import { User } from '../types';
import { supabase } from '../utils/supabase';
import { logger } from '../utils/logger';

export class ProfileService {
  private static instance: ProfileService;

  private constructor() {}

  static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  async getProfile(userId: string): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Profile not found');

      return this.mapDatabaseUserToUser(data);
    } catch (error) {
      logger.error('Failed to fetch profile', { error, userId });
      throw new Error('Failed to fetch profile');
    }
  }

  async updateProfile(userId: string, profile: Partial<User>): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(this.mapUserToDatabaseUser(profile))
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Profile not found');

      logger.info('Profile updated successfully', { userId });
      return this.mapDatabaseUserToUser(data);
    } catch (error) {
      logger.error('Failed to update profile', { error, userId });
      throw new Error('Failed to update profile');
    }
  }

  private mapDatabaseUserToUser(dbUser: any): User {
    return {
      id: dbUser.user_id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      phone: dbUser.phone,
      active: dbUser.active,
      joinDate: new Date(dbUser.join_date),
      lastActive: new Date(dbUser.last_active)
    };
  }

  private mapUserToDatabaseUser(user: Partial<User>): any {
    return {
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      active: user.active,
      last_active: new Date().toISOString()
    };
  }
}