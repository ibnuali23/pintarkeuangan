import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Asset } from '@/types/asset';
import { triggerSyncStart, triggerSyncComplete, triggerSyncError } from '@/components/layout/SyncStatus';
import { toast } from 'sonner';

export function useAssets() {
    const { user, isAuthenticated } = useAuthContext();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchAssets = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);

        try {
            const { data, error } = await supabase
                .from('assets')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            setAssets(data as Asset[] || []);
        } catch (error) {
            console.error('Error fetching assets:', error);
            toast.error('Gagal memuat data aset');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchAssets();
        } else {
            setAssets([]);
        }
    }, [isAuthenticated, fetchAssets]);

    const addAsset = async (assetData: Omit<Asset, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
        if (!user) return { error: new Error('Not authenticated') };
        triggerSyncStart();

        try {
            const { data, error } = await supabase
                .from('assets')
                .insert({
                    user_id: user.id,
                    ...assetData
                })
                .select()
                .single();

            if (error) throw error;

            triggerSyncComplete();
            setAssets(prev => [data as Asset, ...prev]);
            toast.success('Aset berhasil ditambahkan');
            return { data };
        } catch (error) {
            triggerSyncError();
            console.error('Error adding asset:', error);
            toast.error('Gagal menambahkan aset');
            return { error };
        }
    };

    const updateAsset = async (id: string, assetData: Partial<Omit<Asset, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
        if (!user) return { error: new Error('Not authenticated') };
        triggerSyncStart();

        try {
            const { data, error } = await supabase
                .from('assets')
                .update(assetData)
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;

            triggerSyncComplete();
            setAssets(prev => prev.map(a => a.id === id ? data as Asset : a));
            toast.success('Aset berhasil diperbarui');
            return { data };
        } catch (error) {
            triggerSyncError();
            console.error('Error updating asset:', error);
            toast.error('Gagal memperbarui aset');
            return { error };
        }
    };

    const deleteAsset = async (id: string) => {
        if (!user) return { error: new Error('Not authenticated') };
        triggerSyncStart();

        try {
            const { error } = await supabase
                .from('assets')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;

            triggerSyncComplete();
            setAssets(prev => prev.filter(a => a.id !== id));
            toast.success('Aset berhasil dihapus');
            return { success: true };
        } catch (error) {
            triggerSyncError();
            console.error('Error deleting asset:', error);
            toast.error('Gagal menghapus aset');
            return { error };
        }
    };

    return {
        assets,
        isLoading,
        addAsset,
        updateAsset,
        deleteAsset,
        refetch: fetchAssets
    };
}
