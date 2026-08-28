'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { StepIndicator } from '@/components/wizard/StepIndicator';
import { WizardStep } from '@/components/wizard/WizardStep';
import { FileUpload } from '@/components/wizard/FileUpload';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  description: string | null;
  subjectDomain: string | null;
  targetLevel: string | null;
  status: string;
  stage: string;
  preferences: string | null;
}

const WIZARD_STEPS = [
  { id: 'info', label: 'Course Info' },
  { id: 'sources', label: 'Sources' },
  { id: 'analyze', label: 'Analyze' },
  { id: 'blueprint', label: 'Blueprint' },
  { id: 'generate', label: 'Generate' },
  { id: 'qa', label: 'QA' },
  { id: 'workspace', label: 'Workspace' },
];

export default function WizardPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [currentStep, setCurrentStep] = useState('info');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<any[]>([]);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  // Function declarations first (hoisted)
  async function fetchCourse() {
    try {
      const res = await fetch(`/api/courses/${courseId}`);
      if (res.ok) {
        const data = await res.json();
        setCourse(data.course);
        // Determine completed steps based on course stage
        const stageOrder = ['CREATED', 'SOURCES_UPLOADED', 'SOURCE_ANALYZED', 'BLUEPRINT_READY', 'GENERATED', 'QA_COMPLETE', 'PUBLISHED'];
        const currentStageIndex = stageOrder.indexOf(data.course?.stage || 'CREATED');
        const completed = stageOrder.slice(0, Math.max(0, currentStageIndex)).map((_, i) => WIZARD_STEPS[i]?.id).filter(Boolean) as string[];
        setCompletedSteps(completed);
        if (currentStageIndex >= 0 && currentStageIndex < WIZARD_STEPS.length && WIZARD_STEPS[currentStageIndex]) {
          setCurrentStep(WIZARD_STEPS[currentStageIndex].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch course:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateCourse(data: Partial<Course>) {
    const res = await fetch(`/api/courses/${courseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const data = await res.json();
      setCourse(data.course);
    }
  }

  function goToStep(stepId: string) {
    const stepIndex = WIZARD_STEPS.findIndex((s) => s.id === stepId);
    const currentIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep);
    // Allow going back to completed steps or forward by one
    if (stepIndex <= currentIndex + 1 || completedSteps.includes(stepId)) {
      setCurrentStep(stepId);
    }
  }

  function nextStep() {
    const currentIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex < WIZARD_STEPS.length - 1) {
      const next = WIZARD_STEPS[currentIndex + 1];
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps((prev) => [...prev, currentStep]);
      }
      setCurrentStep(next?.id ?? currentStep);
    }
  }

  async function handleAnalyze() {
    if (!sources.length && !prompts.length) return;
    setAnalyzing(true);
    try {
      // Start analysis job
      const res = await fetch(`/api/courses/${courseId}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'ANALYZE_SOURCE',
          input: { documentId: sources[0]?.id },
        }),
      });
      if (res.ok) {
        // Poll for completion
        // For now, just navigate
        setCompletedSteps((prev) => [...prev, 'analyze']);
        setCurrentStep('blueprint');
      }
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => {
    let mounted = true;
    fetchCourse().then(() => {
      if (!mounted) return;
    });
    return () => { mounted = false; };
  }, [courseId]);

  const stepComponents = {
    info: (
      <WizardStep
        title="Course Information"
        description="Define the basic details of your course"
      >
        <div className="space-y-4">
          <Input
            label="Course Title"
            value={course?.title || ''}
            onChange={(e) => updateCourse({ title: e.target.value })}
          />
          <Textarea
            label="Description"
            value={course?.description || ''}
            onChange={(e) => updateCourse({ description: e.target.value })}
            rows={4}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Subject Domain"
              value={course?.subjectDomain || ''}
              onChange={(e) => updateCourse({ subjectDomain: e.target.value })}
              placeholder="e.g., mathematics, science, history"
            />
            <Input
              label="Target Level"
              value={course?.targetLevel || ''}
              onChange={(e) => updateCourse({ targetLevel: e.target.value })}
              placeholder="e.g., introductory, intermediate, advanced"
            />
          </div>
        </div>
      </WizardStep>
    ),
    sources: (
      <WizardStep
        title="Source Material"
        description="Upload syllabi, textbooks, lecture notes, or describe your course in natural language"
      >
        <FileUpload
          onFilesChange={setSources}
          onPromptsChange={setPrompts}
          acceptedTypes={['image/*', '.pdf', '.txt', '.md', '.docx']}
        />
      </WizardStep>
    ),
    analyze: (
      <WizardStep
        title="Source Analysis"
        description="Extract structured knowledge from your source material"
      >
        {analyzing ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <p className="mt-4 text-muted-foreground">Analyzing source material...</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Upload source material and click {'"'}Analyze{' "'} to extract the course structure.
            </p>
            <Button onClick={handleAnalyze} disabled={!sources.length && !prompts.length}>
              Analyze Sources
            </Button>
          </div>
        )}
      </WizardStep>
    ),
    blueprint: (
      <WizardStep
        title="Curriculum Blueprint"
        description="Review and edit the generated curriculum blueprint"
      >
        <p className="text-muted-foreground">Blueprint editor coming soon...</p>
      </WizardStep>
    ),
    generate: (
      <WizardStep
        title="Course Generation"
        description="Generate lessons, practice, and assessments"
      >
        <p className="text-muted-foreground">Course generation coming soon...</p>
      </WizardStep>
    ),
    qa: (
      <WizardStep
        title="Quality Assurance"
        description="Run QA checks and review any issues"
      >
        <p className="text-muted-foreground">QA review coming soon...</p>
      </WizardStep>
    ),
    workspace: (
      <WizardStep
        title="Course Workspace"
        description="Manage your completed course"
      >
        <p className="text-muted-foreground">Workspace coming soon...</p>
      </WizardStep>
    ),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold">Course not found</h1>
        <Button onClick={() => router.push('/dashboard')} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
          \u2190 Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold">{course.title}</h1>
        <p className="text-muted-foreground">{course.description || 'No description'}</p>
      </div>

      <StepIndicator
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        completedSteps={completedSteps}
      />

      <div className="bg-card border rounded-lg p-6">
        {stepComponents[currentStep as keyof typeof stepComponents]}
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => {
          const currentIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep);
          if (currentIndex > 0) {
            const prevStep = WIZARD_STEPS[currentIndex - 1];
            if (prevStep) goToStep(prevStep.id);
          }
        }} disabled={currentStep === 'info'}>
          \u2190 Previous
        </Button>
        <Button onClick={nextStep} disabled={currentStep === 'workspace'}>
          {currentStep === 'workspace' ? 'Finish' : 'Next \u2192'}
        </Button>
      </div>
    </div>
  );
}