# Confere RP

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
