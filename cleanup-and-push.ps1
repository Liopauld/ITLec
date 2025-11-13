# ITPathfinder - Git Cleanup and Push Script
# This script removes node_modules and .next from Git tracking and pushes to GitHub

Write-Host "🧹 Cleaning up Git repository..." -ForegroundColor Cyan

# Step 1: Remove node_modules from Git
Write-Host "`n1️⃣ Removing node_modules from Git tracking..." -ForegroundColor Yellow
git rm -r --cached node_modules -ErrorAction SilentlyContinue
git rm -r --cached apps/web/node_modules -ErrorAction SilentlyContinue
git rm -r --cached apps/api/node_modules -ErrorAction SilentlyContinue
git rm -r --cached packages/db/node_modules -ErrorAction SilentlyContinue

# Step 2: Remove .next build folders from Git
Write-Host "`n2️⃣ Removing .next build folders from Git tracking..." -ForegroundColor Yellow
git rm -r --cached .next -ErrorAction SilentlyContinue
git rm -r --cached apps/web/.next -ErrorAction SilentlyContinue
git rm -r --cached apps/api/.next -ErrorAction SilentlyContinue

# Step 3: Remove other build artifacts
Write-Host "`n3️⃣ Removing other build artifacts from Git tracking..." -ForegroundColor Yellow
git rm -r --cached dist -ErrorAction SilentlyContinue
git rm -r --cached build -ErrorAction SilentlyContinue
git rm -r --cached out -ErrorAction SilentlyContinue

# Step 4: Verify what's being tracked
Write-Host "`n4️⃣ Verifying removed files..." -ForegroundColor Yellow
$nodeModulesFiles = git ls-files | Select-String "node_modules"
$nextFiles = git ls-files | Select-String "\.next"

if ($nodeModulesFiles) {
    Write-Host "⚠️  Warning: Still found node_modules files:" -ForegroundColor Red
    $nodeModulesFiles | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
} else {
    Write-Host "✅ No node_modules files found in Git" -ForegroundColor Green
}

if ($nextFiles) {
    Write-Host "⚠️  Warning: Still found .next files:" -ForegroundColor Red
    $nextFiles | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
} else {
    Write-Host "✅ No .next files found in Git" -ForegroundColor Green
}

# Step 5: Check repository size
Write-Host "`n5️⃣ Checking repository size..." -ForegroundColor Yellow
$files = git ls-files
$totalSize = ($files | ForEach-Object { 
    if (Test-Path $_) { (Get-Item $_).Length } 
} | Measure-Object -Sum).Sum / 1MB
Write-Host "📦 Repository size: $([math]::Round($totalSize, 2)) MB" -ForegroundColor Cyan

if ($totalSize -gt 50) {
    Write-Host "⚠️  Warning: Repository is larger than 50 MB" -ForegroundColor Red
} else {
    Write-Host "✅ Repository size is acceptable" -ForegroundColor Green
}

# Step 6: Commit changes
Write-Host "`n6️⃣ Committing changes..." -ForegroundColor Yellow
git add .gitignore
git commit -m "Remove node_modules and build artifacts from repository"

# Step 7: Ask before pushing
Write-Host "`n7️⃣ Ready to push to GitHub" -ForegroundColor Yellow
$confirmation = Read-Host "Do you want to push to origin main? (y/n)"

if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
    Write-Host "`n🚀 Pushing to GitHub..." -ForegroundColor Cyan
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Successfully pushed to GitHub!" -ForegroundColor Green
        Write-Host "🔗 Check your repository at: https://github.com/Liopauld/ITLec" -ForegroundColor Cyan
    } else {
        Write-Host "`n❌ Push failed. Try force push? (y/n)" -ForegroundColor Red
        $forcePush = Read-Host
        if ($forcePush -eq 'y' -or $forcePush -eq 'Y') {
            git push -f origin main
        }
    }
} else {
    Write-Host "`n⏭️  Skipping push. You can manually push with: git push origin main" -ForegroundColor Yellow
}

Write-Host "`n✨ Cleanup complete!" -ForegroundColor Green
