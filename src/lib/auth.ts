import { supabase } from './supabase';

// GitHub ile giriş başlatma fonksiyonu
export const signInWithGitHub = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      // Giriş yapıldıktan sonra kullanıcının döneceği yer (localhost)
      redirectTo: window.location.origin,
    },
  });
  if (error) console.error('Giriş hatası:', error.message);
};

// Çıkış yapma fonksiyonu
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Çıkış hatası:', error.message);
};