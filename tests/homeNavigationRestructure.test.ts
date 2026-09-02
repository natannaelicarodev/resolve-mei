import fs from 'node:fs';
import path from 'node:path';
import { darkColors, lightColors } from '@/theme';
import { createDayPalette } from '@/features/daylight/theme';

const source=(file:string)=>fs.readFileSync(path.join(process.cwd(),file),'utf8');

describe('home and primary navigation restructure',()=>{
  it('renders the approved five navigation positions',()=>{
    const nav=source('src/features/navigation/ProtectedNavigation.tsx');
    for(const label of ['Início','Agenda','Clientes','Perfil']) expect(nav).toContain(`label="${label}"`);
    expect(nav).toContain('accessibilityLabel="Criar"');
    expect(nav).toContain("router.navigate('/home')");
    expect(nav).toContain("router.navigate('/agenda')");
    expect(nav).toContain("router.navigate('/clients')");
    expect(nav).toContain("router.navigate('/profile')");
    expect(nav).not.toMatch(/router\.replace\('\/(home|agenda|clients|profile)'\)/);
  });

  it('keeps finance queries and figures off the Home route',()=>{
    const route=source('app/(protected)/home.tsx');
    const home=source('src/features/daylight/DaylightHomeScreen.tsx');
    expect(route).not.toContain('useTotalReceivable');
    expect(route).not.toContain('useExpenseMonth');
    expect(home).not.toContain('A receber');
    expect(home).not.toContain('Resultado do mês');
  });

  it('normalizes the optical size of the Expenses artwork',()=>{
    const home=source('src/features/daylight/DaylightHomeScreen.tsx');
    const primitives=source('src/features/daylight/DaylightPrimitives.tsx');
    expect(home).toMatch(/id: 'expenses',[\s\S]*?artSize: 40/);
    expect(primitives).toContain('shortcut.artSize ?? 32');
  });

  it('groups operational shortcuts and renders compact zero states',()=>{
    const home=source('src/features/daylight/DaylightHomeScreen.tsx');
    expect(home).toContain('styles.operationalGroup');
    expect(home).toContain("router.push('/agenda' as never)");
    expect(home).toContain("router.push('/clients?filter=reconnect' as never)");
    expect(home).toContain('Nenhuma ação hoje');
    expect(home).toContain('Nenhum retorno vencido');
    expect(home).not.toContain('styles.operationalCard');
  });

  it('derives the Home palette and quick-create blur from the active theme',()=>{
    const theme=source('src/features/daylight/theme.ts');
    const home=source('src/features/daylight/DaylightHomeScreen.tsx');
    const nav=source('src/features/navigation/ProtectedNavigation.tsx');
    expect(theme).toContain('createDayPalette(colors');
    expect(home).toContain('useDayTheme()');
    expect(nav).toContain('tint={resolvedTheme}');
    const light=createDayPalette(lightColors);
    const dark=createDayPalette(darkColors,true);
    expect(light.canvas).toBe(lightColors.background);
    expect(dark.canvas).toBe(darkColors.background);
    expect(dark.surface).toBe(darkColors.surface);
    expect(dark.brandSoft).not.toBe(light.brandSoft);
  });

  it('makes Agenda a selected primary destination',()=>{
    const agenda=source('src/features/agenda/AgendaScreen.tsx');
    expect(agenda).toContain('<ProtectedBottomNavigation selected="agenda"/>');
    expect(agenda).not.toContain('<ProtectedPageHeader back');
  });
});
