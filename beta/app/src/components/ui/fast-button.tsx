import { Button, ButtonProps } from './button'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

interface FastButtonProps extends ButtonProps {
  loadingText?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
}

export function FastButton({ 
  children, 
  loadingText = 'Loading...', 
  onClick,
  disabled,
  ...props 
}: FastButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!onClick || isLoading) return;

    setIsLoading(true);
    
    // Add instant visual feedback
    const button = e.currentTarget;
    button.style.transform = 'scale(0.98)';
    
    try {
      await onClick(e);
    } finally {
      setIsLoading(false);
      button.style.transform = '';
    }
  };

  return (
    <Button
      {...props}
      disabled={disabled || isLoading}
      onClick={handleClick}
      style={{
        transition: 'all 0.1s ease',
        ...props.style
      }}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}