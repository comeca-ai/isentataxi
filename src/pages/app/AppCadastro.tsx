import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { useForm, Controller, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CloudCheck,
  Info,
  Loader2,
  Lock,
} from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { useAuth } from '@/hooks/useAuth';
import { TETO_PRECO } from '@contracts/constants';
import AppToaster from '@/components/app/AppToaster';
import { estimateEconomy, formatBRL } from '@/components/app/client-utils';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Máscaras
// ---------------------------------------------------------------------------

function maskCPF(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function maskCEP(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

function maskDate(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

function maskBRL(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 9);
  if (!d) return '';
  return Number(d).toLocaleString('pt-BR');
}

function validCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (base: string, factor: number) =>
    base.split('').reduce((acc, n, i) => acc + Number(n) * (factor - i), 0);
  const d1 = ((calc(d.slice(0, 9), 10) * 10) % 11) % 10;
  const d2 = ((calc(d.slice(0, 10), 11) * 10) % 11) % 10;
  return d1 === Number(d[9]) && d2 === Number(d[10]);
}

/** dd/mm/aaaa → aaaa-mm-dd (ou null) */
function brDateToISO(v: string | null | undefined): string | null {
  if (!v) return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function isoToBRDate(v: string | null | undefined): string {
  if (!v) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (!m) return '';
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function isValidBRDate(v: string): boolean {
  const iso = brDateToISO(v);
  if (!iso) return false;
  const d = new Date(`${iso}T12:00:00`);
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const schema = z.object({
  cpf: z
    .string()
    .min(1, 'Informe o CPF')
    .refine(validCPF, 'CPF inválido — confira os dígitos'),
  rg: z.string().max(20).optional(),
  birthDate: z
    .string()
    .min(1, 'Informe a data de nascimento')
    .refine(isValidBRDate, 'Data inválida ou no futuro'),
  phone: z
    .string()
    .min(1, 'Informe o WhatsApp')
    .refine((v) => v.replace(/\D/g, '').length >= 10, 'WhatsApp incompleto'),
  cnhNumber: z
    .string()
    .min(1, 'Informe o número da CNH')
    .refine((v) => v.replace(/\D/g, '').length === 11, 'A CNH tem 11 dígitos'),
  cnhCategory: z.string(),
  cnhEAR: z.boolean(),
  alvaraNumber: z.string().min(1, 'Informe o número do alvará'),
  alvaraExpiry: z
    .string()
    .optional()
    .refine((v) => !v || /^(\d{2})\/(\d{2})\/(\d{4})$/.test(v), 'Use o formato dd/mm/aaaa'),
  alvaraSituacao: z.string().optional(),
  anoPrimeiroAlvara: z.string().optional(),
  cursos: z.array(z.string()).optional(),
  cep: z
    .string()
    .min(1, 'Informe o CEP')
    .refine((v) => v.replace(/\D/g, '').length === 8, 'CEP incompleto'),
  street: z.string().min(1, 'Informe o logradouro'),
  number: z.string().min(1, 'Informe o número'),
  complement: z.string().optional(),
  district: z.string().min(1, 'Informe o bairro'),
  city: z.string().min(1),
  state: z.string().length(2),
  comprovanteRecente: z.boolean().optional(),
  intendedVehicleId: z.number().int().positive().nullable().optional(),
  intendedPrice: z.number().int().positive().nullable().optional(),
  concessionaria: z.string().optional(),
  declaracao: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

const STEPS = [
  { n: 1, label: 'Dados pessoais' },
  { n: 2, label: 'CNH' },
  { n: 3, label: 'Alvará' },
  { n: 4, label: 'Endereço' },
  { n: 5, label: 'Veículo + revisão' },
] as const;

const STEP_FIELDS: Record<number, FieldPath<FormValues>[]> = {
  1: ['cpf', 'birthDate', 'phone'],
  2: ['cnhNumber'],
  3: ['alvaraNumber', 'alvaraExpiry'],
  4: ['cep', 'street', 'number', 'district'],
  5: [],
};

const CURSOS = ['Conduta no trânsito', 'Primeiros socorros', 'Mecânica básica', 'Relações humanas'];

/** Campos persistidos usados no % de completude e no autosave */
const PERSISTED_KEYS = [
  'cpf', 'rg', 'birthDate', 'phone', 'cnhNumber', 'cnhEAR', 'alvaraNumber', 'alvaraExpiry',
  'cep', 'street', 'number', 'district', 'intendedVehicleId', 'intendedPrice',
] as const;

const REQUIRED_FOR_SAVE: FieldPath<FormValues>[] = [
  'cpf', 'birthDate', 'phone', 'cnhNumber', 'alvaraNumber', 'cep', 'street', 'number', 'district',
];

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

const inputCls =
  'h-12 w-full rounded-xl border border-border-subtle bg-bg-elevated px-4 text-text-primary placeholder:text-text-faint transition-colors focus:border-taxi-yellow focus:outline-none';
const inputErrCls = 'border-alert-red';
const labelCls = 'mb-1.5 block text-sm font-semibold text-text-primary';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-[0.8125rem] text-alert-red">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {message}
    </p>
  );
}

function Callout({ tone, children }: { tone: 'blue' | 'amber' | 'red'; children: React.ReactNode }) {
  const styles = {
    blue: 'border-info-blue/40 bg-info-blue/10 text-info-blue',
    amber: 'border-warn-amber/40 bg-warn-amber/10 text-warn-amber',
    red: 'border-alert-red/40 bg-alert-red/10 text-alert-red',
  }[tone];
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn('overflow-hidden rounded-xl border', styles)}
    >
      <div className="flex items-start gap-2 p-4 text-sm">{children}</div>
    </motion.div>
  );
}

function Toggle({
  value,
  onChange,
  labels = ['Sim', 'Não'],
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  labels?: [string, string];
}) {
  return (
    <div className="inline-flex rounded-full border border-border-subtle bg-bg-elevated p-1">
      {[true, false].map((v, i) => (
        <motion.button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          whileTap={{ scale: 0.96 }}
          className={cn(
            'min-w-24 rounded-full px-5 py-2.5 text-sm font-bold transition-colors',
            value === v ? 'bg-taxi-yellow text-bg-base' : 'text-text-muted hover:text-text-primary',
          )}
          aria-pressed={value === v}
        >
          {labels[i]}
        </motion.button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export default function AppCadastro() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const profileQ = trpc.profile.get.useQuery();
  const vehiclesQ = trpc.vehicles.list.useQuery();

  const [step, setStep] = useState(1);
  const [maxVisited, setMaxVisited] = useState(1);
  const [done, setDone] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [flashed, setFlashed] = useState<string[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileLoaded = useRef(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      cpf: '', rg: '', birthDate: '', phone: '',
      cnhNumber: '', cnhCategory: 'B', cnhEAR: true,
      alvaraNumber: '', alvaraExpiry: '', alvaraSituacao: 'ativo', anoPrimeiroAlvara: '', cursos: [],
      cep: '', street: '', number: '', complement: '', district: '', city: 'São Paulo', state: 'SP',
      comprovanteRecente: true,
      intendedVehicleId: null, intendedPrice: null, concessionaria: '', declaracao: false,
    },
  });

  const { register, control, trigger, watch, setValue, getValues, reset, formState: { errors } } = form;

  // Pré-preenche com o perfil salvo
  useEffect(() => {
    if (!profileQ.data || profileLoaded.current) return;
    profileLoaded.current = true;
    const p = profileQ.data;
    reset({
      cpf: p.cpf ?? '',
      rg: p.rg ?? '',
      birthDate: isoToBRDate(p.birthDate),
      phone: p.phone ?? '',
      cnhNumber: p.cnhNumber ?? '',
      cnhCategory: p.cnhCategory ?? 'B',
      cnhEAR: p.cnhEAR ?? true,
      alvaraNumber: p.alvaraNumber ?? '',
      alvaraExpiry: isoToBRDate(p.alvaraExpiry),
      alvaraSituacao: 'ativo',
      anoPrimeiroAlvara: '',
      cursos: [],
      cep: p.cep ?? '',
      street: p.street ?? '',
      number: p.number ?? '',
      complement: p.complement ?? '',
      district: p.district ?? '',
      city: p.city ?? 'São Paulo',
      state: p.state ?? 'SP',
      comprovanteRecente: true,
      intendedVehicleId: p.intendedVehicleId ?? null,
      intendedPrice: p.intendedPrice ?? null,
      concessionaria: '',
      declaracao: false,
    });
  }, [profileQ.data, reset]);

  const upsert = trpc.profile.upsert.useMutation({
    onSuccess: async () => {
      await utils.profile.get.invalidate();
    },
  });

  const buildPayload = (v: FormValues) => ({
    cpf: v.cpf,
    rg: v.rg || null,
    birthDate: brDateToISO(v.birthDate),
    phone: v.phone,
    cnhNumber: v.cnhNumber,
    cnhCategory: v.cnhCategory,
    cnhEAR: v.cnhEAR,
    alvaraNumber: v.alvaraNumber,
    alvaraCity: 'São Paulo',
    alvaraExpiry: brDateToISO(v.alvaraExpiry ?? ''),
    cep: v.cep,
    street: v.street,
    number: v.number,
    complement: v.complement || null,
    district: v.district,
    city: v.city || 'São Paulo',
    state: 'SP',
    intendedVehicleId: v.intendedVehicleId ?? null,
    intendedPrice: v.intendedPrice ?? null,
  });

  // Autosave (debounce 800ms) — só quando os campos obrigatórios do backend estão válidos
  const watched = watch();
  useEffect(() => {
    if (!profileLoaded.current && profileQ.data) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const v = getValues();
      const ok = await trigger(REQUIRED_FOR_SAVE);
      if (!ok) return;
      upsert.mutate(buildPayload(v), {
        onSuccess: () => {
          const now = new Date();
          setSavedAt(
            `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
          );
          setShowSaved(true);
          setTimeout(() => setShowSaved(false), 1500);
        },
      });
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watched)]);

  const completeness = useMemo(() => {
    const filled = PERSISTED_KEYS.filter((k) => {
      const v = watched[k];
      return v !== null && v !== undefined && v !== '';
    }).length;
    return Math.round((filled / PERSISTED_KEYS.length) * 100);
  }, [watched]);

  const goTo = (n: number) => {
    setStep(n);
    setMaxVisited((m) => Math.max(m, n));
    window.history.replaceState(null, '', `#passo-${n}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const next = async () => {
    const ok = await trigger(STEP_FIELDS[step] ?? []);
    if (!ok) {
      toast.error('Revise os campos marcados.');
      const firstErr = document.querySelector('[data-error="true"]');
      (firstErr as HTMLElement | null)?.focus();
      return;
    }
    if (step < 5) goTo(step + 1);
  };

  // CEP autocomplete (ViaCEP)
  const lookupCep = async (cepMasked: string) => {
    const cep = cepMasked.replace(/\D/g, '');
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = (await res.json()) as { logradouro?: string; bairro?: string; localidade?: string; erro?: boolean };
      if (!data.erro) {
        const filled: string[] = [];
        if (data.logradouro) { setValue('street', data.logradouro, { shouldDirty: true }); filled.push('street'); }
        if (data.bairro) { setValue('district', data.bairro, { shouldDirty: true }); filled.push('district'); }
        if (data.localidade) { setValue('city', data.localidade, { shouldDirty: true }); filled.push('city'); }
        if (filled.length) {
          setFlashed(filled);
          setTimeout(() => setFlashed([]), 600);
        }
      }
    } catch {
      /* CEP offline: usuário preenche manual */
    } finally {
      setCepLoading(false);
    }
  };

  const finish = async () => {
    const ok = await trigger();
    if (!watched.declaracao) {
      toast.error('Confirme a declaração final para concluir.');
      return;
    }
    if (!ok) {
      toast.error('Revise os campos marcados.');
      for (let s = 1; s <= 5; s++) {
        const fields = STEP_FIELDS[s] ?? [];
        const valid = await trigger(fields);
        if (!valid) { goTo(s); return; }
      }
      return;
    }
    upsert.mutate(buildPayload(getValues()), {
      onSuccess: async () => {
        toast.success('Cadastro salvo!');
        await utils.profile.get.invalidate();
        await utils.process.mine.invalidate();
        setDone(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      onError: (err) => toast.error(err.message || 'Não foi possível salvar. Tente novamente.'),
    });
  };

  if (profileQ.isLoading) {
    return (
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]" aria-label="Carregando cadastro">
        <div className="hidden h-72 animate-pulse rounded-2xl bg-bg-surface lg:block" />
        <div className="h-[520px] animate-pulse rounded-2xl border border-border-subtle bg-bg-surface" />
      </div>
    );
  }

  const vehicles = vehiclesQ.data ?? [];
  const selectedVehicle = vehicles.find((v) => v.id === watched.intendedVehicleId);
  const priceForEconomy = watched.intendedPrice ?? selectedVehicle?.priceRef ?? null;
  const economy = selectedVehicle && priceForEconomy ? estimateEconomy(priceForEconomy, selectedVehicle.ipiRate) : null;
  const pendencias: string[] = [];
  if (!watched.cnhEAR) pendencias.push('EAR pendente na CNH');
  if ((watched.cursos ?? []).length < CURSOS.length) pendencias.push('Cursos obrigatórios incompletos');
  if (watched.alvaraSituacao === 'suspenso') pendencias.push('Alvará suspenso');

  // -------------------------------------------------------------------------
  // Success state
  // -------------------------------------------------------------------------
  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-border-subtle bg-bg-surface p-10 text-center"
      >
        <AppToaster />
        <motion.img
          src="/success-check.svg"
          alt=""
          className="h-32 w-32"
          initial={{ scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
        />
        <h1 className="mt-6 text-2xl font-bold text-text-primary">Cadastro completo!</h1>
        <p className="mt-2 text-text-muted">
          Suas informações já alimentam o SP156 e os requerimentos. Próximo passo: enviar os documentos.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/app/documentos"
            className="inline-flex items-center gap-2 rounded-full bg-taxi-yellow px-6 py-3 font-bold text-bg-base transition-all hover:bg-taxi-yellow-hover hover:shadow-cta-glow"
          >
            Enviar documentos <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => navigate('/app')}
            className="rounded-full border border-border-strong px-6 py-3 font-bold text-text-primary transition-colors hover:bg-taxi-yellow/5"
          >
            Ir para o painel
          </button>
        </div>
      </motion.div>
    );
  }

  const flashCls = (name: string) => (flashed.includes(name) ? 'bg-taxi-yellow/10 transition-colors duration-500' : '');

  return (
    <div className="mx-auto max-w-5xl">
      <AppToaster />

      {/* Mobile: barra de passo */}
      <div className="mb-4 rounded-xl border border-border-subtle bg-bg-surface p-4 lg:hidden">
        <p className="text-sm font-bold text-text-primary">
          Passo {step} de 5 — {STEPS[step - 1]!.label}
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border-subtle">
          <div className="zebra h-full rounded-full transition-all duration-300" style={{ width: `${(step / 5) * 100}%` }} />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Stepper vertical (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 rounded-2xl border border-border-subtle bg-bg-surface p-6">
            <p className="font-mono text-sm text-text-muted">{completeness}% completo</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border-subtle">
              <motion.div
                className="zebra h-full rounded-full"
                animate={{ width: `${completeness}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
            <ol className="mt-6 space-y-1">
              {STEPS.map((s) => {
                const completed = s.n < step || (completeness === 100 && s.n <= step);
                const current = s.n === step;
                const clickable = s.n <= maxVisited;
                return (
                  <li key={s.n}>
                    <button
                      type="button"
                      disabled={!clickable}
                      onClick={() => goTo(s.n)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm transition-colors',
                        clickable ? 'hover:bg-bg-elevated' : 'cursor-not-allowed opacity-60',
                      )}
                    >
                      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                        {current && (
                          <motion.span
                            className="absolute inset-0 rounded-full bg-taxi-yellow"
                            animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
                            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                            aria-hidden="true"
                          />
                        )}
                        <motion.span
                          layout
                          className={cn(
                            'relative flex h-8 w-8 items-center justify-center rounded-full border-2 font-mono text-xs font-bold',
                            completed
                              ? 'border-taxi-yellow bg-taxi-yellow text-bg-base'
                              : current
                                ? 'border-taxi-yellow bg-transparent text-taxi-yellow'
                                : 'border-border-strong text-text-faint',
                          )}
                        >
                          {completed ? <Check className="h-4 w-4" strokeWidth={3} /> : s.n}
                        </motion.span>
                      </span>
                      <span className={cn('font-medium', current ? 'text-text-primary' : 'text-text-muted')}>
                        {s.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>

        {/* Card do passo */}
        <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 lg:p-10">
          {/* indicador de autosave */}
          <div className="mb-4 flex h-5 items-center justify-end gap-2 font-mono text-xs text-text-faint">
            <AnimatePresence>
              {showSaved && (
                <motion.span
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1 text-money-green"
                >
                  <CloudCheck className="h-3.5 w-3.5" /> Salvo às {savedAt}
                </motion.span>
              )}
            </AnimatePresence>
            {!showSaved && savedAt && <span>Salvo às {savedAt}</span>}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
            >
              {/* ---------------- Passo 1 — Dados pessoais ---------------- */}
              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-text-primary">Dados pessoais</h2>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className={labelCls}>Nome completo</label>
                      <input className={cn(inputCls, 'opacity-70')} value={user?.name ?? ''} readOnly aria-readonly />
                    </div>
                    <div>
                      <label htmlFor="cpf" className={labelCls}>CPF*</label>
                      <input
                        id="cpf"
                        inputMode="numeric"
                        placeholder="000.000.000-00"
                        data-error={!!errors.cpf}
                        className={cn(inputCls, errors.cpf && inputErrCls)}
                        {...register('cpf', { onChange: (e) => setValue('cpf', maskCPF(e.target.value)) })}
                      />
                      <FieldError message={errors.cpf?.message} />
                    </div>
                    <div>
                      <label htmlFor="rg" className={labelCls}>RG + órgão emissor</label>
                      <input id="rg" placeholder="00.000.000-0 SSP" className={inputCls} {...register('rg')} />
                      <FieldError message={errors.rg?.message} />
                    </div>
                    <div>
                      <label htmlFor="birthDate" className={labelCls}>Data de nascimento*</label>
                      <input
                        id="birthDate"
                        inputMode="numeric"
                        placeholder="dd/mm/aaaa"
                        data-error={!!errors.birthDate}
                        className={cn(inputCls, errors.birthDate && inputErrCls)}
                        {...register('birthDate', { onChange: (e) => setValue('birthDate', maskDate(e.target.value)) })}
                      />
                      <FieldError message={errors.birthDate?.message} />
                    </div>
                    <div>
                      <label htmlFor="phone" className={labelCls}>WhatsApp*</label>
                      <input
                        id="phone"
                        inputMode="tel"
                        placeholder="(11) 9xxxx-xxxx"
                        data-error={!!errors.phone}
                        className={cn(inputCls, errors.phone && inputErrCls)}
                        {...register('phone', { onChange: (e) => setValue('phone', maskPhone(e.target.value)) })}
                      />
                      <FieldError message={errors.phone?.message} />
                    </div>
                    <div>
                      <label className={labelCls}>E-mail*</label>
                      <input className={cn(inputCls, 'opacity-70')} value={user?.email ?? ''} readOnly aria-readonly />
                      <p className="mt-1 text-[0.8125rem] text-text-faint">Usado para avisos das etapas</p>
                    </div>
                  </div>
                  <Callout tone="blue">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Esses dados alimentam o SP156 e o requerimento da Receita. Confira com atenção — erro de CPF atrasa o protocolo.
                    </span>
                  </Callout>
                </div>
              )}

              {/* ---------------- Passo 2 — CNH ---------------- */}
              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-text-primary">CNH</h2>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label htmlFor="cnhNumber" className={labelCls}>Número da CNH*</label>
                      <input
                        id="cnhNumber"
                        inputMode="numeric"
                        placeholder="11 dígitos"
                        data-error={!!errors.cnhNumber}
                        className={cn(inputCls, errors.cnhNumber && inputErrCls)}
                        {...register('cnhNumber', {
                          onChange: (e) => setValue('cnhNumber', e.target.value.replace(/\D/g, '').slice(0, 11)),
                        })}
                      />
                      <FieldError message={errors.cnhNumber?.message} />
                    </div>
                    <div>
                      <label htmlFor="cnhCategory" className={labelCls}>Categoria</label>
                      <select id="cnhCategory" className={inputCls} {...register('cnhCategory')}>
                        <option value="B">B</option>
                        <option value="AB">AB</option>
                        <option value="outras">Outras</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>EAR — exerce atividade remunerada?*</label>
                    <Controller
                      control={control}
                      name="cnhEAR"
                      render={({ field }) => <Toggle value={field.value} onChange={field.onChange} />}
                    />
                  </div>
                  <AnimatePresence>
                    {!watched.cnhEAR && (
                      <Callout tone="amber">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                          Sem EAR o processo trava no Detran. Orientação: agende a alteração no Detran-SP — nosso suporte te ajuda.
                          <span className="ml-2 inline-block rounded-full border border-warn-amber/50 px-2 py-0.5 font-mono text-[0.7rem]">
                            pendência registrada
                          </span>
                        </span>
                      </Callout>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* ---------------- Passo 3 — Alvará ---------------- */}
              {step === 3 && (
                <div className="grid gap-8 xl:grid-cols-[1fr_220px]">
                  <div className="space-y-5">
                    <h2 className="text-xl font-bold text-text-primary">Alvará de taxista (SP)</h2>
                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label htmlFor="alvaraNumber" className={labelCls}>Número do alvará (SVAT)*</label>
                        <input
                          id="alvaraNumber"
                          data-error={!!errors.alvaraNumber}
                          className={cn(inputCls, errors.alvaraNumber && inputErrCls)}
                          {...register('alvaraNumber')}
                        />
                        <FieldError message={errors.alvaraNumber?.message} />
                      </div>
                      <div>
                        <label htmlFor="alvaraExpiry" className={labelCls}>Validade</label>
                        <input
                          id="alvaraExpiry"
                          inputMode="numeric"
                          placeholder="dd/mm/aaaa"
                          data-error={!!errors.alvaraExpiry}
                          className={cn(inputCls, errors.alvaraExpiry && inputErrCls)}
                          {...register('alvaraExpiry', { onChange: (e) => setValue('alvaraExpiry', maskDate(e.target.value)) })}
                        />
                        <FieldError message={errors.alvaraExpiry?.message} />
                      </div>
                      <div>
                        <label htmlFor="alvaraSituacao" className={labelCls}>Situação</label>
                        <select id="alvaraSituacao" className={inputCls} {...register('alvaraSituacao')}>
                          <option value="ativo">Ativo</option>
                          <option value="renovacao">Em renovação</option>
                          <option value="suspenso">Suspenso</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="anoPrimeiroAlvara" className={labelCls}>Ano do primeiro alvará</label>
                        <input
                          id="anoPrimeiroAlvara"
                          inputMode="numeric"
                          placeholder="ex.: 2015"
                          className={inputCls}
                          {...register('anoPrimeiroAlvara', {
                            onChange: (e) => setValue('anoPrimeiroAlvara', e.target.value.replace(/\D/g, '').slice(0, 4)),
                          })}
                        />
                        <p className="mt-1 text-[0.8125rem] text-text-faint">
                          Vale a decisão do STJ: não precisa comprovar exercício anterior.
                        </p>
                      </div>
                    </div>
                    <AnimatePresence>
                      {watched.alvaraSituacao === 'suspenso' && (
                        <Callout tone="red">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>
                            Alvará suspenso trava o protocolo na Prefeitura. Regularize junto ao DTP — marcamos uma pendência no seu processo e o suporte te orienta.
                          </span>
                        </Callout>
                      )}
                    </AnimatePresence>
                    <div>
                      <label className={labelCls}>Cursos obrigatórios concluídos*</label>
                      <Controller
                        control={control}
                        name="cursos"
                        render={({ field }) => (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {CURSOS.map((curso) => {
                              const checked = (field.value ?? []).includes(curso);
                              return (
                                <button
                                  key={curso}
                                  type="button"
                                  onClick={() =>
                                    field.onChange(
                                      checked
                                        ? (field.value ?? []).filter((c) => c !== curso)
                                        : [...(field.value ?? []), curso],
                                    )
                                  }
                                  className={cn(
                                    'flex items-center gap-3 rounded-xl border p-3.5 text-left text-sm font-medium transition-colors',
                                    checked
                                      ? 'border-taxi-yellow/60 bg-taxi-yellow/5 text-text-primary'
                                      : 'border-border-subtle bg-bg-elevated text-text-muted hover:border-border-strong',
                                  )}
                                  aria-pressed={checked}
                                >
                                  <span
                                    className={cn(
                                      'flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors',
                                      checked ? 'border-taxi-yellow bg-taxi-yellow' : 'border-border-strong',
                                    )}
                                  >
                                    {checked && <Check className="h-3.5 w-3.5 text-bg-base" strokeWidth={3} />}
                                  </span>
                                  {curso}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      />
                    </div>
                  </div>
                  <div className="hidden xl:block">
                    <div className="rounded-2xl border border-border-subtle bg-bg-elevated p-4">
                      <img src="/stj-illustration.png" alt="" className="w-full rounded-xl" loading="lazy" />
                      <p className="mt-3 text-sm text-text-muted">
                        “Alvará válido basta — <span className="font-mono text-taxi-yellow">STJ REsp 2.018.676</span>.”
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- Passo 4 — Endereço ---------------- */}
              {step === 4 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-text-primary">Endereço</h2>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label htmlFor="cep" className={labelCls}>CEP*</label>
                      <div className="relative">
                        <input
                          id="cep"
                          inputMode="numeric"
                          placeholder="00000-000"
                          data-error={!!errors.cep}
                          className={cn(inputCls, errors.cep && inputErrCls)}
                          {...register('cep', {
                            onChange: (e) => {
                              const masked = maskCEP(e.target.value);
                              setValue('cep', masked);
                              if (masked.replace(/\D/g, '').length === 8) void lookupCep(masked);
                            },
                          })}
                        />
                        {cepLoading && (
                          <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-taxi-yellow" />
                        )}
                      </div>
                      <FieldError message={errors.cep?.message} />
                    </div>
                    <div className="md:col-span-1">
                      <label htmlFor="street" className={labelCls}>Logradouro*</label>
                      {cepLoading ? (
                        <div className="h-12 animate-pulse rounded-xl bg-bg-elevated" />
                      ) : (
                        <input
                          id="street"
                          data-error={!!errors.street}
                          className={cn(inputCls, errors.street && inputErrCls, flashCls('street'))}
                          {...register('street')}
                        />
                      )}
                      <FieldError message={errors.street?.message} />
                    </div>
                    <div>
                      <label htmlFor="number" className={labelCls}>Número*</label>
                      <input
                        id="number"
                        inputMode="numeric"
                        data-error={!!errors.number}
                        className={cn(inputCls, errors.number && inputErrCls)}
                        {...register('number')}
                      />
                      <FieldError message={errors.number?.message} />
                    </div>
                    <div>
                      <label htmlFor="complement" className={labelCls}>Complemento</label>
                      <input id="complement" className={inputCls} {...register('complement')} />
                    </div>
                    <div>
                      <label htmlFor="district" className={labelCls}>Bairro*</label>
                      <input
                        id="district"
                        data-error={!!errors.district}
                        className={cn(inputCls, errors.district && inputErrCls, flashCls('district'))}
                        {...register('district')}
                      />
                      <FieldError message={errors.district?.message} />
                    </div>
                    <div className="grid grid-cols-[1fr_96px] gap-3">
                      <div>
                        <label htmlFor="city" className={labelCls}>Cidade*</label>
                        <input id="city" className={cn(inputCls, flashCls('city'))} {...register('city')} />
                      </div>
                      <div>
                        <label htmlFor="state" className={labelCls}>UF*</label>
                        <input id="state" value="SP" readOnly aria-readonly className={cn(inputCls, 'opacity-70')} />
                        <p className="mt-1 text-[0.7rem] text-text-faint">Atendemos só SP capital</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Comprovante recente (até 90 dias)?</label>
                    <Controller
                      control={control}
                      name="comprovanteRecente"
                      render={({ field }) => <Toggle value={field.value ?? true} onChange={field.onChange} />}
                    />
                    {watched.comprovanteRecente === false && (
                      <p className="mt-2 text-sm text-warn-amber">
                        Sem problema — criamos um lembrete em <Link to="/app/documentos" className="underline">Meus documentos</Link>.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ---------------- Passo 5 — Veículo + Revisão ---------------- */}
              {step === 5 && (
                <div className="space-y-8">
                  <div className="space-y-5">
                    <h2 className="text-xl font-bold text-text-primary">Veículo pretendido</h2>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      {vehicles.map((v) => {
                        const selected = watched.intendedVehicleId === v.id;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => {
                              setValue('intendedVehicleId', v.id, { shouldDirty: true });
                              setValue('intendedPrice', v.priceRef, { shouldDirty: true });
                            }}
                            className={cn(
                              'overflow-hidden rounded-xl border text-left transition-all',
                              selected
                                ? 'border-taxi-yellow ring-2 ring-taxi-yellow/50'
                                : 'border-border-subtle hover:border-border-strong',
                            )}
                            aria-pressed={selected}
                          >
                            <img src={v.imageUrl} alt={v.name} className="aspect-[8/5] w-full object-cover" loading="lazy" />
                            <div className="bg-bg-elevated p-2.5">
                              <p className="truncate text-xs font-semibold text-text-primary">{v.name}</p>
                              <p className="font-mono text-[0.7rem] text-text-faint">{formatBRL(v.priceRef)}</p>
                            </div>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          setValue('intendedVehicleId', null, { shouldDirty: true });
                          setValue('intendedPrice', null, { shouldDirty: true });
                        }}
                        className={cn(
                          'flex min-h-28 items-center justify-center rounded-xl border border-dashed p-4 text-center text-sm font-medium transition-colors',
                          watched.intendedVehicleId === null
                            ? 'border-taxi-yellow text-taxi-yellow'
                            : 'border-border-strong text-text-muted hover:text-text-primary',
                        )}
                        aria-pressed={watched.intendedVehicleId === null}
                      >
                        Ainda não decidi
                      </button>
                    </div>

                    {selectedVehicle && (
                      <div className="grid gap-5 md:grid-cols-2">
                        <div>
                          <label htmlFor="intendedPrice" className={labelCls}>Valor estimado (R$)</label>
                          <input
                            id="intendedPrice"
                            inputMode="numeric"
                            className={cn(inputCls, (watched.intendedPrice ?? 0) > TETO_PRECO && inputErrCls)}
                            value={watched.intendedPrice ? maskBRL(String(watched.intendedPrice)) : ''}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '');
                              setValue('intendedPrice', digits ? Number(digits) : null, { shouldDirty: true });
                            }}
                          />
                          {(watched.intendedPrice ?? 0) > TETO_PRECO && (
                            <p className="mt-1 flex items-center gap-1 text-[0.8125rem] text-alert-red">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> Acima do teto de isenção ({formatBRL(TETO_PRECO)}).
                            </p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="concessionaria" className={labelCls}>Concessionária pretendida (opcional)</label>
                          <input id="concessionaria" className={inputCls} {...register('concessionaria')} />
                        </div>
                      </div>
                    )}
                    {economy !== null && (
                      <p className="font-mono text-lg font-bold text-money-green">
                        Economia estimada: {formatBRL(economy)}
                        <span className="ml-2 font-sans text-xs font-normal text-text-faint">estimativa IPI + ICMS</span>
                      </p>
                    )}
                  </div>

                  {/* 5b — Revisão */}
                  <div className="space-y-5 border-t border-border-subtle pt-6">
                    <h3 className="text-lg font-bold text-text-primary">Revisão</h3>
                    {pendencias.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {pendencias.map((p) => (
                          <span
                            key={p}
                            className="rounded-full border border-warn-amber/40 bg-warn-amber/10 px-3 py-1 font-mono text-xs text-warn-amber"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                    <dl className="space-y-4">
                      {[
                        {
                          step: 1, title: 'Dados pessoais',
                          rows: [
                            ['CPF', watched.cpf], ['Nascimento', watched.birthDate], ['WhatsApp', watched.phone],
                          ],
                        },
                        {
                          step: 2, title: 'CNH',
                          rows: [
                            ['Número', watched.cnhNumber], ['Categoria', watched.cnhCategory],
                            ['EAR', watched.cnhEAR ? 'Sim' : 'Não'],
                          ],
                        },
                        {
                          step: 3, title: 'Alvará',
                          rows: [
                            ['Número', watched.alvaraNumber], ['Validade', watched.alvaraExpiry || '—'],
                            ['Cursos', `${(watched.cursos ?? []).length}/${CURSOS.length}`],
                          ],
                        },
                        {
                          step: 4, title: 'Endereço',
                          rows: [
                            ['CEP', watched.cep],
                            ['Endereço', [watched.street, watched.number].filter(Boolean).join(', ') || '—'],
                            ['Bairro', watched.district],
                          ],
                        },
                        {
                          step: 5, title: 'Veículo',
                          rows: [
                            ['Modelo', selectedVehicle?.name ?? 'Ainda não decidi'],
                            ['Valor', watched.intendedPrice ? formatBRL(watched.intendedPrice) : '—'],
                          ],
                        },
                      ].map((block) => (
                        <div key={block.step} className="rounded-xl border border-border-subtle bg-bg-elevated p-4">
                          <div className="flex items-center justify-between">
                            <dt className="text-sm font-bold text-text-primary">{block.title}</dt>
                            <button
                              type="button"
                              onClick={() => goTo(block.step)}
                              className="text-sm font-medium text-taxi-yellow hover:underline"
                            >
                              Editar
                            </button>
                          </div>
                          <div className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                            {block.rows.map(([k, v]) => (
                              <div key={k} className="flex justify-between gap-3 text-sm">
                                <span className="text-text-muted">{k}</span>
                                <span className="truncate font-mono text-text-primary">{v || '—'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </dl>

                    <Controller
                      control={control}
                      name="declaracao"
                      render={({ field }) => (
                        <button
                          type="button"
                          onClick={() => field.onChange(!field.value)}
                          className="flex items-start gap-3 rounded-xl border border-border-subtle bg-bg-elevated p-4 text-left"
                          aria-pressed={field.value}
                        >
                          <span
                            className={cn(
                              'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                              field.value ? 'border-taxi-yellow bg-taxi-yellow' : 'border-border-strong',
                            )}
                          >
                            {field.value && <Check className="h-3.5 w-3.5 text-bg-base" strokeWidth={3} />}
                          </span>
                          <span className="text-sm text-text-muted">
                            Declaro que as informações são verdadeiras e autorizo o uso para protocolos do meu benefício (LGPD).*
                          </span>
                        </button>
                      )}
                    />

                    <button
                      type="button"
                      onClick={finish}
                      disabled={upsert.isPending}
                      className={cn(
                        'flex h-14 w-full items-center justify-center gap-2 rounded-full bg-taxi-yellow text-lg font-bold text-bg-base transition-all',
                        upsert.isPending ? 'opacity-60' : 'hover:bg-taxi-yellow-hover hover:shadow-cta-glow',
                      )}
                    >
                      {upsert.isPending && <Loader2 className="h-5 w-5 animate-spin" />}
                      Concluir cadastro
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Rodapé do card */}
          <div className="mt-8 flex items-center justify-between border-t border-border-subtle pt-5">
            <button
              type="button"
              onClick={() => step > 1 && goTo(step - 1)}
              disabled={step === 1}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors',
                step === 1 ? 'cursor-not-allowed text-text-faint opacity-50' : 'text-text-muted hover:text-text-primary',
              )}
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <p className="hidden items-center gap-1.5 text-xs text-text-faint sm:flex">
              <Lock className="h-3.5 w-3.5" /> Seus dados estão criptografados
            </p>
            {step < 5 && (
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-2 rounded-full bg-taxi-yellow px-6 py-3 font-bold text-bg-base transition-all hover:bg-taxi-yellow-hover hover:shadow-cta-glow"
              >
                Continuar <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
