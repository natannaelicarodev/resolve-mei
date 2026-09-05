export interface AppError {
  code: 'auth' | 'validation' | 'network' | 'storage' | 'unknown';
  message: string;
}

interface SafeErrorDiagnostic {
  category: AppError['code'];
  name: string;
  code?: string;
  status?: number;
}

export function logDevelopmentError(
  context: string,
  error: unknown,
  componentStack?: string | null,
): void {
  if (!__DEV__) return;

  const diagnostic = getSafeErrorDiagnostic(error);
  console.error(context, {
    ...diagnostic,
    ...(componentStack ? { componentStack } : {}),
  });
}

export function normalizeError(error: unknown): AppError {
  if (isErrorWithCode(error, 'invalid_credentials')) {
    return { code: 'auth', message: 'E-mail ou senha inválidos.' };
  }

  if (isErrorWithCode(error, 'email_not_confirmed')) {
    return { code: 'auth', message: 'Confirme seu e-mail antes de entrar.' };
  }

  if (isErrorWithCode(error, 'onboarding_migration_required')) {
    return {
      code: 'storage',
      message:
        'Atualização do sistema pendente. Aplique a migração do onboarding e tente novamente.',
    };
  }

  if (isErrorWithStatus(error, 429)) {
    return {
      code: 'auth',
      message: 'Muitas tentativas. Aguarde e tente novamente.',
    };
  }

  if (error instanceof TypeError) {
    return {
      code: 'network',
      message: 'Não foi possível concluir a comunicação.',
    };
  }

  if (error instanceof Error && error.name === 'ZodError') {
    return { code: 'validation', message: 'Revise os dados informados.' };
  }

  return {
    code: 'unknown',
    message: 'Ocorreu um erro inesperado. Tente novamente.',
  };
}

function isErrorWithCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}

function isErrorWithStatus(error: unknown, status: number): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    error.status === status
  );
}

function getSafeErrorDiagnostic(error: unknown): SafeErrorDiagnostic {
  const diagnostic: SafeErrorDiagnostic = {
    category: normalizeError(error).code,
    name: error instanceof Error ? error.name : 'UnknownError',
  };

  if (typeof error !== 'object' || error === null) return diagnostic;

  if (
    'code' in error &&
    typeof error.code === 'string' &&
    /^[a-z0-9_]{1,64}$/i.test(error.code)
  ) {
    diagnostic.code = error.code;
  }
  if (
    'status' in error &&
    typeof error.status === 'number' &&
    Number.isInteger(error.status)
  ) {
    diagnostic.status = error.status;
  }

  return diagnostic;
}
