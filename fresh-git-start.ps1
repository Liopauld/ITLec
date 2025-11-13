# ITPathfinder - Fresh Git Start Script
# This script completely resets Git history and pushes clean to GitHub

Write-Host "🔄 Starting fresh Git initialization..." -ForegroundColor Cyan
Write-Host "⚠️  WARNING: This will delete all Git history and create a new repository" -ForegroundColor Red

$confirmation = Read-Host "`nAre you sure you want to continue? (y/n)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "❌ Cancelled." -ForegroundColor Yellow
    exit
}

# Step 1: Backup .env
Write-Host "`n1️⃣ Backing up .env file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Copy-Item .env .env.backup
    Write-Host "✅ .env backed up to .env.backup" -ForegroundColor Green
}

# Step 2: Delete Git history
Write-Host "`n2️⃣ Deleting Git history..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .git -ErrorAction SilentlyContinue
Write-Host "✅ Git history deleted" -ForegroundColor Green

# Step 3: Clean build artifacts
Write-Host "`n3️⃣ Cleaning build artifacts..." -ForegroundColor Yellow
Remove-Item -Recurse -Force apps/web/.next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force apps/api/.next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force build -ErrorAction SilentlyContinue
Write-Host "✅ Build artifacts cleaned" -ForegroundColor Green

# Step 4: Initialize new repository
Write-Host "`n4️⃣ Initializing new Git repository..." -ForegroundColor Yellow
git init
Write-Host "✅ Git initialized" -ForegroundColor Green

# Step 5: Verify .gitignore
Write-Host "`n5️⃣ Verifying .gitignore..." -ForegroundColor Yellow
$hasNodeModules = Get-Content .gitignore | Select-String "node_modules"
$hasNext = Get-Content .gitignore | Select-String "\.next"
if ($hasNodeModules -and $hasNext) {
    Write-Host "✅ .gitignore is properly configured" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: .gitignore might need updating" -ForegroundColor Yellow
}

# Step 6: Add all files
Write-Host "`n6️⃣ Adding files to Git..." -ForegroundColor Yellow
git add .
Write-Host "✅ Files added" -ForegroundColor Green

# Step 7: Verify what's staged
Write-Host "`n7️⃣ Verifying staged files..." -ForegroundColor Yellow
$stagedNodeModules = git ls-files | Select-String "node_modules"
$stagedNext = git ls-files | Select-String "\.next"
$stagedEnv = git ls-files | Select-String "^\.env$"

if ($stagedNodeModules) {
    Write-Host "❌ ERROR: node_modules found in staged files!" -ForegroundColor Red
    Write-Host "Run: git rm -r --cached node_modules" -ForegroundColor Yellow
    exit
}

if ($stagedNext) {
    Write-Host "❌ ERROR: .next files found in staged files!" -ForegroundColor Red
    Write-Host "Run: git rm -r --cached .next" -ForegroundColor Yellow
    exit
}

if ($stagedEnv) {
    Write-Host "❌ ERROR: .env file found in staged files!" -ForegroundColor Red
    Write-Host "Run: git rm --cached .env" -ForegroundColor Yellow
    exit
}

Write-Host "✅ No problematic files found" -ForegroundColor Green

# Step 8: Check size
Write-Host "`n8️⃣ Checking repository size..." -ForegroundColor Yellow
$files = git ls-files
$totalSize = ($files | ForEach-Object { 
    if (Test-Path $_) { (Get-Item $_).Length } 
} | Measure-Object -Sum).Sum / 1MB
Write-Host "📦 Repository size: $([math]::Round($totalSize, 2)) MB" -ForegroundColor Cyan

if ($totalSize -gt 100) {
    Write-Host "❌ ERROR: Repository is too large (>100 MB)" -ForegroundColor Red
    exit
}

# Step 9: Commit
Write-Host "`n9️⃣ Creating initial commit..." -ForegroundColor Yellow
git commit -m "Initial commit: ITPathfinder v1.0 - AI-powered IT career learning platform"
Write-Host "✅ Commit created" -ForegroundColor Green

# Step 10: Add remote
Write-Host "`n🔟 Adding remote origin..." -ForegroundColor Yellow
git remote add origin https://github.com/Liopauld/ITLec.git 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Remote already exists, skipping..." -ForegroundColor Yellow
} else {
    Write-Host "✅ Remote added" -ForegroundColor Green
}

# Step 11: Force push
Write-Host "`n1️⃣1️⃣ Ready to force push to GitHub..." -ForegroundColor Yellow
Write-Host "⚠️  This will OVERWRITE everything on GitHub!" -ForegroundColor Red
$pushConfirmation = Read-Host "Continue? (y/n)"

if ($pushConfirmation -eq 'y' -or $pushConfirmation -eq 'Y') {
    Write-Host "`n🚀 Pushing to GitHub..." -ForegroundColor Cyan
    git push -f -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Successfully pushed to GitHub!" -ForegroundColor Green
        Write-Host "🔗 Check your repository at: https://github.com/Liopauld/ITLec" -ForegroundColor Cyan
        Write-Host "`n📋 Next steps:" -ForegroundColor Yellow
        Write-Host "1. Verify no node_modules or .next folders on GitHub" -ForegroundColor White
        Write-Host "2. Verify .env file is NOT on GitHub" -ForegroundColor White
        Write-Host "3. Check repository size is < 50 MB" -ForegroundColor White
    } else {
        Write-Host "`n❌ Push failed!" -ForegroundColor Red
        Write-Host "Check the error message above" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n⏭️  Skipping push. You can manually push with:" -ForegroundColor Yellow
    Write-Host "git push -f -u origin main" -ForegroundColor Cyan
}

Write-Host "`n✨ Process complete!" -ForegroundColor Green
