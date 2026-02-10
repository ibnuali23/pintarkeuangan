 import { useState } from 'react';
 import { useAuthContext } from '@/contexts/AuthContext';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { useToast } from '@/hooks/use-toast';
 import { User, Mail, Save, Loader2, Shield, Crown } from 'lucide-react';
 
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
 
   return (
     <div className="space-y-6">
       {/* Profile Info Card */}
       <Card className="glass-card">
         <CardHeader>
           <div className="flex items-center gap-4">
             <div className="flex h-16 w-16 items-center justify-center rounded-full gradient-primary shadow-elegant">
               <User className="h-8 w-8 text-primary-foreground" />
             </div>
             <div>
               <CardTitle className="font-serif flex items-center gap-2">
                 {profile?.full_name || 'User'}
                 {isAdmin && <Crown className="h-5 w-5 text-accent" />}
               </CardTitle>
               <CardDescription className="flex items-center gap-1">
                 <Mail className="h-3 w-3" />
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