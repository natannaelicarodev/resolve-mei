import { supabase } from '@/lib/supabase';
import type { ReconnectOverview, RelationshipOverview } from './domain';

async function rpc<T>(name:'get_reconnect_clients'|'get_client_relationship_overview'|'save_relationship_settings'|'save_client_relationship_profile'|'save_client_return_interval'|'save_service_order_relationship_note', args:Record<string,unknown>) {
  const { data, error } = await supabase.rpc(name, args as never);
  if (error) throw error;
  return data as T;
}
export const getReconnectClients = (businessId:string) => rpc<ReconnectOverview>('get_reconnect_clients',{p_business_id:businessId});
export const getRelationshipOverview = (businessId:string,clientId:string) => rpc<RelationshipOverview>('get_client_relationship_overview',{p_business_id:businessId,p_client_id:clientId});
export const saveRelationshipSettings = (businessId:string,days:number) => rpc('save_relationship_settings',{p_business_id:businessId,p_reconnect_after_days:days});
export const saveRelationshipProfile = (businessId:string,clientId:string,recurring:boolean,priority:boolean) => rpc('save_client_relationship_profile',{p_business_id:businessId,p_client_id:clientId,p_recurring:recurring,p_priority:priority});
export const saveClientReturnInterval = (businessId:string,clientId:string,days:number|null) => rpc('save_client_return_interval',{p_business_id:businessId,p_client_id:clientId,p_expected_return_days:days});
export const saveRelationshipNote = (businessId:string,orderId:string,satisfaction:number|null,observation:string) => rpc('save_service_order_relationship_note',{p_business_id:businessId,p_service_order_id:orderId,p_satisfaction:satisfaction,p_observation:observation});
