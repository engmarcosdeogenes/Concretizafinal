claude --dangerously-skip-permissions \
        --model claude-opus-4-6 \
        -p "URGENTE: Você está em um loop e dizendo que tudo está pronto, mas eu vejo itens com ❌ no plano.md. 
        1. Abra o plano.md e procure LITERALMENTE pelo caractere '❌'. 
        2. Se encontrar, escolha UM, implemente o código REAL, teste e só depois mude para ✅. 
        3. Se você disser que não há itens com ❌ e eu encontrar um, você falhou na tarefa. 
        4. Escreva no progress.txt o NOME EXATO do item que você trabalhou."