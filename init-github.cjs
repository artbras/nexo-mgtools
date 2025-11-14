const { Octokit } = require('@octokit/rest');

async function getAccessToken() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY ? 'repl ' + process.env.REPL_IDENTITY : process.env.WEB_REPL_RENEWAL ? 'depl ' + process.env.WEB_REPL_RENEWAL : null;
  if (!xReplitToken) throw new Error('X_REPLIT_TOKEN not found');
  
  const response = await fetch('https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github', {
    headers: { 'Accept': 'application/json', 'X_REPLIT_TOKEN': xReplitToken }
  });
  
  const data = await response.json();
  const accessToken = data.items?.[0]?.settings?.access_token;
  if (!accessToken) throw new Error('GitHub not connected');
  return accessToken;
}

async function initializeRepo() {
  try {
    const token = await getAccessToken();
    const octokit = new Octokit({ auth: token });
    const owner = 'artbras';
    const repo = 'nexo-mgtools';
    
    console.log('🚀 Inicializando repositório GitHub...');
    
    // Create initial README
    const readmeContent = `# NEXO - Sistema de Inteligência Comercial

Sistema em desenvolvimento...

Aguarde o upload completo dos arquivos.
`;
    
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'README.md',
      message: 'Initial commit',
      content: Buffer.from(readmeContent).toString('base64'),
    });
    
    console.log('✅ Repositório inicializado!');
    console.log('📦 https://github.com/artbras/nexo-mgtools');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  }
}

initializeRepo();
