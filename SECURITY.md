# Segurança

Não publique chaves, arquivos .env, credenciais ou dados de usuários. Esta é uma aplicação experimental. Para relatar um problema, descreva uma reprodução com dados sintéticos e sem tokens ou arquivos pessoais. Não inclua credenciais em issues públicas.


Chaves pessoais da interface são temporárias e não são gravadas pelo aplicativo. Não registre headers de autenticação no proxy. Cada perfil usa seu provedor e não tem fallback para outra chave. Apagar a configuração não desfaz consultas já enviadas. Em hospedagem pública, proteja o gateway com autenticação e limites de uso.
