# integrar-trilha.ps1
# Rode na RAIZ do repositorio bazilar, na branch feat/trilha-integrada.
#
#   git checkout -b feat/trilha-integrada
#   .\integrar-trilha.ps1
#   npm run build
#   npm run preview      -> abrir http://localhost:4173/trilha/
#
# O script NAO commita. Revise com 'git diff' antes.

$ErrorActionPreference = "Stop"

if (-not (Test-Path "vite.config.js") -or -not (Test-Path "trilha")) {
    Write-Error "Rode na raiz do repo bazilar (precisa existir vite.config.js e a pasta trilha/)."
    exit 1
}

$enc = New-Object System.Text.UTF8Encoding $false

function Read-Text($p)  { [System.IO.File]::ReadAllText((Resolve-Path $p), $enc) }
function Write-Text($p, $t) { [System.IO.File]::WriteAllText((Join-Path (Get-Location) $p), $t, $enc) }

# ───────────────────────────────────────────────────────────────
# 1. trilha/public/main.css  ->  trilha/trilha.css
# ───────────────────────────────────────────────────────────────
Write-Host "`n[1] Movendo a folha de estilo da trilha..." -ForegroundColor Cyan

if (Test-Path "trilha/public/main.css") {
    git mv "trilha/public/main.css" "trilha/trilha.css"
    Write-Host "    trilha/public/main.css -> trilha/trilha.css" -ForegroundColor Green
} else {
    Write-Host "    ja movido, seguindo." -ForegroundColor DarkGray
}

# ───────────────────────────────────────────────────────────────
# 2. Aliases inexistentes -> nomes canonicos
#    Mapeamento extraido dos comentarios do proprio src/styles/tokens.css.
#    Nenhum valor inventado.
# ───────────────────────────────────────────────────────────────
$aliases = [ordered]@{
    'var(--sp)' = 'var(--color-bg)'
    'var(--sc)' = 'var(--color-surface)'
    'var(--si)' = 'var(--color-subtle)'
    'var(--ip)' = 'var(--color-text)'
    'var(--is)' = 'var(--color-text-secondary)'
    'var(--im)' = 'var(--color-text-muted)'
    'var(--id)' = 'var(--color-text-dim)'
    'var(--gl)' = 'var(--color-gold-light)'
    'var(--gs)' = 'var(--color-gold-bg)'
    'var(--gb)' = 'var(--color-gold-border)'
}

# ───────────────────────────────────────────────────────────────
# 3. Reescrita dos <head> e dos aliases em cada HTML
# ───────────────────────────────────────────────────────────────
Write-Host "`n[2] Ajustando HTMLs..." -ForegroundColor Cyan

$jsdelivr = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ShimaArtBr/bazilar@main/src/styles/tokens.css">'

$arquivos = Get-ChildItem -Path "trilha" -Filter *.html -Recurse
$n = 0

foreach ($arq in $arquivos) {
    $rel = $arq.FullName.Substring((Get-Location).Path.Length + 1)
    $txt = [System.IO.File]::ReadAllText($arq.FullName, $enc)
    $orig = $txt

    # profundidade: trilha/x.html -> ".."   |   trilha/interativos/x.html -> "../.."
    $dentroInterativos = $rel -match 'interativos'
    $upTokens = if ($dentroInterativos) { '../../src/styles/tokens.css' } else { '../src/styles/tokens.css' }
    $upCss    = if ($dentroInterativos) { '../trilha.css' }              else { './trilha.css' }

    $linkTokens = "<link rel=""stylesheet"" href=""$upTokens"">"
    $linkCss    = "<link rel=""stylesheet"" href=""$upCss"">"

    # 3a. remove o link jsDelivr (index.html)
    $txt = $txt.Replace($jsdelivr + "`n", "")
    $txt = $txt.Replace($jsdelivr, "")

    # 3b. troca a folha da trilha e injeta tokens ANTES dela
    $txt = $txt.Replace('<link rel="stylesheet" href="/public/main.css">', "$linkTokens`n$linkCss")

    # 3c. aliases -> canonicos
    foreach ($k in $aliases.Keys) { $txt = $txt.Replace($k, $aliases[$k]) }

    if ($txt -ne $orig) {
        [System.IO.File]::WriteAllText($arq.FullName, $txt, $enc)
        Write-Host "    $rel" -ForegroundColor Green
        $n++
    } else {
        Write-Host "    $rel (sem mudanca)" -ForegroundColor DarkGray
    }
}

# ───────────────────────────────────────────────────────────────
# 4. trilha.css tambem usa aliases? normaliza por seguranca
# ───────────────────────────────────────────────────────────────
if (Test-Path "trilha/trilha.css") {
    $css = Read-Text "trilha/trilha.css"
    $o = $css
    foreach ($k in $aliases.Keys) { $css = $css.Replace($k, $aliases[$k]) }
    if ($css -ne $o) { Write-Text "trilha/trilha.css" $css; Write-Host "    trilha/trilha.css" -ForegroundColor Green }
}

# ───────────────────────────────────────────────────────────────
# 5. vercel.json orfao
# ───────────────────────────────────────────────────────────────
Write-Host "`n[3] Limpando arquivos orfaos..." -ForegroundColor Cyan
if (Test-Path "trilha/vercel.json") {
    git rm "trilha/vercel.json" | Out-Null
    Write-Host "    removido trilha/vercel.json" -ForegroundColor Green
}

# ───────────────────────────────────────────────────────────────
# 6. Entradas do Vite
# ───────────────────────────────────────────────────────────────
Write-Host "`n[4] Gerando bloco de entradas para vite.config.js..." -ForegroundColor Cyan

$linhas = @()
$linhas += "        main:  resolve(__dirname, 'index.html'),"
$linhas += "        apoie: resolve(__dirname, 'apoie.html'),"
$linhas += "        trilha: resolve(__dirname, 'trilha/index.html'),"

Get-ChildItem "trilha" -Filter "level-*.html" | Sort-Object Name | ForEach-Object {
    $k = "trilha_" + ($_.BaseName -replace '-', '')
    $linhas += "        ${k}: resolve(__dirname, 'trilha/$($_.Name)'),"
}
if (Test-Path "trilha/interativos") {
    Get-ChildItem "trilha/interativos" -Filter "*.html" | Sort-Object Name | ForEach-Object {
        $k = "trilha_int_" + ($_.BaseName -replace '-', '')
        $linhas += "        ${k}: resolve(__dirname, 'trilha/interativos/$($_.Name)'),"
    }
}

$bloco = $linhas -join "`n"
Write-Text "VITE_ENTRIES.txt" $bloco

Write-Host "    escrito em VITE_ENTRIES.txt" -ForegroundColor Green
Write-Host ""
Write-Host "  >>> Abra vite.config.js e substitua o conteudo de rollupOptions.input" -ForegroundColor Yellow
Write-Host "      pelo conteudo de VITE_ENTRIES.txt. Depois apague VITE_ENTRIES.txt." -ForegroundColor Yellow
Write-Host ""
Write-Host "[ok] $n HTML(s) alterados. Rode:  npm run build  &&  npm run preview" -ForegroundColor Cyan
