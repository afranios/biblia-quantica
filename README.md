# Bíblia Quântica

Guia interativo de computação quântica, do zero ao negócio, com uma área restrita cifrada.

## Estrutura

- `src/` capítulos (um arquivo HTML por capítulo) e `src/assets/` (CSS e JS compartilhados)
- `data/news.json` notícias e casos exibidos no capítulo 09 (atualizado semanalmente por rotina automática)
- `data/changelog.json` registro de atualizações exibido no capítulo 09
- `data/restrito.site.enc.json` e `data/restrito.single.enc.json` capítulo restrito cifrado (AES-GCM, chave derivada do código de acesso por PBKDF2)
- `tools/build.js` gera `dist/site/` (site multipágina, publicado no GitHub Pages) e `dist/single/index.html` (arquivo único)
- `tools/validate-news.js` valida `data/news.json`

O arquivo-fonte do capítulo restrito (`src/restrito.html`) não é versionado. Para alterá-lo e recifrar:

```
RESTRICTED_CODE="o código" node tools/build.js
```

Isso regrava os dois blobs em `data/`. Sem a variável, o build reutiliza os blobs existentes.

## Publicação

Cada push em `main` roda `.github/workflows/pages.yml`, que valida as notícias, executa o build e publica `dist/site` no GitHub Pages. Em Settings > Pages, selecione "GitHub Actions" como origem.

## Notícias

Cada item de `data/news.json` tem: `d` (data por extenso, ex. "15 out 2026"), `y` (ano), `t` (título), `w` (o que muda), `n` (o que não foi provado), `tags` (subconjunto de hw, adv, crypto, biz, br, money), `s` (nome da fonte), `u` (URL da fonte primária). Itens novos entram no início do array.
