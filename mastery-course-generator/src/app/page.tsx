import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="text-center space-y-6 max-w-3xl">
        <h1 className="text-5xl font-bold tracking-tight">
          Mastery Course Generator
        </h1>
        <p className="text-xl text-muted-foreground">
          Transform messy educational material into structured, grounded,
          comprehensive courses designed for genuine mastery.
        </p>
        <p className="text-muted-foreground">
          Upload a syllabus, textbook, lecture notes, or describe your course in
          natural language — and get a complete mastery-oriented curriculum.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link href="/dashboard">
            <Button size="lg">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}