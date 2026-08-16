import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, CornerDownLeft, X } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';
import { maskWhatsapp } from '@/components/simulador/whatsapp';
import type { Answers, Question } from './questions';
import { visibleQuestions } from './questions';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

/** Palco do quiz — uma pergunta por tela, transições Framer Motion */
export default function QuizStage({
  questions,
  answers,
  index,
  onAnswer,
  onAdvance,
  onBack,
  onExit,
}: {
  questions: Question[];
  answers: Answers;
  index: number;
  onAnswer: (id: string, value: string) => void;
  onAdvance: () => void;
  onBack: () => void;
  onExit: () => void;
}) {
  const visible = useMemo(() => visibleQuestions(questions, answers), [questions, answers]);
  const question = visible[Math.min(index, visible.length - 1)];
  const total = visible.length;
  const step = Math.min(index + 1, total);
  const progress = step / total;

  const [inputValue, setInputValue] = useState('');
  const [lgpd, setLgpd] = useState(false);
  const [touched, setTouched] = useState(false);
  const advanceTimer = useRef<number | null>(null);

  // Hidrata input com resposta salva ao trocar de pergunta
  useEffect(() => {
    setInputValue(question.type === 'input' ? answers[question.id] ?? '' : '');
    setLgpd(false);
    setTouched(false);
  }, [question.id, question.type, answers]);

  useEffect(
    () => () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    },
    [],
  );

  const inputError = question.type === 'input' && question.validate ? question.validate(inputValue) : null;
  const inputValid = question.type !== 'input' || (!inputError && (question.inputKind !== 'whatsapp' || lgpd));

  const select = (value: string) => {
    onAnswer(question.id, value);
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => onAdvance(), 350);
  };

  const advanceInput = () => {
    if (!inputValid) {
      setTouched(true);
      return;
    }
    onAnswer(question.id, inputValue.trim());
    onAdvance();
  };

  // Navegação por teclado: 1-4 / A-D selecionam, Enter avança, ← volta
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA';
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onBack();
        return;
      }
      if (typing) {
        if (e.key === 'Enter') {
          e.preventDefault();
          advanceInput();
        }
        return;
      }
      if (question.type === 'choice' && question.choices) {
        const k = e.key.toLowerCase();
        const num = Number(k);
        let idx = -1;
        if (num >= 1 && num <= question.choices.length) idx = num - 1;
        else {
          const letter = LETTERS.findIndex((l) => l.toLowerCase() === k);
          if (letter >= 0 && letter < question.choices.length) idx = letter;
        }
        if (idx >= 0) {
          e.preventDefault();
          select(question.choices[idx].value);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, inputValue, lgpd, answers]);


  return (
    <div className="relative flex min-h-[100dvh] flex-col">
      {/* Glow radial que acompanha o progresso */}
      <div
        className="pointer-events-none fixed inset-0 transition-opacity duration-500"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 80% 0%, rgba(250,204,21,0.14), transparent 70%)',
          opacity: 0.15 + progress * 0.85,
        }}
        aria-hidden="true"
      />

      {/* Topo: logo mini + progresso + contador + sair */}
      <header className="relative z-10 px-5 pt-5 md:px-8">
        <div className="mx-auto flex max-w-xl items-center gap-4">
          <Link to="/" aria-label="IsentaTáxi — início" className="shrink-0">
            <img src="/logo-icon.svg" alt="" className="h-9 w-9" />
          </Link>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-border-strong md:h-1.5" role="presentation">
            <motion.div
              className="zebra-animated h-full rounded-full"
              initial={false}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progresso da pré-análise"
            />
          </div>
          <span className="shrink-0 font-mono text-sm text-text-muted" aria-hidden="true">
            {step} / {total}
          </span>
          <button
            onClick={onExit}
            aria-label="Sair da pré-análise"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="sr-only" aria-live="polite">
          pergunta {step} de {total}
        </p>
      </header>

      {/* Centro: pergunta */}
      <main className="relative z-10 flex flex-1 items-center px-5 py-10 md:px-8">
        <div className="mx-auto w-full max-w-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-taxi-yellow">{question.block}</p>
              <h1 className="mt-3 text-[1.75rem] font-bold leading-[1.15] text-text-primary">{question.text}</h1>
              {question.hint && <p className="mt-3 text-[0.9375rem] leading-relaxed text-text-muted">{question.hint}</p>}

              {question.type === 'choice' && question.choices ? (
                <div className="mt-7 space-y-3" role="radiogroup" aria-label="Opções de resposta">
                  {question.choices.map((choice, i) => {
                    const selected = answers[question.id] === choice.value;
                    return (
                      <motion.button
                        key={choice.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => select(choice.value)}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.08 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                        className={cn(
                          'flex min-h-[56px] w-full items-center gap-4 rounded-xl border p-5 text-left transition-colors duration-200',
                          selected
                            ? 'border-taxi-yellow bg-taxi-yellow/10'
                            : 'border-border-subtle bg-bg-elevated hover:border-taxi-yellow',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-mono text-[0.8125rem] font-bold',
                            selected ? 'bg-taxi-yellow text-bg-base' : 'bg-border-strong text-text-muted',
                          )}
                          aria-hidden="true"
                        >
                          {LETTERS[i]}
                        </span>
                        <span className="flex-1">
                          <span className="block font-medium text-text-primary">{choice.label}</span>
                          {choice.hint && (
                            <span className="mt-1 block text-[0.8125rem] leading-snug text-warn-amber">{choice.hint}</span>
                          )}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-7">
                  <input
                    value={inputValue}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setInputValue(
                        question.inputKind === 'whatsapp'
                          ? maskWhatsapp(raw)
                          : question.inputKind === 'year'
                            ? raw.replace(/\D/g, '').slice(0, 4)
                            : raw,
                      );
                    }}
                    onBlur={() => setTouched(true)}
                    placeholder={
                      question.inputKind === 'whatsapp'
                        ? '(11) 91234-5678'
                        : question.inputKind === 'year'
                          ? '2023'
                          : 'Seu nome'
                    }
                    inputMode={question.inputKind === 'text' ? 'text' : 'numeric'}
                    autoComplete={question.inputKind === 'text' ? 'name' : question.inputKind === 'whatsapp' ? 'tel' : 'off'}
                    autoFocus
                    aria-invalid={touched && !!inputError}
                    className={cn(
                      'h-16 w-full rounded-xl border bg-bg-elevated px-5 text-[1.25rem] text-text-primary outline-none transition-colors placeholder:text-text-faint',
                      question.inputKind !== 'text' && 'font-mono',
                      touched && inputError
                        ? 'border-alert-red'
                        : 'border-border-subtle focus:border-taxi-yellow focus:ring-2 focus:ring-taxi-yellow/40',
                    )}
                  />
                  {touched && inputError && (
                    <p className="mt-2 text-sm text-alert-red" role="alert">
                      {inputError}
                    </p>
                  )}
                  {question.inputKind === 'whatsapp' && (
                    <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-[0.8125rem] leading-snug text-text-muted">
                      <input
                        type="checkbox"
                        checked={lgpd}
                        onChange={(e) => setLgpd(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[#FACC15]"
                      />
                      Aceito ser contatado sobre meu benefício.
                    </label>
                  )}
                  <button
                    type="button"
                    onClick={advanceInput}
                    disabled={!inputValid}
                    className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-taxi-yellow font-bold text-bg-base transition-all duration-200 hover:bg-taxi-yellow-hover hover:shadow-cta-glow disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Continuar
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Rodapé: Voltar + hint de teclado */}
      <footer className="relative z-10 px-5 pb-6 md:px-8">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <button
            onClick={onBack}
            disabled={index === 0}
            className="flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-text-muted transition-colors hover:text-text-primary disabled:invisible"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar
          </button>
          <span className="hidden items-center gap-1.5 text-[0.8125rem] text-text-faint md:flex" aria-hidden="true">
            Enter <CornerDownLeft className="h-3.5 w-3.5" /> para continuar
          </span>
        </div>
      </footer>
    </div>
  );
}
