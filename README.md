​📦 Web Validade - Banco na Nuvem
​O Web Validade é um Progressive Web App (PWA) desenvolvido para facilitar o controle de estoque e monitoramento de validades de produtos de forma ágil e moderna. O sistema utiliza a câmera do dispositivo para leitura de códigos de barras e sincroniza os dados em tempo real na nuvem.
​🚀 Funcionalidades
​Autenticação Completa: Sistema de login e cadastro de usuários via Firebase Auth.
​Leitor de Código de Barras: Integração com a câmera para identificação instantânea de produtos via EAN.
​Banco de Dados na Nuvem: Sincronização em tempo real utilizando Firestore.
​Importação Inteligente: Permite importar bases de produtos via arquivo CSV para preenchimento automático de descrições.
​Exportação de Dados: Gera planilhas em formato .xlsx (Excel) para relatórios externos.
​Interface Responsiva: Design otimizado para dispositivos móveis com suporte a Progressive Web App (PWA).
​🛠️ Tecnologias Utilizadas
​Front-end: HTML5, CSS3 e JavaScript (ES6 Modules).
​Backend as a Service (BaaS): Firebase (Auth & Firestore).
​Bibliotecas Externas:
​Html5-QRCode: Para leitura de códigos de barras.
​SheetJS (XLSX): Para geração de arquivos Excel.
​SweetAlert2: Para alertas e notificações amigáveis.
​📂 Estrutura do Projeto

├── index.html          # Estrutura principal da interface
├── style.css           # Estilização e design responsivo
├── firebase-config.js  # Configurações e inicialização do Firebase
├── script.js           # Lógica de negócio, scanner e manipulação de dados
├── manifest.json       # Configurações para instalação como PWA
└── logo512x512.png     # Ícones e assets visuais

Como Configurar
Firebase:
Crie um projeto no Console do Firebase.
Ative o Authentication (E-mail/Senha) e o Cloud Firestore.
Substitua as credenciais no arquivo firebase-config.js pelas do seu projeto.
Hospedagem:
Como o projeto é estático, você pode utilizar o GitHub Pages, Vercel ou Netlify.
Importação de Base:
O sistema aceita arquivos .csv com o formato codigo_barras,nome_produto para popular a biblioteca de consulta.
✒️ Autor
Luan Oliveira - Seu GitHub
