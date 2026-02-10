import { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type SyncState = 'synced' | 'syncing' | 'offline' | 'error';

interface SyncStatusProps {
  className?: string;
}

export function SyncStatus({ className }: SyncStatusProps) {
  const [syncState, setSyncState] = useState<SyncState>('synced');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncState('synced');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncState('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for custom sync events
    const handleSyncStart = () => setSyncState('syncing');
    const handleSyncComplete = () => setSyncState('synced');
    const handleSyncError = () => setSyncState('error');

    window.addEventListener('sync:start', handleSyncStart);
    window.addEventListener('sync:complete', handleSyncComplete);
    window.addEventListener('sync:error', handleSyncError);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sync:start', handleSyncStart);
      window.removeEventListener('sync:complete', handleSyncComplete);
      window.removeEventListener('sync:error', handleSyncError);
    };
  }, []);

  const getStatusConfig = () => {
    switch (syncState) {
      case 'synced':
        return {
          icon: Cloud,
          color: 'text-emerald-500',
          bgColor: 'bg-emerald-500/10',
          label: 'Tersinkron',
          description: 'Data tersimpan di cloud',
        };
      case 'syncing':
        return {
          icon: RefreshCw,
          color: 'text-primary',
          bgColor: 'bg-primary/10',
          label: 'Menyinkronkan...',
          description: 'Sedang menyimpan perubahan',
          animate: true,
        };
      case 'offline':
        return {
          icon: CloudOff,
          color: 'text-amber-500',
          bgColor: 'bg-amber-500/10',
          label: 'Offline',
          description: 'Data akan disinkron saat online',
        };
      case 'error':
        return {
          icon: CloudOff,
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          label: 'Gagal sinkron',
          description: 'Gagal menyimpan, coba lagi nanti',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors',
            config.bgColor,
            config.color,
            className
          )}
        >
          <Icon className={cn('h-3.5 w-3.5', config.animate && 'animate-spin')} />
          <span className="hidden sm:inline">{config.label}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{config.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// Helper function to trigger sync events
export function triggerSyncStart() {
  window.dispatchEvent(new Event('sync:start'));
}

export function triggerSyncComplete() {
  window.dispatchEvent(new Event('sync:complete'));
}

export function triggerSyncError() {
  window.dispatchEvent(new Event('sync:error'));
}
