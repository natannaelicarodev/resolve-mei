export const RAW_LIMIT = 10 * 1024 * 1024;
export const UPLOAD_LIMIT = 3 * 1024 * 1024;
export const evidenceCategories = ['before', 'during', 'after'] as const;
export type EvidenceCategory = (typeof evidenceCategories)[number];
export const evidenceCategoryLabels: Record<EvidenceCategory,string> = { before:'Antes', during:'Durante', after:'Depois' };
export function evidenceErrorMessage(error:unknown) {
 const value=error instanceof Error?error.message:String(error??'');
 if(/RAW_TOO_LARGE/.test(value)) return 'A imagem original deve ter no máximo 10 MB.';
 if(/COMPRESSED_TOO_LARGE/.test(value)) return 'Não foi possível reduzir a imagem para menos de 3 MB.';
 if(/EVIDENCE_LIMIT_REACHED/.test(value)) return 'Esta ordem já possui o limite de 20 fotos.';
 if(/EVIDENCE_IMMUTABLE|EVIDENCE_ORDER_LOCKED/.test(value)) return 'Evidências deste ciclo já estão protegidas e não podem ser alteradas.';
 return 'Não foi possível salvar a evidência. Tente novamente.';
}
