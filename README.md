# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/3beb4d3c-92b4-4dd0-97f9-a7a72e52d753

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/3beb4d3c-92b4-4dd0-97f9-a7a72e52d753) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Configuração do Ambiente

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# URLs das APIs do Logic App
# IMPORTANTE: No Vite, todas as variáveis devem ter o prefixo VITE_ para serem acessíveis no frontend

VITE_SHEET1_URL=https://your-logic-app-url-1.azurewebsites.net/api/sheet1
VITE_SHEET2_URL=https://your-logic-app-url-2.azurewebsites.net/api/sheet2
VITE_SHEET3_URL=https://your-logic-app-url-3.azurewebsites.net/api/sheet3
VITE_SHEET4_URL=https://your-logic-app-url-4.azurewebsites.net/api/sheet4
```

Substitua as URLs acima pelas URLs reais das suas APIs do Logic App.

### Autenticação

A aplicação utiliza autenticação com Entra ID (Azure AD) através do Azure Static Web Apps. 

- **Login**: `/.auth/login/aad`
- **Logout**: `/.auth/logout`
- **Verificação de usuário**: `/.auth/me`

A autenticação é gerenciada automaticamente pelo Azure Static Web Apps. Os usuários precisam fazer login para acessar a aplicação, e as roles são retornadas pela API de roles do Azure Static Web Apps.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/3beb4d3c-92b4-4dd0-97f9-a7a72e52d753) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
