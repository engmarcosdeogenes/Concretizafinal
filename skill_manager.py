#!/usr/bin/env python3
"""
Skill Manager - Ativa/desativa skills automaticamente baseado no contexto do projeto.

Uso:
    python skill_manager.py                          # auto-detecta o projeto no diretório atual
    python skill_manager.py --project /path/to/proj  # aponta para um projeto específico
    python skill_manager.py --list                   # lista skills ativas no momento
    python skill_manager.py --reset                  # move todas as skills de volta ao vault

Estrutura esperada:
    ~/.agent/skills/           ← skills instaladas (seu fork do repositório)
    ~/.agent/skills_vault/     ← vault com TODAS as skills
    ~/.agent/skills_index.json ← índice gerado pelo script de indexação

    Ou, para Claude Code:
    ~/.claude/skills/
    ~/.claude/skills_vault/
"""

import os
import json
import shutil
import argparse
import subprocess
from pathlib import Path

# ─── Configuração ────────────────────────────────────────────────────────────

TOOL_PATHS = {
    "antigravity": Path.home() / ".gemini" / "antigravity",
    "agent":       Path.home() / ".agent",
    "claude":      Path.home() / ".claude",
    "cursor":      Path.home() / ".cursor",
    "gemini":      Path.home() / ".gemini",
}

# Detecta automaticamente qual ferramenta está instalada
def detect_tool_base() -> Path:
    for name, path in TOOL_PATHS.items():
        if (path / "skills").exists() or (path / "skills_vault").exists():
            print(f"[✓] Ferramenta detectada: {name} → {path}")
            return path
    # fallback: usa .agent
    return TOOL_PATHS["agent"]

BASE_DIR    = detect_tool_base()
SKILLS_DIR  = BASE_DIR / "skills"
VAULT_DIR   = BASE_DIR / "skills_vault"
INDEX_FILE  = BASE_DIR / "skills_index.json"   # gerado pelo build do repo
DATA_CATALOG = SKILLS_DIR / "data" / "catalog.json"  # catálogo interno do repo
BUNDLES_FILE = SKILLS_DIR / "data" / "bundles.json"

# ─── Detecção de contexto do projeto ─────────────────────────────────────────

def detect_project_context(project_path: Path) -> dict:
    """Analisa o projeto e retorna um dicionário de sinais para matching."""
    ctx = {
        "languages":   set(),
        "frameworks":  set(),
        "tools":       set(),
        "keywords":    set(),
        "files_found": [],
    }

    # Arquivos indicadores → tecnologias
    file_signals = {
        "package.json":          ["javascript", "nodejs"],
        "tsconfig.json":         ["typescript"],
        "next.config.js":        ["nextjs", "react"],
        "next.config.ts":        ["nextjs", "react"],
        "vite.config.ts":        ["vite", "react"],
        "tailwind.config.js":    ["tailwind", "css"],
        "tailwind.config.ts":    ["tailwind", "css"],
        "svelte.config.js":      ["svelte"],
        "vue.config.js":         ["vue"],
        "angular.json":          ["angular"],
        "requirements.txt":      ["python"],
        "pyproject.toml":        ["python"],
        "Pipfile":               ["python"],
        "Cargo.toml":            ["rust"],
        "go.mod":                ["golang"],
        "pom.xml":               ["java", "maven"],
        "build.gradle":          ["java", "gradle"],
        "Dockerfile":            ["docker"],
        "docker-compose.yml":    ["docker", "devops"],
        "docker-compose.yaml":   ["docker", "devops"],
        ".github/workflows":     ["github-actions", "ci-cd"],
        "terraform.tf":          ["terraform", "infrastructure"],
        "serverless.yml":        ["serverless", "aws"],
        "vercel.json":           ["vercel"],
        "netlify.toml":          ["netlify"],
        "supabase/config.toml":  ["supabase", "postgres"],
        "prisma/schema.prisma":  ["prisma", "database"],
        "drizzle.config.ts":     ["drizzle", "database"],
        ".env.example":          ["dotenv"],
        "jest.config.js":        ["jest", "testing"],
        "vitest.config.ts":      ["vitest", "testing"],
        "playwright.config.ts":  ["playwright", "testing"],
        "cypress.config.js":     ["cypress", "testing"],
    }

    for filename, signals in file_signals.items():
        full_path = project_path / filename
        if full_path.exists():
            ctx["files_found"].append(filename)
            for s in signals:
                ctx["frameworks"].add(s)

    # Lê package.json para deps extras
    pkg_path = project_path / "package.json"
    if pkg_path.exists():
        try:
            pkg = json.loads(pkg_path.read_text(encoding="utf-8"))
            all_deps = {
                **pkg.get("dependencies", {}),
                **pkg.get("devDependencies", {}),
            }
            dep_signals = {
                "react":         ["react"],
                "vue":           ["vue"],
                "svelte":        ["svelte"],
                "@angular/core": ["angular"],
                "express":       ["express", "nodejs"],
                "fastify":       ["fastify", "nodejs"],
                "hono":          ["hono", "cloudflare"],
                "next":          ["nextjs", "react"],
                "nuxt":          ["nuxt", "vue"],
                "remix":         ["remix", "react"],
                "astro":         ["astro"],
                "tailwindcss":   ["tailwind"],
                "drizzle-orm":   ["drizzle", "database"],
                "@prisma/client":["prisma", "database"],
                "stripe":        ["stripe"],
                "openai":        ["openai", "llm"],
                "@anthropic-ai/sdk": ["anthropic", "llm"],
                "langchain":     ["langchain", "llm"],
                "supabase":      ["supabase"],
                "@supabase/supabase-js": ["supabase", "postgres"],
                "playwright":    ["playwright", "testing"],
                "vitest":        ["vitest", "testing"],
                "jest":          ["jest", "testing"],
            }
            for dep, signals in dep_signals.items():
                if dep in all_deps:
                    for s in signals:
                        ctx["frameworks"].add(s)
        except Exception:
            pass

    # Lê pyproject.toml / requirements.txt para stack Python
    req_path = project_path / "requirements.txt"
    if req_path.exists():
        try:
            content = req_path.read_text(encoding="utf-8").lower()
            py_signals = {
                "fastapi":     ["fastapi"],
                "django":      ["django"],
                "flask":       ["flask"],
                "sqlalchemy":  ["sqlalchemy", "database"],
                "celery":      ["celery"],
                "langchain":   ["langchain", "llm"],
                "openai":      ["openai", "llm"],
                "anthropic":   ["anthropic", "llm"],
                "pytest":      ["pytest", "testing"],
            }
            for lib, signals in py_signals.items():
                if lib in content:
                    for s in signals:
                        ctx["frameworks"].add(s)
        except Exception:
            pass

    # Tenta ler CLAUDE.md / README.md para keywords livres
    for hint_file in ["CLAUDE.md", "README.md", ".cursorrules", "GEMINI.md"]:
        hint_path = project_path / hint_file
        if hint_path.exists():
            try:
                text = hint_path.read_text(encoding="utf-8").lower()
                for word in ["security", "saas", "api", "microservices", "ml",
                             "ai", "llm", "rag", "auth", "oauth", "stripe",
                             "analytics", "seo", "marketing"]:
                    if word in text:
                        ctx["keywords"].add(word)
            except Exception:
                pass

    return ctx


# ─── Carregamento do índice de skills ─────────────────────────────────────────

def load_skills_index() -> list[dict]:
    """Carrega o índice de skills. Tenta múltiplas fontes."""
    # 1. Índice gerado pelo script do repo (dentro do VAULT ou SKILLS_DIR)
    candidates = [
        INDEX_FILE,
        VAULT_DIR / "skills_index.json",
        SKILLS_DIR / "skills_index.json",
        VAULT_DIR / "data" / "skills_index.json",
        SKILLS_DIR / "data" / "skills_index.json",
        DATA_CATALOG,
        VAULT_DIR / "data" / "catalog.json",
    ]

    for path in candidates:
        if path.exists():
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
                # O formato pode ser lista direta ou {skills: [...]}
                if isinstance(data, list):
                    print(f"[✓] Índice carregado: {path} ({len(data)} skills)")
                    return data
                elif isinstance(data, dict):
                    for key in ["skills", "items", "catalog"]:
                        if key in data and isinstance(data[key], list):
                            print(f"[✓] Índice carregado: {path} ({len(data[key])} skills)")
                            return data[key]
            except Exception as e:
                print(f"[!] Erro lendo {path}: {e}")

    # 2. Fallback: escaneia as pastas de skills e lê frontmatter dos SKILL.md
    print("[~] Índice não encontrado — escaneando pastas de skills...")
    return scan_skills_from_disk()


def scan_skills_from_disk() -> list[dict]:
    """Lê SKILL.md de cada pasta e extrai name + description do frontmatter YAML."""
    skills = []
    search_dirs = [d for d in [VAULT_DIR / "skills", SKILLS_DIR, SKILLS_DIR / "skills"] if d.exists()]

    for base in search_dirs:
        for skill_dir in sorted(base.iterdir()):
            skill_md = skill_dir / "SKILL.md"
            if not skill_md.exists():
                continue
            try:
                text = skill_md.read_text(encoding="utf-8")
                name = skill_dir.name
                description = ""
                tags = []

                # Extrai frontmatter YAML simples (entre --- ... ---)
                if text.startswith("---"):
                    end = text.find("\n---", 3)
                    if end != -1:
                        fm = text[3:end]
                        for line in fm.splitlines():
                            if line.startswith("description:"):
                                description = line.split(":", 1)[1].strip().strip('"\'')
                            elif line.startswith("name:"):
                                name = line.split(":", 1)[1].strip().strip('"\'')
                            elif line.startswith("tags:"):
                                tags_raw = line.split(":", 1)[1].strip()
                                tags = [t.strip().strip('"\'[]') for t in tags_raw.split(",") if t.strip()]

                skills.append({
                    "id":          skill_dir.name,
                    "name":        name,
                    "description": description,
                    "tags":        tags,
                    "path":        str(skill_dir),
                })
            except Exception:
                pass

    print(f"[✓] Skills escaneadas do disco: {len(skills)}")
    return skills


# ─── Matching de skills ───────────────────────────────────────────────────────

def score_skill(skill: dict, ctx: dict) -> int:
    """Retorna um score de relevância para a skill dado o contexto do projeto."""
    score = 0
    text = f"{skill.get('name','')} {skill.get('description','')} {' '.join(skill.get('tags', []))}".lower()

    all_signals = ctx["frameworks"] | ctx["languages"] | ctx["tools"] | ctx["keywords"]

    for signal in all_signals:
        if signal.lower() in text:
            score += 3

    # Boost para skills essenciais / genéricas (sempre úteis)
    always_useful = [
        "brainstorming", "writing-plans", "doc-coauthoring",
        "lint-and-validate", "test-driven-development", "git",
        "senior-architect", "architecture", "refactoring",
        "error-handling", "performance", "security",
    ]
    if skill.get("id", "") in always_useful:
        score += 2

    return score


def select_skills(skills_index: list[dict], ctx: dict, max_skills: int = 40) -> list[dict]:
    """Seleciona as N skills mais relevantes para o contexto."""
    scored = []
    for skill in skills_index:
        s = score_skill(skill, ctx)
        if s > 0:
            scored.append((s, skill))

    scored.sort(key=lambda x: x[0], reverse=True)
    selected = [s for _, s in scored[:max_skills]]

    print(f"[✓] {len(selected)} skills selecionadas (de {len(skills_index)} no índice)")
    return selected


# ─── Ativação / desativação ────────────────────────────────────────────────────

def find_skill_path(skill: dict) -> Path | None:
    """Encontra o caminho físico da skill no vault ou no repositório clonado."""
    skill_id = skill.get("id", skill.get("name", ""))

    candidates = [
        VAULT_DIR / "skills" / skill_id,
        VAULT_DIR / skill_id,
        SKILLS_DIR / skill_id,
        SKILLS_DIR / "skills" / skill_id,
    ]
    # Se o índice já tem o path
    if "path" in skill:
        candidates.insert(0, Path(skill["path"]))

    for p in candidates:
        if p.exists():
            return p
    return None


def activate_skills(selected: list[dict], dry_run: bool = False):
    """Copia/linka as skills selecionadas para SKILLS_DIR."""
    SKILLS_DIR.mkdir(parents=True, exist_ok=True)

    activated = []
    not_found = []

    for skill in selected:
        skill_id = skill.get("id", skill.get("name", ""))
        dest = SKILLS_DIR / skill_id

        if dest.exists():
            activated.append(skill_id)
            continue

        src = find_skill_path(skill)
        if src is None:
            not_found.append(skill_id)
            continue

        if not dry_run:
            try:
                shutil.copytree(src, dest)
                activated.append(skill_id)
            except Exception as e:
                print(f"  [!] Erro ao ativar {skill_id}: {e}")
        else:
            print(f"  [dry-run] Ativaria: {skill_id}")
            activated.append(skill_id)

    print(f"\n[✓] Skills ativadas: {len(activated)}")
    if not_found:
        print(f"[!] Não encontradas no vault: {', '.join(not_found)}")


def deactivate_all(dry_run: bool = False):
    """Move skills ativas de volta para o vault (preserva metafiles do repo)."""
    if not SKILLS_DIR.exists():
        print("[!] Pasta de skills não encontrada.")
        return

    VAULT_DIR.mkdir(parents=True, exist_ok=True)
    vault_skills = VAULT_DIR / "skills"
    vault_skills.mkdir(parents=True, exist_ok=True)

    # Arquivos/pastas que NÃO são skills (metadados do repositório)
    skip = {".git", "data", "docs", "scripts", "bin", "assets",
            "README.md", "CATALOG.md", "CHANGELOG.md", "CONTRIBUTING.md",
            "LICENSE", "SECURITY.md", "package.json", "package-lock.json",
            "skills_index.json", "release_notes.md", ".gitignore"}

    moved = 0
    for item in SKILLS_DIR.iterdir():
        if item.name in skip:
            continue
        if item.is_dir() and (item / "SKILL.md").exists():
            dest = vault_skills / item.name
            if not dry_run:
                if dest.exists():
                    shutil.rmtree(dest)
                shutil.move(str(item), str(dest))
            moved += 1

    print(f"[✓] {moved} skills movidas para o vault: {vault_skills}")


# ─── Inicialização do vault ────────────────────────────────────────────────────

def init_vault():
    """
    Na primeira execução, move TODAS as skills para o vault
    se SKILLS_DIR tiver o conteúdo do repositório clonado.
    """
    if VAULT_DIR.exists() and any(VAULT_DIR.iterdir()):
        return  # vault já inicializado

    if not SKILLS_DIR.exists():
        print(f"[!] Pasta de skills não encontrada em {SKILLS_DIR}")
        print("    Clone o repositório primeiro:")
        print(f"    git clone https://github.com/SEU-FORK/antigravity-awesome-skills.git {SKILLS_DIR}")
        return

    print("[~] Primeira execução — inicializando vault...")
    VAULT_DIR.mkdir(parents=True, exist_ok=True)

    vault_skills = VAULT_DIR / "skills"
    vault_skills.mkdir(parents=True, exist_ok=True)

    # Copia índice para o vault também
    for idx_file in ["skills_index.json", "data"]:
        src = SKILLS_DIR / idx_file
        if src.exists():
            dest = VAULT_DIR / idx_file
            if src.is_dir():
                if not dest.exists():
                    shutil.copytree(src, dest)
            else:
                shutil.copy2(src, dest)

    # Move as pastas de skills para o vault
    skip = {".git", "data", "docs", "scripts", "bin", "assets",
            "README.md", "CATALOG.md", "CHANGELOG.md", "CONTRIBUTING.md",
            "LICENSE", "SECURITY.md", "package.json", "package-lock.json",
            "skills_index.json", "release_notes.md", ".gitignore"}

    # O repo pode ter as skills diretamente em SKILLS_DIR ou em SKILLS_DIR/skills/
    skill_sources = [SKILLS_DIR]
    if (SKILLS_DIR / "skills").is_dir():
        skill_sources.append(SKILLS_DIR / "skills")

    count = 0
    for source in skill_sources:
        for item in source.iterdir():
            if item.name in skip:
                continue
            if item.is_dir() and (item / "SKILL.md").exists():
                dest = vault_skills / item.name
                if not dest.exists():
                    shutil.copytree(item, dest)
                    shutil.rmtree(item)
                count += 1

    print(f"[✓] Vault inicializado com {count} skills em {VAULT_DIR}")


# ─── CLI ──────────────────────────────────────────────────────────────────────

def list_active():
    if not SKILLS_DIR.exists():
        print("[!] Pasta de skills não encontrada.")
        return
    skills = [d.name for d in SKILLS_DIR.iterdir()
              if d.is_dir() and (d / "SKILL.md").exists()]
    if skills:
        print(f"[✓] {len(skills)} skills ativas:")
        for s in sorted(skills):
            print(f"  • {s}")
    else:
        print("[!] Nenhuma skill ativa no momento.")


def main():
    parser = argparse.ArgumentParser(
        description="Skill Manager — ativa skills inteligentemente baseado no contexto do projeto."
    )
    parser.add_argument("--project", "-p", type=str, default=".",
                        help="Caminho do projeto a analisar (padrão: diretório atual)")
    parser.add_argument("--max", "-n", type=int, default=40,
                        help="Número máximo de skills a ativar (padrão: 40)")
    parser.add_argument("--list", "-l", action="store_true",
                        help="Lista as skills atualmente ativas")
    parser.add_argument("--reset", "-r", action="store_true",
                        help="Move todas as skills de volta ao vault")
    parser.add_argument("--dry-run", action="store_true",
                        help="Mostra o que seria feito, sem executar")
    parser.add_argument("--init", action="store_true",
                        help="Inicializa o vault a partir do repositório clonado")
    args = parser.parse_args()

    print(f"\n{'='*55}")
    print("  Skill Manager — Antigravity / Claude Code")
    print(f"{'='*55}\n")

    if args.init:
        init_vault()
        return

    if args.list:
        list_active()
        return

    if args.reset:
        deactivate_all(dry_run=args.dry_run)
        return

    # Fluxo principal
    init_vault()

    project_path = Path(args.project).resolve()
    print(f"[~] Analisando projeto: {project_path}\n")

    ctx = detect_project_context(project_path)

    print(f"[✓] Sinais detectados:")
    print(f"    Frameworks/Tools : {', '.join(sorted(ctx['frameworks'])) or 'nenhum'}")
    print(f"    Keywords extras  : {', '.join(sorted(ctx['keywords'])) or 'nenhuma'}")
    print(f"    Arquivos chave   : {', '.join(ctx['files_found'][:8]) or 'nenhum'}\n")

    skills_index = load_skills_index()
    if not skills_index:
        print("[!] Índice de skills vazio. Verifique o vault.")
        return

    selected = select_skills(skills_index, ctx, max_skills=args.max)

    if args.dry_run:
        print("\n[dry-run] Skills que seriam ativadas:")
        for s in selected:
            print(f"  • {s.get('id', s.get('name'))} — {s.get('description','')[:70]}")
        return

    # Limpa skills antigas antes de ativar as novas
    deactivate_all()
    activate_skills(selected)

    # Copia skills ativas para pasta SKILLS/ dentro do projeto (referência para o Claude)
    skills_ref_dir = project_path / "SKILLS"
    if skills_ref_dir.exists() or True:
        skills_ref_dir.mkdir(parents=True, exist_ok=True)
        copied = 0
        for skill in selected:
            skill_id = skill.get("id", skill.get("name", ""))
            src = find_skill_path(skill)
            if src and src.exists():
                dest = skills_ref_dir / skill_id
                if not dest.exists():
                    shutil.copytree(src, dest)
                    copied += 1
        if copied > 0:
            print(f"[✓] {copied} skills copiadas para {skills_ref_dir}")

    print(f"\n[✓] Pronto! Skills ajustadas para o projeto em {project_path}")
    print(f"    Vault: {VAULT_DIR}")
    print(f"    Ativas: {SKILLS_DIR}\n")


if __name__ == "__main__":
    main()
