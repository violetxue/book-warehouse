import { BookOpen, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@client/src/components/ui/button';

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <BookOpen className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-xl font-semibold text-foreground">页面不存在</h1>
      <p className="text-sm text-muted-foreground">
        你访问的页面不存在，或已被移动
      </p>
      <Button asChild>
        <Link to="/">
          <Home className="h-4 w-4" />
          返回书库
        </Link>
      </Button>
    </div>
  );
};

export default NotFound;
