import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion, useAnimation } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

// ─── shadcn-compatible Button ─────────────────────────────────────────────────

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ShadcnButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ShadcnButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

// ─── Original motion-based Button (used by quiz pages) ───────────────────────

interface MotionButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit';
}

const variantStyles = {
  primary: {
    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
    color: '#FFFFFF',
    border: 'none',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
  },
  secondary: {
    background: '#FFFFFF',
    color: '#1E293B',
    border: '2px solid #E2E8F0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  danger: {
    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    color: '#FFFFFF',
    border: 'none',
    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
  },
  ghost: {
    background: 'transparent',
    color: '#64748B',
    border: '2px solid transparent',
    boxShadow: 'none',
  },
};

const sizeStyles = {
  sm: { padding: '10px 20px', fontSize: '14px', borderRadius: '10px' },
  md: { padding: '14px 28px', fontSize: '16px', borderRadius: '12px' },
  lg: { padding: '18px 36px', fontSize: '18px', borderRadius: '14px' },
};

export default function MotionButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  type = 'button',
}: MotionButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  const particlesControl = useAnimation();

  useEffect(() => {
    setParticles(Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 280,
      y: (Math.random() - 0.5) * 280,
    })));
  }, []);

  const handleParticleStart = useCallback(async () => {
    if (disabled || loading) return;
    await particlesControl.start({ x: 0, y: 0, transition: { type: 'spring', stiffness: 50, damping: 10 } });
  }, [particlesControl, disabled, loading]);

  const handleParticleEnd = useCallback(async () => {
    await particlesControl.start((i) => ({
      x: particles[i]?.x ?? 0,
      y: particles[i]?.y ?? 0,
      transition: { type: 'spring', stiffness: 100, damping: 15 },
    }));
  }, [particlesControl, particles]);

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.03, y: -1 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      onMouseEnter={handleParticleStart}
      onMouseLeave={handleParticleEnd}
      onTouchStart={handleParticleStart}
      onTouchEnd={handleParticleEnd}
      style={{
        ...v,
        ...s,
        position: 'relative',
        width: fullWidth ? '100%' : 'auto',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontFamily: 'inherit',
        fontWeight: 700,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity 200ms ease',
        outline: 'none',
        userSelect: 'none',
      }}
    >
      {particles.map((_, i) => (
        <motion.div
          key={i}
          custom={i}
          initial={{ x: particles[i]?.x ?? 0, y: particles[i]?.y ?? 0 }}
          animate={particlesControl}
          style={{
            position: 'absolute',
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.55)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      ))}
      <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {loading ? (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            style={{ display: 'inline-block', width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%' }}
          />
        ) : (
          children
        )}
      </span>
    </motion.button>
  );
}
