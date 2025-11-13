# 🚀 Fix Git and Push to GitHub - Step by Step

## Option 1: Quick Fix (Try This First)

Run these commands in PowerShell:

```powershell
# Remove node_modules and .next from Git
git rm -r --cached node_modules
git rm -r --cached apps/web/node_modules
git rm -r --cached apps/api/node_modules
git rm -r --cached packages/db/node_modules
git rm -r --cached apps/web/.next
git rm -r --cached apps/api/.next

# Commit removal
git commit -m "Remove node_modules and build artifacts"

# Verify they're gone
git ls-files | Select-String "node_modules"
git ls-files | Select-String "\.next"
# Both should return NOTHING

# Push to GitHub
git push origin main
```

## Option 2: Use Automated Script

Run the cleanup script:

```powershell
# Make sure you're in the project directory
cd C:\Users\DELL\Desktop\itelec

# Run the cleanup script
.\cleanup-and-push.ps1
```

## Option 3: Fresh Start (Recommended if above fails)

Run the fresh start script:

```powershell
# Make sure you're in the project directory
cd C:\Users\DELL\Desktop\itelec

# Run the fresh start script
.\fresh-git-start.ps1
```

## Manual Fresh Start Steps

If scripts don't work:

```powershell
# 1. Delete Git history
Remove-Item -Recurse -Force .git

# 2. Clean build artifacts
Remove-Item -Recurse -Force apps/web/.next
Remove-Item -Recurse -Force apps/api/.next

# 3. Initialize Git
git init

# 4. Add files
git add .

# 5. Verify (should return NOTHING)
git ls-files | Select-String "node_modules"
git ls-files | Select-String "\.next"

# 6. Commit
git commit -m "Initial commit: ITPathfinder v1.0"

# 7. Add remote
git remote add origin https://github.com/Liopauld/ITLec.git

# 8. Force push
git push -f -u origin main
```

## ✅ Verify Success

After pushing, check on GitHub:
- https://github.com/Liopauld/ITLec

Make sure:
- ✅ No `node_modules` folders visible
- ✅ No `.next` folders visible  
- ✅ No `.env` file visible
- ✅ Repository size < 100 MB
- ✅ Can see `apps/`, `packages/` folders

## 🆘 Still Having Issues?

If you still get errors about large files:

1. Check what's being tracked:
   ```powershell
   git ls-files | ForEach-Object { 
       $size = (Get-Item $_).Length / 1MB
       if ($size -gt 10) {
           Write-Host "$_ : $([math]::Round($size, 2)) MB"
       }
   }
   ```

2. Remove the large file:
   ```powershell
   git rm --cached path/to/large/file
   ```

3. Commit and push again
