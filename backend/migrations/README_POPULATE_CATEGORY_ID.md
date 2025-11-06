# Script de Migração: Popular categoryId nas Transações

Este script popula o campo `categoryId` nas transações existentes que ainda não possuem esse campo.

## Pré-requisitos

1. Execute primeiro a migration SQL: `add_category_id_to_transactions.sql`
2. Certifique-se de que o backend está configurado corretamente com as variáveis de ambiente

## Como executar

### Opção 1: Usando ts-node (recomendado)

```bash
cd backend
npx ts-node migrations/populate_category_id.ts
```

### Opção 2: Compilar e executar

```bash
cd backend
npm run build
node dist/migrations/populate_category_id.js
```

## O que o script faz

1. **Busca todos os usuários** que possuem transações
2. **Para cada usuário:**
   - Busca todas as transações sem `categoryId`
   - Busca todas as categorias do usuário (descriptografadas)
   - Para cada transação:
     - Descriptografa o nome da categoria
     - Encontra a categoria correspondente pelo nome
     - Atualiza a transação com o `categoryId` encontrado

## Resultado esperado

O script exibirá:
- Total de transações processadas
- Quantas foram atualizadas com sucesso
- Quantas foram puladas (categoria não encontrada)
- Quantos erros ocorreram

## Notas importantes

- O script é **seguro** e pode ser executado múltiplas vezes (ele só atualiza transações sem `categoryId`)
- Transações cujo nome da categoria não corresponder a nenhuma categoria existente serão **puladas** (não atualizadas)
- O script processa usuário por usuário para evitar sobrecarga de memória
- O matching de categorias é **case-insensitive** (não diferencia maiúsculas/minúsculas)

## Exemplo de saída

```
🚀 Starting migration to populate categoryId in transactions...

📊 Found 5 unique users with transactions

👤 Processing user: user-123
   📝 Found 25 transactions without categoryId
   📂 Found 10 categories for this user
   ✅ Updated 10 transactions so far...
   ✅ Completed user user-123: 25 updated, 0 skipped, 0 errors

============================================================
📊 Migration Summary:
============================================================
   Total transactions processed: 125
   ✅ Successfully updated: 120
   ⚠️  Skipped (no matching category): 5
   ❌ Errors: 0
============================================================

✅ Migration completed!
🎉 Migration script finished successfully!
```

