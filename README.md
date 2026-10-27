# Reflexa — Gerador de Conselhos e Reflexões

HTML + CSS + JavaScript (módulos ES), Advice Slip API e Firebase Firestore. Sem build.

## 1. Configurar o Firebase
1. Em https://console.firebase.google.com, crie um projeto.
2. **Build > Firestore Database > Criar banco de dados** (modo produção).
3. **Build > Authentication > Começar > Anônimo > Ativar.** Cada navegador recebe uma identidade anônima, e o mural fica privado a ela.
4. **Configurações do projeto > Seus apps > Web (</>)**: registre o app e copie o `firebaseConfig`.
5. Cole os valores em `js/firebase-config.js`.
6. Em **Firestore > Regras**, cole o conteúdo de `firestore.rules` e publique.

Observação: a identidade anônima fica no navegador. Limpar os dados do site ou trocar de navegador cria outro mural. Para mural permanente entre dispositivos, troque por login com Google/e-mail (as regras já servem).

## 2. Executar
Módulos ES não funcionam via `file://`. Na pasta do projeto:

    python3 -m http.server 8000     # ou: npx serve

Abra http://localhost:8000. Para publicar: `firebase deploy` (Hosting) ou qualquer hospedagem estática. Em Authentication > Configurações > Domínios autorizados, inclua o domínio de produção.

## 3. Roteiro de testes
1. Ao abrir, um conselho real aparece; “Novo conselho” troca o texto e o número.
2. Escreva uma anotação, clique em “Salvar nos favoritos”: toast de sucesso e novo card no mural. O botão fica desativado para o mesmo conselho.
3. Recarregue e feche/reabra a página: os favoritos continuam lá.
4. “Editar”: altere a anotação, salve. O card muda e nenhum registro novo surge (confira o Console do Firestore: `updatedAt` mudou, `createdAt` não).
5. “Excluir”: o modal mostra um trecho. Cancele (nada muda); depois confirme (o documento some).
6. Pesquise por palavras do texto ou da anotação, use “Limpar pesquisa” e as três ordenações.
7. “Copiar” mostra confirmação; “Compartilhar” aparece em navegadores com Web Share.
8. API fora do ar: no DevTools > Network, marque “Offline” e clique em “Novo conselho”. Aparece o erro com opção de tentar de novo, sem conselho inventado.
9. Firebase com erro: deixe `COLE_AQUI` (aviso de configuração) ou troque as regras por `allow read, write: if false` (toast de permissão negada).
10. Abra em outro navegador: os favoritos do primeiro não aparecem.
11. Redimensione a janela (celular, tablet, desktop) e navegue só com Tab.

## Estrutura
- `js/firebase-config.js`: inicialização e login anônimo
- `js/advice-service.js`: Advice Slip API
- `js/favorite-service.js`: CRUD + `onSnapshot`
- `js/notifications.js`: toasts
- `js/main.js`: interface (card, mural, modais, busca, ordenação)
- `firestore.rules`: regras de segurança
