import { supabase } from './supabase';

export async function createAdminUser(email: string, password: string) {
  try {
    // 1. Create the user in auth.users
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No user returned from signup');

    // 2. Create the profile with admin privileges
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email,
        first_name: 'Admin',
        last_name: 'User',
        role: 'TL',
        is_admin: true
      });

    if (profileError) throw profileError;

    return { success: true, user: authData.user };
  } catch (error) {
    console.error('Error creating admin user:', error);
    return { success: false, error };
  }
}