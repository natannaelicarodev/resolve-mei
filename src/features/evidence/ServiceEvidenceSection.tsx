import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Badge,Button,Card,Chip,Dialog,InlineFeedback,Input,Text } from '@/components/ui';
import type { ServiceOrderStatus } from '@/features/service-orders/domain';
import { radii,spacing } from '@/theme';
import { evidenceCategoryLabels,evidenceErrorMessage,type EvidenceCategory } from './domain';
import { useEvidence,useEvidenceMutations } from './hooks';

export function ServiceEvidenceSection({userId,businessId,orderId,orderStatus}:{userId:string;businessId:string;orderId:string;orderStatus:ServiceOrderStatus}) {
 const query=useEvidence(userId,businessId,orderId); const mutations=useEvidenceMutations(userId,businessId,orderId);
 const [add,setAdd]=useState(false); const [category,setCategory]=useState<EvidenceCategory>('during'); const [note,setNote]=useState('');
 const [deleting,setDeleting]=useState<string>(); const [reason,setReason]=useState(''); const editable=['pending','in_progress','paused'].includes(orderStatus);
 const busy=mutations.upload.isPending||mutations.remove.isPending; const error=mutations.upload.error??mutations.remove.error;
 async function pick(source:'camera'|'library') {
  const permission=source==='camera'?await ImagePicker.requestCameraPermissionsAsync():await ImagePicker.requestMediaLibraryPermissionsAsync(); if(!permission.granted)return;
  const result=source==='camera'?await ImagePicker.launchCameraAsync({mediaTypes:['images'],quality:1}):await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],quality:1});
  const asset=!result.canceled?result.assets[0]:undefined; if(!asset)return;
  mutations.upload.mutate({businessId,orderId,category,note,asset},{onSuccess:()=>{setAdd(false);setNote('');}});
 }
 return <View style={styles.section}>
  <Text color="primary" style={styles.title} variant="caption">EVIDÊNCIAS DO SERVIÇO</Text>
  <Card style={styles.card}>
   <View style={styles.row}><Text style={styles.flex} variant="sectionTitle">Fotos da execução</Text><Badge label={`${query.data?.length??0}/20`} variant="info" /></View>
   {query.data?.length?<View style={styles.grid}>{query.data.map(item=><View key={item.id} style={styles.photoCard}>
    <Image accessibilityLabel={`Evidência ${evidenceCategoryLabels[item.category]}`} source={{uri:item.signedUrl}} style={styles.image}/>
    <View style={styles.photoCopy}><View style={styles.row}><Text variant="label">{evidenceCategoryLabels[item.category]}</Text>{item.locked_at?<Badge label="Protegida" variant="success"/>:null}</View>{item.note?<Text color="textSecondary" variant="caption">{item.note}</Text>:null}
    {!item.locked_at&&editable?<Button label="Excluir" onPress={()=>setDeleting(item.id)} variant="danger"/>:null}</View>
   </View>)}</View>:<Text color="textSecondary">Nenhuma evidência adicionada.</Text>}
   {editable&&((query.data?.length??0)<20)?<Button disabled={busy} label="Adicionar evidência" onPress={()=>setAdd(true)}/>:null}
  </Card>
  {error?<InlineFeedback message={evidenceErrorMessage(error)} variant="error"/>:null}
  <Dialog description="A foto será convertida para JPEG e comprimida antes do envio." onClose={()=>!busy&&setAdd(false)} title="Adicionar evidência" visible={add}>
   <View style={styles.chips}>{(['before','during','after'] as const).map(value=><Chip key={value} label={evidenceCategoryLabels[value]} onPress={()=>setCategory(value)} selected={category===value}/>)}</View>
   <Input label="Observação (opcional)" maxLength={500} onChangeText={setNote} showCounter value={note}/>
   <Button disabled={busy} label="Tirar foto" loading={mutations.upload.isPending} onPress={()=>void pick('camera')}/>
   <Button disabled={busy} label="Escolher da galeria" onPress={()=>void pick('library')} variant="secondary"/>
  </Dialog>
  <Dialog description="A exclusão ficará registrada no histórico." onClose={()=>!busy&&setDeleting(undefined)} title="Excluir evidência?" visible={Boolean(deleting)}>
   <Input label="Motivo" maxLength={500} onChangeText={setReason} value={reason}/><View style={styles.actions}><Button label="Voltar" onPress={()=>setDeleting(undefined)} variant="ghost"/><Button disabled={reason.trim().length<2} label="Confirmar exclusão" loading={mutations.remove.isPending} onPress={()=>deleting&&mutations.remove.mutate({id:deleting,reason},{onSuccess:()=>{setDeleting(undefined);setReason('');}})} variant="danger"/></View>
  </Dialog>
 </View>;
}
const styles=StyleSheet.create({section:{gap:spacing.sm},title:{fontSize:10,fontWeight:'600',letterSpacing:.4},card:{gap:spacing.md},row:{alignItems:'center',flexDirection:'row',gap:spacing.sm},flex:{flex:1},grid:{gap:spacing.md},photoCard:{borderRadius:radii.medium,overflow:'hidden'},image:{aspectRatio:4/3,width:'100%'},photoCopy:{gap:spacing.sm,paddingVertical:spacing.sm},chips:{flexDirection:'row',flexWrap:'wrap',gap:spacing.sm},actions:{flexDirection:'row',gap:spacing.sm,justifyContent:'flex-end'}});
