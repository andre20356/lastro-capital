# Guia de Publicação do Lastro Capital na Play Store

## Pré-requisitos

1. **Google Play Developer Account**
   - Acesse: https://play.google.com/console
   - Pague a taxa de $25 USD (única vez)

2. **Expo Account**
   - Se não tiver, crie em: https://expo.dev

## Passo 1: Configurar Ambiente Local

1. **Baixe o projeto do Replit**
   - Clique no menu (≡) do Replit
   - Selecione "Download as zip"
   - Descompacte a pasta

2. **Abra o Terminal/CMD na pasta do projeto**

3. **Instale as ferramentas necessárias:**
```bash
npm install -g eas-cli
npm install
```

4. **Faça login na sua conta Expo:**
```bash
eas login
```
   - Use suas credenciais da conta Expo

## Passo 2: Criar Build de Produção

Execute o comando:
```bash
eas build --platform android
```

**O que vai acontecer:**
- EAS vai compilar seu app para Android
- Gera um arquivo `.aab` (Android App Bundle)
- O build pode levar 10-15 minutos
- Você receberá um link para acompanhar o progresso

**Salve o link da build** quando terminar.

## Passo 3: Preparar no Google Play Console

1. **Acesse** https://play.google.com/console
2. **Clique em "Criar app"** e preencha:
   - Nome do app: "Lastro Capital"
   - Idioma: Português
   - Tipo: App
   - Pago ou Gratuito: Gratuito

3. **Na seção "Testes internos":**
   - Clique em "Criar novo lançamento"
   - Clique em "Carregar" para fazer upload do `.aab`

4. **Complete os campos obrigatórios:**
   - Descrição breve (80 caracteres)
   - Descrição completa
   - Screenshots (pelo menos 2)
   - Gráfico promocional (1024x500px)
   - Ícone do app

5. **Na aba "Conteúdo do app":**
   - Selecione a categoria: "Negócios" ou "Produtividade"
   - Adicione política de privacidade
   - Responda ao questionário de classificação etária

6. **Selecione "Publicar"** para começar a distribuição

## Passo 4: Próximas Atualizações (Simples!)

Para atualizações futuras:

```bash
eas build --platform android --auto-submit
```

Isso vai:
1. Fazer build da versão nova
2. Incrementar automaticamente o versionCode
3. Enviar para a Play Store

## Arquivos Importantes

Este projeto inclui:

- **eas.json** - Configuração do EAS para build e submit
- **.easignore** - Arquivos que não devem ser enviados
- **app.json** - Configuração do app (já está pronto!)

## Dúvidas Comuns

**P: Preciso de um certificado/chave?**
R: Não! O EAS gera automaticamente. Você só precisa da conta Google Play.

**P: Quanto tempo leva?**
R: Primeira build: 10-15 minutos. Publicação: 2-3 horas (Google analisa).

**P: Como faço atualizações?**
R: Use `eas build --platform android --auto-submit` e pronto!

**P: Posso testar antes de publicar?**
R: Sim! Use a seção "Testes internos" ou "Testes abertos".

## Suporte

Para dúvidas técnicas, consulte:
- Documentação Expo: https://docs.expo.dev/submit/android/
- Google Play Console Help: https://support.google.com/googleplay/android-developer

---

**Pronto para publicar seu app!** 🚀
