import { Platform } from 'react-native';
import type { ExpenseMonth } from '@/features/expenses/domain';
import { exportMonthlyResult } from '@/features/expenses/monthlyExport';
import { assertCurrentExportSession,createTextExport,safeDeleteExport,shareNativeExport } from '@/features/exports/fileExport';
jest.mock('@/features/exports/fileExport',()=>({assertCurrentExportSession:jest.fn(),createTextExport:jest.fn(),downloadWebExport:jest.fn(),safeDeleteExport:jest.fn(),shareNativeExport:jest.fn()}));
jest.mock('expo-print',()=>({printAsync:jest.fn(),printToFileAsync:jest.fn()}));
const data:ExpenseMonth={month:'2026-09-01',receivedCents:'0',expenseCents:'0',resultCents:'0',byCategory:[],financialEntries:[],expenses:[]};
beforeEach(()=>{jest.clearAllMocks();Object.defineProperty(Platform,'OS',{configurable:true,value:'android'});jest.mocked(createTextExport).mockImplementation(filename=>`file:///cache/${filename}`);});
it('shares selected CSV files sequentially and checks the session around each one',async()=>{
 await exportMonthlyResult({data,businessName:'Negócio',userId:'user-a',selection:{receipts:true,expenses:true,summary:false},isCurrent:()=>true});
 expect(shareNativeExport).toHaveBeenNthCalledWith(1,'file:///cache/recebimentos-2026-09.csv','recebimentos-2026-09.csv','text/csv');
 expect(shareNativeExport).toHaveBeenNthCalledWith(2,'file:///cache/despesas-2026-09.csv','despesas-2026-09.csv','text/csv');
 expect(assertCurrentExportSession).toHaveBeenCalledTimes(6);
 expect(safeDeleteExport).toHaveBeenCalledTimes(2);
});
it('stops before the next file when identity changes during sharing',async()=>{
 let current=true;jest.mocked(shareNativeExport).mockImplementation(async()=>{current=false;});
 await expect(exportMonthlyResult({data,businessName:'A',userId:'user-a',selection:{receipts:true,expenses:true,summary:false},isCurrent:()=>current})).rejects.toThrow('EXPORT_IDENTITY_CHANGED');
 expect(shareNativeExport).toHaveBeenCalledTimes(1);
});
