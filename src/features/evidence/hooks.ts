import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query';
import { deleteEvidence,listEvidence,uploadEvidence } from './api';
export const evidenceKey=(u:string,b:string,o:string)=>['private',u,'evidence',b,o] as const;
export function useEvidence(u:string,b:string,o:string){return useQuery({queryKey:evidenceKey(u,b,o),queryFn:()=>listEvidence(b,o),enabled:Boolean(u&&b&&o)});}
export function useEvidenceMutations(u:string,b:string,o:string){const q=useQueryClient();const invalidate=()=>q.invalidateQueries({queryKey:evidenceKey(u,b,o)});return {upload:useMutation({mutationFn:uploadEvidence,onSuccess:invalidate}),remove:useMutation({mutationFn:(x:{id:string;reason:string})=>deleteEvidence(b,x.id,x.reason),onSuccess:invalidate})};}
