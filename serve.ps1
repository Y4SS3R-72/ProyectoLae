# Simple static file server using HttpListener (synchronous request handling)
param(
    [int]$Port = 8000
)

$prefix = "http://localhost:$Port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

Write-Output "Starting simple server at $prefix"
$listener.Start()

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $req = $context.Request
        $resp = $context.Response
        $localPath = $req.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($localPath)) { $localPath = 'index.html' }
        $root = (Get-Location).Path
        $file = Join-Path $root $localPath

        if (-not (Test-Path $file) -or (Get-Item $file).PSIsContainer) {
            $resp.StatusCode = 404
            $buffer = [Text.Encoding]::UTF8.GetBytes('404 Not Found')
            $resp.OutputStream.Write($buffer,0,$buffer.Length)
            $resp.Close()
            continue
        }

        $ext = [IO.Path]::GetExtension($file).ToLower()
        switch ($ext) {
            '.html' { $type = 'text/html' }
            '.css'  { $type = 'text/css' }
            '.js'   { $type = 'application/javascript' }
            '.png'  { $type = 'image/png' }
            '.jpg'  { $type = 'image/jpeg' }
            '.jpeg' { $type = 'image/jpeg' }
            '.svg'  { $type = 'image/svg+xml' }
            '.gif'  { $type = 'image/gif' }
            default { $type = 'application/octet-stream' }
        }

        try {
            $bytes = [System.IO.File]::ReadAllBytes($file)
            $resp.ContentLength64 = $bytes.Length
            $resp.ContentType = $type
            $resp.OutputStream.Write($bytes,0,$bytes.Length)
        }
        catch {
            $resp.StatusCode = 500
            $msg = "500 Internal Server Error"
            $b = [Text.Encoding]::UTF8.GetBytes($msg)
            $resp.OutputStream.Write($b,0,$b.Length)
        }
        finally { $resp.Close() }
    }
}
finally {
    $listener.Stop()
    $listener.Close()
}
