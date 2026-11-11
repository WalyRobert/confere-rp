# Confere RP

![Confere RP — conferência de documentos com inteligência artificial](confere-rp-banner.jpeg)

## Escolha de provedor e chave por aba

Imagens/OCR: Google Gemini, DeepSeek e OpenAI. Use modelos com visão. DeepSeek Flash aceita imagens; DeepSeek Pro é recusado localmente para esta função. A disponibilidade dos demais modelos depende da sua conta.

Abra **Configurar IA para imagens**, escolha provedor/modelo, informe sua chave e aplique a configuração. O destino ativo aparece também fora do painel.

A chave pessoal permanece apenas na memória desta página, sem localStorage, sessionStorage, arquivos ou logs do aplicativo. Recarregar/fechar exige configurar novamente. O campo é limpo ao aplicar; apagar o perfil remove a chave e interrompe a espera local. A remoção não desfaz solicitações já enviadas. Alterar provedor invalida a configuração anterior; não há fallback, reaproveitamento automático da chave de outro serviço ou repetição após erro.

**Verificar configuração sem gerar** verifica somente formato, destino e presença da chave localmente. Não contata o provedor, não comprova validade, acesso ao modelo nem cota gratuita. A geração só ocorre por ação explícita e pode consumir créditos. Os modelos iniciais são exemplos editáveis; disponibilidade e limites dependem da conta.

Opcionalmente escolha a chave do servidor de forma explícita e configure a variável do provedor no `.env`: `GEMINI_API_KEY`, `DEEPSEEK_API_KEY` ou `OPENAI_API_KEY`. Modelos são selecionados pela interface. As variáveis Gemini de modelo continuam atendendo clientes antigos da API sem seleção de provedor. Não publique `.env` reais.

O backend usa destinos HTTPS fixos, valida origem e função, limita corpo/resposta e prazo, e encaminha a chave somente em header para o serviço escolhido. A chave não entra no prompt, URL ou resposta. Não são aceitas URLs arbitrárias. Hospedagem compartilhada exige HTTPS e autenticação de usuários; o servidor padrão é local.

Testes de integração usam transporte controlado, sem geração externa ou consumo de créditos. `store: false` na OpenAI não é uma garantia de retenção zero pelo provedor; consulte as políticas de cada serviço.

Referências: [visão DeepSeek](https://api-docs.deepseek.com/guides/vision/), [OpenAI áudio](https://developers.openai.com/api/docs/guides/audio), [OpenAI TTS/PCM](https://developers.openai.com/api/docs/guides/text-to-speech), [Gemini](https://ai.google.dev/gemini-api/docs).


Conferência de códigos entre imagens e uma coluna de planilha XLSX.

**Estado:** projeto experimental de portfólio, com melhorias de reprodutibilidade e testes. Autor: Waly Robert.

## Executar

Requer Node.js 22.16 ou superior e npm.

```bash
npm ci
npm run build
npm start
```

Abra http://127.0.0.1:3001/. Em desenvolvimento, execute `npm run server` em um terminal e `npm run dev` em outro; o Vite usa proxy para a API.

Copie `.env.example` para `.env`, defina `GEMINI_API_KEY` e confirme um `GEMINI_MODEL` disponível na sua conta. Reinicie o servidor. O arquivo `.env` é ignorado pelo Git; a chave não deve ter prefixo `VITE_` nem ser enviada ao cliente.

O servidor escuta somente em loopback. Hospedagem compartilhada requer autenticação de usuários, limites por usuário, HTTPS e proxy com limite de corpo. Esta entrega não publica um serviço aberto de inferência. Gemini foi testado com transporte simulado, sem chave real/chamada paga.

## Recursos e limites

- OCR opcional com Gemini pelo servidor, com MIME de imagem preservado.
- Entrada manual de códigos para uso sem IA/chave.
- Revisão humana dos códigos antes da comparação.
- Escolha explícita da coluna; comparação normalizada preserva zeros à esquerda quando o Excel os fornece como texto formatado.
- Leitura/exportação XLSX com ExcelJS; a planilha de saída contém os valores e status, não preserva formatação, macros ou fórmulas do arquivo original.

Use XLSX de até 5 MB, 10.000 linhas e 100 colunas. O código da coluna deve estar como texto ou com formatação que preserve zeros. Arquivos `.xls` antigos não são suportados.

Imagens PNG/JPEG/WebP: até 5 MB e 16 milhões de pixels, até 10 imagens por processo. Ao usar OCR, imagens são enviadas ao Google pela API Gemini. OCR pode errar: revise o resultado. O caminho manual não envia imagens à IA. Nenhum dataset pessoal ou chave acompanha este repositório.

## Verificação

```bash
npm test
npm run test:server
npm run build
```

O build verifica TypeScript antes de compilar. O CI repete os testes e build em Node.js 22. `package-lock.json` registra as versões instaladas. Testes de DOM usam APIs simuladas e não substituem validação real de codecs, permissões, hardware ou provedores externos.

## Origem e organização

Derivado do projeto do autor no Google AI Studio. Esta versão adiciona entrada Vite portátil, estilos Tailwind compilados localmente, limites e correções do fluxo principal. As alterações são locais; não substituem automaticamente a versão no Studio.

- `App.tsx` e `components/`: interface e fluxo da aplicação.
- `utils/` e/ou `services/`: conversão, validação ou integração.
- `tests/`: regressões do comportamento principal.
- `.github/workflows/ci.yml`: verificação automática.

## Dados e licenciamento

Use arquivos de exemplo sintéticos ou que você tenha autorização para compartilhar. Segredos, dependências instaladas e builds são excluídos do Git. As dependências/modelos mantêm suas próprias licenças. Uma licença de redistribuição para o código deste projeto ainda não foi definida pelo autor.


## Início e diagnóstico simplificados

Após `npm ci`, execute `npm run diagnostico` para verificar Node, dependências, build e presença de configuração sem revelar chaves ou consumir cota. Execute `npm run iniciar` para compilar a versão atual e abrir o servidor local em um único terminal. A faixa de estado da interface distingue configuração ausente e integração ainda não comprovada. Encontrar uma chave não confirma que ela é válida nem que existe cota gratuita. Nenhum teste de geração é iniciado automaticamente.

