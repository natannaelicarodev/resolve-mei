import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

export async function assertCurrentExportSession(expectedUserId:string) {
  const {data,error}=await supabase.auth.getSession();
  if(error)throw error;
  if(data.session?.user.id!==expectedUserId)throw new Error('EXPORT_SESSION_CHANGED');
}
export function safeDeleteExport(uri:string){try{const file=new File(uri);if(file.exists)file.delete();}catch{/* cleanup is best effort */}}
export function createTextExport(filename:string,content:string){
  const directory=new Directory(Paths.cache,'accountant-exports');
  const file=new File(directory,filename);
  directory.create({idempotent:true,intermediates:true});
  file.create({intermediates:true,overwrite:true});
  file.write(content);
  if(!file.exists)throw new Error('EXPORT_FILE_MISSING');
  return file.uri;
}
export async function shareNativeExport(uri:string,filename:string,mimeType:string){
  if(Platform.OS==='web')throw new Error('NATIVE_SHARE_UNAVAILABLE_ON_WEB');
  if(!(await Sharing.isAvailableAsync()))throw new Error('EXPORT_SHARING_UNAVAILABLE');
  await Sharing.shareAsync(uri,{dialogTitle:`Compartilhar ${filename}`,mimeType});
}
export function downloadWebExport(filename:string,content:string,mimeType:string){
  if(Platform.OS!=='web')throw new Error('WEB_DOWNLOAD_UNAVAILABLE');
  const blob=new Blob([content],{type:mimeType});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');link.href=url;link.download=filename;link.click();
  URL.revokeObjectURL(url);
}
