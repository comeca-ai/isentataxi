import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { trpc } from '@/providers/trpc';
import type { Answers, Evaluation, StoredContact } from '@/components/pre-analise/questions';
import { buildQuestions, evaluate, loadContact, visibleQuestions } from '@/components/pre-analise/questions';
import QuizStage from '@/components/pre-analise/QuizStage';
import ResultScreen, { type EconomyEcho } from '@/components/pre-analise/ResultScreen';
import ExitDialog from '@/components/pre-analise/ExitDialog';

const LS_KEY = 'itx_quiz';
const SEVEN_DAYS = 7 * 86_400_000;

interface SavedQuiz {
  answers: Answers;
  index: number;
  ts: number;
}

function loadSavedQuiz(): SavedQuiz | null {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) ?? 'null') as SavedQuiz | null;
    if (raw && raw.answers && typeof raw.index === 'number' && Date.now() - raw.ts < SEVEN_DAYS) return raw;
  } catch {
    /* ignora */
  }
  return null;
}

function loadEcho(): EconomyEcho | null {
  try {
    const raw = JSON.parse(localStorage.getItem('itx_sim_last') ?? 'null');
    if (raw?.economia && raw?.modelo) return raw as EconomyEcho;
  } catch {
    /* ignora */
  }
  return null;
}

export default function PreAnalise() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const leadParam = searchParams.get('lead');

  const [contact] = useState<StoredContact | null>(() => loadContact());
  const hasContact = !!contact || !!leadParam;
  const questions = useMemo(() => buildQuestions(hasContact), [hasContact]);

  const [savedQuiz] = useState(() => loadSavedQuiz());
  const [answers, setAnswers] = useState<Answers>(() => savedQuiz?.answers ?? {});
  const [index, setIndex] = useState<number>(() => savedQuiz?.index ?? 0);
  const [showResume, setShowResume] = useState(
    () => !!savedQuiz && (savedQuiz.index > 0 || Object.keys(savedQuiz.answers).length > 0),
  );
  const [phase, setPhase] = useState<'quiz' | 'result'>('quiz');
  const [exitOpen, setExitOpen] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [echo] = useState<EconomyEcho | null>(() => loadEcho());
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const submittedRef = useRef(false);
  const [exitSaving, setExitSaving] = useState(false);

  const submitQuiz = trpc.quiz.submit.useMutation();

  // Página imersiva: esconde navbar/footer globais durante o quiz
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = 'body.itx-immersive header.sticky, body.itx-immersive footer { display: none !important; }';
    document.head.appendChild(style);
    document.body.classList.add('itx-immersive');
    return () => {
      document.body.classList.remove('itx-immersive');
      style.remove();
    };
  }, []);

  // Persistência local (7 dias) — respostas nunca se perdem
  useEffect(() => {
    if (phase !== 'quiz') return;
    localStorage.setItem(LS_KEY, JSON.stringify({ answers, index, ts: Date.now() }));
  }, [answers, index, phase]);

  const visible = visibleQuestions(questions, answers);
  const clampedIndex = Math.min(index, Math.max(visible.length - 1, 0));

  const onAnswer = useCallback((id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }, []);

  const fireSubmit = useCallback(
    (finalAnswers: Answers, evalResult: Evaluation, opts?: { abandono?: boolean; whatsappOverride?: string }) => {
      const payloadAnswers = opts?.abandono ? { ...finalAnswers, _abandono: true } : finalAnswers;
      const name = contact?.name ?? finalAnswers.contato_nome ?? 'Não informado';
      const whatsapp = opts?.whatsappOverride ?? contact?.whatsapp ?? finalAnswers.contato_whatsapp ?? '';
      setSubmitStatus('pending');
      submitQuiz.mutate(
        {
          name,
          whatsapp,
          answers: payloadAnswers,
          result: evalResult.result,
          score: evalResult.score,
        },
        {
          onSuccess: () => {
            setSubmitStatus('success');
            if (!opts?.abandono) {
              toast.success('Resultado enviado para seu WhatsApp');
              localStorage.setItem('itx_contact', JSON.stringify({ name, whatsapp }));
            }
          },
          onError: (err) => {
            setSubmitStatus('error');
            toast.error(err.message || 'Erro ao enviar — suas respostas continuam salvas aqui.');
          },
        },
      );
    },
    [contact, submitQuiz],
  );

  const finish = useCallback(
    (finalAnswers: Answers) => {
      const evalResult = evaluate(finalAnswers);
      setEvaluation(evalResult);
      setPhase('result');
      localStorage.removeItem(LS_KEY);
      window.scrollTo({ top: 0 });
      if (!submittedRef.current) {
        submittedRef.current = true;
        fireSubmit(finalAnswers, evalResult);
      }
    },
    [fireSubmit],
  );

  const onAdvance = useCallback(() => {
    const list = visibleQuestions(questions, answers);
    if (clampedIndex >= list.length - 1) {
      finish(answers);
    } else {
      setIndex(clampedIndex + 1);
      setShowResume(false);
    }
  }, [answers, clampedIndex, finish, questions]);

  const onBack = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  const restart = useCallback(() => {
    setAnswers({});
    setIndex(0);
    setShowResume(false);
    localStorage.removeItem(LS_KEY);
  }, []);

  const leave = useCallback(() => navigate('/'), [navigate]);

  const saveAndLeave = useCallback(
    (whatsapp: string) => {
      setExitSaving(true);
      const evalResult = evaluate(answers);
      submitQuiz.mutate(
        {
          name: contact?.name ?? answers.contato_nome ?? 'Não informado',
          whatsapp,
          answers: { ...answers, _abandono: true },
          result: evalResult.result,
          score: evalResult.score,
        },
        {
          onSettled: () => {
            setExitSaving(false);
            toast.success('Tudo salvo — seu progresso fica guardado por 7 dias.');
            navigate('/');
          },
        },
      );
    },
    [answers, contact, navigate, submitQuiz],
  );

  const retrySubmit = useCallback(() => {
    if (evaluation) fireSubmit(answers, evaluation);
  }, [answers, evaluation, fireSubmit]);

  return (
    <div className="bg-bg-base">
      <Toaster theme="dark" position="bottom-center" />

      {phase === 'quiz' ? (
        <>
          {/* Banner de retomada */}
          {showResume && (
            <div className="fixed inset-x-0 top-0 z-40 flex justify-center px-5 pt-4">
              <div className="flex w-full max-w-xl flex-wrap items-center justify-between gap-3 rounded-xl border border-taxi-yellow/40 bg-bg-elevated px-4 py-3">
                <p className="text-sm text-text-primary">
                  Continuar de onde parou?{' '}
                  <span className="font-mono text-text-muted">
                    (pergunta {Math.min(clampedIndex + 1, visible.length)}/{visible.length})
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowResume(false)}
                    className="rounded-full bg-taxi-yellow px-4 py-2 text-sm font-bold text-bg-base transition-colors hover:bg-taxi-yellow-hover"
                  >
                    Continuar
                  </button>
                  <button
                    onClick={restart}
                    className="rounded-full border border-border-strong px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:text-text-primary"
                  >
                    Recomeçar
                  </button>
                </div>
              </div>
            </div>
          )}

          <QuizStage
            questions={questions}
            answers={answers}
            index={clampedIndex}
            onAnswer={onAnswer}
            onAdvance={onAdvance}
            onBack={onBack}
            onExit={() => setExitOpen(true)}
          />
        </>
      ) : (
        evaluation && (
          <ResultScreen
            evaluation={evaluation}
            echo={echo}
            submitStatus={submitStatus === 'error' ? 'error' : submitStatus === 'success' ? 'success' : 'pending'}
            onRetrySubmit={retrySubmit}
          />
        )
      )}

      <ExitDialog
        open={exitOpen}
        onStay={() => setExitOpen(false)}
        onLeave={leave}
        onSaveAndLeave={saveAndLeave}
        saving={exitSaving}
      />
    </div>
  );
}
