import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getReconnectClients,getRelationshipOverview,saveClientReturnInterval,saveRelationshipNote,saveRelationshipProfile,saveRelationshipSettings } from './api';
export const relationshipsKey=(u:string,b:string)=>['private',u,'relationships',b] as const;
export function useReconnectClients(u:string,b:string){return useQuery({queryKey:[...relationshipsKey(u,b),'reconnect'],queryFn:()=>getReconnectClients(b),enabled:Boolean(u&&b)});}
export function useRelationshipOverview(u:string,b:string,c:string){return useQuery({queryKey:[...relationshipsKey(u,b),'client',c],queryFn:()=>getRelationshipOverview(b,c),enabled:Boolean(u&&b&&c)});}
export function useRelationshipMutations(u:string,b:string){const q=useQueryClient();const invalidate=()=>q.invalidateQueries({queryKey:relationshipsKey(u,b)});return {
  settings:useMutation({mutationFn:(days:number)=>saveRelationshipSettings(b,days),onSuccess:invalidate}),
  profile:useMutation({mutationFn:(x:{clientId:string;recurring:boolean;priority:boolean})=>saveRelationshipProfile(b,x.clientId,x.recurring,x.priority),onSuccess:invalidate}),
  returnInterval:useMutation({mutationFn:(x:{clientId:string;days:number|null})=>saveClientReturnInterval(b,x.clientId,x.days),onSuccess:invalidate}),
  note:useMutation({mutationFn:(x:{orderId:string;satisfaction:number|null;observation:string})=>saveRelationshipNote(b,x.orderId,x.satisfaction,x.observation),onSuccess:invalidate}),
};}
