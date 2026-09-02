import type { ExpenseMonth } from '@/features/expenses/domain';
import { centsDecimal,expensesCsv,monthlySummaryHtml,receiptsCsv } from '@/features/expenses/monthlyExport';
const data:ExpenseMonth={month:'2026-09-01',receivedCents:'10000',expenseCents:'3025',resultCents:'6975',byCategory:[{category:'material',amountCents:'3025'}],financialEntries:[
  {id:'1',occurredOn:'2026-09-02',quoteNumber:7,clientName:'José, Silva',paymentMethod:'pix',type:'receipt',amountCents:'12000'},
  {id:'2',occurredOn:'2026-09-03',quoteNumber:7,clientName:'José, Silva',paymentMethod:'pix',type:'refund',amountCents:'2000'},
],expenses:[{id:'3',quoteId:null,amountCents:'3025',occurredOn:'2026-09-04',category:'material',description:'Tinta "premium"',recurring:false,createdAt:'',updatedAt:'',quoteNumber:null,clientName:null,receiptCount:0}]};
it('uses UTF-8 BOM, escaping and accounting decimals in receipt CSV',()=>{
 const output=receiptsCsv(data);expect(output.charCodeAt(0)).toBe(0xfeff);expect(output).toContain('"José, Silva"');expect(output).toContain('"120.00"');expect(output).toContain('"-20.00"');expect(output).not.toContain('R$');
});
it('escapes expenses and preserves headers in an empty month',()=>{
 expect(expensesCsv(data)).toContain('"Tinta ""premium"""');
 expect(receiptsCsv({...data,financialEntries:[]})).toBe('\uFEFF"data","orcamento","cliente","forma_pagamento","tipo","valor_reais"\r\n');
});
it('renders a private printable summary with exact totals and timestamp',()=>{
 const html=monthlySummaryHtml(data,'ResolveMEI',new Date('2026-09-05T15:30:00Z'));
 expect(html).toContain('ResolveMEI');expect(html).toContain('R$ 100,00');expect(html).toContain('R$ 30,25');expect(html).toContain('R$ 69,75');expect(html).toContain('Gerado em');expect(html).not.toContain('José');
});
it('formats cents without floating point or BRL display symbols',()=>{expect(centsDecimal('1')).toBe('0.01');expect(centsDecimal('123456')).toBe('1234.56');expect(centsDecimal('25',true)).toBe('-0.25');});
