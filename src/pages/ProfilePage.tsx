 import { useNavigate } from 'react-router-dom';
 import { Layout } from '@/components/layout/Layout';
 import { Button } from '@/components/ui/button';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { ArrowLeft, User, Wallet, CreditCard, FolderOpen } from 'lucide-react';
 import { AccountInfoTab } from '@/components/profile/AccountInfoTab';
 import { BudgetSettingsTab } from '@/components/profile/BudgetSettingsTab';
 import { PaymentMethodsTab } from '@/components/profile/PaymentMethodsTab';
 import { CategoriesTab } from '@/components/profile/CategoriesTab';
 
 export default function ProfilePage() {
   const navigate = useNavigate();
 
   return (
     <Layout>
       <div className="max-w-4xl mx-auto space-y-6">
         {/* Header */}
         <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
             <ArrowLeft className="h-5 w-5" />
           </Button>
           <div>
             <h1 className="font-serif text-2xl font-bold text-foreground">Pengaturan Profil</h1>
             <p className="text-muted-foreground">Kelola akun dan preferensi keuangan Anda</p>
           </div>
         </div>
 
         {/* Tabs */}
         <Tabs defaultValue="account" className="w-full">
           <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto gap-2 bg-transparent p-0">
             <TabsTrigger 
               value="account" 
               className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-3"
             >
               <User className="h-4 w-4" />
               <span className="hidden sm:inline">Akun</span>
             </TabsTrigger>
             <TabsTrigger 
               value="budget" 
               className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-3"
             >
               <Wallet className="h-4 w-4" />
               <span className="hidden sm:inline">Budget</span>
             </TabsTrigger>
             <TabsTrigger 
               value="payment" 
               className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-3"
             >
               <CreditCard className="h-4 w-4" />
               <span className="hidden sm:inline">Pembayaran</span>
             </TabsTrigger>
             <TabsTrigger 
               value="categories" 
               className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-3"
             >
               <FolderOpen className="h-4 w-4" />
               <span className="hidden sm:inline">Kategori</span>
             </TabsTrigger>
           </TabsList>
 
           <TabsContent value="account" className="mt-6">
             <AccountInfoTab />
           </TabsContent>
 
           <TabsContent value="budget" className="mt-6">
             <BudgetSettingsTab />
           </TabsContent>
 
           <TabsContent value="payment" className="mt-6">
             <PaymentMethodsTab />
           </TabsContent>
 
           <TabsContent value="categories" className="mt-6">
             <CategoriesTab />
           </TabsContent>
         </Tabs>
       </div>
     </Layout>
   );
 }
