# PowerShell script to fix empty page.tsx files
$emptyFiles = @(
    "c:\Users\nl\ZMS- NEW FRONTEND\ZMS\src\app\address\edit\[id]\page.tsx",
    "c:\Users\nl\ZMS- NEW FRONTEND\ZMS\src\app\branchs\edit\[id]\page.tsx",
    "c:\Users\nl\ZMS- NEW FRONTEND\ZMS\src\app\businessassociate\edit\page.tsx",
    "c:\Users\nl\ZMS- NEW FRONTEND\ZMS\src\app\buyer\edit\[id]\page.tsx",
    "c:\Users\nl\ZMS- NEW FRONTEND\ZMS\src\app\charges\edit\page.tsx",
    "c:\Users\nl\ZMS- NEW FRONTEND\ZMS\src\app\contract\edit\[id]\page.tsx",
    "c:\Users\nl\ZMS- NEW FRONTEND\ZMS\src\app\customer\create\page.tsx",
    "c:\Users\nl\ZMS- NEW FRONTEND\ZMS\src\app\customer\edit\page.tsx",
    "c:\Users\nl\ZMS- NEW FRONTEND\ZMS\src\app\department\edit\[id]\page.tsx",
    "c:\Users\nl\ZMS- NEW FRONTEND\ZMS\src\app\dispatchnote\edit\[id]\page.tsx",
    "c:\Users\nl\ZMS- NEW FRONTEND\ZMS\src\app\employee\edit\[id]\page.tsx",
    "c:\Users\nl\ZMS- NEW FRONTEND\ZMS\src\app\employeemanagement\edit\[id]\page.tsx",
    "c:\Users\nl\ZMS- NEW FRONTEND\ZMS\src\app\gsm\edit\[id]\page.tsx",
    "c:\Users\nl\ZMS- NEW FRONTEND\ZMS\src\app\inspectionnote\edit\[id]\page.tsx",
    "c:\Users\nl\ZMS- NEW FRONTEND\ZMS\src\app\invoice\edit\[id]\page.tsx",
    "c:\Users\nl\ZMS- NEW FRONTEND\ZMS\src\app\munshyana\edit\page.tsx",
    "c:\Users\nl\ZMS- NEW FRONTEND\ZMS\src\app\organization\edit\[id]\page.tsx",
    "c:\Users\nl\ZMS- NEW FRONTEND\ZMS\src\app\party\edit\page.tsx",
    "c:\Users\nl\ZMS- NEW FRONTEND\ZMS\src\app\projecttarget\edit\[id]\page.tsx",
    "c:\Users\nl\ZMS- NEW FRONTEND\ZMS\src\app\salestexes\edit\page.tsx",
    "c:\Users\nl\ZMS- NEW FRONTEND\ZMS\src\app\salestexes\edit\[id]\page.tsx",
    "c:\Users\nl\ZMS- NEW FRONTEND\ZMS\src\app\saller\edit\[id]\page.tsx",
    "c:\Users\nl\ZMS- NEW FRONTEND\ZMS\src\app\supplier\edit\[id]\page.tsx",
    "c:\Users\nl\ZMS- NEW FRONTEND\ZMS\src\app\transporter\edit\[id]\page.tsx",
    "c:\Users\nl\ZMS- NEW FRONTEND\ZMS\src\app\transportercompany\edit\[id]\page.tsx",
    "c:\Users\nl\ZMS- NEW FRONTEND\ZMS\src\app\vehicletype\edit\[id]\page.tsx",
    "c:\Users\nl\ZMS- NEW FRONTEND\ZMS\src\app\vendor\edit\[id]\page.tsx"
)

foreach ($file in $emptyFiles) {
    # Extract the page name from the path
    $pathParts = $file -split '\\'
    $appIndex = [array]::IndexOf($pathParts, 'app')
    $pageName = ($pathParts[($appIndex + 1)..($pathParts.Length - 2)] -join ' ').Replace('[id]', 'ID')
    $componentName = ($pageName -replace '\s', '') + 'Page'
    
    $content = @"
import React from 'react';

export default function $componentName() {
  return (
    <div>
      <h1>$pageName Page</h1>
      <p>This page is under construction.</p>
    </div>
  );
}
"@
    
    Set-Content -Path $file -Value $content -Encoding UTF8
    Write-Host "Fixed: $file"
}

Write-Host "All empty page files have been fixed!"