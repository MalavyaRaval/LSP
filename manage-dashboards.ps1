param(
    [ValidateSet("import","backup","start","stop","restart","status")]
    [string]$Action = "status",
    [string]$GrafanaUrl = "http://localhost:3000",
    [string]$GrafanaUser = "admin",
    [string]$GrafanaPassword = "admin"
)

$dashboards = @(
    @{ name = "Performance Dashboard"; file = "performance-dashboard.json"; uid = "lsp-performance" },
    @{ name = "System Metrics Dashboard"; file = "system-metrics-dashboard.json"; uid = "lsp-system" },
    @{ name = "Analytics Dashboard"; file = "analytics-dashboard.json"; uid = "lsp-analytics" }
)

function Import-Dashboard {
    param([string]$FilePath,[string]$DashboardName)
    Write-Host "Importing: $DashboardName..." -ForegroundColor Cyan
    try {
        $dashboardJson = Get-Content $FilePath -Raw | ConvertFrom-Json
        $body = @{ dashboard = $dashboardJson; overwrite = $true } | ConvertTo-Json -Depth 10
        $auth = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("${GrafanaUser}:${GrafanaPassword}"))
        $response = Invoke-RestMethod -Uri "$GrafanaUrl/api/dashboards/db" -Method POST -Headers @{ Authorization = "Basic $auth" } -ContentType "application/json" -Body $body
        Write-Host "  OK" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "  ERROR: $_" -ForegroundColor Red
        return $false
    }
}

function Backup-Dashboards {
    Write-Host "Backing up dashboards..." -ForegroundColor Cyan
    $backupDir = "grafana-backups\$(Get-Date -Format 'yyyy-MM-dd_HHmmss')"
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    try {
        $auth = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("${GrafanaUser}:${GrafanaPassword}"))
        foreach ($dashboard in $dashboards) {
            try {
                $response = Invoke-RestMethod -Uri "$GrafanaUrl/api/dashboards/uid/$($dashboard.uid)" -Method GET -Headers @{ Authorization = "Basic $auth" }
                $response.dashboard | ConvertTo-Json -Depth 10 | Out-File "$backupDir/$($dashboard.file)" -Encoding UTF8
                Write-Host "  OK: $($dashboard.name)" -ForegroundColor Green
            } catch {
                Write-Host "  ERROR: $($dashboard.name): $_" -ForegroundColor Red
            }
        }
        Write-Host "Saved to: $backupDir" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: $_" -ForegroundColor Red
    }
}

function Start-Stack {
    Write-Host "Starting stack..." -ForegroundColor Cyan
    try {
        docker-compose up -d
        Write-Host "OK" -ForegroundColor Green
        Write-Host "Grafana: $GrafanaUrl" -ForegroundColor Cyan
    } catch {
        Write-Host "ERROR: $_" -ForegroundColor Red
    }
}

function Stop-Stack {
    Write-Host "Stopping stack..." -ForegroundColor Cyan
    try {
        docker-compose down
        Write-Host "OK" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: $_" -ForegroundColor Red
    }
}

function Restart-Stack {
    Stop-Stack
    Start-Stack
}

function Show-Status {
    Write-Host "Stack status:" -ForegroundColor Cyan
    try {
        docker-compose ps
    } catch {
        Write-Host "ERROR: $_" -ForegroundColor Red
    }
}

if ($Action -eq "import") {
    Write-Host ""
    Write-Host "=== Dashboard Status Checker ===" -ForegroundColor Magenta
    Write-Host "URL: $GrafanaUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Note: Dashboards auto-provision on startup." -ForegroundColor Gray
    Write-Host ""
    try {
        $auth = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("${GrafanaUser}:${GrafanaPassword}"))
        $test = Invoke-RestMethod -Uri "$GrafanaUrl/api/health" -Method GET -Headers @{ Authorization = "Basic $auth" }
        Write-Host "Connected: YES" -ForegroundColor Green
        Write-Host ""
        $successCount = 0
        foreach ($dashboard in $dashboards) {
            $filePath = "grafana-dashboards\$($dashboard.file)"
            if (Test-Path $filePath) {
                $dashboardJson = Get-Content $filePath -Raw | ConvertFrom-Json
                $uid = $dashboardJson.uid
                try {
                    $existing = Invoke-RestMethod -Uri "$GrafanaUrl/api/dashboards/uid/$uid" -Method GET -Headers @{ Authorization = "Basic $auth" }
                    Write-Host "[OK] $($dashboard.name) - Provisioned" -ForegroundColor Green
                    $successCount++
                } catch {
                    Write-Host "[!] $($dashboard.name) - Not found" -ForegroundColor Yellow
                    if (Import-Dashboard -FilePath $filePath -DashboardName $dashboard.name) {
                        $successCount++
                    }
                }
            } else {
                Write-Host "[!] File not found: $filePath" -ForegroundColor Red
            }
        }
        Write-Host ""
        Write-Host "Result: $successCount/$($dashboards.Count) dashboards OK" -ForegroundColor Cyan
        Write-Host "Open: $GrafanaUrl" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "ERROR: Connection failed: $_" -ForegroundColor Red
    }
} elseif ($Action -eq "backup") {
    Write-Host ""
    Backup-Dashboards
    Write-Host ""
} elseif ($Action -eq "start") {
    Write-Host ""
    Start-Stack
    Write-Host ""
} elseif ($Action -eq "stop") {
    Write-Host ""
    Stop-Stack
    Write-Host ""
} elseif ($Action -eq "restart") {
    Write-Host ""
    Restart-Stack
    Write-Host ""
} elseif ($Action -eq "status") {
    Write-Host ""
    Show-Status
    Write-Host ""
} else {
    Write-Host ""
    Show-Status
    Write-Host ""
}

Write-Host "Usage:"
Write-Host "  .\manage-dashboards.ps1 -Action import   (verify dashboards)"
Write-Host "  .\manage-dashboards.ps1 -Action backup   (backup dashboards)"
Write-Host "  .\manage-dashboards.ps1 -Action start    (start stack)"
Write-Host "  .\manage-dashboards.ps1 -Action stop     (stop stack)"
Write-Host "  .\manage-dashboards.ps1 -Action restart  (restart stack)"
Write-Host "  .\manage-dashboards.ps1 -Action status   (check status)"
Write-Host ""
