import { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Save, Loader2, Shield, Crown, Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

export function AccountInfoTab() {
  const { profile, user, updateProfile, isAdmin } = useAuthContext();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast({ variant: 'destructive', title: 'Nama tidak boleh kosong' });
      return;
    }

    setIsLoading(true);
    const { error } = await updateProfile({ full_name: fullName.trim() });
    setIsLoading(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Gagal menyimpan', description: error.message });
    } else {
      toast({ title: 'Profil berhasil diperbarui' });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Format file tidak didukung', description: 'Silakan pilih file gambar (JPG, PNG, dll).' });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File terlalu besar', description: 'Ukuran maksimal adalah 2MB.' });
      return;
    }

    setIsLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to 'avatars' bucket
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await updateProfile({ avatar_url: publicUrl });
      if (updateError) throw updateError;

      // Also update user metadata for redundancy
      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      toast({ title: 'Foto profil berhasil diperbarui' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Gagal mengupload foto', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0].toUpperCase() || 'U';

  const currentAvatarUrl = profile?.avatar_url || (user?.user_metadata?.avatar_url as string | undefined);

  return (
    <div className="space-y-6">
      {/* Profile Info Card */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24 shadow-elegant border-2 border-primary/20 transition-all group-hover:border-primary">
                <AvatarImage src={currentAvatarUrl} className="object-cover" />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg cursor-pointer transform transition-transform hover:scale-110 active:scale-95 flex items-center justify-center border-2 border-background"
                title="Ganti Foto Profil"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                <input
                  id="avatar-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={isLoading}
                />
              </label>
            </div>
            <div className="flex-1">
              <CardTitle className="font-serif text-2xl flex items-center gap-2">
                {profile?.full_name || 'User'}
                {isAdmin && <Crown className="h-5 w-5 text-accent" />}
              </CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1 text-base">
                <Mail className="h-4 w-4" />
                {user?.email}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Masukkan nama lengkap"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email tidak dapat diubah</p>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-medium">{isAdmin ? 'Admin' : 'User'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bergabung Sejak</Label>
              <Input
                value={profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })
                  : '-'
                }
                disabled
                className="bg-muted"
              />
            </div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" />Simpan Perubahan</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-serif text-lg">Status Akun</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <p className="font-medium">Status Akun</p>
              <p className="text-sm text-muted-foreground">Akun Anda saat ini aktif</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-success/20 text-success text-sm font-medium">
              Aktif
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <p className="font-medium">Sinkronisasi Cloud</p>
              <p className="text-sm text-muted-foreground">Data Anda tersinkron otomatis</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
              Aktif
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}