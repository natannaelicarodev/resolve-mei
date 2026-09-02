# Evidências do serviço — Fase 5.1

Fotos pertencem à ordem e usam o bucket privado `service-evidence`; avatar e
logotipo permanecem isolados. O cliente aceita arquivos brutos de até 10 MB,
remove metadados ao converter para JPEG, redimensiona/comprime de forma
adaptativa e só envia um resultado de até 3 MB. Cada ordem admite 20 registros
pendentes ou ativos.

O upload é reservado por RPC. A política do Storage aceita somente o caminho
exato reservado ao proprietário; a finalização confere objeto, MIME e tamanho.
Falhas removem o objeto e cancelam a reserva. URLs de leitura são assinadas por
cinco minutos e ficam apenas no cache privado da sessão.

Categorias: antes, durante e depois. Exclusão exige motivo, mantém evento de
auditoria e só é aceita em ordem pendente, em execução ou pausada. Um trigger
acionado pelo evento `completed` trava todas as evidências ativas ainda livres.
Reabrir a ordem não remove esse bloqueio; novas fotos pertencem ao novo ciclo e
são travadas na próxima conclusão.

## Validação manual

1. Em ordem ativa, envie pela câmera e pela galeria nas três categorias.
2. Confirme miniatura, observação e contador; tente bruto acima de 10 MB.
3. Exclua uma foto com motivo e confirme a remoção visual.
4. Complete a ordem e confirme o selo **Protegida** e ausência de exclusão.
5. Reabra, adicione outra foto e confirme que somente a nova pode ser excluída.
6. Conclua novamente e confirme que todas ficam protegidas.
7. Tente a 21ª foto e valide o bloqueio.
8. Troque A → B → A e confirme isolamento das fotos e URLs temporárias.
