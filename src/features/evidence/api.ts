import { File } from 'expo-file-system';
import type { ImagePickerAsset } from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { compressImageForUpload, COMPRESSED_IMAGE_LIMIT } from '@/features/uploads/compressedImage';
import type { EvidenceCategory } from './domain';

export type Evidence = DatabaseEvidence & { signedUrl?:string };
type DatabaseEvidence = import('@/types/database').Database['public']['Tables']['service_order_evidence']['Row'];

export const compressEvidence = compressImageForUpload;
export async function listEvidence(businessId:string,orderId:string) {
 const {data,error}=await supabase.from('service_order_evidence').select('*').eq('business_id',businessId).eq('service_order_id',orderId).eq('status','active').order('created_at'); if(error) throw error;
 return Promise.all((data??[]).map(async e=>{const {data:s,error:x}=await supabase.storage.from('service-evidence').createSignedUrl(e.storage_path,300);if(x)throw x;return {...e,signedUrl:s.signedUrl};}));
}
export async function uploadEvidence(input:{businessId:string;orderId:string;category:EvidenceCategory;note:string;asset:ImagePickerAsset}) {
 const uri=await compressEvidence(input.asset);
 const {data:r,error}=await supabase.rpc('reserve_service_evidence',{p_business_id:input.businessId,p_service_order_id:input.orderId,p_category:input.category,p_note:input.note.trim()||null}); if(error)throw error;
 const reservation=r as {id:string;storagePath:string};
 try { const body=await new File(uri).arrayBuffer(); if(body.byteLength>COMPRESSED_IMAGE_LIMIT)throw new Error('COMPRESSED_TOO_LARGE');
  const up=await supabase.storage.from('service-evidence').upload(reservation.storagePath,body,{contentType:'image/jpeg',upsert:false});if(up.error)throw up.error;
  const done=await supabase.rpc('finalize_service_evidence',{p_business_id:input.businessId,p_evidence_id:reservation.id});if(done.error)throw done.error; return done.data;
 } catch(caught) { await supabase.storage.from('service-evidence').remove([reservation.storagePath]); await supabase.rpc('cancel_service_evidence_reservation',{p_business_id:input.businessId,p_evidence_id:reservation.id}); throw caught; }
}
export async function deleteEvidence(businessId:string,id:string,reason:string) { const {data,error}=await supabase.rpc('delete_service_evidence',{p_business_id:businessId,p_evidence_id:id,p_reason:reason});if(error)throw error;const path=(data as {storagePath:string}).storagePath;const removed=await supabase.storage.from('service-evidence').remove([path]);if(removed.error)throw removed.error; }
