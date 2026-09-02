type RenderDiagnostic =
  'DaylightHomeScreen' | 'HomeRoute' | 'ProtectedLayout' | 'ProtectedStack';

const counts = new Map<RenderDiagnostic, number>();

export function markRender(name: RenderDiagnostic) {
  if (!__DEV__) return;
  const count = (counts.get(name) ?? 0) + 1;
  counts.set(name, count);
  if (process.env.EXPO_PUBLIC_RENDER_DIAGNOSTICS === 'true') {
    console.log(`[render-diagnostic] ${name}: ${count}`);
  }
}

export function getRenderDiagnostic(name: RenderDiagnostic) {
  return counts.get(name) ?? 0;
}

export function resetRenderDiagnostics() {
  counts.clear();
}
