param(
    [string]$CasesRoot = (Join-Path $PSScriptRoot "..\cases"),
    [string]$Model = 'gpt-5.6-sol',
    [string[]]$CaseId,
    [string]$OutputPrefix = 'natural-baseline'
)

$ErrorActionPreference = 'Stop'
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("hachi-writing-natural-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tempRoot | Out-Null

try {
    $prompts = Get-ChildItem $CasesRoot -Recurse -Filter 'natural-prompt.*.md' | Where-Object {
        -not $CaseId -or $_.Directory.Name -in $CaseId
    } | Sort-Object FullName
    $index = 0
    foreach ($prompt in $prompts) {
        $index++
        $language = if ($prompt.Name -eq 'natural-prompt.ja.md') { 'ja' } else { 'en' }
        $output = Join-Path $prompt.Directory.FullName "$OutputPrefix.$language.md"
        $work = Join-Path $tempRoot ("run-{0:D2}" -f $index)
        $capture = Join-Path $tempRoot ("output-{0:D2}.md" -f $index)
        New-Item -ItemType Directory -Path $work | Out-Null
        Write-Host ("[{0}/{1}] {2} ({3})" -f $index, $prompts.Count, $prompt.Directory.Name, $language)

        Get-Content -Raw $prompt.FullName | codex exec `
            --ephemeral --ignore-user-config --ignore-rules `
            --skip-git-repo-check --sandbox read-only `
            --model $Model `
            -c 'model_reasoning_effort="high"' `
            -c 'personality="pragmatic"' `
            --cd $work `
            --output-last-message $capture - | Out-Null

        if ($LASTEXITCODE -ne 0 -or -not (Test-Path $capture)) {
            throw "Generation failed for $($prompt.FullName)"
        }
        Copy-Item $capture $output
    }
}
finally {
    if (Test-Path $tempRoot) { Remove-Item -LiteralPath $tempRoot -Recurse -Force }
}
