/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

// Função para varrer diretórios recursivamente
function walk(dir, exts = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Ignora pastas pesadas ou irrelevantes
      if (['node_modules', '.git', '.next', '.pnpm-store'].includes(entry.name)) continue;
      files.push(...walk(full, exts));
    } else {
      if (exts.includes(path.extname(entry.name))) files.push(full);
    }
  }
  return files;
}

function main() {
  // O script está em ProjetoConcretiza/tools/
  // O código está em ProjetoConcretiza/concretiza/src/
  const workspaceRoot = path.join(__dirname, '..');
  const projectDir = path.join(workspaceRoot, 'concretiza');
  const srcDir = path.join(projectDir, 'src');
  const routersDir = path.join(srcDir, 'server', 'routers');

  console.log('🔍 Analisando código em:', srcDir);

  // 1. Extrair Endpoints do Backend (Routers)
  const backendEndpoints = new Set();
  if (fs.existsSync(routersDir)) {
    const routerFiles = walk(routersDir);
    // Regex para pegar o nome da procedure antes de : publicProcedure ou protectedProcedure
    const propRegex = /([A-Za-z0-9_]+)\s*:\s*(?:publicProcedure|protectedProcedure)/g;

    for (const f of routerFiles) {
      const content = fs.readFileSync(f, 'utf8');
      let m;
      while ((m = propRegex.exec(content)) !== null) {
        backendEndpoints.add(m[1]);
      }
    }
  } else {
    console.error('❌ Erro: Pasta de routers não encontrada em:', routersDir);
    return;
  }

  // 2. Extrair Usos no Frontend
  const frontendUsages = new Set();
  if (fs.existsSync(srcDir)) {
    const allFiles = walk(srcDir);
    // Regex para capturar chamadas api.sienge.nomeDaProcedure
    const usageRegex = /api\.sienge\.([A-Za-z0-9_]+)\b/g;

    for (const f of allFiles) {
      // Pular a própria pasta de routers para não contar a definição como uso
      if (f.includes('server/routers')) continue;
      
      const content = fs.readFileSync(f, 'utf8');
      let m;
      while ((m = usageRegex.exec(content)) !== null) {
        frontendUsages.add(m[1]);
      }
    }
  }

  // 3. Comparar e Gerar Relatórios na raiz do Workspace
  const backend = Array.from(backendEndpoints).sort();
  const frontend = Array.from(frontendUsages).sort();
  const missing = backend.filter(b => !frontend.includes(b));

  // Salva os arquivos na raiz do workspace (ProjetoConcretiza/)
  fs.writeFileSync(path.join(workspaceRoot, 'backend_endpoints.txt'), backend.join('\n'));
  fs.writeFileSync(path.join(workspaceRoot, 'frontend_usages.txt'), frontend.join('\n'));
  fs.writeFileSync(path.join(workspaceRoot, 'backend_missing_in_frontend.txt'), missing.join('\n'));

  console.log(`✅ Backend: ${backend.length} endpoints encontrados.`);
  console.log(`✅ Frontend: ${frontend.length} usos encontrados.`);
  console.log(`⚠️ Faltando no Frontend: ${missing.length} (Salvo em backend_missing_in_frontend.txt na raiz)`);
}

main();