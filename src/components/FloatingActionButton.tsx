import { Plus, X, TrendingUp, TrendingDown } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden floating-button">
      {/* Sub buttons */}
      <div
        className={cn(
          'absolute bottom-16 right-0 flex flex-col gap-3 transition-all duration-300',
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        <Link
          to="/income"
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-success text-success-foreground shadow-lg animate-scale-in"
        >
          <TrendingUp className="h-5 w-5" />
          <span className="text-sm font-medium">Pemasukan</span>
        </Link>
        <Link
          to="/expense"
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-destructive text-destructive-foreground shadow-lg animate-scale-in"
          style={{ animationDelay: '50ms' }}
        >
          <TrendingDown className="h-5 w-5" />
          <span className="text-sm font-medium">Pengeluaran</span>
        </Link>
      </div>

      {/* Main button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300',
          isOpen
            ? 'bg-muted text-muted-foreground rotate-45'
            : 'gradient-primary text-primary-foreground'
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
    </div>
  );
}
