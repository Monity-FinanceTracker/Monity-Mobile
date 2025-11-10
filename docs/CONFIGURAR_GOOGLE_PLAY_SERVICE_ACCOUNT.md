# 🔐 Configurar Google Play Service Account para Produção

## 📋 JSON Formatado para Variável de Ambiente

Use este JSON formatado como variável de ambiente. Ele está em uma única linha, pronto para copiar e colar:

```bash
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"projeto-montiy","private_key_id":"6305134d78472772513bba411330b7c3272b20ed","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDDekf+ttsYK8no\nLMf9c5zBFk6gfxRxwJKPeIzAylF6/ksWOLCif7IxFjEwOMCouhjwbxnLzwlumNV5\nppkjxNiFEIy37beRxotYzZ4m8KGAq21UL0UjJCpyztSPhJrFogjH4Y00Ai0k6pAE\nc9B47rMGo/QbpzqKXmpdHKNMR6Njtw4NGP555E5FRNYWkXMynIaVv8iMGIH3csc3\nkiIuYPdw+Kf7EkBF9IoKWnJ3of8UuRt2ldJWYSbai9tVEGI6qkeU6K8jOJNZoClv\nRM+GC3CEf22zs6X3mHa7jKGB2JMAKO4yC2adaRUbbcMPHuQFonQMYx2a65cDZbmd\nFSPE5ny3AgMBAAECggEAWLdVGHGFwxUQiBpW050WXf2RRr8WGMBE4+9ath68Vx01\nF8s3wzBAP43qWg/PxGPdcLWDmB+JENQ1QoZNR1IN0Gpf6xPstbDNykpbhiG8soha\n0JO5hYbi6wMarl4I3jw5Tvn7W0jHk1MPdK3ZRiFTR+a+IZTGeUj7bfHS3QpASb7d\nySm7ezfGn6LPqi8WT3osXuGqz2v2eX065IWeb3KNNn+GF33ZUCCRV4i7NbAtIBaU\ntQgOa1JLNwfxK1PSIZZ/eh5O5X2hkNMuoIFsURBKWhMIC6lQQ4591b+JtFooQbkG\nT8xKb8zzGt1od6n9TQSTLh74WmpuVMrWk3fgkwoxWQKBgQDrBCB5sjAPruuyNLLX\niTlyW8zwzsheGaFhoNLLtJAZofFl9eaxKzuHjQbzT8NWP+aseNQplc/EiSaNKkbJ\nOH9V3dl1Z7Ync2pcQ/wozqzH3hRDYOQFHieX1DETfEDabCa+l7Y82CE425tE+Azd\nK6loFcjESyQMgJYNJZP+uOdnTwKBgQDU7mfFQCxHKjPpoo8mJGbPuTBPzQ6bnorb\nAsxyTkYJD/ct7EMheDiBHALoceYdXMv0TYpWr68ACpOc+ETtOCmDz/Glz7JewtwB\nfkV0jiVfMO9kd0RSVXbmmtj1Qi6p+kCGjTBjWIma6m7PANAzid1vG+q83VXG5S2k\nEoqXJ2K6GQKBgQDOJhWSilIMP8Sx0fYaiF1iydHQXaJ2oIbmC1s8ootQYLROWs/c\nEu8p7PPu08Wlz3G5UlfQjn/sht3RMAddlHhlyq9og+vNWTkv69axuPDodQ5TOBdr\nwdK7JL9Tt0dwETQ/NPb/Ehq6NDBT5D3sd9Mm4Qz12m+po9V7fL3/zxP0kwKBgGfR\nvgLs4Snpp9oYipdcVEyfzLB8GM1DpgxW9vwcsgUlJa3cbnbZOSOqVrijIEHcxwzc\n6cCOdFMe1Q5J9sF7CrLcJsRj2mJdvAt2V8MWs54QLAjeJg/G3+xcP8CFfl8eR2vT\nV2548s730wNXMCyQ4ciU4gUoHfSWNYS0DaLZb0exAoGAEL45xulswu1x+SLl66X4\nT2DpMI6vXHvCIBCq6egaa6upkhPkPEgWHcNeic8aquEPwos6WCMJ4HmS7sLXpUo0\nAoRVAbL/JZ784jSKhTPK8JUWYU91qPtZ2wpkzHSp+kZgO8iSwCVcIl2KPs5C6S1/\nhE100eyuT884hUuV41JeiGs=\n-----END PRIVATE KEY-----\n","client_email":"monity-play-billing@projeto-montiy.iam.gserviceaccount.com","client_id":"110345481680830657140","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/monity-play-billing%40projeto-montiy.iam.gserviceaccount.com","universe_domain":"googleapis.com"}
```

---

## 🚀 Como Configurar no Railway (Produção)

### Passo 1: Acessar Railway Dashboard
1. Acesse [Railway Dashboard](https://railway.app)
2. Selecione seu projeto **Monity**
3. Clique no serviço do backend

### Passo 2: Adicionar Variável de Ambiente
1. Vá na aba **Variables** (ou **Variáveis**)
2. Clique em **+ New Variable** (ou **+ Nova Variável**)
3. Configure:
   - **Name**: `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`
   - **Value**: Cole o JSON completo acima (a linha inteira)
4. Clique em **Add** (ou **Adicionar**)

### Passo 3: Adicionar Outras Variáveis Necessárias
Adicione também:
- **Name**: `GOOGLE_PLAY_PACKAGE_NAME`
- **Value**: `com.widechain.monity`

### Passo 4: Redeploy
1. Após adicionar as variáveis, o Railway fará redeploy automaticamente
2. Ou clique em **Deploy** para forçar um novo deploy

---

## 💻 Como Configurar Localmente (.env)

Para desenvolvimento local, adicione ao arquivo `backend/.env`:

```bash
# Google Play Configuration
GOOGLE_PLAY_PACKAGE_NAME=com.widechain.monity
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"projeto-montiy","private_key_id":"6305134d78472772513bba411330b7c3272b20ed","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDDekf+ttsYK8no\nLMf9c5zBFk6gfxRxwJKPeIzAylF6/ksWOLCif7IxFjEwOMCouhjwbxnLzwlumNV5\nppkjxNiFEIy37beRxotYzZ4m8KGAq21UL0UjJCpyztSPhJrFogjH4Y00Ai0k6pAE\nc9B47rMGo/QbpzqKXmpdHKNMR6Njtw4NGP555E5FRNYWkXMynIaVv8iMGIH3csc3\nkiIuYPdw+Kf7EkBF9IoKWnJ3of8UuRt2ldJWYSbai9tVEGI6qkeU6K8jOJNZoClv\nRM+GC3CEf22zs6X3mHa7jKGB2JMAKO4yC2adaRUbbcMPHuQFonQMYx2a65cDZbmd\nFSPE5ny3AgMBAAECggEAWLdVGHGFwxUQiBpW050WXf2RRr8WGMBE4+9ath68Vx01\nF8s3wzBAP43qWg/PxGPdcLWDmB+JENQ1QoZNR1IN0Gpf6xPstbDNykpbhiG8soha\n0JO5hYbi6wMarl4I3jw5Tvn7W0jHk1MPdK3ZRiFTR+a+IZTGeUj7bfHS3QpASb7d\nySm7ezfGn6LPqi8WT3osXuGqz2v2eX065IWeb3KNNn+GF33ZUCCRV4i7NbAtIBaU\ntQgOa1JLNwfxK1PSIZZ/eh5O5X2hkNMuoIFsURBKWhMIC6lQQ4591b+JtFooQbkG\nT8xKb8zzGt1od6n9TQSTLh74WmpuVMrWk3fgkwoxWQKBgQDrBCB5sjAPruuyNLLX\niTlyW8zwzsheGaFhoNLLtJAZofFl9eaxKzuHjQbzT8NWP+aseNQplc/EiSaNKkbJ\nOH9V3dl1Z7Ync2pcQ/wozqzH3hRDYOQFHieX1DETfEDabCa+l7Y82CE425tE+Azd\nK6loFcjESyQMgJYNJZP+uOdnTwKBgQDU7mfFQCxHKjPpoo8mJGbPuTBPzQ6bnorb\nAsxyTkYJD/ct7EMheDiBHALoceYdXMv0TYpWr68ACpOc+ETtOCmDz/Glz7JewtwB\nfkV0jiVfMO9kd0RSVXbmmtj1Qi6p+kCGjTBjWIma6m7PANAzid1vG+q83VXG5S2k\nEoqXJ2K6GQKBgQDOJhWSilIMP8Sx0fYaiF1iydHQXaJ2oIbmC1s8ootQYLROWs/c\nEu8p7PPu08Wlz3G5UlfQjn/sht3RMAddlHhlyq9og+vNWTkv69axuPDodQ5TOBdr\nwdK7JL9Tt0dwETQ/NPb/Ehq6NDBT5D3sd9Mm4Qz12m+po9V7fL3/zxP0kwKBgGfR\nvgLs4Snpp9oYipdcVEyfzLB8GM1DpgxW9vwcsgUlJa3cbnbZOSOqVrijIEHcxwzc\n6cCOdFMe1Q5J9sF7CrLcJsRj2mJdvAt2V8MWs54QLAjeJg/G3+xcP8CFfl8eR2vT\nV2548s730wNXMCyQ4ciU4gUoHfSWNYS0DaLZb0exAoGAEL45xulswu1x+SLl66X4\nT2DpMI6vXHvCIBCq6egaa6upkhPkPEgWHcNeic8aquEPwos6WCMJ4HmS7sLXpUo0\nAoRVAbL/JZ784jSKhTPK8JUWYU91qPtZ2wpkzHSp+kZgO8iSwCVcIl2KPs5C6S1/\nhE100eyuT884hUuV41JeiGs=\n-----END PRIVATE KEY-----\n","client_email":"monity-play-billing@projeto-montiy.iam.gserviceaccount.com","client_id":"110345481680830657140","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/monity-play-billing%40projeto-montiy.iam.gserviceaccount.com","universe_domain":"googleapis.com"}
```

⚠️ **IMPORTANTE**: 
- Use aspas simples `'` ou duplas `"` para envolver o JSON
- Não adicione quebras de linha
- Mantenha o JSON em uma única linha

---

## 🔧 Atualizar Código do Backend

O código do backend precisa ser atualizado para ler essa variável de ambiente. Veja o arquivo `backend/controllers/subscriptionController.ts` - ele precisa ser modificado para usar `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` ao invés de um arquivo.

---

## ✅ Verificação

Após configurar, verifique:

1. **No Railway:**
   - Variável `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` está configurada
   - Variável `GOOGLE_PLAY_PACKAGE_NAME` está configurada
   - Deploy foi realizado com sucesso

2. **No código:**
   - O backend está lendo `process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`
   - O JSON está sendo parseado corretamente
   - A autenticação com Google Play API está funcionando

3. **Testes:**
   - Tente validar uma compra de teste
   - Verifique os logs do backend para erros de autenticação

---

## 🆘 Troubleshooting

### Erro: "Invalid credentials"
- Verifique se o JSON está completo (sem quebras de linha)
- Verifique se todas as aspas estão escapadas corretamente
- Verifique se o `private_key` mantém os `\n` (quebras de linha) dentro das aspas

### Erro: "Service account not linked"
- Verifique se a Service Account foi vinculada no Google Play Console
- Verifique se as permissões foram concedidas corretamente

### Erro: "Package name mismatch"
- Verifique se `GOOGLE_PLAY_PACKAGE_NAME=com.widechain.monity` está correto
- Deve corresponder ao package name do app no Google Play Console

---

## 🔒 Segurança

⚠️ **IMPORTANTE - Boas Práticas:**

1. **Nunca commite o JSON no Git**
2. **Use variáveis de ambiente em produção** (Railway, Heroku, etc.)
3. **Rotacione as chaves periodicamente** (a cada 6-12 meses)
4. **Limite as permissões** da Service Account apenas ao necessário
5. **Monitore o uso** da Service Account no Google Cloud Console

